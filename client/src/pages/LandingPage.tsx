import { useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { NavBar } from "@/components/NavBar";
import { ChatInput, type AttachmentData } from "@/components/ChatInput";
import { ChatSidebar, type SidebarEnquiry } from "@/components/ChatSidebar";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const OTHERS_ARE_ASKING = [
  "I've applied to 100 jobs and received no interviews. What am I doing wrong?",
  "Why am I getting rejected for jobs abroad?",
  "My Graduate Visa expires in 8 months. How do I find a sponsored job?",
  "How do I find a sponsored job in the UK, Canada, or Australia?",
  "How do I get a sponsored job abroad?",
  "How do I find a cyber security job in the UK from India?",
  "How do I stand out from hundreds of applicants?",
  "Why do recruiters ignore international applicants?",
  "Can you create a sponsorship strategy based on my profile?",
  "How do I get more interview callbacks?",
  "How do I find jobs that explicitly offer visa sponsorship?",
  "What mistakes are stopping me from getting interviews?",
  "How do I make my CV stand out internationally?",
  "Why am I not getting job interviews?",
  "How do recruiters view international applicants?",
  "Which countries are hiring foreign tech professionals right now?",
  "What skills should I learn to get hired faster?",
  "Which certifications actually help me get hired?",
  "How do I increase my chances of getting a visa-sponsored job?",
  "How do I compete with local candidates abroad?",
  "How do I get a job abroad from my country?",
  "How do I apply for jobs in the UK, Canada, or Australia?",
  "Can I get a job abroad with no international experience?",
  "What is wrong with my CV?",
  "Why do I get interviews but no job offers?",
  "How do I pass technical interviews?",
  "How do I prepare for interviews confidently?",
  "How do I switch from a student visa to a work visa?",
  "What salary do I need to qualify for sponsorship?",
  "How do I find companies hiring international candidates?",
  "What skills are most in demand globally right now?",
  "How do I fix a CV that keeps getting rejected?",
  "How do I write a CV for foreign employers?",
  "What makes a CV pass ATS filters?",
  "Can small companies sponsor foreign workers?",
  "How many jobs should I apply to get interviews?",
  "How do I handle tough interview questions?",
  "How do I turn interviews into job offers?",
  "What are common interview mistakes?",
  "How do I stop freezing during interviews?",
  "Which industries hire foreign workers the most?",
  "How do I get into a high-paying career quickly?",
  "Can I move into tech from a non-tech background?",
  "How do I switch careers without starting over?",
  "Can I change careers at 30 or 40?",
  "What careers are easiest to switch into?",
  "How do I build a clear career path from where I am now?",
  "What skills help me switch careers faster?",
  "How do I extend my stay abroad through a job?",
  "Can I get a job abroad with no experience?",
];

function OthersAreAsking() {
  const items = [...OTHERS_ARE_ASKING, ...OTHERS_ARE_ASKING];
  return (
    <div className="w-full overflow-hidden">
      <div className="flex gap-3 animate-marquee">
        {items.map((q, i) => (
          <span
            key={i}
            className="inline-flex shrink-0 items-start px-4 py-2 rounded-2xl border border-th-border-md bg-th-hover text-xs text-th-text-60 hover:text-th-text-80 hover:border-th-border-strong transition-colors cursor-default leading-5 max-w-[220px] whitespace-normal"
          >
            {q}
          </span>
        ))}
      </div>
    </div>
  );
}

export const LandingPage = (): JSX.Element => {
  const [, navigate] = useLocation();
  const [authView, setAuthView] = useState<AuthView>(null);
  const { isLoggedIn, isLoading, refreshUser } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const pendingRef = useRef<{ question: string; country: string; attachment?: AttachmentData | null } | null>(null);

  const { data: enquiries = [] } = useQuery<any[]>({
    queryKey: ["/api/enquiries"],
    enabled: isLoggedIn,
    refetchInterval: 5000,
  });

  const submitQuestion = useCallback(async (q: string, country: string, attachment?: AttachmentData | null) => {
    try {
      const res = await apiRequest("POST", "/api/enquiries", {
        question: q,
        expertType: "immigration",
        country,
        ...(attachment ? { attachment: attachment.data, attachmentName: attachment.name } : {}),
      });
      const data = await res.json();
      await qc.invalidateQueries({ queryKey: ["/api/enquiries"] });
      await refreshUser();
      navigate(`/chat?id=${data.id}`);
    } catch (e: any) {
      if (e.message?.includes("402")) {
        toast({ title: "Not enough coins", description: "Please purchase more coins to continue.", variant: "destructive" });
        navigate("/buy-coins");
      } else if (e.message?.includes("401")) {
        setAuthView("login");
      } else {
        toast({ title: "Error", description: e.message || "Failed to submit question.", variant: "destructive" });
      }
    }
  }, [qc, refreshUser, navigate, toast]);

  const handleQuestionSubmit = (q: string, _expertType: string, country: string, attachment?: AttachmentData | null) => {
    if (!isLoggedIn) {
      pendingRef.current = { question: q, country, attachment };
      setAuthView("login");
      return;
    }
    submitQuestion(q, country, attachment);
  };

  const handleAuthSuccess = useCallback(async () => {
    const pending = pendingRef.current;
    if (pending) {
      pendingRef.current = null;
      await submitQuestion(pending.question, pending.country, pending.attachment);
    }
  }, [submitQuestion]);

  const sidebarItems: SidebarEnquiry[] = enquiries.map((e: any) => ({
    id: e.id,
    question: e.question,
    status: e.status,
  }));

  if (isLoading) {
    return (
      <main className="min-h-screen w-full bg-th-page text-th-text flex flex-col">
        <NavBar onLoginClick={() => setAuthView("login")} onSignUpClick={() => setAuthView("register")} />
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-th-page text-th-text flex flex-col">
      <NavBar
        onLoginClick={() => setAuthView("login")}
        onSignUpClick={() => setAuthView("register")}
      />

      <div className="flex flex-1">
        {isLoggedIn && (
          <div className="w-52 shrink-0 border-r border-th-border overflow-y-auto px-3 py-3 hidden md:block">
            <ChatSidebar
              enquiries={sidebarItems}
              activeId=""
              onSelect={(id) => navigate(`/chat?id=${id}`)}
              onNewQuestion={() => {}}
            />
          </div>
        )}

        {/* Right panel — stacks vertically so ticker can be full-width */}
        <div className="flex flex-1 flex-col min-w-0">

          {/* Centred content block */}
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 md:py-12">
            <div className="w-full max-w-2xl flex flex-col gap-6 md:gap-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <img className="h-10 md:h-14 invert dark:invert-0" alt="Ask MiGi" src="/figmaAssets/vector.svg" />
                <p className="max-w-xl text-sm md:text-base text-th-text-70 leading-7">
                  Get expert career guidance every step of the way—whether you're planning your next move, navigating a career change, or seeking professional advice, our experts help you succeed with confidence.
                </p>
              </div>

              {isLoggedIn && sidebarItems.length > 0 && (
                <div className="md:hidden flex flex-col gap-2">
                  <p className="text-xs font-semibold text-th-text-40 uppercase tracking-wider px-1">Recent Conversations</p>
                  <div className="flex flex-col gap-1">
                    {sidebarItems.slice(0, 3).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => navigate(`/chat?id=${item.id}`)}
                        className="w-full text-left px-3 py-2.5 rounded-xl bg-th-hover border border-th-border hover:bg-th-hover transition-colors flex items-center justify-between gap-3"
                      >
                        <span className="text-sm text-th-text-70 truncate leading-5">{item.question}</span>
                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${item.status === "answered" ? "bg-white/15 text-white" : "bg-white/5 text-white/50"}`}>
                          {item.status === "answered" ? "Answered" : "Pending"}
                        </span>
                      </button>
                    ))}
                    {sidebarItems.length > 3 && (
                      <button
                        onClick={() => navigate("/enquiries")}
                        className="text-xs text-th-text-40 hover:text-th-text-60 text-center py-1 transition-colors"
                      >
                        View all {sidebarItems.length} conversations →
                      </button>
                    )}
                  </div>
                </div>
              )}

              <ChatInput
                onSubmit={handleQuestionSubmit}
                showAudienceTabs={true}
              />
            </div>
          </div>

          {/* Full-width ticker strip — spans edge-to-edge of the right panel */}
          <div className="w-full border-t border-b border-th-border py-4">
            <p className="text-[11px] font-semibold tracking-widest text-th-text-40 uppercase mb-3 px-4 md:px-6">Others are asking</p>
            <OthersAreAsking />
          </div>

          {/* Terms — centred below ticker */}
          <div className="flex justify-center px-4 py-6">
            <p className="text-center text-xs md:text-sm text-th-text-50 leading-6">
              By messaging Ask MiGi, you agree to our{" "}
              <button onClick={() => navigate("/terms")} className="text-th-text underline underline-offset-2">Terms of Use,</button>{" "}
              <button onClick={() => navigate("/privacy-policy")} className="text-th-text underline underline-offset-2">Privacy Policy</button>,{" "}
              <button onClick={() => navigate("/disclaimer")} className="text-th-text underline underline-offset-2">Disclaimer</button>{" "}
              and{" "}
              <button onClick={() => navigate("/refund-policy")} className="text-th-text underline underline-offset-2">Refund Policy</button>.
            </p>
          </div>

        </div>
      </div>

      <AuthSheets
        view={authView}
        onViewChange={setAuthView}
        onClose={() => setAuthView(null)}
        onSuccess={handleAuthSuccess}
      />
    </main>
  );
};
