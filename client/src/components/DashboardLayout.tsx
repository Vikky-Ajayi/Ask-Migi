import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, User, Calendar, Briefcase, FileText,
  Settings, Coins, ChevronRight, Menu, X, LogOut, MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { path: "/dashboard/profile", label: "My Profile", icon: User },
  { path: "/chat", label: "Ask Migi", icon: MessageSquare },
  { path: "/dashboard/events", label: "Networking Events", icon: Calendar },
  { path: "/dashboard/jobs", label: "Job Matches", icon: Briefcase },
  { path: "/dashboard/applications", label: "Applications", icon: FileText },
];

function NavItem({ item, mobile, onClose }: { item: typeof navItems[0]; mobile?: boolean; onClose?: () => void }) {
  const [location] = useLocation();
  const isActive = item.exact ? location === item.path : location.startsWith(item.path);
  const Icon = item.icon;

  return (
    <Link
      href={item.path}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
        isActive
          ? "bg-[#0f0f11] text-white dark:bg-white dark:text-black"
          : "text-[var(--th-text-70)] hover:bg-[var(--th-hover)] hover:text-[var(--th-text)]"
      )}
    >
      <Icon size={17} />
      <span>{item.label}</span>
      {isActive && !mobile && <ChevronRight size={14} className="ml-auto opacity-60" />}
    </Link>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--th-page)] flex">
      {/* ── Desktop Sidebar ──────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 bg-[var(--th-sidebar)] border-r border-[var(--th-border)] h-screen fixed top-0 left-0 z-10">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-[var(--th-border)]">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Ask MiGi" className="h-7 logo-adaptive" />
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-4 border-t border-[var(--th-border)] pt-3 space-y-0.5">
          <Link
            href="/buy-coins"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--th-text-70)] hover:bg-[var(--th-hover)] hover:text-[var(--th-text)] transition-all"
          >
            <Coins size={17} />
            <span>{user?.unlimitedCoins ? "∞" : user?.coins ?? 0} coins</span>
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--th-text-70)] hover:bg-[var(--th-hover)] hover:text-[var(--th-text)] transition-all"
          >
            <Settings size={17} />
            <span>Settings</span>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--th-text-70)] hover:bg-[var(--th-hover)] hover:text-[var(--th-text)] transition-all"
          >
            <LogOut size={17} />
            <span>Sign out</span>
          </button>
        </div>

        {/* User chip */}
        <div className="px-3 pb-4">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-[var(--th-card)] border border-[var(--th-border)]">
            <div className="w-7 h-7 rounded-full bg-[var(--th-input)] flex items-center justify-center text-xs font-semibold text-[var(--th-text-70)] shrink-0">
              {user?.firstName?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--th-text)] truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] text-[var(--th-text-50)] truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile Header ────────────────────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[var(--th-nav)] border-b border-[var(--th-border)] px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="Ask MiGi" className="h-6 logo-adaptive" />
        </Link>
        <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-[var(--th-hover)]">
          <Menu size={20} className="text-[var(--th-text)]" />
        </button>
      </div>

      {/* ── Mobile Drawer ────────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 bg-[var(--th-sidebar)] h-full flex flex-col shadow-xl">
            <div className="px-4 py-4 border-b border-[var(--th-border)] flex items-center justify-between">
              <img src="/logo.svg" alt="Ask MiGi" className="h-6 logo-adaptive" />
              <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg hover:bg-[var(--th-hover)]">
                <X size={18} className="text-[var(--th-text-70)]" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {navItems.map((item) => (
                <NavItem key={item.path} item={item} mobile onClose={() => setMobileOpen(false)} />
              ))}
            </nav>
            <div className="px-3 pb-6 border-t border-[var(--th-border)] pt-3 space-y-0.5">
              <Link href="/buy-coins" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--th-text-70)] hover:bg-[var(--th-hover)]">
                <Coins size={17} /><span>{user?.coins ?? 0} coins</span>
              </Link>
              <button onClick={() => { setMobileOpen(false); logout(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--th-text-70)] hover:bg-[var(--th-hover)]">
                <LogOut size={17} /><span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 pt-14 md:pt-0 md:ml-60 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
