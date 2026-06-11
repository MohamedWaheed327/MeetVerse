import Navbar from "../../../components/LandingComponents/Navbar/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, MessageSquare, Waves, X, Send, ShieldCheck, Type, PenTool, Hand, FileDown, Link, Share2, Smile, Disc } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Participant, RemoteTrackPublication, Room, RoomEvent, Track, TrackPublication, VideoQuality } from "livekit-client";
import { MEETING_ROOM_OPTIONS } from "./livekitConfig";
import { sendChatMessage } from "../../../services/hubs/sendMeetingMessage";
import { meeting_chat_connection } from "../../../services/hubs/connections";
import { subscribeToMeeting, unsubscribeFromMeeting, onMessageReceived, onError, } from "../../../services/hubs/meetingChat";
import { GetMeetingChat } from "../../../services/getMeetingChat";
import { getLivekitToken } from "./getLivekitToken";
import { buildParticipantsList } from "./buildParticipantsList";
import { getAudioPublications, getCameraPublications, getScreenSharePublications } from "./getParticipantPublications";
import { getParticipantDisplayName } from "./getParticipantDisplayName";
import { getActiveScreenShare } from "./getActiveScreenShare";
import { getPreferredParticipantVideoPublication } from "./getPreferredParticipantVideoPublication";
import { attachScreenShareTrackToArea, removeScreenShareElement } from "./screenShare";
import { attachCameraTrackToElement, removeCameraElement } from "./attachAndRemoveCameraElement";
import { attachAudioTrack, removeAudioElement } from "./attachAndRemoveAudioElement";
import { cleanupMediaElements } from "./cleanupMediaElements";
import { HubConnectionState } from "@microsoft/signalr";
import { loadChatHistoryEffect } from "./useEffects/loadChatHistoryEffect";
import { subscripeToSingnalREffect } from "./useEffects/subscripeToSingnalREffect";
import { handleSendMessage } from "./MeetingControls/sendMeetingChatMessage";
import { toggleScreenShare } from "./MeetingControls/toggleScreenShare";
import { toggleCamera } from "./MeetingControls/toggleCamera";
import { handleLeaveMeeting } from "./MeetingControls/leaveMeeting";
import { publishMicTrack, toggleMic, toggleNoiseCancellation } from "./MeetingControls/toggleMic";
import { useParticipants } from "./MeetingControls/useParticipants";
import { SOCKET_EVENTS, parseMeetingEventPayload } from "./MeetingControls/socketEvents";
import WhiteboardPanel from "./Whiteboard/WhiteboardPanel";
import type { WhiteboardPanelHandle } from "./Whiteboard/WhiteboardPanel";
import { useToast } from "../../../Context/ToastContext";
import { getMeeting } from "../../../services/getMeeting";
import { getMeetingParticipants } from "../../../services/getMeetingParticipants";
import { leaveMeetingAPI } from "../../../services/leaveMeetingAPI";
import InteractionBar from "./MeetingControls/InteractionBar";
import { meetingLinkService } from "../../../services/meetingLinkService";
import api from "../../../services/api";
import { useMeetingRecording } from "./MeetingControls/useMeetingRecording";
import { PostRecordingModal } from "./MeetingControls/PostRecordingModal";

function getLiveKitUrl(): string {
  const preferred = import.meta.env.DEV
    ? import.meta.env.VITE_LIVEKIT_DEV
    : import.meta.env.VITE_LIVEKIT_PROD;
  if (preferred?.startsWith("ws://") || preferred?.startsWith("wss://")) {
    return preferred;
  }
  return import.meta.env.VITE_LIVEKIT_PROD;
}

function getTranscribeWsUrl(): string {
  const host = import.meta.env.DEV
    ? import.meta.env.VITE_BACKEND_DEV
    : import.meta.env.VITE_BACKEND_PROD;
  return `${host.replace(/^http/, "ws")}/ws/transcribe`;
}

type Message = {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  sentAt?: string;
};

type MessageGroup = {
  senderId: string;
  senderName: string;
  avatarColor: string;
  avatarInitial: string;
  messages: Message[];
};

const groupMessages = (msgs: Message[]): MessageGroup[] => {
  const groups: MessageGroup[] = [];
  const colorPool = [
    "bg-indigo-600",
    "bg-purple-600",
    "bg-pink-600",
    "bg-emerald-600",
    "bg-orange-600",
    "bg-teal-600",
  ];

  msgs.forEach((msg) => {
    const msgTime = msg.sentAt ? new Date(msg.sentAt).getTime() : Date.now();
    const lastGroup = groups[groups.length - 1];

    if (lastGroup) {
      const prevMsg = lastGroup.messages[lastGroup.messages.length - 1];
      const prevMsgTime = prevMsg.sentAt ? new Date(prevMsg.sentAt).getTime() : Date.now();
      const timeDiffMin = (msgTime - prevMsgTime) / 60000;

      if (lastGroup.senderId === msg.senderId && timeDiffMin <= 2) {
        lastGroup.messages.push(msg);
        return;
      }
    }

    const initial = msg.senderName?.charAt(0)?.toUpperCase() || "U";
    let nameHash = 0;
    for (let i = 0; i < (msg.senderName?.length || 0); i++) {
      nameHash = msg.senderName.charCodeAt(i) + ((nameHash << 5) - nameHash);
    }
    const colorIndex = Math.abs(nameHash) % colorPool.length;
    const avatarColor = colorPool[colorIndex];

    groups.push({
      senderId: msg.senderId,
      senderName: msg.senderName,
      avatarColor,
      avatarInitial: initial,
      messages: [msg],
    });
  });

  return groups;
};

type User = {
  id: string;
  name: string;
  initial: string;
  color: string;
  isSpeaking: boolean;
  isLocal: boolean;
  hasVideo: boolean;
  hasMic: boolean;
};

export default function MeetingPage() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [muted, setMuted] = useState(state?.muteMic ?? true);
  const [cameraOff, setCameraOff] = useState(state?.cameraOff ?? true);
  const [noiseCancellationOn, setNoiseCancellationOn] = useState(true);
  const [screenShareOff, setScreenShareOff] = useState(true);
  const [screenShareOwner, setScreenShareOwner] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCaptionsOn, setIsCaptionsOn] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [whiteboardOwnerName, setWhiteboardOwnerName] = useState("");
  const [whiteboardOwnerId, setWhiteboardOwnerId] = useState("");
  const [isJoinedInDatabase, setIsJoinedInDatabase] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [meetingInfo, setMeetingInfo] = useState<any>(null);
  const isIntentionalExit = useRef(false);
  const [isHost, setIsHost] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const { showToast } = useToast();

  const { participants, toggleRaiseHand, isLocalHandRaised, participantCount } = useParticipants(meetingId, users);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [showNewMessagePill, setShowNewMessagePill] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const prevMessagesLengthRef = useRef(messages.length);

  const [showBlockerModal, setShowBlockerModal] = useState(false);

  const { isRecordingScreen, recordingBlob, startRecording, stopRecording, clearRecording } = useMeetingRecording();
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);

  useEffect(() => {
    if (recordingBlob) {
      setIsRecordingModalOpen(true);
    }
  }, [recordingBlob]);

  // Intercept browser back button
  useEffect(() => {
    // Push a dummy state so there's a state to pop from on history back
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      if (isIntentionalExit.current) {
        return;
      }
      // Pushing the state again prevents URL changes and traps the user on the current page
      window.history.pushState(null, "", window.location.href);
      setShowBlockerModal(true);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Intercept browser tab refresh/close/window close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isIntentionalExit.current) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (isNearBottom) {
      setShowNewMessagePill(false);
    }
  };

  const scrollToBottom = () => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      setShowNewMessagePill(false);
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    if (messages.length > prevMessagesLengthRef.current) {
      const userWasNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      if (userWasNearBottom) {
        setTimeout(() => {
          el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        }, 50);
        setShowNewMessagePill(false);
      } else {
        setShowNewMessagePill(true);
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (isChatOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isChatOpen]);
  const roomRef = useRef<Room | null>(null);
  const videoRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const screenShareContainerRef = useRef<HTMLDivElement | null>(null);
  const hasShownSelfShareToast = useRef(false);
  const cleanupRef = useRef<null | (() => Promise<void>)>(null);

  const isTogglingCameraRef = useRef(false);
  const isTogglingMicRef = useRef(false);
  const isTogglingScreenShareRef = useRef(false);
  const whiteboardRef = useRef<WhiteboardPanelHandle>(null);

  const rafRefs = useRef<{ first: number | null; second: number | null }>({ first: null, second: null });
  const syncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSpeakerSyncRef = useRef(0);

  const clearSyncDebounce = () => {
    if (syncDebounceRef.current) {
      clearTimeout(syncDebounceRef.current);
      syncDebounceRef.current = null;
    }
  };

  const scheduleSyncParticipants = (liveRoom: Room) => {
    clearSyncDebounce();
    syncDebounceRef.current = setTimeout(() => {
      syncParticipants(liveRoom);
      syncDebounceRef.current = null;
    }, 80);
  };

  const clearScheduledRenderSync = () => {
    if (rafRefs.current.first) cancelAnimationFrame(rafRefs.current.first);
    if (rafRefs.current.second) cancelAnimationFrame(rafRefs.current.second);
    rafRefs.current = { first: null, second: null };
  };

  const runAfterRender = (cb: () => void) => {
    clearScheduledRenderSync();

    rafRefs.current.first = requestAnimationFrame(() => {
      rafRefs.current.second = requestAnimationFrame(() => {
        cb();
        rafRefs.current = { first: null, second: null };
      });
    });
  };

  ///////////////////////

  type CaptionState = {
    participantId: string;
    participantName: string;
    interim: string;
    finals: string[];
    status: string;
    error?: string;
  };

  const [captions, setCaptions] = useState<Record<string, CaptionState>>({});
  const recorderRef = useRef<Record<string, MediaRecorder>>({});
  const socketMapRef = useRef<Record<string, WebSocket>>({});

  const getTrackKey = (track: Track) => {
    return (track as any).sid ?? track.mediaStreamID;
  };

  const updateCaption = (
    trackKey: string,
    updater: (prev: CaptionState | undefined) => CaptionState
  ) => {
    setCaptions((prev) => ({
      ...prev,
      [trackKey]: updater(prev[trackKey]),
    }));
  };

  const removeCaption = (trackKey: string) => {
    setCaptions((prev) => {
      const copy = { ...prev };
      delete copy[trackKey];
      return copy;
    });
  };

  const startTranscriping = async (track: Track, participantId: string, participantName: string) => {
    const trackKey = getTrackKey(track);

    if (recorderRef.current[trackKey]) return;

    try {
      let options: MediaRecorderOptions | undefined = undefined;

      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      }

      updateCaption(trackKey, () => ({
        participantId,
        participantName,
        interim: '',
        finals: [],
        status: 'Connecting...',
        error: '',
      }));

      const socket = new WebSocket(getTranscribeWsUrl());
      socket.binaryType = 'arraybuffer';
      socketMapRef.current[trackKey] = socket;

      const mediaTrack = (track as any).mediaStreamTrack as MediaStreamTrack | undefined;
      if (!mediaTrack) {
        throw new Error('No mediaStreamTrack found on subscribed track');
      }

      const mediaRecorder = new MediaRecorder(new MediaStream([mediaTrack]), options);
      recorderRef.current[trackKey] = mediaRecorder;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
          const arrayBuffer = await event.data.arrayBuffer();
          socket.send(arrayBuffer);
        }
      };

      mediaRecorder.onstop = () => {
        setTimeout(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.close();
          }
        }, 300);
      };

      socket.onopen = () => {
        updateCaption(trackKey, (prev) => ({
          participantId,
          participantName,
          interim: prev?.interim ?? '',
          finals: prev?.finals ?? [],
          status: 'Listening...',
          error: '',
        }));

        mediaRecorder.start(250);
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'transcript') {
            if (msg.isFinal) {
              updateCaption(trackKey, (prev) => ({
                participantId,
                participantName,
                interim: '',
                finals: [...(prev?.finals ?? []), msg.text],
                status: 'Listening...',
                error: '',
              }));
            } else {
              updateCaption(trackKey, (prev) => ({
                participantId,
                participantName,
                interim: msg.text,
                finals: prev?.finals ?? [],
                status: 'Listening...',
                error: '',
              }));
            }
          }
        } catch (err) {
          console.error('Invalid WS message:', err);
        }
      };

      socket.onerror = () => {
        updateCaption(trackKey, (prev) => ({
          participantId,
          participantName,
          interim: prev?.interim ?? '',
          finals: prev?.finals ?? [],
          status: 'Error',
          error: 'WebSocket connection failed',
        }));
      };

      socket.onclose = () => {
        updateCaption(trackKey, (prev) => ({
          participantId,
          participantName,
          interim: prev?.interim ?? '',
          finals: prev?.finals ?? [],
          status: 'Stopped',
          error: prev?.error ?? '',
        }));

        delete socketMapRef.current[trackKey];
        delete recorderRef.current[trackKey];

        // Auto-reconnect if it dropped unexpectedly
        if (!(socket as any)._intentionalClose) {
          setTimeout(() => {
            startTranscriping(track, participantId, participantName);
          }, 1000);
        }
      };
    } catch (err) {
      console.error(err);

      updateCaption(trackKey, () => ({
        participantId,
        participantName,
        interim: '',
        finals: [],
        status: 'Error',
        error: 'Microphone/audio track unavailable',
      }));
    }
  };

  const stopTranscriping = (track: Track) => {
    const trackKey = getTrackKey(track);
    const recorder = recorderRef.current[trackKey];
    const socket = socketMapRef.current[trackKey];

    if (socket) {
      (socket as any)._intentionalClose = true;
    }

    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    } else if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }

    delete recorderRef.current[trackKey];
    delete socketMapRef.current[trackKey];
  };

  const toggleTranscript = async () => {
    if (!roomRef.current) return;

    if (isCaptionsOn) {
      const allParticipants = roomRef.current.remoteParticipants;
      allParticipants.forEach((participant) => {
        const micPub = participant.getTrackPublication(Track.Source.Microphone);
        if (micPub?.track) {
          stopTranscriping(micPub.track);
        }
      });

      setCaptions({});
      setIsCaptionsOn(false);
      return;
    }

    // Ensure chat is visible so transcript appears inside the chat window
    setIsChatOpen(true);

    roomRef.current.remoteParticipants.forEach((participant) => {
      const micPub = participant.getTrackPublication(Track.Source.Microphone);
      if (micPub?.track && !micPub.track.isMuted) {
        startTranscriping(
          micPub.track,
          participant.identity,
          getParticipantDisplayName(participant, false)
        );
      }
    });

    setIsCaptionsOn(true);
  };

  ////////////////////

  const syncParticipants = (liveRoom: Room) => {
    if (!liveRoom) return;

    const updatedUsers = buildParticipantsList(liveRoom);
    const activeScreenShare = getActiveScreenShare(liveRoom, null);

    setUsers(updatedUsers);
    setCameraOff(!liveRoom.localParticipant.isCameraEnabled);
    setMuted(!liveRoom.localParticipant.isMicrophoneEnabled);
    setScreenShareOff(!activeScreenShare);
    setScreenShareOwner(activeScreenShare ? getParticipantDisplayName(activeScreenShare.participant as Participant, activeScreenShare.isLocal) : "");

    runAfterRender(() => {
      if (!liveRoom) return;

      const allParticipants = [
        liveRoom.localParticipant,
        ...Array.from(liveRoom.remoteParticipants.values()),
      ];

      allParticipants.forEach((participant) => {
        const preferredVideoPub = getPreferredParticipantVideoPublication(participant);

        if (!preferredVideoPub?.track) {
          removeCameraElement(participant.identity, videoRefs);
          return;
        }

        attachCameraTrackToElement(preferredVideoPub.track, participant.identity, videoRefs);
      });

      const activeIds = new Set(allParticipants.map((p) => p.identity));
      Object.keys(videoRefs.current).forEach((participantId) => {
        if (!activeIds.has(participantId)) {
          removeCameraElement(participantId, videoRefs);
        }
      });

      // Re-attach after layout when the screen-share container is mounted.
      if (activeScreenShare?.publication?.track) {
        attachScreenShareFromSync(liveRoom, activeScreenShare);
      }
    });
  };

  const attachScreenShareFromSync = (
    liveRoom: Room,
    activeScreenShare: NonNullable<ReturnType<typeof getActiveScreenShare>>
  ) => {
    const pub = activeScreenShare.publication;
    if (pub instanceof RemoteTrackPublication) {
      pub.setVideoQuality(VideoQuality.HIGH);
    }

    attachScreenShareTrackToArea(
      activeScreenShare.publication.track!,
      screenShareContainerRef,
      activeScreenShare.isLocal,
      () => {
        if (!hasShownSelfShareToast.current) {
          showToast(
            "You're sharing this tab — choose a window or another tab (not this meeting) for best quality.",
            "info"
          );
          hasShownSelfShareToast.current = true;
        }
      }
    );
  };

  const ensureScreenShareAttached = (liveRoom: Room) => {
    const activeScreenShare = getActiveScreenShare(liveRoom, null);
    if (!activeScreenShare?.publication?.track) {
      hasShownSelfShareToast.current = false;
      removeScreenShareElement(screenShareContainerRef);
      return;
    }

    attachScreenShareFromSync(liveRoom, activeScreenShare);
  };

  // Attach screen share after React mounts the container (fixes black screen race).
  useEffect(() => {
    if (screenShareOff || !roomRef.current) return;

    const frame = requestAnimationFrame(() => {
      ensureScreenShareAttached(roomRef.current!);
    });
    return () => cancelAnimationFrame(frame);
  }, [screenShareOff, screenShareOwner]);

  useEffect(() => {
    if (meetingId) {
      getMeeting(meetingId).then((info) => {
        if (info) setMeetingInfo(info);
      });
    }
  }, [meetingId]);

  // ── Register participant in database when they enter the page ──
  useEffect(() => {
    if (meetingId) {
      api.post("/meetings/join", { meetingId })
        .then(() => {
          console.log("Successfully joined meeting in database");
          setIsJoinedInDatabase(true);
        })
        .catch((err) => {
          console.log("Already joined or failed to register participant:", err);
          setIsJoinedInDatabase(true);
        });
    }
  }, [meetingId]);

  // ── Sync video elements when whiteboard is toggled ──
  useEffect(() => {
    if (roomRef.current) {
      syncParticipants(roomRef.current);
    }
  }, [isWhiteboardOpen]);

  // ── Broadcast media state when mic or camera state changes ──
  useEffect(() => {
    if (!meetingId || meeting_chat_connection.state !== "Connected") return;

    meeting_chat_connection.invoke(
      "SendMeetingEvent",
      meetingId,
      "participant:media-state",
      JSON.stringify({
        isMicMuted: muted,
        isCameraOff: cameraOff
      })
    ).catch((err) => console.error("Failed to broadcast media state:", err));
  }, [muted, cameraOff, meetingId]);

  // ── Host ended meeting for everyone ──
  useEffect(() => {
    if (!meetingId) return;

    const handleMeetingEnded = (data: { meetingId?: string; eventType?: string }) => {
      if (String(data.meetingId ?? "").toLowerCase() !== meetingId.toLowerCase()) return;
      if (data.eventType !== SOCKET_EVENTS.MEETING_ENDED) return;
      if (isIntentionalExit.current) return;

      isIntentionalExit.current = true;
      showToast("The host ended the meeting for everyone.", "info");
      handleLeaveMeeting(
        roomRef,
        clearScheduledRenderSync,
        audioRefs,
        videoRefs,
        screenShareContainerRef
      );
      navigate("/meetings");
    };

    meeting_chat_connection.on("MeetingEventReceived", handleMeetingEnded);
    return () => {
      meeting_chat_connection.off("MeetingEventReceived", handleMeetingEnded);
    };
  }, [meetingId, navigate, showToast]);

  // ── Host transferred to another participant (random pick) ──
  useEffect(() => {
    if (!meetingId) return;

    const applyHostChange = (data: {
      meetingId?: string;
      eventType?: string;
      payload?: unknown;
      senderName?: string;
    }) => {
      if (String(data.meetingId ?? "").toLowerCase() !== meetingId.toLowerCase()) return;
      if (
        data.eventType !== SOCKET_EVENTS.HOST_CHANGED &&
        data.eventType !== SOCKET_EVENTS.HOST_TRANSFERRED
      ) {
        return;
      }

      const payload = parseMeetingEventPayload(data.payload);
      const newHostId = String(payload.newHostId ?? "");
      const newHostName = String(
        payload.newHostName ?? data.senderName ?? "A participant"
      );
      const currentUserId =
        localStorage.getItem("userid") || sessionStorage.getItem("userid") || "";

      if (data.eventType === SOCKET_EVENTS.HOST_CHANGED) {
        showToast(`${newHostName} is now the meeting owner.`, "info");
      }

      const isNewHost = Boolean(newHostId && newHostId === currentUserId);
      setIsHost(isNewHost);
      setMeetingInfo((prev: typeof meetingInfo) =>
        prev && newHostId ? { ...prev, hostId: newHostId } : prev
      );
    };

    meeting_chat_connection.on("MeetingEventReceived", applyHostChange);
    return () => {
      meeting_chat_connection.off("MeetingEventReceived", applyHostChange);
    };
  }, [meetingId, showToast]);

  // ── Broadcast/receive whiteboard toggle status over SignalR ──
  useEffect(() => {
    if (!meetingId) return;

    const handleMeetingEvent = (data: any) => {
      if (String(data.meetingId ?? "").toLowerCase() !== meetingId.toLowerCase()) return;

      if (data.eventType === "whiteboard:toggle") {
        try {
          const payload = JSON.parse(data.payload);
          setIsWhiteboardOpen(payload.isOpen);
          setWhiteboardOwnerName(payload.ownerName || "");
          setWhiteboardOwnerId(payload.ownerId || "");

          showToast(
            payload.isOpen
              ? `${data.senderName || "A participant"} opened the collaborative whiteboard 🎨`
              : `${data.senderName || "A participant"} closed the whiteboard`,
            "info"
          );
        } catch (e) {
          console.error("Failed to parse whiteboard:toggle payload:", e);
        }
      } else if (data.eventType === "USER_JOINED") {
        const currentUserId = localStorage.getItem("userid") || sessionStorage.getItem("userid") || "";
        if (data.senderId !== currentUserId && isWhiteboardOpen) {
          if (meeting_chat_connection.state === "Connected") {
            meeting_chat_connection.invoke(
              "SendMeetingEvent",
              meetingId,
              "whiteboard:toggle",
              JSON.stringify({
                isOpen: true,
                ownerName: whiteboardOwnerName || localStorage.getItem("username") || sessionStorage.getItem("username") || "Someone",
                ownerId: whiteboardOwnerId || currentUserId
              })
            ).catch(() => { });
          }
        }
      }
    };

    meeting_chat_connection.on("MeetingEventReceived", handleMeetingEvent);

    return () => {
      meeting_chat_connection.off("MeetingEventReceived", handleMeetingEvent);
    };
  }, [meetingId, isWhiteboardOpen, whiteboardOwnerName, whiteboardOwnerId, showToast]);

  useEffect(() => {
    if (meetingId) {
      const currentUserId = localStorage.getItem("userid") || sessionStorage.getItem("userid");
      getMeetingParticipants(meetingId).then((participants) => {
        // Backend uses MeetingParticipantRole.Host = 1, Participant = 0
        const hostParticipant = participants.find((p) => p.role === 1 || String(p.role) === "Host" || String(p.role) === "host");
        if (hostParticipant && hostParticipant.userId === currentUserId) {
          setIsHost(true);
        }
        // Fallback: compare against meetingInfo.hostId if participants didn't indicate host
        try {
          if (!isHost && meetingInfo && meetingInfo.hostId && meetingInfo.hostId === currentUserId) {
            setIsHost(true);
          }
        } catch (e) { }
      });
    }
  }, [meetingId]);

  useEffect(() => {
    let cancelled = false;

    const joinRoom = async () => {
      try {
        const token = await getLivekitToken(meetingId ?? "", state?.displayName);
        if (cancelled) return;
        const newRoom = new Room(MEETING_ROOM_OPTIONS);
        roomRef.current = newRoom;

        const handleTrackSubscribed = (track: Track, publication: TrackPublication, participant: Participant) => {
          console.log("trackSubscribed:", participant.identity, track.kind, publication?.source);

          if (publication.source == Track.Source.Microphone) {
            if (isCaptionsOn) {
              startTranscriping(
                track,
                participant.identity,
                getParticipantDisplayName(participant, false)
              );
            }
            attachAudioTrack(track, participant.identity, audioRefs);
          }

          if (publication.source === Track.Source.ScreenShare) {
            setScreenShareOff(false);
            setScreenShareOwner(getParticipantDisplayName(participant, false));
            if (publication instanceof RemoteTrackPublication) {
              publication.setVideoQuality(VideoQuality.HIGH);
            }
            ensureScreenShareAttached(newRoom);
          }
          scheduleSyncParticipants(newRoom);
        };

        const handleTrackUnsubscribed = (track: Track, publication: TrackPublication, participant: Participant) => {
          if (publication.source === Track.Source.ScreenShare) {
            removeScreenShareElement(screenShareContainerRef);
            setScreenShareOff(true);
            setScreenShareOwner("");
            return;
          }

          if (publication.source == Track.Source.Microphone) {
            if (isCaptionsOn) stopTranscriping(track);
            removeAudioElement(participant.identity, audioRefs);
          }

          scheduleSyncParticipants(newRoom);
        };

        const handleParticipantConnected = () => {
          syncParticipants(newRoom);
        };

        const handleParticipantDisconnected = (participant: Participant) => {
          const currentUserId = localStorage.getItem("userid") || sessionStorage.getItem("userid");
          if (meetingInfo && meetingInfo.hostId === currentUserId) {
            showToast(`${getParticipantDisplayName(participant, false)} left the meeting`, 'info');
          }
          syncParticipants(newRoom);
        };

        const handleTrackPublished = () => {
          scheduleSyncParticipants(newRoom);
        };

        const handleTrackUnpublished = () => {
          scheduleSyncParticipants(newRoom);
        };

        const handleTrackMuted = () => {
          scheduleSyncParticipants(newRoom);
        };

        const handleTrackUnmuted = () => {
          scheduleSyncParticipants(newRoom);
        };

        const handleActiveSpeakersChanged = () => {
          const now = Date.now();
          if (now - lastSpeakerSyncRef.current < 250) return;
          lastSpeakerSyncRef.current = now;
          scheduleSyncParticipants(newRoom);
        };

        const handleLocalTrackPublished = (publication: TrackPublication) => {
          if (publication.source === Track.Source.ScreenShare) {
            setScreenShareOff(false);
            setScreenShareOwner(
              getParticipantDisplayName(newRoom.localParticipant, true)
            );
            ensureScreenShareAttached(newRoom);
            return;
          }
          scheduleSyncParticipants(newRoom);
        };

        const handleLocalTrackUnpublished = (publication: TrackPublication) => {
          if (publication.source === Track.Source.ScreenShare) {
            removeScreenShareElement(screenShareContainerRef);
            setScreenShareOff(true);
            setScreenShareOwner("");
            return;
          }
          scheduleSyncParticipants(newRoom);
        };

        newRoom.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
        newRoom.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
        newRoom.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
        newRoom.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
        newRoom.on(RoomEvent.TrackPublished, handleTrackPublished);
        newRoom.on(RoomEvent.TrackUnpublished, handleTrackUnpublished);
        newRoom.on(RoomEvent.TrackMuted, handleTrackMuted);
        newRoom.on(RoomEvent.TrackUnmuted, handleTrackUnmuted);
        newRoom.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged);
        newRoom.on(RoomEvent.LocalTrackPublished, handleLocalTrackPublished);
        newRoom.on(RoomEvent.LocalTrackUnpublished, handleLocalTrackUnpublished);

        newRoom.on(RoomEvent.Disconnected, () => {
          if (isIntentionalExit.current) return;
          isIntentionalExit.current = true;
          showToast("The meeting has ended.", "info");
          navigate("/meetings");
        });

        await newRoom.connect(getLiveKitUrl(), token);

        if (!muted) {
          await publishMicTrack(roomRef, cleanupRef, noiseCancellationOn);
        }

        // await newRoom.localParticipant.setMicrophoneEnabled(!muted);
        await newRoom.localParticipant.setCameraEnabled(!cameraOff);

        syncParticipants(newRoom);

        console.log("✅ Connected to LiveKit room successfully");
      } catch (err) {
        console.error("❌ LiveKit connect failed:", err);
      }
    };

    joinRoom();

    return () => {
      cancelled = true;
      clearSyncDebounce();
      Object.values(recorderRef.current).forEach((recorder) => {
        if (recorder.state !== 'inactive') recorder.stop();
      });

      Object.values(socketMapRef.current).forEach((socket) => {
        if (socket.readyState === WebSocket.OPEN) socket.close();
      });
      handleLeaveMeeting(roomRef, clearScheduledRenderSync, audioRefs, videoRefs, screenShareContainerRef);
    };
  }, [meetingId]);


  loadChatHistoryEffect(meetingId, setIsLoading, setMessages);
  subscripeToSingnalREffect(meetingId, setMessages)


  // Auto-scroll handled inside new scroll container effects

  return (
    <div className="h-screen bg-slate-50 dark:bg-[#0D0F16] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300 flex flex-col overflow-hidden font-sans">
      <main className="flex-1 pt-6 pb-4 px-4 md:px-6 max-w-[1800px] mx-auto w-full flex gap-4 overflow-hidden relative">
        {/* Left Side: Video Grid Area */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 h-full overflow-hidden z-10">
          {/* Header Info */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-sm md:text-lg font-black flex items-center gap-2 truncate uppercase tracking-tight">
                {meetingInfo?.title || "Meeting Session"}
              </h1>
              <span className="px-2 py-0.5 bg-red-600 text-[9px] text-white rounded font-bold animate-pulse shrink-0">
                LIVE
              </span>
              {meetingId && (
                <button
                  onClick={async () => {
                    const success = await meetingLinkService.copyJoinLink(meetingId);
                    if (success) {
                      showToast("Invite link copied to clipboard!", "success");
                    } else {
                      showToast("Failed to copy invite link.", "error");
                    }
                  }}
                  className="p-1.5 rounded-lg bg-slate-900/40 hover:bg-slate-900/60 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-white/5 transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 hover:scale-105 active:scale-95"
                  title="Copy Invite Link"
                >
                  <Link size={12} />
                  <span className="hidden md:inline">Invite Link</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 bg-slate-900/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981] animate-pulse" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest hidden sm:block">
                AI Audio Shield Active
              </span>
            </div>
          </div>

          {/* Video / Screen Share / Whiteboard Layout */}
          <div className="flex-1 p-2 min-h-0 overflow-hidden">
            {isWhiteboardOpen ? (
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4 w-full h-full">
                {/* Whiteboard Panel */}
                <div className="relative rounded-[2.5rem] border-2 border-white/5 dark:border-[#2A2E3B] overflow-hidden shadow-xl min-h-[300px]">
                  {isJoinedInDatabase ? (
                    <WhiteboardPanel
                      meetingId={meetingId ?? ""}
                      ref={whiteboardRef}
                      isOwner={whiteboardOwnerId === (localStorage.getItem("userid") || sessionStorage.getItem("userid"))}
                      ownerName={whiteboardOwnerName}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#181B26] rounded-[2.5rem] border border-white/5 shadow-xl">
                      <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                      <p className="text-slate-400 font-medium">Connecting to whiteboard...</p>
                    </div>
                  )}

                  <div className="absolute top-5 left-5 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 z-20">
                    <span className="text-xs font-semibold text-white tracking-wide">
                      Collaborative Whiteboard
                      {whiteboardOwnerName ? ` • Opened by ${whiteboardOwnerName}` : ""}
                    </span>
                  </div>
                </div>

                {/* Participants sidebar */}
                <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-1 gap-3 h-full overflow-hidden">
                  {participants.map((user) => (
                    <motion.div
                      key={user.id}
                      layout
                      className={`relative rounded-[2rem] flex items-center justify-center border-2 transition-all shadow-xl overflow-hidden min-h-[180px] ${user.handRaised
                          ? "border-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.55)] ring-4 ring-amber-500/30"
                          : user.isSpeaking
                            ? "border-blue-500/80 shadow-[0_0_30px_rgba(59,130,246,0.4)] ring-4 ring-blue-500/20"
                            : "border-white/5 dark:border-[#2A2E3B]"
                        } ${user.hasVideo
                          ? "bg-black"
                          : "bg-gradient-to-br from-[#0f1117] to-[#1a1d2e]"
                        }`}
                    >
                      <div
                        ref={(el) => {
                          if (el) {
                            videoRefs.current[user.id] = el;
                          } else {
                            delete videoRefs.current[user.id];
                          }
                        }}
                        className="absolute inset-0 w-full h-full"
                      />

                      {!user.hasVideo && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <div
                            className={`w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 ring-2 ring-white/10 shadow-lg shadow-black/40 flex items-center justify-center text-2xl md:text-4xl font-black text-white shadow-2xl relative`}
                          >
                            {user.initial}
                            {user.isSpeaking && (
                              <span className="absolute -inset-3 rounded-full border-2 border-blue-500/40 animate-ping" />
                            )}
                          </div>
                        </div>
                      )}

                      <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2 border border-white/10 shadow-lg z-20">
                        <div
                          className={`w-2 h-2 rounded-full ${user.isSpeaking
                            ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                            : !user.hasMic ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                            }`}
                        />
                        <span className="text-[10px] font-bold text-white max-w-[80px] truncate">
                          {user.name} {user.isLocal ? "(You)" : ""}
                        </span>
                        {!user.hasMic && (
                          <MicOff size={11} className="text-red-400 shrink-0" />
                        )}
                        {!user.hasVideo && (
                          <VideoOff size={11} className="text-red-400 shrink-0" />
                        )}
                        {user.handRaised && (
                          <motion.div
                            animate={{ y: [0, -3, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-amber-400 flex items-center shrink-0"
                          >
                            <Hand size={11} fill="currentColor" />
                          </motion.div>
                        )}
                      </div>

                      {user.handRaised && (
                        <div className="absolute top-4 right-4 bg-amber-500 text-white px-2.5 py-1 rounded-full text-[9px] font-extrabold flex items-center gap-1.5 shadow-lg border border-amber-400/20 z-20 uppercase tracking-widest animate-bounce">
                          <Hand size={10} fill="currentColor" />
                          <span>Hand Raised</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : !screenShareOff ? (
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4 w-full h-full">
                {/* Screen share area */}
                <div className="relative rounded-[2.5rem] border-2 border-white/5 dark:border-[#2A2E3B] bg-black overflow-hidden shadow-xl min-h-[300px]">
                  <div
                    ref={screenShareContainerRef}
                    className="absolute inset-0 w-full h-full"
                  />

                  <div className="absolute top-5 left-5 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 z-20">
                    <span className="text-xs font-semibold text-white tracking-wide">
                      Presenting Screen
                      {screenShareOwner ? ` • ${screenShareOwner}` : ""}
                    </span>
                  </div>
                </div>

                {/* Participants sidebar */}
                <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-1 gap-3 h-full overflow-hidden">
                  {participants.map((user) => (
                    <motion.div
                      key={user.id}
                      layout
                      className={`relative rounded-[2rem] flex items-center justify-center border-2 transition-all shadow-xl overflow-hidden min-h-[180px] ${user.handRaised
                          ? "border-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.55)] ring-4 ring-amber-500/30"
                          : user.isSpeaking
                            ? "border-blue-500/80 shadow-[0_0_30px_rgba(59,130,246,0.4)] ring-4 ring-blue-500/20"
                            : "border-white/5 dark:border-[#2A2E3B]"
                        } ${user.hasVideo
                          ? "bg-black"
                          : "bg-gradient-to-br from-[#0f1117] to-[#1a1d2e]"
                        }`}
                    >
                      <div
                        ref={(el) => {
                          if (el) {
                            videoRefs.current[user.id] = el;
                          } else {
                            delete videoRefs.current[user.id];
                          }
                        }}
                        className="absolute inset-0 w-full h-full"
                      />

                      {!user.hasVideo && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <div
                            className={`w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 ring-2 ring-white/10 shadow-lg shadow-black/40 flex items-center justify-center text-2xl md:text-4xl font-black text-white shadow-2xl relative`}
                          >
                            {user.initial}
                            {user.isSpeaking && (
                              <span className="absolute -inset-3 rounded-full border-2 border-blue-500/40 animate-ping" />
                            )}
                          </div>
                        </div>
                      )}

                      <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2 border border-white/10 shadow-lg z-20">
                        <div
                          className={`w-2 h-2 rounded-full ${user.isSpeaking
                            ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                            : !user.hasMic ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                            }`}
                        />
                        <span className="text-[10px] font-bold text-white max-w-[80px] truncate">
                          {user.name} {user.isLocal ? "(You)" : ""}
                        </span>
                        {!user.hasMic && (
                          <MicOff size={11} className="text-red-400 shrink-0" />
                        )}
                        {!user.hasVideo && (
                          <VideoOff size={11} className="text-red-400 shrink-0" />
                        )}
                        {user.handRaised && (
                          <motion.div
                            animate={{ y: [0, -3, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-amber-400 flex items-center shrink-0"
                          >
                            <Hand size={11} fill="currentColor" />
                          </motion.div>
                        )}
                      </div>

                      {user.handRaised && (
                        <div className="absolute top-4 right-4 bg-amber-500 text-white px-2.5 py-1 rounded-full text-[9px] font-extrabold flex items-center gap-1.5 shadow-lg border border-amber-400/20 z-20 uppercase tracking-widest animate-bounce">
                          <Hand size={10} fill="currentColor" />
                          <span>Hand Raised</span>
                        </div>
                      )}

                      {user.isSpeaking && !user.handRaised && (
                        <div className="absolute top-4 right-4 flex items-end gap-1 h-4 z-20">
                          {[1, 2, 3, 4].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ height: [4, 16, 4] }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.5,
                                delay: i * 0.1,
                              }}
                              className="w-1 bg-blue-500 rounded-full"
                            />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full overflow-hidden relative">
                {participants.length === 1 && (
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-[#0D0F16]/5 to-transparent blur-3xl animate-pulse -z-10 w-[800px] h-[800px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                )}
                <div className={`grid gap-3 md:gap-5 w-full h-full transition-all duration-500 z-10 ${participants.length === 1 ? "grid-cols-1 max-w-[800px] max-h-[600px]" : "grid-cols-2 max-w-[1000px] max-h-[700px]"}`}>
                  {participants.map((user) => (
                    <motion.div
                      key={user.id}
                      layout
                      className={`relative rounded-[2.5rem] flex items-center justify-center border-2 transition-all shadow-xl overflow-hidden ${user.handRaised
                          ? "border-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.55)] ring-4 ring-amber-500/30"
                          : user.isSpeaking
                            ? "border-blue-500/80 shadow-[0_0_30px_rgba(59,130,246,0.4)] ring-4 ring-blue-500/20"
                            : "border-white/5 dark:border-[#2A2E3B]"
                        } ${user.hasVideo
                          ? "bg-black"
                          : "bg-gradient-to-br from-[#0f1117] to-[#1a1d2e]"
                        }`}
                    >
                      <div
                        ref={(el) => {
                          if (el) {
                            videoRefs.current[user.id] = el;
                          } else {
                            delete videoRefs.current[user.id];
                          }
                        }}
                        className="absolute inset-0 w-full h-full"
                      />

                      {!user.hasVideo && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <div
                            className={`w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 ring-2 ring-white/10 shadow-lg shadow-black/40 flex items-center justify-center text-3xl md:text-5xl font-black text-white shadow-2xl relative`}
                          >
                            {user.initial}
                            {user.isSpeaking && (
                              <span className="absolute -inset-3 rounded-full border-2 border-blue-500/40 animate-ping" />
                            )}
                          </div>
                        </div>
                      )}

                      <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 border border-white/20 shadow-lg z-20">
                        <div
                          className={`w-2 h-2 rounded-full ${user.isSpeaking
                            ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                            : !user.hasMic ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                            }`}
                        />
                        <span className="text-xs font-semibold text-white tracking-wide">
                          {user.name} {user.isLocal ? "(You)" : ""}
                        </span>
                        {!user.hasMic && (
                          <MicOff size={14} className="text-red-400 shrink-0" />
                        )}
                        {!user.hasVideo && (
                          <VideoOff size={14} className="text-red-400 shrink-0" />
                        )}
                        {user.handRaised && (
                          <motion.div
                            animate={{ y: [0, -3, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-amber-400 flex items-center shrink-0"
                          >
                            <Hand size={14} fill="currentColor" />
                          </motion.div>
                        )}
                      </div>

                      {user.handRaised && (
                        <div className="absolute top-8 right-8 bg-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-lg border border-amber-400/20 z-20 uppercase tracking-widest animate-bounce">
                          <Hand size={12} fill="currentColor" />
                          <span>Hand Raised</span>
                        </div>
                      )}

                      {user.isSpeaking && !user.handRaised && (
                        <div className="absolute top-8 right-8 flex items-end gap-1 h-4 z-20">
                          {[1, 2, 3, 4].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ height: [4, 16, 4] }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.5,
                                delay: i * 0.1,
                              }}
                              className="w-1 bg-blue-500 rounded-full"
                            />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom spacer for fixed control bar */}
          <div className="h-20 shrink-0" />
        </div>

        {/* ═══════════ Unified Frosted-Glass Control Bar ═══════════ */}
        <div
          className="control-bar-enter fixed bottom-6 left-1/2 z-50 flex items-center gap-1 px-3 py-2 rounded-full backdrop-blur-xl border shadow-2xl"
          style={{
            background: 'var(--control-bar-bg)',
            borderColor: 'var(--control-bar-border)',
            boxShadow: 'var(--control-bar-shadow)',
          }}
        >
          {/* ── Media Controls Group ── */}
          <button
            onClick={() => toggleMic(roomRef, isTogglingMicRef, setMuted, cleanupRef, noiseCancellationOn)}
            className={`p-3 rounded-xl transition-all duration-200 active:scale-90 hover:scale-105 ${muted
                ? "bg-red-500/20 text-red-400 dark:text-red-400 ring-1 ring-red-500/30"
                : "text-slate-600 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            aria-label={muted ? "Unmute Microphone" : "Mute Microphone"}
            data-tooltip={muted ? "Unmute" : "Mute"}
          >
            {muted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <button
            onClick={() => toggleCamera(roomRef, isTogglingCameraRef, setCameraOff)}
            className={`p-3 rounded-xl transition-all duration-200 active:scale-90 hover:scale-105 ${cameraOff
                ? "bg-red-500/20 text-red-400 dark:text-red-400 ring-1 ring-red-500/30"
                : "text-slate-600 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            aria-label={cameraOff ? "Turn On Camera" : "Turn Off Camera"}
            data-tooltip={cameraOff ? "Start Video" : "Stop Video"}
          >
            {cameraOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>

          <button
            onClick={() => toggleScreenShare(roomRef, isTogglingScreenShareRef, setScreenShareOff)}
            className={`hidden sm:flex p-3 rounded-xl transition-all duration-200 active:scale-90 hover:scale-105 ${!screenShareOff
                ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30"
                : "text-slate-600 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            aria-label={screenShareOff ? "Share Screen" : "Stop Sharing"}
            data-tooltip={screenShareOff ? "Share Screen" : "Stop Sharing"}
          >
            <MonitorUp size={20} />
          </button>

          <button
            onClick={isRecordingScreen ? stopRecording : startRecording}
            className={`hidden sm:flex p-3 rounded-xl transition-all duration-200 active:scale-90 hover:scale-105 ${
              isRecordingScreen
                ? "bg-red-500/20 text-red-500 ring-1 ring-red-500/30 animate-pulse"
                : "text-slate-600 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10"
            }`}
            aria-label={isRecordingScreen ? "Stop Recording" : "Start Recording"}
            data-tooltip={isRecordingScreen ? "Stop Recording" : "Start Recording"}
          >
            <Disc size={20} />
          </button>

          {/* ── Divider ── */}
          <div className="w-px h-6 mx-1" style={{ background: 'var(--control-divider)' }} />

          {/* ── Tools Group ── */}
          <button
            onClick={() => toggleNoiseCancellation(roomRef, cleanupRef, noiseCancellationOn, setNoiseCancellationOn, setMuted)}
            className={`hidden sm:flex p-3 rounded-xl transition-all duration-200 active:scale-90 hover:scale-105 ${noiseCancellationOn
                ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                : "text-slate-600 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            aria-label={noiseCancellationOn ? "Disable Noise Cancellation" : "Enable Noise Cancellation"}
            data-tooltip={noiseCancellationOn ? "Disable Noise Cancellation" : "Enable Noise Cancellation"}
          >
            <Waves size={20} />
          </button>

          <button
            onClick={() => {
              const nextState = !isWhiteboardOpen;
              setIsWhiteboardOpen(nextState);

              const myUserId = localStorage.getItem("userid") || sessionStorage.getItem("userid") || "";
              const myUsername = localStorage.getItem("username") || sessionStorage.getItem("username") || "Someone";

              setWhiteboardOwnerId(nextState ? myUserId : "");
              setWhiteboardOwnerName(nextState ? myUsername : "");

              if (meetingId && meeting_chat_connection.state === "Connected") {
                meeting_chat_connection.invoke(
                  "SendMeetingEvent",
                  meetingId,
                  "whiteboard:toggle",
                  JSON.stringify({
                    isOpen: nextState,
                    ownerName: myUsername,
                    ownerId: myUserId
                  })
                ).catch((err) => console.error("Failed to broadcast whiteboard state:", err));
              }
            }}
            className={`p-3 rounded-xl transition-all duration-200 active:scale-90 hover:scale-105 ${isWhiteboardOpen
                ? "bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30"
                : "text-slate-600 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            aria-label={isWhiteboardOpen ? "Close Whiteboard" : "Open Whiteboard"}
            data-tooltip={isWhiteboardOpen ? "Close Whiteboard" : "Whiteboard"}
          >
            <PenTool size={20} />
          </button>

          <button
            onClick={() => toggleTranscript()}
            className={`p-3 rounded-xl transition-all duration-200 active:scale-90 hover:scale-105 ${isCaptionsOn
                ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30"
                : "text-slate-600 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            aria-label={isCaptionsOn ? "Turn Off Captions" : "Turn On Captions"}
            data-tooltip={isCaptionsOn ? "Captions Off" : "Captions"}
          >
            <Type size={20} />
          </button>

          {/* ── PDF Export (only when whiteboard is open) ── */}
          {isWhiteboardOpen && (
            <button
              onClick={() => whiteboardRef.current?.exportPDF()}
              className="p-3 rounded-xl text-emerald-500 dark:text-emerald-400 hover:bg-emerald-500/15 dark:hover:bg-emerald-500/15 ring-1 ring-emerald-500/20 transition-all duration-200 active:scale-90 hover:scale-105"
              aria-label="Export Whiteboard as PDF"
              data-tooltip="Save as PDF"
            >
              <FileDown size={20} />
            </button>
          )}

          {/* ── Divider ── */}
          <div className="w-px h-6 mx-1" style={{ background: 'var(--control-divider)' }} />

          {/* ── Interaction Group ── */}
          <InteractionBar
            participants={participants}
            toggleRaiseHand={toggleRaiseHand}
            isLocalHandRaised={isLocalHandRaised}
            participantCount={participantCount}
            hostId={meetingInfo?.hostId || null}
          />

          {/* ── Divider ── */}
          <div className="w-px h-6 mx-1" style={{ background: 'var(--control-divider)' }} />

          {/* ── Share & Chat & Leave Group ── */}
          <button
            onClick={async () => {
              if (meetingId) {
                const res = await meetingLinkService.shareMeeting(meetingId, meetingInfo?.title);
                if (res.shared) {
                  if (res.method === "share") {
                    showToast("Shared successfully!", "success");
                  } else {
                    showToast("Invite link copied to clipboard!", "success");
                  }
                } else if (res.method !== "failed") {
                  showToast("Failed to copy link.", "error");
                }
              }
            }}
            className="p-3 rounded-xl text-slate-600 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200 active:scale-90 hover:scale-105"
            aria-label="Share Meeting"
            data-tooltip="Share Meeting"
          >
            <Share2 size={20} />
          </button>

          <button
            onClick={() => setIsChatOpen((prev) => !prev)}
            className={`p-3 rounded-xl transition-all duration-200 active:scale-90 hover:scale-105 ${isChatOpen
                ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30"
                : "text-slate-600 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            aria-label={isChatOpen ? "Close Chat" : "Open Chat"}
            data-tooltip={isChatOpen ? "Close Chat" : "Chat"}
          >
            <MessageSquare size={20} />
          </button>

          <button
            onClick={() => {
              if (isHost) {
                setShowLeaveModal(true);
              } else {
                isIntentionalExit.current = true;
                handleLeaveMeeting(roomRef, clearScheduledRenderSync, audioRefs, videoRefs, screenShareContainerRef);
                navigate("/meetings");
              }
            }}
            className="ml-1 bg-red-600 hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/25 px-5 py-2.5 rounded-full text-white font-semibold text-xs uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-all duration-200"
            aria-label="Leave Meeting"
            data-tooltip="Leave"
          >
            <PhoneOff size={18} />
          </button>
        </div>

        {/* Redesigned Chat Sidebar */}
        <AnimatePresence>
          {isChatOpen && (
            <>
              <style>{`
                .chat-messages::-webkit-scrollbar {
                  width: 4px;
                }
                .chat-messages::-webkit-scrollbar-track {
                  background: transparent;
                }
                .chat-messages::-webkit-scrollbar-thumb {
                  background: rgba(156, 163, 175, 0.15);
                  border-radius: 4px;
                }
                .chat-messages::-webkit-scrollbar-thumb:hover {
                  background: rgba(156, 163, 175, 0.25);
                }
                .dark .chat-messages::-webkit-scrollbar-thumb {
                  background: rgba(255, 255, 255, 0.15);
                }
                .dark .chat-messages::-webkit-scrollbar-thumb:hover {
                  background: rgba(255, 255, 255, 0.25);
                }
              `}</style>

              <motion.aside
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="fixed right-6 top-[64px] bottom-[96px] w-80 bg-white/95 dark:bg-[#0f1117]/95 backdrop-blur-xl border border-slate-200 dark:border-white/8 rounded-2xl flex flex-col shadow-2xl z-[100] overflow-hidden transition-colors duration-200"
              >
                {/* 1. Panel Header */}
                <div className="h-12 px-4 flex items-center justify-between bg-slate-50/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/8 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-sm font-semibold text-slate-800 dark:text-white">
                      Live Feed
                    </span>
                  </div>
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer"
                    title="Close chat"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Messages scroll area */}
                <div
                  ref={scrollContainerRef}
                  onScroll={handleScroll}
                  className="chat-messages flex-1 overflow-y-auto p-4 space-y-4 relative"
                >
                  {isLoading && messages.length === 0 ? (
                    <div className="flex-1 h-full flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 select-none">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                      Loading chat...
                    </div>
                  ) : messages.length === 0 ? (
                    /* 6. Empty State */
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 select-none">
                      <div className="p-3 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 rounded-2xl mb-2">
                        <MessageSquare size={24} />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        No messages yet
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Be the first to say something 👋
                      </p>
                    </div>
                  ) : (
                    /* 3. Message Grouping */
                    groupMessages(messages).map((group, groupIdx) => {
                      const isGroupMe = group.senderId === (localStorage.getItem("userid") || sessionStorage.getItem("userid"));

                      return (
                        <div key={groupIdx} className={`flex flex-col ${isGroupMe ? "items-end" : "items-start"} mt-4 first:mt-0`}>
                          {/* Sender Name above group */}
                          {!isGroupMe && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1 ml-9">
                              {group.senderName}
                            </span>
                          )}

                          <div className="flex items-start gap-2 w-full">
                            {/* 2. Message Bubbles - Avatar on left (only first message in group) */}
                            {!isGroupMe && (
                              <div className={`w-7 h-7 flex items-center justify-center rounded-full text-white text-xs font-semibold shrink-0 ${group.avatarColor} select-none`}>
                                {group.avatarInitial}
                              </div>
                            )}

                            <div className={`flex flex-col gap-1 flex-1 ${isGroupMe ? "items-end" : "items-start"}`}>
                              {group.messages.map((msg, msgIdx) => {
                                const isFirst = msgIdx === 0;
                                const formattedTime = msg.sentAt
                                  ? new Date(msg.sentAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
                                  : new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

                                return (
                                  <div key={msg.id ?? msgIdx} className={`flex items-end gap-2 w-full ${msgIdx > 0 ? "mt-0.5" : "mt-1 first:mt-0"}`}>
                                    {/* Spacer when avatar is not shown on subsequent messages */}
                                    {!isGroupMe && !isFirst && (
                                      <div className="w-7 h-7 shrink-0" />
                                    )}

                                    {isGroupMe && <div className="flex-1" />}

                                    <div className="group relative flex flex-col max-w-[75%] items-end">
                                      <div
                                        dir="auto"
                                        className={`px-4 py-2.5 text-sm break-words transition-all duration-200 shadow-sm
                                          ${isGroupMe
                                            ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm"
                                            : "bg-slate-100 text-slate-800 dark:bg-white/8 dark:text-white/90 rounded-2xl rounded-tl-sm"
                                          }
                                          ${!isFirst && isGroupMe ? "!rounded-tr-md" : ""}
                                          ${!isFirst && !isGroupMe ? "!rounded-tl-md" : ""}
                                        `}
                                      >
                                        {msg.content}
                                      </div>

                                      {/* Timestamp on hover */}
                                      <div className="h-0 group-hover:h-4 overflow-hidden transition-all duration-200">
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 mx-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 select-none whitespace-nowrap">
                                          {formattedTime}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Floating New Message Pill */}
                {showNewMessagePill && (
                  <div
                    onClick={scrollToBottom}
                    className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-full px-3 py-1.5 cursor-pointer shadow-lg z-30 flex items-center gap-1 select-none animate-bounce"
                  >
                    <span>↓ New message</span>
                  </div>
                )}

                {/* Live transcript integration */}
                {isCaptionsOn && (
                  <div className="p-4 border-t border-slate-200 dark:border-white/8 bg-slate-50/80 dark:bg-[#181B26] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Live Transcript
                      </h3>
                      <button
                        onClick={() => setIsCaptionsOn(false)}
                        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        Close
                      </button>
                    </div>

                    <div className="text-sm text-slate-700 dark:text-slate-200 leading-6 max-h-40 overflow-y-auto space-y-3">
                      {Object.entries(captions).length === 0 && (
                        <span className="text-slate-400 dark:text-slate-500">
                          No transcript yet...
                        </span>
                      )}

                      {Object.entries(captions).map(([trackKey, caption]) => (
                        <div key={trackKey} className="border-b border-slate-200 dark:border-slate-800 pb-2">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 mb-1">
                            {caption.participantName}
                          </div>

                          {caption.finals.length > 0 && (
                            <div>{caption.finals.join(' ')}</div>
                          )}

                          {caption.interim && (
                            <div className="italic text-slate-400 dark:text-slate-500">
                              {caption.interim}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Input Area */}
                <div className="p-3 bg-white dark:bg-[#0f1117]/95 border-t border-slate-200 dark:border-white/8 shrink-0 flex flex-col gap-2 relative">
                  <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-3 py-2 flex items-center gap-2 mx-1 transition-colors duration-200">

                    {/* Emoji Picker */}
                    <div className="relative flex items-center shrink-0">
                      <button
                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="Add emoji"
                      >
                        <Smile size={18} />
                      </button>
                      {showEmojiPicker && (
                        <div className="absolute bottom-12 left-0 bg-white dark:bg-[#181B26] border border-slate-200 dark:border-white/10 rounded-xl p-2 shadow-2xl flex gap-1.5 flex-wrap w-44 z-50">
                          {["😀", "😂", "😍", "👍", "🎉", "👏", "🔥", "❤️", "🙌", "💡", "🤔", "👋", "🚀", "✨"].map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => {
                                setNewMessage((prev) => prev + emoji);
                                setShowEmojiPicker(false);
                              }}
                              className="text-lg hover:scale-125 transition-transform p-1 cursor-pointer"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (newMessage.trim()) {
                            handleSendMessage(newMessage, meetingId, setNewMessage);
                          }
                        }
                      }}
                      rows={1}
                      className="bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 flex-1 outline-none resize-none min-h-[20px] max-h-[100px]"
                      placeholder="Message team..."
                    />

                    {newMessage.trim() && (
                      <button
                        onClick={() => handleSendMessage(newMessage, meetingId, setNewMessage)}
                        className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl p-2 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                      >
                        <Send size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </main>

      {/* Host Leave Modal */}
      <AnimatePresence>
        {showLeaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLeaveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
              className="bg-gradient-to-br from-[#0f1117] to-[#1a1d2e] border border-slate-200 dark:border-[#2A2E3B] rounded-[2.5rem] p-8 md:p-10 shadow-2xl max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-black mb-2 tracking-tight">Leave Meeting?</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                You are the host. Choose how you'd like to leave.
              </p>

              <div className="space-y-3">
                <button
                  onClick={async () => {
                    try {
                      await leaveMeetingAPI(meetingId ?? "", true);
                    } catch (e) { console.error(e); }
                    isIntentionalExit.current = true;
                    handleLeaveMeeting(roomRef, clearScheduledRenderSync, audioRefs, videoRefs, screenShareContainerRef);
                    navigate("/meetings");
                  }}
                  className="w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-red-900/20 transition-all active:scale-95"
                >
                  <PhoneOff size={18} />
                  End Meeting for All
                </button>

                <button
                  onClick={async () => {
                    try {
                      await leaveMeetingAPI(meetingId ?? "", false);
                    } catch (e) { console.error(e); }
                    isIntentionalExit.current = true;
                    handleLeaveMeeting(roomRef, clearScheduledRenderSync, audioRefs, videoRefs, screenShareContainerRef);
                    navigate("/meetings");
                  }}
                  className="w-full flex items-center justify-center gap-3 bg-slate-100 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] hover:bg-slate-200 dark:hover:bg-[#232734] py-4 rounded-2xl font-bold text-sm transition-all active:scale-95"
                >
                  Leave & Transfer Host
                </button>

                <button
                  onClick={() => setShowLeaveModal(false)}
                  className="w-full py-3 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blocker Modal */}
      <AnimatePresence>
        {showBlockerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
              className="bg-gradient-to-br from-[#0f1117] to-[#1a1d2e] border border-slate-200 dark:border-[#2A2E3B] rounded-[2.5rem] p-8 md:p-10 shadow-2xl max-w-md w-full mx-4"
            >
              <h2 className="text-xl font-black mb-2 tracking-tight">Leave Meeting?</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                Are you sure you want to leave the meeting? Your session will end.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    isIntentionalExit.current = true;
                    setShowBlockerModal(false);
                    handleLeaveMeeting(roomRef, clearScheduledRenderSync, audioRefs, videoRefs, screenShareContainerRef);
                    navigate("/meetings");
                  }}
                  className="flex-1 flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-red-900/20 transition-all active:scale-95"
                >
                  <PhoneOff size={18} />
                  Leave
                </button>

                <button
                  onClick={() => {
                    setShowBlockerModal(false);
                  }}
                  className="flex-1 py-4 bg-slate-100 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] hover:bg-slate-200 dark:hover:bg-[#232734] rounded-2xl font-bold text-sm transition-all active:scale-95 text-slate-900 dark:text-white"
                >
                  Stay
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conditionally rendered post-meeting modal */}
      <PostRecordingModal 
        isOpen={isRecordingModalOpen}
        onClose={() => {
          setIsRecordingModalOpen(false);
          clearRecording();
        }}
        recordingBlob={recordingBlob}
        meetingId={meetingId || "local"}
      />

    </div>
  );
}