/* eslint-disable no-unused-vars */
import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { motion } from "framer-motion";
import { Key, Mail, ArrowLeft, Send, LoaderPinwheel } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { FormEvent, useState } from "react";
import { LiquidMetalButton } from "../../components/ui/LiquidMetalButton";
import { requestPasswordReset } from "../../services/forgotPassword";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await requestPasswordReset(email.trim());
      setSuccess(
        "If an account exists for this email, a reset code has been sent. Check the server console in development."
      );
      navigate("/otp-verification", { state: { email: email.trim().toLowerCase() } });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to send reset code.");
    } finally {
      setLoading(false);
    }
  };

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
              Enter your email and we&apos;ll send a 6-digit verification code.
            </p>
          </div>

          {error && (
            <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-sm text-center">
              {success}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:border-blue-600 outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <LiquidMetalButton
              type="submit"
              disabled={loading}
              width="full"
              className="w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <LoaderPinwheel className="animate-spin relative z-10" />
              ) : (
                <>
                  Send Reset Code <Send size={18} className="ml-2 relative z-10" />
                </>
              )}
            </LiquidMetalButton>
          </form>

          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all"
            >
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
