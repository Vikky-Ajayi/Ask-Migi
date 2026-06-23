import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { NavBar } from "@/components/NavBar";
import { ChatSidebar, type SidebarEnquiry } from "@/components/ChatSidebar";
import { MobileEnquirySidebar } from "@/components/MobileEnquirySidebar";
import { ChatInput } from "@/components/ChatInput";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export const EnquiriesPage = (): JSX.Element => {
  const [, navigate] = useLocation();
  const [authView, setAuthView] = useState<AuthView>(null);
  const [activeId, setActiveId] = useState<string>("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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
    if (!activeId && enquiries.length > 0) setActiveId(enquiries[0].id);
  }, [enquiries, activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId]);

  const activeEnquiry = enquiries.find((e: any) => e.id === activeId);

  const submitMutation = useMutation({
    mutationFn: async ({ question, expertType, country }: { question: string; expertType: string; country: string }) => {
      const res = await apiRequest("POST", "/api/enquiries", {
        question,
        expertType: expertType === "Immigration Experts" ? "immigration"
          : expertType === "Travel agents" ? "travel" : "tour",
        country,
      });
      return res.json();
    },
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: ["/api/enquiries"] });
      await refreshUser();
      setActiveId(data.id);
      toast({ title: "Question submitted!", description: "An AI + Expert response will be generated shortly." });
    },
    onError: (e: any) => {
      if (e.message?.includes("402")) {
        toast({ title: "Not enough coins", description: "Please purchase more coins.", variant: "destructive" });
        navigate("/buy-coins");
      } else {
        toast({ title: "Error", description: e.message || "Failed to submit question.", variant: "destructive" });
      }
    },
  });

  const handleSubmit = (q: string, expertType: string, country: string) => {
    if (!isLoggedIn) { setAuthView("login"); return; }
    submitMutation.mutate({ question: q, expertType, country });
  };

  if (!authLoading && !isLoggedIn) {
    return (
      <main className="min-h-screen w-full bg-[#161618] text-white flex flex-col">
        <NavBar onLoginClick={() => setAuthView("login")} onSignUpClick={() => setAuthView("register")} />
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="text-center">
            <p className="text-white/60 mb-4">Please log in to view your enquiries.</p>
            <button onClick={() => setAuthView("login")} className="px-6 py-3 rounded-full bg-white text-black font-semibold">Log In</button>
          </div>
        </div>
        <AuthSheets view={authView} onViewChange={setAuthView} onClose={() => setAuthView(null)} />
      </main>
    );
  }

  const sidebarItems: SidebarEnquiry[] = enquiries.map((e: any) => ({
    id: e.id,
    question: e.question,
    status: e.status,
  }));

  return (
    <main className="h-screen w-full bg-[#161618] text-white flex flex-col overflow-hidden">
      <NavBar
        onLoginClick={() => setAuthView("login")}
        onSignUpClick={() => setAuthView("register")}
        onMenuClick={() => setMobileSidebarOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
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
            Expert responses are not instant. You'll receive a response in 3-5 Business days
          </div>

          <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 md:py-6">
            <div className="mx-auto w-full max-w-2xl flex flex-col gap-6">
              {!activeEnquiry && !enqLoading && (
                <div className="text-center text-white/40 py-16">
                  <p>No enquiries yet. Ask your first question below!</p>
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
                      <div className="h-8 w-8 rounded-full bg-[#242628] border border-[#3a3c3e] flex items-center justify-center text-xs font-bold text-white shrink-0">E</div>
                      <span className="text-sm font-semibold text-yellow-400">Expert</span>
                      <span className="text-xs text-yellow-400/70">· {activeEnquiry.status === "answered" ? "Answered" : "Pending response"}</span>
                    </div>
                    {activeEnquiry.status === "answered" && activeEnquiry.answer ? (
                      <div className="ml-10">
                        {activeEnquiry.answer.split("\n\n").map((para: string, i: number) => (
                          <p key={i} className="text-sm text-white/80 leading-6 mb-3 last:mb-0">{para}</p>
                        ))}
                        {activeEnquiry.answeredBy && (
                          <p className="text-xs text-white/30 mt-3 italic">— {activeEnquiry.answeredBy}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-white/60 leading-6 ml-10">
                        Thank you for your question! An expert will review and respond as soon as possible. You'll be notified when your response is ready.
                      </p>
                    )}
                  </div>
                </>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-white/5 px-3 md:px-6 py-3 md:py-4 shrink-0">
            <div className="mx-auto w-full max-w-2xl flex flex-col gap-3">
              <ChatInput onSubmit={handleSubmit} showAudienceTabs={false} isSubmitting={submitMutation.isPending} />
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
