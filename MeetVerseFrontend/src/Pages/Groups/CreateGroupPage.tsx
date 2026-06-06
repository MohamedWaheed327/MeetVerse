import React, { useState } from "react";
import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { motion } from "framer-motion";
import {
  Users,
  ShieldCheck,
  ArrowRight,
  Globe,
  Sparkles,
  Palette,
  ChevronRight,
  FileText
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createGroup } from "../../services/CreateGroup";
import { useToast } from "../../Context/ToastContext";
import Logo from "../../components/Shared/Logo";

const GRADIENT_OPTIONS = [
  { id: "blue-violet", class: "from-blue-500 to-violet-500" },
  { id: "emerald-teal", class: "from-emerald-400 to-teal-500" },
  { id: "rose-orange", class: "from-rose-500 to-orange-500" },
  { id: "indigo-cyan", class: "from-indigo-500 to-cyan-500" },
  { id: "fuchsia-pink", class: "from-fuchsia-500 to-pink-500" },
  { id: "amber-yellow", class: "from-amber-400 to-yellow-500" }
];

export default function CreateGroupPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [coverGradient, setCoverGradient] = useState(GRADIENT_OPTIONS[0].id);
  const [isCreating, setIsCreating] = useState(false);
  
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});
  const [shakeField, setShakeField] = useState<string | null>(null);

  const triggerShake = (field: string) => {
    setShakeField(field);
    setTimeout(() => setShakeField(null), 300);
  };

  const validate = () => {
    const newErrors: { name?: string; description?: string } = {};
    let firstErrorField: string | null = null;
    
    if (!groupName.trim()) {
      newErrors.name = "Space Name is required";
      firstErrorField = firstErrorField || 'name';
    } else if (groupName.length > 50) {
      newErrors.name = "Maximum 50 characters allowed";
      firstErrorField = firstErrorField || 'name';
    }
    
    if (groupDescription.length > 200) {
      newErrors.description = "Maximum 200 characters allowed";
      firstErrorField = firstErrorField || 'description';
    }
    
    setErrors(newErrors);
    if (firstErrorField) {
      triggerShake(firstErrorField);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!validate()) return;
    
    setIsCreating(true);
    try {
      await createGroup(groupName, groupDescription, isPublic, coverGradient);
      showToast("Space created successfully!", "success");
      navigate("/groups");
    } catch (error) {
      console.error("Failed to create space:", error);
      showToast("Failed to create space", "error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0F16] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300">
      <Navbar />
      
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseOrb {
          0%, 100% { transform: scale(1) translate(0,0); opacity: 0.6; }
          33% { transform: scale(1.1) translate(30px, -30px); opacity: 0.8; }
          66% { transform: scale(0.9) translate(-30px, 30px); opacity: 0.5; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-slideUpFade { animation: slideUpFade 0.4s ease-out forwards; }
        .animate-pulseOrb { animation: pulseOrb 12s infinite alternate ease-in-out; }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="flex flex-col lg:flex-row bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[2.5rem] shadow-2xl overflow-hidden min-h-[700px] animate-slideUpFade">
            
          {/* Left Panel */}
          <div className="hidden lg:flex flex-col justify-between w-[40%] bg-gradient-to-br from-indigo-50 to-violet-100 dark:from-[#131520] dark:to-[#1A1D2E] p-12 relative overflow-hidden border-r border-slate-200 dark:border-[#2A2E3B]">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-tr from-blue-500/30 to-violet-500/30 blur-3xl rounded-full animate-pulseOrb pointer-events-none" />
            
            <div className="relative z-10 space-y-2">
              <div className="mb-10">
                <Logo imageClassName="h-10" textClassName="text-2xl" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
                Build your community space.
              </h2>
              <p className="text-slate-500 dark:text-[#A8B0C2] text-sm leading-relaxed">
                A permanent, shared hub for your team, class, or squad. Keep meetings, transcripts, and conversations all in one place.
              </p>
            </div>

            <div className="relative z-10 space-y-6 mt-12">
              <div className="flex items-start gap-4">
                <div className="mt-1 p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><Globe size={16} /></div>
                <div>
                  <h4 className="font-bold text-sm">Public or Private</h4>
                  <p className="text-xs text-slate-500 dark:text-[#A8B0C2] mt-1">Control who can join your space automatically</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 p-2 bg-purple-500/10 text-purple-500 rounded-lg"><Palette size={16} /></div>
                <div>
                  <h4 className="font-bold text-sm">Custom Identity</h4>
                  <p className="text-xs text-slate-500 dark:text-[#A8B0C2] mt-1">Make it yours with custom cover gradients</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel (Form) */}
          <div className="w-full lg:w-[60%] p-8 sm:p-12 flex flex-col justify-center bg-white dark:bg-[#181B26]">
            
            <div className="mb-10">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
                <a href="/groups" className="hover:text-blue-500 transition-colors">Groups</a>
                <ChevronRight size={12} />
                <span className="text-slate-800 dark:text-slate-200">New Space</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">Create Space</h1>
              <p className="text-slate-500 dark:text-[#A8B0C2] text-sm mt-2">Setup a new community hub for your members.</p>
            </div>

            <form className="space-y-8" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
              <div className="space-y-6">
                
                {/* Name Input */}
                <div>
                  <div className={`relative border rounded-2xl transition-all duration-200 bg-white dark:bg-[#131520] ${shakeField === 'name' ? 'animate-shake border-red-500' : 'focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-500 border-slate-300 dark:border-[#2A2E3B]'}`}>
                    <label className="absolute left-4 top-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Users size={10} /> Space Name
                    </label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => {
                        setGroupName(e.target.value);
                        if (errors.name) setErrors(prev => ({...prev, name: undefined}));
                      }}
                      placeholder="e.g., AI Visionaries"
                      className="w-full bg-transparent px-4 pb-2 pt-6 text-sm outline-none"
                    />
                  </div>
                  {errors.name && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.name}</p>}
                </div>

                {/* Mission Input */}
                <div>
                  <div className={`relative border rounded-2xl transition-all duration-200 bg-white dark:bg-[#131520] ${shakeField === 'description' ? 'animate-shake border-red-500' : 'focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-500 border-slate-300 dark:border-[#2A2E3B]'}`}>
                    <label className="absolute left-4 top-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <FileText size={10} /> Space Mission
                    </label>
                    <textarea
                      rows={3}
                      value={groupDescription}
                      onChange={(e) => {
                        setGroupDescription(e.target.value);
                        if (errors.description) setErrors(prev => ({...prev, description: undefined}));
                      }}
                      placeholder="What is this community about? (Optional)"
                      className="w-full bg-transparent px-4 pb-2 pt-6 text-sm outline-none resize-none"
                    />
                  </div>
                  {errors.description && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.description}</p>}
                </div>

                {/* Cover Gradient Picker */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1 block flex items-center gap-1.5">
                    <Palette size={10} /> Cover Gradient
                  </label>
                  <div className="grid grid-cols-6 gap-3">
                    {GRADIENT_OPTIONS.map((grad) => (
                      <button
                        key={grad.id}
                        type="button"
                        onClick={() => setCoverGradient(grad.id)}
                        className={`relative aspect-square rounded-full bg-gradient-to-br ${grad.class} transition-all duration-200 hover:scale-110 active:scale-95`}
                      >
                        {coverGradient === grad.id && (
                          <div className="absolute inset-0 rounded-full ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-[#181B26] flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full shadow-sm" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Public ID Enrollment Toggle */}
                <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-xl cursor-pointer hover:border-blue-500 dark:hover:border-white/15 transition-all group">
                  <div className="flex gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 shrink-0 h-fit"><ShieldCheck size={16} /></div>
                    <div>
                      <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Public ID Enrollment</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {isPublic ? "Anyone with the Space ID can join automatically" : "New members will require your approval"}
                      </div>
                    </div>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
                </label>

              </div>

              {/* CTAs */}
              <div className="pt-6 flex flex-col sm:flex-row gap-4 border-t border-slate-200 dark:border-[#2A2E3B]">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:shadow-lg hover:shadow-blue-500/25 text-white py-4 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 disabled:hover:shadow-none"
                >
                  {isCreating ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ArrowRight size={18} />
                  )}
                  {isCreating ? "Creating..." : "Launch Community Space"}
                  {!isCreating && <span className="ml-2 px-1.5 py-0.5 rounded border border-white/20 bg-white/10 text-[10px] font-mono flex items-center shrink-0">↵ Enter</span>}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/groups")}
                  className="px-8 py-4 bg-transparent border border-slate-200 dark:border-white/20 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
