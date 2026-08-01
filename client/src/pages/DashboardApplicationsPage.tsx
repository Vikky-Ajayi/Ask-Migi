import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2, ChevronDown, ChevronUp, ExternalLink, Briefcase, Clock, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  queued: { label: "Queued", color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-900/40" },
  generating_docs: { label: "Generating Docs", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-900/40" },
  applying: { label: "Applying", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/40" },
  submitted: { label: "Submitted", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/40" },
  failed: { label: "Failed", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/40" },
  viewed: { label: "Viewed", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/40" },
  interview: { label: "Interview 🎉", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-100 dark:bg-emerald-900/60" },
  rejected: { label: "Rejected", color: "text-gray-500 dark:text-gray-500", bg: "bg-gray-50 dark:bg-gray-900/40" },
  offer: { label: "Offer! 🏆", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-900/60" },
};

const STATUS_OPTIONS = ["queued", "generating_docs", "applying", "submitted", "failed", "viewed", "interview", "rejected", "offer"];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "text-gray-500", bg: "bg-gray-50" };
  return (
    <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full", cfg.bg, cfg.color)}>
      {cfg.label}
    </span>
  );
}

function ApplicationCard({ app, onStatusUpdate }: { app: any; onStatusUpdate: (id: string, status: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-[var(--th-card)] border border-[var(--th-border)] rounded-xl overflow-hidden">
      <div className="p-4 flex items-start gap-4">
        <div className="w-9 h-9 rounded-lg bg-[var(--th-input)] flex items-center justify-center shrink-0 text-sm font-semibold text-[var(--th-text-50)]">
          {app.job?.company?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="text-sm font-semibold text-[var(--th-text)]">{app.job?.title ?? "Unknown Role"}</h3>
              <p className="text-xs text-[var(--th-text-50)] mt-0.5">{app.job?.company} · {app.job?.location}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={app.status} />
              <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-[var(--th-hover)] rounded transition-colors">
                {expanded ? <ChevronUp size={14} className="text-[var(--th-text-50)]" /> : <ChevronDown size={14} className="text-[var(--th-text-50)]" />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-[10px] text-[var(--th-text-40)] flex items-center gap-1">
              <Clock size={10} />{formatDate(app.createdAt)}
            </span>
            <span className="text-[10px] text-[var(--th-text-40)]">{app.coinsSpent} coins spent</span>
            {app.job?.sourceUrl && (
              <a href={app.job.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-[var(--th-text-50)] hover:text-[var(--th-text)] flex items-center gap-0.5 transition-colors">
                View job <ExternalLink size={9} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Expanded: AI-generated docs + status update */}
      {expanded && (
        <div className="border-t border-[var(--th-border)] px-4 py-4 space-y-4">
          {app.coverLetter && (
            <div>
              <p className="text-xs font-medium text-[var(--th-text-70)] mb-2">AI Cover Letter</p>
              <div className="bg-[var(--th-input)] rounded-lg p-3 text-xs text-[var(--th-text-80)] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                {app.coverLetter}
              </div>
            </div>
          )}
          {app.tailoredCvText && (
            <div>
              <p className="text-xs font-medium text-[var(--th-text-70)] mb-2">Tailored CV Summary</p>
              <div className="bg-[var(--th-input)] rounded-lg p-3 text-xs text-[var(--th-text-80)] leading-relaxed whitespace-pre-wrap">
                {app.tailoredCvText}
              </div>
            </div>
          )}
          {app.failureReason && (
            <div className="bg-red-50 dark:bg-red-950/40 rounded-lg p-3">
              <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Failure reason</p>
              <p className="text-xs text-red-500 dark:text-red-400">{app.failureReason}</p>
            </div>
          )}

          {/* Manual status update */}
          <div>
            <p className="text-xs font-medium text-[var(--th-text-70)] mb-2">Update status manually</p>
            <div className="flex flex-wrap gap-1.5">
              {["viewed", "interview", "rejected", "offer"].map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusUpdate(app.id, s)}
                  disabled={app.status === s}
                  className={cn(
                    "text-[10px] font-medium px-2.5 py-1 rounded-full border transition-all",
                    app.status === s
                      ? "opacity-40 cursor-default"
                      : "hover:bg-[var(--th-card-hover)] border-[var(--th-border)]"
                  )}
                >
                  {STATUS_CONFIG[s]?.label ?? s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DashboardApplicationsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/applications", filter],
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/dashboard/applications/${id}/status`, { status }).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Status updated" });
      qc.invalidateQueries({ queryKey: ["/api/dashboard/applications"] });
    },
    onError: () => toast({ title: "Error", description: "Could not update status.", variant: "destructive" }),
  });

  const apps = data?.applications ?? [];

  const statusGroups = {
    active: apps.filter((a: any) => ["queued", "generating_docs", "applying", "submitted"].includes(a.status)),
    responded: apps.filter((a: any) => ["viewed", "interview", "offer"].includes(a.status)),
    closed: apps.filter((a: any) => ["rejected", "failed"].includes(a.status)),
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--th-text)]">Applications Tracker</h1>
          <p className="text-[var(--th-text-60)] mt-1 text-sm">Track every auto-applied job from queue to offer.</p>
        </div>

        {/* Stats row */}
        {apps.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Active", count: statusGroups.active.length, color: "text-blue-600 dark:text-blue-400" },
              { label: "Responded", count: statusGroups.responded.length, color: "text-purple-600 dark:text-purple-400" },
              { label: "Total", count: apps.length, color: "text-[var(--th-text)]" },
            ].map((s) => (
              <div key={s.label} className="bg-[var(--th-card)] border border-[var(--th-border)] rounded-xl p-4 text-center">
                <p className={cn("text-2xl font-semibold", s.color)}>{s.count}</p>
                <p className="text-xs text-[var(--th-text-50)] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 bg-[var(--th-input)] rounded-xl p-1 w-fit">
          {[["all", "All"], ["active", "Active"], ["interview", "Interviews"], ["offer", "Offers"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-all", filter === val ? "bg-[var(--th-card)] text-[var(--th-text)] shadow-sm" : "text-[var(--th-text-60)] hover:text-[var(--th-text)]")}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Applications list */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 size={24} className="animate-spin text-[var(--th-text-50)]" /></div>
        ) : apps.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={36} className="mx-auto text-[var(--th-text-30)] mb-3" />
            <p className="text-[var(--th-text-60)] text-sm">No applications yet.</p>
            <p className="text-[var(--th-text-40)] text-xs mt-1">Select jobs in the Job Matches page and click Auto-apply.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apps
              .filter((a: any) => {
                if (filter === "all") return true;
                if (filter === "active") return ["queued", "generating_docs", "applying", "submitted"].includes(a.status);
                return a.status === filter;
              })
              .map((app: any) => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  onStatusUpdate={(id, status) => updateMutation.mutate({ id, status })}
                />
              ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return ""; }
}
