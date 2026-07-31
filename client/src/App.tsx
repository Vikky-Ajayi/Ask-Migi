import { Switch, Route } from "wouter";
import { useState, useCallback } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Preloader } from "@/components/Preloader";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import { LandingPage } from "@/pages/LandingPage";
import { ChatPage } from "@/pages/ChatPage";
import { BuyCoinsPage } from "@/pages/BuyCoinsPage";
import { ExpertsPage } from "@/pages/ExpertsPage";
import { AboutPage } from "@/pages/AboutPage";
import { EnquiriesPage } from "@/pages/EnquiriesPage";
import { FAQPage } from "@/pages/FAQPage";
import { ContactPage } from "@/pages/ContactPage";
import { PolicyPage } from "@/pages/PolicyPage";
import { ExpertDashboardPage } from "@/pages/ExpertDashboardPage";
import { ExpertCallSchedulePage } from "@/pages/ExpertCallSchedulePage";
import { DashboardPage } from "@/pages/DashboardPage";
import { DashboardProfilePage } from "@/pages/DashboardProfilePage";
import { DashboardEventsPage } from "@/pages/DashboardEventsPage";
import { DashboardJobsPage } from "@/pages/DashboardJobsPage";
import { DashboardApplicationsPage } from "@/pages/DashboardApplicationsPage";
import { SettingsPage } from "@/pages/SettingsPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/enquiries" component={EnquiriesPage} />
      <Route path="/buy-coins" component={BuyCoinsPage} />
      <Route path="/experts" component={ExpertsPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/faq" component={FAQPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/dashboard/profile" component={DashboardProfilePage} />
      <Route path="/dashboard/events" component={DashboardEventsPage} />
      <Route path="/dashboard/jobs" component={DashboardJobsPage} />
      <Route path="/dashboard/applications" component={DashboardApplicationsPage} />
      <Route path="/expert-dashboard" component={ExpertDashboardPage} />
      <Route path="/expert-questions" component={ExpertDashboardPage} />
      <Route path="/expert-call-schedule" component={ExpertCallSchedulePage} />
      <Route path="/disclaimer">
        {() => <PolicyPage type="disclaimer" />}
      </Route>
      <Route path="/privacy-policy">
        {() => <PolicyPage type="privacy-policy" />}
      </Route>
      <Route path="/refund-policy">
        {() => <PolicyPage type="refund-policy" />}
      </Route>
      <Route path="/terms">
        {() => <PolicyPage type="terms" />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showPreloader, setShowPreloader] = useState<boolean>(() => {
    try {
      return !sessionStorage.getItem("askmigi_preloader_shown");
    } catch {
      return true;
    }
  });

  const handlePreloaderComplete = useCallback(() => {
    try {
      sessionStorage.setItem("askmigi_preloader_shown", "1");
    } catch { /* ignore */ }
    setShowPreloader(false);
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              {showPreloader && <Preloader onComplete={handlePreloaderComplete} />}
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
