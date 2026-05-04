import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import {
  Mail, MessageSquare, Send, Search, CheckCircle, XCircle,
  Clock, Phone, User, Filter, RefreshCw, Plus
} from "lucide-react";

interface CommLogEntry {
  id: string;
  channel: "email" | "sms" | "in_app" | "fax";
  status: "sent" | "failed" | "pending" | "delivered" | "bounced";
  toAddress: string;
  subject?: string;
  body?: string;
  templateType?: string;
  createdAt: string;
  toUserId?: string;
  recipientName?: string;
  errorMessage?: string;
}

interface StaffUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
}

function channelIcon(channel: string) {
  if (channel === "email") return <Mail className="w-3.5 h-3.5" />;
  if (channel === "sms") return <MessageSquare className="w-3.5 h-3.5" />;
  if (channel === "fax") return <Phone className="w-3.5 h-3.5" />;
  return <User className="w-3.5 h-3.5" />;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    sent: "bg-green-100 text-green-800",
    delivered: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    bounced: "bg-red-100 text-red-800",
    pending: "bg-yellow-100 text-yellow-800",
  };
  return (
    <Badge className={`text-xs ${map[status] || "bg-gray-100 text-gray-700"}`} variant="secondary">
      {status === "sent" || status === "delivered" ? <CheckCircle className="w-3 h-3 mr-1" /> : null}
      {status === "failed" || status === "bounced" ? <XCircle className="w-3 h-3 mr-1" /> : null}
      {status === "pending" ? <Clock className="w-3 h-3 mr-1" /> : null}
      {status}
    </Badge>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function Communications() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();

  const [channelFilter, setChannelFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTab, setComposeTab] = useState<"email" | "sms">("email");
  const [form, setForm] = useState({
    toUserId: "",
    toEmail: "",
    toPhone: "",
    subject: "",
    body: "",
  });

  const { data: commLog = [], isLoading, refetch } = useQuery<CommLogEntry[]>({
    queryKey: ["/api/communications/log", channelFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (channelFilter !== "all") params.set("channel", channelFilter);
      params.set("limit", "100");
      return apiRequest("GET", `/api/communications/log?${params}`).then(r => r.json());
    },
  });

  const { data: staffUsers = [] } = useQuery<StaffUser[]>({
    queryKey: ["/api/clients"],
    queryFn: () => apiRequest("GET", "/api/clients").then(r => r.json()),
  });

  const sendEmail = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/communications/send-email", data).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Email sent" });
      setComposeOpen(false);
      setForm({ toUserId: "", toEmail: "", toPhone: "", subject: "", body: "" });
      qc.invalidateQueries({ queryKey: ["/api/communications/log"] });
    },
    onError: (e: any) => toast({ title: "Failed to send email", description: e.message, variant: "destructive" }),
  });

  const sendSMS = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/communications/send-sms", data).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "SMS sent" });
      setComposeOpen(false);
      setForm({ toUserId: "", toEmail: "", toPhone: "", subject: "", body: "" });
      qc.invalidateQueries({ queryKey: ["/api/communications/log"] });
    },
    onError: (e: any) => toast({ title: "Failed to send SMS", description: e.message, variant: "destructive" }),
  });

  const handleUserSelect = (userId: string) => {
    const u = staffUsers.find((x: any) => x.id === userId) as any;
    setForm(f => ({
      ...f,
      toUserId: userId,
      toEmail: u?.email || f.toEmail,
      toPhone: u?.phone || f.toPhone,
    }));
  };

  const filtered = (commLog as CommLogEntry[]).filter(entry => {
    if (search && !entry.toAddress.includes(search) && !entry.subject?.includes(search) && !entry.recipientName?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const emailCount = (commLog as CommLogEntry[]).filter(e => e.channel === "email").length;
  const smsCount = (commLog as CommLogEntry[]).filter(e => e.channel === "sms").length;
  const failedCount = (commLog as CommLogEntry[]).filter(e => e.status === "failed").length;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
          <p className="text-sm text-gray-500">Email &amp; SMS outreach via SendGrid and Twilio</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setComposeOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Compose
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Sent", value: commLog.length, icon: Send, color: "text-blue-600" },
            { label: "Emails", value: emailCount, icon: Mail, color: "text-green-600" },
            { label: "SMS", value: smsCount, icon: MessageSquare, color: "text-purple-600" },
            { label: "Failed", value: failedCount, icon: XCircle, color: "text-red-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </div>
                <Icon className={`w-8 h-8 ${color} opacity-20`} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Log */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-base">Communication Log</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    className="h-8 pl-7 text-sm w-48"
                    placeholder="Search…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger className="h-8 text-xs w-32">
                    <Filter className="w-3 h-3 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="fax">Fax</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="text-sm text-gray-400 text-center py-10">Loading…</p>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <Send className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No communications yet.</p>
                <Button size="sm" className="mt-3" onClick={() => setComposeOpen(true)}>Send your first message</Button>
              </div>
            ) : (
              <div className="divide-y">
                {filtered.map(entry => (
                  <div key={entry.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50">
                    <div className={`mt-0.5 p-1.5 rounded-full ${entry.channel === "email" ? "bg-blue-50 text-blue-600" : entry.channel === "sms" ? "bg-purple-50 text-purple-600" : "bg-gray-100 text-gray-500"}`}>
                      {channelIcon(entry.channel)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {entry.recipientName || entry.toAddress}
                        </span>
                        {statusBadge(entry.status)}
                        {entry.templateType && (
                          <Badge variant="outline" className="text-xs capitalize hidden sm:flex">
                            {entry.templateType.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </div>
                      {entry.subject && (
                        <p className="text-xs text-gray-600 truncate">{entry.subject}</p>
                      )}
                      {!entry.subject && entry.body && (
                        <p className="text-xs text-gray-600 truncate">{entry.body}</p>
                      )}
                      {entry.errorMessage && (
                        <p className="text-xs text-red-500 mt-0.5">{entry.errorMessage}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(entry.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Compose Message</DialogTitle>
          </DialogHeader>
          <Tabs value={composeTab} onValueChange={v => setComposeTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="email" className="gap-1"><Mail className="w-3.5 h-3.5" /> Email</TabsTrigger>
              <TabsTrigger value="sms" className="gap-1"><MessageSquare className="w-3.5 h-3.5" /> SMS</TabsTrigger>
            </TabsList>

            <div className="space-y-3">
              <div>
                <Label className="text-xs">Recipient</Label>
                <Select value={form.toUserId} onValueChange={handleUserSelect}>
                  <SelectTrigger className="h-9 text-sm mt-1"><SelectValue placeholder="Select client or staff…" /></SelectTrigger>
                  <SelectContent>
                    {(staffUsers as any[]).map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>{u.name} {u.email ? `(${u.email})` : u.phone ? `(${u.phone})` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <TabsContent value="email" className="mt-0 space-y-3">
                <div>
                  <Label className="text-xs">To Email</Label>
                  <Input className="h-9 text-sm mt-1" placeholder="email@example.com" value={form.toEmail} onChange={e => setForm(f => ({ ...f, toEmail: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Subject</Label>
                  <Input className="h-9 text-sm mt-1" placeholder="Message subject" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Message</Label>
                  <Textarea className="text-sm mt-1 min-h-[100px]" placeholder="Write your message…" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
                </div>
                <Button
                  className="w-full"
                  disabled={!form.toEmail || !form.subject || !form.body || sendEmail.isPending}
                  onClick={() => sendEmail.mutate({ toUserId: form.toUserId || undefined, toEmail: form.toEmail, subject: form.subject, body: form.body })}
                >
                  {sendEmail.isPending ? "Sending…" : <><Send className="w-4 h-4 mr-2" /> Send Email</>}
                </Button>
              </TabsContent>

              <TabsContent value="sms" className="mt-0 space-y-3">
                <div>
                  <Label className="text-xs">Phone Number</Label>
                  <Input className="h-9 text-sm mt-1" placeholder="+1 (555) 000-0000" value={form.toPhone} onChange={e => setForm(f => ({ ...f, toPhone: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Message <span className="text-gray-400">({form.body.length}/160)</span></Label>
                  <Textarea
                    className="text-sm mt-1 min-h-[80px]"
                    placeholder="Write your SMS message…"
                    maxLength={320}
                    value={form.body}
                    onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={!form.toPhone || !form.body || sendSMS.isPending}
                  onClick={() => sendSMS.mutate({ toUserId: form.toUserId || undefined, toPhone: form.toPhone, body: form.body })}
                >
                  {sendSMS.isPending ? "Sending…" : <><MessageSquare className="w-4 h-4 mr-2" /> Send SMS</>}
                </Button>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
