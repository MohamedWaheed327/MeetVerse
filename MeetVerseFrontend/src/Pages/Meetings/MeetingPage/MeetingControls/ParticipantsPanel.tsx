import { motion, AnimatePresence } from "framer-motion";
import { MicOff, VideoOff, Hand, X, Users } from "lucide-react";
import { ExtendedParticipant } from "./useParticipants";

interface ParticipantsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    participants: ExtendedParticipant[];
}

export default function ParticipantsPanel({ isOpen, onClose, participants }: ParticipantsPanelProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-full right-0 mb-4 w-72 bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[400px] z-50"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-[#2A2E3B]">
                        <div className="flex items-center gap-2">
                            <Users size={18} className="text-blue-500" />
                            <h3 className="font-bold text-sm">Participants ({participants.length})</h3>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-[#2A2E3B] transition-colors"
                        >
                            <X size={16} className="text-slate-500" />
                        </button>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-2">
                        {participants.map((user) => (
                            <div 
                                key={user.id} 
                                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#202433] transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${user.color} flex items-center justify-center text-xs font-bold text-white relative`}>
                                        {user.initial}
                                        {user.isSpeaking && (
                                            <span className="absolute -inset-1 rounded-full border-2 border-blue-500/40 animate-ping" />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium leading-none mb-1 max-w-[120px] truncate">
                                            {user.name}
                                        </span>
                                        <span className="text-[10px] text-slate-500">
                                            {user.isLocal ? "You" : user.isSpeaking ? "Speaking..." : ""}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2 text-slate-400">
                                    {user.handRaised && (
                                        <motion.div
                                            initial={{ scale: 0, rotate: -45 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            className="text-amber-500"
                                            title="Hand Raised"
                                        >
                                            <Hand size={14} fill="currentColor" />
                                        </motion.div>
                                    )}
                                    {!user.hasMic && (
                                        <MicOff size={14} className="text-red-400" title="Microphone Off" />
                                    )}
                                    {!user.hasVideo && (
                                        <VideoOff size={14} className="text-slate-400" title="Camera Off" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
