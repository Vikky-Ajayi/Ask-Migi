import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearch, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { ExpertLayout } from "@/components/ExpertLayout";
import { ChevronRight, Info, Eye, Send, Pencil, Camera, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type View = "dashboard" | "answer" | "preview";

export const ExpertDashboardPage = () => {
  const { user, refreshUser } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [view, setView] = useState<View>("dashboard");
  const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
  const [answerText, setAnswerText] = useState("");
  const [magicLoading, setMagicLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const search = useSearch();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          toast({ title: "Access denied", description: data.message || "This link is invalid.", variant: "destructive" });
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
      const res = await fetch("/api/expert/questions", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user && !magicLoading,
    refetchInterval: 15000,
  });

  const { data: answeredQuestions = [], isLoading: aLoading } = useQuery<any[]>({
    queryKey: ["/api/expert/answered"],
    queryFn: async () => {
      const token = localStorage.getItem("askmigi_token");
      const res = await fetch("/api/expert/answered", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user && !magicLoading,
    refetchInterval: 30000,
  });

  const answerMutation = useMutation({
    mutationFn: async ({ id, answer, isEdit }: { id: string; answer: string; isEdit?: boolean }) => {
      const token = localStorage.getItem("askmigi_token");
      const res = await fetch(`/api/expert/questions/${id}/answer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answer, isEdit }),
      });
      if (!res.ok) throw new Error("Failed to submit answer");
      return res.json();
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["/api/expert/questions"] });
      qc.invalidateQueries({ queryKey: ["/api/expert/answered"] });
      toast({
        title: vars.isEdit ? "Response updated!" : "Response sent!",
        description: vars.isEdit ? "The user will see the updated response." : "Your answer has been sent to the user.",
      });
      setView("dashboard");
      setSelectedEnquiry(null);
      setAnswerText("");
      setIsEditMode(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send response. Please try again.", variant: "destructive" });
    },
  });

  const picMutation = useMutation({
    mutationFn: async (imageData: string) => {
      const res = await apiRequest("POST", "/api/expert/profile-pic", { imageData });
      return res.json();
    },
    onSuccess: async () => {
      await refreshUser();
      toast({ title: "Profile photo updated!" });
    },
    onError: () => {
      toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" });
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Please use an image under 2MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      picMutation.mutate(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const pendingCount = questions.length;

  const handleAnswerQuestion = (enquiry: any, editMode = false) => {
    setSelectedEnquiry(enquiry);
    setAnswerText(enquiry.answer || "");
    setIsEditMode(editMode);
    setView("answer");
  };

  const handleSendAnswer = () => {
    if (!answerText.trim() || !selectedEnquiry) return;
    answerMutation.mutate({ id: selectedEnquiry.id, answer: answerText, isEdit: isEditMode });
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
          <button onClick={() => setView("answer")} className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-5">
            ← Back to Edit
          </button>
          <div className="bg-[#1e2022] border border-[#2e3032] rounded-2xl p-5 mb-4">
            <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Question from User</p>
            <p className="text-base text-white leading-relaxed">{selectedEnquiry.question}</p>
            {selectedEnquiry.country && <p className="text-xs text-white/40 mt-3">📍 {selectedEnquiry.country}</p>}
          </div>
          <div className="bg-[#1e2022] border border-[#2e3032] rounded-2xl p-5 mb-6">
            <p className="text-xs text-white/40 uppercase tracking-wide mb-3">Your Response (Preview)</p>
            {answerText.split("\n\n").map((para, i) => (
              <p key={i} className="text-sm text-white/80 leading-6 mb-3 last:mb-0">{para}</p>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setView("answer")} className="h-10 px-5 rounded-full border border-white/20 text-white/70 hover:text-white text-sm font-medium transition-colors">
              Edit Response
            </button>
            <button
              onClick={handleSendAnswer}
              disabled={answerMutation.isPending}
              className="h-10 px-6 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              data-testid="button-confirm-send"
            >
              <Send size={14} />
              {answerMutation.isPending ? "Saving…" : isEditMode ? "Save Changes" : "Send to User"}
            </button>
          </div>
        </div>
      </ExpertLayout>
    );
  }

  if (view === "answer" && selectedEnquiry) {
    return (
      <ExpertLayout title={isEditMode ? "Edit Sent Response" : "Edit Response"} pendingCount={pendingCount}>
        <div className="px-4 md:px-8 py-6 max-w-2xl">
          <button onClick={() => { setView("dashboard"); setSelectedEnquiry(null); }} className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-5">
            ← Back to Dashboard
          </button>
          <div className="bg-[#1e2022] border border-[#2e3032] rounded-2xl p-5 mb-4">
            <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Question</p>
            <p className="text-base text-white leading-relaxed">{selectedEnquiry.question}</p>
            {selectedEnquiry.country && <p className="text-xs text-white/40 mt-3">📍 {selectedEnquiry.country}</p>}
            {selectedEnquiry.attachment && selectedEnquiry.attachmentName && (
              <div className="mt-4 pt-4 border-t border-white/8">
                <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Attached File</p>
                <a
                  href={selectedEnquiry.attachment}
                  download={selectedEnquiry.attachmentName}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/8 border border-white/15 text-xs text-white/70 hover:text-white hover:bg-white/12 transition-colors"
                >
                  📎 {selectedEnquiry.attachmentName}
                </a>
              </div>
            )}
          </div>
          {isEditMode && (
            <div className="bg-[#2a1a0d] border border-[#5a3a1a] rounded-2xl p-4 mb-4 flex items-start gap-3">
              <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300/80 leading-5">You're editing a sent response. The user will see the updated version immediately. No notification email will be sent.</p>
            </div>
          )}
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
                Preview & {isEditMode ? "Save" : "Send"}
              </button>
            </div>
          </div>
        </div>
      </ExpertLayout>
    );
  }

  return (
    <ExpertLayout title="Career Expert Dashboard" pendingCount={pendingCount}>
      <div className="px-4 md:px-8 py-6 flex flex-col gap-8">

        {/* ── Profile Photo ─────────────────────────────────────────────── */}
        <div className="bg-[#1e2022] border border-[#2e3032] rounded-2xl p-5">
          <h2 className="text-sm font-bold text-white mb-4">Your Profile Photo</h2>
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              {user?.profilePic ? (
                <img
                  src={user.profilePic}
                  alt="Profile"
                  className="h-16 w-16 rounded-full object-cover border-2 border-white/20"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-[#242628] border-2 border-[#3a3c3e] flex items-center justify-center text-xl font-bold text-white">
                  {user?.firstName?.[0] ?? "E"}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={picMutation.isPending}
                className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 transition-colors"
                data-testid="button-upload-pic"
              >
                <Camera size={12} />
              </button>
            </div>
            <div>
              <p className="text-sm text-white font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-white/40 mt-0.5">This photo appears next to your expert responses</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={picMutation.isPending}
                className="mt-2 text-xs text-white/60 hover:text-white underline underline-offset-2 transition-colors"
                data-testid="button-change-photo"
              >
                {picMutation.isPending ? "Uploading…" : user?.profilePic ? "Change photo" : "Upload photo"}
              </button>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>

        {/* ── Pending Questions ─────────────────────────────────────────── */}
        <div>
          <h2 className="text-base font-bold text-white mb-3">Live Questions Feed</h2>
          {qLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((n) => <div key={n} className="h-20 rounded-2xl bg-[#1e2022] animate-pulse" />)}
            </div>
          ) : questions.length === 0 ? (
            <div className="bg-[#1e2022] border border-[#2e3032] rounded-2xl py-12 flex flex-col items-center gap-2 text-center">
              <p className="text-white/40 text-sm">No pending questions at the moment.</p>
              <p className="text-white/25 text-xs">Check back later for new questions from users.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {questions.map((q: any) => (
                <QuestionCard key={q.id} enquiry={q} onAnswer={() => handleAnswerQuestion(q, false)} />
              ))}
            </div>
          )}
        </div>

        {/* ── Sent Answers (edit history) ───────────────────────────────── */}
        <div>
          <h2 className="text-base font-bold text-white mb-3">Sent Responses</h2>
          {aLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map((n) => <div key={n} className="h-20 rounded-2xl bg-[#1e2022] animate-pulse" />)}
            </div>
          ) : answeredQuestions.length === 0 ? (
            <div className="bg-[#1e2022] border border-[#2e3032] rounded-2xl py-8 flex flex-col items-center gap-1 text-center">
              <p className="text-white/40 text-sm">No sent responses yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {answeredQuestions.map((q: any) => (
                <AnsweredCard key={q.id} enquiry={q} onEdit={() => handleAnswerQuestion(q, true)} />
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
    <div className="bg-[#1e2022] border border-[#2e3032] rounded-2xl px-5 py-4 flex items-start justify-between gap-4" data-testid={`card-question-${enquiry.id}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white leading-relaxed line-clamp-2">{enquiry.question}</p>
        {enquiry.country && <p className="text-xs text-white/35 mt-1.5">📍 {enquiry.country}</p>}
        {enquiry.status === "ai_draft" && (
          <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">AI draft ready</span>
        )}
      </div>
      <button onClick={onAnswer} className="shrink-0 flex items-center gap-1 h-9 px-4 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90 transition-colors" data-testid={`button-answer-${enquiry.id}`}>
        Review & Send <ChevronRight size={13} />
      </button>
    </div>
  );
}

function AnsweredCard({ enquiry, onEdit }: { enquiry: any; onEdit: () => void }) {
  const editedAt = enquiry.answerEditedAt ? new Date(enquiry.answerEditedAt) : null;
  return (
    <div className="bg-[#1e2022] border border-[#2e3032] rounded-2xl px-5 py-4 flex items-start justify-between gap-4" data-testid={`card-answered-${enquiry.id}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
          <span className="text-[10px] font-semibold text-emerald-400">Answered</span>
          {editedAt && <span className="text-[10px] text-white/30">· Edited {editedAt.toLocaleDateString()}</span>}
        </div>
        <p className="text-sm text-white leading-relaxed line-clamp-2">{enquiry.question}</p>
        {enquiry.answer && (
          <p className="text-xs text-white/40 mt-1.5 line-clamp-1 italic">{enquiry.answer.slice(0, 80)}…</p>
        )}
      </div>
      <button onClick={onEdit} className="shrink-0 flex items-center gap-1 h-9 px-4 rounded-full border border-white/20 text-white/70 hover:text-white text-xs font-medium hover:bg-white/5 transition-colors" data-testid={`button-edit-${enquiry.id}`}>
        <Pencil size={12} />
        Edit
      </button>
    </div>
  );
}
