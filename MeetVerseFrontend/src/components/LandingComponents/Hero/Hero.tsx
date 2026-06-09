import { Play } from "lucide-react";
import photo1 from "../../../assets/hero/Gemini_Generated_Image_9el23k9el23k9el2.png";
import { Link, useNavigate } from "react-router-dom";
import { LiquidMetalButton } from "../../ui/LiquidMetalButton";

export default function Hero() {
  const navigate = useNavigate();
  return (
    <section
      className="bg-transparent transition-all duration-300 relative"
      id="hero"
    >
      <div className="max-w-[1440px] mx-auto px-6 lg:px-16 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mt-6 md:mt-15">
          {/* Left Text Section */}
          <div className="space-y-10">
            <div className="space-y-6">
              <span className="inline-flex items-center rounded-full border border-blue-200/70 dark:border-blue-500/30 bg-white/70 dark:bg-[#111827]/70 px-4 py-1.5 text-xs font-semibold tracking-wide text-blue-700 dark:text-blue-300 backdrop-blur">
                AI-Powered Collaboration
              </span>
              <h1 className="text-4xl lg:text-6xl font-extrabold text-gray-900 dark:text-[#F1F5F9] leading-tight">
                Crystal Clear Meetings,
                <span className="block mt-2 bg-linear-to-r from-blue-600 via-indigo-500 to-violet-500 bg-clip-text text-transparent">
                  Beautifully Productive
                </span>
              </h1>

              <p className="text-lg lg:text-xl text-gray-600 dark:text-[#A8B0C2] max-w-xl leading-relaxed">
                Experience distraction-free video calls with real-time noise
                cancellation, automated transcripts, and smart meeting
                summaries.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-4 flex-wrap">
              <LiquidMetalButton
                onClick={() => navigate("/Home")}
                size="lg"
                speed={0.6}
                repetition={4}
                softness={0.5}
                shiftRed={0.3}
                shiftBlue={0.3}
              >
                Start Free Meeting
              </LiquidMetalButton>

              <button className="px-8 py-4 text-lg rounded-xl border border-gray-300/80 dark:border-[#2A2E3B] text-gray-700 dark:text-[#F1F5F9] bg-white/70 dark:bg-[#111827]/60 hover:bg-white dark:hover:bg-[#1A2235] transition-all duration-300 flex items-center gap-2 backdrop-blur">
                <Play className="w-5 h-5" />
                Watch Demo
              </button>
            </div>

            {/* Checkmarks */}
            <div className="flex items-center gap-8 pt-4 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <div className="size-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-gray-600 dark:text-[#A8B0C2]">
                  No credit card required
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="size-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-gray-600 dark:text-[#A8B0C2]">
                  Free for unlimited meetings
                </span>
              </div>
            </div>
          </div>

          {/* Right Image Section */}
          <div className="relative">
            <div className="absolute -inset-5 bg-linear-to-br from-blue-500/25 via-indigo-500/20 to-violet-500/25 rounded-3xl blur-2xl animate-pulse" />
            <div className="relative bg-white/60 dark:bg-[#0F172A]/50 rounded-3xl p-6 lg:p-8 border border-white/70 dark:border-white/10 backdrop-blur-md transition-colors duration-300 shadow-2xl">
              <img
                src={photo1}
                alt="Video conferencing interface"
                className="rounded-2xl w-full shadow-xl shadow-slate-900/20 object-cover transition-transform duration-500 hover:scale-[1.015]"
              />

              {/* Floating Badge */}
              <div className="absolute top-10 right-10 bg-white/90 dark:bg-[#0D0F16]/90 border border-gray-200 dark:border-[#2A2E3B] rounded-xl shadow-xl px-5 py-3 flex items-center gap-3 transition-all backdrop-blur animate-bounce [animation-duration:2.8s]">
                <div className="size-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-gray-900 dark:text-[#F1F5F9]">
                  Noise Suppression Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
