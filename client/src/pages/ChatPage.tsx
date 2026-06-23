import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { NavBar } from "@/components/NavBar";
import { ChatSidebar, type SidebarEnquiry } from "@/components/ChatSidebar";
import { MobileEnquirySidebar } from "@/components/MobileEnquirySidebar";
import { ChatInput } from "@/components/ChatInput";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import coinImg from "@assets/coins_1781943901685.png";

function TypingText({ text, speed = 18 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed("");
    indexRef.current = 0;
    const interval = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && (
        <span className="inline-block w-[2px] h-[1em] bg-white/50 align-middle ml-0.5 animate-pulse" />
      )}
    </span>
  );
}

export const ChatPage = (): JSX.Element => {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialId = params.get("id") || "";

  const [authView, setAuthView] = useState<AuthView>(null);
  const [activeId, setActiveId] = useState<string>(initialId);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const hasAutoOpened = useRef(false);

  const { isLoggedIn, isLoading: authLoading, refreshUser } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: enquiries = [], isLoading: enqLoading } = useQuery<any[]>({
    queryKey: ["/api/enquiries"],
    enabled: isLoggedIn,
    refetchInterval: 5000,
  });

  /* Auto-open the mobile sidebar the first time enquiries appear */
  useEffect(() => {
    if (!hasAutoOpened.current && enquiries.length > 0 && window.innerWidth < 768) {
      hasAutoOpened.current = true;
      setMobileSidebarOpen(true);
    }
  }, [enquiries]);

  useEffect(() => {
    if (!activeId && enquiries.length > 0) {
      setActiveId(enquiries[0].id);
    }
  }, [enquiries, activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId]);

  const activeEnquiry = enquiries.find((e: any) => e.id === activeId);

  const submitMutation = useMutation({
    mutationFn: async ({ question, country }: { question: string; country: string }) => {
      const res = await apiRequest("POST", "/api/enquiries", {
        question,
        expertType: "immigration",
        country,
      });
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/enquiries"] });
      refreshUser();
      setActiveId(data.id);
    },
    onError: (e: any) => {
      if (e.message?.includes("402")) {
        toast({ title: "Not enough coins", description: "Please purchase more coins to continue.", variant: "destructive" });
        navigate("/buy-coins");
      } else if (e.message?.includes("401")) {
        setAuthView("login");
      } else {
        toast({ title: "Error", description: e.message || "Failed to submit question.", variant: "destructive" });
      }
    },
  });

  const handleSubmit = (question: string, _expertType: string, country: string) => {
    if (!isLoggedIn) { setAuthView("login"); return; }
    submitMutation.mutate({ question, country });
  };

  if (authLoading) {
    return (
      <main className="min-h-screen w-full bg-[#161618] text-white flex flex-col">
        <NavBar onLoginClick={() => setAuthView("login")} onSignUpClick={() => setAuthView("register")} />
        <AuthSheets view={authView} onViewChange={setAuthView} onClose={() => setAuthView(null)} />
      </main>
    );
  }

  const sidebarItems: SidebarEnquiry[] = enquiries.map((e: any) => ({
    id: e.id,
    question: e.question,
    status: e.status,
  }));

  const isAnswered = activeEnquiry?.status === "answered";
  const isPending = !activeEnquiry || activeEnquiry.status === "pending" || activeEnquiry.status === "ai_draft";

  return (
    <main className="h-screen w-full bg-[#161618] text-white flex flex-col overflow-hidden">
      <NavBar
        onLoginClick={() => setAuthView("login")}
        onSignUpClick={() => setAuthView("register")}
        onMenuClick={() => setMobileSidebarOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — desktop only */}
        <div className="w-52 shrink-0 border-r border-white/5 overflow-y-auto px-3 py-3 hidden md:block">
          <ChatSidebar
            enquiries={sidebarItems}
            activeId={activeId}
            onSelect={setActiveId}
            onNewQuestion={() => navigate("/")}
            isLoading={enqLoading}
          />
        </div>

        <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
          <div className="w-full bg-[#1e2022] border-b border-white/5 px-3 md:px-6 py-3 text-xs md:text-sm text-white/70 text-center shrink-0">
            <span className="font-semibold text-white">Please note:</span>{" "}
            Expert responses are not instant. You'll receive a response within 6 to 12 hours
          </div>

          <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 md:py-6">
            <div className="mx-auto w-full max-w-2xl flex flex-col gap-6">
              {!activeEnquiry && !enqLoading && (
                <div className="text-center text-white/40 py-16">
                  <p>No question selected. Use the input below to ask a question.</p>
                </div>
              )}

              {activeEnquiry && (
                <>
                  <div className="flex justify-end">
                    <div className="max-w-[85%] md:max-w-[72%] rounded-2xl rounded-tr-sm bg-[#2a2c2e] border border-[#3a3c3e] px-4 py-3">
                      <p className="text-sm text-white/90 leading-6">{activeEnquiry.question}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#242628] border border-[#3a3c3e] flex items-center justify-center text-xs font-bold text-white shrink-0">
                        E
                      </div>
                      <span className="text-sm font-semibold text-yellow-400">Expert</span>
                      <span className="text-xs text-yellow-400/70">
                        · {isAnswered ? "Answered" : "Pending response"}
                      </span>
                    </div>

                    {isAnswered && activeEnquiry.answer ? (
                      <div className="ml-10">
                        {activeEnquiry.answer.split("\n\n").map((para: string, i: number) => (
                          <p key={i} className="text-sm text-white/80 leading-6 mb-3 last:mb-0">
                            {para}
                          </p>
                        ))}
                        {activeEnquiry.answeredBy && (
                          <p className="text-xs text-white/30 mt-3 italic">
                            — {activeEnquiry.answeredBy}
                          </p>
                        )}
                        {/* Coin nudge */}
                        <div className="mt-5 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                          <img src={coinImg} alt="coins" className="w-5 h-5 object-contain shrink-0" />
                          <p className="text-xs text-white/60 leading-5">
                            Want more detail? Ask a follow-up question below using your coins.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="ml-10 flex flex-col gap-3">
                        {activeEnquiry.analysis && (
                          <p className="text-sm text-white/70 leading-6">
                            <TypingText text={activeEnquiry.analysis} />
                          </p>
                        )}
                        <p className="text-sm text-white/60 leading-6">
                          <TypingText
                            text="Your query has been sent to an expert who will get back to you within 6–12 hours. You'll be notified by email when your response is ready."
                            speed={12}
                          />
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-white/5 px-3 md:px-6 py-3 md:py-4 shrink-0">
            <div className="mx-auto w-full max-w-2xl flex flex-col gap-3">
              <ChatInput
                onSubmit={handleSubmit}
                showAudienceTabs={true}
                isSubmitting={submitMutation.isPending}
              />
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

      {/* Mobile: enquiry sidebar */}
      <MobileEnquirySidebar
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        enquiries={sidebarItems}
        activeId={activeId}
        onSelect={setActiveId}
        onNewQuestion={() => navigate("/")}
      />

      <AuthSheets view={authView} onViewChange={setAuthView} onClose={() => setAuthView(null)} />
    </main>
  );
};
