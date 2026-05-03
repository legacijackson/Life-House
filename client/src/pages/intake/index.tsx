import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Phone, Search, Plus, Eye, Link, UserCheck, ChevronDown,
  Voicemail, Clock, CheckCircle2, XCircle, RefreshCw, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CallLogEntry {
  id: string;
  callDate?: string;
  callTime?: string;
  contactType: string;
  status: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  takenBy?: string;
  callbackDate?: string;
  callbackAssignedTo?: string;
  reasonForCall?: string;
  callNotes?: string;
  freedomVoiceRecordingUrl?: string;
  intakeStarted?: boolean;
  createdAt: string;
}

interface IntakeApplication {
  id: string;
  type: string;
  status: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  referralSource?: string;
  county?: string;
  cin?: string;
  mcp?: string;
  notes?: string;
  denialReason?: string;
  onboardingStartedAt?: string;
  createdAt: string;
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  const map: Record<string, string> = {
    "in-progress": "bg-blue-50 text-blue-700 border-blue-200",
    "callback": "bg-amber-50 text-amber-700 border-amber-200",
    "resolved": "bg-green-50 text-green-700 border-green-200",
    "closed": "bg-gray-100 text-gray-600",
    "approved": "bg-green-50 text-green-700 border-green-200",
    "denied": "bg-red-50 text-red-700 border-red-200",
    "waitlist": "bg-purple-50 text-purple-700 border-purple-200",
    "onboarding": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "eligibility-interview": "bg-orange-50 text-orange-700 border-orange-200",
  };
  return <Badge variant="outline" className={`text-xs ${map[status] ?? ""}`}>{status}</Badge>;
}

// ── Call Log Form Modal ───────────────────────────────────────────────────────

function CallLogFormModal({ open, onClose, prefill }: {
  open: boolean;
  onClose: () => void;
  prefill?: Partial<CallLogEntry>;
}) {
  const [form, setForm] = useState<Record<string, string>>({
    contactType: prefill?.contactType ?? "Other",
    status: "in-progress",
    firstName: prefill?.firstName ?? "",
    lastName: prefill?.lastName ?? "",
    phone: prefill?.phone ?? "",
    email: prefill?.email ?? "",
    reasonForCall: prefill?.reasonForCall ?? "",
    callNotes: prefill?.callNotes ?? "",
    ...prefill,
  });
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();

  const mutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      apiRequest("POST", "/api/call-log", data).then((r) => r.json()),
    onSuccess: (data) => {
      toast({ title: "Call logged successfully" });
      qc.invalidateQueries({ queryKey: ["/api/call-log"] });
      onClose();
      if (form.contactType === "Lead" || form.contactType === "Client") {
        toast({ description: "Would you like to start onboarding?", title: "Lead captured" });
      }
    },
    onError: () => toast({ title: "Failed to save call", variant: "destructive" }),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Call</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Contact Type *</Label>
              <Select value={form.contactType} onValueChange={(v) => setForm((f) => ({ ...f, contactType: v }))}>
                <SelectTrigger className="h-8 text-sm mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Lead", "Client", "Resource", "Staff", "Other"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger className="h-8 text-sm mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["in-progress", "callback", "resolved", "closed"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">First Name</Label>
              <Input className="h-8 text-sm mt-1" value={form.firstName} onChange={set("firstName")} />
            </div>
            <div>
              <Label className="text-xs">Last Name</Label>
              <Input className="h-8 text-sm mt-1" value={form.lastName} onChange={set("lastName")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Phone</Label>
              <Input className="h-8 text-sm mt-1" value={form.phone} onChange={set("phone")} />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input className="h-8 text-sm mt-1" value={form.email} onChange={set("email")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">County</Label>
              <Input className="h-8 text-sm mt-1" value={form.county ?? ""} onChange={set("county")} />
            </div>
            <div>
              <Label className="text-xs">MCP</Label>
              <Select value={form.mcp ?? ""} onValueChange={(v) => setForm((f) => ({ ...f, mcp: v }))}>
                <SelectTrigger className="h-8 text-sm mt-1">
                  <SelectValue placeholder="Select MCP…" />
                </SelectTrigger>
                <SelectContent>
                  {["Kaiser", "Anthem", "Health Net", "Molina", "Other"].map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Housing Status</Label>
              <Input className="h-8 text-sm mt-1" value={form.housingStatus ?? ""} onChange={set("housingStatus")} />
            </div>
            <div>
              <Label className="text-xs">Supervision Type</Label>
              <Input className="h-8 text-sm mt-1" value={form.supervisionType ?? ""} onChange={set("supervisionType")} />
            </div>
          </div>

          <div>
            <Label className="text-xs">Reason for Call</Label>
            <Textarea className="text-sm mt-1" rows={2} value={form.reasonForCall} onChange={set("reasonForCall")} />
          </div>

          <div>
            <Label className="text-xs">Call Notes</Label>
            <Textarea className="text-sm mt-1" rows={3} value={form.callNotes} onChange={set("callNotes")} />
          </div>

          {form.status === "callback" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Callback Date</Label>
                <Input type="datetime-local" className="h-8 text-sm mt-1" value={form.callbackDate ?? ""} onChange={set("callbackDate")} />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save Call"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Call Log Table ────────────────────────────────────────────────────────────

function CallLogTable({ entries, onNew }: { entries: CallLogEntry[]; onNew: () => void }) {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{entries.length} entries</p>
        <Button size="sm" onClick={onNew} className="h-8 text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" /> Log Call
        </Button>
      </div>
      <div className="space-y-2">
        {entries.map((entry) => (
          <Card key={entry.id} className="border border-gray-100">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                      {[entry.firstName, entry.lastName].filter(Boolean).join(" ") || "Unknown Caller"}
                    </span>
                    <Badge variant="outline" className="text-xs">{entry.contactType}</Badge>
                    {statusBadge(entry.status)}
                  </div>
                  {entry.phone && (
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {entry.phone}
                    </p>
                  )}
                  {entry.reasonForCall && (
                    <p className="text-xs text-gray-600 mt-0.5 truncate max-w-sm">{entry.reasonForCall}</p>
                  )}
                  {entry.callbackDate && (
                    <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Callback: {new Date(entry.callbackDate).toLocaleString()}
                    </p>
                  )}
                  {entry.freedomVoiceRecordingUrl && (
                    <div className="mt-1">
                      <audio controls className="h-8 w-full max-w-xs" src={entry.freedomVoiceRecordingUrl}>
                        Your browser does not support audio.
                      </audio>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-gray-400">{entry.callDate ?? entry.createdAt?.split("T")[0]}</p>
                  {(entry.contactType === "Lead" || entry.contactType === "Client") && !entry.intakeStarted && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs px-2"
                      onClick={() => setLocation(`/app/onboarding?callId=${entry.id}`)}
                    >
                      Start Onboarding
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {entries.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">No calls logged yet.</p>
        )}
      </div>
    </div>
  );
}

// ── Applications Table ────────────────────────────────────────────────────────

function ApplicationsTable({ applications, type }: { applications: IntakeApplication[]; type: string }) {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();

  const updateStatus = useMutation({
    mutationFn: ({ id, status, denialReason }: { id: string; status: string; denialReason?: string }) =>
      apiRequest("PATCH", `/api/intake-applications/${id}`, { status, denialReason }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/intake-applications"] });
      toast({ title: "Status updated" });
    },
  });

  return (
    <div className="space-y-2">
      {applications.map((app) => (
        <Card key={app.id} className="border border-gray-100">
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{app.firstName} {app.lastName}</span>
                  {statusBadge(app.status)}
                </div>
                {app.phone && <p className="text-xs text-gray-500 mt-0.5">{app.phone}</p>}
                {app.county && <p className="text-xs text-gray-500">County: {app.county}</p>}
                {app.denialReason && (
                  <p className="text-xs text-red-600 mt-0.5">Denial: {app.denialReason}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">{new Date(app.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex flex-col gap-1.5 items-end">
                {app.status === "approved" && !app.onboardingStartedAt && (
                  <Button
                    size="sm"
                    className="h-6 text-xs px-2"
                    onClick={() => setLocation(`/app/onboarding?applicationId=${app.id}`)}
                  >
                    Start Onboarding
                  </Button>
                )}
                <Select
                  value={app.status}
                  onValueChange={(s) => updateStatus.mutate({ id: app.id, status: s })}
                >
                  <SelectTrigger className="h-6 text-xs w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["in-progress", "eligibility-interview", "approved", "waitlist", "denied", "closed", "onboarding"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {applications.length === 0 && (
        <p className="text-center text-gray-400 py-8 text-sm">No {type} records found.</p>
      )}
    </div>
  );
}

// ── Main Intake Page ──────────────────────────────────────────────────────────

export default function IntakePage() {
  const [search, setSearch] = useState("");
  const [logFormOpen, setLogFormOpen] = useState(false);
  const { toast } = useToast();

  const { data: callLogEntries = [], isLoading: callsLoading, refetch: refetchCalls } = useQuery<CallLogEntry[]>({
    queryKey: ["/api/call-log"],
    queryFn: () => apiRequest("GET", "/api/call-log").then((r) => r.json()),
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: allApplications = [] } = useQuery<IntakeApplication[]>({
    queryKey: ["/api/intake-applications"],
    queryFn: () => apiRequest("GET", "/api/intake-applications").then((r) => r.json()),
  });

  const leads = (allApplications as IntakeApplication[]).filter((a) => a.type === "lead");
  const applicants = (allApplications as IntakeApplication[]).filter((a) => a.type === "applicant");
  const referrals = (allApplications as IntakeApplication[]).filter((a) => a.type === "referral");

  function filterSearch<T extends { firstName?: string; lastName?: string; phone?: string }>(arr: T[]) {
    if (!search) return arr;
    const q = search.toLowerCase();
    return arr.filter(
      (a) =>
        a.firstName?.toLowerCase().includes(q) ||
        a.lastName?.toLowerCase().includes(q) ||
        a.phone?.toLowerCase().includes(q),
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Phone className="h-6 w-6 text-indigo-600" />
            Intake & Referrals
          </h1>
        </div>
        <Button onClick={() => refetchCalls()} variant="outline" size="sm" className="h-8">
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search name, phone, CIN…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs defaultValue="call-log">
        <TabsList className="mb-4">
          <TabsTrigger value="call-log">
            Call Log <Badge variant="secondary" className="ml-1.5 text-xs">{(callLogEntries as CallLogEntry[]).length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="applications">
            Applications <Badge variant="secondary" className="ml-1.5 text-xs">{applicants.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="leads">
            Leads <Badge variant="secondary" className="ml-1.5 text-xs">{leads.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="referrals">
            Referrals <Badge variant="secondary" className="ml-1.5 text-xs">{referrals.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="call-log">
          <CallLogTable
            entries={filterSearch(callLogEntries as CallLogEntry[])}
            onNew={() => setLogFormOpen(true)}
          />
        </TabsContent>

        <TabsContent value="applications">
          <ApplicationsTable applications={filterSearch(applicants)} type="applicant" />
        </TabsContent>

        <TabsContent value="leads">
          <ApplicationsTable applications={filterSearch(leads)} type="lead" />
        </TabsContent>

        <TabsContent value="referrals">
          <ApplicationsTable applications={filterSearch(referrals)} type="referral" />
        </TabsContent>

        <TabsContent value="resources">
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm mb-3">Recently added resources from calls</p>
            <Button variant="outline" asChild>
              <a href="/app/resources">Open Resources Directory →</a>
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <CallLogFormModal
        open={logFormOpen}
        onClose={() => setLogFormOpen(false)}
      />
    </div>
  );
}
