import { Track } from "livekit-client";

export const isCameraSource = (source: Track.Source) => {
    return source === Track.Source.Camera;
};

export const isScreenShareSource = (source: Track.Source) => {
    return source === Track.Source.ScreenShare;
};

export const isMicrophoneSource = (source: Track.Source) => {
    return source === Track.Source.Microphone;
};

export const isScreenShareAudioSource = (source: Track.Source) => {
    return source === Track.Source.ScreenShareAudio;
};
