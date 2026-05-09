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
      className="py-24 px-4 sm:px-6 lg:px-8 bg-transparent transition-colors duration-300"
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
              className="group relative bg-white/70 dark:bg-[#181B26]/80 rounded-3xl p-8 border border-gray-200/80 dark:border-[#2A2E3B] shadow-lg shadow-slate-900/5 hover:shadow-2xl hover:shadow-blue-900/15 transition-all duration-500 hover:-translate-y-1.5 backdrop-blur-sm overflow-hidden"
            >
              <div className="absolute -top-14 -right-14 size-32 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-all duration-500 blur-2xl" />
              <div className="relative w-14 h-14 bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>

              <h3 className="relative text-xl font-semibold text-gray-900 dark:text-[#F1F5F9] mb-3">
                {feature.title}
              </h3>

              <p className="relative text-gray-600 dark:text-[#A8B0C2] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
