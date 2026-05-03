import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Home as HomeIcon, Calendar, CheckCircle2, AlertCircle, Wrench, Archive,
  ArrowRight, Clock, MapPin, ChevronRight,
} from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";

interface LhEvent {
  id: string;
  title: string;
  eventType: string;
  startTime: string;
  endTime?: string;
  location?: string;
}

interface CheckInSession {
  id: string;
  name: string;
  type: string;
  startTime: string;
  endTime: string;
  status: "upcoming" | "active" | "completed";
  checkedIn?: boolean;
}

interface OnboardingPhase {
  phaseKey: string;
  completed: boolean;
  completedAt?: string;
}

const STAFF_ROLES = ["Admin", "CaseManager", "Intake", "Staff"];

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const role = (user as any)?.role ?? "";
  const isStaff = STAFF_ROLES.includes(role) || (user as any)?.isAdmin;

  // Redirect staff to their dashboard
  useEffect(() => {
    if (!user) return;
    if ((user as any)?.isAdmin || role === "Admin") {
      setLocation("/app/staff-dashboard");
    } else if (role === "CaseManager") {
      setLocation("/app/staff-dashboard");
    } else if (role === "Intake") {
      setLocation("/app/intake");
    }
  }, [user, role, setLocation]);

  const { data: events = [] } = useQuery<LhEvent[]>({
    queryKey: ["/api/lh-events"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !isStaff,
  });

  const { data: sessions = [] } = useQuery<CheckInSession[]>({
    queryKey: ["/api/check-in/sessions"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !isStaff,
  });

  const userId = (user as any)?.id;
  const { data: phaseData } = useQuery<OnboardingPhase[]>({
    queryKey: ["/api/onboarding/phases", userId],
    queryFn: async () => {
      const res = await fetch(`/api/onboarding/phases?clientId=${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken") || ""}` },
        credentials: "include",
      });
      if (res.status === 401) return null;
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !isStaff && !!userId,
  });

  if (isStaff) {
    return null;
  }

  const now = new Date();
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const upcomingEvents = (events as LhEvent[])
    .filter((e) => new Date(e.startTime) >= now && new Date(e.startTime) <= nextWeek)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 4);

  const activeSession = (sessions as CheckInSession[]).find((s) => s.status === "active");
  const completedToday = (phaseData as OnboardingPhase[] | undefined)?.filter((p) => p.completed).length ?? 0;
  const totalPhases = phaseData ? (phaseData as OnboardingPhase[]).length : 13;

  const userName = (user as any)?.name || "there";
  const firstName = userName.split(" ")[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <HomeIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName}!</h1>
              <p className="text-sm text-gray-500">
                {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* Program Progress */}
        {phaseData && (
          <Card className="mb-6 border-indigo-100 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Program Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-indigo-700">{completedToday}</span>
                <span className="text-sm text-gray-500">of {totalPhases} phases complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (completedToday / Math.max(totalPhases, 1)) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">Intake</span>
                <span className="text-xs text-gray-500">Graduation</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Check-in Alert */}
        {activeSession && (
          <div className="mb-5 p-4 rounded-xl border border-green-200 bg-green-50 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800">Check-in Available Now</p>
              <p className="text-xs text-green-700">{activeSession.name} is active until {activeSession.endTime}</p>
            </div>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 h-8 text-xs shrink-0"
              onClick={() => setLocation("/app/check-in")}
            >
              Check In <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: "Check-in", icon: CheckCircle2, href: "/app/check-in", color: "bg-green-50 border-green-200 text-green-700" },
            { label: "Resources", icon: Archive, href: "/app/resources", color: "bg-blue-50 border-blue-200 text-blue-700" },
            { label: "Maintenance", icon: Wrench, href: "/app/maintenance", color: "bg-orange-50 border-orange-200 text-orange-700" },
            { label: "My Profile", icon: HomeIcon, href: "/app/profile", color: "bg-purple-50 border-purple-200 text-purple-700" },
          ].map(({ label, icon: Icon, href, color }) => (
            <button
              key={label}
              className={`flex items-center gap-3 p-4 rounded-xl border ${color} hover:opacity-90 transition-opacity text-left`}
              onClick={() => setLocation(href)}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{label}</span>
              <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
            </button>
          ))}
        </div>

        {/* Upcoming Events */}
        <Card className="mb-6 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-500" /> Upcoming Events
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setLocation("/app/check-in")}>
              All →
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-gray-400 py-3 text-center">No upcoming events this week.</p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="text-center min-w-[40px]">
                      <p className="text-xs font-bold text-indigo-600 uppercase">
                        {new Date(event.startTime).toLocaleDateString("en-US", { month: "short" })}
                      </p>
                      <p className="text-lg font-bold text-gray-900 leading-none">
                        {new Date(event.startTime).getDate()}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {new Date(event.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </span>
                        {event.location && (
                          <>
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500 truncate">{event.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {event.eventType?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notice */}
        <Card className="bg-amber-50 border-amber-100 shadow-none">
          <CardContent className="py-4 px-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Program Reminders</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Curfew is 10 PM nightly. Check in by 9 PM to avoid a missed check-in mark.
                  Contact your case manager if you have any questions about your program requirements.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
