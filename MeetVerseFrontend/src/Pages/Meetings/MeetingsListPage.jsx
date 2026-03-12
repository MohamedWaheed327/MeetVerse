/* eslint-disable no-unused-vars */
import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { motion } from "framer-motion";
import { Video, Plus, Search, Calendar, Clock, Tag } from "lucide-react";

export default function MeetingsListPage() {
  const meetings = [
    {
      id: "M-101",
      title: "Weekly Standup",
      time: "Today • 10:00 AM",
      duration: "30 min",
      isLive: true,
      type: "Team",
    },
    {
      id: "M-205",
      title: "Machine Learning Lecture",
      time: "Today • 4:00 PM",
      duration: "90 min",
      isLive: false,
      type: "Class",
    },
    {
      id: "M-330",
      title: "Design Review",
      time: "Tomorrow • 2:30 PM",
      duration: "50 min",
      isLive: false,
      type: "Workshop",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0F16] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div className="space-y-1">
            <span className="text-blue-600 dark:text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px]">
              Dashboard
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Your Meetings
            </h1>
            <p className="text-slate-500 dark:text-[#A8B0C2] text-sm">
              Connect instantly or schedule your future sessions.
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="/meetings/join"
              className="px-6 py-3 rounded-2xl border border-slate-200 dark:border-[#2A2E3B] bg-white dark:bg-[#181B26] text-sm font-semibold hover:bg-slate-50 dark:hover:bg-[#232734] transition-all shadow-sm"
            >
              Join by ID
            </a>
            <a
              href="/meetings/create"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95"
            >
              <Plus size={18} /> New Meeting
            </a>
          </div>
        </motion.div>

        {/* Search & Filter Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] p-4 rounded-4xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm"
        >
          <div className="relative w-full md:w-96">
            <Search
              className="absolute left-4 top-3.5 text-slate-400"
              size={18}
            />
            <input
              className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-100 dark:border-[#2A2E3B] rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
              placeholder="Search meetings..."
            />
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4">
            {meetings.length} Upcoming meetings
          </div>
        </motion.div>

        {/* Meetings Grid */}
        <div className="grid gap-4">
          {meetings.map((m, idx) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] p-6 rounded-[2.5rem] flex flex-col lg:flex-row items-center justify-between gap-6 hover:border-blue-500 transition-all hover:shadow-xl"
            >
              <div className="flex items-center gap-6 w-full">
                <div
                  className={`p-4 rounded-3xl ${m.isLive ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"} transition-colors`}
                >
                  <Video size={28} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold">{m.title}</h3>
                    {m.isLive && (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500 text-white text-[10px] font-black uppercase rounded-full animate-pulse">
                        <span className="w-1.5 h-1.5 bg-white rounded-full" />{" "}
                        Live
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-slate-500 dark:text-[#A8B0C2] text-xs">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} /> {m.time}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} /> {m.duration}
                    </span>
                    <span className="flex items-center gap-1.5 font-mono bg-slate-100 dark:bg-[#2A2E3B] px-2 py-0.5 rounded text-blue-500">
                      {m.id}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Tag size={14} /> {m.type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-auto">
                <a
                  href={`/meetings/${m.id}`}
                  className="block text-center px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                >
                  Join Meeting
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
