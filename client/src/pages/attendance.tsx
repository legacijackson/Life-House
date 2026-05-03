import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar, Plus, MapPin, Users, Clock, CheckCircle2, X,
  AlertTriangle, FileText, ChevronDown, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LhEvent {
  id: string;
  title: string;
  eventType: string;
  startTime: string;
  endTime?: string;
  location?: string;
  geoLat?: string;
  geoLng?: string;
  geoRadiusFt?: number;
  capacity?: number;
  authorizationRequired?: boolean;
  caseNoteRequired?: boolean;
  createdBy?: string;
}

interface EventAttendance {
  id: string;
  eventId: string;
  clientId: string;
  clientName?: string;
  staffId?: string;
  status?: string;
  arrivedAt?: string;
  caseNoteRequired?: boolean;
  caseNoteId?: string;
  caseNoteDueAt?: string;
  geoVerified?: boolean;
  notes?: string;
}

const EVENT_TYPES = [
  "training", "group_meeting", "one_on_one", "community_service",
  "court", "medical", "employment", "life_skills", "recreation", "other",
];

const ATTENDANCE_STATUSES = ["present", "absent", "late", "excused", "no-show"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function eventTypeBadge(type: string) {
  const map: Record<string, string> = {
    training: "bg-blue-50 text-blue-700 border-blue-200",
    group_meeting: "bg-purple-50 text-purple-700 border-purple-200",
    one_on_one: "bg-green-50 text-green-700 border-green-200",
    community_service: "bg-teal-50 text-teal-700 border-teal-200",
    court: "bg-red-50 text-red-700 border-red-200",
    medical: "bg-pink-50 text-pink-700 border-pink-200",
    employment: "bg-orange-50 text-orange-700 border-orange-200",
    life_skills: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };
  return (
    <Badge variant="outline" className={`text-xs ${map[type] ?? "bg-gray-50 text-gray-600"}`}>
      {type.replace(/_/g, " ")}
    </Badge>
  );
}

function attendanceStatusBadge(status?: string) {
  const map: Record<string, string> = {
    present: "bg-green-50 text-green-700 border-green-200",
    absent: "bg-red-50 text-red-700 border-red-200",
    late: "bg-amber-50 text-amber-700 border-amber-200",
    excused: "bg-blue-50 text-blue-700 border-blue-200",
    "no-show": "bg-gray-100 text-gray-600",
  };
  return (
    <Badge variant="outline" className={`text-xs ${map[status ?? ""] ?? "bg-gray-50 text-gray-500"}`}>
      {status ?? "pending"}
    </Badge>
  );
}

// ── Create Event Modal ────────────────────────────────────────────────────────

function CreateEventModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: () => apiRequest("GET", "/api/clients").then((r) => r.json()),
  });

  const [form, setForm] = useState({
    title: "",
    eventType: "training",
    startTime: "",
    endTime: "",
    location: "",
    geoLat: "",
    geoLng: "",
    geoRadiusFt: "300",
    capacity: "",
    authorizationRequired: false,
    caseNoteRequired: true,
  });
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/lh-events", {
        ...form,
        capacity: form.capacity ? Number(form.capacity) : null,
        geoRadiusFt: Number(form.geoRadiusFt),
        attendees: selectedClientIds,
      }).then((r) => r.json()),
    onSuccess: () => {
      toast({ title: "Event created" });
      qc.invalidateQueries({ queryKey: ["/api/lh-events"] });
      onClose();
    },
    onError: () => toast({ title: "Failed to create event", variant: "destructive" }),
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleClient = (id: string) =>
    setSelectedClientIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Title *</Label>
            <Input className="h-8 text-sm mt-1" value={form.title} onChange={set("title")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Event Type *</Label>
              <Select value={form.eventType} onValueChange={(v) => setForm((f) => ({ ...f, eventType: v }))}>
                <SelectTrigger className="h-8 text-sm mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Capacity</Label>
              <Input type="number" className="h-8 text-sm mt-1" value={form.capacity} onChange={set("capacity")} placeholder="Unlimited" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Start Time *</Label>
              <Input type="datetime-local" className="h-8 text-sm mt-1" value={form.startTime} onChange={set("startTime")} />
            </div>
            <div>
              <Label className="text-xs">End Time</Label>
              <Input type="datetime-local" className="h-8 text-sm mt-1" value={form.endTime} onChange={set("endTime")} />
            </div>
          </div>

          <div>
            <Label className="text-xs">Location</Label>
            <Input className="h-8 text-sm mt-1" value={form.location} onChange={set("location")} />
          </div>

          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">Geo-Fence (optional)</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Latitude</Label>
                <Input className="h-8 text-xs mt-1" value={form.geoLat} onChange={set("geoLat")} placeholder="37.7749" />
              </div>
              <div>
                <Label className="text-xs">Longitude</Label>
                <Input className="h-8 text-xs mt-1" value={form.geoLng} onChange={set("geoLng")} placeholder="-122.4194" />
              </div>
              <div>
                <Label className="text-xs">Radius (ft)</Label>
                <Input type="number" className="h-8 text-xs mt-1" value={form.geoRadiusFt} onChange={set("geoRadiusFt")} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.caseNoteRequired}
                onCheckedChange={(v) => setForm((f) => ({ ...f, caseNoteRequired: v }))}
              />
              <Label className="text-xs">Case Note Required</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.authorizationRequired}
                onCheckedChange={(v) => setForm((f) => ({ ...f, authorizationRequired: v }))}
              />
              <Label className="text-xs">Authorization Required</Label>
            </div>
          </div>

          {/* Client enrollment */}
          <div>
            <Label className="text-xs font-medium text-gray-700">Enroll Clients</Label>
            <div className="mt-1 max-h-40 overflow-y-auto border rounded-lg divide-y">
              {(clients as any[]).map((c: any) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedClientIds.includes(c.id)}
                    onChange={() => toggleClient(c.id)}
                    className="h-3.5 w-3.5"
                  />
                  <span className="text-sm">{c.name}</span>
                </label>
              ))}
              {(clients as any[]).length === 0 && (
                <p className="text-xs text-gray-400 p-3">No clients available.</p>
              )}
            </div>
            {selectedClientIds.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">{selectedClientIds.length} client(s) enrolled</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !form.title || !form.startTime}
            >
              {mutation.isPending ? "Creating…" : "Create Event"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Attendance Row ────────────────────────────────────────────────────────────

function AttendanceRow({ record }: { record: EventAttendance }) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: (status: string) =>
      apiRequest("PATCH", `/api/event-attendance/${record.id}`, { status }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/event-attendance"] });
    },
    onError: () => toast({ title: "Failed to update attendance", variant: "destructive" }),
  });

  const isNoteOverdue = record.caseNoteRequired && !record.caseNoteId &&
    record.caseNoteDueAt && new Date(record.caseNoteDueAt) < new Date();

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${isNoteOverdue ? "border-orange-200 bg-orange-50" : "border-gray-100 bg-white"}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">
            {record.clientName ?? record.clientId}
          </span>
          {isNoteOverdue && (
            <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
              Note Overdue
            </Badge>
          )}
          {record.geoVerified && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              <MapPin className="h-2.5 w-2.5 mr-1" /> Verified
            </Badge>
          )}
        </div>
        {record.arrivedAt && (
          <p className="text-xs text-gray-400 mt-0.5">
            Arrived: {new Date(record.arrivedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </p>
        )}
      </div>

      <Select
        value={record.status ?? ""}
        onValueChange={(s) => updateMutation.mutate(s)}
      >
        <SelectTrigger className="h-7 text-xs w-32">
          <SelectValue placeholder="Set status…" />
        </SelectTrigger>
        <SelectContent>
          {ATTENDANCE_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {record.caseNoteRequired && (
        <Button
          size="sm"
          variant={record.caseNoteId ? "outline" : "default"}
          className="h-7 text-xs px-2"
          onClick={() =>
            (window.location.href = `/app/case-notes?clientId=${record.clientId}&new=1`)
          }
        >
          <FileText className="h-3 w-3 mr-1" />
          {record.caseNoteId ? "Noted" : "Add Note"}
        </Button>
      )}
    </div>
  );
}

// ── Event Card ────────────────────────────────────────────────────────────────

function EventCard({ event, showAttendance }: { event: LhEvent; showAttendance: boolean }) {
  const [expanded, setExpanded] = useState(false);

  const { data: attendance = [] } = useQuery<EventAttendance[]>({
    queryKey: ["/api/event-attendance", event.id],
    queryFn: () =>
      apiRequest("GET", `/api/event-attendance?eventId=${event.id}`).then((r) => r.json()),
    enabled: expanded,
  });

  const start = new Date(event.startTime);
  const isPast = start < new Date();
  const presentCount = (attendance as EventAttendance[]).filter((a) => a.status === "present").length;

  return (
    <Card className={`border ${isPast ? "border-gray-200 opacity-80" : "border-indigo-100"}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-gray-900">{event.title}</span>
              {eventTypeBadge(event.eventType)}
              {event.authorizationRequired && (
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">Auth Required</Badge>
              )}
              {event.caseNoteRequired && (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">Note Required</Badge>
              )}
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                {" · "}
                {start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </span>
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {event.location}
                </span>
              )}
              {event.capacity && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> Cap: {event.capacity}
                </span>
              )}
            </div>
          </div>
          {showAttendance && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2 flex-shrink-0"
              onClick={() => setExpanded((x) => !x)}
            >
              <Users className="h-3 w-3 mr-1" />
              Attendance
              <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </Button>
          )}
        </div>

        {expanded && (
          <div className="mt-3 space-y-2 border-t pt-3">
            {(attendance as EventAttendance[]).length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">No attendance records for this event.</p>
            ) : (
              (attendance as EventAttendance[]).map((a) => (
                <AttendanceRow key={a.id} record={a} />
              ))
            )}
            {isPast && (attendance as EventAttendance[]).length > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {presentCount} of {(attendance as EventAttendance[]).length} present
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Attendance() {
  const [createOpen, setCreateOpen] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: events = [], isLoading, refetch } = useQuery<LhEvent[]>({
    queryKey: ["/api/lh-events"],
    queryFn: () => apiRequest("GET", "/api/lh-events").then((r) => r.json()),
  });

  const now = new Date();
  const upcoming = (events as LhEvent[]).filter((e) => new Date(e.startTime) >= now);
  const past = (events as LhEvent[]).filter((e) => new Date(e.startTime) < now);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-indigo-600" />
            Events & Attendance
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {upcoming.length} upcoming · {past.length} past
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" className="h-8" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Event
          </Button>
        </div>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">
            Upcoming <Badge variant="secondary" className="ml-1.5 text-xs">{upcoming.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="past">
            Past <Badge variant="secondary" className="ml-1.5 text-xs">{past.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Calendar className="mx-auto h-10 w-10 mb-3 opacity-40" />
              <p>No upcoming events.</p>
              <Button size="sm" className="mt-4" onClick={() => setCreateOpen(true)}>
                Create an event
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((e) => (
                <EventCard key={e.id} event={e} showAttendance={false} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {past.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">No past events.</p>
          ) : (
            <div className="space-y-3">
              {past.map((e) => (
                <EventCard key={e.id} event={e} showAttendance={true} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateEventModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
