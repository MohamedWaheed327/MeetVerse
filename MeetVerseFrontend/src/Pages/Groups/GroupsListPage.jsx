/* eslint-disable no-unused-vars */
import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { motion } from "framer-motion";
import { Users, Plus, Search, ArrowRight, Hash } from "lucide-react";

export default function GroupsListPage() {
  const groups = [
    {
      id: "G-10",
      name: "AI Study Group",
      members: 12,
      role: "Admin",
      desc: "Discussions about neural networks and deep learning.",
    },
    {
      id: "G-22",
      name: "Company All Hands",
      members: 48,
      role: "Member",
      desc: "General announcements and monthly sync-ups.",
    },
    {
      id: "G-35",
      name: "Web Dev Squad",
      members: 9,
      role: "Member",
      desc: "Frontend and Backend collaboration space.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0F16] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
          <div className="space-y-1">
            <span className="text-blue-600 dark:text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px]">
              Communities
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Your Spaces
            </h1>
            <p className="text-slate-500 dark:text-[#A8B0C2] text-sm">
              Organize your project teams and study circles.
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="/groups/join"
              className="px-6 py-3 rounded-2xl border border-slate-200 dark:border-[#2A2E3B] bg-white dark:bg-[#181B26] text-sm font-semibold hover:bg-slate-50 dark:hover:bg-[#232734] transition-all"
            >
              Join Group
            </a>
            <a
              href="/groups/create"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-900/20 transition-all"
            >
              <Plus size={18} /> New Group
            </a>
          </div>
        </motion.div>

        {/* Search Bar */}
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
              placeholder="Search communities..."
            />
          </div>
          <div className="flex items-center gap-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {groups.length} Active Communities
          </div>
        </motion.div>

        {/* Groups Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((g, idx) => (
            <motion.a
              key={g.id}
              href={`/groups/${g.id}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] p-6 rounded-[2.5rem] hover:border-blue-500 transition-all shadow-sm hover:shadow-xl relative overflow-hidden"
            >
              <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-blue-500/5 group-hover:bg-blue-500/10 rounded-full transition-colors blur-2xl" />
              <div className="flex flex-col h-full space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-blue-600/10 text-blue-600 rounded-2xl">
                    <Users size={24} />
                  </div>
                  <span className="text-[10px] font-bold px-3 py-1 bg-slate-100 dark:bg-[#2A2E3B] rounded-full uppercase tracking-wider">
                    {g.role}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold group-hover:text-blue-600 transition-colors">
                    {g.name}
                  </h3>
                  <p className="text-slate-500 dark:text-[#A8B0C2] text-xs mt-2 line-clamp-2 leading-relaxed">
                    {g.desc}
                  </p>
                </div>
                <div className="pt-4 mt-auto border-t border-slate-50 dark:border-[#2A2E3B] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Hash size={12} />
                    {g.id}
                  </span>
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
                    {g.members} Members <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
}
