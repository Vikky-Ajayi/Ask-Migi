import { useState } from "react";
import { useLocation } from "wouter";
import { DesktopNav } from "@/components/DesktopNav";
import { ChatInput } from "@/components/ChatInput";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export const LandingPage = (): JSX.Element => {
  const [, navigate] = useLocation();
  const [authView, setAuthView] = useState<AuthView>(null);
  const { isLoggedIn, isLoading } = useAuth();
  const { toast } = useToast();

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

  return (
    <main className="min-h-screen w-full bg-[#161618] text-white flex flex-col">
      <DesktopNav
        onLoginClick={() => setAuthView("login")}
        onSignUpClick={() => setAuthView("register")}
      />

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl flex flex-col gap-8">
          {/* Hero */}
          <div className="flex flex-col items-center gap-5 text-center">
            <img className="h-14" alt="Ask MiGi" src="/figmaAssets/vector.svg" />
            <p className="max-w-xl text-base text-white/70 leading-7">
              Get expert immigration guidance every step of the way—whether visiting, relocating, or pursuing citizenship, our experts help you settle with confidence.
            </p>
          </div>

          {/* Chat input with tabs */}
          <ChatInput onSubmit={handleQuestionSubmit} showAudienceTabs={true} />

          {/* Footer disclaimer */}
          <p className="text-center text-sm text-white/50 leading-6">
            By messaging Ask MiGi, you agree to our{" "}
            <button onClick={() => navigate("/terms")} className="text-white underline underline-offset-2">Terms of Use,</button>{" "}
            <button onClick={() => navigate("/privacy-policy")} className="text-white underline underline-offset-2">Privacy Policy</button>,{" "}
            <button onClick={() => navigate("/disclaimer")} className="text-white underline underline-offset-2">Disclaimer</button>{" "}
            and{" "}
            <button onClick={() => navigate("/refund-policy")} className="text-white underline underline-offset-2">Refund Policy</button>.
          </p>
        </div>
      </div>

      <AuthSheets view={authView} onViewChange={setAuthView} onClose={() => setAuthView(null)} />
    </main>
  );
};
