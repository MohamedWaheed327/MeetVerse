/* eslint-disable no-unused-vars */
import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck,
  UserX,
  Clock,
  ArrowLeft,
  Users,
  ShieldCheck,
  Mail,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getJoinGroupRequests } from "../../services/getJoinGroupRequests";
import { acceptJoinGroupRequest } from "../../services/acceptJoinGroupRequest";
import { rejectJoinGroupRequest } from "../../services/rejectJoinGroupRequest";

// بيانات تجريبية (Mock Data)
// const initialRequests = [
//   {
//     SenderId: "1",
//     SenderName: "Ahmed Ali",
//     SenderEmail: "ahmed@example.com",
//     SentAt: "2 hours ago",
//     avatar: "A",
//   },
//   {
//     SenderId: "2",
//     SenderName: "Sara Mohamed",
//     SenderEmail: "sara@example.com",
//     SentAt: "5 hours ago",
//     avatar: "S",
//   },
//   {
//     SenderId: "3",
//     SenderName: "Mohamed Warith",
//     SenderEmail: "warith@example.com",
//     SentAt: "Yesterday",
//     avatar: "M",
//   },
//   {
//     SenderId: "4",
//     SenderName: "Hamza Ahmed",
//     SenderEmail: "hamza@example.com",
//     SentAt: "2 days ago",
//     avatar: "H",
//   },
// ];

type GroupRequestsResponse = {
  senderId: string;
  senderName: string;
  senderEmail: string;
  sentAt: string;
};

export default function GroupRequestsPage() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const [joinRequests, setJoinRequests] = useState<GroupRequestsResponse[]>([]);

  useEffect(() => {
    const loadRequests = async () => {
      const requests = await getJoinGroupRequests(groupId ?? "");
      setJoinRequests(requests);
    };

    loadRequests();
    
  }, [groupId]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    if (action == "approve") {
      await acceptJoinGroupRequest(groupId ?? "", id);
    }
    else {
      await rejectJoinGroupRequest(groupId ?? "", id);
    }
    // الانيميشن سيقوم بحذف الكارد من القائمة
    setJoinRequests((prev) => prev.filter((req) => req.senderId !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0F16] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-all font-bold text-sm bg-white dark:bg-[#181B26] px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-[#2A2E3B] shadow-sm active:scale-95"
          >
            <ArrowLeft size={18} /> Back to Group
          </button>
          <div className="text-center md:text-right">
            <span className="text-blue-600 font-bold uppercase tracking-[0.3em] text-[10px] block mb-1">
              Community Governance
            </span>
            <h1 className="text-3xl font-black tracking-tight">
              Pending Requests
            </h1>
          </div>
        </div>

        {/* Requests Container */}
        <div className="bg-white/40 dark:bg-[#181B26]/40 backdrop-blur-xl border border-slate-200 dark:border-[#2A2E3B] rounded-[3.5rem] overflow-hidden shadow-2xl relative">
          {/* Section Header */}
          <div className="p-10 border-b border-slate-100 dark:border-[#2A2E3B] bg-white/50 dark:bg-[#0D0F16]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-blue-600 text-white rounded-3xl shadow-xl shadow-blue-600/20">
                <Users size={24} />
              </div>
              <div>
                <h3 className="font-bold text-xl">Review Applicants</h3>
                <p className="text-xs text-slate-500 dark:text-[#A8B0C2] font-medium mt-0.5">
                  Decision center for community entry
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-5 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest shadow-inner">
              <ShieldCheck size={14} /> Administrator View
            </div>
          </div>

          <div className="p-6 md:p-10 space-y-5">
            <AnimatePresence mode="popLayout">
              {joinRequests.length > 0 ? (
                joinRequests.map((req) => (
                  <motion.div
                    key={req.senderId}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: -50 }}
                    className="group relative flex flex-col md:flex-row items-center justify-between p-6 md:p-8 bg-white dark:bg-[#0D0F16] border border-slate-100 dark:border-[#2A2E3B] rounded-[2.5rem] hover:border-blue-500/40 transition-all shadow-sm hover:shadow-xl"
                  >
                    {/* User Info */}
                    <div className="flex items-center gap-6 w-full md:w-auto">
                      <div className="relative">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-linear-to-br from-blue-600 to-indigo-700 rounded-[1.8rem] flex items-center justify-center text-white text-2xl font-black shadow-lg">
                          {req.senderName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-500 border-4 border-white dark:border-[#0D0F16] rounded-full animate-pulse shadow-sm"></div>
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="font-black text-lg md:text-xl text-slate-900 dark:text-white tracking-tight">
                          {req.senderName}
                        </h4>
                        <div className="flex flex-col gap-1">
                          <p className="text-xs text-slate-400 font-bold flex items-center gap-2">
                            <Mail size={12} className="text-blue-500" />{" "}
                            {req.senderEmail}
                          </p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                            <Clock size={12} className="text-emerald-500" />{" "}
                            Applied {req.sentAt}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex-col md:flex  items-center gap-4 mt-8 md:mt-0 w-full md:w-auto ">
                      <button
                        onClick={() => handleAction(req.senderId, "reject")}
                        className="flex-1 w-full md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-slate-100 dark:bg-[#181B26] hover:bg-red-500/10 hover:text-red-500 text-slate-500 rounded-3xl text-xs font-black uppercase tracking-widest transition-all border border-transparent hover:border-red-500/20 active:scale-95 mb-3 md:mb-0 hover:scale-105"
                      >
                        <UserX size={18} /> Decline
                      </button>
                      <button
                        onClick={() => handleAction(req.senderId, "approve")}
                        className="flex-1 md:flex-none flex items-center w-full justify-center gap-3 px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95 hover:scale-105"
                      >
                        <UserCheck size={18} /> Approve
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-32 text-center space-y-6"
                >
                  <div className="inline-flex p-10 bg-slate-100 dark:bg-[#0D0F16] rounded-[3rem] text-slate-300 dark:text-[#2A2E3B] shadow-inner">
                    <Users size={80} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                      Queue is empty
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-[#A8B0C2] font-medium">
                      All joining requests have been processed.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
