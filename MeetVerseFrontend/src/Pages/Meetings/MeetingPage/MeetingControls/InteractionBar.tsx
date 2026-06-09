import { useState, useRef, useEffect } from "react";
import { Hand, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ParticipantsPanel from "./ParticipantsPanel";
import { ExtendedParticipant } from "./useParticipants";

interface InteractionBarProps {
    participants: ExtendedParticipant[];
    toggleRaiseHand: () => void;
    isLocalHandRaised: boolean;
    participantCount: number;
    hostId: string | null;
}

export default function InteractionBar({ 
    participants, 
    toggleRaiseHand, 
    isLocalHandRaised, 
    participantCount,
    hostId
}: InteractionBarProps) {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close panel when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsPanelOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative flex items-center gap-1" ref={containerRef}>
            
            {/* Raise Hand Button */}
            <button
                onClick={toggleRaiseHand}
                className={`p-3 rounded-xl transition-all duration-200 active:scale-90 hover:scale-105 ${
                    isLocalHandRaised
                        ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30"
                        : "text-slate-600 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10"
                }`}
                aria-label={isLocalHandRaised ? "Lower Hand" : "Raise Hand"}
                data-tooltip={isLocalHandRaised ? "Lower Hand" : "Raise Hand"}
            >
                <motion.div
                    animate={isLocalHandRaised ? { y: [0, -3, 0], scale: [1, 1.1, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                >
                    <Hand size={20} fill={isLocalHandRaised ? "currentColor" : "none"} />
                </motion.div>
            </button>

            {/* Participants Badge Button */}
            <button
                onClick={() => setIsPanelOpen(!isPanelOpen)}
                className={`relative p-3 rounded-xl transition-all duration-200 active:scale-90 hover:scale-105 ${
                    isPanelOpen
                        ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30"
                        : "text-slate-600 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10"
                }`}
                aria-label={`Participants: ${participantCount}`}
                data-tooltip="People"
            >
                <Users size={20} />
                
                {/* Badge Count */}
                <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-lg ring-2 ring-[var(--control-bar-bg,#1a1d2e)]">
                    {participantCount}
                </div>
            </button>

            {/* Participants Panel */}
            <ParticipantsPanel 
                isOpen={isPanelOpen} 
                onClose={() => setIsPanelOpen(false)} 
                participants={participants} 
                hostId={hostId}
            />
        </div>
    );
}
