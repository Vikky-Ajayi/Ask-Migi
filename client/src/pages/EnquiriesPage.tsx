import { useState } from "react";
import { useLocation } from "wouter";
import { DesktopNav } from "@/components/DesktopNav";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatInput } from "@/components/ChatInput";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";

const enquiries = [
  {
    id: 1,
    question: "Hello, Can I get help regarding immigration to the UK",
    status: "pending",
    expertNote:
      "Thank you for your question! An expert will review and respond as soon as possible. You'll be notified when your response is ready.",
  },
];

export const EnquiriesPage = (): JSX.Element => {
  const [, navigate] = useLocation();
  const [authView, setAuthView] = useState<AuthView>(null);
  const [activeId, setActiveId] = useState<number>(1);
  const isLoggedIn = true;

  return (
    <main className="min-h-screen w-full bg-[#161618] text-white flex flex-col">
      <DesktopNav
        isLoggedIn={isLoggedIn}
        coins={50}
        onLoginClick={() => setAuthView("login")}
        onSignUpClick={() => setAuthView("register")}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-64 shrink-0 px-4 py-4 border-r border-white/5 overflow-y-auto">
          <ChatSidebar
            activeId={activeId}
            onSelect={setActiveId}
            onNewQuestion={() => navigate("/")}
          />
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col min-h-0">
          {/* Notice */}
          <div className="mx-auto w-full max-w-2xl px-6 pt-4">
            <div className="rounded-2xl bg-[#242628] border border-[#3a3c3e] px-4 py-3 text-sm text-white/80 text-center leading-5">
              <span className="font-semibold text-white">Please note:</span> Expert responses are not instant. You'll receive a response in 3-5 Business days
            </div>
          </div>

          {/* Conversation */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="mx-auto w-full max-w-2xl flex flex-col gap-5">
              {enquiries.map((enq) => (
                <div key={enq.id} className="flex flex-col gap-4">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="max-w-[70%] rounded-2xl rounded-tr-sm bg-[#2a2c2e] border border-[#3a3c3e] px-4 py-3">
                      <p className="text-sm text-white/90 leading-6">{enq.question}</p>
                    </div>
                  </div>

                  {/* Expert reply */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#242628] border border-[#3a3c3e] flex items-center justify-center text-xs font-bold text-white shrink-0">
                        E
                      </div>
                      <span className="text-sm font-semibold text-yellow-400">Expert</span>
                      <span className="text-xs text-yellow-400/70">· Pending response</span>
                    </div>
                    <p className="text-sm text-white/70 leading-6 ml-10">{enq.expertNote}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom input */}
          <div className="border-t border-white/5 px-6 py-4">
            <div className="mx-auto w-full max-w-2xl flex flex-col gap-3">
              <ChatInput onSubmit={() => {}} showAudienceTabs={true} />
              <p className="text-center text-xs text-white/40 leading-5">
                By messaging Ask MiGi, you agree to our{" "}
                <button onClick={() => navigate("/terms")} className="text-white/60 underline underline-offset-2">Terms of Use,</button>{" "}
                <button onClick={() => navigate("/privacy-policy")} className="text-white/60 underline underline-offset-2">Privacy Policy</button>,{" "}
                <button onClick={() => navigate("/disclaimer")} className="text-white/60 underline underline-offset-2">Disclaimer</button>{" "}
                and{" "}
                <button onClick={() => navigate("/refund-policy")} className="text-white/60 underline underline-offset-2">Refund Policy</button>.
              </p>
            </div>
          </div>
        </div>
      </div>

      <AuthSheets view={authView} onViewChange={setAuthView} onClose={() => setAuthView(null)} />
    </main>
  );
};
