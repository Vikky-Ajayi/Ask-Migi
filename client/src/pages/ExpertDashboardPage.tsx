import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { ExpertLayout } from "@/components/ExpertLayout";
import coinImg from "@assets/coins_1781943901685.png";
import { Shield, Rocket, FileText, Eye, Trash2, Pencil, X, Check } from "lucide-react";

const PROMOTE_OPTIONS = [
  { label: "One Week promotion", days: 7, coins: 5 },
  { label: "Two Weeks promotion", days: 14, coins: 9 },
  { label: "One Month promotion", days: 30, coins: 16 },
];

function PromoteModal({ onClose, coins }: { onClose: () => void; coins: number }) {
  const [selected, setSelected] = useState(0);
  const { refreshUser } = useAuth();
  const { toast } = useToastShim();
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    const opt = PROMOTE_OPTIONS[selected];
    setLoading(true);
    try {
      const token = localStorage.getItem("askmigi_token");
      const res = await fetch("/api/expert/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ coins: opt.coins }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast(err.message || "Failed to promote", "error");
        return;
      }
      await refreshUser();
      toast(`Business promoted for ${opt.days} days!`, "success");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#0f1011] border border-[#2e3032] rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Promote Business</h2>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-full bg-[#2e3032] text-white/60 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="flex flex-col gap-2 mb-6">
          {PROMOTE_OPTIONS.map((opt, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`flex items-center justify-between px-4 py-3.5 rounded-xl border transition-colors text-left ${
                selected === i
                  ? "border-white/40 bg-white/5"
                  : "border-[#2e3032] hover:border-white/20 hover:bg-white/3"
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-white">{opt.label}</p>
                <p className="text-xs text-white/40 mt-0.5">({opt.days} days)</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {selected === i && <Check size={12} className="text-white/60" />}
                <img src={coinImg} alt="" className="w-4 h-4 object-contain" />
                <span className="text-sm font-bold text-white">{opt.coins} coins</span>
              </div>
            </button>
          ))}
        </div>

        <p className={`text-xs text-center mb-4 ${coins < PROMOTE_OPTIONS[selected].coins ? "text-red-400" : "text-white/40"}`}>
          {coins < PROMOTE_OPTIONS[selected].coins
            ? `You need ${PROMOTE_OPTIONS[selected].coins - coins} more coins`
            : `You have ${coins} coins`}
        </p>

        <button
          onClick={handlePay}
          disabled={loading || coins < PROMOTE_OPTIONS[selected].coins}
          className="w-full h-12 rounded-full bg-white text-black font-bold text-sm hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Processing…" : `PAY ${PROMOTE_OPTIONS[selected].coins} coins`}
        </button>
      </div>
    </div>
  );
}

function useToastShim() {
  return {
    toast: (msg: string, _type?: string) => {
      console.log("[Toast]", msg);
    },
  };
}

export const ExpertDashboardPage = () => {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [promoteOpen, setPromoteOpen] = useState(false);

  const { data: verification, isLoading: verLoading } = useQuery({
    queryKey: ["/api/expert/verification"],
    queryFn: async () => {
      const token = localStorage.getItem("askmigi_token");
      const res = await fetch("/api/expert/verification", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!user,
  });

  const { data: services = [], isLoading: svcLoading } = useQuery<any[]>({
    queryKey: ["/api/expert/services"],
    queryFn: async () => {
      const token = localStorage.getItem("askmigi_token");
      const res = await fetch("/api/expert/services", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("askmigi_token");
      await fetch(`/api/expert/services/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/expert/services"] });
    },
  });

  const isVerified = verification?.status === "verified";
  const loading = verLoading || svcLoading;

  if (loading) {
    return (
      <ExpertLayout title="Dashboard" verified={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      </ExpertLayout>
    );
  }

  return (
    <ExpertLayout title="Dashboard" verified={isVerified}>
      <div className="px-4 md:px-8 py-6">

        {/* ── UNVERIFIED STATE ─── */}
        {!isVerified && (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-full max-w-sm bg-[#1a3a5c] rounded-2xl p-8 flex flex-col items-center text-center gap-5 border border-[#2a5080]">
              <div className="h-16 w-16 rounded-full bg-[#1e4a7a] flex items-center justify-center">
                <Shield size={28} className="text-[#4da6ff]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-snug mb-2">
                  Get your travel agency verified so you can start attracting clients
                </h2>
                <p className="text-sm text-white/60 leading-6">
                  Complete your verification to unlock full access to the platform, create services, and grow your client base.
                </p>
              </div>
              <button
                onClick={() => navigate("/expert-verify")}
                className="w-full h-11 rounded-full bg-[#2d7dd2] hover:bg-[#3a8de2] text-white font-semibold text-sm transition-colors"
              >
                Verify Business
              </button>
            </div>
          </div>
        )}

        {/* ── VERIFIED STATE ─── */}
        {isVerified && (
          <div className="flex flex-col gap-6">
            {/* Boost banner */}
            <div className="bg-[#1a3a5c] border border-[#2a5080] rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#1e4a7a] flex items-center justify-center shrink-0">
                  <Rocket size={18} className="text-[#4da6ff]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Boost your visibility!</p>
                  <p className="text-xs text-white/55 mt-0.5">Promote your profile to get more clients and enquiries.</p>
                </div>
              </div>
              <button
                onClick={() => setPromoteOpen(true)}
                className="shrink-0 h-9 px-5 rounded-full bg-[#2d7dd2] hover:bg-[#3a8de2] text-white font-semibold text-sm transition-colors"
              >
                Promote Now
              </button>
            </div>

            {/* Empty state */}
            {services.length === 0 && (
              <div className="bg-[#1e2022] border border-[#2e3032] rounded-2xl flex flex-col items-center justify-center py-16 gap-5">
                <div className="h-14 w-14 rounded-full bg-[#2a2c2e] flex items-center justify-center">
                  <FileText size={26} className="text-white/30" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-white mb-1">You haven't created any services yet</p>
                  <p className="text-sm text-white/45">Start by adding your first services so customers can<br />discover and book you.</p>
                </div>
                <button
                  onClick={() => navigate("/expert-services/create")}
                  className="h-10 px-6 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors"
                >
                  Create a service
                </button>
              </div>
            )}

            {/* Services list */}
            {services.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white">My Services</h2>
                  <button
                    onClick={() => navigate("/expert-services/create")}
                    className="h-9 px-4 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors"
                  >
                    + Add Service
                  </button>
                </div>
                {services.map((svc: any) => (
                  <ServiceCard
                    key={svc.id}
                    service={svc}
                    onDelete={() => deleteMutation.mutate(svc.id)}
                    deleting={deleteMutation.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {promoteOpen && (
        <PromoteModal
          onClose={() => setPromoteOpen(false)}
          coins={user?.coins ?? 0}
        />
      )}
    </ExpertLayout>
  );
};

function ServiceCard({ service, onDelete, deleting }: { service: any; onDelete: () => void; deleting: boolean }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="bg-[#161618] border border-[#2e3032] rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white">{service.businessName}</h3>
        </div>
        <span className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
          Active
        </span>
      </div>

      {service.countries?.length > 0 && (
        <div>
          <p className="text-xs text-white/40 font-medium mb-2 uppercase tracking-wide">Countries Covered</p>
          <div className="flex flex-wrap gap-1.5">
            {service.countries.map((c: string) => (
              <span key={c} className="px-2.5 py-1 rounded-full bg-[#1e2022] border border-[#2e3032] text-xs text-white/70">{c}</span>
            ))}
          </div>
        </div>
      )}

      {service.visaServices?.length > 0 && (
        <div>
          <p className="text-xs text-white/40 font-medium mb-2 uppercase tracking-wide">Visa Services</p>
          <div className="flex flex-wrap gap-1.5">
            {service.visaServices.map((v: string) => (
              <span key={v} className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">{v}</span>
            ))}
          </div>
        </div>
      )}

      {service.serviceTypes?.length > 0 && (
        <div>
          <p className="text-xs text-white/40 font-medium mb-2 uppercase tracking-wide">Services Available</p>
          <div className="flex flex-wrap gap-1.5">
            {service.serviceTypes.map((s: string) => (
              <span key={s} className="px-2.5 py-1 rounded-full bg-[#1e2022] border border-[#2e3032] text-xs text-white/70">{s}</span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-[#2e3032]">
        <div className="flex items-center gap-1.5 text-white/40">
          <Eye size={14} />
          <span className="text-xs">{service.views} views</span>
        </div>
        <div className="flex items-center gap-2">
          {!confirmDelete ? (
            <>
              <button className="h-8 w-8 flex items-center justify-center rounded-xl bg-[#1e2022] text-white/50 hover:text-white transition-colors">
                <Pencil size={14} />
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="h-8 w-8 flex items-center justify-center rounded-xl bg-[#1e2022] text-white/50 hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60">Delete?</span>
              <button
                onClick={onDelete}
                disabled={deleting}
                className="h-7 px-3 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="h-7 px-3 rounded-lg bg-[#1e2022] text-white/60 text-xs font-semibold hover:bg-[#2e3032] transition-colors"
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
