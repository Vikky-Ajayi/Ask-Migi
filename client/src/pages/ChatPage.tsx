import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { DesktopNav } from "@/components/DesktopNav";
import { ChatSidebar, type SidebarEnquiry } from "@/components/ChatSidebar";
import { ChatInput } from "@/components/ChatInput";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export const ChatPage = (): JSX.Element => {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialId = params.get("id") || "";

  const [authView, setAuthView] = useState<AuthView>(null);
  const [activeId, setActiveId] = useState<string>(initialId);
  const { isLoggedIn, isLoading: authLoading, refreshUser } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  // Load all enquiries
  const { data: enquiries = [], isLoading: enqLoading } = useQuery<any[]>({
    queryKey: ["/api/enquiries"],
    enabled: isLoggedIn,
  });

  // Auto-select first enquiry if none selected
  useEffect(() => {
    if (!activeId && enquiries.length > 0) {
      setActiveId(enquiries[0].id);
    }
  }, [enquiries, activeId]);

  // Active enquiry details
  const activeEnquiry = enquiries.find((e: any) => e.id === activeId);

  // Submit new question
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
      toast({ title: "Question submitted!", description: "An expert will respond within 3–5 business days." });
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
        <DesktopNav onLoginClick={() => setAuthView("login")} onSignUpClick={() => setAuthView("register")} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-white/60 mb-4">Please log in to view your enquiries.</p>
            <button
              onClick={() => setAuthView("login")}
              className="px-6 py-3 rounded-full bg-white text-black font-semibold"
            >
              Log In
            </button>
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
    <main className="min-h-screen w-full bg-[#161618] text-white flex flex-col">
      <DesktopNav onLoginClick={() => setAuthView("login")} onSignUpClick={() => setAuthView("register")} />

      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 65px)" }}>
        {/* Left sidebar */}
        <div className="w-64 shrink-0 px-4 py-4 border-r border-white/5 overflow-y-auto">
          <ChatSidebar
            enquiries={sidebarItems}
            activeId={activeId}
            onSelect={setActiveId}
            onNewQuestion={() => navigate("/")}
            isLoading={enqLoading}
          />
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col min-h-0">
          {/* Notice banner */}
          <div className="mx-auto w-full max-w-2xl px-6 pt-4">
            <div className="rounded-2xl bg-[#242628] border border-[#3a3c3e] px-4 py-3 text-sm text-white/80 text-center leading-5">
              <span className="font-semibold text-white">Please note:</span> Expert responses are not instant. You'll receive a response in 3-5 Business days
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="mx-auto w-full max-w-2xl flex flex-col gap-5">
              {!activeEnquiry && !enqLoading && (
                <div className="text-center text-white/40 py-12">
                  <p>No question selected. Use the chat below to ask your first question.</p>
                </div>
              )}

              {activeEnquiry && (
                <>
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="max-w-[70%] rounded-2xl rounded-tr-sm bg-[#2a2c2e] border border-[#3a3c3e] px-4 py-3">
                      <p className="text-sm text-white/90 leading-6">{activeEnquiry.question}</p>
                    </div>
                  </div>

                  {/* Expert reply */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#242628] border border-[#3a3c3e] flex items-center justify-center text-xs font-bold text-white shrink-0">
                        E
                      </div>
                      <span className="text-sm font-semibold text-yellow-400">Expert</span>
                      <span className="text-xs text-yellow-400/70">
                        · {activeEnquiry.status === "answered" ? "Answered" : "Pending response"}
                      </span>
                    </div>
                    <p className="text-sm text-white/70 leading-6 ml-10">
                      {activeEnquiry.status === "answered" && activeEnquiry.answer
                        ? activeEnquiry.answer
                        : "Thank you for your question! An expert will review and respond as soon as possible. You'll be notified when your response is ready."}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bottom input */}
          <div className="border-t border-white/5 px-6 py-4">
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

      <AuthSheets view={authView} onViewChange={setAuthView} onClose={() => setAuthView(null)} />
    </main>
  );
};
