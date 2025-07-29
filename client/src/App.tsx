import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Residents from "@/pages/residents";
import CaseNotes from "@/pages/case-notes";
import Attendance from "@/pages/attendance";
import Resources from "@/pages/resources";
import Properties from "@/pages/properties";
import Maintenance from "@/pages/maintenance";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/residents" component={Residents} />
      <Route path="/case-notes" component={CaseNotes} />
      <Route path="/attendance" component={Attendance} />
      <Route path="/resources" component={Resources} />
      <Route path="/properties" component={Properties} />
      <Route path="/maintenance" component={Maintenance} />
      <Route path="/reports" component={Reports} />
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
