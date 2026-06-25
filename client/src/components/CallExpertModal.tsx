import { Phone, X } from "lucide-react";

export const EXPERT_PHONE = "+44 7700 900000";

export function CallExpertModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-sm bg-th-sidebar rounded-3xl px-6 pt-6 pb-8 border border-th-border-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-th-text">Call an Expert</h2>
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-full bg-th-close text-th-text-60 hover:text-th-text transition-colors"
              data-testid="button-close-call-modal"
            >
              <X size={15} />
            </button>
          </div>

          <div className="flex flex-col items-center gap-5 py-4">
            <div className="h-16 w-16 rounded-full bg-[#22c55e]/15 flex items-center justify-center">
              <Phone size={28} className="text-[#22c55e]" />
            </div>
            <div className="text-center">
              <p className="text-sm text-th-text-60 mb-2">Speak directly with a career expert</p>
              <p className="text-xs text-th-text-40 leading-5">Available Mon–Fri, 9am–6pm (UK time)</p>
            </div>
            <a
              href={`tel:${EXPERT_PHONE.replace(/\s/g, "")}`}
              className="flex items-center gap-3 w-full px-5 py-4 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30 hover:bg-[#22c55e]/20 transition-colors"
              data-testid="link-call-expert"
            >
              <Phone size={18} className="text-[#22c55e] shrink-0" />
              <span className="text-xl font-bold text-th-text tracking-wide">{EXPERT_PHONE}</span>
            </a>
            <p className="text-xs text-th-text-30 text-center">Tap the number above to dial automatically</p>
          </div>
        </div>
      </div>
    </>
  );
}
