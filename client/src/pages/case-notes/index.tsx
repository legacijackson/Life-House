import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "wouter";
import {
  FileText, Search, Plus, AlertTriangle, Clock, CheckCircle,
  Filter, X, CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

const NOTE_TYPES = [
  "general", "training", "check-in", "approval", "warning",
  "milestone", "incident", "khrisace", "goal-update", "referral", "special-consideration",
];

const PRIORITIES = [
  { value: 1, label: "1 — Immediate" },
  { value: 2, label: "2 — Same Day" },
  { value: 3, label: "3 — Within Week" },
  { value: 4, label: "4 — General" },
];

interface StaffCaseNote {
  id: string;
  clientId: string;
  clientName?: string;
  noteType: string;
  priority: number;
  title: string;
  summary: string;
  details?: string;
  status: string;
  dueAt?: string;
  submittedAt?: string;
  createdAt: string;
  cptCode?: string;
  icd10Code?: string;
  confidential?: boolean;
  durationMinutes?: number;
}

// ── Status Pill ───────────────────────────────────────────────────────────────

function statusPill(status: string) {
  switch (status) {
    case "overdue":
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">Overdue</Badge>;
    case "extremely-late":
      return <Badge variant="destructive" className="text-xs">EXTREMELY LATE</Badge>;
    case "submitted":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Submitted</Badge>;
    case "archived":
      return <Badge variant="outline" className="text-xs text-gray-400">Archived</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">Draft</Badge>;
  }
}

// ── New Note Form ─────────────────────────────────────────────────────────────

function NewNoteForm({ open, onClose, defaultClientId }: {
  open: boolean;
  onClose: () => void;
  defaultClientId?: string;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    clientId: defaultClientId ?? "",
    noteType: "general",
    priority: 4,
    cptCode: "98960",
    icd10Code: "",
    title: "",
    summary: "",
    details: "",
    outcome: "",
    outcomeType: "past",
    location: "",
    durationMinutes: "",
    followUpDate: "",
    confidential: false,
    status: "submitted",
  });
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: () => apiRequest("GET", "/api/clients").then((r) => r.json()),
    enabled: !defaultClientId,
  });

  const mutation = useMutation({
    mutationFn: (data: typeof form) =>
      apiRequest("POST", "/api/staff-case-notes", data).then((r) => r.json()),
    onSuccess: () => {
      toast({ title: "Case note saved" });
      qc.invalidateQueries({ queryKey: ["/api/staff-case-notes"] });
      onClose();
    },
    onError: () => toast({ title: "Failed to save note", variant: "destructive" }),
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Case Note</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Client *</Label>
              {defaultClientId ? (
                <Input className="h-8 text-sm mt-1" value={form.clientId} disabled />
              ) : (
                <Select value={form.clientId} onValueChange={(v) => setForm((f) => ({ ...f, clientId: v }))}>
                  <SelectTrigger className="h-8 text-sm mt-1">
                    <SelectValue placeholder="Select client…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(clients as any[]).map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label className="text-xs">Note Type *</Label>
              <Select value={form.noteType} onValueChange={(v) => setForm((f) => ({ ...f, noteType: v }))}>
                <SelectTrigger className="h-8 text-sm mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Priority *</Label>
              <Select
                value={String(form.priority)}
                onValueChange={(v) => setForm((f) => ({ ...f, priority: Number(v) }))}
              >
                <SelectTrigger className="h-8 text-sm mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">CPT Code</Label>
              <Input className="h-8 text-sm mt-1" value={form.cptCode} onChange={set("cptCode")} />
            </div>
            <div>
              <Label className="text-xs">ICD-10</Label>
              <Input className="h-8 text-sm mt-1" value={form.icd10Code} onChange={set("icd10Code")} />
            </div>
          </div>

          <div>
            <Label className="text-xs">Title *</Label>
            <Input className="h-8 text-sm mt-1" value={form.title} onChange={set("title")} />
          </div>

          <div>
            <Label className="text-xs">Summary *</Label>
            <Textarea className="text-sm mt-1" rows={3} value={form.summary} onChange={set("summary")} />
          </div>

          <div>
            <Label className="text-xs">Additional Details</Label>
            <Textarea className="text-sm mt-1" rows={2} value={form.details} onChange={set("details")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Outcome Type</Label>
              <Select value={form.outcomeType} onValueChange={(v) => setForm((f) => ({ ...f, outcomeType: v }))}>
                <SelectTrigger className="h-8 text-sm mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="past">Past Outcome</SelectItem>
                  <SelectItem value="expected">Expected Outcome</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Duration (min)</Label>
              <Input type="number" className="h-8 text-sm mt-1" value={form.durationMinutes} onChange={set("durationMinutes")} />
            </div>
          </div>

          <div>
            <Label className="text-xs">Outcome</Label>
            <Textarea className="text-sm mt-1" rows={2} value={form.outcome} onChange={set("outcome")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Location</Label>
              <Input className="h-8 text-sm mt-1" value={form.location} onChange={set("location")} />
            </div>
            <div>
              <Label className="text-xs">Follow-up Date</Label>
              <Input type="date" className="h-8 text-sm mt-1" value={form.followUpDate} onChange={set("followUpDate")} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={form.confidential}
              onCheckedChange={(v) => setForm((f) => ({ ...f, confidential: v }))}
            />
            <Label className="text-xs">Confidential</Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button variant="outline" onClick={() => mutation.mutate({ ...form, status: "draft" })} disabled={mutation.isPending}>
              Save Draft
            </Button>
            <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.clientId || !form.title || !form.summary}>
              {mutation.isPending ? "Saving…" : "Submit Note"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CaseNotesPage() {
  const { user } = useAuth();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const defaultClientId = params.get("clientId") ?? undefined;
  const openNew = params.get("new") === "1";

  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [newNoteOpen, setNewNoteOpen] = useState(openNew);

  const { data: notes = [], isLoading } = useQuery<StaffCaseNote[]>({
    queryKey: ["/api/staff-case-notes", defaultClientId, filterStatus, filterType],
    queryFn: () => {
      const params = new URLSearchParams();
      if (defaultClientId) params.set("clientId", defaultClientId);
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterType !== "all") params.set("type", filterType);
      return apiRequest("GET", `/api/staff-case-notes?${params}`).then((r) => r.json());
    },
    refetchInterval: 60_000,
  });

  const filtered = (notes as StaffCaseNote[]).filter((n) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.summary.toLowerCase().includes(q) || n.noteType.toLowerCase().includes(q);
  });

  const overdue = filtered.filter((n) => n.status === "overdue").length;
  const extremelyLate = filtered.filter((n) => n.status === "extremely-late").length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-600" />
            Case Notes
          </h1>
          {(overdue > 0 || extremelyLate > 0) && (
            <div className="flex items-center gap-2 mt-1">
              {overdue > 0 && (
                <span className="text-xs text-orange-600 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> {overdue} overdue
                </span>
              )}
              {extremelyLate > 0 && (
                <span className="text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> {extremelyLate} extremely late
                </span>
              )}
            </div>
          )}
        </div>
        <Button onClick={() => setNewNoteOpen(true)} className="h-8">
          <Plus className="h-3.5 w-3.5 mr-1" /> New Case Note
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search notes…"
            className="pl-9"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="extremely-late">Extremely Late</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {NOTE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notes List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="mx-auto h-10 w-10 mb-3 opacity-40" />
          <p>No case notes found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((note) => (
            <Card
              key={note.id}
              className={`border ${note.status === "extremely-late" ? "border-red-200 bg-red-50" : note.status === "overdue" ? "border-orange-200 bg-orange-50" : "border-gray-100"}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900 truncate">{note.title}</span>
                      {statusPill(note.status)}
                      <Badge variant="outline" className="text-xs">{note.noteType}</Badge>
                      <Badge variant="outline" className="text-xs">P{note.priority}</Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {note.confidential ? "[Confidential]" : note.summary}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                      {note.cptCode && <span>CPT: {note.cptCode}</span>}
                      {note.durationMinutes && <span>{note.durationMinutes} min</span>}
                    </div>
                  </div>
                  {note.dueAt && note.status === "overdue" && (
                    <div className="text-xs text-orange-600 flex items-center gap-1 shrink-0">
                      <Clock className="h-3.5 w-3.5" />
                      Due {new Date(note.dueAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <NewNoteForm
        open={newNoteOpen}
        onClose={() => setNewNoteOpen(false)}
        defaultClientId={defaultClientId}
      />
    </div>
  );
}
