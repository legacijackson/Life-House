import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Heart, ExternalLink, Plus, Mail, Phone, MapPin,
  TrendingUp, Filter, Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/lib/rbac";
import { apiRequest } from "@/lib/queryClient";
import { HighlightCarousel } from "@/components/highlight-carousel";

interface Resource {
  id: string;
  name: string;
  category: string;
  description: string;
  status: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  logoUrl?: string;
  applyUrl?: string;
  eligibilityNotes?: string;
}

const CATEGORIES = [
  "all", "housing", "employment", "mental-health", "substance-use",
  "legal", "medical", "food", "education", "transportation", "other",
];

function categoryColor(cat: string) {
  const map: Record<string, string> = {
    housing: "bg-blue-50 text-blue-700 border-blue-200",
    employment: "bg-green-50 text-green-700 border-green-200",
    "mental-health": "bg-purple-50 text-purple-700 border-purple-200",
    "substance-use": "bg-pink-50 text-pink-700 border-pink-200",
    legal: "bg-amber-50 text-amber-700 border-amber-200",
    medical: "bg-teal-50 text-teal-700 border-teal-200",
    food: "bg-orange-50 text-orange-700 border-orange-200",
  };
  return map[cat] ?? "bg-gray-100 text-gray-600";
}

// ── Send Referral Modal ───────────────────────────────────────────────────────

function SendReferralModal({ resource, open, onClose, clients }: {
  resource: Resource;
  open: boolean;
  onClose: () => void;
  clients: any[];
}) {
  const { toast } = useToast();
  const [clientId, setClientId] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/resource-referrals", {
        resourceId: resource.id,
        clientId,
        notes,
        resourceName: resource.name,
        resourceEmail: resource.email,
      }).then((r) => r.json()),
    onSuccess: () => {
      toast({ title: `Referral sent to ${resource.name}` });
      onClose();
      setClientId("");
      setNotes("");
    },
    onError: () => toast({ title: "Failed to send referral", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send Referral — {resource.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Client *</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="h-8 text-sm mt-1">
                <SelectValue placeholder="Select client…" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Referral Notes</Label>
            <Textarea
              className="text-sm mt-1"
              rows={3}
              placeholder="Reason for referral, client context…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          {resource.email && (
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Mail className="h-3 w-3" /> Referral will be emailed to {resource.email}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !clientId}
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              {mutation.isPending ? "Sending…" : "Send Referral"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Resource Modal ────────────────────────────────────────────────────────

function AddResourceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "", category: "other", description: "", phone: "",
    email: "", website: "", address: "", applyUrl: "", eligibilityNotes: "",
  });

  const mutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/resources", form).then((r) => r.json()),
    onSuccess: () => {
      toast({ title: "Resource added" });
      qc.invalidateQueries({ queryKey: ["/api/resources"] });
      onClose();
    },
    onError: () => toast({ title: "Failed to add resource", variant: "destructive" }),
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Resource</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Name *</Label>
            <Input className="h-8 text-sm mt-1" value={form.name} onChange={set("name")} />
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
              <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.filter((c) => c !== "all").map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea className="text-sm mt-1" rows={2} value={form.description} onChange={set("description")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Phone</Label><Input className="h-8 text-sm mt-1" value={form.phone} onChange={set("phone")} /></div>
            <div><Label className="text-xs">Email</Label><Input className="h-8 text-sm mt-1" value={form.email} onChange={set("email")} /></div>
          </div>
          <div>
            <Label className="text-xs">Website</Label>
            <Input className="h-8 text-sm mt-1" placeholder="https://…" value={form.website} onChange={set("website")} />
          </div>
          <div>
            <Label className="text-xs">Apply URL</Label>
            <Input className="h-8 text-sm mt-1" placeholder="Direct application link…" value={form.applyUrl} onChange={set("applyUrl")} />
          </div>
          <div>
            <Label className="text-xs">Address</Label>
            <Input className="h-8 text-sm mt-1" value={form.address} onChange={set("address")} />
          </div>
          <div>
            <Label className="text-xs">Eligibility Notes</Label>
            <Textarea className="text-sm mt-1" rows={2} value={form.eligibilityNotes} onChange={set("eligibilityNotes")} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name}>
              {mutation.isPending ? "Saving…" : "Add Resource"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Resource Card ─────────────────────────────────────────────────────────────

function ResourceCard({ resource, isStaff, clients, onReferral }: {
  resource: Resource;
  isStaff: boolean;
  clients: any[];
  onReferral: (r: Resource) => void;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow border border-gray-100">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {resource.logoUrl ? (
            <img src={resource.logoUrl} alt={resource.name} className="h-10 w-10 rounded-lg object-contain border border-gray-100 flex-shrink-0" />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400 font-bold text-lg">
              {resource.name[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{resource.name}</h3>
                <Badge variant="outline" className={`text-xs mt-0.5 ${categoryColor(resource.category)}`}>
                  {resource.category}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {resource.applyUrl && (
                  <a href={resource.applyUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="h-7 text-xs px-2">
                      Apply ↗
                    </Button>
                  </a>
                )}
                {isStaff && (
                  <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => onReferral(resource)}>
                    <Send className="h-3 w-3 mr-1" /> Refer
                  </Button>
                )}
                {resource.website && (
                  <a href={resource.website} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">{resource.description}</p>
            {resource.eligibilityNotes && (
              <p className="text-xs text-amber-700 mt-1 italic">{resource.eligibilityNotes}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 flex-wrap">
              {resource.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{resource.phone}</span>}
              {resource.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{resource.email}</span>}
              {resource.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{resource.address}</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Resources() {
  const { data: user } = useCurrentUser();
  const isStaff = !!(user as any)?.role && (user as any)?.role !== "guest";
  const isAdmin = !!(user as any)?.isAdmin;

  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [referralTarget, setReferralTarget] = useState<Resource | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const { data: resources = [], isLoading } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
    queryFn: () => apiRequest("GET", "/api/resources").then((r) => r.json()),
  });

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/clients"],
    queryFn: () => apiRequest("GET", "/api/clients").then((r) => r.json()),
    enabled: isStaff,
  });

  const filtered = (resources as Resource[]).filter((r) => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q ||
      r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q);
    const matchCat = category === "all" || r.category === category;
    return matchSearch && matchCat && r.status === "active";
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isStaff ? "Resources" : "Community Resources"}</h1>
            <p className="text-sm text-gray-500">
              {isStaff ? "Find, refer, and manage community resources" : "Find support services in your area"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              <TrendingUp className="w-3 h-3 mr-1" />
              {(resources as Resource[]).length} Available
            </Badge>
            {isAdmin && (
              <Button size="sm" className="h-8" onClick={() => setAddOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Resource
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Featured carousel */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Featured Programs</h2>
          <HighlightCarousel />
        </div>

        {/* Search + Category filter */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search resources…"
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-44 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c === "all" ? "All Categories" : c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Resource grid */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Heart className="h-12 w-12 mb-3 opacity-40" />
            <p>No resources found. {isAdmin && <button onClick={() => setAddOpen(true)} className="text-indigo-600 hover:underline">Add one?</button>}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                isStaff={isStaff}
                clients={clients as any[]}
                onReferral={setReferralTarget}
              />
            ))}
          </div>
        )}
      </div>

      {referralTarget && (
        <SendReferralModal
          resource={referralTarget}
          open={!!referralTarget}
          onClose={() => setReferralTarget(null)}
          clients={clients as any[]}
        />
      )}

      <AddResourceModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
