import React, { useState, useEffect } from "react";
import { setPageTitle } from "../../utils/setPageTitle";
import { Link } from "react-router-dom";
import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { motion } from "framer-motion";
import {
  Video,
  Users,
  Calendar,
  Waves,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  LayoutDashboard,
  CalendarPlus,
  Play
} from "lucide-react";
import { useAuth } from "../../Context/AuthContext";
import { getTimeUntilMeeting } from "../../utils/dateHelpers";
import AudioWaveform from "../../components/Home/AudioWaveform";
import { useNavigate } from "react-router-dom";
import { LiquidMetalButton } from "../../components/ui/LiquidMetalButton";

export default function HomePage() {
  const navigate = useNavigate();
  const { firstName } = useAuth();
  const displayName = firstName || "there";
  const [timeUntil, setTimeUntil] = useState("");

  useEffect(() => {
    setPageTitle("Dashboard");
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    // Mock future meeting time (23 minutes from now)
    const targetTime = new Date(Date.now() + 23 * 60000).toISOString();
    setTimeUntil(getTimeUntilMeeting(targetTime));
    
    const interval = setInterval(() => {
      setTimeUntil(getTimeUntilMeeting(targetTime));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  const secondaryActions = [
    {
      title: "Join with ID",
      desc: "Enter code to connect",
      href: "/meetings/join",
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
      color: "bg-yellow-500/10",
    },
    {
      title: "Schedule Meeting",
      desc: "Plan for later",
      href: "/meetings/create",
      icon: <CalendarPlus className="w-5 h-5 text-purple-500" />,
      color: "bg-purple-500/10",
    },
    {
      title: "Create Group",
      desc: "Organize your team",
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 space-y-10">
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
              
              <div className="space-y-2">
                <h2 className="text-lg md:text-xl font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  {getGreeting()}, {displayName} 👋
                </h2>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                  Crystal-clear meetings, <br />
                  <span className="text-blue-600">ready when you are.</span>
                </h1>
              </div>
              
              <p className="text-slate-600 dark:text-[#A8B0C2] text-base md:text-lg leading-relaxed">
                Experience distraction-free collaboration. Join your next
                session or connect with your team in just a few clicks.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  to="/meetings"
                  className="flex items-center gap-2 px-8 py-4 bg-slate-100 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-[#232734] transition-all"
                >
                  <LayoutDashboard size={18} /> My Meetings
                </Link>
              </div>
            </div>

            {/* Live Visualizer Widget */}
            <div className="w-full lg:w-80 group bg-slate-50 dark:bg-[#0D0F16]/50 border border-slate-100 dark:border-[#2A2E3B] rounded-[2.5rem] p-6 shadow-xl backdrop-blur-sm hover:border-blue-500/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Next Session
                </span>
                <div className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
                </div>
              </div>
              <h3 className="text-lg font-bold">AI Standup with Team</h3>
              
              <div className="mb-6">
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  <Clock size={14} /> Today • 10:30 AM
                </p>
                <p className="text-xs text-amber-500 dark:text-amber-400 font-bold mt-1.5 flex items-center gap-1.5">
                  {timeUntil}
                </p>
              </div>

              <div className="space-y-4">
                <div className="h-16 flex items-end">
                  <AudioWaveform isActive={true} />
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tighter">
                  <span className="flex items-center gap-1">
                    <Waves size={12} /> Noise Guard
                  </span>
                  <span>98% Clear</span>
                </div>
                
                <div className="mt-4 flex justify-center">
                  <LiquidMetalButton onClick={() => navigate("/meetings/join?id=standup")} width="full" className="w-full">
                    <span className="relative z-10 w-full text-center">Join Now</span>
                  </LiquidMetalButton>
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
            className="lg:col-span-7 space-y-4"
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Zap size={20} className="text-yellow-500" /> Quick Actions
              </h2>
            </div>

            {/* Primary Action */}
            <Link 
              to="/meetings/create" 
              className="relative group block overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-8 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] pointer-events-none rounded-full" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
                    <Video size={28} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Start Instant Meeting</h3>
                  <p className="text-blue-100 font-medium max-w-sm text-sm">
                    Launch a new room immediately with AI noise guard automatically enabled.
                  </p>
                </div>
                <div className="hidden sm:flex items-center justify-center size-14 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                  <Play size={24} className="text-white translate-x-0.5" />
                </div>
              </div>
            </Link>

            {/* Secondary Actions */}
            <div className="grid sm:grid-cols-3 gap-4">
              {secondaryActions.map((a, i) => (
                <Link
                  key={i}
                  to={a.href}
                  className="group flex flex-col p-5 bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[1.5rem] hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg"
                >
                  <div className={`p-3 ${a.color} rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform`}>
                    {a.icon}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">{a.title}</h4>
                  <p className="text-[11px] text-slate-500">{a.desc}</p>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity List */}
          <motion.div
            {...fadeInUp}
            transition={{ delay: 0.2 }}
            className="lg:col-span-5 bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[2.5rem] p-8 shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Recent History
              </h2>
              <Clock size={18} className="text-slate-400" />
            </div>

            <div className="space-y-3 flex-1">
              {recentMeetings.length > 0 ? (
                recentMeetings.map((m, i) => (
                  <Link
                    key={i}
                    to="/meetings/history"
                    className="group flex items-center justify-between p-4 bg-slate-50 dark:bg-[#0D0F16]/50 rounded-2xl border border-transparent hover:border-blue-200 dark:hover:border-blue-900 transition-all"
                  >
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{m.title}</h4>
                      <p className="text-[11px] text-slate-500">
                        {m.when} • {m.duration}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                          m.status === "Recorded" 
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" 
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                  <div className="size-16 bg-slate-100 dark:bg-[#0D0F16] rounded-full flex items-center justify-center mb-4">
                    <Calendar className="text-slate-400 size-8" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">No recent meetings</h4>
                  <p className="text-xs text-slate-500 max-w-[200px] mx-auto">Your completed and recorded sessions will appear here.</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-[#2A2E3B] text-center">
              <Link to="/meetings/history" className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center justify-center gap-1 transition-colors">
                View all activity <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
