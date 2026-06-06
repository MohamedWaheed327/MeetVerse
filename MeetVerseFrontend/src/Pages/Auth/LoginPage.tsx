import { useNavigate } from "react-router-dom";
import { FormEvent, useEffect, useRef, useState } from "react";
import { LogIn, Mail, Lock, ArrowRight, Eye, EyeOff, Video, Waves, FileText, Zap } from "lucide-react";
import { loginUser } from "../../services/login";
import { getCurrentUser } from "../../services/currentUser";
import { loginWithGoogle } from "../../services/googleLogin";
import Logo from "../../components/Shared/Logo";
import DarkMode from "../../components/LandingComponents/Navbar/DarkMode";
import { setPageTitle } from "../../utils/setPageTitle";

import { useAuth } from "../../Context/AuthContext";
import { useGoogleAuth } from "../../utils/googleAuth";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"></path>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.2-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
    <path fill="none" d="M0 0h48v48H0z"></path>
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const googleButtonContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPageTitle("Sign in");
  }, []);

  const finishLogin = async (token: string) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("token", token);
    
    try {
      const user = await getCurrentUser();
      login(token, user.name, user.id, rememberMe);
      
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin');
        navigate(redirectUrl);
      } else {
        navigate("/home");
      }
    } catch (err) {
      storage.removeItem("token");
      throw err;
    }
  };

  const { handleGoogleLoginClick } = useGoogleAuth(
    googleButtonContainerRef,
    finishLogin,
    (msg: string) => setError(msg || null),
    setLoading
  );

  const validateEmail = (value: string) => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (!isValid && value.length > 0) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (emailError) return;
    setError(null);
    setLoading(true);

    try {
      const data = { email, password };
      const response = await loginUser(data);
      await finishLogin(response.token);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to login");
      }
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, isPasswordField: boolean) => {
    if (e.key === "Enter" && isPasswordField) {
      e.preventDefault();
      const form = e.currentTarget.closest('form');
      if (form) form.requestSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 dark:bg-none dark:bg-[#0d1117] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300 font-['Plus_Jakarta_Sans']">
      
      {/* Noise Texture for Dark Mode */}
      <div className="pointer-events-none absolute inset-0 hidden dark:block before:absolute before:inset-0 before:pointer-events-none before:bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.03%22/%3E%3C/svg%3E')]" />

      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.97); }
        }
        .form-card { animation: slideUpFade 0.4s ease-out both; }
        .gradient-orb { animation: orbFloat 10s ease-in-out infinite; }
        
        input:-webkit-autofill ~ label {
          top: 0.5rem !important;
          transform: translateY(0) !important;
          font-size: 10px !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
        }
      `}</style>

      <div className="flex min-h-screen relative z-10">
        {/* Left Panel (Brand Storytelling) */}
        <div className="hidden lg:flex flex-col justify-between w-[40%] bg-gradient-to-br from-indigo-50 to-violet-100 dark:bg-[#111827] dark:bg-none p-12 relative overflow-hidden border-r border-slate-200 dark:border-white/5">
          {/* Animated Orb Layer */}
          <div className="gradient-orb absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-tr from-indigo-500/40 to-blue-500/30 blur-3xl rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <Logo className="mb-16" imageClassName="h-14" textClassName="text-4xl" />
            
            <h2 className="text-4xl font-extrabold tracking-tight leading-[1.1] mb-12 text-slate-900 dark:text-white" dir="auto">
              Where great meetings begin.
            </h2>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4 animate-[slideUpFade_0.4s_ease-out_both]" style={{ animationDelay: '100ms' }}>
                <div className="mt-1 p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg"><Waves size={18} /></div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">AI Noise Cancellation</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Crystal clear audio in any environment.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 animate-[slideUpFade_0.4s_ease-out_both]" style={{ animationDelay: '200ms' }}>
                <div className="mt-1 p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg"><FileText size={18} /></div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Live Transcription</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Never miss a word with real-time captions.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 animate-[slideUpFade_0.4s_ease-out_both]" style={{ animationDelay: '300ms' }}>
                <div className="mt-1 p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg"><Zap size={18} /></div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Zero Friction</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Join instantly without complicated setups.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3 mt-16 pt-8 border-t border-slate-200 dark:border-white/10">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`w-8 h-8 rounded-full border-2 border-slate-50 dark:border-[#111827] bg-gradient-to-br ${i === 1 ? 'from-blue-400 to-indigo-500' : i === 2 ? 'from-purple-400 to-pink-500' : 'from-emerald-400 to-teal-500'}`} />
              ))}
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Joined by <span className="text-slate-900 dark:text-white font-bold">10,000+</span> teams</p>
          </div>
        </div>

        {/* Right Panel (Form) */}
        <div className="w-full lg:w-[60%] flex flex-col justify-center px-6 py-10 lg:px-24 h-screen overflow-y-auto scrollbar-custom relative z-10">
          <div className="w-full max-w-[420px] mx-auto form-card bg-white dark:bg-[#0d1117] lg:bg-transparent lg:dark:bg-transparent rounded-3xl lg:rounded-none p-8 lg:p-0 shadow-2xl lg:shadow-none border border-slate-100 dark:border-white/5 lg:border-none relative z-10">
            
            {/* Header Area */}
            <div className="flex justify-between items-start mb-12">
              <Logo className="lg:hidden mb-8" imageClassName="h-10" textClassName="text-2xl" />
              <div className="hidden lg:block" />
              <div className="flex items-center gap-4">
                <DarkMode className="!w-8 !h-8 !rounded-lg text-slate-400 hover:text-slate-200" />
                <p className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
                  New here? <a href="/signup" className="text-blue-600 dark:text-blue-400 font-bold hover:underline transition-all">Sign up &rarr;</a>
                </p>
              </div>
            </div>
            
            {/* Form Title */}
            <div className="mb-8">
              <Logo className="mb-6 hidden lg:flex" imageClassName="h-16" showText={false} />
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Welcome back
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                Sign in to your MeetVerse workspace.
              </p>
            </div>

            {error && (
              <div role="alert" aria-live="polite" className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm mb-6 text-center font-medium">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              
              {/* Email Input */}
              <div className="relative w-full">
                <div className={`relative border rounded-xl transition-all duration-200 bg-white dark:bg-[#161d2a] ${emailError ? 'border-red-500/60 ring-2 ring-red-500/30' : 'border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/30'}`}>
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={16} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    onBlur={(e) => validateEmail(e.target.value)}
                    className="peer w-full bg-transparent pl-11 pr-4 pb-2 pt-6 text-sm outline-none text-slate-900 dark:text-slate-100 placeholder:text-transparent"
                    placeholder="Email Address"
                    dir="auto"
                  />
                  <label
                    htmlFor="email"
                    className="absolute left-11 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 text-sm transition-all duration-200 pointer-events-none
                      peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-widest peer-focus:text-blue-500 dark:peer-focus:text-blue-400
                      peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-widest
                    "
                  >
                    Email Address
                  </label>
                </div>
                {emailError && <p role="alert" aria-live="polite" className="text-xs text-red-500 mt-1.5 ml-1">{emailError}</p>}
              </div>

              {/* Password Input */}
              <div className="relative w-full">
                <div className={`relative border rounded-xl transition-all duration-200 bg-white dark:bg-[#161d2a] border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/30`}>
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={16} />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, true)}
                    className="peer w-full bg-transparent pl-11 pr-12 pb-2 pt-6 text-sm outline-none text-slate-900 dark:text-slate-100 placeholder:text-transparent"
                    placeholder="Password"
                    dir="auto"
                  />
                  <label
                    htmlFor="password"
                    className="absolute left-11 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 text-sm transition-all duration-200 pointer-events-none
                      peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-widest peer-focus:text-blue-500 dark:peer-focus:text-blue-400
                      peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-widest
                    "
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Login Specifics */}
              <div className="flex items-center justify-between pt-1 pb-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="appearance-none w-4 h-4 rounded border border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 checked:bg-blue-600 checked:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all cursor-pointer relative after:content-[''] after:absolute after:hidden checked:after:block after:left-[4px] after:top-[1px] after:w-[6px] after:h-[10px] after:border-r-2 after:border-b-2 after:border-white after:rotate-45"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">Remember me</span>
                </label>
                <a href="/forgot-password" className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                  Forgot password?
                </a>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70 disabled:hover:translate-y-0 text-white font-semibold py-2.5 h-11 rounded-xl shadow-md shadow-blue-900/10 hover:-translate-y-[1px] transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Login <ArrowRight size={18} className="opacity-80" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8 flex items-center justify-center">
              <hr className="flex-1 border-slate-200 dark:border-slate-700" />
              <span className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-transparent">
                or continue with
              </span>
              <hr className="flex-1 border-slate-200 dark:border-slate-700" />
            </div>

            {/* Google Button Redesign */}
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleLoginClick}
              className="w-full flex items-center justify-center gap-3 py-2.5 h-11 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-150 active:scale-[0.98]"
            >
              <GoogleIcon />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Continue with Google</span>
            </button>
            
            {/* Mobile Signup Link */}
            <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 sm:hidden">
              New here? <a href="/signup" className="text-blue-600 dark:text-blue-400 font-bold hover:underline transition-all">Sign up</a>
            </p>

            {/* Hidden Google Original Button */}
            <div id="google-button-container" ref={googleButtonContainerRef} className="hidden" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}
