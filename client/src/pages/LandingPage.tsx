import { useState } from "react";
import { useLocation } from "wouter";
import { AppHeader } from "@/components/AppHeader";
import { Sidebar } from "@/components/Sidebar";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";

const audienceOptions = ["Immigration Experts", "Travel agents", "Tour Guides"];

export const LandingPage = (): JSX.Element => {
  const [, navigate] = useLocation();
  const [selectedAudience, setSelectedAudience] = useState("Immigration Experts");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authView, setAuthView] = useState<AuthView>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isLoggedIn] = useState(false);
  const [question, setQuestion] = useState("");

  const handleSubmit = () => {
    if (question.trim()) navigate("/chat");
  };

  return (
    <main className="min-h-screen w-full bg-[#161618] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[375px] flex-col px-4 pb-8 relative">
        <AppHeader
          onMenuClick={() => setSidebarOpen(true)}
          onProfileClick={() => setAccountOpen((v) => !v)}
          isLoggedIn={isLoggedIn}
          onSignUpClick={() => setAuthView("register")}
        />

        {accountOpen && isLoggedIn && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setAccountOpen(false)} />
            <div className="absolute right-4 top-16 z-40 bg-[#242628] rounded-2xl p-1 min-w-[160px] border border-white/10 shadow-xl">
              <button
                onClick={() => { setAccountOpen(false); navigate("/settings"); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 rounded-xl"
                data-testid="account-settings"
              >
                ⚙️ Settings
              </button>
              <button
                onClick={() => setAccountOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 rounded-xl"
                data-testid="account-logout"
              >
                ↩️ Log out
              </button>
            </div>
          </>
        )}

        <section className="mt-[99px] flex flex-col gap-8">
          <div className="flex flex-col items-center gap-5">
            <img className="h-14 w-[232.61px]" alt="Ask MiGi" src="/figmaAssets/vector.svg" />
            <p className="self-stretch text-center [font-family:'Roobert_TRIAL-Medium',Helvetica] text-sm font-medium leading-[21px] tracking-[-0.28px] text-[#ffffffcc]">
              Get expert immigration guidance every step of the way, whether visiting, relocating, or pursuing citizenship, our experts help you settle with confidence.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <nav aria-label="Audience selection" className="overflow-x-auto pb-1">
              <div className="flex min-w-max items-start gap-3 pr-4">
                {audienceOptions.map((option) => {
                  const isActive = selectedAudience === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSelectedAudience(option)}
                      className={`h-8 rounded-[48px] px-4 py-3 [font-family:'Roobert_TRIAL-Medium',Helvetica] text-xs font-medium leading-[18px] tracking-[-0.24px] transition-colors ${
                        isActive ? "bg-white text-black" : "bg-[#242628] text-white hover:bg-[#2b2d2f]"
                      }`}
                      data-testid={`tab-${option.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <span className="mt-[-2px] opacity-80">{option}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="rounded-3xl border border-solid border-[#3a3c3e] bg-[#242628]">
              <div className="flex flex-col gap-14 px-2 pb-2 pt-6">
                <div className="flex items-start gap-2 px-2">
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="|What do you want to know?"
                    rows={3}
                    className="flex-1 resize-none bg-transparent [font-family:'Roobert_TRIAL-Medium',Helvetica] text-base font-medium leading-6 tracking-[-0.32px] text-[#fcfcfccc] opacity-80 placeholder:opacity-80 focus:outline-none"
                    data-testid="input-question"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <img className="h-10 shrink-0" alt="Attach" src="/figmaAssets/frame-1410105905.svg" />
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 items-center justify-center gap-1 rounded-[48px] border border-solid border-[#3a3c3e] px-2 py-3">
                      <div className="inline-flex items-center gap-1">
                        <img className="h-5 w-5 object-cover" alt="Coins" src="/figmaAssets/image-2.png" />
                        <span className="whitespace-nowrap [font-family:'Roobert_TRIAL-Medium',Helvetica] text-sm font-medium leading-[21px] tracking-[-0.28px] text-[#fcfcfccc] opacity-80">
                          3 Coins/question
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="h-10 w-10 rounded-full hover:bg-white/5 flex items-center justify-center"
                      aria-label="Submit question"
                      data-testid="button-submit-question"
                    >
                      <img className="h-10 w-10" alt="Submit" src="/figmaAssets/frame-1410105889.svg" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-[180px] self-center">
          <p className="w-full max-w-[343px] text-center [font-family:'Roobert_TRIAL-Medium',Helvetica] text-base font-normal leading-6 tracking-[-0.32px] text-[#fcfcfccc]">
            <span className="font-medium tracking-[-0.05px]">By messaging Ask MiGi, you agree to our </span>
            <button onClick={() => navigate("/terms")} className="[font-family:'Roobert_TRIAL-SemiBold',Helvetica] font-semibold tracking-[-0.05px] text-white underline">Terms of Use,</button>
            <span> </span>
            <button onClick={() => navigate("/privacy-policy")} className="[font-family:'Roobert_TRIAL-SemiBold',Helvetica] font-semibold tracking-[-0.05px] text-white underline">Privacy Policy</button>
            <span>, </span>
            <button onClick={() => navigate("/disclaimer")} className="[font-family:'Roobert_TRIAL-SemiBold',Helvetica] font-semibold tracking-[-0.05px] text-white underline">Disclaimer</button>
            <span> and </span>
            <button onClick={() => navigate("/refund-policy")} className="[font-family:'Roobert_TRIAL-SemiBold',Helvetica] font-semibold tracking-[-0.05px] text-white underline">Refund Policy</button>
            <span>.</span>
          </p>
        </footer>
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isLoggedIn={isLoggedIn} onAuthAction={(a) => setAuthView(a)} />
      <AuthSheets view={authView} onViewChange={setAuthView} onClose={() => setAuthView(null)} />
    </main>
  );
};
