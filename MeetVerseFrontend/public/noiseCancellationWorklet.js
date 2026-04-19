class NoiseCancelProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();

        const { frameSize = 1024, passthrough = true } = options.processorOptions || {};

        this.frameSize = frameSize;
        this.passthrough = passthrough;

        this.inputFrame = new Float32Array(this.frameSize);
        this.inputIndex = 0;

        this.outputQueue = [];
        this.currentOutput = null;
        this.currentOutputIndex = 0;

        this.sentFrames = 0;
        this.receivedFrames = 0;

        this.port.onmessage = (event) => {
            const data = event.data;

            if (data?.type === 'output' && data.samples) {
                this.outputQueue.push(new Float32Array(data.samples));
                this.receivedFrames++;

                if (this.outputQueue.length > 8) {
                    this.outputQueue.splice(0, this.outputQueue.length - 8);
                }

                if (this.receivedFrames <= 3 || this.receivedFrames % 20 === 0) {
                    this.port.postMessage({
                        type: 'log',
                        message: `worklet received output #${this.receivedFrames}, queue=${this.outputQueue.length}`,
                    });
                }
            }
        };
    }

    process(inputs, outputs) {
        const input = inputs[0];
        const output = outputs[0];

        if (!input?.length || !output?.length) return true;

        const inputChannel = input[0];
        const outputChannel = output[0];

        if (!inputChannel || !outputChannel) return true;

        for (let i = 0; i < inputChannel.length; i++) {
            this.inputFrame[this.inputIndex++] = inputChannel[i];

            if (this.inputIndex === this.frameSize) {
                const frameCopy = new Float32Array(this.inputFrame);

                this.port.postMessage(
                    {
                        type: 'infer',
                        samples: frameCopy.buffer,
                    },
                    [frameCopy.buffer]
                );

                this.sentFrames++;
                if (this.sentFrames <= 3 || this.sentFrames % 20 === 0) {
                    this.port.postMessage({
                        type: 'log',
                        message: `worklet sent frame #${this.sentFrames}`,
                    });
                }

                this.inputIndex = 0;
            }
        }

        for (let i = 0; i < outputChannel.length; i++) {
            if (!this.currentOutput || this.currentOutputIndex >= this.currentOutput.length) {
                this.currentOutput = this.outputQueue.shift() || null;
                this.currentOutputIndex = 0;
            }

            if (this.currentOutput) {
                outputChannel[i] = this.currentOutput[this.currentOutputIndex++];
            } else {
                outputChannel[i] = this.passthrough ? inputChannel[i] : 0;
            }
        }

        return true;
    }
}

registerProcessor('noise-cancel-processor', NoiseCancelProcessor);