import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare, Send, Inbox, Search, ArrowLeft, Plus, Loader2, Circle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromName?: string;
  toName?: string;
  subject: string;
  body: string;
  isRead: boolean;
  parentId?: string;
  createdAt: string;
}

interface StaffUser {
  id: string;
  name: string;
  role?: string;
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

function MessageRow({ msg, selected, onClick, userId }: {
  msg: Message;
  selected: boolean;
  onClick: () => void;
  userId: string;
}) {
  const isInbound = msg.toUserId === userId;
  return (
    <button
      className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors ${selected ? "bg-indigo-50 border-l-4 border-l-indigo-500" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        {!msg.isRead && isInbound && (
          <Circle className="h-2 w-2 text-indigo-500 shrink-0 mt-1.5 fill-indigo-500" />
        )}
        <div className={`flex-1 min-w-0 ${!msg.isRead && isInbound ? "" : "pl-3.5"}`}>
          <div className="flex items-center justify-between gap-2">
            <span className={`text-sm truncate ${!msg.isRead && isInbound ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
              {isInbound ? (msg.fromName ?? "Unknown") : (msg.toName ?? "Unknown")}
            </span>
            <span className="text-xs text-gray-400 shrink-0">{timeAgo(msg.createdAt)}</span>
          </div>
          <p className={`text-xs truncate ${!msg.isRead && isInbound ? "text-gray-800 font-medium" : "text-gray-500"}`}>{msg.subject}</p>
          <p className="text-xs text-gray-400 truncate">{msg.body.slice(0, 60)}</p>
        </div>
      </div>
    </button>
  );
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const userId = (user as any)?.id ?? "";
  const [tab, setTab] = useState<"inbox" | "sent">("inbox");
  const [selected, setSelected] = useState<Message | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [compose, setCompose] = useState({ toUserId: "", subject: "", body: "" });

  const { data: inbox = [], isLoading: inboxLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages", "inbox"],
    queryFn: () => apiRequest("GET", "/api/messages?type=inbox").then((r) => r.json()),
  });

  const { data: sent = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages", "sent"],
    queryFn: () => apiRequest("GET", "/api/messages?type=sent").then((r) => r.json()),
  });

  const { data: staffList = [] } = useQuery<StaffUser[]>({
    queryKey: ["/api/staff"],
    queryFn: () => apiRequest("GET", "/api/staff").then((r) => r.json()),
  });

  const { data: thread = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages/thread", selected?.parentId ?? selected?.id],
    queryFn: () =>
      apiRequest("GET", `/api/messages/thread/${selected?.parentId ?? selected?.id}`).then((r) => {
        if (r.ok) return r.json().then((d: any) => d.messages ?? []);
        return [];
      }),
    enabled: !!(selected?.parentId ?? selected?.id),
  });

  const sendMutation = useMutation({
    mutationFn: (data: typeof compose) => apiRequest("POST", "/api/messages/send", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/messages"] });
      setComposeOpen(false);
      setCompose({ toUserId: "", subject: "", body: "" });
      toast({ title: "Message sent" });
    },
    onError: () => toast({ title: "Failed to send message", variant: "destructive" }),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/messages/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/messages"] }),
  });

  const replyMutation = useMutation({
    mutationFn: ({ body }: { body: string }) =>
      apiRequest("POST", "/api/messages/reply", {
        threadId: selected?.parentId ?? selected?.id,
        content: body,
        to: selected?.fromName,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/messages/thread"] });
      qc.invalidateQueries({ queryKey: ["/api/messages"] });
    },
    onError: () => toast({ title: "Failed to send reply", variant: "destructive" }),
  });

  const [replyBody, setReplyBody] = useState("");

  const handleSelect = (msg: Message) => {
    setSelected(msg);
    if (!msg.isRead && msg.toUserId === userId) {
      markRead.mutate(msg.id);
    }
  };

  const messages = tab === "inbox" ? inbox : sent;
  const filtered = (messages as Message[]).filter((m) =>
    !search ||
    m.subject.toLowerCase().includes(search.toLowerCase()) ||
    (m.fromName ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (m.toName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const unreadCount = (inbox as Message[]).filter((m) => !m.isRead && m.toUserId === userId).length;

  return (
    <div className="flex-1 overflow-hidden">
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          {unreadCount > 0 && (
            <Badge className="bg-indigo-600 text-white text-xs">{unreadCount}</Badge>
          )}
        </div>
        <Button onClick={() => setComposeOpen(true)} className="h-9">
          <Plus className="h-4 w-4 mr-1.5" /> Compose
        </Button>
      </header>

      <div className="flex h-[calc(100vh-8rem)]">
        {/* Left: message list */}
        <div className="w-80 flex-shrink-0 border-r flex flex-col">
          <div className="px-3 pt-3 pb-2">
            <Tabs value={tab} onValueChange={(v) => { setTab(v as any); setSelected(null); }}>
              <TabsList className="w-full">
                <TabsTrigger value="inbox" className="flex-1">
                  Inbox {unreadCount > 0 && <Badge className="ml-1.5 bg-indigo-600 text-white text-xs">{unreadCount}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="sent" className="flex-1">Sent</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input className="pl-8 h-8 text-sm" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {inboxLoading && <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>}
            {!inboxLoading && filtered.length === 0 && (
              <div className="py-10 text-center text-gray-400 text-sm">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No messages yet.
              </div>
            )}
            {filtered.map((msg) => (
              <MessageRow
                key={msg.id}
                msg={msg}
                selected={selected?.id === msg.id}
                onClick={() => handleSelect(msg)}
                userId={userId}
              />
            ))}
          </div>
        </div>

        {/* Right: message detail */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              <div className="px-6 py-4 border-b bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">{selected.subject}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {selected.toUserId === userId
                        ? `From ${selected.fromName ?? "Unknown"}`
                        : `To ${selected.toName ?? "Unknown"}`}
                      {" · "}
                      {new Date(selected.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {/* Thread messages */}
                {(thread as Message[]).length > 0 ? (
                  (thread as Message[]).map((m) => (
                    <div key={m.id} className={`flex ${m.fromUserId === userId ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-xl px-4 py-3 ${m.fromUserId === userId ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-900"}`}>
                        <p className={`text-xs mb-1 ${m.fromUserId === userId ? "text-indigo-200" : "text-gray-500"}`}>
                          {m.fromUserId === userId ? "You" : (m.fromName ?? "Unknown")} · {timeAgo(m.createdAt)}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`flex ${selected.fromUserId === userId ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-xl px-4 py-3 ${selected.fromUserId === userId ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-900"}`}>
                      <p className={`text-xs mb-1 ${selected.fromUserId === userId ? "text-indigo-200" : "text-gray-500"}`}>
                        {selected.fromUserId === userId ? "You" : (selected.fromName ?? "Unknown")} · {timeAgo(selected.createdAt)}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{selected.body}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Reply box */}
              <div className="border-t px-6 py-3 bg-white">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Write a reply…"
                    className="flex-1 min-h-[60px] resize-none text-sm"
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.metaKey && replyBody.trim()) {
                        replyMutation.mutate({ body: replyBody.trim() });
                        setReplyBody("");
                      }
                    }}
                  />
                  <Button
                    className="self-end"
                    disabled={!replyBody.trim() || replyMutation.isPending}
                    onClick={() => { replyMutation.mutate({ body: replyBody.trim() }); setReplyBody(""); }}
                  >
                    {replyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-1">⌘+Enter to send</p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Select a message to read it</p>
                <Button className="mt-4" variant="outline" onClick={() => setComposeOpen(true)}>
                  <Plus className="h-4 w-4 mr-1.5" /> Compose New Message
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Message</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>To</Label>
              <Select value={compose.toUserId} onValueChange={(v) => setCompose((f) => ({ ...f, toUserId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select recipient…" /></SelectTrigger>
                <SelectContent>
                  {(staffList as StaffUser[]).filter((s) => s.id !== userId).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} {s.role ? `(${s.role})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject</Label>
              <Input value={compose.subject} onChange={(e) => setCompose((f) => ({ ...f, subject: e.target.value }))} placeholder="Message subject…" />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={compose.body}
                onChange={(e) => setCompose((f) => ({ ...f, body: e.target.value }))}
                placeholder="Write your message…"
                rows={5}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
              <Button
                disabled={!compose.toUserId || !compose.body || sendMutation.isPending}
                onClick={() => sendMutation.mutate(compose)}
              >
                {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1.5" />Send</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
