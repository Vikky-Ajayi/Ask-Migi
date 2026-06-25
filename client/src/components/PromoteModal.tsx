import { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import coinImg from "@assets/coins_1781943901685.png";

const PROMOTE_OPTIONS = [
  { label: "One Week promotion", days: 7, coins: 5 },
  { label: "Two Weeks promotion", days: 14, coins: 9 },
  { label: "One Month promotion", days: 30, coins: 16 },
];

interface PromoteModalProps {
  onClose: () => void;
  coins: number;
  onSuccess?: () => void;
}

export function PromoteModal({ onClose, coins, onSuccess }: PromoteModalProps) {
  const [selected, setSelected] = useState(0);
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePay = async () => {
    const opt = PROMOTE_OPTIONS[selected];
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("askmigi_token");
      const res = await fetch("/api/expert/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ coins: opt.coins }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.message || "Failed to promote");
        return;
      }
      await refreshUser();
      onSuccess?.();
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedOpt = PROMOTE_OPTIONS[selected];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full sm:max-w-md bg-[#0f1011] sm:rounded-2xl rounded-t-2xl p-6 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-th-text">Promote Business</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-th-card-alt text-th-text-50 hover:text-th-text transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2">
          {PROMOTE_OPTIONS.map((opt, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`flex items-center justify-between px-4 py-4 rounded-xl border transition-colors text-left ${
                selected === i
                  ? "border-white bg-th-hover"
                  : "border-th-border-md hover:border-th-border-strong hover:bg-white/[0.02]"
              }`}
            >
              <span className="text-sm text-th-text">
                {opt.label}({opt.days} days)
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <img src={coinImg} alt="coin" className="w-5 h-5 object-contain" />
                <span className="text-sm font-bold text-th-text">{opt.coins} coins</span>
              </div>
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-red-400 text-center">{error}</p>}

        {coins < selectedOpt.coins && !error && (
          <p className="text-xs text-center text-red-400">
            You need {selectedOpt.coins - coins} more coins to promote
          </p>
        )}

        {/* Pay button */}
        <button
          onClick={handlePay}
          disabled={loading || coins < selectedOpt.coins}
          className="w-full h-12 rounded-full bg-[#0f0f11] text-th-text font-bold text-sm hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Processing…" : `PAY ${selectedOpt.coins} coins`}
        </button>
      </div>
    </div>
  );
}
