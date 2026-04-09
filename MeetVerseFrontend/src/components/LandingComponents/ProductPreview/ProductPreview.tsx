import photo1 from "../../../assets/product-preview/photo4.webp";
import { Mic, MessageSquare, Presentation, MessageCircle } from "lucide-react";

export default function ProductPreview() {
  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#0D0F16] transition-colors duration-300"
      id="Overview"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-[#F1F5F9] mb-4">
            Everything You Need in One Platform
          </h2>
          <p className="text-gray-600 dark:text-[#A8B0C2] max-w-2xl mx-auto text-lg leading-relaxed">
            A complete suite of tools designed to make your meetings more
            productive and efficient.
          </p>
        </div>

        {/* Main Preview Grid */}
        <div className="grid lg:grid-cols-1 gap-8 mb-8">
          {/* Meeting Room Interface */}
          <div className="bg-white dark:bg-[#181B26] rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-200 dark:border-[#2A2E3B] transition-colors duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                <Mic className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-gray-900 dark:text-[#F1F5F9] font-semibold">
                Meeting Room Interface
              </h3>
            </div>
            <div className="rounded-xl overflow-hidden bg-gray-100 dark:bg-[#1A2333] max-h-80">
              <img
                src={photo1}
                alt="Meeting room interface mockup"
                className="w-full h-auto object-cover"
              />
            </div>
            <p className="text-gray-600 dark:text-[#A8B0C2] mt-4">
              Clean, intuitive interface with all controls at your fingertips.
            </p>
          </div>
        </div>

        {/* Secondary Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* AI Transcript Viewer */}
          <div className="bg-white dark:bg-[#181B26] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-[#2A2E3B] transition-colors duration-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="text-gray-900 dark:text-[#F1F5F9] font-semibold">
                AI Transcript
              </h4>
            </div>
            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-[#1A2333] rounded-lg p-3 transition-colors duration-300">
                <div className="text-gray-900 dark:text-[#F1F5F9] mb-1">
                  John Doe
                </div>
                <p className="text-gray-600 dark:text-[#A8B0C2]">
                  Let's discuss the Q4 roadmap...
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-[#1A2333] rounded-lg p-3 transition-colors duration-300">
                <div className="text-gray-900 dark:text-[#F1F5F9] mb-1">
                  Jane Smith
                </div>
                <p className="text-gray-600 dark:text-[#A8B0C2]">
                  I agree, we should prioritize...
                </p>
              </div>
            </div>
          </div>

          {/* Whiteboard */}
          <div className="bg-white dark:bg-[#181B26] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-[#2A2E3B] transition-colors duration-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/40 rounded-lg flex items-center justify-center">
                <Presentation className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <h4 className="text-gray-900 dark:text-[#F1F5F9] font-semibold">
                Whiteboard
              </h4>
            </div>
            <div className="bg-gray-50 dark:bg-[#1A2333] rounded-lg h-32 flex items-center justify-center transition-colors duration-300">
              <div className="space-y-2">
                <div className="w-24 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                <div className="w-16 h-16 border-4 border-green-600 dark:border-green-400 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Chat Panel */}
          <div className="bg-white dark:bg-[#181B26] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-[#2A2E3B] transition-colors duration-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-gray-900 dark:text-[#F1F5F9] font-semibold">
                Chat Panel
              </h4>
            </div>
            <div className="space-y-2">
              <div className="bg-blue-50 dark:bg-blue-900/40 rounded-lg p-2 text-gray-700 dark:text-[#A8B0C2] transition-colors duration-300">
                Great presentation! 👍
              </div>
              <div className="bg-gray-50 dark:bg-[#1A2333] rounded-lg p-2 text-gray-700 dark:text-[#A8B0C2] transition-colors duration-300">
                Thanks everyone!
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
