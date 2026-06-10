import { LocalAudioTrack } from 'livekit-client';

export type ProcessedAudioResources = {
    localAudioTrack: LocalAudioTrack;
    cleanup: () => Promise<void>;
};

export async function createProcessedMicTrack(): Promise<ProcessedAudioResources> {
    console.log('[NC] init');

    // 1. Mic
    const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            channelCount: 1,
        },
        video: false,
    });

    const rawTrack = micStream.getAudioTracks()[0];

    // 2. Audio context (must match processing rate)
    const audioContext = new AudioContext({ sampleRate: 16000 });
    await audioContext.resume();

    // 3. Load worklet
    await audioContext.audioWorklet.addModule('/noiseCancellationWorklet.js');

    // 4. FastAPI WebSocket
    const socket = new WebSocket('wss://8000-01kjk67evz2j6dzddj9wk33yyc.cloudspaces.litng.ai/ws/audio');
    socket.binaryType = 'arraybuffer';

    await new Promise<void>((resolve, reject) => {
        socket.onopen = () => resolve();
        socket.onerror = () => reject(new Error('WebSocket failed'));
    });

    console.log('[NC] websocket connected');

    // 5. Worklet
    const source = audioContext.createMediaStreamSource(micStream);

    const processor = new AudioWorkletNode(audioContext, 'noise-cancel-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
        processorOptions: {
            frameSize: 160 * 4,
        },
    });

    // 6. Output node (THIS is what LiveKit uses)
    const destination = audioContext.createMediaStreamDestination();

    // 7. Send frames to backend
    processor.port.onmessage = (event) => {
        const data = event.data;

        if (data?.type === 'frame') {
            socket.send(data.samples); // Float32 PCM
        }
    };

    // 8. Receive processed audio
    socket.onmessage = (event) => {
        const samples = new Float32Array(event.data);

        processor.port.postMessage({
            type: 'processed',
            samples: samples.buffer,
        }, [samples.buffer]);
    };

    // 9. Audio graph
    source.connect(processor);
    processor.connect(destination);

    const processedTrack = destination.stream.getAudioTracks()[0];
    const localAudioTrack = new LocalAudioTrack(processedTrack);

    console.log('[NC] track ready');

    // 10. Cleanup
    const cleanup = async () => {
        try { socket.close(); } catch { }
        try { processor.disconnect(); } catch { }
        try { source.disconnect(); } catch { }
        try { rawTrack.stop(); } catch { }
        try { processedTrack.stop(); } catch { }
        try { await audioContext.close(); } catch { }
    };

    return {
        localAudioTrack,
        cleanup,
    };
}