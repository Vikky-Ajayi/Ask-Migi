import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { ChevronDown, User, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface DesktopNavProps {
  onLoginClick?: () => void;
  onSignUpClick?: () => void;
}

export const DesktopNav = ({ onLoginClick, onSignUpClick }: DesktopNavProps) => {
  const { user, isLoggedIn, logout } = useAuth();
  const [, navigate] = useLocation();
  const [expertOpen, setExpertOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const expertRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (expertRef.current && !expertRef.current.contains(e.target as Node)) setExpertOpen(false);
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
    <nav className="w-full flex items-center justify-between px-8 py-4 bg-[#161618] border-b border-white/5">
      {/* Logo */}
      <button onClick={() => navigate("/")} className="focus:outline-none" data-testid="nav-logo">
        <img className="h-7" alt="Ask MiGi" src="/figmaAssets/vector.svg" />
      </button>

      {/* Center links */}
      <div className="flex items-center gap-6">
        {/* Become an Expert */}
        <div className="relative" ref={expertRef}>
          <button
            onClick={() => setExpertOpen((v) => !v)}
            className="flex items-center gap-1 text-sm text-white/80 hover:text-white transition-colors"
            data-testid="nav-become-expert"
          >
            Become an Expert <ChevronDown size={14} className={`transition-transform ${expertOpen ? "rotate-180" : ""}`} />
          </button>
          {expertOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-[#242628] rounded-xl border border-white/10 shadow-xl z-50 py-1 overflow-hidden">
              {["Travel Agents", "Immigration Experts", "Tour Guides"].map((item) => (
                <button
                  key={item}
                  onClick={() => { navigate("/become-an-expert"); setExpertOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/5"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buy Coins */}
        <button
          onClick={() => navigate("/buy-coins")}
          className="text-sm text-white/80 hover:text-white transition-colors"
          data-testid="nav-buy-coins"
        >
          Buy Coins
        </button>

        {/* Help */}
        <div className="relative" ref={helpRef}>
          <button
            onClick={() => setHelpOpen((v) => !v)}
            className="flex items-center gap-1 text-sm text-white/80 hover:text-white transition-colors"
            data-testid="nav-help"
          >
            Help <ChevronDown size={14} className={`transition-transform ${helpOpen ? "rotate-180" : ""}`} />
          </button>
          {helpOpen && (
            <div className="absolute top-full left-0 mt-2 w-36 bg-[#242628] rounded-xl border border-white/10 shadow-xl z-50 py-1 overflow-hidden">
              {([["FAQ", "/faq"], ["Contact Us", "/contact"]] as const).map(([label, path]) => (
                <button
                  key={label}
                  onClick={() => { navigate(path); setHelpOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/5"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {isLoggedIn && user ? (
          <>
            {/* Coin balance */}
            <button
              onClick={() => navigate("/buy-coins")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#242628] border border-white/10 text-sm text-white/90 hover:bg-[#2a2c2e]"
              data-testid="nav-coins"
            >
              <span>🪙</span>
              <span className="font-medium">{user.coins} Coins</span>
            </button>
            {/* Avatar */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="h-9 w-9 rounded-full bg-[#242628] border border-white/20 flex items-center justify-center hover:bg-[#2a2c2e] transition-colors"
                data-testid="nav-avatar"
                title={`${user.firstName} ${user.lastName}`}
              >
                <User size={16} className="text-white/70" />
              </button>
              {profileOpen && (
                <div className="absolute top-full right-0 mt-2 w-36 bg-[#242628] rounded-xl border border-white/10 shadow-xl z-50 py-1 overflow-hidden">
                  <button
                    onClick={() => { navigate("/settings"); setProfileOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/5 flex items-center gap-2.5"
                    data-testid="nav-settings"
                  >
                    <Settings size={14} className="text-white/50" />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/5 flex items-center gap-2.5"
                    data-testid="nav-logout"
                  >
                    <LogOut size={14} className="text-white/50" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={onSignUpClick}
              className="flex items-center gap-2 h-9 px-4 rounded-full bg-white/10 border border-white/20 text-sm text-white font-medium hover:bg-white/20 transition-colors"
              data-testid="nav-signup"
            >
              <User size={14} />
              Sign Up
            </button>
            <button
              onClick={onLoginClick}
              className="text-sm text-white/70 hover:text-white transition-colors"
              data-testid="nav-login"
            >
              Log In
            </button>
          </>
        )}
      </div>
    </nav>
  );
};
