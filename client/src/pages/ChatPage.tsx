import { useState, useEffect, useRef } from "react";
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

// ── Typing animation ──────────────────────────────────────────────────────────
// Tracks which animKeys have already completed so re-mounts show text instantly
const _animatedKeys = new Set<string>();

function TypingText({ text, speed = 18, animKey }: { text: string; speed?: number; animKey?: string }) {
  const alreadyDone = animKey ? _animatedKeys.has(animKey) : false;
  const [displayed, setDisplayed] = useState(alreadyDone ? text : "");
  const indexRef = useRef(alreadyDone ? text.length : 0);

  useEffect(() => {
    if (alreadyDone) return;
    setDisplayed("");
    indexRef.current = 0;
    const interval = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) {
        clearInterval(interval);
        if (animKey) _animatedKeys.add(animKey);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, alreadyDone]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && (
        <span className="inline-block w-[2px] h-[1em] bg-white/50 align-middle ml-0.5 animate-pulse" />
      )}
    </span>
  );
}

// ── Casual message classifier (client-side, no network) ───────────────────────
function isCasualMessage(msg: string): boolean {
  const t = msg.toLowerCase().trim();
  const patterns = [
    /^(hi+|hello+|hey+|howdy|hiya|yo+|sup|greetings|salut|hola|bonjour|ciao)[\s!?.]*$/,
    /^good\s*(morning|afternoon|evening|night|day)[\s!?.]*$/,
    /^what'?s\s*up[\s!?.]*$/,
    /^how\s+are\s+(you|u|ya|yall|y'all)([\s?!.,]*(doing|going|feeling|been)?[\s?!.]*)?$/,
    /^(how('?s| is)\s+(it\s+going|things?|life|everything)[\s?!.]*)$/,
    /^(i('?m|\s+am)\s+)?(doing\s+)?(good|great|fine|okay|well|alright|not\s+bad|fantastic|wonderful|amazing)[\s!?.]*$/,
    /^(thanks?|thank\s*you|cheers|appreciate\s*(it|that)?|ty|thx|ta|many\s*thanks)[\s!?.]*$/,
    /^(great|amazing|wonderful|awesome|excellent|fantastic|brilliant|superb|outstanding|love\s*it|good\s*job|well\s*done|nice|cool|perfect|brilliant)[\s!?.]*$/,
    /^(bye+|goodbye|see\s*you|take\s*care|later|cya|farewell|ttyl|gotta\s*go|good\s*bye)[\s!?.]*$/,
    /^(ok+|okay|sure|yep|yeah|yup|nope|alright|fine|got\s*it|sounds?\s*good|understood|noted)[\s!?.]*$/,
    /^(wow|lol|haha|ha|😊|👍|🙏|❤️|nice one|good one)[\s!?.]*$/,
  ];
  return patterns.some((re) => re.test(t));
}

type CasualMsg = { userMsg: string; aiReply: string };

// ── Page ──────────────────────────────────────────────────────────────────────
export const ChatPage = (): JSX.Element => {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialId = params.get("id") || "";

  const [authView, setAuthView] = useState<AuthView>(null);
  const [activeId, setActiveId] = useState<string>(initialId);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [casualMsgs, setCasualMsgs] = useState<CasualMsg[]>([]);
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

  useEffect(() => {
    if (!hasAutoOpened.current && enquiries.length > 0 && window.innerWidth < 768) {
      hasAutoOpened.current = true;
      setMobileSidebarOpen(true);
    }
  }, [enquiries]);

  useEffect(() => {
    if (!activeId && enquiries.length > 0) setActiveId(enquiries[0].id);
  }, [enquiries, activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, casualMsgs]);

  const activeEnquiry = enquiries.find((e: any) => e.id === activeId);

  // ── Casual chat mutation (free, no coins) ────────────────────────────────
  const casualMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/casual-chat", { message });
      return res.json() as Promise<{ reply: string }>;
    },
    onSuccess: (data, variables) => {
      setCasualMsgs((prev) => [...prev, { userMsg: variables, aiReply: data.reply }]);
    },
    onError: () => {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    },
  });

  // ── Enquiry mutation (costs coins) ───────────────────────────────────────
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
      setCasualMsgs([]);
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
    const trimmed = question.trim();
    if (!trimmed) return;
    if (isCasualMessage(trimmed)) {
      casualMutation.mutate(trimmed);
    } else {
      submitMutation.mutate({ question: trimmed, country });
    }
  };

  const isSubmitting = casualMutation.isPending || submitMutation.isPending;

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
            onSelect={(id) => { setActiveId(id); setCasualMsgs([]); }}
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

              {/* No enquiry selected */}
              {!activeEnquiry && !enqLoading && casualMsgs.length === 0 && !casualMutation.isPending && (
                <div className="text-center text-white/40 py-16">
                  <p>No question selected. Use the input below to ask a question.</p>
                </div>
              )}

              {/* Active enquiry thread */}
              {activeEnquiry && (
                <>
                  <div className="flex justify-end">
                    <div className="max-w-[85%] md:max-w-[72%] rounded-2xl rounded-tr-sm bg-[#2a2c2e] border border-[#3a3c3e] px-4 py-3">
                      <p className="text-sm text-white/90 leading-6">{activeEnquiry.question}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      {activeEnquiry.answeredByPic ? (
                        <img src={activeEnquiry.answeredByPic} alt="Expert" className="h-8 w-8 rounded-full object-cover border border-[#3a3c3e] shrink-0" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-[#242628] border border-[#3a3c3e] flex items-center justify-center text-xs font-bold text-white shrink-0">E</div>
                      )}
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
                        <div className="mt-5 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                          <img src={coinImg} alt="coins" className="w-5 h-5 object-contain shrink-0" />
                          <p className="text-xs text-white/60 leading-5">
                            Want more detail? Ask a follow-up question below.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="ml-10 flex flex-col gap-3">
                        {activeEnquiry.analysis && (
                          <p className="text-sm text-white/70 leading-6">
                            <TypingText text={activeEnquiry.analysis} animKey={`analysis-${activeEnquiry.id}`} />
                          </p>
                        )}
                        <p className="text-sm text-white/60 leading-6">
                          <TypingText
                            text="Your query has been sent to an expert who will get back to you within 6–12 hours. You'll be notified by email when your response is ready."
                            speed={12}
                            animKey={`pending-${activeEnquiry.id}`}
                          />
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Casual exchange messages — always rendered below the enquiry thread */}
              {casualMsgs.map((cm, i) => (
                <div key={i} className="flex flex-col gap-4">
                  {/* User bubble */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] md:max-w-[72%] rounded-2xl rounded-tr-sm bg-[#2a2c2e] border border-[#3a3c3e] px-4 py-3">
                      <p className="text-sm text-white/90 leading-6">{cm.userMsg}</p>
                    </div>
                  </div>
                  {/* AI reply bubble */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#242628] border border-[#3a3c3e] flex items-center justify-center text-xs font-bold text-white shrink-0">
                        M
                      </div>
                      <span className="text-sm font-semibold text-white/70">Ask MiGi</span>
                    </div>
                    <div className="ml-10">
                      <p className="text-sm text-white/80 leading-6">
                        <TypingText text={cm.aiReply} speed={16} />
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pending casual reply indicator */}
              {casualMutation.isPending && (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#2a2c2e] border border-[#3a3c3e] px-4 py-3">
                      <p className="text-sm text-white/90 leading-6">{casualMutation.variables}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-10">
                    <span className="text-sm text-white/40 animate-pulse">Ask MiGi is typing…</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-white/5 px-3 md:px-6 py-3 md:py-4 shrink-0">
            <div className="mx-auto w-full max-w-2xl flex flex-col gap-3">
              <ChatInput
                onSubmit={handleSubmit}
                showAudienceTabs={false}
                isSubmitting={isSubmitting}
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
