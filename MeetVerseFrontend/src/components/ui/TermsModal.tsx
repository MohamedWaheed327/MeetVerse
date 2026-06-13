import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsModal({ isOpen, onClose }: TermsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="bg-white dark:bg-[#111827] w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[85vh] pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Terms & Privacy Policy</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors focus:outline-none"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto custom-scrollbar text-slate-600 dark:text-slate-300 text-sm space-y-6">
                <section>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">1. Acceptance of Terms</h3>
                  <p>By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.</p>
                </section>
                
                <section>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">2. Privacy Policy</h3>
                  <p>We take your privacy seriously. We only collect the minimal amount of data necessary to provide you with an optimal experience. Your data is encrypted at rest and in transit. We will never sell your personal information to third parties.</p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">3. User Conduct</h3>
                  <p>You agree to use our services only for lawful purposes. You are prohibited from violating or attempting to violate the security of the services, including accessing data not intended for you or logging onto a server or an account which you are not authorized to access.</p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">4. Modifications to Service</h3>
                  <p>We reserve the right at any time to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice. We shall not be liable to you or to any third party for any modification, suspension or discontinuance of the Service.</p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">5. Data Retention</h3>
                  <p>We will retain your information for as long as your account is active or as needed to provide you services. If you wish to cancel your account or request that we no longer use your information, please contact our support team.</p>
                </section>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
