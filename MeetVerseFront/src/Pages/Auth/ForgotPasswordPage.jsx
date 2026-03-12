/* eslint-disable no-unused-vars */
import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { motion } from "framer-motion";
import { Key, Mail, ArrowLeft, Send } from "lucide-react";
import { Link } from "react-router-dom";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0F16] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white/80 dark:bg-[#181B26]/80 backdrop-blur-xl rounded-[3rem] border border-slate-200 dark:border-[#2A2E3B] p-10 md:p-12 shadow-2xl relative overflow-hidden"
        >
          <div className="text-center mb-10">
            <div className="inline-flex p-4 bg-blue-600/10 text-blue-600 rounded-2xl mb-4">
              <Key size={32} />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Reset Password
            </h1>
            <p className="text-slate-500 dark:text-[#A8B0C2] text-sm mt-2">
              We'll send a recovery link to your inbox.
            </p>
          </div>

          <form className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Registered Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-3.5 text-slate-400"
                  size={16}
                />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:border-blue-600 outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <Link to="/otp-verification">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-[1.5rem] shadow-xl shadow-blue-900/20 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                Send Reset Link <Send size={18} />
              </button>
            </Link>
          </form>

          <div className="mt-8 text-center">
            <a
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all"
            >
              <ArrowLeft size={16} /> Back to Login
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
