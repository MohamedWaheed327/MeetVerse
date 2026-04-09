import { Briefcase, GraduationCap, Home, Building2 } from "lucide-react";
import photo1 from "../../../assets/useCase/photo-1.jpg";
import photo2 from "../../../assets/useCase/photo-2.jpg";
import photo3 from "../../../assets/useCase/photo-3.jpg";
import photo4 from "../../../assets/useCase/photo-4.jpg";

const useCases = [
  {
    icon: Briefcase,
    title: "Professional Teams",
    description:
      "Streamline collaboration with crystal-clear audio and smart meeting tools for distributed teams.",
    image: photo1,
  },
  {
    icon: GraduationCap,
    title: "Educators & Online Classes",
    description:
      "Create engaging learning experiences with noise-free classrooms and real-time interaction tools.",
    image: photo2,
  },
  {
    icon: Home,
    title: "Remote Workers",
    description:
      "Work from anywhere with professional-grade meeting quality, even from busy coffee shops.",
    image: photo3,
  },
  {
    icon: Building2,
    title: "Organizations & Workshops",
    description:
      "Host large-scale events and training sessions with advanced analytics and collaboration features.",
    image: photo4,
  },
];

export default function UseCases() {
  return (
    <section
      className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#0D0F16] transition-colors duration-300"
      id="our-audience"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-[#F1F5F9] mb-4">
            Built for Every Team
          </h2>
          <p className="text-gray-600 dark:text-[#A8B0C2] max-w-2xl mx-auto text-lg leading-relaxed">
            MeetVerse adapts to your unique needs, whether you're teaching,
            collaborating, or presenting.
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className="group bg-white dark:bg-[#181B26] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-[#2A2E3B]"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={useCase.image}
                  alt={useCase.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/30 dark:from-black/50 to-transparent"></div>
              </div>

              <div className="p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center transition-colors duration-300">
                    <useCase.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-gray-900 dark:text-[#F1F5F9] font-semibold text-lg">
                    {useCase.title}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-[#A8B0C2] leading-relaxed">
                  {useCase.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
