import React, { useState, useEffect, useRef } from "react";
import { setPageTitle } from "../../utils/setPageTitle";
import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  FileText,
  Settings,
  Shield,
  Waves,
  Zap,
  Play,
  Eye,
  EyeOff,
  Mic,
  ChevronRight,
  Sparkles,
  Video
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createMeeting } from "../../services/createMeeting";
import { useToast } from "../../Context/ToastContext";
import Logo from "../../components/Shared/Logo";
import { LiquidMetalButton } from "../../components/ui/LiquidMetalButton";

type MeetingFormData = {
  title: string;
  date: string;
  time: string;
  aiNoiseCancellation: boolean;
  liveTranscription: boolean;
  aiMeetingSummary: boolean;
  securePassword: boolean;
  password?: string;
};

export default function CreateMeetingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get("groupId");
  const { showToast } = useToast();
  
  const [isInstantMode, setIsInstantMode] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setPageTitle("New Meeting");
  }, []);

  const [formData, setFormData] = useState<MeetingFormData>({
    title: "",
    date: "",
    time: "",
    aiNoiseCancellation: true,
    liveTranscription: true,
    aiMeetingSummary: true,
    securePassword: false,
    password: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof MeetingFormData, string>>>({});
  const [shakeField, setShakeField] = useState<string | null>(null);
  
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const titleSuggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (titleSuggestionsRef.current && !titleSuggestionsRef.current.contains(event.target as Node)) {
        setIsTitleFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const key = name as keyof MeetingFormData;
    
    if (key === 'title' && value.length > 80) return;
    
    setFormData((prev) => ({
      ...prev,
      [key]: type === "checkbox" ? checked : value,
    }));
    
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: undefined }));
    }
  };

  const triggerShake = (field: string) => {
    setShakeField(field);
    setTimeout(() => setShakeField(null), 300);
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof MeetingFormData, string>> = {};
    let firstErrorField: string | null = null;
    
    if (formData.title.trim() && formData.title.trim().length > 80) {
      newErrors.title = "Maximum 80 characters allowed";
      firstErrorField = firstErrorField || 'title';
    }
    
    if (!isInstantMode) {
      if (!formData.date) {
        newErrors.date = "Date is required";
        firstErrorField = firstErrorField || 'date';
      } else {
        const selectedDate = new Date(`${formData.date}T${formData.time || '00:00'}`);
        const today = new Date();
        if (selectedDate < today && formData.time) {
          newErrors.date = "Cannot schedule a meeting in the past";
          firstErrorField = firstErrorField || 'date';
        } else if (selectedDate < today && !formData.time) {
          today.setHours(0, 0, 0, 0);
          if (selectedDate < today) {
            newErrors.date = "Date cannot be in the past";
            firstErrorField = firstErrorField || 'date';
          }
        }
      }
      
      if (formData.date && !formData.time) {
        newErrors.time = "Time is required";
        firstErrorField = firstErrorField || 'time';
      }
    }

    if (formData.securePassword) {
      if (!formData.password || formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
        firstErrorField = firstErrorField || 'password';
      }
    }
    
    setErrors(newErrors);
    if (firstErrorField) {
      triggerShake(firstErrorField);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!validate()) return;
    
    setIsCreating(true);

    try {
      const basePayload = {
        title: formData.title.trim() || "Instant Meeting",
        aiNoiseCancellation: formData.aiNoiseCancellation,
        liveTranscription: formData.liveTranscription,
        aiMeetingSummary: formData.aiMeetingSummary,
        securePassword: formData.securePassword,
        ...(formData.securePassword && { password: formData.password })
      };

      if (isInstantMode) {
        const now = new Date().toISOString();
        const processedData = {
          ...basePayload,
          scheduledStart: now,
          groupId: groupId,
        };
        const meetingId = await createMeeting(processedData);
        if (meetingId) {
          showToast("Meeting created: " + meetingId, "success");
          navigate(`/meetings/${meetingId}`, { state: { muteMic: false, cameraOff: false } });
        }
      } else {
        const processedData = {
          ...basePayload,
          scheduledStart: `${formData.date}T${formData.time}:00`,
          groupId: groupId,
        };
        await createMeeting(processedData);
        showToast("Meeting scheduled", "success");
        navigate("/meetings");
      }
    } catch (error) {
      console.error("Failed to create meeting:", error);
      showToast("Failed to create meeting", "error");
    } finally {
      setIsCreating(false);
    }
  };

  const hasErrors = Object.keys(errors).some(k => errors[k as keyof MeetingFormData]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !hasErrors) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const suggestions = ["Weekly Sync", "Morning Standup", "Design Review", "Project Kickoff", "Q2 Strategy Planning"];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0F16] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300">
      <Navbar />
      
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseOrb {
          0%, 100% { transform: scale(1) translate(0,0); opacity: 0.6; }
          33% { transform: scale(1.1) translate(30px, -30px); opacity: 0.8; }
          66% { transform: scale(0.9) translate(-30px, 30px); opacity: 0.5; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-slideUpFade { animation: slideUpFade 0.4s ease-out forwards; }
        .animate-pulseOrb { animation: pulseOrb 12s infinite alternate ease-in-out; }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="flex flex-col lg:flex-row bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[2.5rem] shadow-2xl overflow-hidden min-h-[700px] animate-slideUpFade">
            
          {/* Left Panel */}
          <div className="hidden lg:flex flex-col justify-between w-[40%] bg-gradient-to-br from-indigo-50 to-violet-100 dark:from-[#131520] dark:to-[#1A1D2E] p-12 relative overflow-hidden border-r border-slate-200 dark:border-[#2A2E3B]">
            {/* Animated Orb */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-tr from-blue-500/30 to-violet-500/30 blur-3xl rounded-full animate-pulseOrb pointer-events-none" />
            
            <div className="relative z-10 space-y-2">
              <div className="mb-10">
                <Logo imageClassName="h-10" textClassName="text-2xl" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
                Your meeting starts in seconds.
              </h2>
              <p className="text-slate-500 dark:text-[#A8B0C2] text-sm leading-relaxed">
                Experience next-generation remote collaboration powered by artificial intelligence.
              </p>
            </div>

            <div className="relative z-10 space-y-6 mt-12">
              <div className="flex items-start gap-4">
                <div className="mt-1 p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><Waves size={16} /></div>
                <div>
                  <h4 className="font-bold text-sm">AI Noise Cancellation</h4>
                  <p className="text-xs text-slate-500 dark:text-[#A8B0C2] mt-1">Crystal clear audio in any environment</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 p-2 bg-purple-500/10 text-purple-500 rounded-lg"><FileText size={16} /></div>
                <div>
                  <h4 className="font-bold text-sm">Live Transcription</h4>
                  <p className="text-xs text-slate-500 dark:text-[#A8B0C2] mt-1">Never miss a word with real-time captions</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Zap size={16} /></div>
                <div>
                  <h4 className="font-bold text-sm">Zero Friction</h4>
                  <p className="text-xs text-slate-500 dark:text-[#A8B0C2] mt-1">Join instantly without complicated setups</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel (Form) */}
          <div className="w-full lg:w-[60%] p-8 sm:p-12 flex flex-col justify-center bg-white dark:bg-[#181B26]">
            
            <div className="mb-10">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
                <a href="/meetings" className="hover:text-blue-500 transition-colors">Dashboard</a>
                <ChevronRight size={12} />
                <a href="/meetings" className="hover:text-blue-500 transition-colors">Meetings</a>
                <ChevronRight size={12} />
                <span className="text-slate-800 dark:text-slate-200">New Meeting</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">Setup New Session</h1>
              <p className="text-slate-500 dark:text-[#A8B0C2] text-sm mt-2">Configure AI-enhanced audio and meeting preferences.</p>
            </div>

            {/* Segmented Control Tabs */}
            <div className="relative flex p-1 bg-slate-100 dark:bg-white/5 rounded-xl w-full max-w-sm mb-10 overflow-hidden">
              <div 
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-white/10 rounded-lg shadow-sm transition-transform duration-300 ease-in-out ${!isInstantMode ? "translate-x-full" : "translate-x-0"}`} 
              />
              <button
                type="button"
                onClick={() => { setIsInstantMode(true); setErrors({}); }}
                className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition-colors z-10 ${isInstantMode ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                <Zap size={16} /> Start Now
              </button>
              <button
                type="button"
                onClick={() => { setIsInstantMode(false); setErrors({}); }}
                className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition-colors z-10 ${!isInstantMode ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                <Calendar size={16} /> Schedule
              </button>
            </div>

            <form className="space-y-8" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
              
              <div className="space-y-6">
                {/* Floating Label Title Input */}
                <div className="relative w-full" ref={titleSuggestionsRef}>
                  <div className={`relative border rounded-2xl transition-all duration-200 bg-white dark:bg-[#131520] ${shakeField === 'title' ? 'animate-shake border-red-500' : isTitleFocused || formData.title ? 'ring-2 ring-blue-500/40 border-blue-500' : 'border-slate-300 dark:border-[#2A2E3B] hover:border-slate-400 dark:hover:border-slate-600'}`}>
                    <label className={`absolute left-4 transition-all duration-200 pointer-events-none text-slate-400 font-medium z-10 ${isTitleFocused || formData.title ? '-translate-y-[10px] scale-75 top-1 bg-white dark:bg-[#131520] px-1' : 'translate-y-4 text-sm'}`}>
                      Meeting Title (Optional)
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      onFocus={() => setIsTitleFocused(true)}
                      placeholder={isTitleFocused || formData.title ? (isInstantMode ? "e.g., Quick Sync" : "e.g., Q1 Strategy Planning") : ""}
                      className="w-full bg-transparent px-4 pb-2 pt-6 text-sm outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    />
                    <div className="absolute bottom-2 right-4 text-[10px] font-medium text-slate-400">
                      {formData.title.length}/80
                    </div>
                  </div>
                  {errors.title && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.title}</p>}

                  {/* Title Suggestions Dropdown */}
                  <AnimatePresence>
                    {isTitleFocused && !formData.title && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute z-20 w-full mt-2 py-2 bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-xl shadow-xl"
                      >
                        <div className="px-4 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Suggestions</div>
                        {suggestions.map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({...prev, title: s}));
                              setIsTitleFocused(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Schedule Fields */}
                <div 
                  className={`grid md:grid-cols-2 gap-6 overflow-hidden transition-all duration-300 ease-in-out ${!isInstantMode ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0 !mt-0'}`}
                >
                  <div>
                    <div className={`relative border rounded-2xl transition-all duration-200 bg-white dark:bg-[#131520] ${shakeField === 'date' ? 'animate-shake border-red-500' : 'focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-500 border-slate-300 dark:border-[#2A2E3B]'}`}>
                      <label className="absolute left-4 top-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full bg-transparent px-4 pb-2 pt-6 text-sm outline-none dark:[color-scheme:dark]"
                      />
                    </div>
                    {errors.date && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.date}</p>}
                  </div>
                  <div>
                    <div className={`relative border rounded-2xl transition-all duration-200 bg-white dark:bg-[#131520] ${shakeField === 'time' ? 'animate-shake border-red-500' : 'focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-500 border-slate-300 dark:border-[#2A2E3B]'}`}>
                      <label className="absolute left-4 top-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</label>
                      <input
                        type="time"
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        min={formData.date === new Date().toISOString().split('T')[0] ? new Date().toTimeString().slice(0, 5) : undefined}
                        className="w-full bg-transparent px-4 pb-2 pt-6 text-sm outline-none dark:[color-scheme:dark]"
                      />
                    </div>
                    {errors.time && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.time}</p>}
                  </div>
                  {!isInstantMode && <p className="text-xs text-slate-400 md:col-span-2 ml-1">Times are shown in your local timezone</p>}
                </div>
              </div>

              {/* Advanced AI Features */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-widest bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                    Advanced AI Features
                  </h3>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-xl cursor-pointer hover:border-blue-500 dark:hover:border-white/15 transition-all group">
                    <div className="flex gap-3">
                      <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 shrink-0 h-fit"><Waves size={16} /></div>
                      <div>
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Noise Cancellation</div>
                        <div className="text-xs text-slate-400 mt-0.5">Removes background noise in real time</div>
                      </div>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" name="aiNoiseCancellation" checked={formData.aiNoiseCancellation} onChange={handleChange} className="sr-only peer" />
                      <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-xl cursor-pointer hover:border-blue-500 dark:hover:border-white/15 transition-all group">
                    <div className="flex gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500 shrink-0 h-fit"><FileText size={16} /></div>
                      <div>
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Live Transcription</div>
                        <div className="text-xs text-slate-400 mt-0.5">Auto-generates captions and transcript</div>
                      </div>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" name="liveTranscription" checked={formData.liveTranscription} onChange={handleChange} className="sr-only peer" />
                      <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-xl cursor-pointer hover:border-blue-500 dark:hover:border-white/15 transition-all group">
                    <div className="flex gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 shrink-0 h-fit"><Sparkles size={16} /></div>
                      <div>
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Meeting Summary</div>
                        <div className="text-xs text-slate-400 mt-0.5">Get a summary when the meeting ends</div>
                      </div>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" name="aiMeetingSummary" checked={formData.aiMeetingSummary} onChange={handleChange} className="sr-only peer" />
                      <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-xl cursor-pointer hover:border-blue-500 dark:hover:border-white/15 transition-all group">
                    <div className="flex gap-3">
                      <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 shrink-0 h-fit"><Shield size={16} /></div>
                      <div>
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Secure Password</div>
                        <div className="text-xs text-slate-400 mt-0.5">Require a password to join</div>
                      </div>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" name="securePassword" checked={formData.securePassword} onChange={handleChange} className="sr-only peer" />
                      <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </div>
                  </label>
                </div>

                {/* Password Reveal Field */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${formData.securePassword ? 'max-h-[100px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                  <div className={`relative border rounded-xl transition-all duration-200 bg-white dark:bg-[#131520] flex items-center ${shakeField === 'password' ? 'animate-shake border-red-500' : 'focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-500 border-slate-300 dark:border-[#2A2E3B]'}`}>
                    <Shield size={16} className="text-slate-400 ml-4 absolute pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter a secure password..."
                      className="w-full bg-transparent pl-12 pr-12 py-3.5 text-sm outline-none placeholder:text-slate-400"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                      {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.password}</p>}
                </div>
              </div>

              {/* CTAs */}
              <div className="pt-6 flex flex-col sm:flex-row gap-4 border-t border-slate-200 dark:border-[#2A2E3B]">
                <LiquidMetalButton
                  type="submit"
                  disabled={isCreating || hasErrors}
                  width="full"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <span className="flex items-center gap-2 relative z-10">
                    {isCreating ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      isInstantMode ? <Play size={18} /> : <Calendar size={18} />
                    )}
                    <span>{isCreating ? "Processing..." : (isInstantMode ? "Start Meeting Now" : "Schedule Session")}</span>
                    {!isCreating && <span className="ml-2 px-1.5 py-0.5 rounded border border-white/20 bg-white/10 text-[10px] font-mono flex items-center shrink-0">↵ Enter</span>}
                  </span>
                </LiquidMetalButton>
                <button
                  type="button"
                  onClick={() => navigate("/meetings")}
                  className="px-8 py-4 bg-transparent border border-slate-200 dark:border-white/20 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}