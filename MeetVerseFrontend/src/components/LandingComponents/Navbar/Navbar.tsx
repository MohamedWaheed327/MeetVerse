/* eslint-disable no-unused-vars */
import { useState } from "react";
import Logo from "../../Shared/Logo";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import DarkMode from "./DarkMode";
import { useAuth } from "../../../Context/AuthContext";
import { LiquidMetalButton } from "../../ui/LiquidMetalButton";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth();

  const isMeetingRoom =
    /^\/meetings\/[^/]+$/.test(location.pathname) &&
    !["/meetings/create", "/meetings/join"].includes(location.pathname);

  if (isMeetingRoom) {
    return null;
  }

  const isLanding = location.pathname === "/";

  const closeMobile = () => setMobileMenuOpen(false);

  const linkClasses =
    "text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 cursor-pointer px-2 py-1 rounded-md relative group";
  const activeClasses =
    "text-blue-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-purple-500 dark:to-blue-500 font-bold after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-gradient-to-r after:from-purple-500 after:to-blue-500";
  const inactiveClasses =
    "text-gray-600 dark:text-[#A8B0C2] hover:text-blue-600 dark:hover:text-[#F1F5F9]";

  const isActiveSection = (hash: string) => location.hash === hash;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/75 dark:bg-[#0f0f13]/80 backdrop-blur-xl border-b border-white/60 dark:border-white/5 transition-colors duration-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to={isLoggedIn ? "/home" : "/"} onClick={closeMobile} className="transform scale-110 origin-left transition-transform duration-300">
            <Logo />
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {/* 1. لو اليوزر مش مسجل وهو في اللاندنج بيدج -> اظهر لينكات الاقسام */}
            {!isLoggedIn && isLanding && (
              <>
                <a
                  href="#features"
                  className={`${linkClasses} ${isActiveSection("#features") ? activeClasses : inactiveClasses}`}
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className={`${linkClasses} ${isActiveSection("#how-it-works") ? activeClasses : inactiveClasses}`}
                >
                  How It Works
                </a>
                <a
                  href="#Overview"
                  className={`${linkClasses} ${isActiveSection("#Overview") ? activeClasses : inactiveClasses}`}
                >
                  Overview
                </a>
                <a
                  href="#our-audience"
                  className={`${linkClasses} ${isActiveSection("#our-audience") ? activeClasses : inactiveClasses}`}
                >
                  Our Audience
                </a>
              </>
            )}

            {/* 2. لو اليوزر مسجل دخول -> اظهر لينكات التحكم دايماً */}
            {isLoggedIn && (
              <>
                <NavLink
                  to="/home"
                  className={({ isActive }) =>
                    `${linkClasses} ${isActive ? activeClasses : inactiveClasses}`
                  }
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/meetings"
                  className={({ isActive }) =>
                    `${linkClasses} ${isActive ? activeClasses : inactiveClasses}`
                  }
                >
                  Meetings
                </NavLink>
                <NavLink
                  to="/groups"
                  className={({ isActive }) =>
                    `${linkClasses} ${isActive ? activeClasses : inactiveClasses}`
                  }
                >
                  Groups
                </NavLink>
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `${linkClasses} ${isActive ? activeClasses : inactiveClasses}`
                  }
                >
                  Profile
                </NavLink>
              </>
            )}

            <div className="flex items-center gap-4 ml-4 border-l pl-6 border-gray-200 dark:border-[#2A2E3B]">
              {!isLoggedIn ? (
                <>
                  <Link
                    to="/login"
                    className="text-blue-600 dark:text-blue-400 font-bold text-sm"
                  >
                    Login
                  </Link>
                  <LiquidMetalButton
                    onClick={() => navigate("/signup")}
                    size="sm"
                    speed={0.6}
                    repetition={4}
                    softness={0.5}
                    shiftRed={0.3}
                    shiftBlue={0.3}
                  >
                    Get Started
                  </LiquidMetalButton>
                </>
              ) : (
                <button
                  onClick={logout}
                  className="text-red-500 font-bold text-sm hover:underline"
                >
                  Logout
                </button>
              )}
              <DarkMode />
            </div>
          </div>

          <div className="flex items-center gap-4 md:hidden">
            <DarkMode />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? (
                <X className="w-7 h-7" />
              ) : (
                <Menu className="w-7 h-7" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-[#0D0F16] shadow-lg border-b flex flex-col gap-4 px-6 py-8 z-40">
          {!isLoggedIn && isLanding ? (
            <>
              {["#features", "#how-it-works", "#Overview", "#our-audience"].map(
                (hash) => (
                  <a
                    key={hash}
                    href={hash}
                    onClick={closeMobile}
                    className={`text-lg font-semibold ${isActiveSection(hash) ? "text-blue-600" : "text-gray-800 dark:text-[#F1F5F9]"}`}
                  >
                    {hash.replace("#", "").toUpperCase()}
                  </a>
                ),
              )}
            </>
          ) : (
            isLoggedIn &&
            ["/home", "/meetings", "/groups", "/profile"].map((path) => (
              <NavLink
                key={path}
                to={path}
                onClick={closeMobile}
                className={({ isActive }) =>
                  `text-lg font-semibold ${isActive ? "text-blue-600" : "text-gray-800 dark:text-[#F1F5F9]"}`
                }
              >
                {path.replace("/", "").toUpperCase()}
              </NavLink>
            ))
          )}
          {isLoggedIn && (
            <button
              onClick={logout}
              className="text-left text-red-500 font-bold text-lg"
            >
              LOGOUT
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
