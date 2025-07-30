import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Landing from "@/pages/landing";
import Apply from "@/pages/apply";
import Refer from "@/pages/refer";
import Donate from "@/pages/donate";
import Intake from "@/pages/intake";
import Residents from "@/pages/residents";
import CaseNotes from "@/pages/case-notes";
import Attendance from "@/pages/attendance";
import Resources from "@/pages/resources";
import Properties from "@/pages/properties";
import Maintenance from "@/pages/maintenance";
import Reports from "@/pages/reports";
import { ResidentPortal } from "@/components/resident-portal";
import { StaffDashboard } from "@/components/staff-dashboard";
import { AdminPanel } from "@/components/admin-panel";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/apply" component={Apply} />
      <Route path="/refer" component={Refer} />
      <Route path="/donate" component={Donate} />
      <Route path="/app" component={Dashboard} />
      <Route path="/app/intake" component={Intake} />
      <Route path="/app/residents" component={Residents} />
      <Route path="/app/case-notes" component={CaseNotes} />
      <Route path="/app/attendance" component={Attendance} />
      <Route path="/app/resources" component={Resources} />
      <Route path="/app/properties" component={Properties} />
      <Route path="/app/maintenance" component={Maintenance} />
      <Route path="/app/reports" component={Reports} />
      <Route path="/app/resident-portal" component={ResidentPortal} />
      <Route path="/app/staff-dashboard" component={StaffDashboard} />
      <Route path="/app/admin-panel" component={AdminPanel} />
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
