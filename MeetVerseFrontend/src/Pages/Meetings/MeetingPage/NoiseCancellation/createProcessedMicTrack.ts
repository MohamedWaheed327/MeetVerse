import { LocalAudioTrack } from 'livekit-client';

export type ProcessedAudioResources = {
    localAudioTrack: LocalAudioTrack;
    cleanup: () => Promise<void>;
};

export async function createProcessedMicTrack(): Promise<ProcessedAudioResources> {
    console.log('[NC] createProcessedMicTrack start');

    const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
            echoCancellation: true,
            noiseSuppression: false,
            autoGainControl: false,
            channelCount: 1,
            sampleRate: 16000,
        },
        video: false,
    });

    console.log('[NC] mic stream acquired');

    const rawTrack = micStream.getAudioTracks()[0];
    console.log('[NC] raw track settings:', rawTrack.getSettings());

    const audioContext = new AudioContext({ sampleRate: 16000 });

    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    console.log('[NC] audioContext sampleRate:', audioContext.sampleRate);

    await audioContext.audioWorklet.addModule('/noiseCancellationWorklet.js');
    console.log('[NC] worklet loaded');

    const worker = new Worker('/noiseCancellationWorker.js');
    console.log('[NC] worker created');

    const workerReady = new Promise<void>((resolve, reject) => {
        let settled = false;

        const handleMessage = (event: MessageEvent) => {
            const data = event.data;

            if (data?.type === 'log') {
                console.log('[NC][worker]', data.message, data.extra ?? '');
                return;
            }

            if (data?.type === 'ready') {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                worker.removeEventListener('message', handleMessage);
                console.log('[NC] worker ready:', data);
                resolve();
                return;
            }

            if (data?.type === 'error') {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                worker.removeEventListener('message', handleMessage);
                reject(new Error(data.message || 'Worker init failed'));
            }
        };

        const timeout = setTimeout(() => {
            if (settled) return;
            settled = true;
            worker.removeEventListener('message', handleMessage);
            reject(new Error('Timed out waiting for ONNX worker to initialize'));
        }, 15000);

        worker.addEventListener('message', handleMessage);
    });

    const modelResponse = await fetch('/models/NoiseCancellationModel.onnx');
    if (!modelResponse.ok) {
        throw new Error(`Failed to load model: ${modelResponse.status} ${modelResponse.statusText}`);
    }

    const modelBytes = await modelResponse.arrayBuffer();
    console.log('[NC] model loaded, bytes:', modelBytes.byteLength);

    worker.postMessage(
        {
            type: 'init',
            modelBytes,
        },
        [modelBytes]
    );

    await workerReady;

    const source = audioContext.createMediaStreamSource(micStream);

    const processor = new AudioWorkletNode(audioContext, 'noise-cancel-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
        channelCount: 1,
        channelCountMode: 'explicit',
        channelInterpretation: 'speakers',
        processorOptions: {
            frameSize: 1024,
            passthrough: true, // debug mode
        },
    });

    console.log('[NC] processor created');

    const destination = audioContext.createMediaStreamDestination();

    processor.port.onmessage = (event: MessageEvent) => {
        const data = event.data;

        if (data?.type === 'infer' && data.samples) {
            worker.postMessage(
                {
                    type: 'infer',
                    samples: data.samples,
                },
                [data.samples as ArrayBuffer]
            );
            return;
        }

        if (data?.type === 'log') {
            console.log('[NC][worklet]', data.message);
        }
    };

    const onWorkerMessage = (event: MessageEvent) => {
        const data = event.data;

        if (data?.type === 'log') {
            console.log('[NC][worker]', data.message, data.extra ?? '');
            return;
        }

        if (data?.type === 'output' && data.samples) {
            processor.port.postMessage(
                {
                    type: 'output',
                    samples: data.samples,
                },
                [data.samples as ArrayBuffer]
            );
            return;
        }

        if (data?.type === 'error') {
            console.error('[NC] ONNX worker error:', data.message);
        }
    };

    worker.addEventListener('message', onWorkerMessage);

    source.connect(processor);
    processor.connect(destination);

    console.log('[NC] graph connected');

    const processedTrack = destination.stream.getAudioTracks()[0];
    const localAudioTrack = new LocalAudioTrack(processedTrack);

    console.log('[NC] processed track created');

    const cleanup = async () => {
        try {
            processor.port.onmessage = null;
        } catch { }

        try {
            worker.removeEventListener('message', onWorkerMessage);
        } catch { }

        try {
            localAudioTrack.stop();
        } catch { }

        try {
            processedTrack.stop();
        } catch { }

        try {
            rawTrack.stop();
        } catch { }

        try {
            source.disconnect();
            processor.disconnect();
        } catch { }

        try {
            worker.terminate();
        } catch { }

        try {
            await audioContext.close();
        } catch { }
    };

    return {
        localAudioTrack,
        cleanup,
    };
}