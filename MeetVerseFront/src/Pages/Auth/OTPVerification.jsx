/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from "react";
import OtpInput from "react-otp-input";
import {
  Mail,
  ShieldCheck,
  ArrowRight,
  LoaderPinwheel,
  RotateCw,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";

export default function OTPVerification() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const location = useLocation();
  const email = location.state?.email || "user@meetverse.app";
  const [timer, setTimer] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(true);

  useEffect(() => {
    let interval;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    if (timer === 0) setIsTimerActive(false);
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  const handleResend = () => {
    if (!isTimerActive) {
      setOtp("");
      setTimer(60);
      setIsTimerActive(true);
    }
  };

  const handleVerify = () => {
    if (otp.length === 6) {
      setLoading(true);
      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
        setLoading(false);
      }, 1000);
    }
  };

  return (
    <>
      <Helmet>
        <title>OTP Verification | MeetVerse</title>
      </Helmet>
      <div className="min-h-screen bg-slate-50 dark:bg-[#0D0F16] flex items-center justify-center px-4 transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white dark:bg-[#181B26] rounded-[3rem] shadow-2xl p-10 border border-slate-100 dark:border-[#2A2E3B] text-center"
        >
          <div className="flex justify-center mb-8 text-blue-600">
            <div className="p-5 bg-blue-600/10 rounded-[2rem]">
              <Mail size={40} />
            </div>
          </div>

          <h1 className="text-3xl font-extrabold mb-3 tracking-tight text-slate-900 dark:text-white">
            Verify Email
          </h1>
          <p className="text-slate-500 dark:text-[#A8B0C2] text-sm mb-10 leading-relaxed">
            We've transmitted a 6-digit access code to <br />
            <span className="font-bold text-slate-800 dark:text-blue-400">
              {email}
            </span>
          </p>

          <div className="flex justify-center mb-10">
            <OtpInput
              value={otp}
              onChange={setOtp}
              numInputs={6}
              inputType="tel"
              containerStyle="flex gap-2 sm:gap-3"
              renderInput={(props) => (
                <input
                  {...props}
                  className="!w-12 h-16 sm:!w-14 sm:h-20 bg-slate-50 dark:bg-[#0D0F16] border-2 border-slate-200 dark:border-[#2A2E3B] rounded-2xl text-xl font-bold text-blue-600 focus:border-blue-600 outline-none transition-all shadow-inner"
                />
              )}
            />
          </div>

          <div className="mb-10">
            {isTimerActive && timer > 0 ? (
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                Resend available in{" "}
                <span className="text-blue-600">{timer}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="flex items-center gap-2 mx-auto text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest"
              >
                <RotateCw size={14} /> Resend code now
              </button>
            )}
          </div>

          <button
            onClick={handleVerify}
            disabled={otp.length !== 6 || loading}
            className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-xl shadow-blue-900/20 transition-all disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:shadow-none flex items-center justify-center gap-3 active:scale-95"
          >
            {loading ? (
              <LoaderPinwheel className="animate-spin" />
            ) : (
              <>
                Verify Identity <ArrowRight size={20} />
              </>
            )}
          </button>
        </motion.div>
      </div>
    </>
  );
}
