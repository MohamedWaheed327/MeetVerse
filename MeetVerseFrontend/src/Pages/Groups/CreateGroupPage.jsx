/* eslint-disable no-unused-vars */
import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { motion } from "framer-motion";
import { Users, Info, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";

export default function CreateGroupPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0F16] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/80 dark:bg-[#181B26]/80 backdrop-blur-xl border border-slate-200 dark:border-[#2A2E3B] rounded-[3.5rem] p-10 md:p-14 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
            <Sparkles size={120} className="text-blue-600" />
          </div>

          <div className="mb-12">
            <span className="text-blue-600 font-bold uppercase tracking-[0.3em] text-[10px]">
              Community Builder
            </span>
            <h1 className="text-4xl font-extrabold mt-2 tracking-tight">
              Create Space
            </h1>
            <p className="text-slate-500 dark:text-[#A8B0C2] text-sm mt-2 leading-relaxed">
              Build a permanent space for your AI team, classes, or research
              squad.
            </p>
          </div>

          <form className="space-y-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-[#A8B0C2] ml-1 uppercase tracking-widest flex items-center gap-2">
                <Users size={14} /> Space Name
              </label>
              <input
                type="text"
                placeholder="e.g. AI Visionaries Group"
                className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl px-6 py-4 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-[#A8B0C2] ml-1 uppercase tracking-widest flex items-center gap-2">
                <Info size={14} /> Space Mission
              </label>
              <textarea
                rows={4}
                placeholder="What is this community about?"
                className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl px-6 py-4 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none resize-none"
              />
            </div>

            <label className="flex items-center justify-between p-6 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-[2rem] cursor-pointer group hover:bg-blue-500 transition-all">
              <div className="flex items-center gap-4 text-xs font-bold text-blue-600 group-hover:text-white">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <ShieldCheck size={16} className="text-blue-600" />
                </div>
                Public ID Enrollment
              </div>
              <div className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
              </div>
            </label>

            <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-3xl font-bold text-sm shadow-xl shadow-blue-900/20 transition-all active:scale-95">
              Launch Community Space <ArrowRight size={18} />
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
