import { useState, useRef } from "react";
import { Eye, EyeOff, Lock, Camera } from "lucide-react";
import coinImg from "@assets/coins_1781943901685.png";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type SettingsTab = "profile" | "change-password";

const PasswordInput = ({ placeholder, value, onChange, show, onToggle, testId }: {
  placeholder: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; testId?: string;
}) => (
  <div className="relative">
    <input
      type={show ? "text" : "password"}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-12 rounded-xl bg-[var(--th-input)] px-4 pr-12 text-sm text-[var(--th-text)] placeholder:text-[var(--th-text-40)] border border-[var(--th-border)] focus:border-[var(--th-border-strong)] focus:outline-none"
      data-testid={testId}
    />
    <button type="button" onClick={onToggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--th-text-40)] hover:text-[var(--th-text-70)] transition-colors">
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  </div>
);

export const SettingsPage = (): JSX.Element => {
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [picLoading, setPicLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, isLoggedIn, isLoading: authLoading, refreshUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isLoggedIn) navigate("/");
  }, [authLoading, isLoggedIn, navigate]);

  if (authLoading || (!authLoading && !isLoggedIn)) return <></>;

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please choose an image under 5MB.", variant: "destructive" });
      return;
    }
    setPicLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const imageData = reader.result as string;
        await apiRequest("POST", "/api/auth/profile-pic", { imageData });
        await refreshUser();
        toast({ title: "Photo updated", description: "Your profile picture has been saved." });
        setPicLoading(false);
      };
      reader.onerror = () => {
        toast({ title: "Upload failed", description: "Could not read the file.", variant: "destructive" });
        setPicLoading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast({ title: "Upload failed", description: "Could not save your photo.", variant: "destructive" });
      setPicLoading(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (!currentPw || !newPw || !confirmPw) { setPwError("Please fill in all fields."); return; }
    if (newPw !== confirmPw) { setPwError("New passwords don't match."); return; }
    if (newPw.length < 6) { setPwError("New password must be at least 6 characters."); return; }
    setPwLoading(true);
    try {
      await apiRequest("PATCH", "/api/auth/change-password", { currentPassword: currentPw, newPassword: newPw });
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err: any) {
      setPwError(err.message?.replace(/^4\d\d: /, "") || "Failed to update password.");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto px-4 py-8 md:py-10">
        <h1 className="text-2xl font-bold text-[var(--th-text)] mb-6">Settings</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-[var(--th-card)] rounded-xl border border-[var(--th-border)]">
          <button
            onClick={() => setTab("profile")}
            className={`flex items-center gap-2 flex-1 h-9 rounded-lg text-sm font-medium transition-colors justify-center ${
              tab === "profile"
                ? "bg-[#0f0f11] text-white dark:bg-white dark:text-black shadow-sm"
                : "text-[var(--th-text-50)] hover:text-[var(--th-text)]"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setTab("change-password")}
            className={`flex items-center gap-2 flex-1 h-9 rounded-lg text-sm font-medium transition-colors justify-center ${
              tab === "change-password"
                ? "bg-[#0f0f11] text-white dark:bg-white dark:text-black shadow-sm"
                : "text-[var(--th-text-50)] hover:text-[var(--th-text)]"
            }`}
          >
            <Lock size={13} />
            Password
          </button>
        </div>

        {/* Profile Tab */}
        {tab === "profile" && user && (
          <div className="flex flex-col gap-5">
            {/* Avatar upload */}
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-full overflow-hidden bg-[var(--th-card)] border-2 border-[var(--th-border)] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {user.profilePic ? (
                    <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-[var(--th-text-50)]">
                      {user.firstName?.[0]?.toUpperCase()}
                    </span>
                  )}
                  {picLoading && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#0f0f11] dark:bg-white flex items-center justify-center shadow-md border-2 border-[var(--th-page)] hover:scale-110 transition-transform"
                  disabled={picLoading}
                >
                  <Camera size={12} className="text-white dark:text-black" />
                </button>
              </div>
              <p className="text-xs text-[var(--th-text-40)]">Click to upload a photo (max 5MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePicChange}
              />
            </div>

            {/* Info fields */}
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--th-text-40)]">First Name</label>
                  <div className="h-11 rounded-xl bg-[var(--th-card)] px-4 flex items-center text-sm text-[var(--th-text-70)] border border-[var(--th-border)]">
                    {user.firstName}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--th-text-40)]">Last Name</label>
                  <div className="h-11 rounded-xl bg-[var(--th-card)] px-4 flex items-center text-sm text-[var(--th-text-70)] border border-[var(--th-border)]">
                    {user.lastName}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--th-text-40)]">Email Address</label>
                <div className="h-11 rounded-xl bg-[var(--th-card)] px-4 flex items-center text-sm text-[var(--th-text-70)] border border-[var(--th-border)]">
                  {user.email}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--th-text-40)]">Coin Balance</label>
                <div className="h-11 rounded-xl bg-[var(--th-card)] px-4 flex items-center gap-2 text-sm text-[var(--th-text-70)] border border-[var(--th-border)]">
                  <img src={coinImg} alt="coins" className="w-[17px] h-[17px] object-contain" />
                  {user.unlimitedCoins ? "∞ Unlimited" : `${user.coins} Coins`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Tab */}
        {tab === "change-password" && (
          <form className="flex flex-col gap-3" onSubmit={handleSavePassword}>
            <PasswordInput placeholder="Current Password" value={currentPw} onChange={setCurrentPw} show={showCurrent} onToggle={() => setShowCurrent((v) => !v)} testId="input-current-password" />
            <PasswordInput placeholder="New Password" value={newPw} onChange={setNewPw} show={showNew} onToggle={() => setShowNew((v) => !v)} testId="input-new-password" />
            <PasswordInput placeholder="Confirm New Password" value={confirmPw} onChange={setConfirmPw} show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} testId="input-confirm-password" />
            {pwError && <p className="text-sm text-red-400">{pwError}</p>}
            <button
              type="submit"
              disabled={pwLoading}
              className="mt-2 w-full h-12 rounded-full bg-[#0f0f11] text-white font-semibold text-sm hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 transition-colors disabled:opacity-60"
              data-testid="button-save-password"
            >
              {pwLoading ? "Saving…" : "Save Changes"}
            </button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
};
