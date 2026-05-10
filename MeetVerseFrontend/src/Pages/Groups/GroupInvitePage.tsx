/* eslint-disable no-unused-vars */
import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  ArrowLeft,
  Share2,
  ShieldCheck,
  Users,
  Info,
  X,
  Target,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function GroupInvitePage() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const [copied, setCopied] = useState(false);
  const [isGuidelineOpen, setIsGuidelineOpen] = useState(false);

  // لينك تجريبي طويل للمعاينة
  const inviteLink = `${window.location.origin}/groups/join?id=${groupId || "11111111-1111-1111-1111-111111111111"}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0F16] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300 overflow-x-hidden">
      <Navbar />

      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-24 md:pt-32 pb-16">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm mb-6 md:mb-8 transition-all active:scale-95"
        >
          <ArrowLeft size={18} /> <span>Back to Community</span>
        </motion.button>

        <div className="grid lg:grid-cols-12 gap-6 md:gap-8">
          {/* Left Column: Invite Link Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-7"
          >
            <div className="bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 shadow-xl relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Share2 size={120} className="text-blue-600" />
              </div>

              <div className="relative z-10 w-full">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4">
                  <Users size={12} /> Membership Portal
                </div>

                <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-3 md:mb-4">
                  Invite Members
                </h1>

                <p className="text-slate-500 dark:text-[#A8B0C2] text-xs md:text-base mb-8 md:mb-10 leading-relaxed max-w-lg">
                  Share the link below. New applicants will need your approval
                  before joining.
                </p>

                {/* Link Box - الحل لمشكلة الصورة */}
                <div className="space-y-3 w-full">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Invite Link
                  </label>
                  <div className="flex flex-col items-stretch gap-3 p-3 bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-[1.5rem] md:rounded-3xl shadow-inner overflow-hidden">
                    <div className="w-full px-2 py-1 text-[11px] md:text-xs font-mono text-blue-600 dark:text-blue-400 break-all text-left">
                      {inviteLink}
                    </div>
                    <button
                      onClick={handleCopy}
                      className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl md:rounded-2xl font-bold text-xs transition-all active:scale-95 ${copied ? "bg-emerald-500 text-white" : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"}`}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      <span>{copied ? "Copied" : "Copy Link"}</span>
                    </button>
                  </div>
                </div>

                <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-4">
                  <div className="size-10 md:size-12 rounded-xl md:rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-black tracking-tight uppercase">
                      Admin Approval On
                    </p>
                    <p className="text-[10px] md:text-xs text-slate-400">
                      Total control over your space.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: ID & Help */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-5 space-y-4 md:space-y-6 w-full"
          >
            {/* ID Card - الحل لمشكلة النص الطويل في الصورة */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[2rem] p-6 md:p-8 text-white shadow-xl relative overflow-hidden group w-full">
              <div className="relative z-10 w-full">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                  Space ID
                </span>
                <h2 className="text-2xl xs:text-3xl md:text-4xl lg:text-3xl font-black mt-2 tracking-tighter break-all">
                  #{groupId || "11111111-1111-1111-1111-111111111111"}
                </h2>
                <div className="mt-4 flex items-center gap-2 bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-md">
                  <div className="size-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <p className="text-[9px] md:text-[10px] font-bold uppercase">
                    Ready to join
                  </p>
                </div>
              </div>
            </div>

            {/* Help Card */}
            <div className="bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[2rem] p-6 md:p-8 shadow-lg w-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-9 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                  <Info size={18} />
                </div>
                <h3 className="font-black text-sm uppercase tracking-tight tracking-tight">
                  Need help?
                </h3>
              </div>
              <p className="text-[11px] md:text-xs text-slate-500 dark:text-[#A8B0C2] leading-relaxed mb-6">
                Learn how to manage invites and maintain a safe community.
              </p>
              <button
                onClick={() => setIsGuidelineOpen(true)}
                className="w-full py-3.5 bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
              >
                Community Guidelines
              </button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* --- MODAL (OVERLAY) --- */}
      <AnimatePresence>
        {isGuidelineOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-0 sm:px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGuidelineOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#181B26] rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl overflow-hidden border-t sm:border border-slate-200 dark:border-[#2A2E3B] max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsGuidelineOpen(false)}
                className="absolute top-5 right-5 size-10 bg-slate-100 dark:bg-[#0D0F16] rounded-full hidden sm:flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="p-8 md:p-10">
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-8 sm:hidden" />
                <div className="flex items-center gap-4 mb-8">
                  <div className="size-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg">
                    <Target size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-black">
                      Guidelines
                    </h2>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                      Safe Space
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <GuideItem
                    icon={<Zap size={16} />}
                    color="emerald"
                    title="Direct Join"
                    desc="Share your ID directly for fast access."
                  />
                  <GuideItem
                    icon={<ShieldCheck size={16} />}
                    color="blue"
                    title="Approval"
                    desc="You must manually accept all new join requests."
                  />
                  <GuideItem
                    icon={<ShieldAlert size={16} />}
                    color="red"
                    title="Rules"
                    desc="Avoid sharing links in public or untrusted places."
                  />
                </div>

                <button
                  onClick={() => setIsGuidelineOpen(false)}
                  className="mt-10 w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl"
                >
                  Got it!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GuideItem({
  icon,
  title,
  desc,
  color,
}: {
  icon: any;
  title: string;
  desc: string;
  color: string;
}) {
  const colors: any = {
    emerald: "bg-emerald-500/10 text-emerald-500",
    blue: "bg-blue-500/10 text-blue-500",
    red: "bg-red-500/10 text-red-500",
  };
  return (
    <div className="flex gap-4">
      <div
        className={`shrink-0 size-8 ${colors[color]} rounded-lg flex items-center justify-center`}
      >
        {icon}
      </div>
      <div>
        <h4 className="text-xs font-black uppercase mb-0.5 tracking-tight">
          {title}
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-[#A8B0C2] leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}
