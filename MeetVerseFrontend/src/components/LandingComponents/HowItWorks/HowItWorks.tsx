import { Video, Waves, FileText } from "lucide-react";

const steps = [
  {
    title: "Create or Join a Meeting",
    description:
      "Start a new meeting instantly or join with a simple link. No downloads required.",
  },
  {
    title: "AI Filters Noise in Real Time",
    description:
      "Our AI automatically identifies and removes background noise while you speak.",
  },
  {
    title: "Receive Summary & Transcripts",
    description:
      "Get instant AI-generated transcripts and meeting summaries after each call.",
  },
];

export default function HowItWorks() {
  return (
    <section
      className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#0D0F16] transition-colors duration-300"
      id="how-it-works"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-[#F1F5F9] mb-4">
            How It Works
          </h2>
          <p className="text-gray-600 dark:text-[#A8B0C2] max-w-2xl mx-auto text-lg leading-relaxed">
            Get started in three simple steps and experience AI-powered
            meetings.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connection line for desktop */}
          <div className="hidden md:block absolute top-20 left-[15%] right-[15%] h-0.5 bg-gray-200 dark:bg-[#2A2E3B]"></div>

          {steps.map((step, index) => (
            <div
              key={index}
              className="relative p-10 bg-gray-50 dark:bg-gray-900 rounded-3xl shadow-lg hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
            >
              <div className="text-center">
                {/* Step number badge */}
                <div className="inline-flex w-16 h-16 bg-blue-600 rounded-full items-center justify-center mb-6 relative z-10 shadow-md">
                  <span className="text-white font-semibold">{index + 1}</span>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-[#F1F5F9] mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-[#A8B0C2] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
