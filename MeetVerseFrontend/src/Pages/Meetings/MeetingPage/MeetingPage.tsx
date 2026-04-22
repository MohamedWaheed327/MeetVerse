import Navbar from "../../../components/LandingComponents/Navbar/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, MessageSquare, Waves, X, Send, ShieldCheck, Type, } from "lucide-react";
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const roomRef = useRef<Room | null>(null);
  const videoRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const screenShareContainerRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(false);
  const cleanupRef = useRef<null | (() => Promise<void>)>(null);

  const isTogglingCameraRef = useRef(false);
  const isTogglingMicRef = useRef(false);
  const isTogglingScreenShareRef = useRef(false);

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

  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalLines, setFinalLines] = useState<any[]>([]);
  const [status, setStatus] = useState('Idle');
  const [error, setError] = useState('');

  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const WS_URL = 'ws://localhost:5279/ws/transcribe';

  const startRecording = async () => {
    try {
      setError('');
      setStatus('Requesting microphone...');
      setFinalLines([]);
      setInterimText('');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const socket = new WebSocket(WS_URL);
      socket.binaryType = 'arraybuffer';
      socketRef.current = socket;

      socket.onopen = async () => {
        setStatus('Connected. Listening...');

        let options = undefined;

        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        }

        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;

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

          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
          }
        };

        // emit chunks every 250ms
        mediaRecorder.start(250);
        setIsRecording(true);
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'transcript') {
            if (msg.isFinal) {
              console.log(msg.text);
              setFinalLines((prev) => [msg.text]);
              // setFinalLines(msg.text);
              setInterimText('');
            } else {
              setInterimText(msg.text);
            }
          }
        } catch (err) {
          console.error('Invalid WS message:', err);
        }
      };

      socket.onerror = () => {
        setError('WebSocket connection failed');
        setStatus('Error');
      };

      socket.onclose = () => {
        setStatus('Stopped');
        setIsRecording(false);
      };
    } catch (err) {
      console.error(err);
      setError('Microphone access denied or unavailable');
      setStatus('Error');
    }
  };

  const stopRecording = () => {
    setStatus('Stopping...');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      setIsRecording(false);
    }
  };

  ////////////////////

  const detachTrack = (track: Track) => {
    if (!track) return;

    track.detach().forEach((el) => {
      try {
        el.srcObject = null;
      } catch { }
      el.remove();
    });
  };

  const syncParticipants = (liveRoom: Room) => {
    if (!liveRoom || !mountedRef.current) return;

    const updatedUsers = buildParticipantsList(liveRoom);
    const activeScreenShare = getActiveScreenShare(liveRoom, null);

    setUsers(updatedUsers);
    setCameraOff(!liveRoom.localParticipant.isCameraEnabled);
    setMuted(!liveRoom.localParticipant.isMicrophoneEnabled);
    setScreenShareOff(!activeScreenShare);
    setScreenShareOwner(
      activeScreenShare
        ? getParticipantDisplayName(
          activeScreenShare.participant as Participant,
          activeScreenShare.isLocal
        )
        : ""
    );

    runAfterRender(() => {
      if (!mountedRef.current || !liveRoom) return;

      const allParticipants = [
        liveRoom.localParticipant,
        ...Array.from(liveRoom.remoteParticipants.values()),
      ];

      const activeIds = new Set(allParticipants.map((p) => p.identity));

      allParticipants.forEach((participant) => {
        const preferredVideoPub =
          getPreferredParticipantVideoPublication(participant);

        if (!preferredVideoPub?.track) {
          removeCameraElement(participant.identity, videoRefs);
          return;
        }

        attachCameraTrackToElement(
          preferredVideoPub.track,
          participant.identity, videoRefs
        );
      });

      Object.keys(videoRefs.current).forEach((participantId) => {
        if (!activeIds.has(participantId)) {
          removeCameraElement(participantId, videoRefs);
        }
      });

      if (activeScreenShare?.publication?.track) {
        attachScreenShareTrackToArea(activeScreenShare.publication.track, screenShareContainerRef);
      } else {
        removeScreenShareElement(screenShareContainerRef);
      }
    });
  };

  useEffect(() => {
    mountedRef.current = true;

    let activeRoom: Room;
    let cancelled = false;

    const joinRoom = async () => {
      try {
        const token = await getLivekitToken(meetingId ?? "", state?.displayName);
        if (cancelled) return;
        const newRoom = new Room({ adaptiveStream: true, dynacast: true, });

        activeRoom = newRoom;
        roomRef.current = newRoom;

        const handleTrackSubscribed = (track: Track, publication: TrackPublication, participant: Participant) => {
          console.log("trackSubscribed:", participant.identity, track.kind, publication?.source);

          if (publication.source == Track.Source.Microphone) {
            attachAudioTrack(track, participant.identity, audioRefs);
          }

          syncParticipants(newRoom);
        };

        const handleTrackUnsubscribed = (track: Track, publication: TrackPublication, participant: Participant) => {
          console.log("trackUnsubscribed:", participant.identity, track.kind, publication?.source);

          if (publication.source == Track.Source.Microphone) {
            removeAudioElement(participant.identity, audioRefs);
          }

          if (publication.source == Track.Source.Camera) {
            removeCameraElement(participant.identity, videoRefs);
          }

          if (publication.source == Track.Source.ScreenShare) {
            removeScreenShareElement(screenShareContainerRef);
          }

          detachTrack(track);
          syncParticipants(newRoom);
        };

        const handleParticipantConnected = (participant: Participant) => {
          console.log("participantConnected:", participant.identity);
          syncParticipants(newRoom);
        };

        const handleParticipantDisconnected = (participant: Participant) => {
          console.log("participantDisconnected:", participant.identity);
          removeCameraElement(participant.identity, videoRefs);
          removeAudioElement(participant.identity, audioRefs);
          syncParticipants(newRoom);
        };

        const handleTrackPublished = (publication: TrackPublication, participant: Participant) => {
          console.log("trackPublished:", participant.identity, publication.kind, publication.source);
          syncParticipants(newRoom);
        };

        const handleTrackUnpublished = (publication: TrackPublication, participant: Participant) => {
          console.log("trackUnpublished:", participant.identity, publication.kind, publication.source);

          if (publication.source == Track.Source.Camera) {
            removeCameraElement(participant.identity, videoRefs);
          }

          if (publication.source == Track.Source.ScreenShare) {
            removeScreenShareElement(screenShareContainerRef);
          }

          syncParticipants(newRoom);
        };

        const handleTrackMuted = (publication: TrackPublication, participant: Participant) => {
          console.log("trackMuted:", participant.identity, publication.kind, publication.source);

          if (publication.source == Track.Source.Camera) {
            removeCameraElement(participant.identity, videoRefs);
          }

          if (publication.source == Track.Source.ScreenShare) {
            removeScreenShareElement(screenShareContainerRef);
          }

          syncParticipants(newRoom);
        };

        const handleTrackUnmuted = (publication: TrackPublication, participant: Participant) => {
          console.log("trackUnmuted:", participant.identity, publication.kind, publication.source);
          syncParticipants(newRoom);
        };

        const handleActiveSpeakersChanged = () => {
          syncParticipants(newRoom);
        };

        const handleLocalTrackPublished = (publication: TrackPublication) => {
          console.log("localTrackPublished:", publication.kind, publication.source);
          syncParticipants(newRoom);
        };

        const handleLocalTrackUnpublished = (publication: TrackPublication) => {
          console.log("localTrackUnpublished:", publication.kind, publication.source);

          if (publication.source == Track.Source.Camera) {
            removeCameraElement(newRoom.localParticipant.identity, videoRefs);
          }

          if (publication.source == Track.Source.ScreenShare) {
            removeScreenShareElement(screenShareContainerRef);
          }

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
      mountedRef.current = false;
      clearScheduledRenderSync();

      if (activeRoom) {
        try {
          activeRoom.disconnect();
        } catch (err) {
          console.error("Room disconnect error:", err);
        }
      }

      // cleanupRef.current?.();
      cleanupMediaElements(audioRefs, videoRefs, screenShareContainerRef);
      roomRef.current = null;
    };
  }, [meetingId]);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const history = await GetMeetingChat({ meetingId: meetingId ?? "" });
        setMessages(history || []);
      } catch (err) {
        console.error("Failed to load chat history:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (meetingId) {
      loadHistory();
    }
  }, [meetingId]);

  useEffect(() => {
    if (isChatOpen) {
      scrollRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [messages, isChatOpen]);

  useEffect(() => {
    const start = async () => {
      try {
        if (meeting_chat_connection.state === HubConnectionState.Disconnected) {
          await meeting_chat_connection.start();
        }

        await subscribeToMeeting(meetingId ?? "");

        onMessageReceived((payload: Message) => {
          setMessages((prev) => [...prev, payload]);
        });

        onError((err: unknown) => {
          console.error("SignalR Error:", err);
        });
      } catch (err) {
        console.error("Connection error:", err);
      }
    };

    start();

    return () => {
      unsubscribeFromMeeting(meetingId ?? "");
      meeting_chat_connection.off("MessageSent");
      meeting_chat_connection.off("Error");
    };
  }, [meetingId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await sendChatMessage(meetingId ?? "", newMessage.trim());
      setNewMessage("");
    } catch (err) {
      console.error("Send failed:", err);
    }
  };

  const toggleScreenShare = async () => {
    const liveRoom = roomRef.current;
    if (!liveRoom || isTogglingScreenShareRef.current) return;

    isTogglingScreenShareRef.current = true;

    try {
      const shouldEnable = !liveRoom.localParticipant.isScreenShareEnabled;

      await liveRoom.localParticipant.setScreenShareEnabled(shouldEnable);

      setScreenShareOff(!shouldEnable);

      console.log("🖥️ Screen share state:", shouldEnable);
    } catch (err) {
      console.error("❌ Failed to toggle screen share:", err);
    } finally {
      isTogglingScreenShareRef.current = false;
    }
  };

  const toggleCamera = async () => {
    const liveRoom = roomRef.current;
    if (!liveRoom || isTogglingCameraRef.current) return;

    isTogglingCameraRef.current = true;

    try {
      const shouldEnable = !liveRoom.localParticipant.isCameraEnabled;
      await liveRoom.localParticipant.setCameraEnabled(shouldEnable);
      setCameraOff(!shouldEnable);

      console.log("📷 Camera state:", shouldEnable);
    } catch (err) {
      console.error("❌ Failed to toggle camera:", err);
    } finally {
      isTogglingCameraRef.current = false;
    }
  };

  const toggleMic = async () => {
    const liveRoom = roomRef.current;
    if (!liveRoom || isTogglingMicRef.current) return;

    isTogglingMicRef.current = true;

    try {
      const shouldEnable = !liveRoom.localParticipant.isMicrophoneEnabled;

      // if (shouldEnable) {
      //   const { localAudioTrack, cleanup } = await createProcessedMicTrack();
      //   cleanupRef.current = cleanup;
      //   await liveRoom.localParticipant.publishTrack(localAudioTrack, {
      //     source: Track.Source.Microphone,
      //     name: 'processed-mic',
      //   });
      // }
      // else {
      //   Array.from(liveRoom.localParticipant.trackPublications.values()).forEach(async (pub) => {
      //     if (pub.track) {
      //       await liveRoom.localParticipant.unpublishTrack(pub.track);
      //     }
      //   });
      // }

      await liveRoom.localParticipant.setMicrophoneEnabled(shouldEnable);
      setMuted(!shouldEnable);

      console.log("🎤 Mic state:", shouldEnable);
    } catch (err) {
      console.error("❌ Failed to toggle microphone:", err);
    } finally {
      isTogglingMicRef.current = false;
    }
  };

  const toggleTranscript = async () => {
    if (isRecording) {
      stopRecording();
    }
    else {
      startRecording();
    }
  };

  const handleLeaveMeeting = () => {
    try {
      roomRef.current?.disconnect();
    } catch (err) {
      console.error("Leave meeting disconnect error:", err);
    } finally {
      cleanupMediaElements(audioRefs, videoRefs, screenShareContainerRef);
      navigate("/meetings");
    }
  };

  return (
    <div className="h-screen bg-slate-50 dark:bg-[#0D0F16] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300 flex flex-col overflow-hidden font-sans">
      <Navbar />

      <main className="flex-1 pt-20 pb-4 px-4 md:px-6 max-w-[1800px] mx-auto w-full flex gap-4 overflow-hidden relative">
        {/* Left Side: Video Grid Area */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 h-full overflow-hidden z-10">
          {/* Header Info */}
          <div className="flex items-center justify-between px-2">
            <div className="min-w-0">
              <h1 className="text-sm md:text-lg font-black flex items-center gap-2 truncate uppercase tracking-tight">
                Project DevHub Sync
                <span className="px-2 py-0.5 bg-red-600 text-[9px] text-white rounded font-bold animate-pulse">
                  LIVE
                </span>
              </h1>
            </div>

            <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/10 px-4 py-2 rounded-2xl border border-blue-100 dark:border-blue-800/30 shadow-sm">
              <ShieldCheck size={14} className="text-blue-600" />
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest hidden sm:block">
                AI Audio Shield Active
              </span>
            </div>
          </div>

          {/* Video / Screen Share Layout */}
          <div className="flex-1 p-2 min-h-0 overflow-hidden">
            {!screenShareOff ? (
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4 w-full h-full">
                {/* Screen share area */}
                <div className="relative rounded-[2.5rem] border-2 border-white dark:border-[#2A2E3B] bg-black overflow-hidden shadow-xl min-h-[300px]">
                  <div
                    ref={screenShareContainerRef}
                    className="absolute inset-0 w-full h-full"
                  />

                  <div className="absolute top-5 left-5 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 z-20">
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">
                      Presenting Screen
                      {screenShareOwner ? ` • ${screenShareOwner}` : ""}
                    </span>
                  </div>
                </div>

                {/* Participants sidebar */}
                <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-1 gap-3 h-full overflow-hidden">
                  {users.map((user) => (
                    <motion.div
                      key={user.id}
                      layout
                      className={`relative rounded-[2rem] flex items-center justify-center border-2 transition-all shadow-xl overflow-hidden min-h-[180px] ${user.isSpeaking
                        ? "border-blue-500 ring-4 ring-blue-500/10"
                        : "border-white dark:border-[#2A2E3B]"
                        } ${user.hasVideo
                          ? "bg-black"
                          : "bg-white dark:bg-[#181B26]"
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
                            className={`w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br ${user.color} flex items-center justify-center text-2xl md:text-4xl font-black text-white shadow-2xl relative`}
                          >
                            {user.initial}
                            {user.isSpeaking && (
                              <span className="absolute -inset-3 rounded-full border-2 border-blue-500/40 animate-ping" />
                            )}
                          </div>
                        </div>
                      )}

                      <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-xl px-3 py-2 rounded-2xl flex items-center gap-2 border border-white/10 shadow-2xl z-20">
                        <div
                          className={`w-2 h-2 rounded-full ${user.isSpeaking
                            ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                            : "bg-slate-400"
                            }`}
                        />
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">
                          {user.name}
                        </span>
                        {user.isLocal && muted && (
                          <MicOff size={14} className="text-red-400" />
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
              <div className="flex items-center justify-center h-full overflow-hidden">
                <div className="grid grid-cols-2 gap-3 md:gap-5 w-full h-full max-w-[1000px] max-h-[700px]">
                  {users.map((user) => (
                    <motion.div
                      key={user.id}
                      layout
                      className={`relative rounded-[2.5rem] flex items-center justify-center border-2 transition-all shadow-xl overflow-hidden ${user.isSpeaking
                        ? "border-blue-500 ring-4 ring-blue-500/10"
                        : "border-white dark:border-[#2A2E3B]"
                        } ${user.hasVideo
                          ? "bg-black"
                          : "bg-white dark:bg-[#181B26]"
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
                            className={`w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-br ${user.color} flex items-center justify-center text-3xl md:text-5xl font-black text-white shadow-2xl relative`}
                          >
                            {user.initial}
                            {user.isSpeaking && (
                              <span className="absolute -inset-3 rounded-full border-2 border-blue-500/40 animate-ping" />
                            )}
                          </div>
                        </div>
                      )}

                      <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl flex items-center gap-3 border border-white/10 shadow-2xl z-20">
                        <div
                          className={`w-2 h-2 rounded-full ${user.isSpeaking
                            ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                            : "bg-slate-400"
                            }`}
                        />
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">
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

          {/* Action Controls */}
          <div className="bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] p-4 rounded-[2.5rem] shadow-2xl flex items-center justify-between gap-4 mx-auto w-fit md:w-full max-w-4xl backdrop-blur-md">
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={toggleMic}
                className={`p-4 rounded-2xl transition-all shadow-md active:scale-90 ${muted
                  ? "bg-red-500 text-white shadow-red-500/20"
                  : "bg-slate-100 dark:bg-[#2A2E3B] hover:bg-slate-200 dark:hover:bg-[#353A4D]"
                  }`}
              >
                {muted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>

              <button
                onClick={toggleCamera}
                className={`p-4 rounded-2xl transition-all shadow-md active:scale-90 ${cameraOff
                  ? "bg-red-500 text-white shadow-red-500/20"
                  : "bg-slate-100 dark:bg-[#2A2E3B] hover:bg-slate-200 dark:hover:bg-[#353A4D]"
                  }`}
              >
                {cameraOff ? <VideoOff size={22} /> : <Video size={22} />}
              </button>

              <button
                onClick={toggleScreenShare}
                className={`hidden sm:flex p-4 rounded-2xl transition-all shadow-md active:scale-90 ${screenShareOff
                  ? "bg-slate-100 dark:bg-[#2A2E3B] hover:bg-blue-600 hover:text-white"
                  : "bg-blue-600 text-white shadow-blue-600/30"
                  }`}
              >
                <MonitorUp size={22} />
              </button>

              <button className="hidden sm:flex p-4 rounded-2xl bg-slate-100 dark:bg-[#2A2E3B] hover:bg-emerald-600 hover:text-white transition-all shadow-md">
                <Waves size={22} />
              </button>

              <button
                onClick={() => {
                  toggleTranscript();
                  setIsCaptionsOn((prev) => !prev);
                }}
                className={`p-4 rounded-2xl transition-all shadow-md active:scale-90 ${isCaptionsOn
                  ? "bg-blue-600 text-white shadow-blue-600/30"
                  : "bg-slate-100 dark:bg-[#2A2E3B] hover:bg-slate-200 dark:hover:bg-[#353A4D]"
                  }`}
                title="Captions"
              >
                <Type size={22} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsChatOpen((prev) => !prev)}
                className={`p-4 rounded-2xl transition-all shadow-md flex items-center gap-2 ${isChatOpen
                  ? "bg-blue-600 text-white shadow-blue-600/30"
                  : "bg-slate-100 dark:bg-[#2A2E3B] hover:bg-slate-200 dark:hover:bg-[#353A4D]"
                  }`}
              >
                <MessageSquare size={22} />
                <span className="hidden md:block text-xs font-bold uppercase tracking-widest">
                  Chat
                </span>
              </button>

              <button
                onClick={handleLeaveMeeting}
                className="bg-red-600 hover:bg-red-700 px-6 md:px-8 py-4 rounded-2xl text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-red-900/30 flex items-center gap-3 active:scale-95 transition-all"
              >
                <PhoneOff size={22} />
                <span className="hidden lg:block">Leave</span>
              </button>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.aside
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 120 }}
              className="fixed bottom-4 right-4 left-4 top-20 lg:relative lg:top-0 lg:left-0 lg:right-0 lg:w-[320px] xl:w-[360px] bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[3rem] flex flex-col shadow-2xl z-[100] overflow-hidden"
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
                          <span className="text-[9px] font-black text-blue-600 uppercase mr-2 tracking-widest">
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

              <div className="p-6 bg-slate-50 dark:bg-black/10 border-t border-slate-100 dark:border-white/5">
                <div className="relative group">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSendMessage();
                      }
                    }}
                    className="w-full bg-white dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl py-4 pl-5 pr-14 text-sm outline-none focus:border-blue-600 transition-all shadow-inner"
                    placeholder="Message team..."
                  />
                  <button
                    onClick={handleSendMessage}
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

      <div className="px-4 md:px-6 pb-3">
        <div className="max-w-4xl mx-auto bg-white/80 dark:bg-[#181B26]/80 backdrop-blur-md border border-slate-200 dark:border-[#2A2E3B] rounded-2xl px-4 py-3 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Live Transcript
            </h3>
          </div>

          <div className="text-sm text-slate-700 dark:text-slate-200 leading-6 max-h-24 overflow-y-auto">
            {finalLines.length > 0 && (
              <span>{finalLines[finalLines.length - 1]}</span>
            )}

            {interimText && (
              <span className="italic text-slate-400 dark:text-slate-500 ml-2">
                {interimText}
              </span>
            )}

            {!finalLines.length && !interimText && (
              <span className="text-slate-400 dark:text-slate-500">
                No transcript yet...
              </span>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}