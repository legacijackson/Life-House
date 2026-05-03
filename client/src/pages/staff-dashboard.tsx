import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Users, FileText, Phone, AlertTriangle, Clock, CheckCircle2,
  ExternalLink, Calendar, Bell, ChevronRight, Home, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt: string;
  profile?: {
    clientType?: string;
    bedAssignment?: string;
    assignedCaseManagerId?: string;
    googleFolderUrl?: string;
    onboardingStatus?: string;
    programProgress?: number;
    recertificationDate?: string;
  };
}

interface StaffCaseNote {
  id: string;
  clientId: string;
  clientName?: string;
  title: string;
  status: string;
  dueAt?: string;
  priority: number;
  noteType: string;
  createdAt: string;
}

interface LhEvent {
  id: string;
  title: string;
  eventType: string;
  startTime: string;
  endTime?: string;
  location?: string;
  capacity?: number;
}

interface CallLogEntry {
  id: string;
  contactType: string;
  status: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  callbackDate?: string;
  callbackAssignedTo?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name?: string) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function typeBadge(type?: string) {
  switch (type) {
    case "non-resident":
      return <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Non-Resident</Badge>;
    case "onboarding":
      return <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">Onboarding</Badge>;
    default:
      return <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Resident</Badge>;
  }
}

function overdueSeverity(status: string) {
  if (status === "extremely-late")
    return "border-red-200 bg-red-50 text-red-700";
  if (status === "overdue")
    return "border-orange-200 bg-orange-50 text-orange-700";
  return "";
}

// ── Client Card ───────────────────────────────────────────────────────────────

function ClientCard({ client }: { client: Client }) {
  const [, setLocation] = useLocation();
  const p = client.profile ?? {};

  return (
    <Card className="border border-gray-100 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-semibold">
              {initials(client.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-gray-900 truncate">{client.name}</span>
              {typeBadge(p.clientType)}
            </div>
            {p.bedAssignment && (
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <Home className="h-3 w-3" /> Bed {p.bedAssignment}
              </p>
            )}
            {p.recertificationDate && (
              <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Recert: {new Date(p.recertificationDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-xs px-2 flex-1"
            onClick={() => setLocation(`/app/case-notes?clientId=${client.id}&new=1`)}
          >
            <FileText className="h-3 w-3 mr-1" /> Note
          </Button>
          {p.googleFolderUrl && (
            <a href={p.googleFolderUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="h-6 text-xs px-2">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-xs px-2"
            onClick={() => setLocation(`/app/clients`)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Overdue Note Row ──────────────────────────────────────────────────────────

function OverdueNoteRow({ note }: { note: StaffCaseNote }) {
  const [, setLocation] = useLocation();
  const isExtreme = note.status === "extremely-late";

  return (
    <div
      className={`flex items-start justify-between gap-3 p-3 rounded-lg border cursor-pointer hover:opacity-90 ${overdueSeverity(note.status)}`}
      onClick={() => setLocation(`/app/case-notes?clientId=${note.clientId}`)}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isExtreme ? "text-red-500" : "text-orange-500"}`} />
        <div>
          <p className="text-sm font-medium">{note.title || note.noteType}</p>
          {note.clientName && <p className="text-xs opacity-70">{note.clientName}</p>}
          {note.dueAt && (
            <p className="text-xs opacity-70">Due: {new Date(note.dueAt).toLocaleDateString()}</p>
          )}
        </div>
      </div>
      <Badge variant="outline" className={`text-xs shrink-0 ${isExtreme ? "border-red-300 text-red-700" : "border-orange-300 text-orange-700"}`}>
        {isExtreme ? "LATE" : "Overdue"}
      </Badge>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function StaffDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isAdmin = (user as any)?.isAdmin;
  const userId = (user as any)?.id;
  const [clientTab, setClientTab] = useState<"mine" | "all">(isAdmin ? "all" : "mine");

  const { data: allClients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: () => apiRequest("GET", "/api/clients").then((r) => r.json()),
  });

  const { data: overdueCaseNotes = [] } = useQuery<StaffCaseNote[]>({
    queryKey: ["/api/staff-case-notes", "overdue"],
    queryFn: () =>
      apiRequest("GET", "/api/staff-case-notes?status=overdue").then((r) => r.json()),
  });

  const { data: extremeLateNotes = [] } = useQuery<StaffCaseNote[]>({
    queryKey: ["/api/staff-case-notes", "extremely-late"],
    queryFn: () =>
      apiRequest("GET", "/api/staff-case-notes?status=extremely-late").then((r) => r.json()),
  });

  const { data: upcomingEvents = [] } = useQuery<LhEvent[]>({
    queryKey: ["/api/lh-events"],
    queryFn: () => apiRequest("GET", "/api/lh-events").then((r) => r.json()),
  });

  const { data: callbacks = [] } = useQuery<CallLogEntry[]>({
    queryKey: ["/api/call-log", "callback"],
    queryFn: () => apiRequest("GET", "/api/call-log?status=callback").then((r) => r.json()),
  });

  const clients = allClients as Client[];
  const myClients = clients.filter((c) => c.profile?.assignedCaseManagerId === userId);
  const displayClients = clientTab === "mine" ? myClients : clients;

  const totalOverdue = (overdueCaseNotes as StaffCaseNote[]).length + (extremeLateNotes as StaffCaseNote[]).length;
  const allLateNotes = [...(extremeLateNotes as StaffCaseNote[]), ...(overdueCaseNotes as StaffCaseNote[])];

  // Upcoming events in the next 7 days
  const now = new Date();
  const weekAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const upcomingThisWeek = (upcomingEvents as LhEvent[]).filter((e) => {
    const t = new Date(e.startTime);
    return t >= now && t <= weekAhead;
  });

  // Pending callbacks
  const pendingCallbacks = (callbacks as CallLogEntry[]).filter(
    (c) => c.status === "callback" && (!c.callbackAssignedTo || c.callbackAssignedTo === userId),
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <Button onClick={() => setLocation("/app/intake")} className="h-9">
          <Plus className="h-4 w-4 mr-2" /> Log Call
        </Button>
      </div>

      {/* Overdue alert banner */}
      {totalOverdue > 0 && (
        <div className="mb-5 p-4 rounded-lg border border-red-200 bg-red-50 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              {(extremeLateNotes as StaffCaseNote[]).length > 0 && (
                <span className="mr-2">{(extremeLateNotes as StaffCaseNote[]).length} EXTREMELY LATE</span>
              )}
              {(overdueCaseNotes as StaffCaseNote[]).length > 0 && (
                <span>{(overdueCaseNotes as StaffCaseNote[]).length} overdue case notes</span>
              )}
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Case notes must be filed within 48 hours of the event.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto h-7 text-xs border-red-300 text-red-700 hover:bg-red-100"
            onClick={() => setLocation("/app/case-notes?status=overdue")}
          >
            View All
          </Button>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
              <p className="text-xs text-gray-500">Total Clients</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{myClients.length}</p>
              <p className="text-xs text-gray-500">My Clients</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${totalOverdue > 0 ? "bg-red-100" : "bg-gray-100"}`}>
              <AlertTriangle className={`h-5 w-5 ${totalOverdue > 0 ? "text-red-600" : "text-gray-400"}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${totalOverdue > 0 ? "text-red-600" : "text-gray-900"}`}>{totalOverdue}</p>
              <p className="text-xs text-gray-500">Overdue Notes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${pendingCallbacks.length > 0 ? "bg-amber-100" : "bg-gray-100"}`}>
              <Phone className={`h-5 w-5 ${pendingCallbacks.length > 0 ? "text-amber-600" : "text-gray-400"}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${pendingCallbacks.length > 0 ? "text-amber-600" : "text-gray-900"}`}>{pendingCallbacks.length}</p>
              <p className="text-xs text-gray-500">Callbacks Due</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Client List — 2/3 width */}
        <div className="lg:col-span-2">
          <Tabs value={clientTab} onValueChange={(v) => setClientTab(v as "mine" | "all")}>
            <div className="flex items-center justify-between mb-3">
              <TabsList>
                <TabsTrigger value="mine">My Clients ({myClients.length})</TabsTrigger>
                <TabsTrigger value="all">All Clients ({clients.length})</TabsTrigger>
              </TabsList>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setLocation("/app/clients")}>
                View All →
              </Button>
            </div>

            <TabsContent value="mine" className="mt-0">
              {myClients.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No clients assigned to you.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {myClients.slice(0, 12).map((c) => <ClientCard key={c.id} client={c} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="all" className="mt-0">
              {clients.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No clients in the system.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {clients.slice(0, 12).map((c) => <ClientCard key={c.id} client={c} />)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right sidebar — 1/3 width */}
        <div className="space-y-5">
          {/* Overdue notes */}
          {allLateNotes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" /> Overdue Case Notes
              </h3>
              <div className="space-y-2">
                {allLateNotes.slice(0, 5).map((n) => (
                  <OverdueNoteRow key={n.id} note={n} />
                ))}
                {allLateNotes.length > 5 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="text-xs text-gray-500 pl-0"
                    onClick={() => setLocation("/app/case-notes?status=overdue")}
                  >
                    +{allLateNotes.length - 5} more
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Upcoming events */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-500" /> Upcoming This Week
              </h3>
              <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={() => setLocation("/app/attendance")}>
                All Events →
              </Button>
            </div>
            {upcomingThisWeek.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No events scheduled this week.</p>
            ) : (
              <div className="space-y-2">
                {upcomingThisWeek.slice(0, 5).map((e) => (
                  <div key={e.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-indigo-50 border border-indigo-100">
                    <Calendar className="h-3.5 w-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-indigo-900 truncate">{e.title}</p>
                      <p className="text-xs text-indigo-600">
                        {new Date(e.startTime).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        {" · "}
                        {new Date(e.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </p>
                      {e.location && <p className="text-xs text-indigo-500 truncate">{e.location}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending callbacks */}
          {pendingCallbacks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-amber-500" /> Pending Callbacks
                </h3>
                <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={() => setLocation("/app/intake")}>
                  View All →
                </Button>
              </div>
              <div className="space-y-2">
                {pendingCallbacks.slice(0, 4).map((c) => (
                  <div key={c.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                    <Phone className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-amber-900 truncate">
                        {[c.firstName, c.lastName].filter(Boolean).join(" ") || "Unknown"}
                      </p>
                      {c.callbackDate && (
                        <p className="text-xs text-amber-600">
                          Due: {new Date(c.callbackDate).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
