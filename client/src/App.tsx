import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState, useCallback } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/context/AuthContext";
import { Preloader } from "@/components/Preloader";

import { LandingPage } from "@/pages/LandingPage";
import { ChatPage } from "@/pages/ChatPage";
import { BuyCoinsPage } from "@/pages/BuyCoinsPage";
import { ExpertsPage } from "@/pages/ExpertsPage";
import { EnquiriesPage } from "@/pages/EnquiriesPage";
import { FAQPage } from "@/pages/FAQPage";
import { ContactPage } from "@/pages/ContactPage";
import { PolicyPage } from "@/pages/PolicyPage";
import { ExpertWelcomePage } from "@/pages/ExpertWelcomePage";
import { BecomeAnExpertPage } from "@/pages/BecomeAnExpertPage";
import { ExpertDashboardPage } from "@/pages/ExpertDashboardPage";
import { ExpertVerificationPage } from "@/pages/ExpertVerificationPage";
import { ExpertCreateServicePage } from "@/pages/ExpertCreateServicePage";
import { ExpertBuyCoinsPage } from "@/pages/ExpertBuyCoinsPage";
import { TravelAgentsPage } from "@/pages/TravelAgentsPage";

const RedirectHome = () => {
  const [, navigate] = useLocation();
  useEffect(() => { navigate("/"); }, [navigate]);
  return null;
};

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/enquiries" component={EnquiriesPage} />
      <Route path="/buy-coins" component={BuyCoinsPage} />
      <Route path="/experts" component={ExpertsPage} />
      <Route path="/faq" component={FAQPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/settings" component={RedirectHome} />
      <Route path="/expert-welcome" component={ExpertWelcomePage} />
      <Route path="/become-an-expert" component={BecomeAnExpertPage} />
      <Route path="/expert-dashboard" component={ExpertDashboardPage} />
      <Route path="/expert-verify" component={ExpertVerificationPage} />
      <Route path="/expert-services" component={ExpertDashboardPage} />
      <Route path="/expert-services/create" component={ExpertCreateServicePage} />
      <Route path="/expert/buy-coins" component={ExpertBuyCoinsPage} />
      <Route path="/expert-questions" component={ExpertDashboardPage} />
      <Route path="/expert-earnings" component={ExpertDashboardPage} />
      <Route path="/travel-agents" component={TravelAgentsPage} />
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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          {showPreloader && <Preloader onComplete={handlePreloaderComplete} />}
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
