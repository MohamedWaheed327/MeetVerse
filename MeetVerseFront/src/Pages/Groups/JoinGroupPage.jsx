/* eslint-disable no-unused-vars */
import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { motion } from "framer-motion";
import { Hash, Search, ArrowRight, Shield } from "lucide-react";

export default function JoinGroupPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0F16] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-[#181B26]/80 backdrop-blur-xl border border-slate-200 dark:border-[#2A2E3B] rounded-[3rem] p-10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-800 to-blue-800" />

          <div className="text-center mb-10">
            <span className="text-blue-800 font-bold uppercase tracking-[0.3em] text-[10px]">
              Portal
            </span>
            <h1 className="text-3xl font-extrabold mt-2 tracking-tight">
              Enter Community
            </h1>
            <p className="text-slate-500 dark:text-[#A8B0C2] text-sm mt-2 leading-relaxed">
              Enter a unique Space ID to access exclusive community features.
            </p>
          </div>

          <form className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-[#A8B0C2] ml-1 uppercase tracking-widest flex items-center gap-2">
                <Hash size={14} /> Unique Space ID
              </label>
              <div className="relative">
                <Search
                  className="absolute left-5 top-5 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="G-XXXX"
                  className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl py-5 pl-14 pr-6 text-sm font-mono focus:border-blue-800 transition-all outline-none"
                />
              </div>
            </div>

            <button className="w-full flex items-center justify-center gap-2 bg-blue-800 hover:bg-blue-900 cursor-pointer text-white py-5 rounded-[1.5rem] font-bold text-sm shadow-xl shadow-blue-900/20 transition-all active:scale-95">
              Connect to Space <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-[#2A2E3B] flex items-center justify-center gap-3 text-slate-400">
            <Shield size={14} />
            <p className="text-[10px] font-bold uppercase tracking-widest">
              Valid IDs only • Powered by MeetVerse AI
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
