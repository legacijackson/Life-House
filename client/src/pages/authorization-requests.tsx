import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardCheck, Plus, Search, CheckCircle2, XCircle, Clock, Filter, ExternalLink, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface AuthRequest {
  id: string;
  clientId: string;
  clientName?: string;
  assignedBy?: string;
  formType: string;
  status: string;
  googleDriveUrl?: string;
  denialReason?: string;
  reviewedAt?: string;
  createdAt: string;
}

interface Client {
  id: string;
  name: string;
}

const FORM_TYPES = [
  { value: "overnight", label: "Overnight Pass" },
  { value: "car-rental", label: "Car Rental" },
  { value: "guest", label: "Guest Visit" },
  { value: "food", label: "Food Allowance" },
  { value: "clothing", label: "Clothing Voucher" },
  { value: "other", label: "Other" },
];

function statusBadge(status: string) {
  switch (status) {
    case "approved":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
    case "denied":
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs"><XCircle className="w-3 h-3 mr-1" />Denied</Badge>;
    default:
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
  }
}

function formTypeLabel(t: string) {
  return FORM_TYPES.find((f) => f.value === t)?.label ?? t;
}

export default function AuthorizationRequestsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [newOpen, setNewOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState<AuthRequest | null>(null);
  const [denialReason, setDenialReason] = useState("");
  const [newForm, setNewForm] = useState({ clientId: "", formType: "overnight" });

  const isStaff = ["Admin", "CaseManager"].includes((user as any)?.role ?? "") || (user as any)?.isAdmin;

  const { data: requests = [], isLoading } = useQuery<AuthRequest[]>({
    queryKey: ["/api/authorization-requests"],
  });

  const { data: allClients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: isStaff,
  });

  const createMutation = useMutation({
    mutationFn: (data: { clientId: string; formType: string }) =>
      apiRequest("POST", "/api/authorization-requests", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/authorization-requests"] });
      setNewOpen(false);
      setNewForm({ clientId: "", formType: "overnight" });
      toast({ title: "Request created" });
    },
    onError: () => toast({ title: "Failed to create request", variant: "destructive" }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, denialReason: dr }: { id: string; status: string; denialReason?: string }) =>
      apiRequest("PATCH", `/api/authorization-requests/${id}`, { status, denialReason: dr }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/authorization-requests"] });
      setReviewOpen(null);
      setDenialReason("");
      toast({ title: "Request updated" });
    },
    onError: () => toast({ title: "Failed to update request", variant: "destructive" }),
  });

  const clientMap = Object.fromEntries((allClients as Client[]).map((c) => [c.id, c.name]));

  const filtered = (requests as AuthRequest[]).filter((r) => {
    const name = clientMap[r.clientId] ?? r.clientId;
    if (search && !name.toLowerCase().includes(search.toLowerCase()) && !r.formType.includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (typeFilter !== "all" && r.formType !== typeFilter) return false;
    return true;
  });

  const pendingCount = (requests as AuthRequest[]).filter((r) => r.status === "pending").length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-indigo-600" /> Authorization Requests
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage overnight passes, car rentals, guest visits, and more</p>
        </div>
        {isStaff && (
          <Button onClick={() => setNewOpen(true)} className="h-9">
            <Plus className="h-4 w-4 mr-1.5" /> New Request
          </Button>
        )}
      </div>

      {/* Stats */}
      {isStaff && (
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: "Pending Review", count: pendingCount, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
            { label: "Approved", count: (requests as AuthRequest[]).filter((r) => r.status === "approved").length, color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
            { label: "Total", count: (requests as AuthRequest[]).length, color: "text-gray-700", bg: "bg-gray-50", border: "border-gray-200" },
          ].map(({ label, count, color, bg, border }) => (
            <Card key={label} className={`${bg} border ${border} shadow-none`}>
              <CardContent className="py-3 px-4">
                <p className={`text-2xl font-bold ${color}`}>{count}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search name or type…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="denied">Denied</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {FORM_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Requests list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No requests found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const clientName = clientMap[req.clientId] ?? req.clientId;
            return (
              <Card key={req.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">{clientName}</span>
                        {statusBadge(req.status)}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{formTypeLabel(req.formType)}</p>
                      {req.denialReason && (
                        <p className="text-xs text-red-600 mt-1">Reason: {req.denialReason}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                        {req.googleDriveUrl && (
                          <a href={req.googleDriveUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />Drive
                          </a>
                        )}
                      </div>
                    </div>
                    {isStaff && req.status === "pending" && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-green-300 text-green-700 hover:bg-green-50"
                          onClick={() => reviewMutation.mutate({ id: req.id, status: "approved" })}
                          disabled={reviewMutation.isPending}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => { setReviewOpen(req); setDenialReason(""); }}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />Deny
                        </Button>
                      </div>
                    )}
                    {isStaff && req.status !== "pending" && req.reviewedAt && (
                      <span className="text-xs text-gray-400 shrink-0">
                        Reviewed {new Date(req.reviewedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Request Dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Authorization Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Client</Label>
              <Select value={newForm.clientId} onValueChange={(v) => setNewForm((f) => ({ ...f, clientId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select client…" /></SelectTrigger>
                <SelectContent>
                  {(allClients as Client[]).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Request Type</Label>
              <Select value={newForm.formType} onValueChange={(v) => setNewForm((f) => ({ ...f, formType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORM_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
              <Button
                disabled={!newForm.clientId || createMutation.isPending}
                onClick={() => createMutation.mutate(newForm)}
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deny Dialog */}
      <Dialog open={!!reviewOpen} onOpenChange={(o) => { if (!o) setReviewOpen(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Deny Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              You are denying the <strong>{formTypeLabel(reviewOpen?.formType ?? "")}</strong> request for{" "}
              <strong>{clientMap[reviewOpen?.clientId ?? ""] ?? "this client"}</strong>.
            </p>
            <div>
              <Label>Reason for Denial</Label>
              <Textarea
                value={denialReason}
                onChange={(e) => setDenialReason(e.target.value)}
                placeholder="Explain why this request is being denied…"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setReviewOpen(null)}>Cancel</Button>
              <Button
                variant="destructive"
                disabled={reviewMutation.isPending}
                onClick={() => reviewMutation.mutate({ id: reviewOpen!.id, status: "denied", denialReason })}
              >
                {reviewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Deny Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
