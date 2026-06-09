export const SOCKET_EVENTS = {
    USER_JOINED: "USER_JOINED",
    USER_LEFT: "USER_LEFT",
    RAISE_HAND: "RAISE_HAND",
    LOWER_HAND: "LOWER_HAND",
    MUTE_TOGGLE: "MUTE_TOGGLE",
    MEDIA_STATE: "participant:media-state",
    SPLIT_MODE: "layout:split-mode",
    MEETING_ENDED: "meeting:ended",
    HOST_CHANGED: "meeting:host-changed",
    HOST_TRANSFERRED: "meeting:host-transferred",
};

export function parseMeetingEventPayload(payload: unknown): Record<string, unknown> {
    if (!payload) return {};
    if (typeof payload === "string") {
        try {
            return JSON.parse(payload) as Record<string, unknown>;
        } catch {
            return {};
        }
    }
    if (typeof payload === "object") return payload as Record<string, unknown>;
    return {};
}
