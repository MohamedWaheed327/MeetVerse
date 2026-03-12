/* eslint-disable no-unused-vars */
import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, ArrowRight, Github, Chrome } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    localStorage.setItem("userToken", "true");
    setTimeout(() => {
      setLoading(false);
      navigate("/home");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0F16] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 flex justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white/80 dark:bg-[#181B26]/80 backdrop-blur-xl rounded-[3rem] border border-slate-200 dark:border-[#2A2E3B] p-10 md:p-12 shadow-2xl relative overflow-hidden"
        >
          <div className="text-center mb-10">
            <div className="inline-flex p-4 bg-blue-600/10 text-blue-600 rounded-2xl mb-4">
              <LogIn size={32} />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome Back
            </h1>
            <p className="text-slate-500 dark:text-[#A8B0C2] text-sm mt-2">
              Login to access your MeetVerse dashboard.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Email Address
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

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Password
                </label>
                <a
                  href="/forgot-password"
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                >
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-3.5 text-slate-400"
                  size={16}
                />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:border-blue-600 outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-bold py-4 rounded-[1.5rem] shadow-xl shadow-blue-900/20 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? (
                "Authenticating..."
              ) : (
                <>
                  Login <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8 text-center">
            <span className="absolute inset-x-0 top-1/2 h-px bg-slate-200 dark:bg-[#2A2E3B]"></span>
            <span className="relative bg-white dark:bg-[#181B26] px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Or Continue With
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-xl hover:bg-slate-100 transition-all">
              <Chrome size={18} />{" "}
              <span className="text-xs font-bold">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-xl hover:bg-slate-100 transition-all">
              <Github size={18} />{" "}
              <span className="text-xs font-bold">Github</span>
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            New to MeetVerse?{" "}
            <a
              href="/signup"
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              Sign up
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
