import { useState } from "react";
import { useLocation } from "wouter";
import { AppHeader } from "@/components/AppHeader";
import { Sidebar } from "@/components/Sidebar";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";
import { SiFacebook, SiInstagram, SiX } from "react-icons/si";

export const ContactPage = (): JSX.Element => {
  const [, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authView, setAuthView] = useState<AuthView>(null);
  const [isLoggedIn] = useState(false);

  return (
    <main className="min-h-screen w-full bg-[#161618] text-white flex flex-col">
      <div className="mx-auto flex min-h-screen w-full max-w-[375px] flex-col px-4 pb-10">
        <AppHeader
          onMenuClick={() => setSidebarOpen(true)}
          onProfileClick={() => {}}
          isLoggedIn={isLoggedIn}
          onSignUpClick={() => setAuthView("register")}
        />

        <section className="flex flex-1 flex-col items-center justify-center gap-6 text-center py-16">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
              Got Questions? We're Here to Help!
            </h1>
            <p className="text-sm text-white/60 leading-6 max-w-[300px] mx-auto">
              At AskMigi, your curiosity fuels everything we do. Whether you've got a burning question, need support, or just want to say hello, we'd love to hear from you!
            </p>
          </div>

          <a
            href="mailto:support@askmigi.com"
            className="inline-flex h-12 items-center justify-center rounded-full bg-white/10 border border-white/20 px-6 text-sm font-medium text-white hover:bg-white/20 transition-colors"
            data-testid="link-email"
          >
            Email: support@askmigi.com
          </a>

          <p className="text-sm text-white/60 leading-6">
            Your questions, answered. Your voice, heard. Your journey, supported.<br />
            Let's chat!
          </p>
        </section>

        <footer className="mt-auto pt-6 border-t border-[#3a3c3e]">
          <div className="flex flex-col items-center gap-4">
            <img className="h-6" alt="Ask MiGi" src="/figmaAssets/vector.svg" />
            <div className="flex items-center gap-6 text-xs text-white/40">
              <button onClick={() => navigate("/terms")} className="hover:text-white">Terms of Use</button>
              <button onClick={() => navigate("/privacy-policy")} className="hover:text-white">Privacy Policy</button>
              <button onClick={() => navigate("/disclaimer")} className="hover:text-white">Disclaimer</button>
              <button onClick={() => navigate("/refund-policy")} className="hover:text-white">Refund Policy</button>
            </div>
          </div>
        </footer>
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isLoggedIn={isLoggedIn} onAuthAction={(a) => setAuthView(a)} />
      <AuthSheets view={authView} onViewChange={setAuthView} onClose={() => setAuthView(null)} />
    </main>
  );
};
