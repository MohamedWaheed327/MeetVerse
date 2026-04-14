import { Participant } from "livekit-client";
import { isCameraSource, isScreenShareSource } from "./isSource";

export const getCameraPublications = (participant: Participant) => {
  return Array.from(participant?.videoTrackPublications?.values?.() || []).filter(
    (pub) => isCameraSource(pub.source)
  );
};

export const getScreenSharePublications = (participant: Participant) => {
  return Array.from(participant?.videoTrackPublications?.values?.() || []).filter(
    (pub) => isScreenShareSource(pub.source)
  );
};

export const getAudioPublications = (participant: Participant) => {
  return Array.from(participant?.audioTrackPublications?.values?.() || []);
};
