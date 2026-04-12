
export async function createNoiseCancelledMicTrack() {
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
            channelCount: 1,
            sampleRate: 48000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
        },
        video: false,
    });

    const track = stream.getAudioTracks()[0];

    console.log('Audio track settings:', track.getSettings?.());
    return track;
}