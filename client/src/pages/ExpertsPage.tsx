import { useState } from "react";
import { useLocation } from "wouter";
import { AppHeader } from "@/components/AppHeader";
import { Sidebar } from "@/components/Sidebar";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";

const tabs = ["Immigration Experts", "Travel agents", "Tour Guides"];

const travelAgents = [
  {
    id: 1,
    name: "Global Journeys Travel",
    location: "United states",
    countries: ["USA", "UK", "Canada", "Australia"],
    visaServices: ["Tourist Visa", "Business Visa", "Transit Visa"],
    services: ["Visa & Passport", "Travel Booking", "Student Travel"],
  },
  {
    id: 2,
    name: "Global Journeys Travel",
    location: "United states",
    countries: ["USA", "UK", "Canada", "Australia"],
    visaServices: ["Tourist Visa", "Business Visa", "Transit Visa"],
    services: ["Visa & Passport", "Travel Booking", "Student Travel"],
  },
  {
    id: 3,
    name: "Global Journeys Travel",
    location: "United states",
    countries: ["USA", "UK", "Canada", "Australia"],
    visaServices: ["Tourist Visa", "Business Visa", "Transit Visa"],
    services: ["Visa & Passport", "Travel Booking", "Student Travel"],
  },
];

const ExpertCard = ({ expert }: { expert: typeof travelAgents[0] }) => (
  <div className="rounded-3xl border border-[#3a3c3e] bg-[#1e2022] p-5 flex flex-col gap-4" data-testid={`expert-card-${expert.id}`}>
    <div>
      <h3 className="text-base font-bold text-white">{expert.name}</h3>
      <p className="text-sm text-white/50">{expert.location}</p>
    </div>
    <div className="flex flex-col gap-2">
      <p className="text-xs text-white/50 font-medium">Countries Covered</p>
      <div className="flex flex-wrap gap-1.5">
        {expert.countries.map((c) => (
          <span key={c} className="h-7 rounded-full bg-[#1a3a5c] text-blue-300 text-xs font-medium px-3 flex items-center">
            {c}
          </span>
        ))}
      </div>
    </div>
    <div className="flex flex-col gap-2">
      <p className="text-xs text-white/50 font-medium">Visa Services</p>
      <div className="flex flex-wrap gap-1.5">
        {expert.visaServices.map((v) => (
          <span key={v} className="h-7 rounded-full bg-[#1a3a2a] text-green-400 text-xs font-medium px-3 flex items-center">
            {v}
          </span>
        ))}
      </div>
    </div>
    <div className="flex flex-col gap-2">
      <p className="text-xs text-white/50 font-medium">Services Available</p>
      <div className="flex flex-wrap gap-1.5">
        {expert.services.map((s) => (
          <span key={s} className="h-7 rounded-full border border-[#3a3c3e] text-white/80 text-xs font-medium px-3 flex items-center">
            {s}
          </span>
        ))}
      </div>
    </div>
    <button
      className="w-full h-12 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors mt-1"
      data-testid={`button-view-expert-${expert.id}`}
    >
      View details and contact
    </button>
  </div>
);

export const ExpertsPage = (): JSX.Element => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authView, setAuthView] = useState<AuthView>(null);
  const [isLoggedIn] = useState(true);
  const [activeTab, setActiveTab] = useState("Travel agents");

  return (
    <main className="min-h-screen w-full bg-[#161618] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[375px] flex-col px-4 pb-10">
        <AppHeader
          onMenuClick={() => setSidebarOpen(true)}
          onProfileClick={() => {}}
          isLoggedIn={isLoggedIn}
        />

        <section className="mt-6 flex flex-col gap-5">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">Professional Travel Agents</h1>
            <p className="mt-2 text-sm text-white/60 leading-5">Connect with experienced travel professionals to plan your perfect journey</p>
          </div>

          <nav className="overflow-x-auto pb-1">
            <div className="flex min-w-max items-start gap-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`h-8 rounded-[48px] px-4 text-xs font-medium transition-colors ${
                      isActive ? "bg-white text-black" : "border border-[#3a3c3e] text-white/70 hover:bg-[#242628]"
                    }`}
                    data-testid={`experts-tab-${tab.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="flex flex-col gap-4">
            {travelAgents.map((expert) => (
              <ExpertCard key={expert.id} expert={expert} />
            ))}
          </div>
        </section>
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isLoggedIn={isLoggedIn} onAuthAction={(a) => setAuthView(a)} />
      <AuthSheets view={authView} onViewChange={setAuthView} onClose={() => setAuthView(null)} />
    </main>
  );
};
