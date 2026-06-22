import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { ExpertLayout } from "@/components/ExpertLayout";
import coinImg from "@assets/coins_1781943901685.png";
import { ArrowLeft, Check, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const COIN_PACKAGES = [
  {
    coins: 10,
    price: "£2.99",
    priceRaw: 2.99,
    currency: "GBP",
    label: "Starter Pack",
    description: "Perfect for trying out promotions",
    popular: false,
  },
  {
    coins: 25,
    price: "£5.99",
    priceRaw: 5.99,
    currency: "GBP",
    label: "Explorer Pack",
    description: "Great for listing your first service",
    popular: false,
  },
  {
    coins: 50,
    price: "£9.99",
    priceRaw: 9.99,
    currency: "GBP",
    label: "Professional Pack",
    description: "Ideal for regular promotions",
    popular: true,
  },
  {
    coins: 120,
    price: "£19.99",
    priceRaw: 19.99,
    currency: "GBP",
    label: "Agency Pack",
    description: "Best value for agencies",
    popular: false,
  },
  {
    coins: 250,
    price: "£35.99",
    priceRaw: 35.99,
    currency: "GBP",
    label: "Enterprise Pack",
    description: "Unlimited growth potential",
    popular: false,
  },
];

export const ExpertBuyCoinsPage = () => {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<number | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  // ── Auto-verify after SumUp redirect ──────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(search);
    const ref = params.get("ref");
    const coins = params.get("coins");
    const checkoutId = params.get("checkoutId");

    if (!ref || !coins || !checkoutId) return;

    const coinsAmount = parseInt(coins, 10);
    if (isNaN(coinsAmount)) return;

    setVerifying(true);

    const token = localStorage.getItem("askmigi_token");
    fetch("/api/coins/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ checkoutId, coinsAmount, reference: ref }),
    })
      .then((r) => r.json())
      .then(async (data) => {
        if (data.success) {
          await refreshUser();
          setVerified(true);
          toast({ title: "Payment confirmed!", description: `${coinsAmount} coins added to your account.` });
          navigate("/expert/buy-coins", { replace: true });
        } else {
          toast({ title: "Verification failed", description: data.message ?? "Please contact support.", variant: "destructive" });
        }
      })
      .catch(() => {
        toast({ title: "Verification error", description: "Please contact support.", variant: "destructive" });
      })
      .finally(() => setVerifying(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // ── Open SumUp checkout for a package ─────────────────────────────────────
  const handlePurchase = async (pkg: typeof COIN_PACKAGES[0], idx: number) => {
    setLoading(idx);
    try {
      const token = localStorage.getItem("askmigi_token");
      const res = await fetch("/api/coins/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ coinsAmount: pkg.coins, price: pkg.priceRaw, currency: pkg.currency }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Checkout creation failed");

      window.open(data.payUrl, "_blank", "noopener");
      toast({
        title: "SumUp checkout opened",
        description: "Complete payment in the new tab. Your coins will be credited when you return.",
      });
    } catch (err: any) {
      toast({ title: "Could not start checkout", description: err.message ?? "Please try again.", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <ExpertLayout title="Buy Coins" verified={true}>
      {/* Verifying overlay */}
      {verifying && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
          <div className="bg-[#1a1c1e] border border-[#2e3032] rounded-2xl p-8 flex flex-col items-center gap-4 max-w-sm text-center">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
            <p className="text-base font-semibold text-white">Confirming your payment…</p>
            <p className="text-sm text-white/50">This will only take a moment.</p>
          </div>
        </div>
      )}

      <div className="px-4 md:px-8 py-6 max-w-2xl">
        <button
          onClick={() => navigate("/expert-dashboard")}
          className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={15} />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-full bg-[#1e2022] flex items-center justify-center shrink-0">
              <img src={coinImg} alt="coins" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Buy Coins</h1>
              <p className="text-sm text-white/50 mt-0.5">
                Current balance:{" "}
                <span className="font-semibold text-white">{user?.coins ?? 0} coins</span>
              </p>
            </div>
          </div>
          <p className="text-sm text-white/55 leading-6">
            Use coins to promote your business, boost visibility, and unlock premium features on the platform.
          </p>
        </div>

        {/* What coins are used for */}
        <div className="bg-[#161618] border border-[#2e3032] rounded-2xl p-5 mb-6">
          <h2 className="text-sm font-bold text-white mb-3">What are coins used for?</h2>
          <ul className="flex flex-col gap-2">
            {[
              ["5 coins", "Promote your business for 1 week"],
              ["9 coins", "Promote your business for 2 weeks"],
              ["16 coins", "Promote your business for 1 month"],
            ].map(([coins, desc]) => (
              <li key={coins} className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 w-20 shrink-0">
                  <img src={coinImg} alt="" className="w-4 h-4 object-contain" />
                  <span className="text-sm font-bold text-white">{coins}</span>
                </div>
                <span className="text-sm text-white/55">{desc}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Success banner */}
        {verified && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-300 font-medium">Coins added to your account successfully!</p>
          </div>
        )}

        {/* Packages */}
        <div className="flex flex-col gap-3">
          {COIN_PACKAGES.map((pkg, i) => (
            <div
              key={i}
              data-testid={`expert-coin-pack-${pkg.coins}`}
              className={`relative bg-[#161618] border rounded-2xl p-5 flex items-center justify-between gap-4 transition-colors ${
                pkg.popular ? "border-[#2d7dd2]/60" : "border-[#2e3032]"
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-5 px-3 py-0.5 bg-[#2d7dd2] rounded-full">
                  <span className="text-xs font-bold text-white">Most Popular</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#1e2022] flex items-center justify-center shrink-0">
                  <img src={coinImg} alt="" className="w-5 h-5 object-contain" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-white">{pkg.coins} Coins</span>
                    <span className="text-sm font-bold text-white/60">{pkg.price}</span>
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">{pkg.label} — {pkg.description}</p>
                </div>
              </div>
              <button
                onClick={() => handlePurchase(pkg, i)}
                disabled={loading === i}
                data-testid={`button-expert-buy-${pkg.coins}`}
                className={`shrink-0 h-9 px-5 rounded-full font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                  pkg.popular
                    ? "bg-[#2d7dd2] hover:bg-[#3a8de2] text-white"
                    : "bg-white text-black hover:bg-white/90"
                }`}
              >
                {loading === i ? <Loader2 className="inline animate-spin" size={14} /> : "Buy"}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-white/30 text-center">
          Payments processed securely by SumUp. All purchases are final. Coins are non-refundable. Prices in GBP.
        </p>
      </div>
    </ExpertLayout>
  );
};
