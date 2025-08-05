import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as HotToaster } from "react-hot-toast";
import { AIChatbotWidget } from "@/components/ai-chatbot-widget";
import { HelpDesk } from "@/components/help-desk";
import { UnifiedFloatingMenu } from "@/components/unified-floating-menu";
import { UniversalSidebar } from "@/components/universal-sidebar";
import { useState } from "react";
import { RouteGuard } from "@/components/route-guard";
import Dashboard from "@/pages/dashboard";
import Landing from "@/pages/landing";
import Apply from "@/pages/apply";
import Refer from "@/pages/refer";
import Donate from "@/pages/donate";

import Intake from "@/pages/intake";
import Referrals from "@/pages/referrals";
import Residents from "@/pages/residents";
import CaseNotes from "@/pages/case-notes";
import ResidentCaseNotes from "@/pages/resident-case-notes";
import Attendance from "@/pages/attendance";
import Resources from "@/pages/resources";
import GuestResources from "@/pages/guest-resources";
import Properties from "@/pages/properties";
import Maintenance from "@/pages/maintenance";
import Reports from "@/pages/reports";
import CheckIn from "@/pages/check-in";
import { ResidentPortal } from "@/components/resident-portal";
import StaffDashboard from "@/pages/staff-dashboard";
import StaffLogin from "@/pages/staff-login";
import { PartnerPortal } from "@/components/partner-portal";
import ProfilePage from "@/pages/profile";
import AdminPanelPage from "@/pages/admin-panel";
import FirstLoginWizard from "@/pages/first-login-wizard";
import IntakeReferrals from "@/pages/intake-referrals";
import NotFound from "@/pages/not-found";
import DocumentsPage from "@/pages/documents";

// Protected routes wrapper
function ProtectedRoutes() {
  return (
    <RouteGuard>
      <Switch>
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
        <Route path="/app/admin-panel" component={AdminPanelPage} />
        <Route path="/app/admin" component={AdminPanelPage} />
        <Route path="/app/intake-referrals" component={IntakeReferrals} />
        <Route path="/app/first-login" component={FirstLoginWizard} />
        <Route path="/app/partner-portal" component={PartnerPortal} />
        <Route path="/app/profile" component={ProfilePage} />
        <Route path="/app/documents" component={DocumentsPage} />
        <Route component={NotFound} />
      </Switch>
    </RouteGuard>
  );
}

function Router() {
  return (
    <UniversalSidebar>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/apply" component={Apply} />
        <Route path="/refer" component={Refer} />
        <Route path="/donate" component={Donate} />
        <Route path="/guest-resources" component={GuestResources} />
        <Route path="/resources" component={Resources} />
        <Route path="/app" component={StaffLogin} />
        <Route path="/app/resources" component={Resources} />
        <Route path="/app/:rest*" component={ProtectedRoutes} />
        <Route component={NotFound} />
      </Switch>
    </UniversalSidebar>
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