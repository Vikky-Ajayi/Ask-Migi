import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearch, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { ExpertLayout } from "@/components/ExpertLayout";
import { ChevronRight, Info, Eye, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type View = "dashboard" | "answer" | "preview";

export const ExpertDashboardPage = () => {
  const { user, refreshUser } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [view, setView] = useState<View>("dashboard");
  const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
  const [answerText, setAnswerText] = useState("");
  const [magicLoading, setMagicLoading] = useState(false);
  const search = useSearch();
  const [, navigate] = useLocation();

  // Handle magic link token from email — auto-login if not already logged in
  useEffect(() => {
    const params = new URLSearchParams(search);
    const key = params.get("key");
    if (!key || user) return;

    setMagicLoading(true);
    fetch("/api/expert/magic-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: key }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          toast({
            title: "Access denied",
            description: data.message || "This link is invalid.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
        const data = await res.json();
        localStorage.setItem("askmigi_token", data.token);
        await refreshUser();
        navigate("/expert-dashboard", { replace: true });
      })
      .catch(() => {
        toast({ title: "Error", description: "Failed to authenticate. Please try again.", variant: "destructive" });
        navigate("/");
      })
      .finally(() => setMagicLoading(false));
  }, [search]);

  const { data: questions = [], isLoading: qLoading } = useQuery<any[]>({
    queryKey: ["/api/expert/questions"],
    queryFn: async () => {
      const token = localStorage.getItem("askmigi_token");
      const res = await fetch("/api/expert/questions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user && !magicLoading,
    refetchInterval: 15000,
  });

  const answerMutation = useMutation({
    mutationFn: async ({ id, answer }: { id: string; answer: string }) => {
      const token = localStorage.getItem("askmigi_token");
      const res = await fetch(`/api/expert/questions/${id}/answer`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answer }),
      });
      if (!res.ok) throw new Error("Failed to submit answer");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/expert/questions"] });
      toast({ title: "Response sent!", description: "Your answer has been sent to the user." });
      setView("dashboard");
      setSelectedEnquiry(null);
      setAnswerText("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send response. Please try again.", variant: "destructive" });
    },
  });

  const pendingCount = questions.length;

  const handleAnswerQuestion = (enquiry: any) => {
    setSelectedEnquiry(enquiry);
    setAnswerText(enquiry.answer || "");
    setView("answer");
  };

  const handleSendAnswer = () => {
    if (!answerText.trim() || !selectedEnquiry) return;
    answerMutation.mutate({ id: selectedEnquiry.id, answer: answerText });
  };

  if (magicLoading) {
    return (
      <main className="min-h-screen w-full bg-[#161618] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-sm text-white/50">Authenticating…</p>
        </div>
      </main>
    );
  }

  if (view === "preview" && selectedEnquiry) {
    return (
      <ExpertLayout title="Preview Response" pendingCount={pendingCount}>
        <div className="px-4 md:px-8 py-6 max-w-2xl">
          <button
            onClick={() => setView("answer")}
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-5"
          >
            ← Back to Edit
          </button>

          <div className="bg-[#1e2022] border border-[#2e3032] rounded-2xl p-5 mb-4">
            <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Question from User</p>
            <p className="text-base text-white leading-relaxed">{selectedEnquiry.question}</p>
            {selectedEnquiry.country && (
              <p className="text-xs text-white/40 mt-3">📍 {selectedEnquiry.country}</p>
            )}
          </div>

          <div className="bg-[#1e2022] border border-[#2e3032] rounded-2xl p-5 mb-6">
            <p className="text-xs text-white/40 uppercase tracking-wide mb-3">Your Response (Preview)</p>
            {answerText.split("\n\n").map((para, i) => (
              <p key={i} className="text-sm text-white/80 leading-6 mb-3 last:mb-0">{para}</p>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setView("answer")}
              className="h-10 px-5 rounded-full border border-white/20 text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              Edit Response
            </button>
            <button
              onClick={handleSendAnswer}
              disabled={answerMutation.isPending}
              className="h-10 px-6 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              data-testid="button-confirm-send"
            >
              <Send size={14} />
              {answerMutation.isPending ? "Sending…" : "Send to User"}
            </button>
          </div>
        </div>
      </ExpertLayout>
    );
  }

  if (view === "answer" && selectedEnquiry) {
    return (
      <ExpertLayout title="Edit Response" pendingCount={pendingCount}>
        <div className="px-4 md:px-8 py-6 max-w-2xl">
          <button
            onClick={() => { setView("dashboard"); setSelectedEnquiry(null); }}
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-5"
          >
            ← Back to Dashboard
          </button>

          <div className="bg-[#1e2022] border border-[#2e3032] rounded-2xl p-5 mb-4">
            <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Question</p>
            <p className="text-base text-white leading-relaxed">{selectedEnquiry.question}</p>
            {selectedEnquiry.country && (
              <p className="text-xs text-white/40 mt-3">📍 {selectedEnquiry.country}</p>
            )}
          </div>

          <div className="bg-[#0d2a4d] border border-[#1a4a7a] rounded-2xl p-4 mb-5 flex items-start gap-3">
            <Info size={16} className="text-[#4da6ff] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white mb-1">Response Guidelines</p>
              <ul className="text-xs text-white/60 leading-5 list-disc list-inside space-y-0.5">
                <li>Be clear, professional, and accurate</li>
                <li>Only answer within your area of expertise</li>
                <li>Do not share personal contact information</li>
                <li>Minimum 50 characters required</li>
              </ul>
            </div>
          </div>

          {selectedEnquiry.answer && (
            <div className="bg-[#1a2a1a] border border-[#2a4a2a] rounded-2xl p-4 mb-4 flex items-start gap-3">
              <Info size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-300/80 leading-5">
                An AI draft has been pre-filled below. Review, edit, and personalise before sending.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-white">Your Response</label>
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Type your expert response here..."
              rows={8}
              className="w-full rounded-xl bg-[#1e2022] border border-[#2e3032] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none resize-none"
              data-testid="textarea-answer"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/30">{answerText.length} characters</span>
              <button
                onClick={() => setView("preview")}
                disabled={answerText.trim().length < 50}
                className="h-10 px-6 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                data-testid="button-preview-answer"
              >
                <Eye size={14} />
                Preview & Send
              </button>
            </div>
          </div>
        </div>
      </ExpertLayout>
    );
  }

  return (
    <ExpertLayout title="Career Expert Dashboard" pendingCount={pendingCount}>
      <div className="px-4 md:px-8 py-6 flex flex-col gap-5">
        <div>
          <h2 className="text-base font-bold text-white mb-3">Live Questions Feed</h2>

          {qLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-20 rounded-2xl bg-[#1e2022] animate-pulse" />
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="bg-[#1e2022] border border-[#2e3032] rounded-2xl py-12 flex flex-col items-center gap-2 text-center">
              <p className="text-white/40 text-sm">No pending questions at the moment.</p>
              <p className="text-white/25 text-xs">Check back later for new questions from users.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {questions.map((q: any) => (
                <QuestionCard key={q.id} enquiry={q} onAnswer={() => handleAnswerQuestion(q)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </ExpertLayout>
  );
};

function QuestionCard({ enquiry, onAnswer }: { enquiry: any; onAnswer: () => void }) {
  return (
    <div
      className="bg-[#1e2022] border border-[#2e3032] rounded-2xl px-5 py-4 flex items-start justify-between gap-4"
      data-testid={`card-question-${enquiry.id}`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white leading-relaxed line-clamp-2">{enquiry.question}</p>
        {enquiry.country && (
          <p className="text-xs text-white/35 mt-1.5">📍 {enquiry.country}</p>
        )}
        {enquiry.status === "ai_draft" && (
          <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
            AI draft ready
          </span>
        )}
      </div>
      <button
        onClick={onAnswer}
        className="shrink-0 flex items-center gap-1 h-9 px-4 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90 transition-colors"
        data-testid={`button-answer-${enquiry.id}`}
      >
        Review & Send
        <ChevronRight size={13} />
      </button>
    </div>
  );
}
