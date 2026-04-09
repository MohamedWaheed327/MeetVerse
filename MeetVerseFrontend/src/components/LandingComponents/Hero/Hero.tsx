import { Play } from "lucide-react";
import photo1 from "../../../assets/hero/Gemini_Generated_Image_9el23k9el23k9el2.png";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section
      className="bg-white dark:bg-[#0D0F16] transition-all duration-300 "
      id="hero"
    >
      <div className="max-w-[1440px] mx-auto px-6 lg:px-16 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mt-6 md:mt-15">
          {/* Left Text Section */}
          <div className="space-y-10">
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-[#F1F5F9] leading-tight">
                Crystal Clear Meetings, Powered by AI.
              </h1>

              <p className="text-xl text-gray-600 dark:text-[#A8B0C2] max-w-lg">
                Experience distraction-free video calls with real-time noise
                cancellation, automated transcripts, and smart meeting
                summaries.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-4 flex-wrap">
              <Link to="/Home" className="w-max">
                <button className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-md hover:shadow-lg transition-all">
                  Start Free Meeting
                </button>
              </Link>

              <button className="px-8 py-4 text-lg rounded-lg border border-gray-300 dark:border-[#2A2E3B] text-gray-700 dark:text-[#F1F5F9] hover:bg-gray-100 dark:hover:bg-[#232734] transition-all flex items-center gap-2">
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
            <div className="bg-transparent rounded-2xl p-6 lg:p-8  transition-colors duration-300">
              <img
                src={photo1}
                alt="Video conferencing interface"
                className="rounded-xl w-full shadow-md object-cover"
              />

              {/* Floating Badge */}
              <div className="absolute top-10 right-10 bg-white dark:bg-[#0D0F16] border border-gray-200 dark:border-[#2A2E3B] rounded-xl shadow-lg px-5 py-3 flex items-center gap-3 transition-all">
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
