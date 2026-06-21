import { useState } from "react";
import { useLocation } from "wouter";
import { Menu, CircleUser } from "lucide-react";
import { DesktopNav } from "./DesktopNav";
import { Sidebar } from "./Sidebar";
import { SettingsModal } from "./SettingsModal";
import { useAuth } from "@/context/AuthContext";

interface NavBarProps {
  onLoginClick?: () => void;
  onSignUpClick?: () => void;
  onMenuClick?: () => void;
}

export const NavBar = ({ onLoginClick, onSignUpClick, onMenuClick }: NavBarProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { isLoggedIn } = useAuth();
  const [, navigate] = useLocation();

  return (
    <>
      <div className="hidden md:block">
        <DesktopNav
          onLoginClick={onLoginClick}
          onSignUpClick={onSignUpClick}
          onSettingsClick={() => setSettingsOpen(true)}
        />
      </div>

      <header className="md:hidden w-full flex items-center justify-between px-4 py-3 bg-[#161618] border-b border-white/5 sticky top-0 z-30">
        <button
          onClick={onMenuClick ?? (() => setSidebarOpen(true))}
          className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} className="text-white" />
        </button>

        <button onClick={() => navigate("/")} className="focus:outline-none">
          <img className="h-6" alt="Ask MiGi" src="/figmaAssets/vector.svg" />
        </button>

        {isLoggedIn ? (
          <button
            onClick={() => setSettingsOpen(true)}
            className="h-9 w-9 flex items-center justify-center rounded-full border border-white/20 hover:bg-white/10 transition-colors"
          >
            <CircleUser size={18} className="text-white/70" />
          </button>
        ) : (
          <button
            onClick={onSignUpClick}
            className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors"
          >
            <CircleUser size={13} className="text-black" />
            Sign Up
          </button>
        )}
      </header>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isLoggedIn={isLoggedIn}
        onAuthAction={(action) => {
          setSidebarOpen(false);
          if (action === "login") onLoginClick?.();
          else onSignUpClick?.();
        }}
      />

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
};
