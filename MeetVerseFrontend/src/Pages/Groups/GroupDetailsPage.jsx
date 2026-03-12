/* eslint-disable no-unused-vars */
import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { motion } from "framer-motion";
import {
  Users,
  Settings,
  MessageSquare,
  Send,
  Pin,
  UserPlus,
  LogOut,
  Video,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function GroupDetailsPage() {
  const navigate = useNavigate();

  const members = [
    { name: "You", role: "Admin", status: "Online" },
    { name: "Sarah", role: "Member", status: "Away" },
    { name: "Omar", role: "Member", status: "Online" },
    { name: "Mona", role: "Member", status: "Offline" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0F16] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
          <div className="space-y-1">
            <span className="text-emerald-600 font-bold uppercase tracking-[0.3em] text-[10px]">
              Active Community
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight">
              AI Study Group
            </h1>
            <p className="text-slate-500 dark:text-[#A8B0C2] text-sm">
              G-10 • {members.length} Intellectuals • Weekly deep dives
            </p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-[#2A2E3B] transition-all">
            <Settings size={18} className="text-blue-500" /> Group Settings
          </button>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8 h-[600px]">
          {/* Chat Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-8 bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[3rem] flex flex-col overflow-hidden shadow-xl"
          >
            <div className="p-6 border-b border-slate-100 dark:border-[#2A2E3B] flex items-center justify-between bg-slate-50/50 dark:bg-[#0D0F16]/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-xl">
                  <MessageSquare size={18} />
                </div>
                <h3 className="font-bold">Team Discussion</h3>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-blue-600 font-bold uppercase bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                <Pin size={12} /> Thursday at 7 PM
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#2A2E3B] flex items-center justify-center text-[10px] font-bold">
                  S
                </div>
                <div className="space-y-1 max-w-[70%]">
                  <p className="text-[10px] font-bold text-slate-400">
                    Sarah • Yesterday
                  </p>
                  <div className="bg-slate-100 dark:bg-[#0D0F16] p-4 rounded-3xl rounded-tl-none text-sm leading-relaxed">
                    Welcome to the AI study group! Let's build something great.
                  </div>
                </div>
              </div>
              <div className="flex gap-4 flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                  Y
                </div>
                <div className="space-y-1 max-w-[70%] text-right">
                  <p className="text-[10px] font-bold text-blue-500">
                    You • Today
                  </p>
                  <div className="bg-blue-600 text-white p-4 rounded-3xl rounded-tr-none text-sm leading-relaxed shadow-lg shadow-blue-900/20">
                    Agreed! Can we schedule our first meeting and share
                    resources?
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-[#0D0F16]/50">
              <div className="relative">
                <input
                  className="w-full bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl py-4 pl-6 pr-24 text-sm outline-none focus:border-blue-600 transition-all shadow-inner"
                  placeholder="Drop a message..."
                />
                <button className="absolute right-2 top-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all">
                  <Send size={14} /> Send
                </button>
              </div>
            </div>
          </motion.div>

          {/* Members Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 flex flex-col gap-6"
          >
            <div className="bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[2.5rem] p-8 flex-1 flex flex-col shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold flex items-center gap-2">
                  <Users size={18} className="text-blue-500" /> Community
                </h3>
                <button className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                  <UserPlus size={14} /> Invite
                </button>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto">
                {members.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#0D0F16] border border-slate-100 dark:border-[#2A2E3B] rounded-2xl"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${m.status === "Online" ? "bg-emerald-500" : "bg-slate-400"}`}
                      />
                      <span className="text-sm font-bold">{m.name}</span>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 border border-slate-200 dark:border-[#2A2E3B] rounded uppercase tracking-wider text-slate-400">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>

              {/* زر إنشاء ميتنج */}
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-[#2A2E3B]">
                <button
                  onClick={() => navigate("/meetings/create")}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-5 rounded-[2rem] shadow-xl shadow-blue-500/20 transition-all flex items-center justify-between group active:scale-95"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl group-hover:rotate-12 transition-transform">
                      <Video size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-black uppercase tracking-widest leading-none">
                        Start Group Meeting
                      </p>
                      <p className="text-[9px] text-blue-100 mt-1 opacity-80">
                        Launch session for G-10 members
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>
              </div>

              <button className="mt-4 flex items-center justify-center gap-2 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all">
                <LogOut size={16} /> Leave Community
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
