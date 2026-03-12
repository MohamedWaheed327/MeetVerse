/* eslint-disable no-unused-vars */
import React from "react";
import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { motion } from "framer-motion";
import { User, Shield, Camera, Trash2, Save, Key } from "lucide-react";

export default function ProfilePage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0F16] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Header Section */}
        <motion.div {...fadeInUp} className="mb-10">
          <span className="text-blue-600 dark:text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px]">
            Account Settings
          </span>
          <h1 className="text-4xl font-extrabold mt-2 tracking-tight">
            Your Identity
          </h1>
          <p className="text-slate-600 dark:text-[#A8B0C2] mt-2 text-sm max-w-xl">
            Manage your MeetVerse presence, update security credentials, and
            customize your profile appearance.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column: Avatar & Quick Actions */}
          <motion.div {...fadeInUp} className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[2.5rem] p-8 text-center shadow-xl dark:shadow-2xl backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-600"></div>

              <div className="relative inline-block group cursor-pointer">
                <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-5xl font-bold shadow-2xl mb-6 transform group-hover:scale-105 transition-transform duration-300 text-white">
                  Y
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-[2.5rem] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                  <Camera className="text-white w-8 h-8" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Your Name
              </h3>
              <p className="text-slate-500 dark:text-[#A8B0C2] text-sm mb-6">
                you@example.com
              </p>

              <div className="flex justify-center gap-2 mb-8">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Host
                </span>
                <span className="px-3 py-1 bg-slate-100 dark:bg-[#2A2E3B] text-slate-600 dark:text-[#A8B0C2] text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Participant
                </span>
              </div>

              <button className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-[#2A2E3B] hover:bg-slate-200 dark:hover:bg-[#353A4D] text-slate-900 dark:text-white py-3 rounded-2xl transition-all font-semibold text-sm">
                <Camera size={18} />
                Change Avatar
              </button>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 rounded-[2rem] p-6">
              <div className="flex items-center gap-2 mb-4 text-red-600 dark:text-red-400">
                <Trash2 size={18} />
                <h4 className="font-bold text-xs uppercase tracking-wider">
                  Danger Zone
                </h4>
              </div>
              <p className="text-red-700/70 dark:text-red-300/60 text-[11px] mb-4 leading-relaxed">
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </p>
              <button className="w-full bg-red-100 dark:bg-red-500/10 hover:bg-red-600 dark:hover:bg-red-500 hover:text-white border border-red-200 dark:border-red-500/50 text-red-600 dark:text-red-500 py-3 rounded-2xl transition-all text-xs font-bold">
                Delete MeetVerse Account
              </button>
            </div>
          </motion.div>

          {/* Right Column: Forms */}
          <motion.div
            {...fadeInUp}
            transition={{ delay: 0.2 }}
            className="lg:col-span-8 space-y-8"
          >
            {/* Form: Personal Info */}
            <div className="bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[2.5rem] p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-blue-600/10 rounded-xl text-blue-600 dark:text-blue-500">
                  <User size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Personal Information
                </h2>
              </div>

              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-[#A8B0C2] ml-1 uppercase tracking-widest">
                      First Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Your"
                      className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl px-5 py-4 text-sm text-slate-900 dark:text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-[#A8B0C2] ml-1 uppercase tracking-widest">
                      Last Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Name"
                      className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl px-5 py-4 text-sm text-slate-900 dark:text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-[#A8B0C2] ml-1 uppercase tracking-widest">
                    Display Name
                  </label>
                  <input
                    type="text"
                    defaultValue="You_MeetVerse"
                    className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl px-5 py-4 text-sm text-slate-900 dark:text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                  />
                </div>

                <div className="pt-4">
                  <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/20 font-bold text-sm">
                    <Save size={18} />
                    Save Profile Changes
                  </button>
                </div>
              </form>
            </div>

            {/* Form: Security */}
            <div className="bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[2.5rem] p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-blue-600/10 rounded-xl text-blue-600 dark:text-blue-500">
                  <Shield size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Security & Password
                </h2>
              </div>

              <form className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-[#A8B0C2] ml-1 uppercase tracking-widest">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl px-5 py-4 text-sm text-slate-900 dark:text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                    />
                    <Key
                      className="absolute right-5 top-4 text-slate-300 dark:text-[#2A2E3B]"
                      size={18}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-[#A8B0C2] ml-1 uppercase tracking-widest">
                      New Password
                    </label>
                    <input
                      type="password"
                      className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl px-5 py-4 text-sm text-slate-900 dark:text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-[#A8B0C2] ml-1 uppercase tracking-widest">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl px-5 py-4 text-sm text-slate-900 dark:text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-8 py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/20 font-bold text-sm">
                    <Shield size={18} />
                    Update Credentials
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
