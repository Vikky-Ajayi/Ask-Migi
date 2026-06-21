import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Menu, CircleUser } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { NavBar } from "@/components/NavBar";
import { ChatSidebar, type SidebarEnquiry } from "@/components/ChatSidebar";
import { AuthSheets, type AuthView } from "@/components/AuthSheets";

const CATEGORY_TABS = ["Immigration Experts", "Travel agents", "Tour Guides"];

export const TravelAgentsPage = (): JSX.Element => {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const typeParam = params.get("type");

  const activeTab = typeParam === "tour" ? "Tour Guides" : "Travel agents";
  const apiType = activeTab === "Travel agents" ? "travel" : "tour";

  const { isLoggedIn } = useAuth();
  const [authView, setAuthView] = useState<AuthView>(null);

  const { data: agents = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/experts", apiType],
    queryFn: async () => {
      const res = await fetch(`/api/experts?type=${apiType}`);
      return res.json();
    },
  });

  const { data: enquiries = [] } = useQuery<any[]>({
    queryKey: ["/api/enquiries"],
    enabled: isLoggedIn,
  });

  const sidebarItems: SidebarEnquiry[] = enquiries.map((e: any) => ({
    id: e.id,
    question: e.question,
    status: e.status,
  }));

  const handleTabClick = (tab: string) => {
    if (tab === "Immigration Experts") navigate("/");
    else if (tab === "Travel agents") navigate("/travel-agents");
    else if (tab === "Tour Guides") navigate("/travel-agents?type=tour");
  };

  const heading =
    activeTab === "Tour Guides" ? "Professional Tour Guides" : "Professional Travel Agents";
  const subheading =
    activeTab === "Tour Guides"
      ? "Connect with experienced tour guides for unforgettable experiences"
      : "Connect with experienced travel professionals to plan your perfect journey";

  return (
    <main className="min-h-screen w-full bg-[#161618] text-white flex flex-col">
      <div className="hidden md:block">
        <NavBar
          onLoginClick={() => setAuthView("login")}
          onSignUpClick={() => setAuthView("register")}
        />
      </div>

      <header className="md:hidden sticky top-0 z-30 w-full flex items-center justify-between px-4 py-3 bg-[#161618] border-b border-white/5">
        <button className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
          <Menu size={22} className="text-white" />
        </button>
        <img className="h-6" alt="Ask MiGi" src="/figmaAssets/vector.svg" />
        {isLoggedIn ? (
          <button className="h-9 w-9 flex items-center justify-center rounded-full border border-white/20 hover:bg-white/10 transition-colors">
            <CircleUser size={18} className="text-white/70" />
          </button>
        ) : (
          <button
            onClick={() => setAuthView("register")}
            className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors"
          >
            <CircleUser size={13} className="text-black" />
            Sign Up
          </button>
        )}
      </header>

      <div className="flex flex-1 min-h-0">
        {isLoggedIn && (
          <div className="hidden md:block w-52 shrink-0 border-r border-white/5 overflow-y-auto px-3 py-3">
            <ChatSidebar
              enquiries={sidebarItems}
              onSelect={(id) => navigate(`/chat?id=${id}`)}
              onNewQuestion={() => navigate("/")}
            />
          </div>
        )}

        <div className="flex-1 flex flex-col items-center px-4 py-6 md:py-10 overflow-auto">
          <div className="w-full max-w-5xl flex flex-col items-center gap-2 text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white">{heading}</h1>
            <p className="text-sm text-white/55 max-w-sm leading-6">{subheading}</p>
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap mb-6 md:mb-8">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={`h-9 rounded-full px-4 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-white text-black"
                    : "border border-[#3a3c3e] text-white/70 hover:text-white hover:bg-white/5"
                }`}
                data-testid={`tab-${tab.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-64 rounded-2xl bg-[#1e2022] animate-pulse" />
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-white/40 text-sm">
                No {activeTab === "Tour Guides" ? "tour guides" : "travel agents"} listed yet.
              </p>
              {!isLoggedIn && (
                <button
                  onClick={() => setAuthView("register")}
                  className="mt-2 h-10 px-6 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors"
                >
                  Sign Up as {activeTab === "Tour Guides" ? "Tour Guide" : "Travel Agent"}
                </button>
              )}
            </div>
          ) : (
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent: any) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}

          {!isLoggedIn && agents.length > 0 && (
            <div className="mt-8 flex items-center gap-3 flex-wrap justify-center">
              <button
                onClick={() => setAuthView("register")}
                className="h-10 px-6 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors"
                data-testid="button-signup-agent"
              >
                Sign Up as {activeTab === "Tour Guides" ? "Tour Guide" : "Travel Agent"}
              </button>
              <button
                onClick={() => setAuthView("login")}
                className="h-10 px-6 rounded-full border border-white/25 text-white font-medium text-sm hover:bg-white/10 transition-colors"
                data-testid="button-login-agent"
              >
                Log in
              </button>
            </div>
          )}
        </div>
      </div>

      <AuthSheets
        view={authView}
        onViewChange={setAuthView}
        onClose={() => setAuthView(null)}
        registerRole="expert"
        onSuccess={() => navigate("/expert-dashboard")}
      />
    </main>
  );
};

function AgentCard({ agent }: { agent: any }) {
  return (
    <div
      className="bg-[#1e2022] rounded-2xl border border-white/[0.08] overflow-hidden flex flex-col"
      data-testid={`card-agent-${agent.id}`}
    >
      <div className="p-4 md:p-5 flex flex-col gap-4 flex-1">
        <div>
          <h3 className="text-base font-bold text-white leading-tight">{agent.name}</h3>
          <p className="text-sm text-white/50 mt-0.5">{agent.location}</p>
        </div>

        {agent.countries?.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-white/45">Countries Covered</p>
            <div className="flex flex-wrap gap-1.5">
              {agent.countries.map((c: string) => (
                <span
                  key={c}
                  className="px-3 py-1 rounded-full bg-[#1c3060] text-white text-xs font-medium"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {agent.visaServices?.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-white/45">Visa Services</p>
            <div className="flex flex-wrap gap-1.5">
              {agent.visaServices.map((v: string) => (
                <span
                  key={v}
                  className="px-3 py-1 rounded-full bg-[#0e3a26] text-white text-xs font-medium"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}

        {agent.services?.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-white/45">Services Available</p>
            <div className="flex flex-wrap gap-1.5">
              {agent.services.map((s: string) => (
                <span
                  key={s}
                  className="px-3 py-1 rounded-full border border-[#3a3c3e] text-white/70 text-xs"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 md:px-5 pb-4 md:pb-5">
        <button className="w-full h-11 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors">
          View details and contact
        </button>
      </div>
    </div>
  );
}
