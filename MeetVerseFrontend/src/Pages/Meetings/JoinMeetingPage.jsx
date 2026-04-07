/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { motion } from "framer-motion";
import {
  Link2,
  User,
  MicOff,
  VideoOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../../services/currentUser";

export default function JoinMeetingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const meetingId = searchParams.get("meetingId");

  const [joinData, setJoinData] = useState({
    meetingId: meetingId ?? "",
    displayName: localStorage.getItem("username") ?? "",
    muteMic: true,
    cameraOff: true,
  });

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setJoinData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function joinMeeting(meetingId, displayName) {
    navigate(`/meetings/${meetingId}`, {
      state: {
        displayName,
        muteMic: joinData.muteMic,
        cameraOff: joinData.cameraOff,
      },
    });
  }

  function handleSubmit(e) {
    e.preventDefault();

    const meetingId = joinData.meetingId.trim();
    const displayName = joinData.displayName.trim();

    if (!meetingId || !displayName) {
      alert("Please enter both Meeting ID and Display Name.");
      return;
    }

    joinMeeting(meetingId, displayName);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0F16] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300">
      <Navbar />

      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <motion.div
          {...fadeInUp}
          className="rounded-[3rem] border border-slate-200 dark:border-[#2A2E3B] bg-white/80 dark:bg-[#181B26]/80 backdrop-blur-xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
        >
          {/* Background Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[100px] pointer-events-none" />

          <div className="text-center mb-10">
            <span className="text-blue-600 dark:text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px]">
              Access Point
            </span>
            <h1 className="text-3xl font-extrabold mt-2 tracking-tight">
              Join Meeting
            </h1>
            <p className="text-slate-500 dark:text-[#A8B0C2] text-sm mt-2">
              Enter your invitation details to connect instantly.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-[#A8B0C2] ml-1 uppercase tracking-widest flex items-center gap-2">
                <Link2 size={14} /> Meeting ID
              </label>
              <input
                type="text"
                name="meetingId"
                value={joinData.meetingId}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl px-5 py-4 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                placeholder="Enter Meeting ID"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-[#A8B0C2] ml-1 uppercase tracking-widest flex items-center gap-2">
                <User size={14} /> Your Display Name
              </label>
              <input
                type="text"
                name="displayName"
                value={joinData.displayName}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl px-5 py-4 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                placeholder="Enter your name"
              />
            </div>

            {/* Privacy Toggles Container */}
            <div className="space-y-3 pt-2">
              {/* Mic Toggle */}
              <label className="group flex items-center gap-3 cursor-pointer p-4 bg-slate-50 dark:bg-[#0D0F16] rounded-2xl border border-slate-200 dark:border-[#2A2E3B] hover:border-blue-500 transition-all">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    name="muteMic"
                    checked={joinData.muteMic}
                    onChange={handleChange}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 dark:border-[#2A2E3B] checked:bg-blue-600 checked:border-blue-600 transition-all"
                  />
                  <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="1"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-[#A8B0C2] flex items-center gap-2">
                  <MicOff size={14} /> Join with microphone muted
                </span>
              </label>

              {/* Camera Toggle */}
              <label className="group flex items-center gap-3 cursor-pointer p-4 bg-slate-50 dark:bg-[#0D0F16] rounded-2xl border border-slate-200 dark:border-[#2A2E3B] hover:border-blue-500 transition-all">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    name="cameraOff"
                    checked={joinData.cameraOff}
                    onChange={handleChange}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 dark:border-[#2A2E3B] checked:bg-blue-600 checked:border-blue-600 transition-all"
                  />
                  <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="1"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-[#A8B0C2] flex items-center gap-2">
                  <VideoOff size={14} /> Join with camera turned off
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[1.5rem] font-bold text-sm shadow-xl shadow-blue-900/20 transition-all active:scale-95"
            >
              Secure Join <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-[#2A2E3B] flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={16} />
            <p className="text-[10px] font-bold uppercase tracking-wider">
              MeetVerse end-to-end encryption active
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}