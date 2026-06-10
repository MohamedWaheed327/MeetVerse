class NoiseCancelProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();

        this.frameSize = options.processorOptions?.frameSize || 1024;

        this.buffer = new Float32Array(this.frameSize);
        this.index = 0;

        this.outputBuffer = null;
        this.outputIndex = 0;

        this.port.onmessage = (event) => {
            const data = event.data;

            if (data?.type === 'processed') {
                this.outputBuffer = new Float32Array(data.samples);
                this.outputIndex = 0;
            }
        };
    }

    process(inputs, outputs) {
        const input = inputs[0];
        const output = outputs[0];

        if (!input?.[0] || !output?.[0]) return true;

        const inputChannel = input[0];
        const outputChannel = output[0];

        // 1. Fill frame
        for (let i = 0; i < inputChannel.length; i++) {
            this.buffer[this.index++] = inputChannel[i];

            if (this.index === this.frameSize) {
                const copy = new Float32Array(this.buffer);

                this.port.postMessage({
                    type: 'frame',
                    samples: copy.buffer,
                }, [copy.buffer]);

                this.index = 0;
            }
        }

        // 2. Output audio
        for (let i = 0; i < outputChannel.length; i++) {
            if (this.outputBuffer && this.outputIndex < this.outputBuffer.length) {
                outputChannel[i] = this.outputBuffer[this.outputIndex++];
            } else {
                outputChannel[i] = 0; // safe silence (NO raw leak)
            }
        }

        return true;
    }
}

registerProcessor('noise-cancel-processor', NoiseCancelProcessor);