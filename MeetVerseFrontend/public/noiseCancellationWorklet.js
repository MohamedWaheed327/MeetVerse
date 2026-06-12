class NoiseCancelProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();

        this.frameSize = options.processorOptions?.frameSize ?? 1024;

        // Capture buffer
        this.captureBuffer = new Float32Array(this.frameSize);
        this.captureIndex = 0;

        // Playback queue
        this.outputQueue = [];
        this.currentChunk = null;
        this.currentChunkIndex = 0;

        this.port.onmessage = (event) => {
            const data = event.data;

            if (data?.type === 'processed') {
                const chunk = new Float32Array(data.samples);

                // FIFO queue
                this.outputQueue.push(chunk);

                // Prevent runaway memory if something goes wrong
                if (this.outputQueue.length > 50) {
                    this.outputQueue.shift();
                }
            }
        };
    }

    process(inputs, outputs) {
        const input = inputs[0];
        const output = outputs[0];

        if (!input?.[0] || !output?.[0]) {
            return true;
        }

        const inputChannel = input[0];
        const outputChannel = output[0];

        // =========================
        // CAPTURE
        // =========================

        for (let i = 0; i < inputChannel.length; i++) {
            this.captureBuffer[this.captureIndex++] = inputChannel[i];

            if (this.captureIndex >= this.frameSize) {
                const frame = new Float32Array(this.captureBuffer);

                this.port.postMessage(
                    {
                        type: 'frame',
                        samples: frame.buffer,
                    },
                    [frame.buffer]
                );

                this.captureIndex = 0;
            }
        }

        // =========================
        // PLAYBACK
        // =========================

        for (let i = 0; i < outputChannel.length; i++) {

            if (
                this.currentChunk === null ||
                this.currentChunkIndex >= this.currentChunk.length
            ) {
                if (this.outputQueue.length > 0) {
                    this.currentChunk = this.outputQueue.shift();
                    this.currentChunkIndex = 0;
                } else {
                    this.currentChunk = null;
                }
            }

            if (this.currentChunk) {
                outputChannel[i] =
                    this.currentChunk[this.currentChunkIndex++];
            } else {
                outputChannel[i] = 0;
            }
        }

        return true;
    }
}

registerProcessor(
    'noise-cancel-processor',
    NoiseCancelProcessor
);