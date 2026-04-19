importScripts('https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js');

const WORKER_VERSION = 'nc-worker-debug-f32in-f16out-v2';

const N_FFT = 512;
const HOP_LENGTH = 128;
const TIME_FRAMES = 126;//
const FREQ_BINS = 256;
const REQUIRED_SAMPLES = N_FFT + (TIME_FRAMES - 1) * HOP_LENGTH; // 33152
const NYQUIST_BIN = N_FFT / 2; // 256
const MAX_INFER_QUEUE = 4;

let session = null;
let inputName = null;
let outputName = null;

let processing = false;
const inferQueue = [];
const contextBuffer = new Float32Array(REQUIRED_SAMPLES);

let inferCount = 0;

ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';
ort.env.wasm.numThreads = 1;
ort.env.wasm.simd = true;

function postLog(message, extra = undefined) {
    self.postMessage({
        type: 'log',
        message,
        extra,
    });
}

// -----------------------------------------------------
// Window / FFT
// -----------------------------------------------------

function hannWindow(size) {
    const w = new Float32Array(size);
    for (let i = 0; i < size; i++) {
        w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1));
    }
    return w;
}

const WINDOW = hannWindow(N_FFT);

function fft(re, im, inverse = false) {
    const n = re.length;

    let j = 0;
    for (let i = 1; i < n; i++) {
        let bit = n >> 1;
        while (j & bit) {
            j ^= bit;
            bit >>= 1;
        }
        j ^= bit;

        if (i < j) {
            let tmp = re[i];
            re[i] = re[j];
            re[j] = tmp;

            tmp = im[i];
            im[i] = im[j];
            im[j] = tmp;
        }
    }

    for (let len = 2; len <= n; len <<= 1) {
        const ang = (2 * Math.PI / len) * (inverse ? 1 : -1);
        const wlenCos = Math.cos(ang);
        const wlenSin = Math.sin(ang);

        for (let i = 0; i < n; i += len) {
            let wCos = 1;
            let wSin = 0;

            for (let k = 0; k < len / 2; k++) {
                const uRe = re[i + k];
                const uIm = im[i + k];

                const vRe = re[i + k + len / 2] * wCos - im[i + k + len / 2] * wSin;
                const vIm = re[i + k + len / 2] * wSin + im[i + k + len / 2] * wCos;

                re[i + k] = uRe + vRe;
                im[i + k] = uIm + vIm;
                re[i + k + len / 2] = uRe - vRe;
                im[i + k + len / 2] = uIm - vIm;

                const nextCos = wCos * wlenCos - wSin * wlenSin;
                const nextSin = wCos * wlenSin + wSin * wlenCos;
                wCos = nextCos;
                wSin = nextSin;
            }
        }
    }

    if (inverse) {
        for (let i = 0; i < n; i++) {
            re[i] /= n;
            im[i] /= n;
        }
    }
}

// -----------------------------------------------------
// Float16 decode
// -----------------------------------------------------

function createHalfToFloatTable() {
    const table = new Float32Array(65536);

    for (let i = 0; i < 65536; i++) {
        const s = (i & 0x8000) ? -1 : 1;
        const e = (i >> 10) & 0x1f;
        const f = i & 0x03ff;

        let value;
        if (e === 0) {
            value = f === 0 ? 0 : s * Math.pow(2, -14) * (f / 1024);
        } else if (e === 31) {
            value = f === 0 ? s * Infinity : NaN;
        } else {
            value = s * Math.pow(2, e - 15) * (1 + f / 1024);
        }

        table[i] = value;
    }

    return table;
}

const HALF_TO_FLOAT = createHalfToFloatTable();

function decodeFloat16Array(uint16Array) {
    const out = new Float32Array(uint16Array.length);
    for (let i = 0; i < uint16Array.length; i++) {
        out[i] = HALF_TO_FLOAT[uint16Array[i]];
    }
    return out;
}

// -----------------------------------------------------
// Signal pipeline
// -----------------------------------------------------

function pushChunkIntoContext(chunk) {
    if (chunk.length >= REQUIRED_SAMPLES) {
        contextBuffer.set(chunk.subarray(chunk.length - REQUIRED_SAMPLES));
        return;
    }

    contextBuffer.copyWithin(0, chunk.length);
    contextBuffer.set(chunk, REQUIRED_SAMPLES - chunk.length);
}

function stftComplex(signal) {
    const realFrames = new Array(TIME_FRAMES);
    const imagFrames = new Array(TIME_FRAMES);
    const nyquistReal = new Float32Array(TIME_FRAMES);
    const nyquistImag = new Float32Array(TIME_FRAMES);

    for (let t = 0; t < TIME_FRAMES; t++) {
        const start = t * HOP_LENGTH;

        const re = new Float32Array(N_FFT);
        const im = new Float32Array(N_FFT);

        for (let n = 0; n < N_FFT; n++) {
            re[n] = signal[start + n] * WINDOW[n];
            im[n] = 0;
        }

        fft(re, im, false);

        const realPart = new Float32Array(FREQ_BINS);
        const imagPart = new Float32Array(FREQ_BINS);

        for (let f = 0; f < FREQ_BINS; f++) {
            realPart[f] = re[f];
            imagPart[f] = im[f];
        }

        nyquistReal[t] = re[NYQUIST_BIN];
        nyquistImag[t] = im[NYQUIST_BIN];

        realFrames[t] = realPart;
        imagFrames[t] = imagPart;
    }

    return { realFrames, imagFrames, nyquistReal, nyquistImag };
}

function buildModelInputFloat32(realFrames, imagFrames) {
    const data = new Float32Array(2 * FREQ_BINS * TIME_FRAMES);

    for (let f = 0; f < FREQ_BINS; f++) {
        for (let t = 0; t < TIME_FRAMES; t++) {
            data[(0 * FREQ_BINS + f) * TIME_FRAMES + t] = realFrames[t][f];
            data[(1 * FREQ_BINS + f) * TIME_FRAMES + t] = imagFrames[t][f];
        }
    }

    return data;
}

function getMaskData(outputTensor) {
    const raw = outputTensor.data;

    if (raw instanceof Float32Array) return raw;
    if (raw instanceof Uint16Array) return decodeFloat16Array(raw);

    return new Float32Array(raw);
}

function istftFromComplexMask(realFrames, imagFrames, nyquistReal, nyquistImag, maskData) {
    const output = new Float32Array(REQUIRED_SAMPLES);
    const norm = new Float32Array(REQUIRED_SAMPLES);

    for (let t = 0; t < TIME_FRAMES; t++) {
        const re = new Float32Array(N_FFT);
        const im = new Float32Array(N_FFT);

        for (let f = 0; f < FREQ_BINS; f++) {
            const mr = maskData[(0 * FREQ_BINS + f) * TIME_FRAMES + t];
            const mi = maskData[(1 * FREQ_BINS + f) * TIME_FRAMES + t];

            const xr = realFrames[t][f];
            const xi = imagFrames[t][f];

            re[f] = mr * xr - mi * xi;
            im[f] = mr * xi + mi * xr;
        }

        re[NYQUIST_BIN] = nyquistReal[t];
        im[NYQUIST_BIN] = nyquistImag[t];

        for (let f = 1; f < NYQUIST_BIN; f++) {
            const mirror = N_FFT - f;
            re[mirror] = re[f];
            im[mirror] = -im[f];
        }

        fft(re, im, true);

        const start = t * HOP_LENGTH;
        for (let n = 0; n < N_FFT; n++) {
            const w = WINDOW[n];
            output[start + n] += re[n] * w;
            norm[start + n] += w * w;
        }
    }

    for (let i = 0; i < REQUIRED_SAMPLES; i++) {
        output[i] = norm[i] > 1e-8 ? output[i] / norm[i] : 0;
    }

    return output;
}

// -----------------------------------------------------
// Messaging
// -----------------------------------------------------

self.onmessage = async (event) => {
    const data = event.data;

    if (data?.type === 'init') {
        try {
            postLog(`worker init start: ${WORKER_VERSION}`);

            session = await ort.InferenceSession.create(data.modelBytes, {
                executionProviders: ['wasm'],
            });

            inputName = data.inputName || session.inputNames?.[0] || null;
            outputName = data.outputName || session.outputNames?.[0] || null;

            if (!inputName) throw new Error('No model input name found.');
            if (!outputName) throw new Error('No model output name found.');

            postLog('worker init success', {
                inputNames: session.inputNames,
                outputNames: session.outputNames,
                selectedInputName: inputName,
                selectedOutputName: outputName,
                inputMetadata: session.inputMetadata?.[inputName] || null,
                outputMetadata: session.outputMetadata?.[outputName] || null,
            });

            self.postMessage({
                type: 'ready',
                workerVersion: WORKER_VERSION,
                inputNames: session.inputNames,
                outputNames: session.outputNames,
                selectedInputName: inputName,
                selectedOutputName: outputName,
                inputShape: [1, 2, 256, 256],
                requiredSamples: REQUIRED_SAMPLES,
            });
        } catch (error) {
            self.postMessage({
                type: 'error',
                message: error instanceof Error ? error.message : String(error),
            });
        }

        return;
    }

    if (data?.type === 'infer' && data.samples) {
        const incoming = new Float32Array(data.samples);
        inferQueue.push(incoming);

        if (inferQueue.length > MAX_INFER_QUEUE) {
            inferQueue.splice(0, inferQueue.length - MAX_INFER_QUEUE);
        }

        void pumpQueue();
    }
};

async function pumpQueue() {
    if (processing || inferQueue.length === 0) return;
    processing = true;

    try {
        while (inferQueue.length > 0) {
            const chunk = inferQueue.shift();
            if (!chunk) continue;

            if (!session || !inputName || !outputName) {
                self.postMessage({ type: 'output', samples: chunk.buffer }, [chunk.buffer]);
                continue;
            }

            pushChunkIntoContext(chunk);

            const { realFrames, imagFrames, nyquistReal, nyquistImag } = stftComplex(contextBuffer);
            const modelInput = buildModelInputFloat32(realFrames, imagFrames);

            const inputTensor = new ort.Tensor(
                'float32',
                modelInput,
                [1, 2, FREQ_BINS, TIME_FRAMES]
            );

            let tail = chunk;

            try {
                const result = await session.run({
                    [inputName]: inputTensor,
                });

                const outputTensor = result[outputName];
                if (!outputTensor) {
                    throw new Error(`Model output "${outputName}" not found`);
                }

                const maskData = getMaskData(outputTensor);
                const expectedLength = 2 * FREQ_BINS * TIME_FRAMES;

                if (maskData.length !== expectedLength) {
                    throw new Error(`Unexpected output length: ${maskData.length}, expected ${expectedLength}`);
                }

                const enhanced = istftFromComplexMask(
                    realFrames,
                    imagFrames,
                    nyquistReal,
                    nyquistImag,
                    maskData
                );

                tail = enhanced.slice(REQUIRED_SAMPLES - chunk.length);

                inferCount++;
                if (inferCount <= 3 || inferCount % 20 === 0) {
                    postLog(`inference ok #${inferCount}`, {
                        chunkLength: chunk.length,
                        outputDims: outputTensor.dims,
                        outputType: outputTensor.type,
                    });
                }
            } catch (error) {
                postLog('inference failed, using passthrough chunk', {
                    error: error instanceof Error ? error.message : String(error),
                });
                tail = chunk;
            }

            self.postMessage(
                {
                    type: 'output',
                    samples: tail.buffer,
                },
                [tail.buffer]
            );
        }
    } catch (error) {
        self.postMessage({
            type: 'error',
            message: error instanceof Error ? error.message : String(error),
        });
    } finally {
        processing = false;
        if (inferQueue.length > 0) {
            void pumpQueue();
        }
    }
}