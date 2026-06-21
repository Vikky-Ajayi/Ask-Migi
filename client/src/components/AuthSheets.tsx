import { useState, useEffect, useCallback } from "react";
import { X, Mail, Eye, EyeOff, CircleCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type AuthView = "login" | "register" | "forgot" | "otp" | "new-password" | "success" | null;

interface AuthSheetsProps {
  view: AuthView;
  onViewChange: (view: AuthView) => void;
  onClose: () => void;
}

export const AuthSheets = ({ view, onViewChange, onClose }: AuthSheetsProps) => {
  const [rendered, setRendered] = useState<AuthView>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  /* Open: set rendered view, then on next frame slide in */
  useEffect(() => {
    if (view) {
      setRendered(view);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setSheetVisible(true));
      });
    } else {
      /* Close: slide out, then unrender after transition */
      setSheetVisible(false);
      const t = setTimeout(() => setRendered(null), 320);
      return () => clearTimeout(t);
    }
  }, [view]);

  /* When view changes between states, keep sheet visible */
  useEffect(() => {
    if (view && rendered && view !== rendered) {
      setRendered(view);
    }
  }, [view, rendered]);

  const handleClose = useCallback(() => {
    setSheetVisible(false);
    setTimeout(onClose, 320);
  }, [onClose]);

  if (!rendered) return null;

  return (
    <>
      {/* Backdrop — fades with opacity transition */}
      <div
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: sheetVisible ? 1 : 0 }}
        onClick={handleClose}
        data-testid="auth-backdrop"
      />

      {/* Desktop: flex-centered container */}
      <div
        className="fixed inset-0 z-50 hidden md:flex items-center justify-center p-4"
        style={{ opacity: sheetVisible ? 1 : 0, transition: "opacity 0.25s" }}
      >
        {rendered === "login" && <LoginDialog onViewChange={onViewChange} onClose={handleClose} />}
        {rendered === "register" && <RegisterDialog onViewChange={onViewChange} onClose={handleClose} />}
        {rendered === "forgot" && <ForgotPasswordDialog onViewChange={onViewChange} onClose={handleClose} />}
        {rendered === "otp" && <OTPDialog onViewChange={onViewChange} onClose={handleClose} />}
        {rendered === "new-password" && <NewPasswordDialog onViewChange={onViewChange} onClose={handleClose} />}
        {rendered === "success" && <SuccessDialog onClose={handleClose} onViewChange={onViewChange} />}
      </div>

      {/* Mobile: bottom sheet with slide-up animation */}
      <div
        className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-[#1a1c1e] rounded-t-2xl flex flex-col overflow-hidden"
        style={{
          top: 60,
          transform: sheetVisible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {rendered === "login" && <LoginDialog onViewChange={onViewChange} onClose={handleClose} mobile />}
        {rendered === "register" && <RegisterDialog onViewChange={onViewChange} onClose={handleClose} mobile />}
        {rendered === "forgot" && <ForgotPasswordDialog onViewChange={onViewChange} onClose={handleClose} mobile />}
        {rendered === "otp" && <OTPDialog onViewChange={onViewChange} onClose={handleClose} mobile />}
        {rendered === "new-password" && <NewPasswordDialog onViewChange={onViewChange} onClose={handleClose} mobile />}
        {rendered === "success" && <SuccessDialog onClose={handleClose} onViewChange={onViewChange} mobile />}
      </div>
    </>
  );
};

/* ─── Shared sub-components ─────────────────────────────────────────────────── */

const AuthInput = ({
  placeholder,
  type = "text",
  value,
  onChange,
  showToggle,
  onToggle,
  testId,
}: {
  placeholder: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  showToggle?: boolean;
  onToggle?: () => void;
  testId?: string;
}) => (
  <div className="relative">
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-12 rounded-xl bg-[#242628] px-4 text-sm text-white placeholder:text-white/40 border border-transparent focus:border-white/20 focus:outline-none"
      data-testid={testId}
    />
    {showToggle && (
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
      >
        {type === "password" ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    )}
  </div>
);

const PrimaryButton = ({
  children,
  onClick,
  testId,
  loading,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  testId?: string;
  loading?: boolean;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading || disabled}
    className="w-full h-12 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    data-testid={testId}
  >
    {loading ? "Loading…" : children}
  </button>
);

/* ─── DialogWrapper ─────────────────────────────────────────────────────────── */

const DialogWrapper = ({
  children,
  footer,
  onClose,
  title,
  mobile,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
  onClose: () => void;
  title: string;
  mobile?: boolean;
}) => {
  if (mobile) {
    return (
      <div className="flex flex-col h-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-6 pb-5">
          <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-[#2e3032] text-white/60 hover:text-white transition-colors"
            data-testid="button-close-sheet"
          >
            <X size={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5">{children}</div>
        <div className="px-5 pb-10 pt-3">{footer}</div>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-sm bg-[#1a1c1e] rounded-3xl px-6 pt-6 pb-8 border border-white/10 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white tracking-tight">{title}</h2>
        <button
          onClick={onClose}
          className="h-8 w-8 flex items-center justify-center rounded-full bg-[#2e3032] text-white/60 hover:text-white transition-colors"
          data-testid="button-close-sheet"
        >
          <X size={15} />
        </button>
      </div>
      {children}
      <div className="mt-4">{footer}</div>
    </div>
  );
};

/* ─── Login ─────────────────────────────────────────────────────────────────── */
const LoginDialog = ({
  onViewChange,
  onClose,
  mobile,
}: {
  onViewChange: (v: AuthView) => void;
  onClose: () => void;
  mobile?: boolean;
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const { toast } = useToast();

  const handleLogin = async () => {
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast({ title: "Welcome back!", description: "You've been logged in successfully." });
      onClose();
    } catch (e: any) {
      setError(e.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogWrapper
      title="Log in"
      onClose={onClose}
      mobile={mobile}
      footer={
        <div className="flex flex-col gap-4">
          <PrimaryButton onClick={handleLogin} loading={loading} testId="button-login">Log in</PrimaryButton>
          <p className="text-center text-sm text-white/60">
            Don't have an account?{" "}
            <button onClick={() => onViewChange("register")} className="text-white font-semibold underline underline-offset-2" data-testid="link-create-account">
              Create Account
            </button>
          </p>
        </div>
      }
    >
      <div className="flex flex-col gap-3 mb-4">
        <AuthInput placeholder="Email" type="email" value={email} onChange={setEmail} testId="input-email" />
        <AuthInput
          placeholder="Password"
          type={showPw ? "text" : "password"}
          value={password}
          onChange={setPassword}
          showToggle
          onToggle={() => setShowPw((v) => !v)}
          testId="input-password"
        />
      </div>
      <button
        onClick={() => onViewChange("forgot")}
        className="block text-center w-full mb-4 text-sm text-white underline underline-offset-2"
        data-testid="link-forgot-password"
      >
        Forgot Password?
      </button>
      {error && <p className="text-sm text-red-400 text-center mb-3">{error}</p>}
    </DialogWrapper>
  );
};

/* ─── Register ──────────────────────────────────────────────────────────────── */
const RegisterDialog = ({
  onViewChange,
  onClose,
  mobile,
}: {
  onViewChange: (v: AuthView) => void;
  onClose: () => void;
  mobile?: boolean;
}) => {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();
  const { toast } = useToast();

  const handleRegister = async () => {
    setError("");
    if (!first || !last || !email || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      await register({ email, firstName: first, lastName: last, password });
      toast({ title: "Account created!", description: "Welcome to Ask MiGi. You've received 5 welcome coins!" });
      onClose();
    } catch (e: any) {
      setError(e.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogWrapper
      title="Create An Account"
      onClose={onClose}
      mobile={mobile}
      footer={
        <div className="flex flex-col gap-4">
          <PrimaryButton onClick={handleRegister} loading={loading} testId="button-create-account">Create Account</PrimaryButton>
          <p className="text-center text-sm text-white/60">
            Already have an account?{" "}
            <button onClick={() => onViewChange("login")} className="text-white font-semibold underline underline-offset-2" data-testid="link-login">
              Log in
            </button>
          </p>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <AuthInput placeholder="First name" value={first} onChange={setFirst} testId="input-first-name" />
        <AuthInput placeholder="Last name" value={last} onChange={setLast} testId="input-last-name" />
        <AuthInput placeholder="Email" type="email" value={email} onChange={setEmail} testId="input-email" />
        <AuthInput
          placeholder="Password"
          type={showPw ? "text" : "password"}
          value={password}
          onChange={setPassword}
          showToggle
          onToggle={() => setShowPw((v) => !v)}
          testId="input-password"
        />
      </div>
      {error && <p className="text-sm text-red-400 text-center mt-3">{error}</p>}
    </DialogWrapper>
  );
};

/* ─── Forgot Password ───────────────────────────────────────────────────────── */
const ForgotPasswordDialog = ({
  onViewChange,
  onClose,
  mobile,
}: {
  onViewChange: (v: AuthView) => void;
  onClose: () => void;
  mobile?: boolean;
}) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequest = async () => {
    setError("");
    if (!email) { setError("Please enter your email."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      sessionStorage.setItem("reset_email", email);
      if (data.otp) sessionStorage.setItem("reset_otp_hint", data.otp);
      onViewChange("otp");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogWrapper
      title="Forgot Password?"
      onClose={onClose}
      mobile={mobile}
      footer={
        <PrimaryButton onClick={handleRequest} loading={loading} testId="button-request-reset">
          Request Password Reset
        </PrimaryButton>
      }
    >
      <div className="flex items-center gap-2 mb-1">
        <Mail size={16} className="text-white" />
        <p className="text-sm font-semibold text-white">Enter your email address.</p>
      </div>
      <p className="text-sm text-white/50 mb-5">We will send you a 6-digit code to reset your password</p>
      <AuthInput placeholder="Email" type="email" value={email} onChange={setEmail} testId="input-email" />
      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
    </DialogWrapper>
  );
};

/* ─── OTP ───────────────────────────────────────────────────────────────────── */
const OTPDialog = ({
  onViewChange,
  onClose,
  mobile,
}: {
  onViewChange: (v: AuthView) => void;
  onClose: () => void;
  mobile?: boolean;
}) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const email = sessionStorage.getItem("reset_email") || "";
  const otpHint = sessionStorage.getItem("reset_otp_hint");

  const handleVerify = async () => {
    setError("");
    if (!code) { setError("Please enter the code."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.message || "Invalid OTP");
        return;
      }
      sessionStorage.setItem("reset_verified_otp", code);
      onViewChange("new-password");
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogWrapper
      title="Enter OTP"
      onClose={onClose}
      mobile={mobile}
      footer={
        <div className="flex flex-col gap-4">
          <p className="text-center text-sm text-white/60">
            Didn't get Code?{" "}
            <button
              onClick={() => onViewChange("forgot")}
              className="text-white font-semibold underline underline-offset-2"
              data-testid="link-reset-code"
            >
              Reset Code
            </button>
          </p>
          <PrimaryButton onClick={handleVerify} loading={loading} testId="button-continue-otp">Continue</PrimaryButton>
        </div>
      }
    >
      <p className="text-sm text-white/60 mb-1">Enter the 6-digit code sent to</p>
      <p className="text-sm font-semibold text-white mb-5">{email || "your email"}</p>
      {otpHint && (
        <p className="text-xs text-yellow-400/70 mb-3">Demo hint: your OTP is <strong>{otpHint}</strong></p>
      )}
      <AuthInput placeholder="Enter Code" value={code} onChange={setCode} testId="input-otp" />
      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
    </DialogWrapper>
  );
};

/* ─── New Password ──────────────────────────────────────────────────────────── */
const NewPasswordDialog = ({
  onViewChange,
  onClose,
  mobile,
}: {
  onViewChange: (v: AuthView) => void;
  onClose: () => void;
  mobile?: boolean;
}) => {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    setError("");
    if (!pw || !confirm) { setError("Please fill in all fields."); return; }
    if (pw !== confirm) { setError("Passwords don't match."); return; }
    if (pw.length < 6) { setError("Password must be at least 6 characters."); return; }
    const email = sessionStorage.getItem("reset_email") || "";
    const otp = sessionStorage.getItem("reset_verified_otp") || "";
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword: pw }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.message || "Reset failed");
        return;
      }
      sessionStorage.removeItem("reset_email");
      sessionStorage.removeItem("reset_otp_hint");
      sessionStorage.removeItem("reset_verified_otp");
      onViewChange("success");
    } catch {
      setError("Reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogWrapper
      title="New Password"
      onClose={onClose}
      mobile={mobile}
      footer={
        <PrimaryButton onClick={handleReset} loading={loading} testId="button-continue-newpw">Continue</PrimaryButton>
      }
    >
      <div className="flex flex-col gap-3">
        <AuthInput
          placeholder="New Password"
          type={showPw ? "text" : "password"}
          value={pw}
          onChange={setPw}
          showToggle
          onToggle={() => setShowPw((v) => !v)}
          testId="input-new-password"
        />
        <AuthInput
          placeholder="Confirm New Password"
          type={showConfirm ? "text" : "password"}
          value={confirm}
          onChange={setConfirm}
          showToggle
          onToggle={() => setShowConfirm((v) => !v)}
          testId="input-confirm-password"
        />
      </div>
      {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
    </DialogWrapper>
  );
};

/* ─── Success Dialog ─────────────────────────────────────────────────────────── */
const SuccessDialog = ({
  onClose,
  onViewChange,
  mobile,
}: {
  onClose: () => void;
  onViewChange: (v: AuthView) => void;
  mobile?: boolean;
}) => {
  if (mobile) {
    return (
      <div className="flex flex-col h-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end px-5 pt-5">
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-[#2e3032] text-white/60 hover:text-white"
            data-testid="button-close-success"
          >
            <X size={15} />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
          <div className="h-16 w-16 rounded-full border-2 border-white flex items-center justify-center">
            <CircleCheck size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Password reset successful</h2>
          <p className="text-sm text-white/60">You have successfully reset your password. Proceed to log in.</p>
        </div>
        <div className="px-5 pb-10 pt-3">
          <button
            type="button"
            onClick={() => onViewChange("login")}
            className="w-full h-12 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
            data-testid="button-continue-success"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-sm bg-[#1a1c1e] rounded-3xl px-6 py-8 border border-white/10 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-end mb-2">
        <button
          onClick={onClose}
          className="h-8 w-8 flex items-center justify-center rounded-full bg-[#2e3032] text-white/60 hover:text-white"
          data-testid="button-close-success"
        >
          <X size={15} />
        </button>
      </div>
      <div className="flex flex-col items-center gap-4 text-center py-4">
        <div className="h-16 w-16 rounded-full border-2 border-white flex items-center justify-center">
          <CircleCheck size={32} className="text-white" />
        </div>
        <h2 className="text-xl font-semibold text-white">Password reset successful</h2>
        <p className="text-sm text-white/60">You have successfully reset your password. Proceed to log in.</p>
      </div>
      <div className="mt-6">
        <button
          type="button"
          onClick={() => onViewChange("login")}
          className="w-full h-12 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
          data-testid="button-continue-success"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
