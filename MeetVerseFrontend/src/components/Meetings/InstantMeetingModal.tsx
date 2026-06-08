import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, X, Zap, Loader2 } from 'lucide-react';
import { createMeeting } from '../../services/createMeeting';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../Context/ToastContext';

interface InstantMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InstantMeetingModal: React.FC<InstantMeetingModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const time = now.toTimeString().split(' ')[0].substring(0, 5);

      const meetingData = {
        title: title || 'Instant Meeting',
        date,
        time,
        scheduledStart: now.toISOString(),
        groupId: null, // Global meeting
      };

      const meetingId = await createMeeting(meetingData);
      showToast('Meeting created successfully!', 'success');
      navigate(`/meetings/${meetingId}`);
      onClose();
    } catch (error) {
      console.error('Failed to create instant meeting:', error);
      showToast('Failed to create meeting. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
          >
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Video size={160} className="text-blue-600" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="p-3 bg-blue-500/10 rounded-2xl">
                  <Zap className="w-6 h-6 text-blue-500" />
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-black tracking-tight mb-2">
                  Instant Meeting
                </h2>
                <p className="text-slate-500 dark:text-[#A8B0C2] text-sm">
                  Jump into a new room immediately with your team.
                </p>
              </div>

              <form onSubmit={handleStart} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                    Meeting Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Quick Sync"
                    className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl px-6 py-4 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                    autoFocus
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Video size={18} />
                        Start Now
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-8 py-5 bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InstantMeetingModal;
