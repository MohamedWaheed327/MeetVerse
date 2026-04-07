import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  PhoneOff,
  MessageSquare,
  Waves,
  X,
  Send,
  ShieldCheck,
  Type,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import { Room } from "livekit-client";
import { getCurrentUser } from "../../services/currentUser";
import { sendChatMessage } from "../../services//hubs/sendMeetingMessage";
import connection from "../../services/hubs/connections";
import {
  subscribeToMeeting,
  unsubscribeFromMeeting,
  onMessageReceived,
  onError,
} from "../../services/hubs/meetingChat";
import { GetMeetingChat } from "../../services/meetingChatMessage";

export default function MeetingPage() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [muted, setMuted] = useState(state?.muteMic ?? true);
  const [cameraOff, setCameraOff] = useState(state?.cameraOff ?? true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCaptionsOn, setIsCaptionsOn] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [room, setRoom] = useState(null);
  const [users, setUsers] = useState([]);

  const scrollRef = useRef(null);
  const roomRef = useRef(null);
  const videoRefs = useRef({});
  const audioRefs = useRef({});
  const mountedRef = useRef(false);
  const isTogglingCameraRef = useRef(false);
  const isTogglingMicRef = useRef(false);
  const rafRefs = useRef({ first: null, second: null });

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: "auto" });
  };

  const clearScheduledRenderSync = () => {
    if (rafRefs.current.first) {
      cancelAnimationFrame(rafRefs.current.first);
    }
    if (rafRefs.current.second) {
      cancelAnimationFrame(rafRefs.current.second);
    }
    rafRefs.current = { first: null, second: null };
  };

  const runAfterRender = (cb) => {
    clearScheduledRenderSync();

    rafRefs.current.first = requestAnimationFrame(() => {
      rafRefs.current.second = requestAnimationFrame(() => {
        cb();
        rafRefs.current = { first: null, second: null };
      });
    });
  };

  const getVideoPublications = (participant) =>
    Array.from(participant?.videoTrackPublications?.values?.() || []);

  const getAudioPublications = (participant) =>
    Array.from(participant?.audioTrackPublications?.values?.() || []);

  const hasEnabledVideoTrack = (participant) =>
    getVideoPublications(participant).some((pub) => pub.track && !pub.isMuted);

  const hasEnabledAudioTrack = (participant) =>
    getAudioPublications(participant).some((pub) => pub.track && !pub.isMuted);

  const getPreferredVideoPublication = (participant) => {
    const pubs = getVideoPublications(participant);

    return (
      pubs.find((pub) => pub.track && !pub.isMuted && pub.source === "camera") ||
      pubs.find((pub) => pub.track && !pub.isMuted) ||
      null
    );
  };

  const attachTrackToElement = (track, participantId) => {
    const container = videoRefs.current[participantId];
    if (!container || track.kind !== "video") return;

    // remove old video in that card
    container.querySelectorAll("video").forEach((el) => {
      try {
        el.srcObject = null;
      } catch { }
      el.remove();
    });

    const element = track.attach();
    element.id = `video-player-${participantId}`;
    element.autoplay = true;
    element.playsInline = true;
    element.muted =
      participantId === roomRef.current?.localParticipant?.identity;

    element.className =
      "absolute inset-0 w-full h-full object-cover rounded-[2.5rem]";

    container.appendChild(element);
  };

  const removeVideoElement = (participantId) => {
    const container = videoRefs.current[participantId];
    if (!container) return;

    container.querySelectorAll("video").forEach((video) => {
      try {
        video.srcObject = null;
      } catch { }
      video.remove();
    });
  };

  const attachAudioTrack = (track, participantId) => {
    if (track.kind !== "audio") return;

    removeAudioElement(participantId);

    const audioElement = track.attach();
    audioElement.autoplay = true;
    audioElement.playsInline = true;
    audioElement.style.display = "none";
    audioElement.setAttribute("data-participant-id", participantId);

    document.body.appendChild(audioElement);
    audioRefs.current[participantId] = audioElement;
  };

  const removeAudioElement = (participantId) => {
    const audioElement = audioRefs.current[participantId];
    if (!audioElement) return;

    try {
      audioElement.srcObject = null;
    } catch { }

    audioElement.remove();
    delete audioRefs.current[participantId];
  };

  const detachTrack = (track) => {
    if (!track) return;
    track.detach().forEach((el) => {
      try {
        el.srcObject = null;
      } catch { }
      el.remove();
    });
  };

  const buildParticipantsList = (liveRoom) => {
    if (!liveRoom) return [];

    const colorPool = [
      "from-blue-600 to-indigo-700",
      "from-purple-600 to-pink-600",
      "from-emerald-600 to-teal-600",
      "from-orange-600 to-red-600",
      "from-cyan-600 to-blue-600",
      "from-fuchsia-600 to-rose-600",
    ];

    const localParticipant = liveRoom.localParticipant;

    const localUser = {
      id: localParticipant.identity,
      name: `${localParticipant.name || "You"} (You)`,
      initial: localParticipant.name?.charAt(0)?.toUpperCase() || "Y",
      color: colorPool[0],
      isSpeaking: localParticipant.isSpeaking || false,
      isLocal: true,
      hasVideo: hasEnabledVideoTrack(localParticipant),
    };

    const remoteUsers = Array.from(liveRoom.remoteParticipants.values()).map(
      (participant, index) => ({
        id: participant.identity,
        name: participant.name || "User",
        initial: participant.name?.charAt(0)?.toUpperCase() || "U",
        color: colorPool[(index + 1) % colorPool.length],
        isSpeaking: participant.isSpeaking || false,
        isLocal: false,
        hasVideo: hasEnabledVideoTrack(participant),
      })
    );

    return [localUser, ...remoteUsers];
  };

  const syncParticipants = (liveRoom) => {
    if (!liveRoom || !mountedRef.current) return;

    const updatedUsers = buildParticipantsList(liveRoom);

    setUsers(updatedUsers);
    setCameraOff(!hasEnabledVideoTrack(liveRoom.localParticipant));
    setMuted(!hasEnabledAudioTrack(liveRoom.localParticipant));

    runAfterRender(() => {
      if (!mountedRef.current || !liveRoom) return;

      const allParticipants = [
        liveRoom.localParticipant,
        ...Array.from(liveRoom.remoteParticipants.values()),
      ];

      const activeIds = new Set(allParticipants.map((p) => p.identity));

      allParticipants.forEach((participant) => {
        const preferredVideoPub = getPreferredVideoPublication(participant);

        if (!preferredVideoPub?.track) {
          removeVideoElement(participant.identity);
          return;
        }

        attachTrackToElement(preferredVideoPub.track, participant.identity);
      });

      // cleanup stale video refs for participants who left
      Object.keys(videoRefs.current).forEach((participantId) => {
        if (!activeIds.has(participantId)) {
          removeVideoElement(participantId);
        }
      });
    });
  };

  const cleanupMediaElements = () => {
    Object.keys(videoRefs.current).forEach((participantId) => {
      removeVideoElement(participantId);
    });

    Object.keys(audioRefs.current).forEach((participantId) => {
      removeAudioElement(participantId);
    });
  };

  useEffect(() => {
    mountedRef.current = true;

    let activeRoom = null;
    let cancelled = false;

    const joinRoom = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (cancelled) return;

        const response = await api.get("/livekit/token", {
          params: {
            username: `user_${currentUser.id}`,
            room: meetingId,
            displayName: state?.displayName ?? currentUser.name,
            avatar: currentUser.avatarUrl,
          },
        });

        if (cancelled) return;

        const token = response.data.token;

        const newRoom = new Room({
          adaptiveStream: true,
          dynacast: true,
        });

        activeRoom = newRoom;
        roomRef.current = newRoom;
        setRoom(newRoom);

        const handleTrackSubscribed = (track, publication, participant) => {
          console.log("trackSubscribed:", participant.identity, track.kind);

          if (track.kind === "audio") {
            attachAudioTrack(track, participant.identity);
          }

          syncParticipants(newRoom);
        };

        const handleTrackUnsubscribed = (track, publication, participant) => {
          console.log("trackUnsubscribed:", participant.identity, track.kind);

          if (track.kind === "audio") {
            removeAudioElement(participant.identity);
          }

          if (track.kind === "video") {
            removeVideoElement(participant.identity);
          }

          detachTrack(track);
          syncParticipants(newRoom);
        };

        const handleParticipantConnected = (participant) => {
          console.log("participantConnected:", participant.identity);
          syncParticipants(newRoom);
        };

        const handleParticipantDisconnected = (participant) => {
          console.log("participantDisconnected:", participant.identity);
          removeVideoElement(participant.identity);
          removeAudioElement(participant.identity);
          syncParticipants(newRoom);
        };

        const handleTrackPublished = (publication, participant) => {
          console.log(
            "trackPublished:",
            participant.identity,
            publication.kind
          );
          syncParticipants(newRoom);
        };

        const handleTrackUnpublished = (publication, participant) => {
          console.log(
            "trackUnpublished:",
            participant.identity,
            publication.kind
          );

          if (publication.kind === "video") {
            removeVideoElement(participant.identity);
          }

          syncParticipants(newRoom);
        };

        const handleTrackMuted = (publication, participant) => {
          console.log("trackMuted:", participant.identity, publication.kind);

          if (publication.kind === "video") {
            removeVideoElement(participant.identity);
          }

          syncParticipants(newRoom);
        };

        const handleTrackUnmuted = (publication, participant) => {
          console.log("trackUnmuted:", participant.identity, publication.kind);
          syncParticipants(newRoom);
        };

        const handleActiveSpeakersChanged = () => {
          syncParticipants(newRoom);
        };

        const handleLocalTrackPublished = (publication) => {
          console.log("localTrackPublished:", publication.kind);
          syncParticipants(newRoom);
        };

        const handleLocalTrackUnpublished = (publication) => {
          console.log("localTrackUnpublished:", publication.kind);

          if (publication.kind === "video") {
            removeVideoElement(newRoom.localParticipant.identity);
          }

          syncParticipants(newRoom);
        };

        newRoom.on("trackSubscribed", handleTrackSubscribed);
        newRoom.on("trackUnsubscribed", handleTrackUnsubscribed);
        newRoom.on("participantConnected", handleParticipantConnected);
        newRoom.on("participantDisconnected", handleParticipantDisconnected);
        newRoom.on("trackPublished", handleTrackPublished);
        newRoom.on("trackUnpublished", handleTrackUnpublished);
        newRoom.on("trackMuted", handleTrackMuted);
        newRoom.on("trackUnmuted", handleTrackUnmuted);
        newRoom.on("activeSpeakersChanged", handleActiveSpeakersChanged);
        newRoom.on("localTrackPublished", handleLocalTrackPublished);
        newRoom.on("localTrackUnpublished", handleLocalTrackUnpublished);

        await newRoom.connect("wss://meetverse-tn25w775.livekit.cloud", token);

        // default states when entering
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

      cleanupMediaElements();
      roomRef.current = null;
      setRoom(null);
    };
  }, [meetingId]);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const history = await GetMeetingChat({ meetingId });
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
      scrollToBottom();
    }
  }, [messages, isChatOpen]);

  useEffect(() => {
    const start = async () => {
      try {
        if (connection.state === "Disconnected") {
          await connection.start();
        }

        await subscribeToMeeting(meetingId);

        onMessageReceived((payload) => {
          setMessages((prev) => [...prev, payload]);
        });

        onError((err) => {
          console.error("SignalR Error:", err);
        });
      } catch (err) {
        console.error("Connection error:", err);
      }
    };

    start();

    return () => {
      unsubscribeFromMeeting(meetingId);
      connection.off("MessageSent");
      connection.off("Error");
    };
  }, [meetingId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await sendChatMessage(meetingId, newMessage.trim());
      setNewMessage("");
    } catch (err) {
      console.error("Send failed:", err);
    }
  };

  const toggleCamera = async () => {
    const liveRoom = roomRef.current;
    if (!liveRoom || isTogglingCameraRef.current) return;

    isTogglingCameraRef.current = true;

    try {
      const shouldEnable = !hasEnabledVideoTrack(liveRoom.localParticipant);

      await liveRoom.localParticipant.setCameraEnabled(shouldEnable);

      // optimistic UI update, real sync follows from room events
      setCameraOff(!shouldEnable);

      console.log("📷 camera state:", shouldEnable);
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
      const shouldEnable = !hasEnabledAudioTrack(liveRoom.localParticipant);

      await liveRoom.localParticipant.setMicrophoneEnabled(shouldEnable);

      setMuted(!shouldEnable);

      console.log("🎤 mic state:", shouldEnable);
    } catch (err) {
      console.error("❌ Failed to toggle microphone:", err);
    } finally {
      isTogglingMicRef.current = false;
    }
  };

  const handleLeaveMeeting = () => {
    try {
      roomRef.current?.disconnect();
    } catch (err) {
      console.error("Leave meeting disconnect error:", err);
    } finally {
      cleanupMediaElements();
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

          {/* Video Grid - Fixed 2x2 Layout */}
          <div className="flex-1 flex items-center justify-center p-2 min-h-0 overflow-hidden">
            <div className="grid grid-cols-2 gap-3 md:gap-5 w-full h-full max-w-[1000px] max-h-[700px]">
              {users.map((user) => (
                <motion.div
                  key={user.id}
                  layout
                  className={`relative rounded-[2.5rem] flex items-center justify-center border-2 transition-all shadow-xl overflow-hidden ${user.isSpeaking
                    ? "border-blue-500 ring-4 ring-blue-500/10"
                    : "border-white dark:border-[#2A2E3B]"
                    } ${user.hasVideo ? "bg-black" : "bg-white dark:bg-[#181B26]"}`}
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

              <button className="hidden sm:flex p-4 rounded-2xl bg-slate-100 dark:bg-[#2A2E3B] hover:bg-blue-600 hover:text-white transition-all shadow-md">
                <MonitorUp size={22} />
              </button>

              <button className="hidden sm:flex p-4 rounded-2xl bg-slate-100 dark:bg-[#2A2E3B] hover:bg-emerald-600 hover:text-white transition-all shadow-md">
                <Waves size={22} />
              </button>

              <button
                onClick={() => setIsCaptionsOn((prev) => !prev)}
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
                  messages.map((msg, index) => (
                    <div
                      key={msg.id ?? `${msg.senderName}-${index}`}
                      className="space-y-2"
                    >
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                        {msg.senderName}
                      </span>

                      <div className="bg-slate-100 dark:bg-[#0D0F16] p-4 rounded-[1.8rem] text-[13px] shadow-sm inline-block">
                        {msg.content}
                      </div>
                    </div>
                  ))
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
    </div>
  );
}