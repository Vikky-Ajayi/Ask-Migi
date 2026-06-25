import { useState, useEffect, useCallback } from "react";
import { X, Eye, EyeOff, User, Lock } from "lucide-react";
import coinImg from "@assets/coins_1781943901685.png";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type SettingsTab = "profile" | "change-password";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const PasswordInput = ({
  placeholder, value, onChange, show, onToggle, testId,
}: {
  placeholder: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; testId?: string;
}) => (
  <div className="relative">
    <input
      type={show ? "text" : "password"}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-12 rounded-xl bg-th-card px-4 pr-12 text-sm text-th-text placeholder:text-th-text-40 border border-transparent focus:border-th-border-strong focus:outline-none"
      data-testid={testId}
    />
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-th-text-40 hover:text-th-text-70 transition-colors"
    >
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  </div>
);

export const SettingsModal = ({ open, onClose }: SettingsModalProps) => {
  const [rendered, setRendered] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  /* Open: mount, then slide in on next frame */
  useEffect(() => {
    if (open) {
      setRendered(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setSheetVisible(true));
      });
    } else {
      setSheetVisible(false);
      const t = setTimeout(() => setRendered(false), 320);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleClose = useCallback(() => {
    setSheetVisible(false);
    setTimeout(onClose, 320);
  }, [onClose]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!currentPw || !newPw || !confirmPw) { setError("Please fill in all fields."); return; }
    if (newPw !== confirmPw) { setError("New passwords don't match."); return; }
    if (newPw.length < 6) { setError("New password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      await apiRequest("PATCH", "/api/auth/change-password", { currentPassword: currentPw, newPassword: newPw });
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (e: any) {
      setError(e.message?.replace(/^4\d\d: /, "") || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  if (!rendered) return null;

  const tabs = (
    <div className="flex gap-2 pb-4">
      <button
        onClick={() => setTab("profile")}
        className={`flex items-center gap-2 flex-1 h-10 rounded-xl text-sm font-medium transition-colors justify-center ${tab === "profile" ? "bg-th-card-hover text-th-text border border-th-border-md" : "text-th-text-50 hover:text-th-text"}`}
        data-testid="settings-tab-profile"
      >
        <User size={14} /> Profile
      </button>
      <button
        onClick={() => setTab("change-password")}
        className={`flex items-center gap-2 flex-1 h-10 rounded-xl text-sm font-medium transition-colors justify-center ${tab === "change-password" ? "bg-th-card-hover text-th-text border border-th-border-md" : "text-th-text-50 hover:text-th-text"}`}
        data-testid="settings-tab-password"
      >
        <Lock size={14} /> Change Password
      </button>
    </div>
  );

  const profileContent = user && (
    <div className="flex flex-col gap-4">
      {([["First Name", user.firstName], ["Last Name", user.lastName], ["Email", user.email]] as const).map(([label, val]) => (
        <div key={label} className="flex flex-col gap-1">
          <label className="text-xs text-th-text-40">{label}</label>
          <div className="h-12 rounded-xl bg-th-card px-4 flex items-center text-sm text-th-text-70">{val}</div>
        </div>
      ))}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-th-text-40">Coin Balance</label>
        <div className="h-12 rounded-xl bg-th-card px-4 flex items-center gap-2 text-sm text-th-text-70">
          <img src={coinImg} alt="coins" className="w-[18px] h-[18px] object-contain" style={{ imageRendering: "auto" }} />
          {user.coins} Coins
        </div>
      </div>
    </div>
  );

  const passwordForm = (
    <form className="flex flex-col gap-3" onSubmit={handleSave}>
      <PasswordInput placeholder="Current Password" value={currentPw} onChange={setCurrentPw} show={showCurrent} onToggle={() => setShowCurrent((v) => !v)} testId="input-current-password" />
      <PasswordInput placeholder="New Password" value={newPw} onChange={setNewPw} show={showNew} onToggle={() => setShowNew((v) => !v)} testId="input-new-password" />
      <PasswordInput placeholder="Confirm New Password" value={confirmPw} onChange={setConfirmPw} show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} testId="input-confirm-password" />
      {error && <p className="text-sm text-red-400 text-center">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 rounded-full bg-[#0f0f11] text-white font-semibold text-sm hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 transition-colors disabled:opacity-60"
        data-testid="button-save-password"
      >
        {loading ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: sheetVisible ? 1 : 0 }}
        onClick={handleClose}
        data-testid="settings-backdrop"
      />

      {/* ── Mobile: bottom sheet with slide-up animation ── */}
      <div
        className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-th-sidebar rounded-t-2xl flex flex-col overflow-hidden"
        style={{
          top: 60,
          transform: sheetVisible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <h2 className="text-2xl font-bold text-th-text tracking-tight">Settings</h2>
          <button
            onClick={handleClose}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-th-close text-th-text-60 hover:text-th-text transition-colors"
            data-testid="button-close-settings"
          >
            <X size={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5">
          {tabs}
          {tab === "profile" && profileContent}
          {tab === "change-password" && passwordForm}
        </div>
      </div>

      {/* ── Desktop: centered card with fade-in ── */}
      <div
        className="fixed inset-0 z-50 hidden md:flex items-center justify-center p-4"
        style={{ opacity: sheetVisible ? 1 : 0, transition: "opacity 0.25s" }}
      >
        <div
          className="w-full max-w-sm bg-th-sidebar rounded-3xl border border-th-border-md shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <h2 className="text-xl font-semibold text-th-text">Settings</h2>
            <button
              onClick={handleClose}
              className="h-8 w-8 flex items-center justify-center rounded-full bg-th-close text-th-text-60 hover:text-th-text transition-colors"
              data-testid="button-close-settings"
            >
              <X size={15} />
            </button>
          </div>
          <div className="px-6 pb-6">
            {tabs}
            {tab === "profile" && profileContent}
            {tab === "change-password" && passwordForm}
          </div>
        </div>
      </div>
    </>
  );
};
