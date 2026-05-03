import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  MapPin, Clock, CheckCircle, XCircle, AlertTriangle, Users, Calendar, Loader2,
  ClipboardList, Search, UserCheck, UserX, Plus, RefreshCw,
} from 'lucide-react';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

interface CheckInSession {
  id: string;
  name: string;
  type: 'daily' | 'group' | 'meeting';
  startTime: string;
  endTime: string;
  location: { name: string; address: string; coordinates: { lat: number; lng: number }; radius: number };
  status: 'upcoming' | 'active' | 'completed';
  checkedIn?: boolean;
}

interface AttendanceRecord {
  id: string;
  eventId: string;
  clientId: string;
  clientName?: string;
  status?: string;
  arrivedAt?: string;
  geoVerified?: boolean;
  notes?: string;
}

interface Client {
  id: string;
  name: string;
  profile?: { bedAssignment?: string; clientType?: string };
}

const STAFF_ROLES = ["Admin", "CaseManager", "Intake", "Staff"];

// ── Resident Check-in View ─────────────────────────────────────────────────

function ResidentCheckIn() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const { data: sessions = [], isLoading } = useQuery<CheckInSession[]>({
    queryKey: ['/api/check-in/sessions'],
  });

  const checkInMutation = useMutation({
    mutationFn: async (data: { sessionId: string; location: LocationData }) =>
      apiRequest('POST', '/api/check-in', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/check-in/sessions'] });
      toast({ title: "Check-in successful", description: "Your attendance has been recorded." });
    },
    onError: (error: any) => {
      toast({ title: "Check-in failed", description: error.message || "Please try again.", variant: "destructive" });
    },
  });

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    if (!navigator.geolocation) {
      toast({ title: "Location not supported", variant: "destructive" });
      setIsGettingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy, timestamp: new Date().toISOString() });
        setIsGettingLocation(false);
      },
      (err) => {
        setIsGettingLocation(false);
        const msg = err.code === err.PERMISSION_DENIED ? "Please enable location permissions." : "Unable to get your location.";
        toast({ title: "Location error", description: msg, variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleCheckIn = (sessionId: string) => {
    if (!location) {
      toast({ title: "Location required", description: "Please enable location to check in.", variant: "destructive" });
      return;
    }
    checkInMutation.mutate({ sessionId, location });
  };

  const activeSessions = (sessions as CheckInSession[]).filter((s) => s.status === 'active');
  const upcomingSessions = (sessions as CheckInSession[]).filter((s) => s.status === 'upcoming');
  const completedSessions = (sessions as CheckInSession[]).filter((s) => s.status === 'completed');

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Location Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <MapPin className="w-5 h-5 mr-2" /> Location Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {location ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">Location enabled — accuracy ±{Math.round(location.accuracy)}m</span>
            </div>
          ) : (
            <div className="space-y-3">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>Location is required to check in.</AlertDescription>
              </Alert>
              <Button onClick={getCurrentLocation} disabled={isGettingLocation} className="w-full">
                {isGettingLocation ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Getting location...</> : <><MapPin className="w-4 h-4 mr-2" />Enable Location</>}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900">Active Sessions</h2>
          {activeSessions.map((session) => (
            <Card key={session.id} className="border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{session.name}</h3>
                  <Badge className="bg-green-600">Active Now</Badge>
                </div>
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center text-sm text-gray-600"><Clock className="w-4 h-4 mr-2" />{session.startTime} – {session.endTime}</div>
                  <div className="flex items-center text-sm text-gray-600"><MapPin className="w-4 h-4 mr-2" />{session.location?.name}</div>
                </div>
                {session.checkedIn ? (
                  <div className="flex items-center text-green-600 font-medium text-sm"><CheckCircle className="w-4 h-4 mr-2" />Checked In</div>
                ) : (
                  <Button onClick={() => handleCheckIn(session.id)} disabled={!location || checkInMutation.isPending} className="w-full">
                    {checkInMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Checking in...</> : 'Check In Now'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upcoming */}
      {upcomingSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900">Upcoming</h2>
          {upcomingSessions.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{s.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5"><Clock className="inline w-3 h-3 mr-1" />{s.startTime} – {s.endTime}</p>
                </div>
                <Badge variant="outline">Upcoming</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Completed */}
      {completedSessions.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-gray-900">Completed Today</h2>
          {completedSessions.map((s) => (
            <Card key={s.id} className="opacity-70">
              <CardContent className="p-3 flex items-center justify-between">
                <p className="text-sm font-medium">{s.name}</p>
                <Badge variant="secondary">
                  {s.checkedIn ? <><CheckCircle className="w-3 h-3 mr-1" />Attended</> : <><XCircle className="w-3 h-3 mr-1" />Missed</>}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" /></div>
      )}
      {!isLoading && (sessions as CheckInSession[]).length === 0 && (
        <Card><CardContent className="text-center py-10"><Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 text-sm">No sessions scheduled today.</p></CardContent></Card>
      )}
    </div>
  );
}

// ── Staff Roster View ──────────────────────────────────────────────────────

function StaffRosterView() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const [manualClientId, setManualClientId] = useState('');
  const [manualStatus, setManualStatus] = useState('present');

  const { data: events = [] } = useQuery<any[]>({
    queryKey: ['/api/lh-events'],
  });

  const { data: allClients = [] } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  const { data: attendance = [], refetch: refetchAttendance } = useQuery<AttendanceRecord[]>({
    queryKey: ['/api/event-attendance', selectedEventId],
    queryFn: () => apiRequest('GET', `/api/event-attendance?eventId=${selectedEventId}`).then((r) => r.json()),
    enabled: !!selectedEventId,
  });

  const markAttendance = useMutation({
    mutationFn: (data: { eventId: string; clientId: string; status: string }) =>
      apiRequest('POST', '/api/event-attendance', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/event-attendance', selectedEventId] });
      setManualOpen(false);
      setManualClientId('');
      toast({ title: 'Attendance recorded' });
    },
    onError: () => toast({ title: 'Failed to record attendance', variant: 'destructive' }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest('PATCH', `/api/event-attendance/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/event-attendance', selectedEventId] }),
  });

  const today = new Date().toDateString();
  const todayEvents = (events as any[]).filter((e) => {
    const d = new Date(e.startTime);
    return d.toDateString() === today;
  });

  const attendanceMap = Object.fromEntries((attendance as AttendanceRecord[]).map((a) => [a.clientId, a]));
  const filteredClients = (allClients as Client[]).filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );
  const presentCount = (attendance as AttendanceRecord[]).filter((a) => a.status === 'present').length;
  const absentCount = (attendance as AttendanceRecord[]).filter((a) => a.status === 'absent' || a.status === 'no-show').length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-indigo-600" /> Check-in Roster
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchAttendance()} className="h-8">
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
          <Button size="sm" className="h-8" onClick={() => setManualOpen(true)} disabled={!selectedEventId}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Mark Attendance
          </Button>
        </div>
      </div>

      {/* Event selector */}
      <div className="mb-5">
        <Label className="text-sm font-medium mb-1.5 block">Select Event</Label>
        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
          <SelectTrigger className="max-w-md">
            <SelectValue placeholder="Choose today's event…" />
          </SelectTrigger>
          <SelectContent>
            {todayEvents.length === 0 && <SelectItem value="_none" disabled>No events today</SelectItem>}
            {todayEvents.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.title} — {new Date(e.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </SelectItem>
            ))}
            {(events as any[])
              .filter((e) => new Date(e.startTime).toDateString() !== today)
              .slice(0, 5)
              .map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.title} — {new Date(e.startTime).toLocaleDateString()}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {selectedEventId && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <Card>
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <UserCheck className="h-8 w-8 text-green-500 shrink-0" />
                <div>
                  <p className="text-xl font-bold text-green-700">{presentCount}</p>
                  <p className="text-xs text-gray-500">Present</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <UserX className="h-8 w-8 text-red-400 shrink-0" />
                <div>
                  <p className="text-xl font-bold text-red-600">{absentCount}</p>
                  <p className="text-xs text-gray-500">Absent / No-show</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <Users className="h-8 w-8 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-xl font-bold text-gray-900">{(attendance as AttendanceRecord[]).length}</p>
                  <p className="text-xs text-gray-500">Total Recorded</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative mb-4 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search clients…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {/* Client roster */}
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredClients.map((client) => {
                  const rec = attendanceMap[client.id];
                  return (
                    <div key={client.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-indigo-700">
                            {client.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{client.name}</p>
                          {client.profile?.bedAssignment && (
                            <p className="text-xs text-gray-500">Bed {client.profile.bedAssignment}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {rec ? (
                          <Select
                            value={rec.status ?? 'present'}
                            onValueChange={(val) => updateStatus.mutate({ id: rec.id, status: val })}
                          >
                            <SelectTrigger className={`h-7 text-xs w-32 ${rec.status === 'present' ? 'border-green-300 text-green-700' : rec.status === 'absent' || rec.status === 'no-show' ? 'border-red-300 text-red-700' : ''}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {['present', 'absent', 'late', 'excused', 'no-show'].map((s) => (
                                <SelectItem key={s} value={s}>{s.replace('-', ' ')}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => markAttendance.mutate({ eventId: selectedEventId, clientId: client.id, status: 'present' })}
                          >
                            <UserCheck className="h-3 w-3 mr-1" /> Mark Present
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredClients.length === 0 && (
                  <div className="py-8 text-center text-gray-400 text-sm">No clients found.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!selectedEventId && (
        <Card>
          <CardContent className="py-10 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Select an event above to view and manage attendance.</p>
          </CardContent>
        </Card>
      )}

      {/* Manual mark dialog */}
      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Mark Attendance</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Client</Label>
              <Select value={manualClientId} onValueChange={setManualClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client…" />
                </SelectTrigger>
                <SelectContent>
                  {(allClients as Client[]).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={manualStatus} onValueChange={setManualStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['present', 'absent', 'late', 'excused', 'no-show'].map((s) => (
                    <SelectItem key={s} value={s}>{s.replace('-', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setManualOpen(false)}>Cancel</Button>
              <Button
                disabled={!manualClientId || markAttendance.isPending}
                onClick={() => markAttendance.mutate({ eventId: selectedEventId, clientId: manualClientId, status: manualStatus })}
              >
                {markAttendance.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main export ─────────────────────────────────────────────────────────────

export default function CheckIn() {
  const { user } = useAuth();
  const role = (user as any)?.role ?? "";
  const isStaff = ["Admin", "CaseManager", "Intake", "Staff"].includes(role) || (user as any)?.isAdmin;

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isStaff ? "Attendance Roster" : "Check-in"}</h1>
            <p className="text-sm text-gray-600">
              {isStaff ? "Track attendance for events and programs" : "Mark your attendance for programs and sessions"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-600">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
      </header>
      {isStaff ? <StaffRosterView /> : <ResidentCheckIn />}
    </div>
  );
}
