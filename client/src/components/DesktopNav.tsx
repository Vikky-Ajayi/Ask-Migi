import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { ChevronDown, CircleUser, User, Settings, LogOut, Phone, Sun, Moon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import coinImg from "@assets/coins_1781943901685.png";
import { CallExpertModal } from "./CallExpertModal";

interface DesktopNavProps {
  onLoginClick?: () => void;
  onSignUpClick?: () => void;
  onSettingsClick?: () => void;
}

export const DesktopNav = ({ onLoginClick, onSignUpClick, onSettingsClick }: DesktopNavProps) => {
  const { user, isLoggedIn, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, navigate] = useLocation();
  const [helpOpen, setHelpOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) setHelpOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate("/");
  };

  return (
    <>
    <nav className="w-full flex items-center justify-between px-8 py-4 bg-th-nav border-b border-th-border">
      <button onClick={() => navigate("/")} className="focus:outline-none" data-testid="nav-logo">
        <img className="h-7 logo-adaptive" alt="Ask MiGi" src="/figmaAssets/vector.svg" />
      </button>

      <div className="flex items-center gap-5">
        <button onClick={() => navigate("/about")} className="text-sm text-th-text-80 hover:text-th-text transition-colors" data-testid="nav-about">
          About
        </button>
        <button onClick={() => navigate("/buy-coins")} className="text-sm text-th-text-80 hover:text-th-text transition-colors" data-testid="nav-buy-coins">
          Buy Coins
        </button>
        <button onClick={() => setCallModalOpen(true)} className="flex items-center gap-1.5 text-sm text-th-text-80 hover:text-th-text transition-colors" data-testid="nav-call-expert">
          <Phone size={14} />
          Call an Expert
        </button>

        {/* Help dropdown */}
        <div className="relative" ref={helpRef}>
          <button onClick={() => setHelpOpen((v) => !v)} className="flex items-center gap-1 text-sm text-th-text-80 hover:text-th-text transition-colors" data-testid="nav-help">
            Help <ChevronDown size={14} className={`transition-transform ${helpOpen ? "rotate-180" : ""}`} />
          </button>
          {helpOpen && (
            <div className="absolute top-full left-0 mt-2 w-36 bg-th-card rounded-xl border border-th-border-md shadow-xl z-50 py-1 overflow-hidden">
              {([["FAQ", "/faq"], ["Contact Us", "/contact"]] as const).map(([label, path]) => (
                <button key={label} onClick={() => { navigate(path); setHelpOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-th-text-80 hover:text-th-text hover:bg-th-hover transition-colors">
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="h-8 w-8 flex items-center justify-center rounded-full border border-th-border-md text-th-text-60 hover:text-th-text hover:bg-th-hover transition-colors"
          aria-label="Toggle theme"
          data-testid="button-theme-toggle"
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Auth / profile */}
        {isLoggedIn && user ? (
          <>
            <button onClick={() => navigate("/buy-coins")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-th-card border border-th-border-md text-sm text-th-text-80 hover:bg-th-card-hover transition-colors"
              data-testid="nav-coins">
              <img src={coinImg} alt="coins" className="w-[18px] h-[18px] object-contain" style={{ imageRendering: "auto" }} />
              <span className="font-medium">{user.coins} Coins</span>
            </button>
            <div className="relative" ref={profileRef}>
              <button onClick={() => setProfileOpen((v) => !v)}
                className="h-9 w-9 rounded-full bg-th-card border border-th-border-strong flex items-center justify-center hover:bg-th-card-hover transition-colors"
                data-testid="nav-avatar" title={`${user.firstName} ${user.lastName}`}>
                <User size={16} className="text-th-text-70" />
              </button>
              {profileOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-th-card rounded-xl border border-th-border-md shadow-xl z-50 py-1 overflow-hidden">
                  <button onClick={() => { onSettingsClick?.(); setProfileOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-th-text-80 hover:text-th-text hover:bg-th-hover flex items-center gap-2.5 transition-colors"
                    data-testid="nav-settings">
                    <Settings size={14} className="text-th-text-50" /> Settings
                  </button>
                  <button onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-th-text-80 hover:text-th-text hover:bg-th-hover flex items-center gap-2.5 transition-colors"
                    data-testid="nav-logout">
                    <LogOut size={14} className="text-th-text-50" /> Log out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={onSignUpClick}
              className="flex items-center gap-2 h-9 px-4 rounded-full text-sm font-medium transition-colors bg-[#0f0f11] text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              data-testid="nav-signup">
              <CircleUser size={18} /> Sign Up
            </button>
            <button onClick={onLoginClick}
              className="flex items-center h-9 px-4 rounded-full border border-th-border-strong text-sm text-th-text font-medium hover:bg-th-hover transition-colors"
              data-testid="nav-login">
              Log In
            </button>
          </div>
        )}
      </div>
    </nav>
    {callModalOpen && <CallExpertModal onClose={() => setCallModalOpen(false)} />}
    </>
  );
};
