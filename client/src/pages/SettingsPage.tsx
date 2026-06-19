import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { DesktopNav } from "@/components/DesktopNav";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const PasswordInput = ({
  placeholder,
  value,
  onChange,
  show,
  onToggle,
  testId,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  testId?: string;
}) => (
  <div className="relative">
    <input
      type={show ? "text" : "password"}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-14 rounded-2xl bg-[#242628] px-4 pr-12 text-sm text-white placeholder:text-white/40 border border-transparent focus:border-white/20 focus:outline-none"
      data-testid={testId}
    />
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
    >
      {show ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  </div>
);

export const SettingsPage = (): JSX.Element => {
  const [authView, setAuthView] = useState<AuthView>(null);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate("/");
    }
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
      await apiRequest("PATCH", "/api/auth/change-password", {
        currentPassword: currentPw,
        newPassword: newPw,
      });
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (e: any) {
      setError(e.message?.replace(/^4\d\d: /, "") || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#161618] text-white flex flex-col">
      <DesktopNav
        onLoginClick={() => setAuthView("login")}
        onSignUpClick={() => setAuthView("register")}
      />

      <div className="flex flex-col items-center px-6 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-white tracking-tight mb-8">Change Password</h1>

          <form className="flex flex-col gap-3" onSubmit={handleSave}>
            <PasswordInput
              placeholder="Current Password"
              value={currentPw}
              onChange={setCurrentPw}
              show={showCurrent}
              onToggle={() => setShowCurrent((v) => !v)}
              testId="input-current-password"
            />
            <PasswordInput
              placeholder="New Password"
              value={newPw}
              onChange={setNewPw}
              show={showNew}
              onToggle={() => setShowNew((v) => !v)}
              testId="input-new-password"
            />
            <PasswordInput
              placeholder="Confirm New Password"
              value={confirmPw}
              onChange={setConfirmPw}
              show={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
              testId="input-confirm-password"
            />

            {error && (
              <div className="rounded-2xl bg-red-900/30 border border-red-500/30 px-4 py-3 text-sm text-red-400 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-full bg-white text-black font-semibold text-base hover:bg-white/90 transition-colors mt-4 disabled:opacity-60"
              data-testid="button-save-password"
            >
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </div>
      </div>

      <AuthSheets view={authView} onViewChange={setAuthView} onClose={() => setAuthView(null)} />
    </main>
  );
};
