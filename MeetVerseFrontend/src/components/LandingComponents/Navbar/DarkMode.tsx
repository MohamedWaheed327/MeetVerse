import { Sun, Moon } from "lucide-react";
import { useContext } from "react";
import { ThemeContext } from "../../../Context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

const DarkMode = ({ className }: { className?: string }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleTheme}
      className={`relative flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] transition-all duration-500 hover:scale-110 active:scale-95 shadow-sm overflow-hidden group ${className || ""}`}
      aria-label="Toggle theme"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors duration-500" />
      
      <AnimatePresence mode="wait">
        {theme === "light" ? (
          <motion.div
            key="moon"
            initial={{ y: 20, opacity: 0, rotate: -45 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: 45 }}
            transition={{ duration: 0.3, ease: "backOut" }}
          >
            <Moon className="w-5 h-5 text-slate-700" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ y: 20, opacity: 0, rotate: -45 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: 45 }}
            transition={{ duration: 0.3, ease: "backOut" }}
          >
            <Sun className="w-5 h-5 text-yellow-400" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle indicator dots */}
      <div className="absolute bottom-1.5 flex gap-1">
        <div className={`w-1 h-1 rounded-full transition-all duration-500 ${theme === 'light' ? 'bg-blue-500 w-2' : 'bg-slate-300'}`} />
        <div className={`w-1 h-1 rounded-full transition-all duration-500 ${theme === 'dark' ? 'bg-yellow-400 w-2' : 'bg-slate-700'}`} />
      </div>
    </button>
  );
};

export default DarkMode;
