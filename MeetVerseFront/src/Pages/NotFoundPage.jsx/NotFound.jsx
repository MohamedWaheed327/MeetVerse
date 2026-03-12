/* eslint-disable no-unused-vars */
import { Home, LayoutDashboard, Link2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0F16] transition-colors duration-300 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white dark:bg-[#181B26] rounded-[3rem] shadow-2xl p-10 md:p-16 border border-slate-100 dark:border-[#2A2E3B] overflow-hidden text-center"
        >
          {/* Decorative Glow */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600" />

          <div className="flex justify-center mb-10">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="relative w-24 h-24 rounded-3xl bg-blue-600/10 flex items-center justify-center text-blue-600"
            >
              <Link2 size={48} />
            </motion.div>
          </div>

          <h1 className="text-8xl md:text-9xl font-black text-slate-900 dark:text-white tracking-tighter mb-6">
            404
          </h1>

          <div className="space-y-4 mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
              Lost in Space?
            </h2>
            <p className="text-slate-500 dark:text-[#A8B0C2] max-w-md mx-auto leading-relaxed">
              The page you are looking for doesn't exist or has been moved to
              another frequency.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <NavLink to="/home" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                <Home size={20} /> Go Back Home
              </button>
            </NavLink>

            <button className="w-full sm:w-auto px-8 py-4 bg-slate-100 dark:bg-[#2A2E3B] text-slate-900 dark:text-white rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-[#353A4D] transition-all flex items-center justify-center gap-3">
              <LayoutDashboard size={20} /> View Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
