import { Twitter, Linkedin, Github, Mail } from "lucide-react";
import Logo from "../../Shared/Logo";

export default function Footer() {
  return (
    <footer
      id="contact"
      className="bg-linear-to-b from-white/40 to-slate-100 dark:from-[#0A0E1A] dark:to-[#0B1222] text-gray-900 dark:text-gray-300 transition-colors duration-300 py-16 px-4 sm:px-6 lg:px-8 border-t border-white/50 dark:border-white/10"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <Logo className="mb-4" />
            <p className="text-gray-600 dark:text-[#A8B0C2] mb-6">
              Crystal-clear online meetings powered by AI noise intelligence.
            </p>

            {/* Social Links */}
            <div className="flex gap-4">
              {[Twitter, Linkedin, Github, Mail].map((Icon, idx) => (
                <a
                  key={idx}
                  href="#"
                  className="w-10 h-10 bg-white dark:bg-[#1A1F2B] rounded-lg flex items-center justify-center border border-gray-200 dark:border-[#2A2E3B] hover:-translate-y-0.5 hover:bg-blue-50 dark:hover:bg-[#2A2E3B] transition-all duration-300"
                >
                  <Icon className="w-5 h-5 text-gray-900 dark:text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="text-gray-900 dark:text-white mb-4 font-semibold">
              Product
            </h4>
            <ul className="space-y-3">
              {["Features", "Use Cases", "Integrations", "Changelog"].map(
                (item, i) => (
                  <li key={i}>
                    <a
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      href="#"
                    >
                      {item}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-gray-900 dark:text-white mb-4 font-semibold">
              Company
            </h4>
            <ul className="space-y-3">
              {["About Us", "Careers", "Blog", "Press Kit", "Contact"].map(
                (item, i) => (
                  <li key={i}>
                    <a
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      href="#"
                    >
                      {item}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="text-gray-900 dark:text-white mb-4 font-semibold">
              Resources
            </h4>
            <ul className="space-y-3">
              {[
                "Documentation",
                "Help Center",
                "API Reference",
                "Community",
                "Status",
              ].map((item, i) => (
                <li key={i}>
                  <a
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    href="#"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200 dark:border-[#2A2E3B] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 dark:text-[#A8B0C2]">
            © 2025 MeetVerse. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(
              (item, i) => (
                <a
                  key={i}
                  href="#"
                  className="text-gray-600 dark:text-[#A8B0C2] hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {item}
                </a>
              ),
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
