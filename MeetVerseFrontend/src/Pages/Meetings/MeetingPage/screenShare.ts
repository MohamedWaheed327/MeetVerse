import { Track } from "livekit-client";

function getTrackKey(track: Track, fallbackId = "screenshare"): string {
  return track.sid ?? track.mediaStreamTrack?.id ?? fallbackId;
}

export const attachScreenShareTrackToArea = (
  track: Track,
  screenShareContainerRef: React.RefObject<HTMLDivElement | null>,
  isLocal: boolean = false,
  onSelfShareDetected?: () => void
) => {
  const container = screenShareContainerRef.current;
  if (!container || track.kind !== "video") return;

  const trackKey = getTrackKey(track);
  const attachedKey = container.getAttribute("data-screenshare-track-key");
  const existingVideo = container.querySelector(
    "video[data-screenshare-element='true']"
  ) as HTMLVideoElement | null;

  // Avoid tearing down and recreating the <video> on every participant sync (causes choppy playback).
  if (
    !isLocal &&
    attachedKey &&
    attachedKey === trackKey &&
    existingVideo
  ) {
    return;
  }

  removeScreenShareElement(screenShareContainerRef);

  if (isLocal) {
    if (onSelfShareDetected) onSelfShareDetected();

    const placeholder = document.createElement("div");
    placeholder.className =
      "absolute inset-0 w-full h-full bg-slate-900 flex flex-col items-center justify-center text-white z-10";
    placeholder.innerHTML = `
            <svg class="w-16 h-16 mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            <h3 class="text-xl font-medium">You are sharing your screen</h3>
            <p class="text-slate-400 mt-2">Local preview hidden to prevent lag</p>
        `;
    placeholder.setAttribute("data-screenshare-element", "true");
    container.setAttribute("data-screenshare-track-key", trackKey);
    container.appendChild(placeholder);
    return;
  }

  const element = track.attach() as HTMLVideoElement;
  element.autoplay = true;
  element.playsInline = true;
  element.muted = true;
  element.className = "absolute inset-0 w-full h-full object-contain bg-black";
  element.setAttribute("data-screenshare-element", "true");
  element.style.transform = "translateZ(0)";
  element.style.willChange = "contents";

  container.setAttribute("data-screenshare-track-key", trackKey);
  container.appendChild(element);
};

export const removeScreenShareElement = (
  screenShareContainerRef: React.RefObject<HTMLDivElement | null>
) => {
  const container = screenShareContainerRef.current;
  if (!container) return;

  container.querySelectorAll("[data-screenshare-element='true'], video").forEach((el) => {
    if (el.tagName === "VIDEO") {
      try {
        (el as HTMLVideoElement).srcObject = null;
      } catch {
        /* ignore */
      }
    }
    el.remove();
  });

  container.removeAttribute("data-screenshare-track-key");
};
