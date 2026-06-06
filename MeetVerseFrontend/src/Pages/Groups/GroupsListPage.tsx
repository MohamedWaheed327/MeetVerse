import React, { useEffect, useState } from "react";
import { setPageTitle } from "../../utils/setPageTitle";
import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { motion } from "framer-motion";
import { Users, Plus, Search, ArrowRight, Hash, Sparkles } from "lucide-react";
import { getMyGroups } from "../../services/getGroups";
import { Link } from "react-router-dom";

type Group = {
  id: string;
  name: string;
  memberCount: number;
  currentUserRole: string;
  description: string;
  coverGradient?: string;
};

export default function GroupsListPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setPageTitle("Your Spaces");
  }, []);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const myGroups = await getMyGroups();
        setGroups(myGroups || []);
      } catch (err) {
        console.error("Failed to load groups:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadGroups();
  }, []);

  const formatGroupId = (id: string) => {
    return `G-${id.substring(0, 4).toUpperCase()}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0F16] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300">
      <Navbar />
      
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUpFade { animation: slideUpFade 0.4s ease-out forwards; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-8 animate-slideUpFade">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <span className="text-blue-600 dark:text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px]">
              Communities
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Your Spaces
            </h1>
            <p className="text-slate-500 dark:text-[#A8B0C2] text-sm">
              Organize your project teams and study circles.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/groups/join"
              className="px-6 py-3 rounded-2xl border border-slate-200 dark:border-[#2A2E3B] bg-white dark:bg-[#181B26] text-sm font-semibold hover:bg-slate-50 dark:hover:bg-[#232734] transition-all"
            >
              Join Space
            </Link>
            <Link
              to="/groups/create"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 hover:shadow-lg hover:shadow-blue-500/25 text-white text-sm font-bold transition-all active:scale-95"
            >
              <Plus size={18} /> New Space
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-100 dark:border-[#2A2E3B] rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all"
              placeholder="Search spaces..."
            />
          </div>
          <div className="flex items-center gap-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {groups?.length ?? 0} Active Spaces
          </div>
        </div>

        {/* Groups Grid / Empty State */}
        {!isLoading && groups.length === 0 ? (
          <div className="w-full bg-white dark:bg-[#181B26] border border-dashed border-slate-300 dark:border-[#2A2E3B] rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
              <Sparkles className="text-blue-500" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">No spaces yet</h3>
            <p className="text-slate-500 dark:text-[#A8B0C2] text-sm max-w-sm mb-8">
              Create a new space to bring your team together, or join an existing one using a Space ID.
            </p>
            <Link
              to="/groups/create"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95"
            >
              <Plus size={18} /> Create Your First Space
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((g, idx) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(idx * 0.1, 0.5) }}
                className="group flex flex-col bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[2rem] overflow-hidden hover:border-blue-500 transition-all shadow-sm hover:shadow-xl relative"
              >
                {/* Gradient Banner */}
                <div className={`h-24 w-full bg-gradient-to-br ${g.coverGradient || 'from-slate-200 to-slate-300 dark:from-[#2A2E3B] dark:to-[#131520]'} relative`}>
                  <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 text-white text-[10px] font-bold uppercase tracking-widest border border-white/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {g.currentUserRole}
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1 relative">
                  {/* Floating Avatar/Icon */}
                  <div className="absolute -top-8 left-6 w-16 h-16 bg-white dark:bg-[#181B26] rounded-2xl border-4 border-white dark:border-[#181B26] flex items-center justify-center shadow-sm">
                    <div className="w-full h-full bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600">
                      <Users size={24} />
                    </div>
                  </div>

                  <div className="mt-8 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-[#2A2E3B] px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-200 dark:border-[#3F4455]">
                        <Hash size={10} />
                        {formatGroupId(g.id)}
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold group-hover:text-blue-600 transition-colors line-clamp-1">
                      {g.name}
                    </h3>
                    <p className="text-slate-500 dark:text-[#A8B0C2] text-sm mt-2 line-clamp-2 leading-relaxed min-h-[40px]">
                      {g.description || "No mission provided for this space."}
                    </p>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-slate-100 dark:border-[#2A2E3B] flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex -space-x-2">
                        {Array.from({ length: Math.min(3, g.memberCount) }).map((_, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#2A2E3B] border-2 border-white dark:border-[#181B26] flex items-center justify-center text-xs font-bold text-slate-500">
                            {String.fromCharCode(65 + i)}
                          </div>
                        ))}
                      </div>
                      {g.memberCount > 3 && (
                        <span className="text-xs font-bold text-slate-400 ml-3">+{g.memberCount - 3}</span>
                      )}
                    </div>
                    
                    <Link
                      to={`/groups/${g.id}`}
                      className="px-4 py-2 bg-slate-50 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 border border-slate-200 dark:border-white/10"
                    >
                      Open Space <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
