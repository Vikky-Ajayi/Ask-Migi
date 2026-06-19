import { useState } from "react";
import { useLocation } from "wouter";
import { DesktopNav } from "@/components/DesktopNav";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const coinPacks = [
  {
    coins: 5,
    price: "$99.99",
    rawPrice: "99.99",
    description:
      "Perfect if you have one or two quick questions. Ideal for users exploring immigration or travel options and just need basic guidance.",
    buttonLabel: "Get 5 coins",
  },
  {
    coins: 12,
    price: "$199.99",
    rawPrice: "199.99",
    description:
      "Great for users with multiple questions across different topics (e.g. visa types, documents, timelines). Offers more coins at a better rate per question.",
    buttonLabel: "Get 12 coins",
  },
  {
    coins: 25,
    price: "$399.99",
    rawPrice: "399.99",
    description:
      "Designed for users who need detailed advice, follow-up questions, or plan to speak with experts multiple times. Best value for regular, in-depth support.",
    buttonLabel: "Get 25 coins",
  },
];

export const BuyCoinsPage = (): JSX.Element => {
  const [authView, setAuthView] = useState<AuthView>(null);
  const [, navigate] = useLocation();
  const { isLoggedIn, refreshUser } = useAuth();
  const { toast } = useToast();

  const purchaseMutation = useMutation({
    mutationFn: async ({ coinsAmount, price }: { coinsAmount: number; price: string }) => {
      const res = await apiRequest("POST", "/api/coins/purchase", { coinsAmount, price });
      return res.json();
    },
    onSuccess: async (data, variables) => {
      await refreshUser();
      toast({
        title: "Coins added!",
        description: `${variables.coinsAmount} coins have been added to your account.`,
      });
    },
    onError: (e: any) => {
      toast({ title: "Purchase failed", description: e.message || "Please try again.", variant: "destructive" });
    },
  });

  const handlePurchase = (pack: typeof coinPacks[0]) => {
    if (!isLoggedIn) {
      setAuthView("login");
      return;
    }
    purchaseMutation.mutate({ coinsAmount: pack.coins, price: pack.rawPrice });
  };

  return (
    <main className="min-h-screen w-full bg-[#161618] text-white flex flex-col">
      <DesktopNav
        onLoginClick={() => setAuthView("login")}
        onSignUpClick={() => setAuthView("register")}
      />

      <div className="flex flex-col items-center px-6 py-12">
        {/* Heading */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-white tracking-tight">Buy coins</h1>
          <p className="mt-3 text-base text-white/50">Coins helps you get answers to your questions</p>
        </div>

        {/* 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl">
          {coinPacks.map((pack) => (
            <div
              key={pack.coins}
              className="rounded-3xl border border-[#3a3c3e] bg-[#1e2022] p-7 flex flex-col gap-5"
              data-testid={`coin-pack-${pack.coins}`}
            >
              {/* Coins badge — centered */}
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 bg-[#2a2c2e] rounded-full px-4 py-2 w-fit">
                  <span>🪙</span>
                  <span className="text-sm font-semibold text-white">{pack.coins} coins</span>
                </div>
              </div>

              {/* Price — centered */}
              <p className="text-5xl font-bold text-white leading-none text-center">{pack.price}</p>

              {/* Description — centered */}
              <p className="text-sm text-white/55 leading-6 flex-1 text-center">{pack.description}</p>

              {/* CTA */}
              <button
                onClick={() => handlePurchase(pack)}
                disabled={purchaseMutation.isPending}
                className="w-full h-12 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors disabled:opacity-60"
                data-testid={`button-buy-${pack.coins}`}
              >
                {purchaseMutation.isPending ? "Processing…" : pack.buttonLabel}
              </button>
            </div>
          ))}
        </div>
      </div>

      <AuthSheets view={authView} onViewChange={setAuthView} onClose={() => setAuthView(null)} />
    </main>
  );
};
