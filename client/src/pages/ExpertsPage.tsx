import { useState } from "react";
import { useLocation } from "wouter";
import { NavBar } from "@/components/NavBar";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";
import { ChatSidebar, type SidebarEnquiry } from "@/components/ChatSidebar";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

const tabs = [
  { label: "Immigration Experts", type: "immigration" },
  { label: "Travel agents", type: "travel" },
  { label: "Tour Guides", type: "tour" },
];

interface Expert {
  id: string;
  name: string;
  location: string;
  expertType: string;
  countries: string[];
  visaServices: string[];
  services: string[];
  bio: string | null;
}

const ExpertCard = ({ expert }: { expert: Expert }) => (
  <div className="rounded-2xl border border-th-border-md bg-th-sidebar p-5 md:p-6 flex flex-col gap-4" data-testid={`expert-card-${expert.id}`}>
    <div>
      <h3 className="text-base font-bold text-th-text">{expert.name}</h3>
      <p className="text-sm text-th-text-40 mt-0.5">{expert.location}</p>
    </div>
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-th-text-40">Countries Covered</p>
      <div className="flex flex-wrap gap-1.5">
        {expert.countries.map((c) => (
          <span key={c} className="h-7 rounded-full bg-blue-900/50 border border-blue-700/40 text-blue-300 text-xs font-medium px-3 flex items-center">{c}</span>
        ))}
      </div>
    </div>
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-th-text-40">Visa Services</p>
      <div className="flex flex-wrap gap-1.5">
        {expert.visaServices.map((v) => (
          <span key={v} className="h-7 rounded-full bg-white/10 border border-white/15 text-white text-xs font-medium px-3 flex items-center">{v}</span>
        ))}
      </div>
    </div>
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-th-text-40">Services Available</p>
      <div className="flex flex-wrap gap-1.5">
        {expert.services.map((s) => (
          <span key={s} className="h-7 rounded-full border border-th-border-md text-th-text-70 text-xs font-medium px-3 flex items-center">{s}</span>
        ))}
      </div>
    </div>
    <button className="w-full h-12 rounded-full bg-[#0f0f11] text-white font-semibold text-sm hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 transition-colors mt-auto" data-testid={`button-view-expert-${expert.id}`}>
      View details and contact
    </button>
  </div>
);

export const ExpertsPage = (): JSX.Element => {
  const [authView, setAuthView] = useState<AuthView>(null);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [activeEnqId, setActiveEnqId] = useState<string>("");
  const { isLoggedIn } = useAuth();
  const [, navigate] = useLocation();

  const { data: experts = [], isLoading } = useQuery<Expert[]>({
    queryKey: ["/api/experts", `?type=${activeTab.type}`],
    queryFn: async () => {
      const res = await fetch(`/api/experts?type=${activeTab.type}`);
      return res.json();
    },
  });

  const { data: enquiries = [] } = useQuery<any[]>({
    queryKey: ["/api/enquiries"],
    enabled: isLoggedIn,
  });

  const headerText = {
    immigration: { title: "Immigration Experts", subtitle: "Connect with certified immigration consultants for visa applications, residency, and citizenship guidance." },
    travel: { title: "Professional Travel Agents", subtitle: "Connect with experienced travel professionals to plan your perfect journey." },
    tour: { title: "Tour Guides", subtitle: "Explore new destinations with trusted local tour guide experts." },
  }[activeTab.type] || { title: "Experts", subtitle: "" };

  const sidebarItems: SidebarEnquiry[] = enquiries.map((e: any) => ({
    id: e.id,
    question: e.question,
    status: e.status,
  }));

  return (
    <main className="min-h-screen w-full bg-th-page text-th-text flex flex-col">
      <NavBar onLoginClick={() => setAuthView("login")} onSignUpClick={() => setAuthView("register")} />

      <div className="flex flex-1">
        {isLoggedIn && (
          <div className="w-52 shrink-0 border-r border-th-border overflow-y-auto px-3 py-3 hidden md:block">
            <ChatSidebar
              enquiries={sidebarItems}
              activeId={activeEnqId}
              onSelect={(id) => { setActiveEnqId(id); navigate(`/chat?id=${id}`); }}
              onNewQuestion={() => navigate("/")}
            />
          </div>
        )}

        <div className="flex flex-col flex-1 items-center px-4 md:px-6 py-8 md:py-10">
          <div className="text-center mb-6 md:mb-8 max-w-xl">
            <h1 className="text-2xl md:text-3xl font-bold text-th-text tracking-tight">{headerText.title}</h1>
            <p className="mt-3 text-sm text-th-text-60 leading-6">{headerText.subtitle}</p>
          </div>

          <div className="flex items-center gap-2 mb-6 md:mb-8 flex-wrap justify-center">
            {tabs.map((tab) => {
              const active = activeTab.type === tab.type;
              return (
                <button
                  key={tab.type}
                  onClick={() => setActiveTab(tab)}
                  className={`h-9 rounded-full px-4 md:px-5 text-sm font-medium transition-colors ${active ? "bg-[#0f0f11] text-white dark:bg-white dark:text-black" : "border border-th-border-md text-th-text-60 hover:text-th-text hover:bg-th-hover"}`}
                  data-testid={`experts-tab-${tab.type}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 w-full max-w-5xl">
              {[1, 2, 3].map((n) => <div key={n} className="rounded-2xl border border-th-border-md bg-th-sidebar p-6 h-64 animate-pulse" />)}
            </div>
          ) : experts.length === 0 ? (
            <p className="text-th-text-40 py-12">No experts found for this category.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 w-full max-w-5xl">
              {experts.map((expert) => <ExpertCard key={expert.id} expert={expert} />)}
            </div>
          )}
        </div>
      </div>

      <AuthSheets view={authView} onViewChange={setAuthView} onClose={() => setAuthView(null)} />
    </main>
  );
};
