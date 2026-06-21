import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { ExpertLayout } from "@/components/ExpertLayout";
import { PromoteModal } from "@/components/PromoteModal";
import { Shield, Rocket, FileText, Eye, Trash2 } from "lucide-react";

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
    <div className="bg-[#161618] border border-[#2e3032] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#2e3032]">
        <h3 className="text-lg font-bold text-white">{service.businessName || "My Service"}</h3>
        <span className="shrink-0 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold">
          Active
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex flex-col gap-4">
        {service.countries?.length > 0 && (
          <div>
            <p className="text-sm text-white/50 mb-2">Countries Covered</p>
            <div className="flex flex-wrap gap-2">
              {service.countries.map((c: string) => (
                <span key={c} className="px-3 py-1.5 rounded-full bg-[#1c3060] text-white text-xs font-medium">{c}</span>
              ))}
            </div>
          </div>
        )}

        {service.visaServices?.length > 0 && (
          <div>
            <p className="text-sm text-white/50 mb-2">Visa Services</p>
            <div className="flex flex-wrap gap-2">
              {service.visaServices.map((v: string) => (
                <span key={v} className="px-3 py-1.5 rounded-full bg-[#0e3a26] text-white text-xs font-medium">{v}</span>
              ))}
            </div>
          </div>
        )}

        {service.serviceTypes?.length > 0 && (
          <div>
            <p className="text-sm text-white/50 mb-2">Services Available</p>
            <div className="flex flex-wrap gap-2">
              {service.serviceTypes.map((s: string) => (
                <span key={s} className="px-3 py-1.5 rounded-full border border-[#3a3c3e] text-white/70 text-xs">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Views box */}
        <div className="w-36 bg-[#1e2022] rounded-xl p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-white/40">Views</span>
            <Eye size={14} className="text-white/30" />
          </div>
          <p className="text-2xl font-bold text-white">{service.views ?? 0}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-5 py-4">
        {!confirmDelete ? (
          <>
            <button
              onClick={() => setConfirmDelete(true)}
              className="h-9 px-5 rounded-full bg-[#1e0a0a] border border-red-900/60 text-red-400 text-sm font-semibold hover:bg-[#2e1010] transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              Delete
            </button>
            <button className="h-9 px-5 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors">
              Edit Service
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60">Are you sure?</span>
            <button
              onClick={onDelete}
              disabled={deleting}
              className="h-9 px-4 rounded-full bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Yes"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="h-9 px-4 rounded-full bg-[#1e2022] border border-[#2e3032] text-white/60 text-sm font-semibold hover:bg-[#2e3032] transition-colors"
            >
              No
            </button>
          </div>
          )}
        </div>
    </div>
  );
}
