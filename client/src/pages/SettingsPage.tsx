import { useState, useEffect } from "react";
import { Eye, EyeOff, X, User, Lock } from "lucide-react";
import coinImg from "@assets/coins_1781943901685.png";
import { NavBar } from "@/components/NavBar";
import { ChatSidebar, type SidebarEnquiry } from "@/components/ChatSidebar";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
      className="w-full h-12 rounded-xl bg-th-card px-4 pr-12 text-sm text-th-text placeholder:text-th-text-40 border border-transparent focus:border-th-border-strong focus:outline-none"
      data-testid={testId}
    />
    <button type="button" onClick={onToggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-th-text-40 hover:text-th-text-70 transition-colors">
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  </div>
);

export const SettingsPage = (): JSX.Element => {
  const [authView, setAuthView] = useState<AuthView>(null);
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: enquiries = [] } = useQuery<any[]>({
    queryKey: ["/api/enquiries"],
    enabled: isLoggedIn,
  });

  useEffect(() => {
    if (!authLoading && !isLoggedIn) navigate("/");
  }, [authLoading, isLoggedIn, navigate]);

  if (!authLoading && !isLoggedIn) return <></>;

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

  const sidebarItems: SidebarEnquiry[] = enquiries.map((e: any) => ({
    id: e.id, question: e.question, status: e.status,
  }));

  return (
    <main className="min-h-screen w-full bg-th-page text-th-text flex flex-col">
      <NavBar onLoginClick={() => setAuthView("login")} onSignUpClick={() => setAuthView("register")} />

      <div className="flex flex-1">
        <div className="w-52 shrink-0 border-r border-white/5 overflow-y-auto px-3 py-3 hidden md:block">
          <ChatSidebar
            enquiries={sidebarItems}
            activeId=""
            onSelect={(id) => navigate(`/chat?id=${id}`)}
            onNewQuestion={() => navigate("/")}
          />
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-8 md:py-12">
          <div className="w-full max-w-sm bg-th-sidebar rounded-3xl border border-th-border-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="text-xl font-semibold text-th-text">Settings</h2>
              <button
                onClick={() => navigate(-1 as any)}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-th-close text-th-text-60 hover:text-th-text transition-colors"
                data-testid="button-close-settings"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex gap-2 px-6 pb-4">
              <button
                onClick={() => setTab("profile")}
                className={`flex items-center gap-2 flex-1 h-10 rounded-xl text-sm font-medium transition-colors justify-center ${tab === "profile" ? "bg-[#2a2c2e] text-th-text border border-th-border-md" : "text-th-text-50 hover:text-th-text"}`}
                data-testid="settings-tab-profile"
              >
                <User size={14} />Profile
              </button>
              <button
                onClick={() => setTab("change-password")}
                className={`flex items-center gap-2 flex-1 h-10 rounded-xl text-sm font-medium transition-colors justify-center ${tab === "change-password" ? "bg-[#2a2c2e] text-th-text border border-th-border-md" : "text-th-text-50 hover:text-th-text"}`}
                data-testid="settings-tab-password"
              >
                <Lock size={14} />Change Password
              </button>
            </div>

            <div className="px-6 pb-6">
              {tab === "profile" && user && (
                <div className="flex flex-col gap-4">
                  {[["First Name", user.firstName], ["Last Name", user.lastName], ["Email", user.email]].map(([label, val]) => (
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
              )}

              {tab === "change-password" && (
                <form className="flex flex-col gap-3" onSubmit={handleSave}>
                  <PasswordInput placeholder="Current Password" value={currentPw} onChange={setCurrentPw} show={showCurrent} onToggle={() => setShowCurrent((v) => !v)} testId="input-current-password" />
                  <PasswordInput placeholder="New Password" value={newPw} onChange={setNewPw} show={showNew} onToggle={() => setShowNew((v) => !v)} testId="input-new-password" />
                  <PasswordInput placeholder="Confirm New Password" value={confirmPw} onChange={setConfirmPw} show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} testId="input-confirm-password" />
                  {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                  <button type="submit" disabled={loading} className="w-full h-12 rounded-full bg-[#0f0f11] text-white font-semibold text-sm hover:bg-black/90 transition-colors mt-2 disabled:opacity-60" data-testid="button-save-password">
                    {loading ? "Saving…" : "Save Changes"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <AuthSheets view={authView} onViewChange={setAuthView} onClose={() => setAuthView(null)} />
    </main>
  );
};
