import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Calendar, Briefcase, FileText, Coins, ArrowRight, TrendingUp, Clock } from "lucide-react";

function StatCard({ icon: Icon, label, value, sub, href, color }: {
  icon: any; label: string; value: string | number; sub?: string; href?: string; color: string;
}) {
  const inner = (
    <div className="bg-[var(--th-card)] border border-[var(--th-border)] rounded-xl p-5 hover:border-[var(--th-border-md)] transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} />
        </div>
        {href && <ArrowRight size={14} className="text-[var(--th-text-40)] group-hover:text-[var(--th-text-70)] transition-colors" />}
      </div>
      <p className="text-2xl font-semibold text-[var(--th-text)] mb-0.5">{value}</p>
      <p className="text-sm font-medium text-[var(--th-text-80)]">{label}</p>
      {sub && <p className="text-xs text-[var(--th-text-50)] mt-0.5">{sub}</p>}
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

export function DashboardPage() {
  const { user } = useAuth();

  const { data: dashStats } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: profile } = useQuery<any>({
    queryKey: ["/api/dashboard/profile"],
    retry: false,
  });

  const isProfileComplete = profile?.profileComplete;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[var(--th-text)]">
            Good {getTimeGreeting()}, {user?.firstName} 👋
          </h1>
          <p className="text-[var(--th-text-60)] mt-1 text-sm">
            Here's what's happening with your career dashboard.
          </p>
        </div>

        {/* Profile prompt banner */}
        {!isProfileComplete && (
          <Link href="/dashboard/profile">
            <div className="mb-6 bg-[#0f0f11] dark:bg-white rounded-xl p-4 flex items-center justify-between group hover:opacity-90 transition-opacity cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 dark:bg-black/10 flex items-center justify-center">
                  <TrendingUp size={16} className="text-white dark:text-black" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white dark:text-black">Complete your career profile</p>
                  <p className="text-xs text-white/60 dark:text-black/60">Upload your CV to get matched to events and jobs</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-white/60 dark:text-black/60 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Coins}
            label="Coins balance"
            value={user?.unlimitedCoins ? "∞" : (user?.coins ?? 0)}
            sub="Buy more anytime"
            href="/buy-coins"
            color="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
          />
          <StatCard
            icon={Calendar}
            label="Matched events"
            value={dashStats?.matchedEvents ?? "—"}
            sub="Near you this month"
            href="/dashboard/events"
            color="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
          />
          <StatCard
            icon={Briefcase}
            label="Job matches"
            value={dashStats?.matchedJobs ?? "—"}
            sub="Based on your profile"
            href="/dashboard/jobs"
            color="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            icon={FileText}
            label="Applications"
            value={dashStats?.totalApplications ?? 0}
            sub={`${dashStats?.pendingApplications ?? 0} in progress`}
            href="/dashboard/applications"
            color="bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400"
          />
        </div>

        {/* Quick actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-[var(--th-card)] border border-[var(--th-border)] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-[var(--th-text-60)]" />
              <h2 className="text-sm font-medium text-[var(--th-text)]">Upcoming Events</h2>
            </div>
            {dashStats?.recentEvents?.length ? (
              <div className="space-y-3">
                {dashStats.recentEvents.slice(0, 3).map((evt: any) => (
                  <a key={evt.id} href={evt.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-start gap-3 group">
                    <div className="w-8 h-8 rounded-lg bg-[var(--th-input)] flex items-center justify-center shrink-0">
                      <Clock size={13} className="text-[var(--th-text-50)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--th-text)] truncate group-hover:text-[var(--th-text-80)]">{evt.title}</p>
                      <p className="text-xs text-[var(--th-text-50)]">{evt.locationCity} · {formatDate(evt.startDate)}</p>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-[var(--th-text-50)]">
                  {isProfileComplete ? "No upcoming events matched yet" : "Complete your profile to see matched events"}
                </p>
                <Link href="/dashboard/events" className="text-xs font-medium text-[var(--th-text)] hover:underline mt-1 inline-block">
                  Browse all events →
                </Link>
              </div>
            )}
          </div>

          <div className="bg-[var(--th-card)] border border-[var(--th-border)] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase size={16} className="text-[var(--th-text-60)]" />
              <h2 className="text-sm font-medium text-[var(--th-text)]">Recent Job Matches</h2>
            </div>
            {dashStats?.recentJobs?.length ? (
              <div className="space-y-3">
                {dashStats.recentJobs.slice(0, 3).map((job: any) => (
                  <div key={job.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--th-input)] flex items-center justify-center shrink-0 text-xs font-semibold text-[var(--th-text-50)]">
                      {job.company[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--th-text)] truncate">{job.title}</p>
                      <p className="text-xs text-[var(--th-text-50)]">{job.company} · {job.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-[var(--th-text-50)]">
                  {isProfileComplete ? "Loading job matches..." : "Complete your profile to see job matches"}
                </p>
                <Link href="/dashboard/jobs" className="text-xs font-medium text-[var(--th-text)] hover:underline mt-1 inline-block">
                  Browse all jobs →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}
