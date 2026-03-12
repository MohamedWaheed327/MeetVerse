/* eslint-disable no-unused-vars */
import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Mail, Lock, User, ArrowRight } from "lucide-react";

export default function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    localStorage.setItem("userToken", "true");
    setTimeout(() => {
      setLoading(false);
      navigate("/home");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0F16] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg bg-white/80 dark:bg-[#181B26]/80 backdrop-blur-xl rounded-[3rem] border border-slate-200 dark:border-[#2A2E3B] p-10 md:p-14 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[100px] pointer-events-none" />

          <div className="text-center mb-10">
            <div className="inline-flex p-4 bg-blue-600/10 text-blue-600 rounded-2xl mb-4">
              <UserPlus size={32} />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Create Account
            </h1>
            <p className="text-slate-500 dark:text-[#A8B0C2] text-sm mt-2">
              Join MeetVerse for a distraction-free experience.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  First Name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-4 top-3.5 text-slate-400"
                    size={16}
                  />
                  <input
                    type="text"
                    required
                    placeholder="John"
                    className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:border-blue-600 outline-none transition-all shadow-inner"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Doe"
                  className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl px-5 py-3.5 text-sm focus:border-blue-600 outline-none transition-all shadow-inner"
                />
              </div>
            </div>

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
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Password
              </label>
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

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                required
                className="peer h-5 w-5 appearance-none rounded-lg border border-slate-300 dark:border-[#2A2E3B] checked:bg-blue-600 transition-all cursor-pointer"
              />
              <span className="text-xs text-slate-500 dark:text-[#A8B0C2] group-hover:text-slate-700 dark:group-hover:text-white transition-colors">
                I agree to the{" "}
                <span className="text-blue-600 font-bold underline cursor-pointer">
                  Terms & Privacy
                </span>
                .
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-bold py-4 rounded-[1.5rem] shadow-xl shadow-blue-900/20 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? (
                "Creating Account..."
              ) : (
                <>
                  Get Started <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already a member?{" "}
            <a
              href="/login"
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              Log in
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
