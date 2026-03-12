import { Volume2, MessageSquareText, Users } from "lucide-react";

const features = [
  {
    icon: Volume2,
    title: "AI Real-Time Noise Cancellation",
    description:
      "Removes background sounds like traffic, typing, and static with advanced AI algorithms for crystal-clear audio.",
  },
  {
    icon: MessageSquareText,
    title: "AI Meeting Assistant",
    description:
      "Real-time transcription, speaker labels, and smart meeting summaries powered by advanced AI.",
  },
  {
    icon: Users,
    title: "Smart Collaboration Tools",
    description:
      "High-quality audio/video, chat, screen sharing, and interactive whiteboard for seamless teamwork.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#0D0F16] transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-[#F1F5F9] tracking-tight mb-4">
            Powerful Features for Modern Teams
          </h2>
          <p className="text-gray-600 dark:text-[#A8B0C2] text-lg leading-relaxed">
            Experience the next generation of online meetings with AI-powered
            tools designed to enhance every conversation.
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-50 dark:bg-[#181B26] rounded-2xl p-8 border border-gray-200 dark:border-[#2A2E3B] shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center mb-6">
                <feature.icon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-[#F1F5F9] mb-3">
                {feature.title}
              </h3>

              <p className="text-gray-600 dark:text-[#A8B0C2] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
