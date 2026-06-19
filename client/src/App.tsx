import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { LandingPage } from "@/pages/LandingPage";
import { ChatPage } from "@/pages/ChatPage";
import { BuyCoinsPage } from "@/pages/BuyCoinsPage";
import { ExpertsPage } from "@/pages/ExpertsPage";
import { EnquiriesPage } from "@/pages/EnquiriesPage";
import { FAQPage } from "@/pages/FAQPage";
import { ContactPage } from "@/pages/ContactPage";
import { PolicyPage } from "@/pages/PolicyPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { ExpertWelcomePage } from "@/pages/ExpertWelcomePage";
import { BecomeAnExpertPage } from "@/pages/BecomeAnExpertPage";

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
      <Route path="/settings" component={SettingsPage} />
      <Route path="/expert-welcome" component={ExpertWelcomePage} />
      <Route path="/become-an-expert" component={BecomeAnExpertPage} />
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
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
