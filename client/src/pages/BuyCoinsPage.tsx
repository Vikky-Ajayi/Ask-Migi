import { useEffect, useRef, useState } from "react";
import { NavBar } from "@/components/NavBar";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import coinImg from "@assets/coins_1781943901685.png";
import { Loader2, CheckCircle2, CreditCard, Bitcoin, X } from "lucide-react";

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

interface ActiveCheckout {
  checkoutId: string;
  reference: string;
  coinsAmount: number;
  price: string;
}

// ── SumUp card widget modal ────────────────────────────────────────────────
const SUMUP_SDK = "https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js";

function SumUpModal({
  checkout,
  onSuccess,
  onClose,
}: {
  checkout: ActiveCheckout;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const didMount = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    if (didMount.current) return;
    didMount.current = true;

    const doMount = () => {
      (window as any).SumUpCard?.mount({
        id: "sumup-card-widget",
        checkoutId: checkout.checkoutId,
        onResponse: (type: string, body: any) => {
          if (type === "success") {
            onSuccess();
          } else if (type === "error" || type === "failed") {
            toast({
              title: "Payment failed",
              description: body?.message ?? "Please try again or use a different card.",
              variant: "destructive",
            });
          }
        },
      });
    };

    const existing = document.getElementById("sumup-sdk-script");
    if (existing && (window as any).SumUpCard) {
      doMount();
    } else if (existing) {
      existing.addEventListener("load", doMount);
    } else {
      const script = document.createElement("script");
      script.id = "sumup-sdk-script";
      script.src = SUMUP_SDK;
      script.async = true;
      script.onload = doMount;
      document.head.appendChild(script);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkout.checkoutId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.72)" }}
      data-testid="sumup-modal"
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <img src={coinImg} alt="coins" className="w-5 h-5 object-contain" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{checkout.coinsAmount} coins</p>
              <p className="text-xs text-gray-400">Ask Migi</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-gray-900">{checkout.price}</span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              data-testid="button-close-sumup"
            >
              <X size={17} />
            </button>
          </div>
        </div>
        {/* SumUp widget mounts here */}
        <div className="p-5">
          <div id="sumup-card-widget" />
        </div>
      </div>
    </div>
  );
}

export const BuyCoinsPage = (): JSX.Element => {
  const [authView, setAuthView] = useState<AuthView>(null);
  const { isLoggedIn, refreshUser } = useAuth();
  const { toast } = useToast();
  const [payMethod, setPayMethod] = useState<PayMethod>("card");
  const [activeCheckout, setActiveCheckout] = useState<ActiveCheckout | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  // ── SumUp card checkout ────────────────────────────────────────────────────
  const cardMutation = useMutation({
    mutationFn: async ({ coinsAmount, price, currency }: { coinsAmount: number; price: number; currency: string }) => {
      const res = await apiRequest("POST", "/api/coins/create-checkout", { coinsAmount, price, currency });
      return res.json() as Promise<{ checkoutId: string; reference: string }>;
    },
    onSuccess: (data, variables) => {
      const pack = coinPacks.find((p) => p.coins === variables.coinsAmount);
      setActiveCheckout({
        checkoutId: data.checkoutId,
        reference: data.reference,
        coinsAmount: variables.coinsAmount,
        price: pack?.price ?? `£${variables.price.toFixed(2)}`,
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
        description: "Complete your payment in the new tab. Coins will be credited once confirmed.",
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

  // ── Called by SumUpModal on successful payment ─────────────────────────────
  const handlePaymentSuccess = async () => {
    if (!activeCheckout) return;
    const { checkoutId, coinsAmount, reference } = activeCheckout;
    setActiveCheckout(null);
    setVerifying(true);

    const token = localStorage.getItem("askmigi_token");
    try {
      const res = await fetch("/api/coins/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ checkoutId, coinsAmount, reference }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshUser();
        setVerified(true);
        toast({ title: "Payment confirmed! 🎉", description: `${coinsAmount} coins added to your account.` });
      } else {
        toast({ title: "Verification failed", description: data.message ?? "Please contact support.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Verification error", description: "Please contact support.", variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  const isPending = cardMutation.isPending || cryptoMutation.isPending;

  return (
    <main className="min-h-screen w-full bg-th-page text-th-text flex flex-col">
      <NavBar onLoginClick={() => setAuthView("login")} onSignUpClick={() => setAuthView("register")} />

      {/* SumUp embedded payment modal */}
      {activeCheckout && (
        <SumUpModal
          checkout={activeCheckout}
          onSuccess={handlePaymentSuccess}
          onClose={() => setActiveCheckout(null)}
        />
      )}

      {/* Verifying overlay */}
      {verifying && (
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

        {verified && (
          <div className="mb-8 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-5 py-4 max-w-md">
            <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
            <p className="text-sm text-emerald-300 font-medium">Coins added to your account successfully!</p>
          </div>
        )}

        {/* Payment method selector */}
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
