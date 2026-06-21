import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";
import { useLocation } from "wouter";

const steps = [
  { number: "01", title: "Apply Online in Minutes", description: "All you need is a valid ID and any relevant licenses or certifications to get started.", align: "left" },
  { number: "02", title: "Quick Background Check", description: "We partner with a trusted third-party service to verify your credentials — the process is secure and usually completed in just a few days.", align: "right" },
  { number: "03", title: "Start Earning Right Away!", description: "Once you're approved, we'll equip you with all the tools and support you need to start helping people and earning money fast.", align: "left" },
];

export const BecomeAnExpertPage = (): JSX.Element => {
  const [, navigate] = useLocation();
  const [authView, setAuthView] = useState<AuthView>(null);

  return (
    <main className="min-h-screen w-full bg-[#0f1011] text-white flex flex-col">
      <NavBar onLoginClick={() => setAuthView("login")} onSignUpClick={() => setAuthView("register")} />

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-4 md:px-6 pt-12 md:pt-16 pb-8 md:pb-10">
        <div className="max-w-2xl flex flex-col gap-5 md:gap-6">
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight tracking-tight">
            Help Migrants Thrive &amp; Get Paid for your Expertise
          </h1>
          <p className="text-sm md:text-base text-white/55 leading-7 max-w-lg mx-auto">
            Are you a certified professional with a passion for helping people achieve their goals? Join our platform and earn by sharing your expertise with a global audience in need of guidance.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => setAuthView("register")}
              className="h-11 md:h-12 px-6 md:px-7 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors"
              data-testid="button-create-account"
            >
              Create Account
            </button>
            <button
              onClick={() => setAuthView("login")}
              className="h-11 md:h-12 px-6 md:px-7 rounded-full border border-white/25 text-white font-medium text-sm hover:bg-white/10 transition-colors"
              data-testid="button-login"
            >
              Log in
            </button>
          </div>
        </div>
      </section>

      {/* Expert photos */}
      <section className="flex justify-center pb-12 md:pb-16 px-4">
        <img
          src="/experts-group.png"
          alt="Expert consultants"
          className="w-full max-w-lg object-contain"
        />
      </section>

      {/* Application Process */}
      <section className="flex flex-col items-center px-4 md:px-8 py-12 md:py-20 bg-[#161618]">
        <div className="w-full max-w-[1400px] flex flex-col gap-10 md:gap-16">

          {/* Section header */}
          <div className="text-center flex flex-col gap-4">
            <h2
              className="text-4xl text-white"
              style={{
                fontFamily: "'Roobert TRIAL', sans-serif",
                fontWeight: 700,
                fontSize: "clamp(2rem, 5vw, 64px)",
                lineHeight: "105%",
                letterSpacing: "-0.03em",
              }}
            >
              The Application Process
            </h2>
            <p className="text-sm md:text-base text-white/55 leading-7 max-w-xl mx-auto">
              Getting started is easy — and there are no sign-up fees. Just complete the quick application, and we'll support you every step of the way so you can start helping clients and earning money fast.
            </p>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-6 md:gap-8">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`flex ${step.align === "right" ? "justify-end" : "justify-start"}`}
                data-testid={`step-${step.number}`}
              >
                <div className="w-full md:w-[869px] md:min-h-[135px] rounded-[24px] border border-white/[0.08] bg-[#1e2022] p-5 md:p-[28px] flex flex-col gap-[16px]">
                  {/* Number + Title row */}
                  <div className="flex items-center gap-5">
                    <div className="flex items-center justify-center h-11 w-11 rounded-full bg-[#0f1011] border border-white/20 text-white text-sm font-bold shrink-0">
                      {step.number}
                    </div>
                    <h3
                      className="text-white"
                      style={{
                        fontFamily: "'Roobert TRIAL', sans-serif",
                        fontWeight: 650,
                        fontSize: "clamp(1.5rem, 3.5vw, 40px)",
                        lineHeight: "100%",
                        letterSpacing: "-0.06em",
                      }}
                    >
                      {step.title}
                    </h3>
                  </div>
                  {/* Description */}
                  <p className="text-sm md:text-[15px] text-white/55 leading-6">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2e3032] px-4 md:px-8 py-6 md:py-8 flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0f1011]">
        <img className="h-6" alt="Ask MiGi" src="/figmaAssets/vector.svg" />
        <div className="flex items-center gap-4 flex-wrap justify-center text-xs text-white/40">
          {[["Terms of Use", "/terms"], ["Privacy Policy", "/privacy-policy"], ["Disclaimer", "/disclaimer"], ["Refund Policy", "/refund-policy"]].map(([label, path]) => (
            <button key={label} onClick={() => navigate(path)} className="hover:text-white transition-colors">{label}</button>
          ))}
        </div>
      </footer>

      <AuthSheets view={authView} onViewChange={setAuthView} onClose={() => setAuthView(null)} />
    </main>
  );
};
