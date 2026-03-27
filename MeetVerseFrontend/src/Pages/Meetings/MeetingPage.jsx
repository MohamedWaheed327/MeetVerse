/* eslint-disable no-unused-vars */
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
  Users,
  Waves,
  X,
  Send,
  ShieldCheck,
  Type,
  IdCard, // أيقونة الـ CC
} from "lucide-react";
import { React, useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { sendChatMessage } from "../../services//hubs/sendMeetingMessage";
import { onMeetingMessageSent } from "../../services/hubs/onMeetingMessageSent";
import api from "../../services/api";
import connection from "../../services/hubs/connections";
import {
  subscribeToMeeting,
  unsubscribeFromMeeting,
  onMessageReceived,
  onError,
} from "../../services/hubs/meetingChat";
import { GetMeetingChat } from "../../services/meetingChatMessage";
import { getParticipants } from "../../services/getParticipants";
import { Room } from "livekit-client";
import { joinMeeting } from "../../services/joinMeeting";
import { leaveMeeting } from "../../services/leaveMeeting";
import { getCurrentUser } from "../../services/currentUser";

export default function MeetingPage() {
  const [muted, setMuted] = useState(true);
  const [cameraOff, setCameraOff] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCaptionsOn, setIsCaptionsOn] = useState(false); // الحالة الخاصة بالترجمة (CC)
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  const { meetingId } = useParams(); // meeting ID from URL
  const [room, setRoom] = useState(null);

  const [users, setUsers] = useState([]);

  const scrollRef = useRef(null);

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: "auto" });
  };

  // const users = [
  //   {
  //     id: 1,
  //     name: "You (Host)",
  //     initial: "Y",
  //     color: "from-blue-600 to-indigo-700",
  //     isSpeaking: false,
  //   },
  //   {
  //     id: 2,
  //     name: "Sarah • بتعمل شاي للرجالة",
  //     initial: "S",
  //     color: "from-purple-600 to-pink-600",
  //     isSpeaking: true,
  //   },
  //   {
  //     id: 3,
  //     name: "Omar • AI Eng",
  //     initial: "O",
  //     color: "from-emerald-600 to-teal-600",
  //     isSpeaking: false,
  //   },
  //   {
  //     id: 4,
  //     name: "Dr. Ahmed",
  //     initial: "A",
  //     color: "from-orange-600 to-red-600",
  //     isSpeaking: false,
  //   },
  // ];

  // handle livekit server stuff
  useEffect(() => {
    let activeRoom;

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
        name: `${localParticipant.displayName} (You)`,
        initial: localParticipant.identity?.charAt(0)?.toUpperCase() || "Y",
        color: colorPool[0],
        isSpeaking: localParticipant.isSpeaking || false,
        isLocal: true,
      };

      const remoteUsers = Array.from(liveRoom.remoteParticipants.values()).map(
        (participant, index) => ({
          id: participant.identity,
          name: participant.displayName,
          initial: participant.identity?.charAt(0)?.toUpperCase() || "U",
          color: colorPool[(index + 1) % colorPool.length],
          isSpeaking: participant.isSpeaking || false,
          isLocal: false,
        })
      );

      return [localUser, ...remoteUsers];
    };

    const syncParticipants = (liveRoom) => {
      const updatedUsers = buildParticipantsList(liveRoom);
      setUsers(updatedUsers);
    };

    const joinRoom = async () => {
      try {
        const currentUser = await getCurrentUser();

        const response = await api.get("/livekit/token", {
          params: {
            username: "user_" + currentUser.id,
            room: meetingId,
            displayName: currentUser.name,
            avatar: currentUser.avatarUrl
          },
        });

        const token = response.data.token;

        const newRoom = new Room();
        activeRoom = newRoom;

        newRoom.on("trackSubscribed", (track) => {
          if (track.kind === "audio") {
            const audioElement = track.attach();
            audioElement.autoplay = true;
            audioElement.playsInline = true;
            document.body.appendChild(audioElement);
          }
        });

        newRoom.on("participantConnected", (participant) => {
          console.log("participantConnected:", participant.identity);
          syncParticipants(newRoom);
        });

        newRoom.on("participantDisconnected", (participant) => {
          console.log("participantDisconnected:", participant.identity);
          syncParticipants(newRoom);
        });

        newRoom.on("activeSpeakersChanged", () => {
          syncParticipants(newRoom);
        });

        newRoom.on("localTrackPublished", () => {
          syncParticipants(newRoom);
        });

        newRoom.on("localTrackUnpublished", () => {
          syncParticipants(newRoom);
        });

        await newRoom.connect("wss://meetverse-tn25w775.livekit.cloud", token);

        if (newRoom.remoteParticipants) {
          newRoom.remoteParticipants.forEach((participant) => {
            participant.trackPublications.forEach((publication) => {
              const track = publication.track;
              if (track && track.kind === "audio") {
                const audioElement = track.attach();
                audioElement.autoplay = true;
                audioElement.playsInline = true;
                document.body.appendChild(audioElement);
              }
            });
          });
        }

        await newRoom.localParticipant.setMicrophoneEnabled(false);

        setRoom(newRoom);
        syncParticipants(newRoom);

        console.log("✅ Connected to LiveKit room successfully");
      } catch (err) {
        console.error("❌ LiveKit connect failed:", err);
      }
    };

    joinRoom();

    return () => {
      if (activeRoom) {
        activeRoom.disconnect();
      }
    };
  }, [meetingId]);

  // database participants edit
  useEffect(() => {
    joinMeeting({ meetingId });
    return () => {
      leaveMeeting({ meetingId });
    };
  }, []);

  // Load meeting-chat History
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const history = await GetMeetingChat({ meetingId });
        console.log("History:", history);
        setMessages(history);
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

  // scroll chat box to the bottom
  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [messages, isChatOpen]);

  // subscripe for signalR hub
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
      await sendChatMessage(meetingId, newMessage);
      setNewMessage("");
    } catch (err) {
      console.error("Send failed:", err);
    }
  };

  const toggleMic = async () => {
    if (!room) return;

    try {
      const newMuted = !muted;
      await room.localParticipant.setMicrophoneEnabled(!newMuted);
      setMuted(newMuted);

      console.log("🎤 Mic state:", !newMuted);
    } catch (err) {
      console.error("❌ Failed to toggle microphone:", err);
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
                  className={`relative rounded-[2.5rem] flex items-center justify-center border-2 transition-all shadow-xl overflow-hidden
                    ${user.isSpeaking ? "border-blue-500 ring-4 ring-blue-500/10" : "border-white dark:border-[#2A2E3B] bg-white dark:bg-[#181B26]"}`}
                >
                  <div
                    className={`w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-br ${user.color} flex items-center justify-center text-3xl md:text-5xl font-black text-white shadow-2xl relative z-10 transition-transform duration-500 hover:rotate-12`}
                  >
                    {user.initial}
                    {user.isSpeaking && (
                      <span className="absolute -inset-3 rounded-full border-2 border-blue-500/40 animate-ping" />
                    )}
                  </div>

                  <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl flex items-center gap-3 border border-white/10 shadow-2xl z-20">
                    <div
                      className={`w-2 h-2 rounded-full ${user.isSpeaking ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-slate-400"}`}
                    />
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">
                      {user.name}
                    </span>
                    {user.id === 1 && muted && (
                      <MicOff size={14} className="text-red-400" />
                    )}
                  </div>

                  {user.isSpeaking && (
                    <div className="absolute top-8 right-8 flex items-end gap-1 h-4">
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
                onClick={async () => {
                  toggleMic();
                }}
                className={`p-4 rounded-2xl transition-all shadow-md active:scale-90 ${muted ? "bg-red-500 text-white shadow-red-500/20" : "bg-slate-100 dark:bg-[#2A2E3B] hover:bg-slate-200 dark:hover:bg-[#353A4D]"}`}
              >
                {muted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
              <button
                onClick={() => setCameraOff(!cameraOff)}
                className={`p-4 rounded-2xl transition-all shadow-md active:scale-90 ${cameraOff ? "bg-red-500 text-white shadow-red-500/20" : "bg-slate-100 dark:bg-[#2A2E3B] hover:bg-slate-200 dark:hover:bg-[#353A4D]"}`}
              >
                {cameraOff ? <VideoOff size={22} /> : <Video size={22} />}
              </button>
              <button className="hidden sm:flex p-4 rounded-2xl bg-slate-100 dark:bg-[#2A2E3B] hover:bg-blue-600 hover:text-white transition-all shadow-md">
                <MonitorUp size={22} />
              </button>
              <button className="hidden sm:flex p-4 rounded-2xl bg-slate-100 dark:bg-[#2A2E3B] hover:bg-emerald-600 hover:text-white transition-all shadow-md">
                <Waves size={22} />
              </button>
              {/* أيقونة الترجمة CC المضافة */}
              <button
                onClick={() => setIsCaptionsOn(!isCaptionsOn)}
                className={`p-4 rounded-2xl transition-all shadow-md active:scale-90 ${isCaptionsOn ? "bg-blue-600 text-white shadow-blue-600/30" : "bg-slate-100 dark:bg-[#2A2E3B] hover:bg-slate-200 dark:hover:bg-[#353A4D]"}`}
                title="Captions"
              >
                <Type size={22} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`p-4 rounded-2xl transition-all shadow-md flex items-center gap-2 ${isChatOpen ? "bg-blue-600 text-white shadow-blue-600/30" : "bg-slate-100 dark:bg-[#2A2E3B] hover:bg-slate-200 dark:hover:bg-[#353A4D]"}`}
              >
                <MessageSquare size={22} />
                <span className="hidden md:block text-xs font-bold uppercase tracking-widest">
                  Chat
                </span>
              </button>

              <button className="bg-red-600 hover:bg-red-700 px-6 md:px-8 py-4 rounded-2xl text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-red-900/30 flex items-center gap-3 active:scale-95 transition-all">
                <PhoneOff size={22} />
                <span className="hidden lg:block">Leave</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
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
                  <MessageSquare size={16} className="text-blue-600" /> Live
                  Feed
                </h2>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] font-bold text-white">
                      O
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Omar Eng
                    </span>
                  </div>
                  <div className="bg-slate-100 dark:bg-[#0D0F16] p-4 rounded-[1.8rem] rounded-tl-none text-[13px] leading-relaxed shadow-sm">
                    Hey team! The AI Noise suppression is working perfectly. 🚀
                  </div>
                </div>

                <div className="space-y-2 text-right">
                  <span className="text-[9px] font-black text-blue-600 uppercase mr-2 tracking-widest">
                    You
                  </span>
                  <div className="bg-blue-600 text-white p-4 rounded-[1.8rem] rounded-tr-none text-[13px] shadow-xl shadow-blue-900/10 text-left inline-block">
                    Great! Let's start the demo.
                  </div>
                </div>
              </div> */}


              {/* <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`space-y-2 ${msg.user === "You" ? "text-right" : ""
                      }`}
                  >
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                      {msg.user}
                    </span>

                    <div
                      className={`p-4 rounded-[1.8rem] text-[13px] shadow-sm inline-block ${msg.user === "You"
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-slate-100 dark:bg-[#0D0F16] rounded-tl-none"
                        }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div> */}

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id} className="space-y-2">
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                      {msg.senderName}
                    </span>

                    <div className="bg-slate-100 dark:bg-[#0D0F16] p-4 rounded-[1.8rem] text-[13px] shadow-sm inline-block">
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>

              <div className="p-6 bg-slate-50 dark:bg-black/10 border-t border-slate-100 dark:border-white/5">
                <div className="relative group">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
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
