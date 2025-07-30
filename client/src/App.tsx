import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as HotToaster } from "react-hot-toast";
import { AIChatbotWidget } from "@/components/ai-chatbot-widget";
import { HelpDesk } from "@/components/help-desk";
import { UnifiedFloatingMenu } from "@/components/unified-floating-menu";
import { useState } from "react";
import { RouteGuard } from "@/components/route-guard";
import Dashboard from "@/pages/dashboard";
import Landing from "@/pages/landing";
import Apply from "@/pages/apply";
import Refer from "@/pages/refer";
import Donate from "@/pages/donate";
import GuestResources from "@/pages/guest-resources";

import Intake from "@/pages/intake";
import Referrals from "@/pages/referrals";
import Residents from "@/pages/residents";
import CaseNotes from "@/pages/case-notes";
import ResidentCaseNotes from "@/pages/resident-case-notes";
import Attendance from "@/pages/attendance";
import Resources from "@/pages/resources";
import Properties from "@/pages/properties";
import Maintenance from "@/pages/maintenance";
import Reports from "@/pages/reports";
import CheckIn from "@/pages/check-in";
import { ResidentPortal } from "@/components/resident-portal";
import { StaffDashboard } from "@/components/staff-dashboard";
import { AdminPanel } from "@/components/admin-panel";
import { PartnerPortal } from "@/components/partner-portal";
import ProfilePage from "@/pages/profile";
import NotFound from "@/pages/not-found";

// Protected routes wrapper
function ProtectedRoutes() {
  return (
    <RouteGuard>
      <Switch>
        <Route path="/app" component={Dashboard} />
        <Route path="/app/intake" component={Intake} />
        <Route path="/app/referrals" component={Referrals} />
        <Route path="/app/residents" component={Residents} />
        <Route path="/app/residents/:id/case-notes" component={ResidentCaseNotes} />
        <Route path="/app/case-notes" component={CaseNotes} />
        <Route path="/app/attendance" component={Attendance} />
        <Route path="/app/properties" component={Properties} />
        <Route path="/app/maintenance" component={Maintenance} />
        <Route path="/app/reports" component={Reports} />
        <Route path="/app/check-in" component={CheckIn} />
        <Route path="/app/resident-portal" component={ResidentPortal} />
        <Route path="/app/staff-dashboard" component={StaffDashboard} />
        <Route path="/app/admin-panel" component={AdminPanel} />
        <Route path="/app/partner-portal" component={PartnerPortal} />
        <Route path="/app/profile" component={ProfilePage} />
      </Switch>
    </RouteGuard>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/apply" component={Apply} />
      <Route path="/refer" component={Refer} />
      <Route path="/donate" component={Donate} />
      <Route path="/resources" component={GuestResources} />
      <Route path="/app/resources" component={Resources} />
      <Route path="/app/:rest*" component={ProtectedRoutes} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <HotToaster position="top-right" />
        <Router />
        <UnifiedFloatingMenu 
          onOpenChat={() => setIsChatOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
        />
        <AIChatbotWidget 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
        />
        <HelpDesk 
          isOpen={isHelpOpen} 
          onClose={() => setIsHelpOpen(false)} 
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;