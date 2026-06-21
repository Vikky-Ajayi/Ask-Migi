import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import coinImg from "@assets/coins_1781943901685.png";
import { LayoutDashboard, Clock, LogOut, Menu, X, User, ChevronDown, HelpCircle, CircleHelp } from "lucide-react";

interface ExpertLayoutProps {
  children: React.ReactNode;
  title: string;
  verified?: boolean;
  pendingCount?: number;
}

export const ExpertLayout = ({ children, title, verified = false, pendingCount = 0 }: ExpertLayoutProps) => {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", path: "/expert-dashboard", icon: <LayoutDashboard size={15} />, badge: 0 },
    { label: "Questions", path: "/expert-questions", icon: <CircleHelp size={15} />, badge: pendingCount },
    { label: "Earnings History", path: "/expert-earnings", icon: <Clock size={15} />, badge: 0 },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : "?";
  const fullName = user ? `${user.firstName} ${user.lastName}` : "Expert User";
  const coins = user?.coins ?? 0;

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <div className="px-5 pt-5 pb-6">
        <img className="h-[22px]" alt="Ask MiGi" src="/figmaAssets/vector.svg" />
      </div>
      <nav className="flex flex-col gap-0.5 px-2 flex-1">
        {navItems.map((item) => {
          const active = location === item.path || (item.path === "/expert-dashboard" && location === "/expert-dashboard");
          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); onNavigate?.(); }}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-white/10 text-white"
                  : "text-white/55 hover:text-white hover:bg-white/5"
              }`}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge > 0 && (
                <span className="h-5 min-w-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="px-2 pb-4">
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <div className="h-8 w-8 rounded-full bg-[#2e3032] flex items-center justify-center text-xs font-bold text-white shrink-0">
            {initials}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-semibold text-white truncate leading-tight">{fullName}</span>
            <span className="text-[11px] text-white/40 truncate leading-tight">Immigration Expert</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-white/55 hover:text-white transition-colors rounded-xl hover:bg-white/5"
          data-testid="button-logout"
        >
          <LogOut size={15} />
          Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen w-full bg-[#0f1011] text-white flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[200px] min-h-screen bg-[#141516] border-r border-[#232527] fixed top-0 left-0 bottom-0 z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-[#141516] flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute top-4 right-4">
          <button onClick={() => setSidebarOpen(false)} className="text-white/50 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>
        <SidebarContent onNavigate={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col md:ml-[200px] min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#0f1011] border-b border-[#232527] px-4 md:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="md:hidden shrink-0 text-white/60 hover:text-white transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span className="md:hidden font-bold text-white text-base tracking-tight">Ask MiGi®</span>
            <span className="hidden md:block text-lg font-bold text-white tracking-tight truncate">{title}</span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => navigate("/expert/buy-coins")}
              className="hidden md:block text-[13px] font-medium text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              Buy Coins
            </button>

            <div
              onClick={() => navigate("/expert/buy-coins")}
              className="flex items-center gap-1.5 bg-[#1e2022] hover:bg-[#252729] rounded-full px-3 py-1.5 cursor-pointer transition-colors"
            >
              <img src={coinImg} alt="coins" className="w-4 h-4 object-contain" />
              <span className="text-[13px] font-semibold text-white">{coins}</span>
            </div>

            <div className="relative hidden md:block">
              <button
                onClick={() => setHelpOpen(!helpOpen)}
                className="flex items-center gap-1 text-[13px] font-medium text-white/60 hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-white/5"
              >
                <HelpCircle size={15} className="mr-0.5" />
                Help
                <ChevronDown size={13} />
              </button>
              {helpOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setHelpOpen(false)} />
                  <div className="absolute right-0 top-9 w-36 bg-[#1a1c1e] border border-[#2e3032] rounded-xl shadow-xl overflow-hidden z-50">
                    <button onClick={() => { navigate("/faq"); setHelpOpen(false); }} className="w-full text-left px-4 py-2.5 text-[13px] text-white/70 hover:text-white hover:bg-white/5 transition-colors">FAQ</button>
                    <button onClick={() => { navigate("/contact"); setHelpOpen(false); }} className="w-full text-left px-4 py-2.5 text-[13px] text-white/70 hover:text-white hover:bg-white/5 transition-colors">Contact</button>
                  </div>
                </>
              )}
            </div>

            <button className="h-8 w-8 rounded-full bg-[#2e3032] flex items-center justify-center text-white/70 hover:text-white transition-colors shrink-0">
              <User size={15} />
            </button>
          </div>
        </header>

        {/* Page title on mobile */}
        <div className="md:hidden px-4 pt-4 pb-0">
          <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
        </div>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
