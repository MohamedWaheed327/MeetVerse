/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/purity */
import React from "react";
import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { motion } from "framer-motion";
import {
  Video,
  Users,
  Calendar,
  Mic,
  Waves,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Clock,
  LayoutDashboard,
} from "lucide-react";

export default function HomePage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  const quickActions = [
    {
      title: "Start Instant Meeting",
      desc: "Jump into a new room with AI noise guard.",
      href: "/meetings/create",
      icon: <Video className="w-5 h-5 text-blue-500" />,
      color: "bg-blue-500/10",
    },
    {
      title: "Join with ID",
      desc: "Enter a code to connect with your team.",
      href: "/meetings/join",
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
      color: "bg-yellow-500/10",
    },
    {
      title: "Create Group",
      desc: "Organize recurring calls and shared chats.",
      href: "/groups/create",
      icon: <Users className="w-5 h-5 text-emerald-500" />,
      color: "bg-emerald-500/10",
    },
  ];


  const recentMeetings = [
    {
      title: "Weekly Sync",
      when: "Today • 10:00 AM",
      duration: "35 min",
      status: "Completed",
    },
    {
      title: "ML Lecture",
      when: "Yesterday • 4:00 PM",
      duration: "90 min",
      status: "Recorded",
    },
    {
      title: "Design Review",
      when: "Mon • 2:30 PM",
      duration: "50 min",
      status: "Completed",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0F16] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-10">
        {/* Welcome Hero Strip */}
        <motion.section
          {...fadeInUp}
          className="relative overflow-hidden rounded-[3rem] border border-slate-200 dark:border-[#2A2E3B] bg-white dark:bg-[#181B26] p-8 md:p-12 shadow-2xl"
        >
          {/* Decorative Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 blur-[100px] pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="space-y-6 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                <ShieldCheck size={14} /> AI Noise Intelligence Active
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                Crystal-clear meetings, <br />
                <span className="text-blue-600">ready when you are.</span>
              </h1>
              <p className="text-slate-600 dark:text-[#A8B0C2] text-base md:text-lg leading-relaxed">
                Experience distraction-free collaboration. Join your next
                session or connect with your team in just a few clicks.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <a
                  href="/meetings/create"
                  className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-900/20 transition-all active:scale-95"
                >
                  <Video size={18} /> Start New Meeting
                </a>
                <a
                  href="/meetings"
                  className="flex items-center gap-2 px-8 py-4 bg-white dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-[#232734] transition-all"
                >
                  <LayoutDashboard size={18} /> My Meetings
                </a>
              </div>
            </div>

            {/* Live Visualizer Widget */}
            <div className="w-full lg:w-80 bg-slate-50 dark:bg-[#0D0F16]/50 border border-slate-100 dark:border-[#2A2E3B] rounded-[2.5rem] p-6 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Next Session
                </span>
                <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
              </div>
              <h3 className="text-lg font-bold">AI Standup with Team</h3>
              <p className="text-xs text-slate-500 mt-1 mb-6 flex items-center gap-2">
                <Clock size={14} /> Today • 10:30 AM
              </p>

              <div className="space-y-4">
                <div className="h-16 flex items-end gap-1 px-1">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-linear-to-t from-blue-600 to-cyan-400 rounded-t-full"
                      style={{ height: `${20 + Math.random() * 80}%` }}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tighter">
                  <span className="flex items-center gap-1">
                    <Waves size={12} /> Noise Guard
                  </span>
                  <span>98% Clear</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

       

        {/* Action Center Grid */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Quick Actions List */}
          <motion.div
            {...fadeInUp}
            className="lg:col-span-7 bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[3rem] p-8 shadow-xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Zap size={20} className="text-yellow-500" /> Quick Actions
              </h2>
              <Calendar size={18} className="text-slate-400" />
            </div>
            <div className="space-y-4">
              {quickActions.map((a, i) => (
                <a
                  key={i}
                  href={a.href}
                  className="group flex items-center justify-between p-5 bg-slate-50 dark:bg-[#0D0F16]/50 border border-slate-100 dark:border-[#2A2E3B] rounded-4xl hover:border-blue-500 transition-all"
                >
                  <div className="flex items-center gap-5">
                    <div
                      className={`p-3 ${a.color} rounded-xl group-hover:scale-110 transition-transform`}
                    >
                      {a.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{a.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{a.desc}</p>
                    </div>
                  </div>
                  <ArrowRight
                    size={18}
                    className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"
                  />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity List */}
          <motion.div
            {...fadeInUp}
            transition={{ delay: 0.2 }}
            className="lg:col-span-5 bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[3rem] p-8 shadow-xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Recent History
              </h2>
              <Clock size={18} className="text-slate-400" />
            </div>
            <div className="space-y-4">
              {recentMeetings.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-5 border-b border-slate-50 dark:border-[#2A2E3B] last:border-0"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm">{m.title}</h4>
                    <p className="text-[11px] text-slate-500">
                      {m.when} • {m.duration}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.status === "Recorded" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"}`}
                    >
                      {m.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-4 bg-slate-50 dark:bg-[#0D0F16] rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors">
              Load More Activity
            </button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
