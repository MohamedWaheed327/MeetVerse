/* eslint-disable no-unused-vars */
import React from "react";
import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  FileText,
  Settings,
  Shield,
  Waves,
  Save,
  Zap,
} from "lucide-react";

export default function CreateMeetingPage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0F16] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <motion.div
          {...fadeInUp}
          className="bg-white/80 dark:bg-[#181B26]/80 backdrop-blur-xl border border-slate-200 dark:border-[#2A2E3B] rounded-[3.5rem] p-8 md:p-12 shadow-2xl overflow-hidden relative"
        >
          {/* Animated Header Ornament */}
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

          <form className="space-y-10">
            {/* Section 1: Basic Info */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-[#A8B0C2] ml-1 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} /> Meeting Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Q1 Strategy Planning"
                  className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl px-6 py-4 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-[#A8B0C2] ml-1 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={14} /> Set Date
                  </label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl px-6 py-4 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-[#A8B0C2] ml-1 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={14} /> Start Time
                  </label>
                  <input
                    type="time"
                    className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl px-6 py-4 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                  />
                </div>
              </div>
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
                    default: true,
                  },
                  {
                    label: "Live Transcription",
                    icon: <FileText size={14} />,
                    default: true,
                  },
                  {
                    label: "AI Meeting Summary", // الخيار الجديد المضاف
                    icon: <Zap size={14} />,
                    default: true,
                  },
                  {
                    label: "Secure Password",
                    icon: <Shield size={14} />,
                    default: false,
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
                        defaultChecked={feature.default}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[1.5rem] font-bold text-sm shadow-xl shadow-blue-900/20 transition-all active:scale-95"
              >
                <Save size={18} /> Schedule Session
              </button>
              <button
                type="button"
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
