import { useState, useEffect } from "react";
import { X, Phone, Calendar, CheckCircle2, ExternalLink, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const CALL_COST = 30;
const CALENDLY_URL = import.meta.env.VITE_CALENDLY_LINK as string | undefined;

type Step = "reason" | "calendly" | "success";

export function CallExpertModal({ onClose }: { onClose: () => void }) {
  const { user, refreshUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>("reason");
  const [reason, setReason] = useState("");


  const bookMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/call-bookings", { reason });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to confirm booking");
      }
      return res.json();
    },
    onSuccess: async () => {
      await refreshUser();
      qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setStep("success");
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md bg-th-sidebar rounded-3xl px-6 pt-6 pb-8 border border-th-border-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-[#22c55e]/15 flex items-center justify-center">
                <Phone size={16} className="text-[#22c55e]" />
              </div>
              <h2 className="text-base font-semibold text-th-text">Call an Expert</h2>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-full bg-th-close text-th-text-60 hover:text-th-text transition-colors"
              data-testid="button-close-call-modal"
            >
              <X size={15} />
            </button>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-1.5 mb-6">
            {(["reason", "calendly", "success"] as Step[]).map((s, i) => (
              <div
                key={s}
                className={`h-1 rounded-full flex-1 transition-colors ${
                  s === step
                    ? "bg-[#22c55e]"
                    : i < (["reason", "calendly", "success"] as Step[]).indexOf(step)
                    ? "bg-[#22c55e]/40"
                    : "bg-white/10"
                }`}
              />
            ))}
          </div>

          {/* ── Step 1: Reason ─────────────────────────────── */}
          {step === "reason" && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm font-medium text-th-text mb-1">Describe your session</p>
                <p className="text-xs text-th-text-40 leading-5 mb-3">
                  This costs <span className="text-[#22c55e] font-semibold">{CALL_COST} coins</span> and will be deducted when you confirm your booking.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-th-text-60">Reason for your call</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="To help your coach give you the best support, please provide a detailed description of what you would like to discuss during your session, including any career or job search questions you want answered or areas where you need guidance"
                  rows={5}
                  className="w-full rounded-xl bg-th-card-alt border border-th-border-md px-4 py-3 text-sm text-th-text placeholder:text-th-text-30 focus:border-th-border-strong focus:outline-none resize-none leading-5"
                  data-testid="textarea-call-reason"
                />
                <p className="text-xs text-th-text-30">{reason.length} characters</p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center gap-1.5 text-xs text-th-text-40">
                  <span className="inline-block h-4 w-4 rounded-full bg-[#22c55e]/15 text-[#22c55e] flex items-center justify-center text-[10px] font-bold">✓</span>
                  {CALL_COST} coins
                </div>
                <span className="text-th-text-20">·</span>
                <span className="text-xs text-th-text-40">Mon–Fri, 9am–6pm (UK time)</span>
              </div>

              <button
                onClick={() => setStep("calendly")}
                disabled={reason.trim().length < 20}
                className="w-full h-11 rounded-full bg-[#22c55e] text-black font-semibold text-sm hover:bg-[#16a34a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="button-continue-to-calendly"
              >
                Continue
                <ArrowRight size={15} />
              </button>
            </div>
          )}

          {/* ── Step 2: Calendly ───────────────────────────── */}
          {step === "calendly" && (
            <div className="flex flex-col gap-4">
              <div className="bg-th-card-alt border border-th-border-md rounded-2xl p-4">
                <p className="text-xs text-th-text-40 uppercase tracking-wide mb-1.5">Your reason</p>
                <p className="text-sm text-th-text leading-relaxed line-clamp-3">{reason}</p>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-sm text-th-text font-medium">Book your slot via Calendly</p>
                <p className="text-xs text-th-text-40 leading-5">
                  Click the link below to choose a time that works for you, then come back and confirm your booking. Your {CALL_COST} coins will be deducted once you confirm.
                </p>

                {CALENDLY_URL ? (
                  <a
                    href={CALENDLY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full px-5 py-4 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30 hover:bg-[#22c55e]/20 transition-colors"
                    data-testid="link-calendly"
                  >
                    <Calendar size={18} className="text-[#22c55e] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-th-text">Open Calendly</p>
                      <p className="text-xs text-th-text-40 truncate">{CALENDLY_URL}</p>
                    </div>
                    <ExternalLink size={14} className="text-th-text-30 shrink-0" />
                  </a>
                ) : (
                  <div className="flex items-center gap-3 w-full px-5 py-4 rounded-2xl bg-amber-950/40 border border-amber-800/30">
                    <p className="text-xs text-amber-400">Calendly link not configured yet. Please contact support to book your call.</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setStep("reason")}
                  className="flex-1 h-11 rounded-full border border-th-border-strong text-th-text-60 hover:text-th-text text-sm font-medium transition-colors"
                  data-testid="button-back-to-reason"
                >
                  Back
                </button>
                <button
                  onClick={() => bookMutation.mutate()}
                  disabled={bookMutation.isPending}
                  className="flex-1 h-11 rounded-full bg-[#22c55e] text-black font-semibold text-sm hover:bg-[#16a34a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  data-testid="button-confirm-booking"
                >
                  {bookMutation.isPending ? "Confirming…" : "Confirm booking"}
                </button>
              </div>

              <p className="text-center text-xs text-th-text-30">
                {CALL_COST} coins will be deducted from your account
              </p>
            </div>
          )}

          {/* ── Step 3: Success ────────────────────────────── */}
          {step === "success" && (
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="h-16 w-16 rounded-full bg-[#22c55e]/15 flex items-center justify-center">
                <CheckCircle2 size={30} className="text-[#22c55e]" />
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-th-text mb-1">Booking confirmed!</p>
                <p className="text-sm text-th-text-50 leading-5">
                  Your call has been scheduled. {CALL_COST} coins have been deducted from your account.
                </p>
              </div>
              <div className="w-full bg-th-card-alt border border-th-border-md rounded-2xl p-4">
                <p className="text-xs text-th-text-40 mb-1">Your reason</p>
                <p className="text-sm text-th-text leading-relaxed">{reason}</p>
              </div>
              <button
                onClick={onClose}
                className="w-full h-11 rounded-full bg-[#22c55e] text-black font-semibold text-sm hover:bg-[#16a34a] transition-colors"
                data-testid="button-close-success"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
