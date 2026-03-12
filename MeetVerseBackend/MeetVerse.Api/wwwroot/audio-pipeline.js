// NoiseSuppressionService: high-level example that you can wire to RNNoise/DeepFilterNet WASM.

class NoiseSuppressionService {
    constructor(jwtToken, meetingId) {
        this.jwtToken = jwtToken;
        this.meetingId = meetingId;
        this.metricsBuffer = [];
        this.audioContext = null;
        this.processor = null;
    }

    async start() {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        this.audioContext = new AudioContext();
        const source = this.audioContext.createMediaStreamSource(stream);

        // TODO: load RNNoise/DeepFilterNet WASM module here and call into it in onaudioprocess.
        this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);

        this.processor.onaudioprocess = (event) => {
            const input = event.inputBuffer.getChannelData(0);
            const output = event.outputBuffer.getChannelData(0);

            // TODO: replace this pass-through with WASM-based denoising.
            output.set(input);

            let sumSquares = 0;
            for (let i = 0; i < input.length; i++) {
                sumSquares += input[i] * input[i];
            }
            const rms = Math.sqrt(sumSquares / input.length);
            const noiseLevel = rms;
            const clarityScore = 1 - Math.min(1, noiseLevel * 5);

            this.metricsBuffer.push({
                timestamp: new Date().toISOString(),
                clarityScore,
                noiseLevel,
                isLoudNoiseSuppressed: noiseLevel > 0.2,
                frequencyBand: null,
                rawMetricsJson: null
            });
        };

        source.connect(this.processor);
        this.processor.connect(this.audioContext.destination);

        // Send metrics every 5 seconds
        setInterval(() => this.flushMetrics(), 5000);
    }

    async flushMetrics() {
        if (this.metricsBuffer.length === 0) {
            return;
        }

        const batch = this.metricsBuffer;
        this.metricsBuffer = [];

        await fetch(`/api/meetings/${this.meetingId}/analytics/noise-metrics`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.jwtToken}`
            },
            body: JSON.stringify({ metrics: batch })
        });
    }
}

document.getElementById('startButton')?.addEventListener('click', () => {
    const token = prompt('Enter JWT token');
    const meetingId = prompt('Enter meetingId');
    if (token && meetingId) {
        const service = new NoiseSuppressionService(token, meetingId);
        service.start();
    }
});


