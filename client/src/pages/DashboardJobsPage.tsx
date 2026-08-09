import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Briefcase, MapPin, ExternalLink, Search, Loader2, Coins, Clock, Building2, Wifi, CheckSquare, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

const SOURCES = ["All", "linkedin", "reed", "remotive", "weworkremotely", "greenhouse", "himalayas", "adzuna"];
const WORK_TYPES = ["All", "remote", "hybrid", "onsite"];
const CONTRACT_TYPES = ["All", "full_time", "part_time", "contract", "freelance"];

function isJobsQuery(query: any) {
  return String(query.queryKey[0] ?? "").startsWith("/api/dashboard/jobs");
}

function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    linkedin: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400",
    reed: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400",
    remotive: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
    weworkremotely: "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400",
    greenhouse: "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400",
    himalayas: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400",
    adzuna: "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400",
  };
  return (
    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", colors[source] ?? "bg-[var(--th-input)] text-[var(--th-text-60)]")}>
      {source}
    </span>
  );
}

function JobCard({ job, selected, onToggle, onApply, onView }: { job: any; selected: boolean; onToggle: () => void; onApply: () => void; onView: () => void }) {
  const salary = job.salaryMin || job.salaryMax
    ? `${job.currency ?? "£"}${job.salaryMin ? Math.round(job.salaryMin / 1000) + "k" : ""}${job.salaryMax ? `–${Math.round(job.salaryMax / 1000)}k` : "+"}`
    : null;

  return (
    <div className={cn(
      "bg-[var(--th-card)] border rounded-xl p-4 transition-all",
      selected ? "border-[#0f0f11] dark:border-white" : "border-[var(--th-border)] hover:border-[var(--th-border-md)]"
    )}>
      <div className="flex items-start gap-3">
        <button onClick={onToggle} className={cn(
          "mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors",
          selected ? "bg-[#0f0f11] dark:bg-white border-transparent" : "border-[var(--th-border-md)] hover:border-[var(--th-border-strong)]"
        )}>
          {selected && <CheckSquare size={11} className="text-white dark:text-black" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
            <h3 className="text-sm font-semibold text-[var(--th-text)] leading-tight">{job.title}</h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <SourceBadge source={job.source} />
              {job.matchScore !== undefined && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                  {Math.round(job.matchScore * 100)}% match
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--th-text-50)] mb-2 flex-wrap">
            <span className="flex items-center gap-1"><Building2 size={11} />{job.company}</span>
            {job.location && <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>}
            {job.isRemote && <span className="flex items-center gap-1"><Wifi size={11} />Remote</span>}
            {salary && <span className="font-medium text-[var(--th-text-70)]">{salary}</span>}
            {job.postedAt && <span className="flex items-center gap-1"><Clock size={11} />{formatRelativeDate(job.postedAt)}</span>}
          </div>
          {job.description && (
            <p className="text-xs text-[var(--th-text-60)] line-clamp-2 mb-3">{cleanJobText(job.description)}</p>
          )}
          <div className="flex items-center gap-3">
            <button onClick={onView} className="inline-flex items-center gap-1 text-xs font-medium text-[var(--th-text-60)] hover:text-[var(--th-text)] transition-colors">
              View details <ExternalLink size={10} />
            </button>
            <button
              onClick={onApply}
              className="text-xs font-medium text-[#0f0f11] dark:text-white hover:underline transition-colors flex items-center gap-1"
            >
              <Coins size={10} />Auto-apply (5 coins)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardJobsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [source, setSource] = useState("All");
  const [workType, setWorkType] = useState("All");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [useMatching, setUseMatching] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewingJob, setViewingJob] = useState<any | null>(null);
  const [page, setPage] = useState(1);

  const { data: profile } = useQuery<any>({ queryKey: ["/api/dashboard/profile"], retry: false });

  const matchMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/dashboard/jobs/match").then(r => r.json()),
    onSuccess: () => {
      setUseMatching(true);
      qc.invalidateQueries({ predicate: isJobsQuery });
      toast({ title: "Matched!", description: "Jobs ranked by relevance to your profile. (1 coin deducted)" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message ?? "Could not run matching.", variant: "destructive" }),
  });

  const applyMutation = useMutation({
    mutationFn: (jobIds: string[]) => apiRequest("POST", "/api/dashboard/jobs/apply", { jobIds }).then(r => r.json()),
    onSuccess: (data: any) => {
      if (data.queued > 0) {
        toast({ title: "Applications queued!", description: `${data.queued} application(s) queued. Generating tailored documents...` });
      } else {
        toast({ title: "Already queued", description: data.message ?? "This job is already in your applications tracker." });
      }
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["/api/dashboard/applications"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message ?? "Could not queue applications.", variant: "destructive" }),
  });

  const refreshMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/dashboard/jobs/refresh").then(r => r.json()),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ predicate: isJobsQuery });
      toast({
        title: "Jobs refreshed",
        description: data.total > 0 ? `${data.total.toLocaleString()} job(s) are now available.` : "No jobs were found from the sources yet.",
      });
    },
    onError: (err: any) => toast({
      title: "Refresh failed",
      description: err.message ?? "Could not refresh jobs right now.",
      variant: "destructive",
    }),
  });

  const params = new URLSearchParams({
    page: page.toString(),
    limit: "20",
    ...(search && { q: search }),
    ...(source !== "All" && { source }),
    ...(workType !== "All" && { workType }),
    ...(remoteOnly && { remote: "true" }),
    ...(useMatching && { matched: "true" }),
  });
  const jobsUrl = `/api/dashboard/jobs?${params.toString()}`;

  const { data, isLoading, isError } = useQuery<any>({
    queryKey: [jobsUrl],
    retry: false,
  });

  const jobs = data?.jobs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  function toggleSelect(jobId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(jobId) ? next.delete(jobId) : next.add(jobId);
      return next;
    });
  }

  function handleApply(jobId?: string) {
    const ids = jobId ? [jobId] : Array.from(selected);
    if (ids.length === 0) return;
    if (!profile?.cvText) {
      toast({ title: "Profile incomplete", description: "Please upload your CV in your profile first.", variant: "destructive" });
      return;
    }
    const coinCost = ids.length * 5;
    applyMutation.mutate(ids);
    toast({ title: `Applying to ${ids.length} job(s)`, description: `${coinCost} coins will be deducted.` });
  }

  if (viewingJob) {
    return (
      <DashboardLayout>
        <JobDetailsPage
          job={viewingJob}
          onBack={() => setViewingJob(null)}
          onApply={() => handleApply(viewingJob.id)}
          applying={applyMutation.isPending}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--th-text)]">Job Matches</h1>
            <p className="text-[var(--th-text-60)] mt-1 text-sm">Jobs scraped from LinkedIn, Reed, Remotive, Greenhouse and more.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 border border-[var(--th-border)] bg-[var(--th-card)] text-[var(--th-text)] text-sm font-medium rounded-xl hover:bg-[var(--th-hover)] transition-colors disabled:opacity-50"
            >
              {refreshMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Refresh jobs
            </button>
            {profile?.profileComplete && (
              <button
                onClick={() => matchMutation.mutate()}
                disabled={matchMutation.isPending}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#0f0f11] dark:bg-white text-white dark:text-black text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {matchMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Coins size={14} />}
                {useMatching ? "Re-match (1 coin)" : "Match to profile (1 coin)"}
              </button>
            )}
            {selected.size > 0 && (
              <button
                onClick={() => handleApply()}
                disabled={applyMutation.isPending}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {applyMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Briefcase size={14} />}
                Auto-apply to {selected.size} ({selected.size * 5} coins)
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        {total > 0 && <p className="mb-5 text-sm text-[var(--th-text-60)]"><span className="font-medium text-[var(--th-text)]">{total.toLocaleString()}</span> jobs in database</p>}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex-1 min-w-48 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--th-text-40)]" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search jobs, companies..."
              className="w-full pl-9 pr-3 py-2.5 bg-[var(--th-input)] border border-[var(--th-border)] rounded-xl text-sm text-[var(--th-text)] placeholder:text-[var(--th-text-40)] focus:outline-none focus:ring-1 focus:ring-[var(--th-border-strong)]"
            />
          </div>
          <select value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }}
            className="bg-[var(--th-input)] border border-[var(--th-border)] rounded-xl px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none">
            {SOURCES.map((s) => <option key={s} value={s}>{s === "All" ? "All sources" : s}</option>)}
          </select>
          <select value={workType} onChange={(e) => { setWorkType(e.target.value); setPage(1); }}
            className="bg-[var(--th-input)] border border-[var(--th-border)] rounded-xl px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none">
            {WORK_TYPES.map((t) => <option key={t} value={t}>{t === "All" ? "Any work type" : t}</option>)}
          </select>
          <button onClick={() => { setRemoteOnly(!remoteOnly); setPage(1); }}
            className={cn("px-3 py-2.5 rounded-xl text-sm border transition-all", remoteOnly ? "bg-blue-600 text-white border-blue-600" : "bg-[var(--th-input)] text-[var(--th-text-70)] border-[var(--th-border)]")}>
            Remote only
          </button>
        </div>

        {/* Jobs list */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 size={24} className="animate-spin text-[var(--th-text-50)]" /></div>
        ) : isError ? (
          <div className="text-center py-16">
            <Briefcase size={36} className="mx-auto text-[var(--th-text-30)] mb-3" />
            <p className="text-[var(--th-text-60)] text-sm">Could not load jobs.</p>
            <button
              onClick={() => qc.invalidateQueries({ predicate: isJobsQuery })}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[var(--th-border)] px-4 py-2 text-sm text-[var(--th-text)] hover:bg-[var(--th-hover)]"
            >
              <RefreshCw size={14} />
              Try again
            </button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase size={36} className="mx-auto text-[var(--th-text-30)] mb-3" />
            <p className="text-[var(--th-text-60)] text-sm">No jobs found. Try different filters.</p>
            <p className="text-[var(--th-text-40)] text-xs mt-1">Run a refresh to fetch the latest jobs from configured sources.</p>
            <button
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0f0f11] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {refreshMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Refresh jobs
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {jobs.map((job: any) => (
                <JobCard
                  key={job.id}
                  job={job}
                  selected={selected.has(job.id)}
                  onToggle={() => toggleSelect(job.id)}
                  onApply={() => handleApply(job.id)}
                  onView={() => setViewingJob(job)}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-4 py-2 text-sm bg-[var(--th-input)] border border-[var(--th-border)] rounded-lg disabled:opacity-40 hover:bg-[var(--th-card-hover)]">Previous</button>
                <span className="text-sm text-[var(--th-text-60)]">Page {page} of {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-4 py-2 text-sm bg-[var(--th-input)] border border-[var(--th-border)] rounded-lg disabled:opacity-40 hover:bg-[var(--th-card-hover)]">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function JobDetailsPage({ job, onBack, onApply, applying }: { job: any; onBack: () => void; onApply: () => void; applying: boolean }) {
  const salary = job.salaryMin || job.salaryMax
    ? `${job.currency ?? "GBP"} ${job.salaryMin ? job.salaryMin.toLocaleString() : ""}${job.salaryMax ? ` - ${job.salaryMax.toLocaleString()}` : "+"}`
    : "Not listed";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-2 rounded-xl border border-[var(--th-border)] px-4 py-2 text-sm font-medium text-[var(--th-text)] hover:bg-[var(--th-hover)]"
      >
        <ArrowLeft size={16} />
        Back to jobs
      </button>

      <div className="rounded-xl border border-[var(--th-border)] bg-[var(--th-card)]">
        <div className="border-b border-[var(--th-border)] p-5 md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <SourceBadge source={job.source} />
                {job.postedAt && (
                  <span className="rounded-full bg-[var(--th-input)] px-2.5 py-1 text-xs text-[var(--th-text-60)]">
                    {formatRelativeDate(job.postedAt)}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-semibold leading-tight text-[var(--th-text)] md:text-3xl">{job.title}</h1>
              <p className="mt-2 text-base text-[var(--th-text-60)]">{job.company}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <button
                onClick={onApply}
                disabled={applying}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0f0f11] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {applying ? <Loader2 size={14} className="animate-spin" /> : <Coins size={14} />}
                Auto-apply (5 coins)
              </button>
              {job.sourceUrl && (
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--th-border)] px-4 py-2.5 text-sm font-medium text-[var(--th-text)] hover:bg-[var(--th-hover)]"
                >
                  Open original <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-7 p-5 md:p-7 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-3">
            <DetailItem icon={<Building2 size={15} />} label="Company" value={job.company || "Not listed"} />
            <DetailItem icon={<MapPin size={15} />} label="Location" value={job.location || "Not listed"} />
            <DetailItem icon={<Wifi size={15} />} label="Work type" value={job.workType || (job.isRemote ? "Remote" : "Not listed")} />
            <DetailItem icon={<Briefcase size={15} />} label="Contract" value={job.contractType ? job.contractType.replace("_", " ") : "Not listed"} />
            <DetailItem icon={<Coins size={15} />} label="Salary" value={salary} />
            <DetailItem icon={<Clock size={15} />} label="Posted" value={job.postedAt ? formatRelativeDate(job.postedAt) : "Not listed"} />
          </aside>

          <div>
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-[var(--th-text)]">Job description</h2>
              <FormattedJobText value={job.description} fallback="No description provided." />
            </section>

            {job.requirements && (
              <section className="mt-8 space-y-4 border-t border-[var(--th-border)] pt-6">
                <h2 className="text-lg font-semibold text-[var(--th-text)]">Requirements</h2>
                <FormattedJobText value={job.requirements} />
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--th-border)] bg-[var(--th-input)] p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase text-[var(--th-text-40)]">
        {icon}
        {label}
      </div>
      <p className="break-words text-sm font-medium capitalize text-[var(--th-text)]">{value}</p>
    </div>
  );
}

function FormattedJobText({ value, fallback }: { value?: string | null; fallback?: string }) {
  const blocks = getFormattedBlocks(value);
  if (blocks.length === 0) {
    return <p className="text-sm leading-7 text-[var(--th-text-70)]">{fallback}</p>;
  }

  return (
    <div className="space-y-4 text-sm leading-7 text-[var(--th-text-70)]">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return <h3 key={index} className="pt-2 text-base font-semibold text-[var(--th-text)]">{block.text}</h3>;
        }
        if (block.type === "list") {
          return (
            <ul key={index} className="list-disc space-y-2 pl-5">
              {block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
            </ul>
          );
        }
        return <p key={index}>{block.text}</p>;
      })}
    </div>
  );
}

function getFormattedBlocks(value: string | null | undefined): Array<{ type: "heading"; text: string } | { type: "paragraph"; text: string } | { type: "list"; items: string[] }> {
  const text = cleanJobText(value);
  if (!text) return [];

  const blocks: Array<{ type: "heading"; text: string } | { type: "paragraph"; text: string } | { type: "list"; items: string[] }> = [];
  let listItems: string[] = [];

  function flushList() {
    if (listItems.length > 0) {
      blocks.push({ type: "list", items: listItems });
      listItems = [];
    }
  }

  text.split(/\n+/).map((line) => line.trim()).filter(Boolean).forEach((line) => {
    const bullet = line.match(/^[-*•]\s+(.+)/);
    if (bullet) {
      listItems.push(bullet[1].trim());
      return;
    }

    flushList();
    if (isSectionHeading(line)) {
      blocks.push({ type: "heading", text: line.replace(/:$/, "") });
    } else {
      blocks.push({ type: "paragraph", text: line });
    }
  });
  flushList();

  return blocks;
}

function cleanJobText(value: string | null | undefined): string {
  const headingPattern = "(About us|About the role|Job summary|Summary|Responsibilities|Requirements|Qualifications|Benefits|What you'll do|What you’ll do|Who you are|Nice to have|Skills|Experience|Our stack|The role|Your profile)";
  return String(value ?? "")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<\/(p|div|li|ul|ol|h[1-6]|section|article)>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&pound;/g, "GBP ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/([a-z0-9.)])(?=\s*[A-Z][A-Za-z ]{2,24}:)/g, "$1\n")
    .replace(new RegExp(`([a-z0-9.)])(?=${headingPattern})`, "g"), "$1\n\n")
    .replace(new RegExp(`${headingPattern}(?=[A-Z])`, "g"), "$&\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isSectionHeading(line: string): boolean {
  return /^(About us|About the role|Job summary|Summary|Responsibilities|Requirements|Qualifications|Benefits|What you'll do|What you’ll do|Who you are|Nice to have|Skills|Experience|Our stack|The role|Your profile):?$/i.test(line);
}

function formatRelativeDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  } catch { return ""; }
}
