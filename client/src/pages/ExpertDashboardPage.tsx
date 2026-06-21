import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { ExpertLayout } from "@/components/ExpertLayout";
import { ChevronRight, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type View = "dashboard" | "answer";

export const ExpertDashboardPage = () => {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [view, setView] = useState<View>("dashboard");
  const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
  const [answerText, setAnswerText] = useState("");

  const { data: verification, isLoading: verLoading } = useQuery({
    queryKey: ["/api/expert/verification"],
    queryFn: async () => {
      const token = localStorage.getItem("askmigi_token");
      const res = await fetch("/api/expert/verification", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user,
  });

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
    enabled: !!user,
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
      toast({ title: "Answer submitted!", description: "Your answer has been sent to the user." });
      setView("dashboard");
      setSelectedEnquiry(null);
      setAnswerText("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit answer. Please try again.", variant: "destructive" });
    },
  });

  const isVerified = verification?.status === "verified";
  const isInReview = verification?.status === "in_review" || verification?.status === "pending";
  const pendingCount = questions.length;

  const handleAnswerQuestion = (enquiry: any) => {
    setSelectedEnquiry(enquiry);
    setAnswerText("");
    setView("answer");
  };

  const handleSubmitAnswer = () => {
    if (!answerText.trim() || !selectedEnquiry) return;
    answerMutation.mutate({ id: selectedEnquiry.id, answer: answerText });
  };

  if (view === "answer" && selectedEnquiry) {
    return (
      <ExpertLayout title="Answer Question" verified={isVerified} pendingCount={pendingCount}>
        <div className="px-4 md:px-8 py-6 max-w-2xl">
          <button
            onClick={() => { setView("dashboard"); setSelectedEnquiry(null); }}
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-5"
          >
            ← Back to Dashboard
          </button>

          {/* Question card */}
          <div className="bg-[#1e2022] border border-[#2e3032] rounded-2xl p-5 mb-4">
            <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Question</p>
            <p className="text-base text-white leading-relaxed">{selectedEnquiry.question}</p>
            {selectedEnquiry.country && (
              <p className="text-xs text-white/40 mt-3">Country: {selectedEnquiry.country}</p>
            )}
          </div>

          {/* Guidelines */}
          <div className="bg-[#0d2a4d] border border-[#1a4a7a] rounded-2xl p-4 mb-5 flex items-start gap-3">
            <Info size={16} className="text-[#4da6ff] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white mb-1">Answer Guidelines</p>
              <ul className="text-xs text-white/60 leading-5 list-disc list-inside space-y-0.5">
                <li>Be clear, professional, and accurate</li>
                <li>Only answer within your area of expertise</li>
                <li>Do not share personal contact information</li>
                <li>Minimum 50 characters required</li>
              </ul>
            </div>
          </div>

          {/* Answer textarea */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-white">Your Answer</label>
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Type your expert answer here..."
              rows={6}
              className="w-full rounded-xl bg-[#1e2022] border border-[#2e3032] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none resize-none"
              data-testid="textarea-answer"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/30">{answerText.length} characters</span>
              <button
                onClick={handleSubmitAnswer}
                disabled={answerText.trim().length < 50 || answerMutation.isPending}
                className="h-10 px-6 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                data-testid="button-submit-answer"
              >
                {answerMutation.isPending ? "Submitting…" : "Submit Answer"}
              </button>
            </div>
          </div>
        </div>
      </ExpertLayout>
    );
  }

  return (
    <ExpertLayout title="Dashboard" verified={isVerified} pendingCount={pendingCount}>
      <div className="px-4 md:px-8 py-6 flex flex-col gap-5 max-w-4xl">

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Earnings card */}
          <div className="bg-[#1e2022] border border-[#2e3032] rounded-2xl p-5">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-4">Earnings</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <p className="text-[11px] text-white/40 mb-0.5">All Time</p>
                <p className="text-2xl font-bold text-white">£0</p>
              </div>
              <div>
                <p className="text-[11px] text-white/40 mb-0.5">Today</p>
                <p className="text-2xl font-bold text-white">£0</p>
              </div>
              <div>
                <p className="text-[11px] text-white/40 mb-0.5">Available</p>
                <p className="text-2xl font-bold text-emerald-400">£0</p>
              </div>
            </div>
            <button
              className="h-9 w-full rounded-full border border-[#3a3c3e] text-sm text-white/70 font-medium hover:bg-white/5 hover:text-white transition-colors"
              data-testid="button-withdraw"
            >
              Withdraw to Bank
            </button>
          </div>

          {/* Questions Answered */}
          <div className="bg-[#1e2022] border border-[#2e3032] rounded-2xl p-5">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-4">Questions Answered</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-white/40 mb-0.5">All Time</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
              <div>
                <p className="text-[11px] text-white/40 mb-0.5">Today</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Verification banners */}
        {!isVerified && !isInReview && (
          <div className="bg-[#0d2a4d] border border-[#1a4a7a] rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-white">Complete account set up</p>
              <p className="text-xs text-white/55 mt-0.5 leading-5">
                Verify your identity to start answering questions and earning
              </p>
            </div>
            <button
              onClick={() => navigate("/expert-verify")}
              className="shrink-0 h-9 px-5 rounded-full bg-[#2d7dd2] hover:bg-[#3a8de2] text-white font-semibold text-sm transition-colors"
              data-testid="button-complete-setup"
            >
              Complete set up
            </button>
          </div>
        )}

        {isInReview && (
          <div className="bg-[#1a3a1a] border border-[#2a5a2a] rounded-2xl px-5 py-4 flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">Account in review</p>
              <p className="text-xs text-white/55 mt-0.5">
                We're reviewing your documents. This usually takes 1–2 business days.
              </p>
            </div>
          </div>
        )}

        {/* Live Questions Feed */}
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
      </div>
      <button
        onClick={onAnswer}
        className="shrink-0 flex items-center gap-1 h-9 px-4 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90 transition-colors"
        data-testid={`button-answer-${enquiry.id}`}
      >
        Answer Question
        <ChevronRight size={13} />
      </button>
    </div>
  );
}
