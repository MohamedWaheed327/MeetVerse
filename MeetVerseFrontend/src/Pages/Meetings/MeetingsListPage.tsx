/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { motion } from "framer-motion";
import { Video, Plus, Search, Calendar, Clock, Tag, MoreHorizontal, Copy } from "lucide-react";
import { getActiveMeetings } from "../../services/getActiveMeetings";
import { useToast } from "../../Context/ToastContext";

type Meeting = {
  meetingId: string;
  title: string;
  scheduledStart: string;
  scheduledEnd: string;
  isLive: boolean;
  description: string;
};

export default function MeetingsListPage() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const getInitials = (s: string) => {
    if (!s) return "MV";
    const parts = s.split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const avatarColorClass = (id: string) => {
    const palette = ["bg-pink-50 text-pink-600", "bg-indigo-50 text-indigo-600", "bg-emerald-50 text-emerald-600", "bg-yellow-50 text-yellow-600", "bg-rose-50 text-rose-600"];
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return palette[h % palette.length];
  };

  useEffect(() => {
    const loadMeetings = async () => {
      setIsLoading(true);
      try {
        const data = await getActiveMeetings();
        console.log("meetings:", data);
        setMeetings(data || []);
      } catch (err) {
        console.error("Failed to load meetings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMeetings();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0F16] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-8">
        {/* Header Section */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-blue-600 dark:text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px]">Dashboard</span>
            <h1 className="text-3xl font-extrabold tracking-tight">Your Meetings</h1>
            <p className="text-slate-500 dark:text-[#A8B0C2] text-sm">Connect instantly or schedule your future sessions.</p>
          </div>
          <div className="flex gap-3">
            <a href="/meetings/join" className="px-6 py-3 rounded-2xl border border-slate-200 dark:border-[#2A2E3B] bg-white dark:bg-[#181B26] text-sm font-semibold hover:bg-slate-50 dark:hover:bg-[#232734] transition-all shadow-sm">Join by ID</a>
            <a href="/meetings/create" className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95"><Plus size={18} /> New Meeting</a>
          </div>
        </motion.div>

        {/* Search & Filter Bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] p-4 rounded-4xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-100 dark:border-[#2A2E3B] rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all" placeholder="Search meetings..." />
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4">{meetings.length} Upcoming meetings</div>
        </motion.div>

        {/* Meetings Grid */}
        <div className="grid gap-6">
          {isLoading && <div className="text-center text-sm text-slate-500">Loading meetings...</div>}
          {!isLoading && meetings.length === 0 && <div className="text-center text-sm text-slate-500">No meetings found.</div>}
          {meetings.map((m, idx) => (
            <motion.div key={m.meetingId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.06 }} className="group bg-white/70 dark:bg-[#0E1116]/60 backdrop-blur-sm border border-slate-100 dark:border-[#20232a] p-5 lg:p-6 rounded-3xl flex flex-col lg:flex-row items-center justify-between gap-6 hover:shadow-2xl transform-gpu hover:-translate-y-1 transition-all">
              <div className="flex items-center gap-6 w-full">
                <div className={`w-14 h-14 flex items-center justify-center rounded-xl ${m.isLive ? "bg-gradient-to-br from-red-400 to-red-600 text-white" : "bg-gradient-to-br from-blue-400 to-indigo-600 text-white"} shadow-lg`}>
                  <Video size={20} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold leading-tight">{m.title}</h3>
                    {m.isLive && (
                      <span className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white text-[11px] font-extrabold uppercase rounded-full">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse inline-block shadow-sm" /> Live
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-[#A8B0C2] text-xs">
                    <span className="flex items-center gap-1.5"><Calendar size={14} /> {m.scheduledStart}</span>
                    <span className="flex items-center gap-1.5"><Clock size={14} /> {m.scheduledEnd}</span>
                    <span className="flex items-center gap-2 font-mono bg-white/60 dark:bg-[#0F1724] px-3 py-1 rounded-full text-xs font-semibold border border-slate-100 dark:border-[#15161b]">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${avatarColorClass(m.meetingId)} text-sm font-bold mr-2`}>{getInitials(m.title)}</span>
                      <span className="truncate max-w-[14rem]">{m.meetingId}</span>
                      <button onClick={() => { navigator.clipboard?.writeText(m.meetingId); try { showToast("Meeting ID copied", "success"); } catch(e){} }} className="ml-2 p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5"><Copy size={14} /></button>
                    </span>
                    <span className="flex items-center gap-1.5"><Tag size={14} /> {m.description}</span>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-auto">
                <div className="flex items-center gap-3">
                  <a href={`/meetings/join?meetingId=${m.meetingId}`} className="inline-flex items-center justify-center min-w-[160px] px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-bold rounded-2xl transition-all shadow-xl active:scale-95">Join Meeting</a>
                  <button className="p-2 rounded-lg bg-white/30 dark:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-[#22272d] transition-all"><MoreHorizontal size={18} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
