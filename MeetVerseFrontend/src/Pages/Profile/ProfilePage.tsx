import React, { useState, useEffect, useRef } from "react";
import { setPageTitle } from "../../utils/setPageTitle";
import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Shield, 
  Camera, 
  Trash2, 
  Save, 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  AlertTriangle 
} from "lucide-react";
import { getCurrentUser } from "../../services/currentUser";
import { ChangeName, ChangePassword } from "../../services/updateProfile";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../Context/ToastContext";
import api from "../../services/api";

type MeetVerseUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  roles: string;
  isGoogleUser: boolean;
};

type changePasswordState = {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

type changeUsernameState = {
  firstName: string;
  lastName: string;
};

// ----------------------------------------------------
// CANVAS CROP COMPONENT (Self-contained, touch-friendly)
// ----------------------------------------------------
interface CropCanvasProps {
  imageSrc: string;
  zoom: number;
  offset: { x: number; y: number };
  onOffsetChange: (offset: { x: number; y: number }) => void;
}

const CropCanvas: React.FC<CropCanvasProps> = ({ imageSrc, zoom, offset, onOffsetChange }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const isDragging = useRef(false);
  const startDrag = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      draw();
    };
  }, [imageSrc]);

  useEffect(() => {
    draw();
  }, [zoom, offset, imageSrc]);

  const draw = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw the image translated and scaled relative to the center
    ctx.save();
    ctx.translate(canvas.width / 2 + offset.x, canvas.height / 2 + offset.y);
    ctx.scale(zoom, zoom);
    
    // Fit the image naturally inside the canvas
    const maxDim = Math.max(img.width, img.height);
    const scaleFactor = 220 / maxDim; // Base diameter in crop preview
    const w = img.width * scaleFactor;
    const h = img.height * scaleFactor;

    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();

    // 2. Draw dark backdrop with a circular cutout of radius 100px (diameter 200px)
    ctx.save();
    ctx.fillStyle = "rgba(13, 15, 22, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 100, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Draw border outline around the cutout
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 100, 0, Math.PI * 2);
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2.5;
    ctx.stroke();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    startDrag.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    onOffsetChange({
      x: e.clientX - startDrag.current.x,
      y: e.clientY - startDrag.current.y
    });
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      startDrag.current = {
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging.current || e.touches.length !== 1) return;
    onOffsetChange({
      x: e.touches[0].clientX - startDrag.current.x,
      y: e.touches[0].clientY - startDrag.current.y
    });
  };

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={320}
      className="bg-[#0f111a] rounded-3xl cursor-move touch-none border border-slate-200 dark:border-white/5"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUpOrLeave}
    />
  );
};

// ----------------------------------------------------
// SKELETON LOADER
// ----------------------------------------------------
const ProfileSkeleton = () => (
  <div className="grid lg:grid-cols-12 gap-8 animate-pulse">
    {/* Left Column Skeleton */}
    <div className="lg:col-span-4 space-y-6">
      <div className="bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[2.5rem] p-8 text-center shadow-xl relative overflow-hidden">
        <div className="w-full h-28 bg-slate-200 dark:bg-slate-800 absolute top-0 left-0" />
        <div className="w-32 h-32 rounded-full bg-slate-200 dark:bg-slate-800 mx-auto mt-12 mb-6 border-4 border-white dark:border-[#181B26]" />
        <div className="h-6 bg-slate-200 dark:bg-slate-800 w-3/4 mx-auto rounded-md mb-2" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 w-1/2 mx-auto rounded-md mb-6" />
        <div className="flex justify-center gap-2 mb-8">
          <div className="w-16 h-6 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </div>
        <div className="w-full h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
      <div className="bg-red-50/50 dark:bg-red-950/10 border border-slate-200 dark:border-[#2A2E3B] rounded-[2rem] p-6 space-y-3">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 w-1/3 rounded-md" />
        <div className="h-10 bg-slate-200 dark:bg-slate-800 w-full rounded-2xl" />
      </div>
    </div>
    {/* Right Column Skeleton */}
    <div className="lg:col-span-8 space-y-8">
      <div className="bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[2.5rem] p-8 shadow-xl space-y-6">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 w-1/4 rounded-md mb-8" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2"><div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl" /></div>
          <div className="space-y-2"><div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl" /></div>
        </div>
        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full" />
        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl w-1/4" />
      </div>
    </div>
  </div>
);

// ----------------------------------------------------
// MAIN PROFILE COMPONENT
// ----------------------------------------------------
export default function ProfilePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [user, setUser] = useState<MeetVerseUser | null>(null);

  // Name Editing State
  const [changeUsername, setChangeUsername] = useState<changeUsernameState>({ firstName: "", lastName: "" });
  const [originalUsername, setOriginalUsername] = useState<changeUsernameState>({ firstName: "", lastName: "" });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Editing State
  const [changePassword, setChangePassword] = useState<changePasswordState>({ oldPassword: "", newPassword: "", confirmNewPassword: "" });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Avatar Upload States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });

  // Delete Account States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setPageTitle("Profile");
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoadingPage(true);
        const data = await getCurrentUser();
        setUser(data);
        if (data && data.name) {
          const parts = data.name.trim().split(/\s+/);
          const firstName = parts[0] || "";
          const lastName = parts.slice(1).join(" ") || "";
          const nameState = { firstName, lastName };
          setChangeUsername(nameState);
          setOriginalUsername(nameState);
        }
      } catch (error) {
        showToast("Failed to load profile details.", "error");
      } finally {
        setIsLoadingPage(false);
      }
    };
    fetchUser();
  }, [showToast]);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  // Name gradient hashing function
  const getGradientByName = (name: string) => {
    const gradients = [
      "from-blue-500 to-violet-500",
      "from-emerald-400 to-teal-500",
      "from-rose-500 to-orange-500",
      "from-indigo-500 to-cyan-500",
      "from-fuchsia-500 to-pink-500",
      "from-amber-400 to-yellow-500"
    ];
    if (!name) return gradients[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  // Profile Picture File Picker Choice
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setCropImageSrc(reader.result as string);
        setZoom(1);
        setCropOffset({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  // Crop Canvas Confirmation
  const handleConfirmCrop = () => {
    if (!cropImageSrc) return;
    const img = new Image();
    img.src = cropImageSrc;
    img.onload = () => {
      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = 400;
      outputCanvas.height = 400;
      const ctx = outputCanvas.getContext("2d");
      
      if (ctx) {
        ctx.save();
        // Translate to output center and apply scaled offsets
        ctx.translate(200 + cropOffset.x * 2, 200 + cropOffset.y * 2);
        ctx.scale(zoom * 2, zoom * 2);

        // Draw image scaled exactly like in preview
        const maxDim = Math.max(img.width, img.height);
        const scaleFactor = 220 / maxDim; 
        const w = img.width * scaleFactor;
        const h = img.height * scaleFactor;

        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();

        outputCanvas.toBlob(
          async (blob) => {
            if (blob) {
              setCropImageSrc(null); // Close crop modal
              await handleAvatarUpload(blob);
            }
          },
          "image/jpeg",
          0.92
        );
      }
    };
  };

  // Upload cropped image
  const handleAvatarUpload = async (blob: Blob) => {
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", blob, "avatar.jpg");

    try {
      const response = await api.post("/profile/upload-avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || blob.size)
          );
          setUploadProgress(percentCompleted);
        },
      });

      const newAvatarUrl = response.data.avatarUrl;
      setUser((prev) => prev ? { ...prev, avatarUrl: newAvatarUrl } : null);
      showToast("Avatar updated successfully!", "success");
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data || "Failed to upload avatar.";
      showToast(errMsg, "error");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Password Strength Logic
  const getPasswordStrength = (password: string) => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const getStrengthMeta = () => {
    const strength = getPasswordStrength(changePassword.newPassword);
    if (!changePassword.newPassword) return { percent: 0, color: "bg-slate-200", text: "", textColor: "text-slate-400" };
    if (strength <= 2) {
      return { percent: 33, color: "bg-red-500", text: "Weak", textColor: "text-red-500" };
    }
    if (strength <= 4) {
      return { percent: 66, color: "bg-amber-500", text: "Fair", textColor: "text-amber-500" };
    }
    return { percent: 100, color: "bg-emerald-500", text: "Strong", textColor: "text-emerald-500" };
  };

  const strengthMeta = getStrengthMeta();

  // Field updates handlers
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setChangePassword((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setChangeUsername((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Save changes handlers
  const handleNameChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeUsername.firstName.trim() || !changeUsername.lastName.trim()) {
      showToast("First name and last name cannot be empty.", "error");
      return;
    }

    setIsSavingProfile(true);
    try {
      await ChangeName(changeUsername.firstName, changeUsername.lastName);
      const fullName = `${changeUsername.firstName} ${changeUsername.lastName}`;
      setUser((prev) => prev ? { ...prev, name: fullName } : null);
      setOriginalUsername({ ...changeUsername });
      localStorage.setItem("username", fullName);
      showToast("Profile details updated successfully!", "success");
    } catch (error: any) {
      showToast(error || "Failed to update profile.", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPassword(true);
    try {
      await ChangePassword(changePassword.oldPassword, changePassword.newPassword, changePassword.confirmNewPassword);
      setChangePassword({ oldPassword: "", newPassword: "", confirmNewPassword: "" });
      showToast("Credentials updated successfully!", "success");
    } catch (error: any) {
      showToast(error.message || "Failed to update password.", "error");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmEmail !== user?.email) {
      showToast("Please enter your exact email to confirm.", "error");
      return;
    }

    setIsDeletingAccount(true);
    try {
      await api.delete("/profile/account");
      showToast("Account deleted successfully.", "success");
      localStorage.clear();
      // Redirect to landing page
      navigate("/");
    } catch (error: any) {
      const errMsg = error.response?.data || "Failed to delete account.";
      showToast(errMsg, "error");
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  const isProfileModified = 
    changeUsername.firstName !== originalUsername.firstName || 
    changeUsername.lastName !== originalUsername.lastName;

  const isPasswordFormValid = 
    changePassword.oldPassword.trim() !== "" &&
    changePassword.newPassword.trim() !== "" &&
    changePassword.confirmNewPassword.trim() !== "" &&
    changePassword.newPassword === changePassword.confirmNewPassword;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-[#0D0F16] dark:to-[#121520] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Header Section */}
        <motion.div {...fadeInUp} className="mb-10">
          <span className="text-blue-600 dark:text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px]">
            Account Settings
          </span>
          <h1 className="text-4xl font-extrabold mt-2 tracking-tight">
            Your Identity
          </h1>
          <p className="text-slate-600 dark:text-[#A8B0C2] mt-2 text-sm max-w-xl">
            Manage your MeetVerse presence, update security credentials, and
            customize your profile appearance.
          </p>
        </motion.div>

        {isLoadingPage ? (
          <ProfileSkeleton />
        ) : (
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left Column: Avatar & Quick Actions */}
            <motion.div {...fadeInUp} className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[2.5rem] shadow-xl dark:shadow-2xl overflow-hidden relative group">
                
                {/* Decorative Banner Strip */}
                <div className={`h-28 w-full bg-gradient-to-r ${getGradientByName(user?.name || "")} transition-all duration-500`} />

                <div className="px-8 pb-8 text-center -mt-16 relative z-10 flex flex-col items-center">
                  
                  {/* Interactive Avatar Area */}
                  <div 
                    className="relative inline-block cursor-pointer mb-6" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-5xl font-bold shadow-2xl text-white overflow-hidden relative border-4 border-white dark:border-[#181B26] hover:scale-105 transition-all duration-300">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>
                          {changeUsername.firstName.charAt(0).toUpperCase() || "?"}
                        </span>
                      )}
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-250 rounded-full">
                        <Camera className="text-white w-6 h-6 mb-1" />
                        <span className="text-[10px] text-white font-extrabold uppercase tracking-widest">Change Photo</span>
                      </div>

                      {/* Upload Spinner Overlay */}
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                          <span className="text-white text-sm font-black">{uploadProgress}%</span>
                        </div>
                      )}
                    </div>

                    {/* Circular Upload Progress indicator */}
                    {isUploading && (
                      <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-20" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="48"
                          stroke="#3b82f6"
                          strokeWidth="4"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 48}
                          strokeDashoffset={2 * Math.PI * 48 * (1 - uploadProgress / 100)}
                          strokeLinecap="round"
                          className="transition-all duration-100 ease-out"
                        />
                      </svg>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                    {user?.name || "Loading..."}
                  </h3>

                  <p className="text-slate-500 dark:text-[#A8B0C2] text-sm mb-6 truncate max-w-full">
                    {user?.email || "Loading..."}
                  </p>

                  {/* Role badges */}
                  <div className="flex justify-center gap-2 mb-8">
                    {user?.roles === "Host" && (
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                        Host
                      </span>
                    )}
                    {(user?.roles === "Participant" || user?.roles === "User") && (
                      <span className="px-3 py-1 bg-slate-100 dark:bg-[#2A2E3B] border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-[#A8B0C2] text-[10px] font-bold rounded-full uppercase tracking-wider">
                        Participant
                      </span>
                    )}
                    {user?.roles === "Admin" && (
                      <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                        Admin
                      </span>
                    )}
                  </div>

                  {/* Device File Picker Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-[#2A2E3B] hover:bg-slate-200 dark:hover:bg-[#353A4D] text-slate-900 dark:text-white py-3 rounded-2xl transition-all font-semibold text-sm hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Camera size={18} />
                    Change Avatar
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 rounded-[2rem] p-6 shadow-md shadow-red-900/5">
                <div className="flex items-center gap-2 mb-4 text-red-600 dark:text-red-400">
                  <Trash2 size={18} />
                  <h4 className="font-bold text-xs uppercase tracking-wider">
                    Danger Zone
                  </h4>
                </div>
                <p className="text-red-700/70 dark:text-red-300/60 text-[11px] mb-4 leading-relaxed">
                  Permanently delete your account and all associated data. This
                  action cannot be undone.
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full bg-red-100 dark:bg-red-500/10 hover:bg-red-600 dark:hover:bg-red-500 hover:text-white border border-red-200 dark:border-red-500/50 text-red-600 dark:text-red-500 py-3 rounded-2xl transition-all text-xs font-bold active:scale-95"
                >
                  Delete MeetVerse Account
                </button>
              </div>
            </motion.div>

            {/* Right Column: Forms */}
            <motion.div
              {...fadeInUp}
              transition={{ delay: 0.2 }}
              className="lg:col-span-8 space-y-8"
            >
              {/* Form: Personal Info */}
              <div className="bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[2.5rem] p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-blue-600/10 rounded-xl text-blue-600 dark:text-blue-500">
                    <User size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Personal Information
                  </h2>
                </div>

                <form className="space-y-6" onSubmit={handleNameChangeSubmit}>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-[#A8B0C2] ml-1 uppercase tracking-widest">
                        First Name
                      </label>
                      <input
                        name="firstName"
                        type="text"
                        autoComplete="off"
                        value={changeUsername.firstName}
                        onChange={handleUsernameChange}
                        className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl px-5 py-4 text-sm text-slate-900 dark:text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-[#A8B0C2] ml-1 uppercase tracking-widest">
                        Last Name
                      </label>
                      <input
                        name="lastName"
                        type="text"
                        autoComplete="off"
                        value={changeUsername.lastName}
                        onChange={handleUsernameChange}
                        className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl px-5 py-4 text-sm text-slate-900 dark:text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-[#A8B0C2] ml-1 uppercase tracking-widest">
                      Display Name
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={`${changeUsername.firstName} ${changeUsername.lastName}`.trim()}
                      className="w-full bg-slate-100 dark:bg-[#0d0f16]/60 border border-slate-200 dark:border-[#2A2E3B] rounded-2xl px-5 py-4 text-sm text-slate-500 dark:text-[#A8B0C2]/50 outline-none cursor-not-allowed"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={!isProfileModified || isSavingProfile}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-[#2A2E3B]/50 disabled:text-slate-500 dark:disabled:text-slate-500 dark:hover:bg-blue-600 text-white px-8 py-4 rounded-2xl transition-all shadow-lg disabled:shadow-none hover:shadow-blue-900/20 font-bold text-sm"
                    >
                      {isSavingProfile ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save size={18} />
                      )}
                      {isSavingProfile ? "Saving..." : "Save Profile Changes"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Form: Security (Hidden for Google OAuth Users) */}
              {!user?.isGoogleUser && (
                <div className="bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[2.5rem] p-8 shadow-xl">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-blue-600/10 rounded-xl text-blue-600 dark:text-blue-500">
                      <Shield size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Security & Password
                    </h2>
                  </div>

                  <form className="space-y-6" onSubmit={handlePasswordChangeSubmit}>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-[#A8B0C2] ml-1 uppercase tracking-widest">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          name="oldPassword"
                          type={showOldPassword ? "text" : "password"}
                          placeholder="••••••••••••"
                          value={changePassword.oldPassword}
                          onChange={handlePasswordChange}
                          className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl px-5 py-4 pr-12 text-sm text-slate-900 dark:text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword((prev) => !prev)}
                          className="absolute right-5 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-[#A8B0C2] ml-1 uppercase tracking-widest">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            name="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={changePassword.newPassword}
                            onChange={handlePasswordChange}
                            className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl px-5 py-4 pr-12 text-sm text-slate-900 dark:text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword((prev) => !prev)}
                            className="absolute right-5 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          >
                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>

                        {/* Live Password Strength Indicator Bar */}
                        {changePassword.newPassword && (
                          <div className="mt-2 space-y-1 ml-1">
                            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${strengthMeta.color} transition-all duration-300`}
                                style={{ width: `${strengthMeta.percent}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Strength: <span className={`${strengthMeta.textColor} font-black`}>{strengthMeta.text}</span>
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-[#A8B0C2] ml-1 uppercase tracking-widest">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <input
                            name="confirmNewPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={changePassword.confirmNewPassword}
                            onChange={handlePasswordChange}
                            className="w-full bg-slate-50 dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl px-5 py-4 pr-12 text-sm text-slate-900 dark:text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="absolute right-5 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>

                          {/* Inline Checkmark or Error indicator inside the input */}
                          {changePassword.confirmNewPassword && (
                            <div className="absolute right-12 top-4 flex items-center">
                              {changePassword.newPassword === changePassword.confirmNewPassword ? (
                                <CheckCircle className="text-emerald-500 w-5 h-5" />
                              ) : (
                                <XCircle className="text-red-500 w-5 h-5" />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Inline error description */}
                        {changePassword.confirmNewPassword && changePassword.newPassword !== changePassword.confirmNewPassword && (
                          <p className="text-xs text-red-500 mt-1 ml-1">Passwords do not match.</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={!isPasswordFormValid || isSavingPassword}
                        className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 dark:disabled:bg-[#2A2E3B]/50 disabled:text-slate-500 dark:disabled:text-slate-500 text-white px-8 py-4 rounded-2xl transition-all shadow-lg disabled:shadow-none hover:shadow-blue-900/20 font-bold text-sm"
                      >
                        {isSavingPassword ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Key size={18} />
                        )}
                        {isSavingPassword ? "Updating..." : "Update Credentials"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </main>

      {/* ----------------------------------------------------
          CROP PICTURE MODAL
      ---------------------------------------------------- */}
      <AnimatePresence>
        {cropImageSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 22, stiffness: 200 }}
              className="bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[2.5rem] p-8 max-w-md w-full mx-4 shadow-2xl flex flex-col items-center"
            >
              <h3 className="text-xl font-black mb-4 tracking-tight text-white flex items-center gap-2">
                <Camera size={20} className="text-blue-500" />
                Adjust Avatar Photo
              </h3>
              
              <CropCanvas
                imageSrc={cropImageSrc}
                zoom={zoom}
                offset={cropOffset}
                onOffsetChange={setCropOffset}
              />
              
              <div className="w-full mt-6 space-y-2 px-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span>Zoom / Scale</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.02"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="flex gap-4 w-full mt-8">
                <button
                  onClick={handleConfirmCrop}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-blue-900/20 transition-all active:scale-95"
                >
                  Confirm Crop
                </button>
                <button
                  onClick={() => setCropImageSrc(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 border border-[#2A2E3B]"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------------------------------------------
          DELETE ACCOUNT CONFIRMATION MODAL
      ---------------------------------------------------- */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/75 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-[#0f1117] to-[#1a1d2e] border border-red-500/25 rounded-[2.5rem] p-8 md:p-10 shadow-2xl max-w-md w-full mx-4"
            >
              <div className="flex items-center gap-3 text-red-500 mb-4">
                <AlertTriangle size={24} />
                <h3 className="text-xl font-black tracking-tight">Delete Account?</h3>
              </div>

              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                This action is <span className="text-red-500 font-bold">permanent</span> and cannot be undone. All your hostings, transcripts, files, and memberships will be deleted.
              </p>

              <div className="space-y-4">
                <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-500">
                  Please type your email to confirm:
                  <span className="block mt-1 font-mono text-slate-300 lowercase select-all border border-dashed border-slate-700/60 p-2 rounded-xl bg-[#0b0c13] text-center">{user?.email}</span>
                </label>

                <input
                  type="text"
                  placeholder="type your email here"
                  autoComplete="off"
                  value={deleteConfirmEmail}
                  onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                  className="w-full bg-[#0d0f16] border border-slate-800 rounded-2xl px-5 py-4 text-sm text-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-none text-center"
                />
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmEmail !== user?.email || isDeletingAccount}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-900/50 disabled:text-slate-600 disabled:border-slate-800 border border-transparent text-white py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-red-900/20"
                >
                  {isDeletingAccount && <Loader2 className="w-4 h-4 animate-spin" />}
                  Delete Account
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmEmail("");
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 border border-[#2A2E3B]"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}