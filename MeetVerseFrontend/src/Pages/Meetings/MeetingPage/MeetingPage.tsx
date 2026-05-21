import Navbar from "../../../components/LandingComponents/Navbar/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, MessageSquare, Waves, X, Send, ShieldCheck, Type, PenTool, Hand, FileDown, Link } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Participant, Room, RoomEvent, Track, TrackPublication } from "livekit-client";
import { sendChatMessage } from "../../../services/hubs/sendMeetingMessage";
import { meeting_chat_connection } from "../../../services/hubs/connections";
import { subscribeToMeeting, unsubscribeFromMeeting, onMessageReceived, onError, } from "../../../services/hubs/meetingChat";
import { GetMeetingChat } from "../../../services/getMeetingChat";
import { getLivekitToken } from "./getLivekitToken";
import { buildParticipantsList } from "./buildParticipantsList";
import { getAudioPublications, getCameraPublications, getScreenSharePublications } from "./getParticipantPublications";
import { getParticipantDisplayName } from "./getParticipantDisplayName";
import { getActiveScreenShare } from "./getActiveScreenShare";
import { createProcessedMicTrack } from "./NoiseCancellation/createProcessedMicTrack";
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
import { toggleMic } from "./MeetingControls/toggleMic";
import WhiteboardPanel from "./Whiteboard/WhiteboardPanel";
import type { WhiteboardPanelHandle } from "./Whiteboard/WhiteboardPanel";
import { useToast } from "../../../Context/ToastContext";
import { getMeeting } from "../../../services/getMeeting";
import { getMeetingParticipants } from "../../../services/getMeetingParticipants";
import { leaveMeetingAPI } from "../../../services/leaveMeetingAPI";
import { useParticipants } from "./MeetingControls/useParticipants";
import InteractionBar from "./MeetingControls/InteractionBar";

type Message = {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
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
  const [screenShareOff, setScreenShareOff] = useState(true);
  const [screenShareOwner, setScreenShareOwner] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCaptionsOn, setIsCaptionsOn] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [meetingInfo, setMeetingInfo] = useState<any>(null);
  const [isNavbarVisible, setIsNavbarVisible] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const { showToast } = useToast();

  const { participants, toggleRaiseHand, isLocalHandRaised, participantCount } = useParticipants(meetingId, users);

  const scrollRef = useRef<HTMLDivElement | null>(null);
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

  // const WS_URL = 'ws://localhost:5279/ws/transcribe';
  const WS_URL = 'wss://meetversebackend-gkdqagd4fxhxc8bk.polandcentral-01.azurewebsites.net/ws/transcribe';

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

      const socket = new WebSocket(WS_URL);
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

      if (activeScreenShare?.publication?.track) {
        attachScreenShareTrackToArea(
          activeScreenShare.publication.track, 
          screenShareContainerRef,
          activeScreenShare.isLocal,
          () => {
            if (!hasShownSelfShareToast.current) {
              try { showToast("You're sharing this tab — your preview has been hidden to prevent lag.", "warning"); } catch(e) {}
              hasShownSelfShareToast.current = true;
            }
          }
        );
      } else {
        hasShownSelfShareToast.current = false;
        removeScreenShareElement(screenShareContainerRef);
      }
    });
  };

  useEffect(() => {
    if (meetingId) {
      getMeeting(meetingId).then((info) => {
        if (info) setMeetingInfo(info);
      });
    }
  }, [meetingId, meetingInfo?.hostId]);

  useEffect(() => {
    if (meetingId) {
      const currentUserId = localStorage.getItem("userid");
      getMeetingParticipants(meetingId).then((participants) => {
        // Backend uses MeetingParticipantRole.Host = 1, Participant = 0
        console.log("getMeetingParticipants response:", participants, "currentUserId:", currentUserId);
        try { showToast(`Participants: ${participants.length} roles: ${participants.map(p => p.role).join(",")}`, "info"); } catch(e) {}
        const hostParticipant = participants.find((p) => p.role === 1 || p.role === "Host" || p.role === "host");
        if (hostParticipant && hostParticipant.userId === currentUserId) {
          setIsHost(true);
        }
        // Fallback: compare against meetingInfo.hostId if participants didn't indicate host
        try {
          if (!isHost && meetingInfo && meetingInfo.hostId && meetingInfo.hostId === currentUserId) {
            setIsHost(true);
          }
        } catch (e) {}
      });
    }
  }, [meetingId]);

  // Debug: show toast/console when host status is detected
  useEffect(() => {
    if (isHost) {
      console.log("MeetingPage: current user is host");
      try { showToast("You are the host of this meeting", "info"); } catch (e) { /* ignore */ }
    } else {
      console.log("MeetingPage: current user is not host");
    }
  }, [isHost]);

  useEffect(() => {
    let cancelled = false;

    const joinRoom = async () => {
      try {
        const token = await getLivekitToken(meetingId ?? "", state?.displayName);
        if (cancelled) return;
        const newRoom = new Room({ adaptiveStream: true, dynacast: true, });
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

          syncParticipants(newRoom);
        };

        const handleTrackUnsubscribed = (track: Track, publication: TrackPublication, participant: Participant) => {
          console.log("trackUnsubscribed:", participant.identity, track.kind, publication?.source);

          if (publication.source == Track.Source.Microphone) {
            if (isCaptionsOn) stopTranscriping(track);
            removeAudioElement(participant.identity, audioRefs);
          }

          syncParticipants(newRoom);
        };

        const handleParticipantConnected = (participant: Participant) => {
          console.log("participantConnected:", participant.identity);
          syncParticipants(newRoom);
        };

        const handleParticipantDisconnected = (participant: Participant) => {
          console.log("participantDisconnected:", participant.identity);
          const currentUserId = localStorage.getItem("userid");
          if (meetingInfo && meetingInfo.hostId === currentUserId) {
            showToast(`${getParticipantDisplayName(participant, false)} left the meeting`, 'info');
          }
          syncParticipants(newRoom);
        };

        const handleTrackPublished = (publication: TrackPublication, participant: Participant) => {
          console.log("trackPublished:", participant.identity, publication.kind, publication.source);
          syncParticipants(newRoom);
        };

        const handleTrackUnpublished = (publication: TrackPublication, participant: Participant) => {
          console.log("trackUnpublished:", participant.identity, publication.kind, publication.source);
          syncParticipants(newRoom);
        };

        const handleTrackMuted = (publication: TrackPublication, participant: Participant) => {
          console.log("trackMuted:", participant.identity, publication.kind, publication.source);
          syncParticipants(newRoom);
        };

        const handleTrackUnmuted = (publication: TrackPublication, participant: Participant) => {
          console.log("trackUnmuted:", participant.identity, publication.kind, publication.source);
          syncParticipants(newRoom);
        };

        const handleActiveSpeakersChanged = (activeSpeakers: Array<Participant>) => {
          console.log("ActiveSpeakersChanged:", activeSpeakers);
          syncParticipants(newRoom);
        };

        const handleLocalTrackPublished = (publication: TrackPublication) => {
          console.log("localTrackPublished:", publication.kind, publication.source);
          syncParticipants(newRoom);
        };

        const handleLocalTrackUnpublished = (publication: TrackPublication) => {
          console.log("localTrackUnpublished:", publication.kind, publication.source);
          syncParticipants(newRoom);
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
        await newRoom.connect("wss://meetverse-tn25w775.livekit.cloud", token);

        // if (muted) {
        //   // await newRoom.localParticipant.setMicrophoneEnabled(false);
        // }
        // else {
        //   const { localAudioTrack, cleanup } = await createProcessedMicTrack();
        //   cleanupRef.current = cleanup;
        //   await newRoom.localParticipant.publishTrack(localAudioTrack, {
        //     source: Track.Source.Microphone,
        //     name: 'processed-mic',
        //   });
        // }

        await newRoom.localParticipant.setMicrophoneEnabled(!muted);
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

  
  useEffect(() => {
    if (isChatOpen) {
      scrollRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [messages, isChatOpen]);

  return (
    <div className="h-screen bg-slate-50 dark:bg-[#0D0F16] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300 flex flex-col overflow-hidden font-sans">
      <div 
        className={`absolute top-0 left-0 w-full z-50 transition-transform duration-300 ${isNavbarVisible ? 'translate-y-0' : '-translate-y-full'}`}
        onMouseEnter={() => setIsNavbarVisible(true)}
        onMouseLeave={() => setIsNavbarVisible(false)}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md -z-10 h-[80px] pointer-events-none" style={{ opacity: isNavbarVisible ? 1 : 0, transition: 'opacity 0.3s' }} />
        <Navbar />
      </div>
      <div 
        className="absolute top-0 left-0 w-full h-[60px] z-40" 
        onMouseEnter={() => setIsNavbarVisible(true)}
      />

      <main className="flex-1 pt-6 pb-4 px-4 md:px-6 max-w-[1800px] mx-auto w-full flex gap-4 overflow-hidden relative">
        {/* Left Side: Video Grid Area */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 h-full overflow-hidden z-10">
          {/* Header Info */}
          <div className="flex items-center justify-between px-2">
            <div className="min-w-0">
              <h1 className="text-sm md:text-lg font-black flex items-center gap-2 truncate uppercase tracking-tight">
                {meetingInfo?.title || "Meeting Session"}
                <span className="px-2 py-0.5 bg-red-600 text-[9px] text-white rounded font-bold animate-pulse">
                  LIVE
                </span>
              </h1>
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
              <WhiteboardPanel meetingId={meetingId ?? ""} ref={whiteboardRef} />
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
                      className={`relative rounded-[2rem] flex items-center justify-center border-2 transition-all shadow-xl overflow-hidden min-h-[180px] ${user.isSpeaking
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

                      <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 border border-white/20 shadow-lg z-20">
                        <div
                          className={`w-2 h-2 rounded-full ${user.isSpeaking
                            ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                            : (user.isLocal && muted) ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : "bg-slate-400/50"
                            }`}
                        />
                        <span className="text-xs font-semibold text-white tracking-wide">
                          {user.name}
                        </span>
                        {user.isLocal && muted && (
                          <MicOff size={14} className="text-red-400" />
                        )}
                        {user.handRaised && (
                          <motion.div
                            animate={{ y: [0, -3, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-amber-500"
                          >
                            <Hand size={14} fill="currentColor" />
                          </motion.div>
                        )}
                      </div>

                      {user.isSpeaking && (
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
                      className={`relative rounded-[2.5rem] flex items-center justify-center border-2 transition-all shadow-xl overflow-hidden ${user.isSpeaking
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
                            : (user.isLocal && muted) ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : "bg-slate-400/50"
                            }`}
                        />
                        <span className="text-xs font-semibold text-white tracking-wide">
                          {user.name}
                        </span>
                        {user.isLocal && muted && (
                          <MicOff size={14} className="text-red-400" />
                        )}
                      </div>

                      {user.isSpeaking && (
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
            onClick={() => toggleMic(roomRef, isTogglingMicRef, setMuted)}
            className={`p-3 rounded-xl transition-all duration-200 active:scale-90 hover:scale-105 ${
              muted
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
            className={`p-3 rounded-xl transition-all duration-200 active:scale-90 hover:scale-105 ${
              cameraOff
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
            className={`hidden sm:flex p-3 rounded-xl transition-all duration-200 active:scale-90 hover:scale-105 ${
              !screenShareOff
                ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30"
                : "text-slate-600 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10"
            }`}
            aria-label={screenShareOff ? "Share Screen" : "Stop Sharing"}
            data-tooltip={screenShareOff ? "Share Screen" : "Stop Sharing"}
          >
            <MonitorUp size={20} />
          </button>

          {/* ── Divider ── */}
          <div className="w-px h-6 mx-1" style={{ background: 'var(--control-divider)' }} />

          {/* ── Tools Group ── */}
          <button
            className="hidden sm:flex p-3 rounded-xl text-slate-600 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200 hover:scale-105"
            aria-label="Noise Suppression"
            data-tooltip="Noise Suppression"
          >
            <Waves size={20} />
          </button>

          <button
            onClick={() => {
              setIsWhiteboardOpen(!isWhiteboardOpen);
              if (screenShareOff === false) {
                toggleScreenShare(roomRef, isTogglingScreenShareRef, setScreenShareOff);
              }
            }}
            className={`p-3 rounded-xl transition-all duration-200 active:scale-90 hover:scale-105 ${
              isWhiteboardOpen
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
            className={`p-3 rounded-xl transition-all duration-200 active:scale-90 hover:scale-105 ${
              isCaptionsOn
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
          />

          {/* ── Divider ── */}
          <div className="w-px h-6 mx-1" style={{ background: 'var(--control-divider)' }} />

          {/* ── Chat & Leave Group ── */}
          <button
            onClick={() => setIsChatOpen((prev) => !prev)}
            className={`p-3 rounded-xl transition-all duration-200 active:scale-90 hover:scale-105 ${
              isChatOpen
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

        {/* Chat Sidebar */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.aside
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 120 }}
              className="fixed bottom-4 right-4 left-4 top-20 lg:relative lg:top-0 lg:left-0 lg:right-0 lg:w-[320px] xl:w-[360px] bg-gradient-to-br from-[#0f1117] to-[#1a1d2e] border border-slate-200 dark:border-[#2A2E3B] rounded-[3rem] flex flex-col shadow-2xl z-[100] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                <h2 className="font-black text-sm flex items-center gap-2 uppercase tracking-tighter">
                  <MessageSquare size={16} className="text-blue-600" />
                  Live Feed
                </h2>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isLoading && messages.length === 0 ? (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Loading chat...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    No messages yet.
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = (msg.senderId === localStorage.getItem("userid"));

                    return (
                      <div
                        key={msg.id ?? `${msg.senderName}-${index}`}
                        className={`space-y-2 ${isMe ? "text-right" : ""}`}
                      >
                        {!isMe && (
                          <div className="flex items-center gap-2">
                            <div className="size-6 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] font-bold text-white">
                              {msg.senderName?.charAt(0)}
                            </div>

                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              {msg.senderName}
                            </span>
                          </div>
                        )}

                        {isMe && (
                          <span className="text-[9px] font-black text-slate-300 uppercase mr-2 tracking-widest">
                            You
                          </span>
                        )}

                        <div
                          className={`p-4 rounded-[1.8rem] text-[13px] shadow-sm inline-block
        ${isMe
                              ? "bg-blue-600 text-white rounded-tr-none shadow-xl shadow-blue-900/10 text-left"
                              : "bg-slate-100 dark:bg-[#0D0F16] rounded-tl-none"
                            }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={scrollRef} />
              </div>

              {isCaptionsOn && (
                <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-white/80 dark:bg-[#0F1115] transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Live Transcript
                    </h3>
                    <button
                      onClick={() => setIsCaptionsOn(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
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
                      <div key={trackKey} className="border-b border-slate-200 dark:border-slate-700 pb-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 mb-1">
                          {caption.participantName}
                        </div>

                        {caption.finals.length > 0 && (
                          <div>{caption.finals[caption.finals.length - 1]}</div>
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

              <div className="p-6 bg-slate-50 dark:bg-black/10 border-t border-slate-100 dark:border-white/5">
                <div className="relative group">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSendMessage(newMessage, meetingId, setNewMessage);
                      }
                    }}
                    className="w-full bg-white dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl py-4 pl-5 pr-14 text-sm outline-none focus:border-blue-600 transition-all shadow-inner"
                    placeholder="Message team..."
                  />
                  <button
                    onClick={() => handleSendMessage(newMessage, meetingId, setNewMessage)}
                    className="absolute right-2 top-2 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg active:scale-90 transition-all"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </motion.aside>
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

    </div>
  );
}