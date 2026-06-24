import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { NavBar } from "@/components/NavBar";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import coinImg from "@assets/coins_1781943901685.png";
import { Loader2, CheckCircle2, CreditCard, Bitcoin } from "lucide-react";

const coinPacks = [
  {
    coins: 5,
    price: "£9.99",
    rawPrice: 9.99,
    currency: "GBP",
    description: "Perfect for one or two quick questions. Ideal for users exploring career and job search options.",
    buttonLabel: "Get 5 coins",
  },
  {
    coins: 12,
    price: "£19.99",
    rawPrice: 19.99,
    currency: "GBP",
    description: "Great for users with multiple questions across different career or job search topics.",
    buttonLabel: "Get 12 coins",
    popular: true,
  },
  {
    coins: 30,
    price: "£49.99",
    rawPrice: 49.99,
    currency: "GBP",
    description: "Designed for users who need detailed advice, follow-up questions, or plan to speak with experts multiple times.",
    buttonLabel: "Get 30 coins",
  },
];

type PayMethod = "card" | "crypto";

export const BuyCoinsPage = (): JSX.Element => {
  const [authView, setAuthView] = useState<AuthView>(null);
  const [, navigate] = useLocation();
  const search = useSearch();
  const { isLoggedIn, refreshUser } = useAuth();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [payMethod, setPayMethod] = useState<PayMethod>("card");

  // ── Auto-verify after SumUp redirect ──────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(search);
    const ref = params.get("ref");
    const coins = params.get("coins");
    const checkoutId = params.get("checkoutId");

    if (!ref || !coins || !checkoutId || !isLoggedIn) return;

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
          navigate("/buy-coins", { replace: true });
        } else {
          toast({ title: "Verification failed", description: data.message ?? "Please contact support.", variant: "destructive" });
        }
      })
      .catch(() => {
        toast({ title: "Verification error", description: "Please contact support.", variant: "destructive" });
      })
      .finally(() => setVerifying(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, isLoggedIn]);

  // ── SumUp card checkout ────────────────────────────────────────────────────
  const cardMutation = useMutation({
    mutationFn: async ({ coinsAmount, price, currency }: { coinsAmount: number; price: number; currency: string }) => {
      const res = await apiRequest("POST", "/api/coins/create-checkout", { coinsAmount, price, currency });
      return res.json() as Promise<{ payUrl: string; checkoutId: string; reference: string }>;
    },
    onSuccess: (data) => {
      window.open(data.payUrl, "_blank", "noopener");
      toast({
        title: "Checkout opened",
        description: "Complete your card payment in the new tab. Coins will be credited automatically.",
      });
    },
    onError: (e: any) => {
      toast({ title: "Could not start checkout", description: e.message || "Please try again.", variant: "destructive" });
    },
  });

  // ── NOWPayments crypto checkout ────────────────────────────────────────────
  const cryptoMutation = useMutation({
    mutationFn: async ({ coinsAmount, price }: { coinsAmount: number; price: number }) => {
      const res = await apiRequest("POST", "/api/coins/create-crypto-checkout", { coinsAmount, price });
      return res.json() as Promise<{ invoiceUrl: string }>;
    },
    onSuccess: (data) => {
      window.open(data.invoiceUrl, "_blank", "noopener");
      toast({
        title: "Crypto payment opened",
        description: "Complete your crypto payment in the new tab. Coins will be credited once confirmed.",
      });
    },
    onError: (e: any) => {
      toast({ title: "Could not start crypto checkout", description: e.message || "Please try again.", variant: "destructive" });
    },
  });

  const handlePurchase = (pack: typeof coinPacks[0]) => {
    if (!isLoggedIn) { setAuthView("login"); return; }
    if (payMethod === "card") {
      cardMutation.mutate({ coinsAmount: pack.coins, price: pack.rawPrice, currency: pack.currency });
    } else {
      cryptoMutation.mutate({ coinsAmount: pack.coins, price: pack.rawPrice });
    }
  };

  const isPending = cardMutation.isPending || cryptoMutation.isPending;

  return (
    <main className="min-h-screen w-full bg-[#161618] text-white flex flex-col">
      <NavBar onLoginClick={() => setAuthView("login")} onSignUpClick={() => setAuthView("register")} />

      {verifying && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
          <div className="bg-[#1a1c1e] border border-[#2e3032] rounded-2xl p-8 flex flex-col items-center gap-4 max-w-sm text-center">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
            <p className="text-base font-semibold text-white">Confirming your payment…</p>
            <p className="text-sm text-white/50">This will only take a moment.</p>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col items-center justify-center px-4 md:px-6 py-10 md:py-16">
        <div className="text-center mb-8 md:mb-10">
          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">Buy coins</h1>
          <p className="mt-4 text-sm md:text-base text-white/50">Coins help you get answers to your questions</p>
        </div>

        {verified && (
          <div className="mb-8 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-5 py-4 max-w-md">
            <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
            <p className="text-sm text-emerald-300 font-medium">Coins added to your account successfully!</p>
          </div>
        )}

        {/* Payment method selector */}
        <div className="mb-8 flex items-center gap-2 bg-[#1e2022] border border-[#2e3032] rounded-full p-1">
          <button
            onClick={() => setPayMethod("card")}
            className={`flex items-center gap-2 h-9 px-5 rounded-full text-sm font-semibold transition-colors ${payMethod === "card" ? "bg-white text-black" : "text-white/60 hover:text-white"}`}
            data-testid="button-pay-card"
          >
            <CreditCard size={15} />
            Card Payment
          </button>
          <button
            onClick={() => setPayMethod("crypto")}
            className={`flex items-center gap-2 h-9 px-5 rounded-full text-sm font-semibold transition-colors ${payMethod === "crypto" ? "bg-white text-black" : "text-white/60 hover:text-white"}`}
            data-testid="button-pay-crypto"
          >
            <Bitcoin size={15} />
            Crypto
          </button>
        </div>

        {payMethod === "crypto" && (
          <div className="mb-6 max-w-md text-center px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
            <p className="text-xs text-amber-300/80 leading-5">Crypto payments are processed via NOWPayments. Coins are credited once the transaction is confirmed on-chain (typically 10–30 minutes).</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-6xl">
          {coinPacks.map((pack) => (
            <div
              key={pack.coins}
              className={`relative rounded-3xl border px-6 md:px-7 py-8 md:py-10 flex flex-col gap-5 ${pack.popular ? "border-white/30 bg-[#1e2022]" : "border-[#2e3032] bg-[#1a1c1e]"}`}
              data-testid={`coin-pack-${pack.coins}`}
            >
              {pack.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-white text-black text-[11px] font-bold px-3 py-1 rounded-full">Most Popular</span>
                </div>
              )}
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 bg-[#252729] rounded-full px-4 py-2">
                  <img src={coinImg} alt="coins" className="w-5 h-5 object-contain" />
                  <span className="text-sm font-semibold text-white">{pack.coins} coins</span>
                </div>
              </div>

              <p className="text-5xl font-bold text-white leading-none text-center">{pack.price}</p>

              <p className="flex-1 text-center text-white/55" style={{ fontSize: "15px", fontWeight: 400, lineHeight: "150%", letterSpacing: "-0.02em" }}>
                {pack.description}
              </p>

              <button
                onClick={() => handlePurchase(pack)}
                disabled={isPending}
                className="w-full h-12 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                data-testid={`button-buy-${pack.coins}`}
              >
                {isPending ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    {payMethod === "crypto" ? <Bitcoin size={14} /> : <CreditCard size={14} />}
                    {pack.buttonLabel}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-white/30 text-center">
          {payMethod === "card"
            ? "Card payments processed securely by SumUp. All purchases are final. Coins are non-refundable."
            : "Crypto payments processed by NOWPayments. Prices shown in GBP equivalent. Coins are non-refundable."}
        </p>
      </div>

      <AuthSheets view={authView} onViewChange={setAuthView} onClose={() => setAuthView(null)} />
    </main>
  );
};
