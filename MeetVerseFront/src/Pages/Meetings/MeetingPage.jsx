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
  Type, // أيقونة الـ CC
} from "lucide-react";
import { useState } from "react";

export default function MeetingPage() {
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCaptionsOn, setIsCaptionsOn] = useState(false); // الحالة الخاصة بالترجمة (CC)

  const users = [
    {
      id: 1,
      name: "You (Host)",
      initial: "Y",
      color: "from-blue-600 to-indigo-700",
      isSpeaking: false,
    },
    {
      id: 2,
      name: "Sarah • Lead Dev",
      initial: "S",
      color: "from-purple-600 to-pink-600",
      isSpeaking: true,
    },
    {
      id: 3,
      name: "Omar • AI Eng",
      initial: "O",
      color: "from-emerald-600 to-teal-600",
      isSpeaking: false,
    },
    {
      id: 4,
      name: "Dr. Ahmed",
      initial: "A",
      color: "from-orange-600 to-red-600",
      isSpeaking: false,
    },
  ];

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
                onClick={() => setMuted(!muted)}
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

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
              </div>

              <div className="p-6 bg-slate-50 dark:bg-black/10 border-t border-slate-100 dark:border-white/5">
                <div className="relative group">
                  <input
                    className="w-full bg-white dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl py-4 pl-5 pr-14 text-sm outline-none focus:border-blue-600 transition-all shadow-inner"
                    placeholder="Message team..."
                  />
                  <button className="absolute right-2 top-2 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg active:scale-90 transition-all">
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
