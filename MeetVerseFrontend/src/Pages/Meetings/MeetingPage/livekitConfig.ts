import {
  ScreenSharePresets,
  type RoomOptions,
  type ScreenShareCaptureOptions,
  type TrackPublishOptions,
} from "livekit-client";

/** Room defaults tuned for readable, smooth screen sharing. */
export const MEETING_ROOM_OPTIONS: RoomOptions = {
  adaptiveStream: {
    pixelDensity: "screen",
    pauseVideoInBackground: false,
  },
  dynacast: true,
  publishDefaults: {
    screenShareEncoding: ScreenSharePresets.h1080fps30.encoding,
    degradationPreference: "maintain-resolution",
  },
};

export const SCREEN_SHARE_CAPTURE: ScreenShareCaptureOptions = {
  resolution: ScreenSharePresets.h1080fps30.resolution,
  contentHint: "detail",
};

export const SCREEN_SHARE_PUBLISH: TrackPublishOptions = {
  screenShareEncoding: ScreenSharePresets.h1080fps30.encoding,
  degradationPreference: "maintain-resolution",
};
