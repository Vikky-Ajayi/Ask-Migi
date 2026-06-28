import { useEffect, useState } from "react";
import { NavBar } from "@/components/NavBar";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import coinImg from "@assets/coins_1781943901685.png";
import { Loader2, CheckCircle2, CreditCard, Bitcoin, XCircle } from "lucide-react";

const coinPacks = [
  {
    coins: 5,
    price: "£9.99",
    rawPrice: 1.00,
    currency: "GBP",
    description: "Perfect for one or two quick questions. Ideal for users exploring career and job search options.",
    buttonLabel: "Get 5 coins",
  },
  {
    coins: 12,
    price: "£19.99",
    rawPrice: 1.00,
    currency: "GBP",
    description: "Great for users with multiple questions across different career or job search topics.",
    buttonLabel: "Get 12 coins",
    popular: true,
  },
  {
    coins: 30,
    price: "£49.99",
    rawPrice: 1.00,
    currency: "GBP",
    description: "Designed for users who need detailed advice, follow-up questions, or plan to speak with experts multiple times.",
    buttonLabel: "Get 30 coins",
  },
];

type PayMethod = "card" | "crypto";
type VerifyState = "idle" | "verifying" | "success" | "failed";

export const BuyCoinsPage = (): JSX.Element => {
  const [authView, setAuthView] = useState<AuthView>(null);
  const { isLoggedIn, refreshUser } = useAuth();
  const { toast } = useToast();
  const [payMethod, setPayMethod] = useState<PayMethod>("card");
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [verifyMsg, setVerifyMsg] = useState("");

  // ── On mount: check if SumUp redirected back with payment params ──────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    const coins = params.get("coins");

    if (!ref || !coins) return;

    // Clean URL immediately so a refresh doesn't re-trigger
    window.history.replaceState({}, "", "/buy-coins");

    const coinsAmount = parseInt(coins, 10);
    if (isNaN(coinsAmount)) return;

    const token = localStorage.getItem("askmigi_token");
    if (!token) {
      setVerifyState("failed");
      setVerifyMsg("You must be logged in for coins to be credited. Please log in and contact support.");
      return;
    }

    setVerifyState("verifying");

    // checkoutId is resolved server-side from the checkout cache (keyed by reference)
    fetch("/api/coins/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ coinsAmount, reference: ref }),
    })
      .then((r) => r.json())
      .then(async (data) => {
        if (data.success) {
          await refreshUser();
          setVerifyState("success");
          setVerifyMsg(`${coinsAmount} coins have been added to your account.`);
        } else {
          setVerifyState("failed");
          setVerifyMsg(data.message ?? "Payment could not be confirmed. Please contact support.");
        }
      })
      .catch(() => {
        setVerifyState("failed");
        setVerifyMsg("Something went wrong verifying your payment. Please contact support.");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── SumUp hosted-page checkout ────────────────────────────────────────────
  const cardMutation = useMutation({
    mutationFn: async ({ coinsAmount, price, currency }: { coinsAmount: number; price: number; currency: string }) => {
      const res = await apiRequest("POST", "/api/coins/create-checkout", { coinsAmount, price, currency });
      return res.json() as Promise<{ checkoutId: string; payUrl: string; reference: string }>;
    },
    onSuccess: (data) => {
      // Redirect to SumUp's hosted checkout page
      window.location.href = data.payUrl;
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
      toast({ title: "Crypto payment opened", description: "Complete your payment in the new tab. Coins will be credited once confirmed." });
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
    <main className="min-h-screen w-full bg-th-page text-th-text flex flex-col">
      <NavBar onLoginClick={() => setAuthView("login")} onSignUpClick={() => setAuthView("register")} />

      {/* Payment verification overlay — shown while confirming after SumUp redirect */}
      {verifyState === "verifying" && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
          <div className="bg-th-sidebar border border-th-border-md rounded-2xl p-8 flex flex-col items-center gap-4 max-w-sm text-center">
            <Loader2 className="w-10 h-10 text-th-text animate-spin" />
            <p className="text-base font-semibold text-th-text">Confirming your payment…</p>
            <p className="text-sm text-th-text-50">This will only take a moment.</p>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col items-center justify-center px-4 md:px-6 py-10 md:py-16">
        <div className="text-center mb-8 md:mb-10">
          <h1 className="text-5xl md:text-6xl font-bold text-th-text tracking-tight">Buy coins</h1>
          <p className="mt-4 text-sm md:text-base text-th-text-50">Coins unlock expert answers to your questions. Choose the payment method that works best for you and get started in seconds.</p>
        </div>

        {/* Success banner */}
        {verifyState === "success" && (
          <div className="mb-8 flex items-center gap-3 bg-white/5 border border-white/20 rounded-xl px-5 py-4 max-w-md" data-testid="payment-success-banner">
            <CheckCircle2 className="text-white shrink-0" size={20} />
            <p className="text-sm text-white font-medium">{verifyMsg}</p>
          </div>
        )}

        {/* Failure banner */}
        {verifyState === "failed" && (
          <div className="mb-8 flex items-center gap-3 bg-red-500/10 border border-red-500/25 rounded-xl px-5 py-4 max-w-md" data-testid="payment-failed-banner">
            <XCircle className="text-red-400 shrink-0" size={20} />
            <p className="text-sm text-red-300 font-medium">{verifyMsg}</p>
          </div>
        )}

        <div className="mb-8 flex items-center gap-2 bg-th-card-alt border border-th-border-md rounded-full p-1">
          <button
            onClick={() => setPayMethod("card")}
            className={`flex items-center gap-2 h-9 px-5 rounded-full text-sm font-semibold transition-colors ${payMethod === "card" ? "bg-[#0f0f11] text-white dark:bg-white dark:text-black" : "text-th-text-60 hover:text-th-text"}`}
            data-testid="button-pay-card"
          >
            <CreditCard size={15} />
            Card Payment
          </button>
          <button
            onClick={() => setPayMethod("crypto")}
            className={`flex items-center gap-2 h-9 px-5 rounded-full text-sm font-semibold transition-colors ${payMethod === "crypto" ? "bg-[#0f0f11] text-white dark:bg-white dark:text-black" : "text-th-text-60 hover:text-th-text"}`}
            data-testid="button-pay-crypto"
          >
            <Bitcoin size={15} />
            Crypto
          </button>
        </div>

        {payMethod === "crypto" && (
          <div className="mb-6 max-w-md text-center px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
            <p className="text-xs text-amber-300/80 leading-5">Cryptocurrency payments are credited after the transaction has been confirmed on the blockchain, which usually takes 10–30 minutes.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-6xl">
          {coinPacks.map((pack) => (
            <div
              key={pack.coins}
              className={`relative rounded-3xl border px-6 md:px-7 py-8 md:py-10 flex flex-col gap-5 ${pack.popular ? "border-th-border-strong bg-th-card-alt" : "border-th-border-md bg-th-sidebar"}`}
              data-testid={`coin-pack-${pack.coins}`}
            >
              {pack.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[#0f0f11] text-white text-[11px] font-bold dark:bg-white dark:text-black px-3 py-1 rounded-full">Most Popular</span>
                </div>
              )}
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 bg-white dark:bg-[#252729] border border-th-border-md dark:border-transparent rounded-full px-4 py-2">
                  <img src={coinImg} alt="coins" className="w-5 h-5 object-contain" />
                  <span className="text-sm font-semibold text-th-text">{pack.coins} coins</span>
                </div>
              </div>

              <p className="text-5xl font-bold text-th-text leading-none text-center">{pack.price}</p>

              <p className="flex-1 text-center text-th-text-60" style={{ fontSize: "15px", fontWeight: 400, lineHeight: "150%", letterSpacing: "-0.02em" }}>
                {pack.description}
              </p>

              <button
                onClick={() => handlePurchase(pack)}
                disabled={isPending}
                className="w-full h-12 rounded-full bg-[#0f0f11] text-white font-semibold text-sm hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
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

        <p className="mt-8 text-xs text-th-text-30 text-center">
          {payMethod === "card"
            ? "Card payments processed securely by SumUp. All purchases are final. Coins are non-refundable."
            : "Cryptocurrency payments are credited after the transaction has been confirmed on the blockchain, which usually takes 10–30 minutes."}
        </p>
      </div>

      <AuthSheets view={authView} onViewChange={setAuthView} onClose={() => setAuthView(null)} />
    </main>
  );
};
