import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, Video, Download, Play } from "lucide-react";
import { LiquidMetalButton } from "./LiquidMetalButton";

interface PastMeetingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: any | null;
}

export function PastMeetingDetailsModal({ isOpen, onClose, meeting }: PastMeetingDetailsModalProps) {
  if (!meeting) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />

          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="bg-white dark:bg-[#181B26] w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-[#2A2E3B] overflow-hidden flex flex-col pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-[#2A2E3B]">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                    {meeting.title || "Meeting Details"}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {meeting.when}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {meeting.duration}</span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 -mt-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors focus:outline-none"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <Video size={16} className="text-blue-500" />
                    Recording Link
                  </h3>
                  {meeting.recordingLink ? (
                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30 flex flex-col items-center justify-center text-center gap-3">
                      <div className="size-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Play size={24} className="ml-1" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Recording Available</p>
                        <p className="text-xs text-slate-500 mt-1">This session was recorded and uploaded to Google Drive.</p>
                      </div>
                      <a href={meeting.recordingLink} target="_blank" rel="noopener noreferrer" className="mt-2 w-full">
                         <LiquidMetalButton width="full" className="w-full text-sm">
                           Watch Recording
                         </LiquidMetalButton>
                      </a>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-[#2A2E3B] flex flex-col items-center justify-center text-center gap-2">
                      <div className="size-10 rounded-full bg-slate-100 dark:bg-[#0D0F16] flex items-center justify-center text-slate-400">
                        <Video size={20} />
                      </div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No recording available</p>
                      <p className="text-xs text-slate-500">This meeting was not recorded or the recording hasn't been processed yet.</p>
                    </div>
                  )}
                </div>
              </div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
