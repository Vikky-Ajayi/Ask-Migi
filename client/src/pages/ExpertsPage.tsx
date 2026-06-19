import { useState } from "react";
import { useLocation } from "wouter";
import { DesktopNav } from "@/components/DesktopNav";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";
import { ChatSidebar, type SidebarEnquiry } from "@/components/ChatSidebar";
import { MapPin } from "lucide-react";
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
  <div
    className="rounded-3xl border border-[#3a3c3e] bg-[#1e2022] p-6 flex flex-col gap-5"
    data-testid={`expert-card-${expert.id}`}
  >
    {/* Header */}
    <div>
      <h3 className="text-base font-bold text-white">{expert.name}</h3>
      <div className="flex items-center gap-1.5 mt-1">
        <MapPin size={12} className="text-white/40" />
        <p className="text-sm text-white/40">{expert.location}</p>
      </div>
    </div>

    {/* Countries */}
    <div className="flex flex-col gap-2">
      <p className="text-xs text-white/40 font-medium">Countries Covered</p>
      <div className="flex flex-wrap gap-1.5">
        {expert.countries.map((c) => (
          <span
            key={c}
            className="h-7 rounded-full bg-blue-950/60 text-blue-300 text-xs font-medium px-3 flex items-center border border-blue-800/30"
          >
            {c}
          </span>
        ))}
      </div>
    </div>

    {/* Visa Services */}
    <div className="flex flex-col gap-2">
      <p className="text-xs text-white/40 font-medium">Visa Services</p>
      <div className="flex flex-wrap gap-1.5">
        {expert.visaServices.map((v) => (
          <span
            key={v}
            className="h-7 rounded-full bg-emerald-950/60 text-emerald-400 text-xs font-medium px-3 flex items-center border border-emerald-800/30"
          >
            {v}
          </span>
        ))}
      </div>
    </div>

    {/* Services Available */}
    <div className="flex flex-col gap-2">
      <p className="text-xs text-white/40 font-medium">Services Available</p>
      <div className="flex flex-wrap gap-1.5">
        {expert.services.map((s) => (
          <span
            key={s}
            className="h-7 rounded-full border border-[#3a3c3e] text-white/70 text-xs font-medium px-3 flex items-center"
          >
            {s}
          </span>
        ))}
      </div>
    </div>

    {/* CTA */}
    <button
      className="w-full h-12 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors mt-auto"
      data-testid={`button-view-expert-${expert.id}`}
    >
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
    immigration: {
      title: "Immigration Experts",
      subtitle: "Connect with certified immigration consultants for visa applications, residency, and citizenship guidance.",
    },
    travel: {
      title: "Professional Travel Agents",
      subtitle: "Connect with experienced travel professionals to plan your perfect journey.",
    },
    tour: {
      title: "Tour Guides",
      subtitle: "Explore new destinations with trusted local tour guide experts.",
    },
  }[activeTab.type] || { title: "Experts", subtitle: "" };

  const sidebarItems: SidebarEnquiry[] = enquiries.map((e: any) => ({
    id: e.id,
    question: e.question,
    status: e.status,
  }));

  return (
    <main className="min-h-screen w-full bg-[#161618] text-white flex flex-col">
      <DesktopNav
        onLoginClick={() => setAuthView("login")}
        onSignUpClick={() => setAuthView("register")}
      />

      <div className="flex flex-1">
        {/* Left sidebar — same as chat page */}
        {isLoggedIn && (
          <div className="w-52 shrink-0 border-r border-white/5 overflow-y-auto px-3 py-3 hidden md:block">
            <ChatSidebar
              enquiries={sidebarItems}
              activeId={activeEnqId}
              onSelect={(id) => {
                setActiveEnqId(id);
                navigate(`/chat?id=${id}`);
              }}
              onNewQuestion={() => navigate("/")}
            />
          </div>
        )}

        {/* Main content */}
        <div className="flex flex-col flex-1 items-center px-6 py-10">
          {/* Header */}
          <div className="text-center mb-8 max-w-xl">
            <h1 className="text-3xl font-bold text-white tracking-tight">{headerText.title}</h1>
            <p className="mt-3 text-sm text-white/55 leading-6">{headerText.subtitle}</p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mb-8 flex-wrap justify-center">
            {tabs.map((tab) => {
              const active = activeTab.type === tab.type;
              return (
                <button
                  key={tab.type}
                  onClick={() => setActiveTab(tab)}
                  className={`h-9 rounded-full px-5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-white text-black"
                      : "border border-[#3a3c3e] text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                  data-testid={`experts-tab-${tab.type}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Expert cards grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-5xl">
              {[1, 2, 3].map((n) => (
                <div key={n} className="rounded-3xl border border-[#3a3c3e] bg-[#1e2022] p-6 h-64 animate-pulse" />
              ))}
            </div>
          ) : experts.length === 0 ? (
            <p className="text-white/40 py-12">No experts found for this category.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-5xl">
              {experts.map((expert) => (
                <ExpertCard key={expert.id} expert={expert} />
              ))}
            </div>
          )}
        </div>
      </div>

      <AuthSheets view={authView} onViewChange={setAuthView} onClose={() => setAuthView(null)} />
    </main>
  );
};
