import { useQuery } from "@tanstack/react-query";
import { ExpertLayout } from "@/components/ExpertLayout";
import { Calendar, Clock, User, Mail } from "lucide-react";

export const ExpertCallSchedulePage = () => {
  const { data: bookings = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/expert/call-schedule"],
    queryFn: async () => {
      const token = localStorage.getItem("askmigi_token");
      const res = await fetch("/api/expert/call-schedule", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 30000,
  });

  return (
    <ExpertLayout title="Call Schedule">
      <div className="px-4 md:px-8 py-6 flex flex-col gap-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-th-text">Booked Calls</h2>
            <p className="text-xs text-th-text-40 mt-0.5">All scheduled calls from users</p>
          </div>
          {!isLoading && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-th-card-alt border border-th-border-md text-th-text-60">
              {bookings.length} {bookings.length === 1 ? "call" : "calls"}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-28 rounded-2xl bg-th-card-alt animate-pulse" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-th-card-alt border border-th-border-md rounded-2xl py-16 flex flex-col items-center gap-2 text-center">
            <Calendar size={28} className="text-th-text-30 mb-1" />
            <p className="text-th-text-40 text-sm font-medium">No calls booked yet</p>
            <p className="text-th-text-30 text-xs">When users book a call, their details will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {bookings.map((booking: any) => (
              <CallCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </div>
    </ExpertLayout>
  );
};

function CallCard({ booking }: { booking: any }) {
  const booked = new Date(booking.createdAt);
  const statusColors: Record<string, string> = {
    booked: "bg-blue-950/60 text-blue-400 border-blue-800/30",
    completed: "bg-white/10 text-white border-white/20",
    cancelled: "bg-red-950/60 text-red-400 border-red-800/30",
  };
  const statusColor = statusColors[booking.status] ?? statusColors.booked;

  return (
    <div
      className="bg-th-card-alt border border-th-border-md rounded-2xl px-5 py-4 flex flex-col gap-3"
      data-testid={`card-call-${booking.id}`}
    >
      {/* Top row: user info + status badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <User size={13} className="text-th-text-40 shrink-0" />
            <span className="text-sm font-semibold text-th-text truncate">{booking.userName || "Unknown User"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail size={13} className="text-th-text-30 shrink-0" />
            <span className="text-xs text-th-text-40 truncate">{booking.userEmail || "—"}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className={`inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full border capitalize ${statusColor}`}
          >
            {booking.status}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-th-text-30">
            <Clock size={10} />
            {booked.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            {" · "}
            {booked.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-th-border" />

      {/* Reason */}
      <div>
        <p className="text-[10px] text-th-text-30 uppercase tracking-wide mb-1.5">Call Reason</p>
        <p className="text-sm text-th-text-70 leading-5">{booking.reason}</p>
      </div>

      {/* Coins used */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-th-text-30">Coins deducted:</span>
        <span className="text-[10px] font-semibold text-th-text-50">{booking.coinsUsed}</span>
      </div>
    </div>
  );
}
