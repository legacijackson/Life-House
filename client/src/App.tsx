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
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/dashboard";
import Landing from "@/pages/landing";
import Apply from "@/pages/apply";
import Refer from "@/pages/refer";
import Donate from "@/pages/donate";
import Home from "./pages/home";

import Referrals from "@/pages/referrals";
import Residents from "@/pages/residents";
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

// New master build pages
import ClientsPage from "@/pages/clients/index";
import IntakePage from "@/pages/intake/index";
import CaseNotesPage from "@/pages/case-notes/index";
import OnboardingPage from "@/pages/onboarding/index";
import WorkshopStudio from "@/pages/workshop-studio/index";
import FinancePage from "@/pages/finance/index";
import LcpFormPage from "@/pages/lcp-form/index";
import LifeDesignFormPage from "@/pages/life-design/index";

// Remove ProtectedRoutes component as we're handling auth in Router now

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <UniversalSidebar>
      <Switch>
        {isLoading || !isAuthenticated ? (
          <>
            <Route path="/" component={Landing} />
            <Route path="/apply" component={Apply} />
            <Route path="/refer" component={Refer} />
            <Route path="/donate" component={Donate} />
            <Route path="/guest-resources" component={GuestResources} />
            <Route path="/resources" component={Resources} />
            <Route path="/app" component={StaffLogin} />
            <Route path="/lcp/:token" component={LcpFormPage} />
            <Route path="/life-design/:token" component={LifeDesignFormPage} />
            <Route component={NotFound} />
          </>
        ) : (
          <>
            <Route path="/" component={Home} />
            {/* New master build routes */}
            <Route path="/app/clients" component={ClientsPage} />
            <Route path="/app/intake" component={IntakePage} />
            <Route path="/app/case-notes" component={CaseNotesPage} />
            <Route path="/app/onboarding" component={OnboardingPage} />
            <Route path="/app/workshop-studio" component={WorkshopStudio} />
            <Route path="/app/finance" component={FinancePage} />

            {/* Legacy routes preserved */}
            <Route path="/app/referrals" component={Referrals} />
            <Route path="/app/residents" component={Residents} />
            <Route path="/app/residents/:id/case-notes" component={ResidentCaseNotes} />
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
            <Route path="/app/resources" component={Resources} />
            <Route path="/lcp/:token" component={LcpFormPage} />
            <Route path="/life-design/:token" component={LifeDesignFormPage} />
            <Route component={NotFound} />
          </>
        )}
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