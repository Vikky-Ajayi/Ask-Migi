import { useLocation } from "wouter";
import { X, ChevronDown, LogOut, Phone } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { CallExpertModal } from "./CallExpertModal";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
  onAuthAction?: (action: "login" | "register") => void;
}

export const Sidebar = ({ open, onClose, isLoggedIn = false, onAuthAction }: SidebarProps) => {
  const [, navigate] = useLocation();
  const [helpOpen, setHelpOpen] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const { logout } = useAuth();

  const go = (path: string) => { navigate(path); onClose(); };

  const handleLogout = () => { logout(); onClose(); navigate("/"); };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} data-testid="sidebar-backdrop" />
      <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-th-sidebar flex flex-col p-6 gap-1 overflow-y-auto border-r border-th-border-md">
        <div className="flex items-center justify-between mb-6">
          <img className="h-7 w-[110px] logo-adaptive" alt="Ask MiGi" src="/figmaAssets/vector.svg" />
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-th-hover text-th-text transition-colors" data-testid="button-close-sidebar">
            <X size={18} />
          </button>
        </div>

        {!isLoggedIn && (
          <div className="flex gap-2 mb-4">
            <button onClick={() => { onAuthAction?.("login"); onClose(); }}
              className="flex-1 h-9 rounded-[48px] bg-th-card border border-th-border-md text-th-text text-sm font-medium hover:bg-th-card-hover transition-colors"
              data-testid="sidebar-button-login">
              Log in
            </button>
            <button onClick={() => { onAuthAction?.("register"); onClose(); }}
              className="flex-1 h-9 rounded-[48px] text-sm font-medium transition-colors bg-[#0f0f11] text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              data-testid="sidebar-button-register">
              Sign Up
            </button>
          </div>
        )}

        <NavItem label="Home" onClick={() => go("/")} />
        <NavItem label="Previous Enquiries" onClick={() => go("/enquiries")} />
        <NavItem label="Buy Coins" onClick={() => go("/buy-coins")} />
        <NavItem label="About" onClick={() => go("/about")} />
        <button onClick={() => setCallModalOpen(true)}
          className="w-full text-left py-3 px-2 text-th-text-80 hover:text-th-text font-medium rounded-lg hover:bg-th-hover transition-colors text-sm flex items-center gap-2"
          data-testid="sidebar-call-expert">
          <Phone size={15} className="text-th-text-50" />
          Call an Expert
        </button>

        <div>
          <button onClick={() => setHelpOpen((v) => !v)}
            className="w-full flex items-center justify-between py-3 px-2 text-th-text-80 hover:text-th-text text-sm font-medium transition-colors"
            data-testid="sidebar-help">
            Help
            <ChevronDown size={16} className={`transition-transform ${helpOpen ? "rotate-180" : ""}`} />
          </button>
          {helpOpen && (
            <div className="ml-4 flex flex-col gap-0.5 border-l border-th-border-md pl-3">
              <SubNavItem label="FAQ" onClick={() => go("/faq")} />
              <SubNavItem label="Contact Us" onClick={() => go("/contact")} />
            </div>
          )}
        </div>

        <div className="mt-auto pt-6 flex flex-col gap-1 border-t border-th-border-md">
          <NavItem label="Disclaimer" onClick={() => go("/disclaimer")} small />
          <NavItem label="Privacy Policy" onClick={() => go("/privacy-policy")} small />
          <NavItem label="Refund Policy" onClick={() => go("/refund-policy")} small />
          {isLoggedIn && (
            <button onClick={handleLogout}
              className="w-full text-left py-3 px-2 text-red-500/80 hover:text-red-500 text-xs font-medium rounded-lg hover:bg-th-hover transition-colors flex items-center gap-2"
              data-testid="sidebar-button-logout">
              <LogOut size={13} />
              Log out
            </button>
          )}
        </div>
      </aside>
      {callModalOpen && <CallExpertModal onClose={() => setCallModalOpen(false)} />}
    </>
  );
};

const NavItem = ({ label, onClick, small }: { label: string; onClick: () => void; small?: boolean }) => (
  <button onClick={onClick}
    className={`w-full text-left py-3 px-2 text-th-text-80 hover:text-th-text font-medium rounded-lg hover:bg-th-hover transition-colors ${small ? "text-xs" : "text-sm"}`}>
    {label}
  </button>
);

const SubNavItem = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button onClick={onClick}
    className="w-full text-left py-2 px-2 text-th-text-60 hover:text-th-text text-sm rounded-lg hover:bg-th-hover transition-colors">
    {label}
  </button>
);
