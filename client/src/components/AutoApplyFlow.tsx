import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, Loader2, FileText, Send, CheckCircle2, XCircle, Sparkles,
  ArrowRight, ChevronDown,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

export interface AutoApplyJobInput {
  id: string; // application id
  jobId: string;
  status?: string;
  job?: { title: string; company: string };
}

interface TrackedApplication {
  id: string;
  jobId: string;
  status: string;
  tailoredCvText?: string | null;
  coverLetter?: string | null;
  failureReason?: string | null;
  job?: { title: string; company: string };
}

interface AutoApplyFlowProps {
  applications: AutoApplyJobInput[];
  onClose: () => void;
  onViewApplications: () => void;
}

type Stage = "queued" | "generating" | "preview" | "submitting" | "done" | "failed";

const STEP_ORDER: Stage[] = ["queued", "generating", "preview", "submitting", "done"];

const STAGE_META: Record<Stage, { label: string; sub: string }> = {
  queued: { label: "Queued", sub: "Lining up your application…" },
  generating: { label: "Writing your documents", sub: "AI is tailoring a CV summary & cover letter to this role." },
  preview: { label: "Ready to review", sub: "Take a look before it goes out." },
  submitting: { label: "Submitting", sub: "Sending your application…" },
  done: { label: "Applied!", sub: "Your application is in." },
  failed: { label: "Something went wrong", sub: "We couldn't finish this application." },
};

const MIN_SUBMIT_MS = 1100;
const POLL_MS = 1200;

function isTerminal(status: string | undefined) {
  return status === "submitted" || status === "failed";
}

/** Small helper: fetches /api/dashboard/applications/track and polls until every item is terminal. */
function useApplicationTracking(ids: string[]) {
  return useQuery<{ applications: TrackedApplication[] }>({
    queryKey: ["/api/dashboard/applications/track", ids.join(",")],
    queryFn: () => apiRequest("GET", `/api/dashboard/applications/track?ids=${ids.join(",")}`).then((r) => r.json()),
    enabled: ids.length > 0,
    refetchInterval: (query) => {
      const apps = query.state.data?.applications ?? [];
      if (apps.length === 0) return POLL_MS;
      return apps.every((a) => isTerminal(a.status)) ? false : POLL_MS;
    },
    refetchIntervalInBackground: true,
  });
}

export function AutoApplyFlow({ applications, onClose, onViewApplications }: AutoApplyFlowProps) {
  const ids = useMemo(() => applications.map((a) => a.id), [applications]);
  const mode: "single" | "bulk" = applications.length === 1 ? "single" : "bulk";

  const { data } = useApplicationTracking(ids);

  // Merge poll results over the initial props so we always have job title/company even
  // before the first poll resolves.
  const items: TrackedApplication[] = useMemo(() => {
    const polled = new Map((data?.applications ?? []).map((a) => [a.id, a]));
    return applications.map((a) => {
      const p = polled.get(a.id);
      return {
        id: a.id,
        jobId: a.jobId,
        status: p?.status ?? a.status ?? "queued",
        tailoredCvText: p?.tailoredCvText,
        coverLetter: p?.coverLetter,
        failureReason: p?.failureReason,
        job: p?.job ?? a.job,
      };
    });
  }, [applications, data]);

  // Local "confirmed past preview" + "minimum submit dwell" state per application id.
  const [local, setLocal] = useState<Record<string, { confirmed: boolean; settled: boolean }>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => () => { Object.values(timers.current).forEach(clearTimeout); }, []);

  function confirm(id: string) {
    setLocal((prev) => (prev[id]?.confirmed ? prev : { ...prev, [id]: { confirmed: true, settled: false } }));
    if (!timers.current[id]) {
      timers.current[id] = setTimeout(() => {
        setLocal((prev) => ({ ...prev, [id]: { confirmed: true, settled: true } }));
      }, MIN_SUBMIT_MS);
    }
  }

  // Bulk apply auto-advances past the preview gate the moment docs are ready — the user
  // opted into batch automation already, so we don't stop and wait on every single job.
  useEffect(() => {
    if (mode !== "bulk") return;
    for (const item of items) {
      const hasDocs = !!(item.tailoredCvText || item.coverLetter);
      const status = item.status;
      if (hasDocs && (status === "applying" || status === "submitted") && !local[item.id]?.confirmed) {
        confirm(item.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, items]);

  function stageFor(item: TrackedApplication): Stage {
    if (item.status === "failed") return "failed";
    if (!item.status || item.status === "queued") return "queued";
    if (item.status === "generating_docs") return "generating";
    const l = local[item.id];
    if (!l?.confirmed) return "preview";
    if (!l.settled) return "submitting";
    return "done";
  }

  const stages = items.map(stageFor);
  const allDone = stages.length > 0 && stages.every((s) => s === "done" || s === "failed");
  const submittedCount = stages.filter((s) => s === "done").length;
  const failedCount = stages.filter((s) => s === "failed").length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn(
          "w-full bg-[var(--th-card)] border border-[var(--th-border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[88vh]",
          mode === "single" ? "max-w-lg" : "max-w-xl"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--th-border)] shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-[var(--th-text)]">
              {mode === "single" ? "Auto-applying" : `Auto-applying to ${applications.length} jobs`}
            </h2>
            {mode === "bulk" && (
              <p className="text-xs text-[var(--th-text-50)] mt-0.5">
                {submittedCount + failedCount} of {applications.length} processed
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-[var(--th-input)] text-[var(--th-text-50)] hover:text-[var(--th-text)] transition-colors"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto">
          {mode === "single" ? (
            <SingleFlow item={items[0]} stage={stages[0]} onConfirm={() => confirm(items[0].id)} />
          ) : (
            <BulkFlow items={items} stages={stages} />
          )}
        </div>

        {/* Footer */}
        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-[var(--th-border)] px-5 py-4 flex items-center gap-2.5 shrink-0"
            >
              <button
                onClick={onViewApplications}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0f0f11] dark:bg-white text-white dark:text-black text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
              >
                View in Applications <ArrowRight size={14} />
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 border border-[var(--th-border)] text-[var(--th-text)] text-sm font-medium rounded-xl hover:bg-[var(--th-hover)] transition-colors"
              >
                Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ── Single-job flow ─────────────────────────────────────────────────────── */

function SingleFlow({ item, stage, onConfirm }: { item: TrackedApplication; stage: Stage; onConfirm: () => void }) {
  const stepIndex = stage === "failed" ? -1 : STEP_ORDER.indexOf(stage);

  return (
    <div className="px-5 sm:px-7 py-7">
      {item.job && (
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[var(--th-input)] flex items-center justify-center text-sm font-semibold text-[var(--th-text-50)] shrink-0">
            {item.job.company?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--th-text)] truncate">{item.job.title}</p>
            <p className="text-xs text-[var(--th-text-50)] truncate">{item.job.company}</p>
          </div>
        </div>
      )}

      {/* Stepper */}
      {stage !== "failed" && (
        <div className="flex items-center gap-1.5 mb-8">
          {STEP_ORDER.map((s, i) => (
            <div key={s} className="flex-1 h-1.5 rounded-full bg-[var(--th-input)] overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500"
                initial={false}
                animate={{ width: i <= stepIndex ? "100%" : "0%" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Icon + label */}
      <div className="flex flex-col items-center text-center mb-2">
        <StageIcon stage={stage} />
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="mt-4"
          >
            <p className="text-base font-semibold text-[var(--th-text)]">
              {stage === "failed" ? STAGE_META.failed.label : STAGE_META[stage].label}
            </p>
            <p className="text-sm text-[var(--th-text-50)] mt-1 max-w-xs mx-auto">
              {stage === "failed" ? (item.failureReason || STAGE_META.failed.sub) : STAGE_META[stage].sub}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Preview */}
      <AnimatePresence>
        {stage === "preview" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 space-y-4"
          >
            <DocPreview label="AI Cover Letter" text={item.coverLetter} delay={0.05} />
            <DocPreview label="Tailored CV Summary" text={item.tailoredCvText} delay={0.15} />
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              onClick={onConfirm}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#0f0f11] dark:bg-white text-white dark:text-black text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              <Send size={14} /> Looks good — submit application
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DocPreview({ label, text, delay }: { label: string; text?: string | null; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <p className="text-xs font-medium text-[var(--th-text-70)] mb-2">{label}</p>
      <div className="bg-[var(--th-input)] rounded-lg p-3 text-xs text-[var(--th-text-80)] leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto">
        {text || "…"}
      </div>
    </motion.div>
  );
}

/* ── Bulk flow ────────────────────────────────────────────────────────────── */

function BulkFlow({ items, stages }: { items: TrackedApplication[]; stages: Stage[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const total = items.length;
  const done = stages.filter((s) => s === "done").length;
  const failed = stages.filter((s) => s === "failed").length;

  return (
    <div className="px-4 sm:px-5 py-5">
      <div className="h-1.5 rounded-full bg-[var(--th-input)] overflow-hidden mb-5">
        <motion.div
          className="h-full bg-emerald-500"
          initial={false}
          animate={{ width: `${((done + failed) / total) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <BulkRow
            key={item.id}
            item={item}
            stage={stages[i]}
            expanded={expanded === item.id}
            onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
          />
        ))}
      </div>
    </div>
  );
}

function BulkRow({ item, stage, expanded, onToggle }: { item: TrackedApplication; stage: Stage; expanded: boolean; onToggle: () => void }) {
  const hasDocs = !!(item.tailoredCvText || item.coverLetter);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--th-input)] border border-[var(--th-border)] rounded-xl overflow-hidden"
    >
      <button onClick={onToggle} disabled={!hasDocs && stage !== "failed"} className="w-full flex items-center gap-3 p-3 text-left">
        <div className="w-8 h-8 rounded-lg bg-[var(--th-card)] flex items-center justify-center text-xs font-semibold text-[var(--th-text-50)] shrink-0">
          {item.job?.company?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[var(--th-text)] truncate">{item.job?.title ?? "Loading…"}</p>
          <p className="text-[11px] text-[var(--th-text-50)] truncate">{item.job?.company}</p>
        </div>
        <RowStatus stage={stage} />
        {(hasDocs || stage === "failed") && (
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} className="text-[var(--th-text-40)]" />
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 pb-3 space-y-3"
          >
            {stage === "failed" ? (
              <p className="text-xs text-red-500 dark:text-red-400">{item.failureReason || "Unknown error."}</p>
            ) : (
              <>
                <DocPreview label="AI Cover Letter" text={item.coverLetter} delay={0} />
                <DocPreview label="Tailored CV Summary" text={item.tailoredCvText} delay={0} />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RowStatus({ stage }: { stage: Stage }) {
  if (stage === "done") {
    return (
      <motion.span initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-emerald-500 shrink-0">
        <CheckCircle2 size={16} />
      </motion.span>
    );
  }
  if (stage === "failed") {
    return (
      <span className="text-red-500 shrink-0">
        <XCircle size={16} />
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 shrink-0">
      <span className="text-[10px] font-medium text-[var(--th-text-40)] hidden sm:inline">{STAGE_META[stage].label}</span>
      <Loader2 size={14} className="animate-spin text-[var(--th-text-40)]" />
    </span>
  );
}

/* ── Stage icon (center, single-job flow) ────────────────────────────────── */

function StageIcon({ stage }: { stage: Stage }) {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {stage === "queued" && (
          <motion.div key="queued" {...iconMotion} className="text-[var(--th-text-40)]">
            <PulseRing />
            <Loader2 size={26} className="animate-spin relative" />
          </motion.div>
        )}
        {stage === "generating" && (
          <motion.div key="generating" {...iconMotion} className="text-blue-500 relative">
            <PulseRing color="rgb(59 130 246)" />
            <motion.div
              animate={{ rotate: [0, -8, 8, -8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <FileText size={26} />
            </motion.div>
            <motion.span
              className="absolute -top-1 -right-1"
              animate={{ scale: [0.8, 1.15, 0.8], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            >
              <Sparkles size={13} className="text-blue-400" />
            </motion.span>
          </motion.div>
        )}
        {stage === "preview" && (
          <motion.div key="preview" {...iconMotion} className="text-purple-500">
            <FileText size={26} />
          </motion.div>
        )}
        {stage === "submitting" && (
          <motion.div key="submitting" {...iconMotion} className="text-blue-500 relative">
            <PulseRing color="rgb(59 130 246)" />
            <motion.div
              className="relative"
              animate={{ x: [0, 3, 0], y: [0, -3, 0] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
            >
              <Send size={26} />
            </motion.div>
          </motion.div>
        )}
        {stage === "done" && (
          <motion.div key="done" {...iconMotion} className="text-emerald-500 relative">
            <SuccessBurst />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <CheckCircle2 size={30} />
            </motion.div>
          </motion.div>
        )}
        {stage === "failed" && (
          <motion.div key="failed" {...iconMotion} className="text-red-500">
            <XCircle size={28} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const iconMotion = {
  initial: { opacity: 0, scale: 0.6 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.6 },
  transition: { duration: 0.25, ease: "easeOut" as const },
};

function PulseRing({ color = "currentColor" }: { color?: string }) {
  return (
    <motion.span
      className="absolute inset-0 rounded-full"
      style={{ border: `2px solid ${color}` }}
      animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
    />
  );
}

/** Tiny confetti-style burst for the success state — hand-rolled with framer-motion since
 *  no Lottie asset is bundled in this app (no network fetch of third-party animation files). */
function SuccessBurst() {
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        const dist = 26 + Math.random() * 18;
        return {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          rotate: Math.random() * 360,
          color: ["#10b981", "#34d399", "#a78bfa", "#f59e0b", "#60a5fa"][i % 5],
        };
      }),
    []
  );

  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-sm"
          style={{ backgroundColor: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
