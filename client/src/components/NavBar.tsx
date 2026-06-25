import { useState } from "react";
import { useLocation } from "wouter";
import { Menu, CircleUser, Sun, Moon } from "lucide-react";
import { DesktopNav } from "./DesktopNav";
import { Sidebar } from "./Sidebar";
import { SettingsModal } from "./SettingsModal";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

interface NavBarProps {
  onLoginClick?: () => void;
  onSignUpClick?: () => void;
  onMenuClick?: () => void;
}

export const NavBar = ({ onLoginClick, onSignUpClick, onMenuClick }: NavBarProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { isLoggedIn } = useAuth();
  const { theme, toggleTheme } = useTheme();
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

      <header className="md:hidden w-full flex items-center justify-between px-4 py-3 bg-th-nav border-b border-th-border sticky top-0 z-30">
        <button
          onClick={onMenuClick ?? (() => setSidebarOpen(true))}
          className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-th-hover transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} className="text-th-text" />
        </button>

        <button onClick={() => navigate("/")} className="focus:outline-none">
          <img className="h-6 logo-adaptive" alt="Ask MiGi" src="/figmaAssets/vector.svg" />
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className="h-8 w-8 flex items-center justify-center rounded-full border border-th-border-md text-th-text-60 hover:text-th-text hover:bg-th-hover transition-colors"
            aria-label="Toggle theme"
            data-testid="button-theme-toggle-mobile"
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {isLoggedIn ? (
            <button
              onClick={() => setSettingsOpen(true)}
              className="h-9 w-9 flex items-center justify-center rounded-full border border-th-border-strong hover:bg-th-hover transition-colors"
            >
              <CircleUser size={18} className="text-th-text-70" />
            </button>
          ) : (
            <button
              onClick={onSignUpClick}
              className="flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold transition-colors bg-[#0f0f11] text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              <CircleUser size={13} />
              Sign Up
            </button>
          )}
        </div>
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
