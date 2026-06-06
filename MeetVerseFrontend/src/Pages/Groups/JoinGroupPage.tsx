import React, { useState, useEffect } from "react";
import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { motion } from "framer-motion";
import { Users, Search, ArrowRight, Shield, ChevronRight, Compass } from "lucide-react";
import { requestJoinGroup } from "../../services/requestJoinGroup";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useToast } from "../../Context/ToastContext";
import { getRecentSpaces, RecentSpace } from "../../utils/recentSpaces";
import Logo from "../../components/Shared/Logo";

export default function JoinGroupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [groupId, setGroupId] = useState(searchParams.get("id") || "");
  const [isJoining, setIsJoining] = useState(false);
  const { showToast } = useToast();
  const [recentSpaces, setRecentSpaces] = useState<RecentSpace[]>([]);

  useEffect(() => {
    setRecentSpaces(getRecentSpaces());
  }, []);

  const handleJoin = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!groupId.trim()) {
      showToast("Please enter a valid Space ID", "error");
      return;
    }
    
    setIsJoining(true);
    try {
      await requestJoinGroup(groupId);
      showToast("Join request sent successfully! You will be notified when accepted.", "success");
      setGroupId("");
    } catch (e: any) {
      showToast(e.message || "Failed to send join request.", "error");
    } finally {
      setIsJoining(false);
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
        .animate-slideUpFade { animation: slideUpFade 0.4s ease-out forwards; }
        .animate-pulseOrb { animation: pulseOrb 12s infinite alternate ease-in-out; }
      `}</style>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="flex flex-col lg:flex-row bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[2.5rem] shadow-2xl overflow-hidden min-h-[600px] animate-slideUpFade">
            
          {/* Left Panel */}
          <div className="hidden lg:flex flex-col justify-between w-[40%] bg-gradient-to-br from-indigo-50 to-violet-100 dark:from-[#131520] dark:to-[#1A1D2E] p-12 relative overflow-hidden border-r border-slate-200 dark:border-[#2A2E3B]">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-tr from-blue-500/30 to-violet-500/30 blur-3xl rounded-full animate-pulseOrb pointer-events-none" />
            
            <div className="relative z-10 space-y-2">
              <div className="mb-10">
                <Logo imageClassName="h-10" textClassName="text-2xl" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
                Discover your next great team.
              </h2>
              <p className="text-slate-500 dark:text-[#A8B0C2] text-sm leading-relaxed">
                Connect with exclusive communities, classes, and project groups through secure invites.
              </p>
            </div>

            <div className="relative z-10 space-y-6 mt-12">
              <div className="flex items-start gap-4">
                <div className="mt-1 p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><Shield size={16} /></div>
                <div>
                  <h4 className="font-bold text-sm">Secure Access</h4>
                  <p className="text-xs text-slate-500 dark:text-[#A8B0C2] mt-1">Only authorized members can join private spaces</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel (Form) */}
          <div className="w-full lg:w-[60%] p-8 sm:p-12 flex flex-col justify-center bg-white dark:bg-[#181B26]">
            
            <div className="mb-10">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
                <Link to="/groups" className="hover:text-blue-500 transition-colors">Groups</Link>
                <ChevronRight size={12} />
                <span className="text-slate-800 dark:text-slate-200">Join Space</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">Enter Community</h1>
              <p className="text-slate-500 dark:text-[#A8B0C2] text-sm mt-2">Enter a unique Space ID to request access.</p>
            </div>

            <form className="space-y-8" onSubmit={handleJoin}>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                  Space ID
                </label>
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    placeholder="e.g., G-XXXX"
                    className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl py-4 pl-14 pr-6 text-sm font-mono focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-[#2A2E3B] flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={isJoining || !groupId.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:shadow-lg hover:shadow-blue-500/25 text-white py-4 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 disabled:hover:shadow-none"
                >
                  {isJoining ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ArrowRight size={18} />
                  )}
                  {isJoining ? "Sending Request..." : "Connect to Space"}
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

            {/* Recently Visited Spaces */}
            {recentSpaces.length > 0 && (
              <div className="mt-12 pt-8 border-t border-slate-100 dark:border-[#2A2E3B]">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Recently Visited
                </h4>
                <div className="flex flex-wrap gap-3">
                  {recentSpaces.map((space) => (
                    <Link
                      key={space.id}
                      to={`/groups/${space.id}`}
                      className="group flex items-center gap-2 pr-4 pl-1.5 py-1.5 bg-slate-50 dark:bg-white/5 hover:bg-white dark:hover:bg-[#232734] border border-slate-200 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-500/50 rounded-full transition-all active:scale-95"
                    >
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${space.gradient || 'from-slate-300 to-slate-400'} flex items-center justify-center`}>
                        <Users size={10} className="text-white" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {space.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
