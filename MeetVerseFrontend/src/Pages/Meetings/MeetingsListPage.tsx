import React, { useEffect, useState } from "react";
import { setPageTitle } from "../../utils/setPageTitle";
import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { motion } from "framer-motion";
import { Video, Plus, Search, Calendar, Clock, MoreHorizontal, Copy, Pencil, CalendarX, Users } from "lucide-react";
import { getActiveMeetings } from "../../services/getActiveMeetings";
import api from "../../services/api";
import { useToast } from "../../Context/ToastContext";
import { meetingLinkService } from "../../services/meetingLinkService";
import { useNavigate } from "react-router-dom";
import { LiquidMetalButton } from "../../components/ui/LiquidMetalButton";

type Meeting = {
  meetingId: string;
  title: string;
  scheduledStart: string;
  scheduledEnd: string;
  isLive: boolean;
  description: string;
  hostId: string;
};

const formatMeetingDate = (isoString: string) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();

  const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  const timeStr = new Intl.DateTimeFormat('en-US', timeOptions).format(date);

  if (isToday) return `Today at ${timeStr}`;
  if (isYesterday) return `Yesterday at ${timeStr}`;
  
  const dateOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const dateStr = new Intl.DateTimeFormat('en-US', dateOptions).format(date);
  return `${dateStr} · ${timeStr}`;
};

const getMeetingDuration = (startStr: string, endStr: string) => {
  if (!startStr || !endStr) return "";
  const start = new Date(startStr).getTime();
  const end = new Date(endStr).getTime();
  const mins = Math.round((end - start) / 60000);
  if (mins <= 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

import { getAvatarGradient } from "../../utils/stringHelpers";
import { useAuth } from "../../Context/AuthContext";

export default function MeetingsListPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { userId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [filter, setFilter] = useState<"all" | "live" | "upcoming" | "past">("all");
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null);

  useEffect(() => {
    const closeDropdown = () => setDropdownOpenId(null);
    document.addEventListener("click", closeDropdown);
    return () => document.removeEventListener("click", closeDropdown);
  }, []);

  useEffect(() => {
    setPageTitle("My Meetings");
  }, []);
  const [editTitle, setEditTitle] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  useEffect(() => {
    const loadMeetings = async () => {
      setIsLoading(true);
      try {
        const data = await getActiveMeetings();
        setMeetings(data || []);
      } catch (err) {
        console.error("Failed to load meetings:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadMeetings();
  }, []);

  const saveTitle = async (id: string, oldTitle: string) => {
    if (!editTitle.trim() || editTitle === oldTitle) {
      setEditingId(null);
      return;
    }
    
    setIsSavingTitle(true);
    setMeetings(prev => prev.map(m => m.meetingId === id ? { ...m, title: editTitle } : m));
    
    try {
      await api.patch(`/meetings/${id}/title`, { title: editTitle });
      showToast("Meeting renamed successfully", "success");
    } catch (err) {
      setMeetings(prev => prev.map(m => m.meetingId === id ? { ...m, title: oldTitle } : m));
      showToast("Failed to rename meeting", "error");
    } finally {
      setIsSavingTitle(false);
      setEditingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string, oldTitle: string) => {
    if (e.key === "Enter") {
      saveTitle(id, oldTitle);
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  const deleteMeeting = async (id: string) => {
    if (!confirm("Are you sure you want to cancel and delete this meeting?")) return;
    try {
      await api.delete(`/meetings/${id}`);
      setMeetings(prev => prev.filter(m => m.meetingId !== id));
      showToast("Meeting deleted successfully", "success");
    } catch (err) {
      showToast("Failed to delete meeting", "error");
    }
  };

  const startMeetingNow = async (id: string) => {
    try {
      await api.patch(`/meetings/${id}/start-now`);
      setMeetings(prev => prev.map(m => m.meetingId === id ? { ...m, isLive: true } : m));
      showToast("Meeting is now live!", "success");
    } catch (err) {
      showToast("Failed to start meeting", "error");
    }
  };

  const now = new Date();
  const weekFromNow = new Date(now);
  weekFromNow.setDate(now.getDate() + 7);

  const visibleMeetings = meetings.filter(m => {
    const isHost = m.hostId === userId;
    const meetingDate = new Date(m.scheduledStart);
    const isThisWeek = meetingDate >= now && meetingDate < weekFromNow;
    
    // Only show meeting if user is host or if it's scheduled for this week
    return isHost || isThisWeek;
  });

  const liveCount = visibleMeetings.filter(m => m.isLive).length;
  const upcomingCount = visibleMeetings.filter(m => !m.isLive && new Date(m.scheduledStart) > now).length;
  const thisWeekCount = visibleMeetings.filter(m => !m.isLive && new Date(m.scheduledStart) > now && new Date(m.scheduledStart) < weekFromNow).length;

  const filteredMeetings = visibleMeetings.filter(m => {
    if (filter === "all") return true;
    if (filter === "live") return m.isLive;
    if (filter === "upcoming") return !m.isLive && new Date(m.scheduledStart) > now;
    if (filter === "past") return new Date(m.scheduledEnd || m.scheduledStart) < now && !m.isLive;
    return true;
  });

  type GroupedMeetings = { label: string; items: Meeting[] }[];
  const grouped: GroupedMeetings = [
    { label: "Live Now", items: [] },
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Earlier", items: [] },
    { label: "Upcoming", items: [] }
  ];

  filteredMeetings.forEach(m => {
    if (m.isLive) {
      grouped[0].items.push(m);
      return;
    }
    const date = new Date(m.scheduledStart);
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();

    if (date > now) {
      grouped[4].items.push(m);
    } else if (isToday) {
      grouped[1].items.push(m);
    } else if (isYesterday) {
      grouped[2].items.push(m);
    } else {
      grouped[3].items.push(m);
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0f13] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-blue-600 dark:text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px]">Dashboard</span>
            <h1 className="text-4xl font-[700] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500 pb-1">Your Meetings</h1>
            <p className="text-slate-500 dark:text-[#A8B0C2] text-sm mt-1">Connect instantly or schedule your future sessions.</p>
          </div>
          <div className="flex gap-3 items-center">
            <a href="/meetings/join" className="px-6 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-transparent text-sm font-semibold hover:bg-white/5 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all duration-200 ease-in-out shadow-sm">Join by ID</a>
            <LiquidMetalButton onClick={() => navigate("/meetings/create")} className="flex items-center justify-center">
              <span className="flex items-center gap-2 relative z-10"><Plus size={18} /> New Meeting</span>
            </LiquidMetalButton>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-[#1a1a24] border border-slate-200 dark:border-white/10 p-4 rounded-[999px] flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-4 w-full">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input className="w-full bg-slate-50 dark:bg-[#0f0f13] border border-slate-100 dark:border-white/10 rounded-full py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all duration-200 ease-in-out" placeholder="Search meetings..." />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto hide-scrollbar">
              {["all", "live", "upcoming", "past"].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold capitalize transition-all duration-200 ease-in-out whitespace-nowrap ${filter === f ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md shadow-purple-500/20" : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-start xl:justify-end gap-3 text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap px-2 w-full xl:w-auto overflow-x-auto hide-scrollbar">
            <span className="flex items-center gap-1.5"><Calendar size={14} className="text-blue-500"/> {upcomingCount} Upcoming</span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/> {liveCount} Live Now</span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="flex items-center gap-1.5"><Clock size={14} className="text-emerald-500"/> {thisWeekCount} This Week</span>
          </div>
        </motion.div>

        <div className="space-y-10">
          {isLoading && <div className="text-center text-sm text-slate-500 py-10">Loading meetings...</div>}
          
          {!isLoading && filteredMeetings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 opacity-60">
              <div className="p-6 bg-slate-100 dark:bg-white/5 rounded-full mb-4">
                <CalendarX size={48} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold">No {filter !== 'all' ? filter : ''} meetings found</h3>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or schedule a new one.</p>
            </div>
          )}

          {!isLoading && grouped.map(group => {
            if (group.items.length === 0) return null;
            return (
              <div key={group.label} className="space-y-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-[13px] text-slate-500 dark:text-slate-300 font-[700] tracking-[0.2em] uppercase flex items-center gap-2">
                    {group.label === "Live Now" && <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_8px_#ef4444]" />}
                    {group.label}
                  </h3>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-white/10"></div>
                </div>
                
                <div className="grid gap-4">
                  {group.items.map((m, idx) => (
                    <motion.div 
                      key={m.meetingId} 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: idx * 0.05 }} 
                      className={`group relative bg-white dark:bg-[#1a1a24] border border-slate-200 dark:border-white/10 p-5 lg:p-6 rounded-[24px] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:shadow-xl transform-gpu hover:-translate-y-[2px] transition-all duration-200 ease-in-out overflow-hidden ${m.isLive ? 'ring-1 ring-red-500/20 bg-red-50 dark:bg-red-900/10 shadow-[inset_0_0_60px_rgba(239,68,68,0.05)]' : ''}`}
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-200 ease-in-out ${m.isLive ? 'bg-gradient-to-b from-red-400 to-red-600 shadow-[0_0_15px_#ef4444]' : new Date(m.scheduledStart) > now ? 'bg-gradient-to-b from-blue-500 to-purple-500 shadow-[0_0_15px_#8b5cf6] opacity-75 group-hover:opacity-100' : 'bg-slate-400 opacity-50 group-hover:opacity-100'}`} />

                      <div className="flex items-center gap-5 w-full pl-2">
                        <div className={`shrink-0 w-14 h-14 flex items-center justify-center rounded-xl bg-gradient-to-br ${getAvatarGradient(m.title)} text-white shadow-md relative overflow-hidden`}>
                          <div className="absolute inset-0 bg-white/20 mix-blend-overlay"></div>
                          <Video size={20} className="relative z-10 drop-shadow-sm" />
                        </div>

                        <div className="space-y-1.5 w-full">
                          <div className="flex flex-wrap items-center gap-3">
                            {editingId === m.meetingId ? (
                              <div className="flex items-center gap-2">
                                <input 
                                  type="text" 
                                  autoFocus
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  onBlur={() => saveTitle(m.meetingId, m.title)}
                                  onKeyDown={(e) => handleKeyDown(e, m.meetingId, m.title)}
                                  className="bg-slate-100 dark:bg-[#0D0F16] border border-blue-500 rounded-lg px-3 py-1 text-lg font-bold outline-none"
                                />
                                {isSavingTitle && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <h3 className={`text-[17px] font-[600] leading-tight transition-colors duration-200 ${m.title === "Instant Meeting" ? "italic text-slate-500 dark:text-slate-400" : "text-slate-900 dark:text-white group-hover:text-blue-400"}`}>
                                  {m.title}
                                </h3>
                                {m.hostId === userId && (
                                  <button 
                                    onClick={() => { setEditingId(m.meetingId); setEditTitle(m.title); }}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-all"
                                    title="Rename Meeting"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                )}
                              </div>
                            )}

                            {m.isLive && (
                              <span className="flex items-center gap-2 px-3 py-1 bg-slate-900 dark:bg-black/50 border border-slate-700 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-full">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping absolute" />
                                <span className="w-2 h-2 bg-red-500 rounded-full relative" /> 
                                LIVE
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-slate-500 dark:text-slate-400 text-xs font-medium">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={14} className="text-slate-400" /> 
                              {formatMeetingDate(m.scheduledStart)}
                            </span>
                            
                            {getMeetingDuration(m.scheduledStart, m.scheduledEnd) && (
                              <span className="flex items-center gap-1.5">
                                <Clock size={14} className="text-slate-400" /> 
                                {getMeetingDuration(m.scheduledStart, m.scheduledEnd)}
                              </span>
                            )}
                            
                            <span className="flex items-center gap-1.5">
                              <Users size={14} className="text-slate-400" /> 
                              {m.description && m.description.includes("participants") ? m.description : "Team"}
                            </span>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded">ID: ••••••••</span>
                              <button 
                                onClick={async () => { 
                                  const success = await meetingLinkService.copyJoinLink(m.meetingId); 
                                  if (success) {
                                    showToast("Invite link copied!", "success"); 
                                  } else {
                                    showToast("Failed to copy invite link", "error");
                                  }
                                }} 
                                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500" 
                                title="Copy Invite Link"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="w-full lg:w-auto mt-4 lg:mt-0 flex items-center justify-end gap-3">
                        {m.hostId === userId && (
                          <div className="relative">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setDropdownOpenId(dropdownOpenId === m.meetingId ? null : m.meetingId);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 transition-all"
                            >
                              <MoreHorizontal size={18} />
                            </button>
                            
                            {dropdownOpenId === m.meetingId && (
                              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1a1d2e] border border-slate-200 dark:border-[#2A2E3B] rounded-xl shadow-xl z-50 py-1" onClick={e => e.stopPropagation()}>
                                <button 
                                  onClick={() => { setDropdownOpenId(null); deleteMeeting(m.meetingId); }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                >
                                  Cancel Scheduling
                                </button>
                                <button 
                                  onClick={() => { setDropdownOpenId(null); deleteMeeting(m.meetingId); }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                >
                                  Clear Meeting
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {!m.isLive && new Date(m.scheduledStart) > now && m.hostId === userId && (
                          <button 
                            onClick={() => startMeetingNow(m.meetingId)}
                            className="inline-flex items-center justify-center whitespace-nowrap min-w-[140px] px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 text-sm font-bold rounded-xl transition-all duration-200 ease-in-out active:scale-95 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                          >
                            Start Meeting Now
                          </button>
                        )}
                        
                        {!(m.hostId === userId && !m.isLive && new Date(m.scheduledStart) > now) && (
                          <a href={`/meetings/${m.meetingId}`} className={`inline-flex items-center justify-center whitespace-nowrap min-w-[140px] px-6 py-3 text-white text-sm font-bold rounded-xl transition-all duration-200 ease-in-out active:scale-95 ${m.isLive ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:-translate-y-0.5' : 'bg-slate-900 dark:bg-white/10 dark:hover:bg-white/20 dark:border dark:border-white/5 hover:bg-slate-800 shadow-sm'}`}>
                            {m.isLive ? 'Join Now' : 'View Details'}
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
