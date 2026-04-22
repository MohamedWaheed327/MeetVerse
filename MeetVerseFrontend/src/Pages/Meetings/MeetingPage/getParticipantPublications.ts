import { Participant, Track } from "livekit-client";

export const getCameraPublications = (participant: Participant) => {
  return Array.from(participant?.videoTrackPublications?.values?.() || []).filter(
    (pub) => pub.source == Track.Source.Camera
  );
};

export const getScreenSharePublications = (participant: Participant) => {
  return Array.from(participant?.videoTrackPublications?.values?.() || []).filter(
    (pub) => pub.source == Track.Source.ScreenShare
  );
};

export const getAudioPublications = (participant: Participant) => {
  return Array.from(participant?.audioTrackPublications?.values?.() || []);
};
