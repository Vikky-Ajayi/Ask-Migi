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

      {/* Expert photos — V-shape: tops fan out, bottoms meet/overlap */}
      <section className="flex justify-center pb-12 md:pb-16 px-4">
        <div className="relative shrink-0" style={{ width: "420px", height: "380px" }}>
          {/* Left image: rotate(-8deg) → top leans left, bottom leans right into right card */}
          <img
            src="/expert1.png"
            alt="Expert"
            className="absolute object-cover"
            style={{
              width: "220px",
              height: "330px",
              top: "20px",
              left: "10px",
              borderRadius: "32px",
              border: "7px solid white",
              transform: "rotate(-8deg)",
              transformOrigin: "center center",
              zIndex: 2,
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
            }}
          />
          {/* Right image: rotate(+8deg) → top leans right, bottom leans left into left card */}
          <img
            src="/expert2.png"
            alt="Expert"
            className="absolute object-cover"
            style={{
              width: "220px",
              height: "330px",
              top: "20px",
              right: "10px",
              borderRadius: "32px",
              border: "7px solid white",
              transform: "rotate(8deg)",
              transformOrigin: "center center",
              zIndex: 1,
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
            }}
          />
        </div>
      </section>

      {/* Application Process */}
      <section className="flex flex-col items-center px-4 md:px-6 py-12 md:py-16 bg-[#161618]">
        <div className="w-full max-w-2xl flex flex-col gap-8 md:gap-10">
          <div className="text-center flex flex-col gap-3">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">The Application Process</h2>
            <p className="text-sm text-white/55 leading-6 max-w-lg mx-auto">
              Getting started is easy — and there are no sign-up fees. Just complete the quick application, and we'll support you every step of the way so you can start helping clients and earning money fast.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`flex ${step.align === "right" ? "justify-end" : "justify-start"}`}
                data-testid={`step-${step.number}`}
              >
                <div className="w-full md:max-w-[80%] rounded-3xl border border-[#2e3032] bg-[#1a1c1e] px-5 md:px-7 py-5 md:py-6 flex flex-col gap-3">
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-white/20 text-xs font-bold text-white/70">
                    {step.number}
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-white leading-snug">{step.title}</h3>
                  <p className="text-sm text-white/55 leading-6">{step.description}</p>
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
