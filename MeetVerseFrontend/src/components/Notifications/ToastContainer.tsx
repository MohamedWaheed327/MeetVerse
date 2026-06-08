import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../Context/ToastContext';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  const iconMap = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const bgMap = {
    success: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30',
    error: 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800/30',
    info: 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30',
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className={`pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl ${bgMap[toast.type]} min-w-[300px] max-w-md`}
          >
            <div className="flex-shrink-0">
              {iconMap[toast.type]}
            </div>
            <p className="flex-1 text-sm font-bold text-slate-800 dark:text-slate-200">
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
