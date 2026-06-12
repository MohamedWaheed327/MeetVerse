import { LocalAudioTrack } from 'livekit-client';

export type ProcessedAudioResources = {
    localAudioTrack: LocalAudioTrack;
    cleanup: () => Promise<void>;
};

export async function createProcessedMicTrack(): Promise<ProcessedAudioResources> {
    console.log('[NC] init');

    const FRAME_SAMPLES = 1024;

    const wsUrl = (
        import.meta.env.VITE_FASTAPI_WS_URL || ''
    ).replace(/\/$/, '');

    const socketUrl = wsUrl
        ? `${wsUrl}/ws/audio`
        : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/audio`;

    // =========================
    // MIC
    // =========================

    const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false,
            channelCount: 1,
        },
        video: false,
    });

    const rawTrack = micStream.getAudioTracks()[0];

    // =========================
    // AUDIO CONTEXT
    // =========================

    const audioContext = new AudioContext({
        sampleRate: 16000,
    });

    await audioContext.resume();

    console.log(
        '[NC] actual sample rate:',
        audioContext.sampleRate
    );

    await audioContext.audioWorklet.addModule(
        '/noiseCancellationWorklet.js'
    );

    // =========================
    // WEBSOCKET
    // =========================

    const socket = new WebSocket(socketUrl);
    socket.binaryType = 'arraybuffer';

    await new Promise<void>((resolve, reject) => {
        socket.onopen = () => resolve();
        socket.onerror = () =>
            reject(new Error('WebSocket failed'));
    });

    console.log('[NC] websocket connected');

    // =========================
    // AUDIO GRAPH
    // =========================

    const source =
        audioContext.createMediaStreamSource(micStream);

    const processor = new AudioWorkletNode(
        audioContext,
        'noise-cancel-processor',
        {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [1],
            processorOptions: {
                frameSize: FRAME_SAMPLES,
            },
        }
    );

    const outputGain = audioContext.createGain();
    outputGain.gain.value = 1.0;

    const destination =
        audioContext.createMediaStreamDestination();

    // =========================
    // SEND TO SERVER
    // =========================

    processor.port.onmessage = (event) => {
        const data = event.data;

        if (
            data?.type === 'frame' &&
            socket.readyState === WebSocket.OPEN
        ) {
            socket.send(data.samples);
        }
    };

    // =========================
    // RECEIVE FROM SERVER
    // =========================

    socket.onmessage = (event) => {
        if (!(event.data instanceof ArrayBuffer)) {
            return;
        }

        processor.port.postMessage(
            {
                type: 'processed',
                samples: event.data,
            },
            [event.data]
        );
    };

    // =========================
    // CONNECT GRAPH
    // =========================

    source.connect(processor);
    processor.connect(outputGain);
    outputGain.connect(destination);

    const processedTrack =
        destination.stream.getAudioTracks()[0];

    const localAudioTrack =
        new LocalAudioTrack(processedTrack);

    console.log('[NC] track ready');

    const cleanup = async () => {
        try {
            socket.close();
        } catch { }

        try {
            processor.disconnect();
        } catch { }

        try {
            outputGain.disconnect();
        } catch { }

        try {
            source.disconnect();
        } catch { }

        try {
            rawTrack.stop();
        } catch { }

        try {
            processedTrack.stop();
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