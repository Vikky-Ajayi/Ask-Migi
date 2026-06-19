import { useState } from "react";
import { DesktopNav } from "@/components/DesktopNav";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";
import { useLocation } from "wouter";

const steps = [
  {
    number: "01",
    title: "Apply Online in Minutes",
    description:
      "All you need is a valid ID and any relevant licenses or certifications to get started.",
  },
  {
    number: "02",
    title: "Quick Background Check",
    description:
      "We partner with a trusted third-party service to verify your credentials — the process is secure and usually completed in just a few days.",
  },
  {
    number: "03",
    title: "Start Earning Right Away!",
    description:
      "Once you're approved, we'll equip you with all the tools and support you need to start helping people and earning money fast.",
  },
];

export const BecomeAnExpertPage = (): JSX.Element => {
  const [, navigate] = useLocation();
  const [authView, setAuthView] = useState<AuthView>(null);

  return (
    <main className="min-h-screen w-full bg-[#0f1011] text-white flex flex-col">
      <DesktopNav
        onLoginClick={() => setAuthView("login")}
        onSignUpClick={() => setAuthView("register")}
      />

      {/* Hero section */}
      <section className="flex flex-col items-center text-center px-6 pt-16 pb-12">
        <div className="max-w-2xl flex flex-col gap-6">
          <h1 className="text-5xl font-bold text-white leading-tight tracking-tight">
            Help Migrants Thrive &amp; Get Paid for your Expertise
          </h1>
          <p className="text-base text-white/55 leading-7 max-w-lg mx-auto">
            Are you a certified professional with a passion for helping people achieve their goals? Join our platform and earn by sharing your expertise with a global audience in need of guidance.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setAuthView("register")}
              className="h-12 px-7 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors"
              data-testid="button-create-account"
            >
              Create Account
            </button>
            <button
              onClick={() => setAuthView("login")}
              className="h-12 px-7 rounded-full border border-white/25 text-white font-medium text-sm hover:bg-white/10 transition-colors"
              data-testid="button-login"
            >
              Log in
            </button>
          </div>
        </div>
      </section>

      {/* Expert photos */}
      <section className="flex justify-center items-end gap-4 px-6 pb-16">
        {/* Photo card 1 */}
        <div
          className="w-44 h-56 rounded-3xl bg-gradient-to-br from-[#2a2c2e] to-[#1a1c1e] overflow-hidden flex items-center justify-center border border-white/10 rotate-[-4deg]"
          style={{ marginBottom: "24px" }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-[#3a4a5a] flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="px-3 text-center">
              <div className="text-xs text-white/40">Immigration Expert</div>
            </div>
          </div>
        </div>

        {/* Photo card 2 (center, larger) */}
        <div className="w-52 h-64 rounded-3xl bg-gradient-to-br from-[#3a3c3e] to-[#252729] overflow-hidden flex items-center justify-center border border-white/10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-[#4a3a5a] flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="px-3 text-center">
              <div className="text-xs text-white/40">Travel Agent</div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="flex flex-col items-center px-6 py-16 bg-[#161618]">
        <div className="w-full max-w-2xl flex flex-col gap-10">
          <div className="text-center flex flex-col gap-3">
            <h2 className="text-3xl font-bold text-white tracking-tight">The Application Process</h2>
            <p className="text-sm text-white/55 leading-6 max-w-lg mx-auto">
              Getting started is easy — and there are no sign-up fees. Just complete the quick application, and we'll support you every step of the way so you can start helping clients and earning money fast.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-3xl border border-[#2e3032] bg-[#1a1c1e] px-7 py-6 flex flex-col gap-3"
                data-testid={`step-${step.number}`}
              >
                <div className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-white/20 text-xs font-bold text-white/70">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-white leading-snug">{step.title}</h3>
                <p className="text-sm text-white/55 leading-6">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2e3032] px-8 py-8 flex items-center justify-between">
        <img className="h-6" alt="Ask MiGi" src="/figmaAssets/vector.svg" />
        <div className="flex items-center gap-5 text-xs text-white/40">
          {[["Terms of Use", "/terms"], ["Privacy Policy", "/privacy-policy"], ["Disclaimer", "/disclaimer"], ["Refund Policy", "/refund-policy"]].map(([label, path]) => (
            <button key={label} onClick={() => navigate(path)} className="hover:text-white transition-colors">
              {label}
            </button>
          ))}
        </div>
      </footer>

      <AuthSheets view={authView} onViewChange={setAuthView} onClose={() => setAuthView(null)} />
    </main>
  );
};
