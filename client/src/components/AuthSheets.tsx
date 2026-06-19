import { useState } from "react";
import { X, Mail, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AuthView = "login" | "register" | "forgot" | "otp" | "new-password" | "success" | null;

interface AuthSheetsProps {
  view: AuthView;
  onViewChange: (view: AuthView) => void;
  onClose: () => void;
}

export const AuthSheets = ({ view, onViewChange, onClose }: AuthSheetsProps) => {
  if (!view) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={view === "success" ? onClose : undefined}
        data-testid="auth-backdrop"
      />
      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col">
        {view === "login" && <LoginSheet onViewChange={onViewChange} onClose={onClose} />}
        {view === "register" && <RegisterSheet onViewChange={onViewChange} onClose={onClose} />}
        {view === "forgot" && <ForgotPasswordSheet onViewChange={onViewChange} onClose={onClose} />}
        {view === "otp" && <OTPSheet onViewChange={onViewChange} onClose={onClose} />}
        {view === "new-password" && <NewPasswordSheet onViewChange={onViewChange} onClose={onClose} />}
        {view === "success" && <SuccessModal onClose={onClose} onViewChange={onViewChange} />}
      </div>
    </>
  );
};

const SheetWrapper = ({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) => (
  <div className="mx-auto w-full max-w-[375px] rounded-t-3xl bg-[#161618] px-5 pt-6 pb-10">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-semibold text-white tracking-tight">{title}</h2>
      <button
        onClick={onClose}
        className="h-8 w-8 flex items-center justify-center rounded-full bg-[#242628] text-white/70 hover:text-white"
        data-testid="button-close-sheet"
      >
        <X size={16} />
      </button>
    </div>
    {children}
  </div>
);

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
      className="w-full h-14 rounded-2xl bg-[#242628] px-4 text-sm text-white placeholder:text-white/40 border border-transparent focus:border-white/20 focus:outline-none"
      data-testid={testId}
    />
    {showToggle && (
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
      >
        {type === "password" ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    )}
  </div>
);

const PrimaryButton = ({ children, onClick, testId }: { children: React.ReactNode; onClick?: () => void; testId?: string }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full h-14 rounded-full bg-white text-black text-base font-semibold hover:bg-white/90 transition-colors"
    data-testid={testId}
  >
    {children}
  </button>
);

// --- Login ---
const LoginSheet = ({ onViewChange, onClose }: { onViewChange: (v: AuthView) => void; onClose: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  return (
    <SheetWrapper title="Log in" onClose={onClose}>
      <div className="flex flex-col gap-3 mb-6">
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
        className="block text-center w-full mb-10 text-sm text-white underline underline-offset-2"
        data-testid="link-forgot-password"
      >
        Forgot Password?
      </button>
      <div className="flex flex-col gap-4">
        <PrimaryButton onClick={onClose} testId="button-login">Log in</PrimaryButton>
        <p className="text-center text-sm text-white/60">
          Don't have an account?{" "}
          <button
            onClick={() => onViewChange("register")}
            className="text-white font-semibold underline underline-offset-2"
            data-testid="link-create-account"
          >
            Create Account
          </button>
        </p>
      </div>
    </SheetWrapper>
  );
};

// --- Register ---
const RegisterSheet = ({ onViewChange, onClose }: { onViewChange: (v: AuthView) => void; onClose: () => void }) => {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  return (
    <SheetWrapper title="Create An Account" onClose={onClose}>
      <div className="flex flex-col gap-3 mb-10">
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
      <div className="flex flex-col gap-4">
        <PrimaryButton onClick={onClose} testId="button-create-account">Create Account</PrimaryButton>
        <p className="text-center text-sm text-white/60">
          Already have an account?{" "}
          <button
            onClick={() => onViewChange("login")}
            className="text-white font-semibold underline underline-offset-2"
            data-testid="link-login"
          >
            Log in
          </button>
        </p>
      </div>
    </SheetWrapper>
  );
};

// --- Forgot Password ---
const ForgotPasswordSheet = ({ onViewChange, onClose }: { onViewChange: (v: AuthView) => void; onClose: () => void }) => {
  const [email, setEmail] = useState("");

  return (
    <SheetWrapper title="Forgot Password?" onClose={onClose}>
      <div className="flex items-center gap-2 mb-1">
        <Mail size={18} className="text-white" />
        <p className="text-base font-semibold text-white">Enter your email address.</p>
      </div>
      <p className="text-sm text-white/50 mb-6">We will send you a 6-digit code to reset your password</p>
      <AuthInput placeholder="Email" type="email" value={email} onChange={setEmail} testId="input-email" />
      <div className="mt-10">
        <PrimaryButton onClick={() => onViewChange("otp")} testId="button-request-reset">
          Request Password Reset
        </PrimaryButton>
      </div>
    </SheetWrapper>
  );
};

// --- OTP ---
const OTPSheet = ({ onViewChange, onClose }: { onViewChange: (v: AuthView) => void; onClose: () => void }) => {
  const [code, setCode] = useState("");

  return (
    <SheetWrapper title="Enter OTP" onClose={onClose}>
      <p className="text-sm text-white/60 mb-1">Enter the 6 digit Code sent to</p>
      <p className="text-sm font-semibold text-white mb-6">Freebornehirhere@gmail.com</p>
      <AuthInput placeholder="Enter Code" value={code} onChange={setCode} testId="input-otp" />
      <div className="mt-10 flex flex-col gap-4">
        <PrimaryButton onClick={() => onViewChange("new-password")} testId="button-continue-otp">
          Continue
        </PrimaryButton>
        <p className="text-center text-sm text-white/60">
          Didn't get Code?{" "}
          <button className="text-white font-semibold underline underline-offset-2" data-testid="link-reset-code">
            Reset Code
          </button>
        </p>
      </div>
    </SheetWrapper>
  );
};

// --- New Password ---
const NewPasswordSheet = ({ onViewChange, onClose }: { onViewChange: (v: AuthView) => void; onClose: () => void }) => {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <SheetWrapper title="Create a new password" onClose={onClose}>
      <div className="flex flex-col gap-3 mb-10">
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
      <PrimaryButton onClick={() => onViewChange("success")} testId="button-continue-newpw">
        Continue
      </PrimaryButton>
    </SheetWrapper>
  );
};

// --- Success Modal ---
const SuccessModal = ({ onClose, onViewChange }: { onClose: () => void; onViewChange: (v: AuthView) => void }) => (
  <div className="mx-auto w-full max-w-[375px] rounded-3xl bg-[#161618] px-5 py-8 mb-8 mx-4">
    <div className="flex justify-end mb-2">
      <button
        onClick={onClose}
        className="h-8 w-8 flex items-center justify-center rounded-full bg-[#242628] text-white/70 hover:text-white"
        data-testid="button-close-success"
      >
        <X size={16} />
      </button>
    </div>
    <div className="flex flex-col items-center gap-4 text-center py-4">
      <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center">
        <CheckCircle size={32} className="text-black" />
      </div>
      <h2 className="text-xl font-semibold text-white">Password reset successful</h2>
      <p className="text-sm text-white/60">You have successfully reset your password, Proceed to log in</p>
    </div>
    <div className="mt-6">
      <PrimaryButton onClick={() => onViewChange("login")} testId="button-continue-success">
        Continue
      </PrimaryButton>
    </div>
  </div>
);
