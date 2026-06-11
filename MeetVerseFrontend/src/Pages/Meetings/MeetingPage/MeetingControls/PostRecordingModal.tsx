import React from 'react';
import { SaveRecordingAction } from '../../../../components/Meetings/SaveRecordingAction';

interface PostRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordingBlob: Blob | null;
  meetingId: string;
}

export const PostRecordingModal: React.FC<PostRecordingModalProps> = ({
  isOpen,
  onClose,
  recordingBlob,
  meetingId
}) => {
  if (!isOpen || !recordingBlob) return null;

  const generateFileName = () => {
    const dateString = new Date().toISOString().split('T')[0];
    return `meetverse-${meetingId}-${dateString}.webm`;
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-200 dark:border-[#2A2E3B]">
        
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Recording Finished
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
          Your recording is ready. Choose how you want to save it before leaving the meeting.
        </p>
        
        <SaveRecordingAction 
          recordingBlob={recordingBlob} 
          fileName={generateFileName()} 
        />

        <button 
          onClick={onClose}
          className="mt-6 w-full px-4 py-3 bg-slate-100 dark:bg-[#0D0F16] hover:bg-slate-200 dark:hover:bg-[#232734] border border-slate-200 dark:border-[#2A2E3B] text-sm font-medium text-slate-900 dark:text-white rounded-xl transition-all"
        >
          Dismiss
        </button>
        
      </div>
    </div>
  );
};
