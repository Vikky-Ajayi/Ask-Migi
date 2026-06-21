import { useLocation } from "wouter";
import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";

export const ContactPage = (): JSX.Element => {
  const [, navigate] = useLocation();
  const [authView, setAuthView] = useState<AuthView>(null);

  return (
    <main className="min-h-screen w-full bg-[#161618] text-white flex flex-col">
      <NavBar onLoginClick={() => setAuthView("login")} onSignUpClick={() => setAuthView("register")} />

      <div className="flex flex-1 flex-col items-center justify-center px-4 md:px-6 py-12 md:py-16 text-center">
        <div className="w-full max-w-2xl flex flex-col gap-6">
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight">
            Got Questions? We're Here to Help!
          </h1>
          <p className="text-sm md:text-base text-white/55 leading-7 max-w-xl mx-auto">
            At AskMigi, your curiosity fuels everything we do. Whether you've got a burning question, need support, or just want to say hello, we'd love to hear from you!
          </p>
          <div>
            <a
              href="mailto:support@askmigi.com"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/30 px-8 text-sm font-medium text-white hover:bg-white/10 transition-colors"
              data-testid="link-email"
            >
              Email: support@askmigi.com
            </a>
          </div>
          <p className="text-sm text-white/55 leading-7">
            Your questions, answered. Your voice, heard. Your journey, supported.<br />
            Let's chat!
          </p>
        </div>
      </div>

      <div className="border-t border-[#2e3032] px-4 md:px-6 py-6 flex flex-col items-center gap-4">
        <img className="h-6" alt="Ask MiGi" src="/figmaAssets/vector.svg" />
        <div className="flex items-center gap-4 flex-wrap justify-center text-xs text-white/40">
          {[["Terms of Use", "/terms"], ["Privacy Policy", "/privacy-policy"], ["Disclaimer", "/disclaimer"], ["Refund Policy", "/refund-policy"]].map(([label, path]) => (
            <button key={label} onClick={() => navigate(path)} className="hover:text-white transition-colors">{label}</button>
          ))}
        </div>
      </div>

      <AuthSheets view={authView} onViewChange={setAuthView} onClose={() => setAuthView(null)} />
    </main>
  );
};
