import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Users, Search, Filter, Phone, Mail, ExternalLink, FileText,
  Calendar, MapPin, Plus, ChevronRight, AlertTriangle, Shield,
  Heart, ClipboardList, Home, Wrench, BookOpen, History, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

// ── Types ────────────────────────────────────────────────────────────────────

interface Client {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role: string;
  profileImageUrl?: string;
  createdAt: string;
  profile?: {
    clientType?: string;
    onboardingStatus?: string;
    onboardingPhase?: string;
    cin?: string;
    preferredName?: string;
    dob?: string;
    phonePrimary?: string;
    phoneSecondary?: string;
    county?: string;
    bedAssignment?: string;
    assignedCaseManagerId?: string;
    enrollmentDate?: string;
    releaseDate?: string;
    recertificationDate?: string;
    programProgress?: number;
    payType?: string;
    rentAmount?: string;
    googleFolderUrl?: string;
    lastGeoLat?: string;
    lastGeoLng?: string;
    lastGeoTimestamp?: string;
    mcpProvider?: string;
    authorizationCode?: string;
    icd10Codes?: string[];
    prescriptions?: string;
    dietaryRestrictions?: string;
    bicCardStatus?: string;
    patientAccount?: string;
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function clientTypeBadge(type?: string) {
  switch (type) {
    case "non-resident": return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Non-Resident</Badge>;
    case "onboarding": return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Onboarding</Badge>;
    default: return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Resident</Badge>;
  }
}

function initials(name?: string) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ── Client Card ───────────────────────────────────────────────────────────────

function ClientCard({ client, onClick }: { client: Client; onClick: () => void }) {
  const [, setLocation] = useLocation();
  const type = client.profile?.clientType;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border border-gray-100"
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-start gap-3">
        <Avatar className="h-12 w-12 flex-shrink-0">
          {client.profileImageUrl ? (
            <img src={client.profileImageUrl} alt={client.name ?? ""} className="rounded-full" />
          ) : (
            <AvatarFallback className="text-sm font-semibold bg-indigo-100 text-indigo-700">
              {initials(client.name)}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900 truncate">{client.name}</p>
              {client.profile?.preferredName && (
                <p className="text-xs text-gray-500">"{client.profile.preferredName}"</p>
              )}
            </div>
            {clientTypeBadge(type)}
          </div>
          <div className="mt-1 space-y-0.5 text-sm text-gray-600">
            {(client.profile?.phonePrimary ?? client.phone) && (
              <div className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                {client.profile?.phonePrimary ?? client.phone}
              </div>
            )}
            {client.profile?.bedAssignment && (
              <div className="flex items-center gap-1">
                <Home className="h-3.5 w-3.5 text-gray-400" />
                Bed {client.profile.bedAssignment}
              </div>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            {type === "onboarding" && (
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-xs px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocation(`/app/onboarding?clientId=${client.id}`);
                }}
              >
                Onboarding ↗
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs px-2"
              onClick={(e) => {
                e.stopPropagation();
                setLocation(`/app/case-notes?clientId=${client.id}`);
              }}
            >
              <FileText className="h-3.5 w-3.5 mr-1" /> Notes
            </Button>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
      </CardContent>
    </Card>
  );
}

// ── Profile Drawer ────────────────────────────────────────────────────────────

function ClientProfileDrawer({ client, onClose }: { client: Client; onClose: () => void }) {
  const [, setLocation] = useLocation();

  const { data: emergencyContacts } = useQuery({
    queryKey: ["/api/clients", client.id, "emergency-contacts"],
    queryFn: () => apiRequest("GET", `/api/clients/${client.id}/emergency-contacts`).then((r) => r.json()),
  });

  const { data: healthProviders } = useQuery({
    queryKey: ["/api/clients", client.id, "health-providers"],
    queryFn: () => apiRequest("GET", `/api/clients/${client.id}/health-providers`).then((r) => r.json()),
  });

  const { data: benefits } = useQuery({
    queryKey: ["/api/clients", client.id, "benefits"],
    queryFn: () => apiRequest("GET", `/api/clients/${client.id}/benefits`).then((r) => r.json()),
  });

  const { data: goals } = useQuery({
    queryKey: ["/api/clients", client.id, "goals"],
    queryFn: () => apiRequest("GET", `/api/clients/${client.id}/goals`).then((r) => r.json()),
  });

  const { data: caseNotes } = useQuery({
    queryKey: ["/api/clients", client.id, "case-notes"],
    queryFn: () => apiRequest("GET", `/api/staff-case-notes?clientId=${client.id}`).then((r) => r.json()),
  });

  const { data: warnings } = useQuery({
    queryKey: ["/api/clients", client.id, "warnings"],
    queryFn: () => apiRequest("GET", `/api/clients/${client.id}/warnings`).then((r) => r.json()),
  });

  const p = client.profile ?? {};
  const daysInProgram = p.programProgress ?? 0;
  const progressPct = Math.min(Math.round((daysInProgram / 90) * 100), 100);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b">
        <div className="flex items-start gap-3">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="text-base font-bold bg-indigo-100 text-indigo-700">
              {initials(client.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{client.name}</h2>
            {p.preferredName && <p className="text-sm text-gray-500">"{p.preferredName}"</p>}
            <div className="flex items-center gap-2 mt-1">
              {clientTypeBadge(p.clientType)}
              {p.emergencyFlag && (
                <Badge variant="destructive" className="text-xs">Emergency</Badge>
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
        <TabsList className="mx-4 mt-2 flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="health" className="text-xs">Health</TabsTrigger>
          <TabsTrigger value="contacts" className="text-xs">Contacts</TabsTrigger>
          <TabsTrigger value="careplan" className="text-xs">Care Plan</TabsTrigger>
          <TabsTrigger value="notes" className="text-xs">Case Notes</TabsTrigger>
          <TabsTrigger value="events" className="text-xs">Events</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs">Documents</TabsTrigger>
          <TabsTrigger value="maintenance" className="text-xs">Maintenance</TabsTrigger>
          <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          {/* Overview Tab */}
          <TabsContent value="overview" className="p-4 space-y-4 mt-0">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoField label="CIN" value={p.cin} />
              <InfoField label="Patient Account" value={p.patientAccount} />
              <InfoField label="DOB" value={p.dob} />
              <InfoField label="County" value={p.county} />
              <InfoField label="Phone" value={p.phonePrimary ?? client.phone} />
              <InfoField label="Alt Phone" value={p.phoneSecondary} />
              <InfoField label="Email" value={client.email} />
              <InfoField label="Bed" value={p.bedAssignment} />
              <InfoField label="Enrollment" value={p.enrollmentDate} />
              <InfoField label="Release Date" value={p.releaseDate} />
              <InfoField label="Recertification" value={p.recertificationDate} />
              <InfoField label="Pay Type" value={p.payType} />
              <InfoField label="Rent" value={p.rentAmount ? `$${p.rentAmount}` : undefined} />
            </div>

            {daysInProgram > 0 && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Program Progress</span>
                  <span>{daysInProgram} days</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${progressPct}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{progressPct}% of 90-day program</p>
              </div>
            )}

            {p.googleFolderUrl && (
              <a
                href={p.googleFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Google Drive Folder
              </a>
            )}

            {(p.lastGeoLat && p.lastGeoLng) && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                Last seen: {p.lastGeoLat}, {p.lastGeoLng}
                {p.lastGeoTimestamp && <span>· {new Date(p.lastGeoTimestamp).toLocaleString()}</span>}
                <a
                  href={`https://www.google.com/maps?q=${p.lastGeoLat},${p.lastGeoLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-1"
                >
                  Map
                </a>
              </div>
            )}

            {/* Authorization form assignment */}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1.5">Assign Authorization Form</p>
              <Select onValueChange={(type) => {
                apiRequest("POST", "/api/authorization-requests", {
                  clientId: client.id,
                  formType: type,
                }).catch(console.error);
              }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select form type…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overnight">Overnight Authorization</SelectItem>
                  <SelectItem value="car-rental">Car Rental Authorization</SelectItem>
                  <SelectItem value="guest">Guest Authorization</SelectItem>
                  <SelectItem value="food">Food Request</SelectItem>
                  <SelectItem value="clothing">Clothing Request</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Benefits summary */}
            {(benefits as any[])?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1.5">Benefits</p>
                <div className="flex flex-wrap gap-1.5">
                  {(benefits as any[]).map((b: any) => (
                    <Badge key={b.id} variant="outline" className="text-xs">
                      {b.benefitType} · {b.status}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Health Tab */}
          <TabsContent value="health" className="p-4 space-y-4 mt-0">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoField label="MCP" value={p.mcpProvider} />
              <InfoField label="Authorization Code" value={p.authorizationCode} />
              <InfoField label="BIC Card Status" value={p.bicCardStatus} />
              <InfoField label="Pay Type" value={p.payType} />
            </div>

            {p.icd10Codes && Array.isArray(p.icd10Codes) && p.icd10Codes.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">ICD-10 Codes</p>
                <div className="flex flex-wrap gap-1">
                  {p.icd10Codes.map((code: string) => (
                    <Badge key={code} variant="secondary" className="text-xs">{code}</Badge>
                  ))}
                </div>
              </div>
            )}

            {p.prescriptions && (
              <InfoBlock label="Prescriptions" value={p.prescriptions} />
            )}
            {p.dietaryRestrictions && (
              <InfoBlock label="Dietary Restrictions" value={p.dietaryRestrictions} />
            )}

            {/* Health Providers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-700">Health Providers</p>
                <Button variant="outline" size="sm" className="h-6 text-xs px-2">
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
              {(healthProviders as any[])?.length > 0 ? (
                <div className="space-y-2">
                  {(healthProviders as any[]).map((hp: any) => (
                    <div key={hp.id} className="text-xs bg-gray-50 rounded p-2">
                      <p className="font-medium">{hp.name} <span className="text-gray-500">({hp.providerType})</span></p>
                      {hp.organization && <p className="text-gray-600">{hp.organization}</p>}
                      {hp.phone && <p className="text-gray-600">{hp.phone}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No health providers on file.</p>
              )}
            </div>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="p-4 space-y-4 mt-0">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-700">Emergency Contacts</p>
                <Button variant="outline" size="sm" className="h-6 text-xs px-2">
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
              {(emergencyContacts as any[])?.length > 0 ? (
                <div className="space-y-2">
                  {(emergencyContacts as any[]).map((ec: any) => (
                    <div key={ec.id} className="text-xs bg-gray-50 rounded p-2">
                      <p className="font-medium">{ec.name} <span className="text-gray-500">({ec.relationship})</span></p>
                      <p className="text-gray-600">{ec.phone}</p>
                      {ec.email && <p className="text-gray-600">{ec.email}</p>}
                      {ec.isNextOfKin && <Badge variant="outline" className="mt-1 text-xs">Next of Kin</Badge>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No emergency contacts on file.</p>
              )}
            </div>
          </TabsContent>

          {/* Care Plan Tab */}
          <TabsContent value="careplan" className="p-4 space-y-4 mt-0">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-700">Goals</p>
                <Button variant="outline" size="sm" className="h-6 text-xs px-2">
                  <Plus className="h-3 w-3 mr-1" /> Add Goal
                </Button>
              </div>
              {(goals as any[])?.length > 0 ? (
                <div className="space-y-2">
                  {(goals as any[]).map((g: any) => (
                    <div key={g.id} className="text-xs bg-gray-50 rounded p-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{g.title}</p>
                        <Badge variant="outline" className="text-xs">{g.status}</Badge>
                      </div>
                      {g.category && <p className="text-gray-500 mt-0.5">{g.category}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No goals set.</p>
              )}
            </div>
          </TabsContent>

          {/* Case Notes Tab */}
          <TabsContent value="notes" className="p-4 space-y-4 mt-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Case Notes</p>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => setLocation(`/app/case-notes?clientId=${client.id}&new=1`)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Note
              </Button>
            </div>
            {(caseNotes as any[])?.length > 0 ? (
              <div className="space-y-2">
                {(caseNotes as any[]).slice(0, 10).map((n: any) => (
                  <div key={n.id} className="text-xs bg-gray-50 rounded p-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{n.title}</p>
                      <Badge
                        variant="outline"
                        className={`text-xs ${n.status === "overdue" ? "border-orange-300 text-orange-700" : n.status === "extremely-late" ? "border-red-300 text-red-700" : ""}`}
                      >
                        {n.status}
                      </Badge>
                    </div>
                    <p className="text-gray-500 mt-0.5">{n.noteType} · P{n.priority}</p>
                    <p className="text-gray-500">{new Date(n.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No case notes yet.</p>
            )}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="p-4 space-y-4 mt-0">
            <Button size="sm" className="h-7 text-xs" onClick={() => setLocation(`/app/attendance?clientId=${client.id}`)}>
              <Calendar className="h-3.5 w-3.5 mr-1" /> View / Schedule Events
            </Button>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="p-4 space-y-4 mt-0">
            {p.idDocumentUrl && (
              <a href={p.idDocumentUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                <ExternalLink className="h-3.5 w-3.5" /> ID Document
              </a>
            )}
            {p.googleFolderUrl && (
              <a href={p.googleFolderUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                <ExternalLink className="h-3.5 w-3.5" /> All Documents (Drive)
              </a>
            )}
            {(warnings as any[])?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1.5">Warnings Issued</p>
                {(warnings as any[]).map((w: any) => (
                  <div key={w.id} className="text-xs bg-red-50 rounded p-2 mb-1.5">
                    <div className="flex items-center gap-1 font-medium text-red-700">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {w.warningType.toUpperCase()} — {w.reason}
                    </div>
                    <p className="text-gray-600 mt-0.5">{new Date(w.issuedAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="p-4 space-y-4 mt-0">
            <Button size="sm" className="h-7 text-xs" onClick={() => setLocation(`/app/maintenance?clientId=${client.id}`)}>
              <Wrench className="h-3.5 w-3.5 mr-1" /> View / Submit Tickets
            </Button>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="p-4 space-y-4 mt-0">
            <p className="text-xs text-gray-500">Program timeline and touch points log coming soon.</p>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setLocation(`/app/intake?linked=${client.id}`)}
            >
              <History className="h-3.5 w-3.5 mr-1" /> View Call Log
            </Button>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function InfoField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-700 mb-0.5">{label}</p>
      <p className="text-xs text-gray-700 whitespace-pre-line">{value}</p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const { user } = useAuth();
  const isAdmin = (user as any)?.isAdmin;
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { toast } = useToast();

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients", filter],
    queryFn: () =>
      apiRequest("GET", `/api/clients?type=${filter}`).then((r) => r.json()),
  });

  const filtered = (clients as Client[]).filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.profile?.cin?.toLowerCase().includes(q) ||
      c.profile?.patientAccount?.toLowerCase().includes(q)
    );
  });

  function openClient(c: Client) {
    setSelectedClient(c);
    setDrawerOpen(true);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600" />
            Clients
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} {filter === "all" ? "total" : filter} clients
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, CIN, phone…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            <SelectItem value="resident">Residents</SelectItem>
            <SelectItem value="non-resident">Non-Residents</SelectItem>
            <SelectItem value="onboarding">Onboarding</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Client Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users className="mx-auto h-12 w-12 mb-3 opacity-40" />
          <p>No clients found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <ClientCard key={c.id} client={c} onClick={() => openClient(c)} />
          ))}
        </div>
      )}

      {/* Profile Drawer */}
      <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogContent className="max-w-2xl h-[90vh] p-0 overflow-hidden flex flex-col">
          {selectedClient && (
            <ClientProfileDrawer
              client={selectedClient}
              onClose={() => setDrawerOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
