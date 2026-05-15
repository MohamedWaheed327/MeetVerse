/* eslint-disable no-unused-vars */
import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Settings,
  MessageSquare,
  Send,
  Pin,
  UserPlus,
  LogOut,
  Video,
  ArrowRight,
  Clock,
  X,
  Trash2,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getGroup, GroupDetails } from "../../services/getGroup";
import { updateGroup } from "../../services/updateGroup";
import { removeGroupMember } from "../../services/removeGroupMember";
import { getGroupMembers } from "../../services/getGroupMembers";
import { GetGroupChat } from "../../services/getGroupChat";
import {
  onError,
  onMessageReceived,
  subscribeToGroup,
  unsubscribeFromGroup,
} from "../../services/hubs/groupChat";
import { group_chat_connection } from "../../services/hubs/connections";
import { getJoinGroupRequests } from "../../services/getJoinGroupRequests";

type member = {
  userId: string;
  name: string;
  role: string;
  status: string;
};

type GroupChat = {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl: string;
  content: string;
  sentAt: string;
};

export default function GroupDetailsPage() {
  const navigate = useNavigate();
  const { groupId } = useParams();

  const [members, setMembers] = useState<member[]>([]);
  const [groupChat, setGroupChat] = useState<GroupChat[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [joinRequestsCount, setJoinRequestsCount] = useState(0);
  const [isChatOpenMobile, setIsChatOpenMobile] = useState(false);
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [groupChat, isChatOpenMobile]);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const requests = await getJoinGroupRequests(groupId ?? "");
        setJoinRequestsCount(requests.length);
      } catch (err) {
        console.error(err);
      }
    };
    loadRequests();
  }, [groupId]);

  useEffect(() => {
    const loadGroupMembers = async () => {
      try {
        const GroupMembers = await getGroupMembers(groupId ?? "");
        setMembers(GroupMembers || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadGroupMembers();
  }, [groupId]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await GetGroupChat(groupId ?? "");
        setGroupChat(history || []);
      } catch (err) {
        console.error(err);
      }
    };
    if (groupId) loadHistory();
  }, [groupId]);

  useEffect(() => {
    const loadGroupDetails = async () => {
      try {
        const details = await getGroup(groupId ?? "");
        setGroupDetails(details);
        setEditName(details.name);
        setEditDescription(details.description || "");
      } catch (err) {
        console.error(err);
      }
    };
    if (groupId) loadGroupDetails();
  }, [groupId]);

  const handleUpdateGroup = async () => {
    if (!editName.trim()) return;
    try {
      await updateGroup(groupId ?? "", { name: editName, description: editDescription });
      setGroupDetails((prev) => prev ? { ...prev, name: editName, description: editDescription } : null);
      setIsSettingsOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      await removeGroupMember(groupId ?? "", memberId);
      setMembers((prev) => prev.filter((m) => m.userId !== memberId));
    } catch (err) {
      console.error(err);
    }
  };

  function handleSendMessage() {
    if (newMessage.trim().length === 0) return;
    group_chat_connection.invoke("SendMessage", groupId!, newMessage);
    setNewMessage("");
  }

  useEffect(() => {
    const start = async () => {
      if (group_chat_connection.state === "Disconnected") {
        await group_chat_connection.start();
      }
      await subscribeToGroup(groupId!);
      onMessageReceived((payload: GroupChat) => {
        setGroupChat((prev) => [...prev, payload]);
      });
      onError((err: unknown) => console.error(err));
    };
    start();
    return () => {
      unsubscribeFromGroup(groupId!);
      group_chat_connection.off("ReceiveMessage");
    };
  }, [groupId]);

  const currentUserId =
    typeof window !== "undefined" ? localStorage.getItem("userid") : null;
  const currentUserRole = members.find((m) => m.userId === currentUserId)?.role;
  const isAdminOrOwner =
    currentUserRole === "Admin" || currentUserRole === "Owner";

  return (
    // نخلي الصفحة كلها بارتفاع الشاشة عشان الاسكرول يبقى جوه الكونتينت مش البودي
    <div className="h-screen bg-slate-50 dark:bg-[#0D0F16] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300 flex flex-col">
      <Navbar />

      {/* ده الكونتينر الرئيسي بعد النافبار: flex-1 + overflow-hidden عشان اللي جوه هو اللي يعمل scroll */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 md:px-6 pt-24 pb-6 flex flex-col gap-4 sm:gap-6 overflow-hidden">
        {/* Header Section */}
        <div className="relative flex items-center justify-between bg-white dark:bg-[#181B26] px-4 sm:px-5 md:px-6 py-4 rounded-[2rem] border border-slate-200 dark:border-[#2A2E3B] shadow-sm shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="size-9 sm:size-10 md:size-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <Users size={22} className="sm:size-6" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] sm:text-[10px] font-bold text-blue-600 uppercase tracking-[0.22em]">
                Space
              </span>
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-base sm:text-lg md:text-2xl font-black truncate max-w-[130px] xs:max-w-[180px] sm:max-w-[220px] md:max-w-full">
                  {groupDetails?.name || "Loading..."}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-[#0D0F16] text-[10px] font-semibold text-slate-500 dark:text-slate-300 px-2 py-0.5">
                  <Clock size={10} /> Live
                </span>
              </div>
              <p className="hidden sm:block text-[11px] md:text-xs text-slate-500 dark:text-slate-400 truncate">
                {groupDetails?.description || "Collaborate, chat and learn AI together in real-time."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isAdminOrOwner && (
              <button
                onClick={() => navigate(`/groups/${groupId}/requests`)}
                className="inline-flex lg:hidden items-center gap-1 rounded-full bg-blue-600/10 text-blue-700 dark:text-blue-300 px-2.5 py-1 text-[10px] font-semibold border border-blue-500/20"
              >
                <UserPlus size={12} />
                <span>Requests</span>
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-blue-600 text-white text-[9px]">
                  {joinRequestsCount}
                </span>
              </button>
            )}

            <button
              onClick={() => setIsChatOpenMobile(true)}
              className="lg:hidden size-9 sm:size-10 flex items-center justify-center bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/40 active:scale-95 transition-transform"
            >
              <MessageSquare size={18} className="sm:size-5" />
            </button>

            {isAdminOrOwner && (
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 md:gap-2 px-3.5 md:px-5 py-2 bg-slate-100 dark:bg-[#2A2E3B] border border-slate-200 dark:border-transparent rounded-xl text-[11px] md:text-xs font-bold hover:bg-slate-200 dark:hover:bg-[#232838] transition-all">
                <Settings size={14} className="md:size-4" />
                <span className="hidden md:inline">Settings</span>
              </button>
            )}
          </div>
        </div>

        {/* الكونتينر اللي ماسك الأعضاء + الشات: لازم يبقى min-h-0 + overflow-hidden عشان الأطفال يقدروا يعملوا scroll */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 sm:gap-6 overflow-hidden relative min-h-0">
          {/* Members Sidebar */}
          <aside className="w-full lg:w-[320px] xl:w-[350px] bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-5 md:p-6 flex flex-col shadow-xl overflow-hidden relative">
            <div className="flex items-center justify-between mb-4 sm:mb-5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="inline-flex size-7 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600">
                  <Users size={16} />
                </div>
                <div className="flex flex-col">
                  <h3 className="font-semibold text-sm sm:text-base flex items-center gap-1.5">
                    Members
                    <span className="text-[10px] font-bold text-slate-400">
                      · {members.length} total
                    </span>
                  </h3>
                </div>
              </div>
              <button
                onClick={() => navigate(`/groups/${groupId}/invite`)}
                className="text-[10px] font-black text-blue-600 hover:underline flex items-center gap-1 uppercase tracking-widest"
              >
                <UserPlus size={14} /> Invite
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 sm:pr-2 custom-scrollbar scrollbar-custom">
              {members.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 sm:p-3.5 bg-slate-50 dark:bg-[#0D0F16] border border-transparent dark:border-slate-800/50 rounded-2xl hover:border-blue-500/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all group"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div
                      className={`relative size-2.5 rounded-full ${
                        m.status === "Online"
                          ? "bg-emerald-500 shadow-[0_0_10px_#10b981aa]"
                          : "bg-slate-400"
                      }`}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-semibold truncate">
                        {m.name}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {m.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdminOrOwner && m.userId !== currentUserId && m.role !== "Owner" && (
                      <button 
                        onClick={() => handleRemoveMember(m.userId)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove Member"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide border ${
                        m.role === "Owner"
                          ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-300"
                          : m.role === "Admin"
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-300"
                            : "bg-white dark:bg-[#2A2E3B] border-slate-200 dark:border-slate-700 text-slate-400"
                      }`}
                    >
                      {m.role}
                    </span>
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <div className="text-center text-xs text-slate-400 py-6">
                  No members yet.
                </div>
              )}
            </div>

            <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-100 dark:border-[#2A2E3B] space-y-2.5 sm:space-y-3 shrink-0">
              {isAdminOrOwner && (
                <button
                  onClick={() => navigate(`/groups/${groupId}/requests`)}
                  className="w-full flex items-center justify-between p-3 sm:p-3.5 bg-blue-600/10 hover:bg-blue-600 text-blue-700 dark:text-white rounded-2xl transition-all group font-semibold text-xs sm:text-sm border border-blue-500/30 hover:border-blue-600"
                >
                  <span className="flex items-center gap-2">
                    <UserPlus size={16} />
                    <span>Manage Requests</span>
                  </span>
                  <span className="bg-blue-600 group-hover:bg-white group-hover:text-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {joinRequestsCount}
                  </span>
                </button>
              )}

              <button
                onClick={() => navigate(`/meetings/create?groupId=${groupId}`)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3.5 sm:p-4 rounded-2xl shadow-lg transition-all flex items-center justify-between group active:scale-[0.98]"
              >
                <div className="flex flex-col items-start">
                  <span className="text-xs sm:text-sm font-bold">
                    Start Meeting
                  </span>
                  <span className="hidden sm:inline text-[10px] text-blue-100">
                    Create an instant video session for this space.
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Video size={18} />
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </div>
              </button>

              <button className="w-full py-3 text-[10px] sm:text-[11px] text-red-500 dark:text-red-400 font-black uppercase tracking-[0.22em] hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all flex items-center justify-center gap-1.5">
                <LogOut size={14} />
                Leave Space
              </button>
            </div>
          </aside>

          <AnimatePresence>
            {(isChatOpenMobile ||
              (typeof window !== "undefined" && window.innerWidth >= 1024)) && (
              <motion.div
                initial={
                  isChatOpenMobile ? { y: "100%" } : { opacity: 0, y: 10 }
                }
                animate={isChatOpenMobile ? { y: 0 } : { opacity: 1, y: 0 }}
                exit={isChatOpenMobile ? { y: "100%" } : { opacity: 0, y: 10 }}
                transition={{
                  type: "spring",
                  damping: 30,
                  stiffness: 260,
                  mass: 0.9,
                }}
                className={`
                  flex-1 bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-t-3xl rounded-b-none lg:rounded-[2rem] flex flex-col overflow-hidden shadow-2xl z-[90] min-h-0
                  ${
                    isChatOpenMobile
                      ? "fixed inset-x-0 bottom-0 top-[64px] sm:top-[72px] lg:static lg:rounded-[2rem]"
                      : "hidden lg:flex"
                  }
                `}
              >
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#2A2E3B] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="inline-flex size-8 sm:size-9 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600">
                      <MessageSquare size={18} className="sm:size-5" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-semibold text-sm sm:text-base">
                        Team Chat
                      </h3>
                      <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
                        Stay in sync with your group in real time.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase bg-slate-50 dark:bg-[#0D0F16] px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800">
                      <Pin size={12} />
                      <span>Sync: Thu 7PM</span>
                    </div>
                    <button
                      onClick={() => setIsChatOpenMobile(false)}
                      className="lg:hidden p-2 bg-slate-100 dark:bg-[#2A2E3B] text-slate-500 rounded-full border border-slate-200 dark:border-slate-800"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* هنا المهم: flex-1 + overflow-y-auto + scrollbar-custom في كل الشاشات، فالشات نفسه دايماً له scroll حتى على الشاشات الكبيرة */}
                <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 custom-scrollbar scrollbar-custom">
                  {groupChat.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center text-xs sm:text-sm text-slate-400 gap-2">
                      <div className="inline-flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-[#0D0F16] size-12 mb-2">
                        <MessageSquare size={20} className="text-slate-400" />
                      </div>
                      <p className="font-medium">No messages yet.</p>
                      <p className="max-w-xs">
                        Start the conversation and keep everyone aligned with
                        what&apos;s happening in the space.
                      </p>
                    </div>
                  )}

                  {groupChat.map((msg, idx) => {
                    const isMe = msg.senderId === currentUserId;
                    return (
                      <motion.div
                        key={msg.id ?? idx}
                        initial={{
                          opacity: 0,
                          x: isMe ? 18 : -18,
                          scale: 0.98,
                        }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ duration: 0.18 }}
                        className={`flex gap-2.5 sm:gap-3 ${
                          isMe ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        <div
                          className={`size-8 sm:size-9 rounded-2xl flex items-center justify-center text-[10px] sm:text-xs font-black shadow shrink-0 ${
                            isMe
                              ? "bg-blue-600 text-white"
                              : "bg-slate-200 dark:bg-[#2A2E3B] text-blue-600 dark:text-blue-300"
                          }`}
                        >
                          {msg.senderName?.[0]?.toUpperCase()}
                        </div>
                        <div
                          className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[80%] ${
                            isMe ? "items-end" : "items-start"
                          }`}
                        >
                          <div
                            className={`flex items-center gap-2 ${
                              isMe ? "flex-row-reverse" : "flex-row"
                            }`}
                          >
                            <span className="text-[9px] sm:text-[10px] font-bold opacity-70">
                              {isMe ? "You" : msg.senderName}
                            </span>
                            <span className="text-[8px] sm:text-[9px] opacity-50 uppercase">
                              {new Date(msg.sentAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div
                            className={`px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm leading-relaxed break-words ${
                              isMe
                                ? "bg-blue-600 text-white rounded-2xl rounded-tr-none shadow-lg shadow-blue-900/20"
                                : "bg-slate-100 dark:bg-[#0D0F16] text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-none border border-slate-200/60 dark:border-slate-800/70"
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-3 sm:p-4 md:p-5 border-t border-slate-100 dark:border-[#2A2E3B] shrink-0 bg-white dark:bg-[#181B26]">
                  <div className="flex flex-col gap-2">
                    <div className="relative group">
                      <input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSendMessage()
                        }
                        className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl py-3.5 sm:py-4 pl-4 sm:pl-5 pr-12 sm:pr-14 text-xs sm:text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        placeholder="Type a message..."
                      />
                      <button
                        onClick={handleSendMessage}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 size-9 sm:size-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/40 active:scale-95 flex items-center justify-center transition-all"
                      >
                        <Send size={16} className="sm:size-[18px]" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 px-1">
                      <span>Press Enter to send</span>
                      <span className="hidden sm:inline-flex items-center gap-1">
                        <Clock size={10} />
                        Messages are live and synced instantly.
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-[#181B26] rounded-[2rem] p-6 shadow-2xl border border-slate-200 dark:border-[#2A2E3B]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Settings size={20} className="text-blue-600" /> Group Settings
                </h2>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-100 dark:bg-[#2A2E3B] hover:bg-slate-200 dark:hover:bg-[#34394A] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateGroup}
                    disabled={!editName.trim()}
                    className="px-5 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
