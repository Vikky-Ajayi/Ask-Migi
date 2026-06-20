import { useState } from "react";
import { useLocation } from "wouter";
import { NavBar } from "@/components/NavBar";
import { ChatInput } from "@/components/ChatInput";
import { ChatSidebar, type SidebarEnquiry } from "@/components/ChatSidebar";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export const LandingPage = (): JSX.Element => {
  const [, navigate] = useLocation();
  const [authView, setAuthView] = useState<AuthView>(null);
  const { isLoggedIn, isLoading, refreshUser } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: enquiries = [] } = useQuery<any[]>({
    queryKey: ["/api/enquiries"],
    enabled: isLoggedIn,
    refetchInterval: 5000,
  });

  const handleQuestionSubmit = async (q: string, expertType: string, country: string) => {
    if (!isLoggedIn) {
      setAuthView("login");
      return;
    }
    try {
      const res = await apiRequest("POST", "/api/enquiries", {
        question: q,
        expertType: expertType === "Immigration Experts" ? "immigration"
          : expertType === "Travel agents" ? "travel" : "tour",
        country,
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
  };

  const sidebarItems: SidebarEnquiry[] = enquiries.map((e: any) => ({
    id: e.id,
    question: e.question,
    status: e.status,
  }));

  if (isLoading) {
    return (
      <main className="min-h-screen w-full bg-[#161618] text-white flex flex-col">
        <NavBar onLoginClick={() => setAuthView("login")} onSignUpClick={() => setAuthView("register")} />
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#161618] text-white flex flex-col">
      <NavBar
        onLoginClick={() => setAuthView("login")}
        onSignUpClick={() => setAuthView("register")}
      />

      <div className="flex flex-1">
        {isLoggedIn && (
          <div className="w-52 shrink-0 border-r border-white/5 overflow-y-auto px-3 py-3 hidden md:block">
            <ChatSidebar
              enquiries={sidebarItems}
              activeId=""
              onSelect={(id) => navigate(`/chat?id=${id}`)}
              onNewQuestion={() => {}}
            />
          </div>
        )}

        <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 md:py-12">
          <div className="w-full max-w-2xl flex flex-col gap-6 md:gap-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <img className="h-10 md:h-14" alt="Ask MiGi" src="/figmaAssets/vector.svg" />
              <p className="max-w-xl text-sm md:text-base text-white/70 leading-7">
                Get expert immigration guidance every step of the way—whether visiting, relocating, or pursuing citizenship, our experts help you settle with confidence.
              </p>
            </div>

            <ChatInput onSubmit={handleQuestionSubmit} showAudienceTabs={true} />

            <p className="text-center text-xs md:text-sm text-white/50 leading-6">
              By messaging Ask MiGi, you agree to our{" "}
              <button onClick={() => navigate("/terms")} className="text-white underline underline-offset-2">Terms of Use,</button>{" "}
              <button onClick={() => navigate("/privacy-policy")} className="text-white underline underline-offset-2">Privacy Policy</button>,{" "}
              <button onClick={() => navigate("/disclaimer")} className="text-white underline underline-offset-2">Disclaimer</button>{" "}
              and{" "}
              <button onClick={() => navigate("/refund-policy")} className="text-white underline underline-offset-2">Refund Policy</button>.
            </p>
          </div>
        </div>
      </div>

      <AuthSheets view={authView} onViewChange={setAuthView} onClose={() => setAuthView(null)} />
    </main>
  );
};
