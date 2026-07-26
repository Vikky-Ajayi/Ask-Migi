import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, ExternalLink, Search, Filter, Loader2, Coins, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

const CATEGORIES = [
  "All", "Business & Professional", "Science & Technology", "Arts",
  "Health & Wellness", "Community", "Education", "Food & Drink", "Music",
];

const DISTANCE_OPTIONS = [5, 10, 25, 50, 100];

function EventCard({ event, onDetails }: { event: any; onDetails?: () => void }) {
  return (
    <div className="bg-[var(--th-card)] border border-[var(--th-border)] rounded-xl overflow-hidden hover:border-[var(--th-border-md)] transition-all group">
      {event.thumbnailUrl && (
        <div className="aspect-[16/7] overflow-hidden bg-[var(--th-input)]">
          <img src={event.thumbnailUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          {event.isFree && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">FREE</span>
          )}
          {event.isOnline && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center gap-1"><Globe size={8} />Online</span>
          )}
          {event.category && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--th-input)] text-[var(--th-text-60)]">{event.category}</span>
          )}
          {event.matchScore !== undefined && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 ml-auto">
              {Math.round(event.matchScore * 100)}% match
            </span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-[var(--th-text)] line-clamp-2 mb-2">{event.title}</h3>
        <div className="flex items-center gap-1.5 text-xs text-[var(--th-text-50)] mb-1">
          <Calendar size={11} />
          {formatEventDate(event.startDate)}
        </div>
        {(event.locationCity || event.locationVenue) && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--th-text-50)] mb-3">
            <MapPin size={11} />
            {[event.locationVenue, event.locationCity].filter(Boolean).join(", ")}
          </div>
        )}
        {event.description && (
          <p className="text-xs text-[var(--th-text-60)] line-clamp-2 mb-3">{event.description}</p>
        )}
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--th-text)] hover:underline"
        >
          View on Eventbrite <ExternalLink size={10} />
        </a>
      </div>
    </div>
  );
}

export function DashboardEventsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);
  const [useMatching, setUseMatching] = useState(false);
  const [page, setPage] = useState(1);

  const { data: profile } = useQuery<any>({ queryKey: ["/api/dashboard/profile"], retry: false });

  const matchMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/dashboard/events/match").then(r => r.json()),
    onSuccess: () => {
      setUseMatching(true);
      qc.invalidateQueries({ queryKey: ["/api/dashboard/events"] });
      toast({ title: "Matched!", description: "Events ranked by relevance to your profile." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message ?? "Could not run matching.", variant: "destructive" });
    },
  });

  const params = new URLSearchParams({
    page: page.toString(),
    limit: "24",
    ...(search && { q: search }),
    ...(category !== "All" && { category }),
    ...(onlineOnly && { online: "true" }),
    ...(freeOnly && { free: "true" }),
    ...(useMatching && { matched: "true" }),
  });

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/events", params.toString()],
    retry: false,
  });

  const events = data?.events ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 24);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--th-text)]">Networking Events</h1>
            <p className="text-[var(--th-text-60)] mt-1 text-sm">UK events scraped from Eventbrite — find your next networking opportunity.</p>
          </div>
          {profile?.profileComplete && (
            <button
              onClick={() => matchMutation.mutate()}
              disabled={matchMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0f0f11] dark:bg-white text-white dark:text-black text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
            >
              {matchMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Coins size={14} />}
              {useMatching ? "Re-run matching (2 coins)" : "Match to my profile (2 coins)"}
            </button>
          )}
        </div>

        {/* Stats bar */}
        {total > 0 && (
          <div className="mb-5 text-sm text-[var(--th-text-60)]">
            <span className="font-medium text-[var(--th-text)]">{total.toLocaleString()}</span> events in database
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex-1 min-w-48 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--th-text-40)]" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search events..."
              className="w-full pl-9 pr-3 py-2.5 bg-[var(--th-input)] border border-[var(--th-border)] rounded-xl text-sm text-[var(--th-text)] placeholder:text-[var(--th-text-40)] focus:outline-none focus:ring-1 focus:ring-[var(--th-border-strong)]"
            />
          </div>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="bg-[var(--th-input)] border border-[var(--th-border)] rounded-xl px-3 py-2.5 text-sm text-[var(--th-text)] focus:outline-none"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={() => { setFreeOnly(!freeOnly); setPage(1); }}
            className={cn("px-3 py-2.5 rounded-xl text-sm border transition-all", freeOnly ? "bg-emerald-600 text-white border-emerald-600" : "bg-[var(--th-input)] text-[var(--th-text-70)] border-[var(--th-border)]")}
          >
            Free only
          </button>
          <button
            onClick={() => { setOnlineOnly(!onlineOnly); setPage(1); }}
            className={cn("px-3 py-2.5 rounded-xl text-sm border transition-all", onlineOnly ? "bg-blue-600 text-white border-blue-600" : "bg-[var(--th-input)] text-[var(--th-text-70)] border-[var(--th-border)]")}
          >
            Online only
          </button>
        </div>

        {/* Events grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={24} className="animate-spin text-[var(--th-text-50)]" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <Calendar size={36} className="mx-auto text-[var(--th-text-30)] mb-3" />
            <p className="text-[var(--th-text-60)] text-sm">No events found. Try adjusting your filters.</p>
            <p className="text-[var(--th-text-40)] text-xs mt-1">Events are scraped continuously — check back soon.</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {events.map((event: any) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm bg-[var(--th-input)] border border-[var(--th-border)] rounded-lg disabled:opacity-40 hover:bg-[var(--th-card-hover)] transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-[var(--th-text-60)]">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm bg-[var(--th-input)] border border-[var(--th-border)] rounded-lg disabled:opacity-40 hover:bg-[var(--th-card-hover)] transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function formatEventDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}
