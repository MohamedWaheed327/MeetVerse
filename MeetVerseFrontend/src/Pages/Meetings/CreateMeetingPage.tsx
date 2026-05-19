/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  FileText,
  Settings,
  Shield,
  Waves,
  Save,
  Zap,
  Play
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createMeeting } from "../../services/createMeeting"
import { useToast } from "../../Context/ToastContext";

type MeetingFormData = {
  title: string;
  date: string;
  time: string;
  aiNoiseCancellation: boolean;
  liveTranscription: boolean;
  aiMeetingSummary: boolean;
  securePassword: boolean;
};

export default function CreateMeetingPage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get("groupId");
  const { showToast } = useToast();
  const [isInstantMode, setIsInstantMode] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState<MeetingFormData>({
    title: "",
    date: "",
    time: "",
    aiNoiseCancellation: true,
    liveTranscription: true,
    aiMeetingSummary: true,
    securePassword: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const key = name as keyof MeetingFormData;
    setFormData((prev) => ({
      ...prev,
      [key]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      if (isInstantMode) {
        const now = new Date().toISOString();
        const processedData = {
          ...formData,
          title: formData.title || "Instant Meeting",
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
          ...formData,
          scheduledStart: `${formData.date}T${formData.time}:00`,
          groupId: groupId,
        };
        await createMeeting(processedData);
        showToast("Meeting scheduled", "success");
        navigate("/meetings");
      }
    } catch (error) {
      console.error("Failed to create meeting:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0F16] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <motion.div
          {...fadeInUp}
          className="bg-white/80 dark:bg-[#181B26]/80 backdrop-blur-xl border border-slate-200 dark:border-[#2A2E3B] rounded-[3.5rem] p-8 md:p-12 shadow-2xl overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Zap size={120} className="text-blue-600" />
          </div>

          <div className="mb-12">
            <span className="text-purple-600 dark:text-purple-500 font-bold uppercase tracking-[0.3em] text-[10px]">
              Planner
            </span>
            <h1 className="text-4xl font-extrabold mt-2 tracking-tight">
              Setup New Session
            </h1>
            <p className="text-slate-500 dark:text-[#A8B0C2] text-sm mt-2">
              Configure AI-enhanced audio and meeting preferences.
            </p>
          </div>

          {/* Instant / Schedule Toggle */}
          <div className="flex items-center gap-3 mb-10 p-1.5 bg-slate-100 dark:bg-[#0D0F16] rounded-2xl w-fit">
            <button
              type="button"
              onClick={() => setIsInstantMode(true)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                isInstantMode
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Zap size={14} /> Start Now
            </button>
            <button
              type="button"
              onClick={() => setIsInstantMode(false)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                !isInstantMode
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Calendar size={14} /> Schedule
            </button>
          </div>

          <form className="space-y-10" onSubmit={handleSubmit}>
            {/* Section 1: Basic Info */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-[#A8B0C2] ml-1 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} /> Meeting Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder={isInstantMode ? "Quick meeting (optional)" : "e.g., Q1 Strategy Planning"}
                  className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl px-6 py-4 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                />
              </div>

              <AnimatePresence>
                {!isInstantMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-[#A8B0C2] ml-1 uppercase tracking-widest flex items-center gap-2">
                          <Calendar size={14} /> Set Date
                        </label>
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleChange}
                          className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl px-6 py-4 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-[#A8B0C2] ml-1 uppercase tracking-widest flex items-center gap-2">
                          <Clock size={14} /> Start Time
                        </label>
                        <input
                          type="time"
                          name="time"
                          value={formData.time}
                          onChange={handleChange}
                          className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl px-6 py-4 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Section 2: AI & Security Toggles */}
            <div className="p-8 bg-slate-50 dark:bg-[#0D0F16]/50 rounded-[2.5rem] border border-slate-200 dark:border-[#2A2E3B] space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Settings size={18} className="text-blue-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Advanced AI Features
                </h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    label: "AI Noise Cancellation",
                    icon: <Waves size={14} />,
                    name: "aiNoiseCancellation" as const,
                  },
                  {
                    label: "Live Transcription",
                    icon: <FileText size={14} />,
                    name: "liveTranscription" as const,
                  },
                  {
                    label: "AI Meeting Summary",
                    icon: <Zap size={14} />,
                    name: "aiMeetingSummary" as const,
                  },
                  {
                    label: "Secure Password",
                    icon: <Shield size={14} />,
                    name: "securePassword" as const,
                  },
                ].map((feature, i) => (
                  <label
                    key={i}
                    className="flex items-center justify-between p-4 bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl cursor-pointer hover:border-blue-500 transition-all group"
                  >
                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-[#A8B0C2]">
                      <span className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                        {feature.icon}
                      </span>
                      {feature.label}
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name={feature.name}
                        checked={formData[feature.name]}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              {isInstantMode ? (
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white py-5 rounded-[1.5rem] font-bold text-sm shadow-xl shadow-sky-900/20 transition-all active:scale-95 disabled:opacity-60"
                >
                  {isCreating ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Play size={18} />
                  )}
                  {isCreating ? "Starting..." : "Start Meeting Now"}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[1.5rem] font-bold text-sm shadow-xl shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-60"
                >
                  <Save size={18} /> Schedule Session
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate("/meetings")}
                className="sm:px-10 py-5 bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[1.5rem] text-sm font-bold hover:bg-slate-50 dark:hover:bg-[#232734] transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}