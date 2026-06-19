import { useState } from "react";
import { useLocation } from "wouter";
import { AppHeader } from "@/components/AppHeader";
import { Sidebar } from "@/components/Sidebar";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";

const coinPacks = [
  {
    coins: 5,
    price: "$99.99",
    description: "Perfect if you have one or two quick questions. Ideal for users exploring immigration or travel options and just need basic guidance.",
    buttonLabel: "Get 5 coins",
  },
  {
    coins: 12,
    price: "$199.99",
    description: "Great for users with multiple questions across different topics (e.g. visa types, documents, timelines). Offers more coins at a better rate per question.",
    buttonLabel: "Get 12 coins",
  },
  {
    coins: 25,
    price: "$399.99",
    description: "Designed for users who need detailed advice, follow-up questions, or plan to speak with experts multiple times. Best value for regular, in-depth support.",
    buttonLabel: "Get 25 coins",
  },
];

export const BuyCoinsPage = (): JSX.Element => {
  const [, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authView, setAuthView] = useState<AuthView>(null);
  const [isLoggedIn] = useState(true);

  return (
    <main className="min-h-screen w-full bg-[#161618] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[375px] flex-col px-4 pb-10">
        <AppHeader
          onMenuClick={() => setSidebarOpen(true)}
          onProfileClick={() => {}}
          isLoggedIn={isLoggedIn}
        />

        <section className="mt-8 flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white tracking-tight">Buy coins</h1>
            <p className="mt-2 text-sm text-white/60">Coins helps you get answers to your questions</p>
          </div>

          <div className="flex flex-col gap-4">
            {coinPacks.map((pack) => (
              <div
                key={pack.coins}
                className="rounded-3xl border border-[#3a3c3e] bg-[#1e2022] p-6 flex flex-col gap-4"
                data-testid={`coin-pack-${pack.coins}`}
              >
                <div className="inline-flex items-center gap-2 bg-[#242628] rounded-full px-3 py-1.5 w-fit">
                  <img className="h-5 w-5 object-cover" alt="Coins" src="/figmaAssets/image-2.png" />
                  <span className="text-sm font-semibold text-white">{pack.coins} coins</span>
                </div>
                <div>
                  <p className="text-4xl font-bold text-white">{pack.price}</p>
                </div>
                <p className="text-sm text-white/60 leading-5">{pack.description}</p>
                <button
                  className="w-full h-12 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors"
                  data-testid={`button-buy-${pack.coins}`}
                >
                  {pack.buttonLabel}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isLoggedIn={isLoggedIn} onAuthAction={(a) => setAuthView(a)} />
      <AuthSheets view={authView} onViewChange={setAuthView} onClose={() => setAuthView(null)} />
    </main>
  );
};
