import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Users, Search, Phone, ExternalLink, FileText,
  Calendar, MapPin, Plus, ChevronRight, AlertTriangle,
  ClipboardList, Home, Wrench, History, X, Loader2,
  Trash2, Pencil, CheckCircle2, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
    programStatus?: string;
    housingStatus?: string;
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
    emergencyFlag?: boolean;
    idDocumentUrl?: string;
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function ProgramStatusBadge({ client }: { client: Client }) {
  const status = client.profile?.programStatus;
  switch (status) {
    case "active_resident":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Resident</Badge>;
    case "active_client":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Client</Badge>;
    case "discharged":
      return <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200">Discharged</Badge>;
    case "inactive":
      return <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200">Inactive</Badge>;
    case "applicant":
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Applicant</Badge>;
    default:
      return client.role === "Resident"
        ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Resident</Badge>
        : <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Client</Badge>;
  }
}

function HousingStatusBadge({ housingStatus }: { housingStatus?: string }) {
  switch (housingStatus) {
    case "assigned":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"><Home className="h-3 w-3" />Housed</Badge>;
    case "requested":
    case "pending_assignment":
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1"><Clock className="h-3 w-3" />Housing Pending</Badge>;
    case "not_needed":
      return null;
    case "exited":
      return <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200">Exited Housing</Badge>;
    default:
      return null;
  }
}

function StatusBadges({ client }: { client: Client }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <ProgramStatusBadge client={client} />
      <HousingStatusBadge housingStatus={client.profile?.housingStatus} />
    </div>
  );
}

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
            <StatusBadges client={client} />
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

// ── Client Timeline ────────────────────────────────────────────────────────────

function ClientTimeline({ clientId }: { clientId: string }) {
  const { data: events = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/clients/${clientId}/timeline`],
    queryFn: () => apiRequest("GET", `/api/clients/${clientId}/timeline`).then(r => r.json()),
  });

  const iconMap: Record<string, React.ReactNode> = {
    file: <ClipboardList className="h-3 w-3" />,
    check: <CheckCircle2 className="h-3 w-3" />,
    home: <Home className="h-3 w-3" />,
    star: <History className="h-3 w-3" />,
  };
  const colorMap: Record<string, string> = {
    case_note: "bg-blue-100 text-blue-600",
    touchpoint: "bg-green-100 text-green-600",
    housing: "bg-purple-100 text-purple-600",
    milestone: "bg-amber-100 text-amber-600",
  };

  if (isLoading) return <p className="text-xs text-gray-400">Loading timeline…</p>;
  if (!events.length) return <p className="text-xs text-gray-400">No activity recorded yet.</p>;

  return (
    <div className="relative space-y-3">
      <div className="absolute left-3.5 top-0 bottom-0 w-px bg-gray-200" />
      {events.map((evt) => (
        <div key={evt.id} className="flex gap-3 relative">
          <div className={`z-10 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${colorMap[evt.type] ?? "bg-gray-100 text-gray-500"}`}>
            {iconMap[evt.icon] ?? <ClipboardList className="h-3 w-3" />}
          </div>
          <div className="flex-1 min-w-0 pb-2">
            <p className="text-xs font-medium text-gray-900 leading-tight">{evt.title}</p>
            {evt.description && (
              <p className="text-xs text-gray-500 truncate mt-0.5">{evt.description}</p>
            )}
            <p className="text-[10px] text-gray-400 mt-0.5">
              {evt.date ? new Date(evt.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Small inline modal helper ─────────────────────────────────────────────────

function MiniModal({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

// ── Assign Housing Modal ──────────────────────────────────────────────────────

interface ChecklistItem { key: string; label: string; status: 'pending' | 'done' | 'na'; note?: string }
interface HousingChecklistData { id: string; type: string; items: ChecklistItem[]; completedAt: string | null; createdAt: string }

function HousingChecklistPanel({ clientId }: { clientId: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newType, setNewType] = useState<string>('move_out');
  const [showNew, setShowNew] = useState(false);

  const { data: checklists, isLoading } = useQuery<HousingChecklistData[]>({
    queryKey: ['/api/housing/checklists', clientId],
    queryFn: () => fetch(`/api/housing/checklists/${clientId}`, { credentials: 'include' }).then(r => r.json()),
  });

  const updateItems = useMutation({
    mutationFn: ({ id, items }: { id: string; items: ChecklistItem[] }) =>
      apiRequest('PATCH', `/api/housing/checklists/${id}/items`, { items }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/housing/checklists', clientId] });
      toast({ title: 'Checklist updated' });
    },
  });

  const createChecklist = useMutation({
    mutationFn: () => apiRequest('POST', '/api/housing/checklists', { clientId, type: newType }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/housing/checklists', clientId] });
      setShowNew(false);
      toast({ title: 'Checklist created' });
    },
  });

  const toggleItem = (checklist: HousingChecklistData, item: ChecklistItem) => {
    const next: ChecklistItem['status'] = item.status === 'pending' ? 'done' : item.status === 'done' ? 'na' : 'pending';
    const items = checklist.items.map(i => i.key === item.key ? { ...i, status: next } : i);
    updateItems.mutate({ id: checklist.id, items });
  };

  if (isLoading) return <p className="text-xs text-gray-500">Loading checklists…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Housing Checklists</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowNew(v => !v)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> New Checklist
        </Button>
      </div>

      {showNew && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
          <Select value={newType} onValueChange={setNewType}>
            <SelectTrigger className="h-8 text-xs w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="move_out">Move-Out Checklist</SelectItem>
              <SelectItem value="room_inspection">Room Inspection</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8 text-xs" onClick={() => createChecklist.mutate()} disabled={createChecklist.isPending}>
            Create
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowNew(false)}>Cancel</Button>
        </div>
      )}

      {(!checklists || checklists.length === 0) && (
        <p className="text-xs text-gray-400">No housing checklists yet. A move-in checklist is created automatically when housing is assigned.</p>
      )}

      {checklists?.map(cl => {
        const done = cl.items.filter(i => i.status === 'done' || i.status === 'na').length;
        const total = cl.items.length;
        return (
          <div key={cl.id} className="border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
              <div>
                <span className="text-xs font-semibold capitalize">{cl.type.replace('_', ' ')}</span>
                <span className="text-xs text-gray-500 ml-2">{new Date(cl.createdAt).toLocaleDateString()}</span>
              </div>
              {cl.completedAt ? (
                <Badge className="bg-green-100 text-green-800 text-xs">Completed</Badge>
              ) : (
                <Badge className="bg-yellow-100 text-yellow-800 text-xs">{done}/{total}</Badge>
              )}
            </div>
            <div className="p-3 space-y-1">
              {cl.items.map(item => (
                <button
                  key={item.key}
                  className="flex items-center gap-2 w-full text-left py-1.5 px-2 rounded hover:bg-gray-50 group"
                  onClick={() => toggleItem(cl, item)}
                >
                  {item.status === 'done' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  ) : item.status === 'na' ? (
                    <div className="h-4 w-4 rounded-full bg-gray-300 flex-shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  )}
                  <span className={`text-xs ${item.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AssignHousingModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    propertyId: "",
    roomAssignment: "",
    bedAssignment: "",
    moveInDate: today,
    notes: "",
  });

  const checklistItems = [
    "ID documents on file",
    "Lease agreement signed",
    "House rules acknowledged",
    "Emergency contact collected",
    "Move-in inspection completed",
  ];
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  const assignHousingMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", `/api/clients/${client.id}/assign-housing`, data).then((r) => r.json()),
    onSuccess: () => {
      toast({ title: "Housing assigned", description: `${client.name} has been converted to a Resident.` });
      qc.invalidateQueries({ queryKey: ["/api/clients"] });
      onClose();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to assign housing.", variant: "destructive" });
    },
  });

  function handleSubmit() {
    assignHousingMutation.mutate(form);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Housing — {client.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs">Property / Location</Label>
            <Input
              className="h-8 text-sm mt-1"
              placeholder="e.g. Life House Main — 8399 Folsom Blvd"
              value={form.propertyId}
              onChange={(e) => setForm((f) => ({ ...f, propertyId: e.target.value }))}
            />
          </div>
          <div>
            <Label className="text-xs">Room / Unit</Label>
            <Input
              className="h-8 text-sm mt-1"
              placeholder="e.g. Room 3B"
              value={form.roomAssignment}
              onChange={(e) => setForm((f) => ({ ...f, roomAssignment: e.target.value }))}
            />
          </div>
          <div>
            <Label className="text-xs">Bed / Unit ID</Label>
            <Input
              className="h-8 text-sm mt-1"
              placeholder="e.g. Bed 2"
              value={form.bedAssignment}
              onChange={(e) => setForm((f) => ({ ...f, bedAssignment: e.target.value }))}
            />
          </div>
          <div>
            <Label className="text-xs">Move-in Date</Label>
            <Input
              type="date"
              className="h-8 text-sm mt-1"
              value={form.moveInDate}
              onChange={(e) => setForm((f) => ({ ...f, moveInDate: e.target.value }))}
            />
          </div>
          <div>
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea
              className="text-sm mt-1"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">Pre-Housing Checklist</p>
            <div className="space-y-2">
              {checklistItems.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`chk-${item}`}
                    checked={!!checklist[item]}
                    onChange={(e) => setChecklist((c) => ({ ...c, [item]: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <Label htmlFor={`chk-${item}`} className="text-xs cursor-pointer font-normal">{item}</Label>
                </div>
              ))}
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={assignHousingMutation.isPending}
          >
            {assignHousingMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Assign Housing & Convert to Resident
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Profile Drawer ────────────────────────────────────────────────────────────

function ClientProfileDrawer({ client, onClose }: { client: Client; onClose: () => void }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  // Modal visibility
  const [addContact, setAddContact] = useState(false);
  const [addBenefit, setAddBenefit] = useState(false);
  const [addProvider, setAddProvider] = useState(false);
  const [addGoal, setAddGoal] = useState(false);
  const [assignHousingOpen, setAssignHousingOpen] = useState(false);
  const [carePlanMode, setCarePlanMode] = useState<"list" | "create" | "edit">("list");
  const [editingPlan, setEditingPlan] = useState<any>(null);

  // Form state
  const [contactForm, setContactForm] = useState<Record<string, string>>({});
  const [benefitForm, setBenefitForm] = useState<Record<string, string>>({});
  const [providerForm, setProviderForm] = useState<Record<string, string>>({});
  const [goalForm, setGoalForm] = useState<Record<string, string>>({});
  const [planForm, setPlanForm] = useState<Record<string, string>>({});

  // Queries
  const { data: emergencyContacts = [] } = useQuery<any[]>({
    queryKey: ["/api/clients", client.id, "emergency-contacts"],
    queryFn: () => apiRequest("GET", `/api/clients/${client.id}/emergency-contacts`).then((r) => r.json()),
  });
  const { data: healthProviders = [] } = useQuery<any[]>({
    queryKey: ["/api/clients", client.id, "health-providers"],
    queryFn: () => apiRequest("GET", `/api/clients/${client.id}/health-providers`).then((r) => r.json()),
  });
  const { data: benefits = [] } = useQuery<any[]>({
    queryKey: ["/api/clients", client.id, "benefits"],
    queryFn: () => apiRequest("GET", `/api/clients/${client.id}/benefits`).then((r) => r.json()),
  });
  const { data: goals = [] } = useQuery<any[]>({
    queryKey: ["/api/clients", client.id, "goals"],
    queryFn: () => apiRequest("GET", `/api/clients/${client.id}/goals`).then((r) => r.json()),
  });
  const { data: carePlans = [] } = useQuery<any[]>({
    queryKey: ["/api/clients", client.id, "care-plans"],
    queryFn: () => apiRequest("GET", `/api/clients/${client.id}/care-plans`).then((r) => r.json()),
  });
  const { data: caseNotes = [] } = useQuery<any[]>({
    queryKey: ["/api/clients", client.id, "case-notes"],
    queryFn: () => apiRequest("GET", `/api/staff-case-notes?clientId=${client.id}`).then((r) => r.json()),
  });
  const { data: warnings = [] } = useQuery<any[]>({
    queryKey: ["/api/clients", client.id, "warnings"],
    queryFn: () => apiRequest("GET", `/api/clients/${client.id}/warnings`).then((r) => r.json()),
  });

  // Mutations
  const createContact = useMutation({
    mutationFn: () => apiRequest("POST", `/api/clients/${client.id}/emergency-contacts`, contactForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/clients", client.id, "emergency-contacts"] }); setAddContact(false); setContactForm({}); toast({ title: "Contact added" }); },
  });
  const deleteContact = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/clients/${client.id}/emergency-contacts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/clients", client.id, "emergency-contacts"] }),
  });
  const createBenefit = useMutation({
    mutationFn: () => apiRequest("POST", `/api/clients/${client.id}/benefits`, benefitForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/clients", client.id, "benefits"] }); setAddBenefit(false); setBenefitForm({}); toast({ title: "Benefit added" }); },
  });
  const deleteBenefit = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/clients/${client.id}/benefits/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/clients", client.id, "benefits"] }),
  });
  const createProvider = useMutation({
    mutationFn: () => apiRequest("POST", `/api/clients/${client.id}/health-providers`, providerForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/clients", client.id, "health-providers"] }); setAddProvider(false); setProviderForm({}); toast({ title: "Provider added" }); },
  });
  const deleteProvider = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/clients/${client.id}/health-providers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/clients", client.id, "health-providers"] }),
  });
  const createGoal = useMutation({
    mutationFn: () => apiRequest("POST", `/api/clients/${client.id}/goals`, goalForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/clients", client.id, "goals"] }); setAddGoal(false); setGoalForm({}); toast({ title: "Goal added" }); },
  });
  const toggleGoal = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/clients/${client.id}/goals/${id}`, { status, completedAt: status === "completed" ? new Date().toISOString() : null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/clients", client.id, "goals"] }),
  });
  const deleteGoal = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/clients/${client.id}/goals/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/clients", client.id, "goals"] }),
  });
  const createPlan = useMutation({
    mutationFn: () => apiRequest("POST", `/api/clients/${client.id}/care-plans`, {
      title: planForm.title || "Care Plan",
      content: {
        strengths: planForm.strengths,
        barriers: planForm.barriers,
        interventions: planForm.interventions,
        medications: planForm.medications,
        nextReview: planForm.nextReview,
      },
      dueAt: planForm.dueAt || null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/clients", client.id, "care-plans"] }); setCarePlanMode("list"); setPlanForm({}); toast({ title: "Care plan created" }); },
  });
  const updatePlan = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/clients/${client.id}/care-plans/${editingPlan.id}`, {
      title: planForm.title || editingPlan.title,
      content: {
        strengths: planForm.strengths,
        barriers: planForm.barriers,
        interventions: planForm.interventions,
        medications: planForm.medications,
        nextReview: planForm.nextReview,
      },
      status: planForm.status || editingPlan.status,
      dueAt: planForm.dueAt || editingPlan.dueAt,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/clients", client.id, "care-plans"] }); setCarePlanMode("list"); setEditingPlan(null); setPlanForm({}); toast({ title: "Care plan updated" }); },
  });
  const deletePlan = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/clients/${client.id}/care-plans/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/clients", client.id, "care-plans"] }),
  });

  const updateProfile = useMutation({
    mutationFn: (fields: Record<string, any>) => apiRequest("PATCH", `/api/clients/${client.id}/profile`, fields),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({ title: "Profile updated" });
    },
  });

  const p = client.profile ?? {};
  const daysInProgram = p.programProgress ?? 0;
  const progressPct = Math.min(Math.round((daysInProgram / 90) * 100), 100);

  function startEditPlan(plan: any) {
    setEditingPlan(plan);
    setPlanForm({
      title: plan.title,
      status: plan.status,
      dueAt: plan.dueAt ? plan.dueAt.slice(0, 10) : "",
      strengths: plan.content?.strengths ?? "",
      barriers: plan.content?.barriers ?? "",
      interventions: planForm.interventions ?? plan.content?.interventions ?? "",
      medications: plan.content?.medications ?? "",
      nextReview: plan.content?.nextReview ?? "",
    });
    setCarePlanMode("edit");
  }

  const PlanForm = ({ mode }: { mode: "create" | "edit" }) => (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Title</Label>
        <Input className="h-8 text-sm mt-1" value={planForm.title ?? ""} onChange={(e) => setPlanForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. 90-Day Care Plan" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Due Date</Label>
          <Input type="date" className="h-8 text-sm mt-1" value={planForm.dueAt ?? ""} onChange={(e) => setPlanForm((p) => ({ ...p, dueAt: e.target.value }))} />
        </div>
        {mode === "edit" && (
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={planForm.status ?? ""} onValueChange={(v) => setPlanForm((p) => ({ ...p, status: v }))}>
              <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["draft", "active", "completed", "signed"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      {[
        ["strengths", "Client Strengths"],
        ["barriers", "Identified Barriers"],
        ["interventions", "Planned Interventions"],
        ["medications", "Current Medications"],
      ].map(([k, label]) => (
        <div key={k}>
          <Label className="text-xs">{label}</Label>
          <Textarea className="text-sm mt-1" rows={2} value={planForm[k] ?? ""} onChange={(e) => setPlanForm((p) => ({ ...p, [k]: e.target.value }))} />
        </div>
      ))}
      <div>
        <Label className="text-xs">Next Review Date</Label>
        <Input type="date" className="h-8 text-sm mt-1" value={planForm.nextReview ?? ""} onChange={(e) => setPlanForm((p) => ({ ...p, nextReview: e.target.value }))} />
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={() => mode === "create" ? createPlan.mutate() : updatePlan.mutate()} disabled={createPlan.isPending || updatePlan.isPending}>
          {(createPlan.isPending || updatePlan.isPending) && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
          {mode === "create" ? "Create Plan" : "Save Changes"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => { setCarePlanMode("list"); setEditingPlan(null); setPlanForm({}); }}>Cancel</Button>
      </div>
    </div>
  );

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
        <div className="flex items-center gap-2">
          {client.profile?.programStatus !== "active_resident" && client.profile?.programStatus !== "discharged" && (
            <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => setAssignHousingOpen(true)}>
              <Home className="h-3.5 w-3.5 mr-1.5" /> Assign Housing
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {assignHousingOpen && (
        <AssignHousingModal client={client} onClose={() => setAssignHousingOpen(false)} />
      )}

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
          <TabsTrigger value="housing" className="text-xs">Housing</TabsTrigger>
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

            {/* Benefits */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-gray-700">Benefits</p>
                <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => setAddBenefit(true)}>
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
              {(benefits as any[]).length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {(benefits as any[]).map((b: any) => (
                    <div key={b.id} className="flex items-center gap-1 text-xs bg-gray-100 rounded-full px-2 py-0.5">
                      <span className="text-gray-700">{b.benefitType} · {b.status}</span>
                      <button onClick={() => deleteBenefit.mutate(b.id)} className="text-gray-300 hover:text-red-400">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No benefits on file.</p>
              )}
            </div>
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

            <EditableBlock
              label="Prescriptions"
              value={p.prescriptions}
              onSave={(v) => updateProfile.mutate({ prescriptions: v })}
            />
            <EditableBlock
              label="Dietary Restrictions"
              value={p.dietaryRestrictions}
              onSave={(v) => updateProfile.mutate({ dietaryRestrictions: v })}
            />

            {/* Health Providers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-700">Health Providers</p>
                <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => setAddProvider(true)}>
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
              {(healthProviders as any[]).length > 0 ? (
                <div className="space-y-2">
                  {(healthProviders as any[]).map((hp: any) => (
                    <div key={hp.id} className="text-xs bg-gray-50 rounded p-2 flex justify-between">
                      <div>
                        <p className="font-medium">{hp.name} <span className="text-gray-500">({hp.providerType})</span></p>
                        {hp.organization && <p className="text-gray-600">{hp.organization}</p>}
                        {hp.phone && <p className="text-gray-600">{hp.phone}</p>}
                      </div>
                      <button onClick={() => deleteProvider.mutate(hp.id)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                        <Trash2 className="h-3 w-3" />
                      </button>
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
                <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => setAddContact(true)}>
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
              {(emergencyContacts as any[]).length > 0 ? (
                <div className="space-y-2">
                  {(emergencyContacts as any[]).map((ec: any) => (
                    <div key={ec.id} className="text-xs bg-gray-50 rounded p-2 flex justify-between">
                      <div>
                        <p className="font-medium">{ec.name} <span className="text-gray-500">({ec.relationship})</span></p>
                        <p className="text-gray-600">{ec.phone}</p>
                        {ec.email && <p className="text-gray-600">{ec.email}</p>}
                        {ec.isNextOfKin && <Badge variant="outline" className="mt-1 text-xs">Next of Kin</Badge>}
                      </div>
                      <button onClick={() => deleteContact.mutate(ec.id)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                        <Trash2 className="h-3 w-3" />
                      </button>
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
            {carePlanMode === "list" && (
              <>
                {/* Goals section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-700">Goals</p>
                    <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => setAddGoal(true)}>
                      <Plus className="h-3 w-3 mr-1" /> Add Goal
                    </Button>
                  </div>
                  {(goals as any[]).length > 0 ? (
                    <div className="space-y-1.5">
                      {(goals as any[]).map((g: any) => (
                        <div key={g.id} className="text-xs bg-gray-50 rounded p-2 flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            <button
                              onClick={() => toggleGoal.mutate({ id: g.id, status: g.status === "completed" ? "active" : "completed" })}
                              className="mt-0.5 flex-shrink-0"
                            >
                              <CheckCircle2 className={`h-3.5 w-3.5 ${g.status === "completed" ? "text-green-500" : "text-gray-300"}`} />
                            </button>
                            <div>
                              <p className={`font-medium ${g.status === "completed" ? "line-through text-gray-400" : ""}`}>{g.title}</p>
                              {g.category && <p className="text-gray-500">{g.category}</p>}
                              {g.targetDate && <p className="text-gray-400">Due: {g.targetDate}</p>}
                            </div>
                          </div>
                          <button onClick={() => deleteGoal.mutate(g.id)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">No goals set.</p>
                  )}
                </div>

                {/* Care plans section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-700">Care Plans</p>
                    <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => { setPlanForm({}); setCarePlanMode("create"); }}>
                      <Plus className="h-3 w-3 mr-1" /> New Plan
                    </Button>
                  </div>
                  {(carePlans as any[]).length > 0 ? (
                    <div className="space-y-2">
                      {(carePlans as any[]).map((plan: any) => (
                        <div key={plan.id} className="text-xs bg-gray-50 rounded p-3">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="font-medium text-gray-800">{plan.title}</p>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className={`text-xs ${plan.status === "signed" ? "border-green-300 text-green-700" : plan.status === "active" ? "border-blue-300 text-blue-700" : ""}`}>
                                {plan.status}
                              </Badge>
                              <button onClick={() => startEditPlan(plan)} className="text-gray-400 hover:text-indigo-600">
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button onClick={() => deletePlan.mutate(plan.id)} className="text-gray-300 hover:text-red-400">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          {plan.dueAt && <p className="text-gray-500">Due: {new Date(plan.dueAt).toLocaleDateString()}</p>}
                          {plan.content?.strengths && <p className="text-gray-600 mt-1"><span className="font-medium">Strengths:</span> {plan.content.strengths}</p>}
                          {plan.content?.interventions && <p className="text-gray-600 mt-0.5"><span className="font-medium">Interventions:</span> {plan.content.interventions}</p>}
                          {plan.googleDriveUrl && (
                            <a href={plan.googleDriveUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 mt-1">
                              <ExternalLink className="h-3 w-3" /> View in Drive
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">No care plans on file.</p>
                  )}
                </div>
              </>
            )}

            {(carePlanMode === "create" || carePlanMode === "edit") && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-3">{carePlanMode === "create" ? "New Care Plan" : "Edit Care Plan"}</p>
                <PlanForm mode={carePlanMode} />
              </div>
            )}
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

          {/* Housing Tab */}
          <TabsContent value="housing" className="p-4 space-y-4 mt-0">
            <HousingChecklistPanel clientId={client.id} />
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="p-4 space-y-4 mt-0">
            <Button size="sm" className="h-7 text-xs" onClick={() => setLocation(`/app/maintenance?clientId=${client.id}`)}>
              <Wrench className="h-3.5 w-3.5 mr-1" /> View / Submit Tickets
            </Button>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="p-4 space-y-3 mt-0">
            <ClientTimeline clientId={client.id} />
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

      {/* Add Contact Modal */}
      <MiniModal title="Add Emergency Contact" open={addContact} onClose={() => setAddContact(false)}>
        <div className="space-y-3 mt-2">
          {[["name","Name *"],["relationship","Relationship"],["phone","Phone *"],["email","Email"]].map(([k,label]) => (
            <div key={k}>
              <Label className="text-xs">{label}</Label>
              <Input className="h-8 text-sm mt-1" value={contactForm[k] ?? ""} onChange={(e) => setContactForm((p) => ({ ...p, [k]: e.target.value }))} />
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="nextOfKin" checked={contactForm.isNextOfKin === "1"} onChange={(e) => setContactForm((p) => ({ ...p, isNextOfKin: e.target.checked ? "1" : "" }))} />
            <Label htmlFor="nextOfKin" className="text-xs cursor-pointer">Next of Kin</Label>
          </div>
          <Button size="sm" className="w-full" onClick={() => createContact.mutate()} disabled={!contactForm.name || !contactForm.phone || createContact.isPending}>
            {createContact.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />} Add Contact
          </Button>
        </div>
      </MiniModal>

      {/* Add Benefit Modal */}
      <MiniModal title="Add Benefit" open={addBenefit} onClose={() => setAddBenefit(false)}>
        <div className="space-y-3 mt-2">
          <div>
            <Label className="text-xs">Benefit Type *</Label>
            <Select value={benefitForm.benefitType ?? ""} onValueChange={(v) => setBenefitForm((p) => ({ ...p, benefitType: v }))}>
              <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {["Medi-Cal","Medicare","CalFresh","SSI","SSDI","GA/GR","TANF","CalWORKs","Housing Voucher","Other"].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Status *</Label>
            <Select value={benefitForm.status ?? ""} onValueChange={(v) => setBenefitForm((p) => ({ ...p, status: v }))}>
              <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {["active","applied","needed","pending","denied"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {[["providerName","Provider Name"],["accountNumber","Account / Case #"],["startDate","Start Date"],["renewalDate","Renewal Date"],["notes","Notes"]].map(([k,label]) => (
            <div key={k}>
              <Label className="text-xs">{label}</Label>
              <Input className="h-8 text-sm mt-1" type={k.includes("Date") ? "date" : "text"} value={benefitForm[k] ?? ""} onChange={(e) => setBenefitForm((p) => ({ ...p, [k]: e.target.value }))} />
            </div>
          ))}
          <Button size="sm" className="w-full" onClick={() => createBenefit.mutate()} disabled={!benefitForm.benefitType || !benefitForm.status || createBenefit.isPending}>
            {createBenefit.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />} Add Benefit
          </Button>
        </div>
      </MiniModal>

      {/* Add Health Provider Modal */}
      <MiniModal title="Add Health Provider" open={addProvider} onClose={() => setAddProvider(false)}>
        <div className="space-y-3 mt-2">
          <div>
            <Label className="text-xs">Provider Type *</Label>
            <Select value={providerForm.providerType ?? ""} onValueChange={(v) => setProviderForm((p) => ({ ...p, providerType: v }))}>
              <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {["PCP","Psychiatrist","Therapist","Dentist","Optometrist","Specialist","Pharmacist","Other"].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {[["name","Provider Name *"],["organization","Organization / Practice"],["phone","Phone"],["email","Email"],["npi","NPI Number"],["address","Address"]].map(([k,label]) => (
            <div key={k}>
              <Label className="text-xs">{label}</Label>
              <Input className="h-8 text-sm mt-1" value={providerForm[k] ?? ""} onChange={(e) => setProviderForm((p) => ({ ...p, [k]: e.target.value }))} />
            </div>
          ))}
          <Button size="sm" className="w-full" onClick={() => createProvider.mutate()} disabled={!providerForm.name || !providerForm.providerType || createProvider.isPending}>
            {createProvider.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />} Add Provider
          </Button>
        </div>
      </MiniModal>

      {/* Add Goal Modal */}
      <MiniModal title="Add Goal" open={addGoal} onClose={() => setAddGoal(false)}>
        <div className="space-y-3 mt-2">
          <div>
            <Label className="text-xs">Goal Title *</Label>
            <Input className="h-8 text-sm mt-1" value={goalForm.title ?? ""} onChange={(e) => setGoalForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Maintain sobriety for 90 days" />
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={goalForm.category ?? ""} onValueChange={(v) => setGoalForm((p) => ({ ...p, category: v }))}>
              <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {["Housing","Employment","Health","Legal","Financial","Education","Sobriety","Life Skills","Family","Other"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea className="text-sm mt-1" rows={2} value={goalForm.description ?? ""} onChange={(e) => setGoalForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Target Date</Label>
            <Input type="date" className="h-8 text-sm mt-1" value={goalForm.targetDate ?? ""} onChange={(e) => setGoalForm((p) => ({ ...p, targetDate: e.target.value }))} />
          </div>
          <Button size="sm" className="w-full" onClick={() => createGoal.mutate()} disabled={!goalForm.title || createGoal.isPending}>
            {createGoal.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />} Add Goal
          </Button>
        </div>
      </MiniModal>
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

function EditableBlock({ label, value, onSave }: { label: string; value?: string | null; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <p className="text-xs font-semibold text-gray-700">{label}</p>
        <button onClick={() => { setDraft(value ?? ""); setEditing(!editing); }} className="text-xs text-indigo-500 hover:text-indigo-700">
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>
      {editing ? (
        <div className="space-y-1.5">
          <Textarea
            className="text-xs"
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <Button size="sm" className="h-6 text-xs" onClick={() => { onSave(draft); setEditing(false); }}>Save</Button>
        </div>
      ) : (
        <p className="text-xs text-gray-700 whitespace-pre-line">{value ?? <span className="text-gray-400 italic">Not set — click Edit to add</span>}</p>
      )}
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
  const [waitlistAssignClient, setWaitlistAssignClient] = useState<{ id: string; name: string } | null>(null);
  const { toast } = useToast();

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients", filter],
    queryFn: () =>
      apiRequest("GET", `/api/clients?type=${filter}`).then((r) => r.json()),
  });

  const { data: waitlist = [], isLoading: waitlistLoading } = useQuery<any[]>({
    queryKey: ["/api/housing/waitlist"],
    queryFn: () => apiRequest("GET", "/api/housing/waitlist").then((r) => r.json()),
  });

  const waitlistCount = (waitlist as any[]).length;

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

      <Tabs defaultValue="clients">
        <TabsList className="mb-4">
          <TabsTrigger value="clients">All Clients</TabsTrigger>
          <TabsTrigger value="waitlist">
            Housing Waitlist
            {waitlistCount > 0 && (
              <Badge className="ml-2 bg-amber-100 text-amber-700">{waitlistCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
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
                <SelectItem value="active_client">Active Clients</SelectItem>
                <SelectItem value="active_resident">Active Residents</SelectItem>
                <SelectItem value="housing_pending">Housing Pending</SelectItem>
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
        </TabsContent>

        <TabsContent value="waitlist">
          {waitlistLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : (waitlist as any[]).length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Home className="mx-auto h-12 w-12 mb-3 opacity-40" />
              <p>No pending housing requests</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 pr-4 font-medium">Email</th>
                    <th className="pb-2 pr-4 font-medium">Request Date</th>
                    <th className="pb-2 pr-4 font-medium">Priority</th>
                    <th className="pb-2 pr-4 font-medium">Reason</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(waitlist as any[]).map((entry: any) => (
                    <tr key={entry.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium text-gray-900">{entry.name ?? entry.clientName ?? "—"}</td>
                      <td className="py-3 pr-4 text-gray-600">{entry.email ?? "—"}</td>
                      <td className="py-3 pr-4 text-gray-600">
                        {entry.requestDate || entry.createdAt
                          ? new Date(entry.requestDate ?? entry.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        {entry.priority ? (
                          <Badge variant="outline" className="text-xs">{entry.priority}</Badge>
                        ) : "—"}
                      </td>
                      <td className="py-3 pr-4 text-gray-600 max-w-xs truncate">
                        {entry.reason ? entry.reason.slice(0, 60) + (entry.reason.length > 60 ? "…" : "") : "—"}
                      </td>
                      <td className="py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setWaitlistAssignClient({ id: entry.clientId ?? entry.id, name: entry.name ?? entry.clientName ?? "Client" })}
                        >
                          Review & Assign
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

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

      {/* Waitlist Assign Housing Modal */}
      {waitlistAssignClient && (
        <AssignHousingModal
          client={{ id: waitlistAssignClient.id, name: waitlistAssignClient.name, role: "Client" } as Client}
          onClose={() => setWaitlistAssignClient(null)}
        />
      )}
    </div>
  );
}
