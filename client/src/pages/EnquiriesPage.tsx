import { useState } from "react";
import { useLocation } from "wouter";
import { AppHeader } from "@/components/AppHeader";
import { Sidebar } from "@/components/Sidebar";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";

const audienceOptions = ["Immigration Experts", "Travel agents", "Tour Guides"];

const enquiries = [
  {
    id: 1,
    question: "Hello, Can I get help regarding immigration to the UK",
    status: "pending",
    expertNote: "Thank you for your question! An expert will review and respond as soon as possible. You'll be notified when your response is ready.",
  },
];

export const EnquiriesPage = (): JSX.Element => {
  const [, navigate] = useLocation();
  const [selectedAudience, setSelectedAudience] = useState("Immigration Experts");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authView, setAuthView] = useState<AuthView>(null);
  const [question, setQuestion] = useState("");
  const [isLoggedIn] = useState(true);

  return (
    <main className="min-h-screen w-full bg-[#161618] text-white flex flex-col">
      <div className="mx-auto flex min-h-screen w-full max-w-[375px] flex-col px-4 pb-4">
        <AppHeader
          onMenuClick={() => setSidebarOpen(true)}
          onProfileClick={() => {}}
          isLoggedIn={isLoggedIn}
        />

        {/* Notice banner */}
        <div className="mt-4 rounded-2xl bg-[#242628] px-4 py-3 border border-[#3a3c3e]">
          <p className="text-sm text-white/80 text-center leading-5">
            <span className="font-semibold text-white">Please note:</span> Expert responses are not instant. You'll receive a response in 3-5 Business days
          </p>
        </div>

        {/* Previous enquiries */}
        <div className="flex flex-col gap-5 mt-6 flex-1">
          {enquiries.map((enq) => (
            <div key={enq.id} className="flex flex-col gap-3">
              {/* User message */}
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[#2a2c2e] border border-[#3a3c3e] px-4 py-3">
                  <p className="text-sm text-white/90 leading-5">{enq.question}</p>
                </div>
              </div>

              {/* Expert reply */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[#242628] border border-[#3a3c3e] flex items-center justify-center text-xs font-bold text-white">
                    E
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-yellow-400">Expert</span>
                    <span className="text-xs text-yellow-400/80">· Pending response</span>
                  </div>
                </div>
                <p className="text-sm text-white/70 leading-5 ml-10">{enq.expertNote}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom input area */}
        <div className="mt-auto pt-4">
          <nav aria-label="Audience selection" className="overflow-x-auto pb-3">
            <div className="flex min-w-max items-start gap-3">
              {audienceOptions.map((option) => {
                const isActive = selectedAudience === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSelectedAudience(option)}
                    className={`h-8 rounded-[48px] px-4 text-xs font-medium transition-colors ${
                      isActive ? "bg-white text-black" : "bg-[#242628] text-white hover:bg-[#2b2d2f]"
                    }`}
                    data-testid={`enquiry-tab-${option.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="rounded-3xl border border-[#3a3c3e] bg-[#242628]">
            <div className="flex flex-col gap-10 px-2 pb-2 pt-5">
              <div className="px-2">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="|What do you want to know?"
                  rows={2}
                  className="w-full resize-none bg-transparent text-base font-medium leading-6 tracking-tight text-[#fcfcfccc] opacity-80 placeholder:opacity-80 focus:outline-none"
                  data-testid="input-new-enquiry"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <img className="h-10 shrink-0" alt="Attach" src="/figmaAssets/frame-1410105905.svg" />
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 items-center gap-1 rounded-[48px] border border-[#3a3c3e] px-2 py-3">
                    <img className="h-5 w-5 object-cover" alt="Coins" src="/figmaAssets/image-2.png" />
                    <span className="whitespace-nowrap text-sm font-medium text-[#fcfcfccc] opacity-80">3 Coins/question</span>
                  </div>
                  <button
                    type="button"
                    className="h-10 w-10 rounded-full hover:bg-white/5 flex items-center justify-center"
                    aria-label="Submit"
                    data-testid="button-enquiry-submit"
                  >
                    <img className="h-10 w-10" alt="Submit" src="/figmaAssets/frame-1410105889.svg" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <footer className="mt-4 text-center">
            <p className="text-xs text-white/50 leading-5">
              By messaging Ask MiGi, you agree to our{" "}
              <button onClick={() => navigate("/terms")} className="text-white underline">Terms of Use,</button>{" "}
              <button onClick={() => navigate("/privacy-policy")} className="text-white underline">Privacy Policy</button>,{" "}
              <button onClick={() => navigate("/disclaimer")} className="text-white underline">Disclaimer</button> and{" "}
              <button onClick={() => navigate("/refund-policy")} className="text-white underline">Refund Policy</button>.
            </p>
          </footer>
        </div>
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isLoggedIn={isLoggedIn} onAuthAction={(a) => setAuthView(a)} />
      <AuthSheets view={authView} onViewChange={setAuthView} onClose={() => setAuthView(null)} />
    </main>
  );
};
