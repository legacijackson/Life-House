import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3, Download, RefreshCw, Users, FileText,
  Calendar, DollarSign, Wrench, Phone, CheckCircle2,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// ── Chart colours ─────────────────────────────────────────────────────────────
const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6", "#10b981"];

// ── Report template definitions ───────────────────────────────────────────────
const REPORT_TEMPLATES = [
  {
    id: "enrollment",
    name: "Client Enrollment Summary",
    description: "New enrollments, discharges, and current census by client type.",
    icon: Users,
    color: "bg-indigo-100 text-indigo-700",
  },
  {
    id: "case-note-compliance",
    name: "Case Note Compliance",
    description: "On-time, overdue, and extremely-late notes per staff member.",
    icon: FileText,
    color: "bg-amber-100 text-amber-700",
  },
  {
    id: "attendance",
    name: "Attendance Summary",
    description: "Present/absent/late rates per event type and per client.",
    icon: Calendar,
    color: "bg-green-100 text-green-700",
  },
  {
    id: "benefits",
    name: "Benefits Status Summary",
    description: "Medi-Cal, CalFresh, SSI, GA enrollment and pending statuses.",
    icon: CheckCircle2,
    color: "bg-teal-100 text-teal-700",
  },
  {
    id: "maintenance",
    name: "Maintenance Summary",
    description: "Open, in-progress, and resolved tickets by category and priority.",
    icon: Wrench,
    color: "bg-orange-100 text-orange-700",
  },
  {
    id: "intake-funnel",
    name: "Intake & Referral Funnel",
    description: "Call log volume, lead conversion rate, and application outcomes.",
    icon: Phone,
    color: "bg-blue-100 text-blue-700",
  },
  {
    id: "stop-touchpoints",
    name: "STOP Touchpoint Summary",
    description: "Touchpoint completion rates and upcoming deadlines per client.",
    icon: BarChart3,
    color: "bg-purple-100 text-purple-700",
  },
] as const;

type ReportId = typeof REPORT_TEMPLATES[number]["id"];

// ── Date range options ────────────────────────────────────────────────────────
const DATE_RANGES = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "This year", days: 365 },
];

// ── CSV export ────────────────────────────────────────────────────────────────
function exportCsv(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(","),
    ...rows.map((r) => keys.map((k) => JSON.stringify(r[k] ?? "")).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

// ── Chart components per report ───────────────────────────────────────────────

function EnrollmentChart({ clients }: { clients: any[] }) {
  const byType = [
    { name: "Resident", count: clients.filter((c) => !c.profile?.clientType || c.profile?.clientType === "resident").length },
    { name: "Non-Resident", count: clients.filter((c) => c.profile?.clientType === "non-resident").length },
    { name: "Onboarding", count: clients.filter((c) => c.profile?.clientType === "onboarding").length },
  ];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {byType.map((b) => (
          <div key={b.name} className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{b.count}</p>
            <p className="text-sm text-gray-500">{b.name}</p>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={byType}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function CaseNoteComplianceChart({ notes }: { notes: any[] }) {
  const byStatus = [
    { name: "Submitted", value: notes.filter((n) => n.status === "submitted").length },
    { name: "Draft", value: notes.filter((n) => n.status === "draft").length },
    { name: "Overdue", value: notes.filter((n) => n.status === "overdue").length },
    { name: "Extremely Late", value: notes.filter((n) => n.status === "extremely-late").length },
  ].filter((x) => x.value > 0);

  const total = notes.length;
  const onTime = notes.filter((n) => n.status === "submitted").length;
  const rate = total > 0 ? Math.round((onTime / total) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-3xl font-bold text-gray-900">{rate}%</p>
          <p className="text-sm text-gray-500">On-Time Compliance</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-3xl font-bold text-gray-900">{total}</p>
          <p className="text-sm text-gray-500">Total Notes</p>
        </div>
      </div>
      {byStatus.length > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={byStatus} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
              {byStatus.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center text-gray-400 text-sm py-8">No case note data yet.</p>
      )}
    </div>
  );
}

function AttendanceSummaryChart({ attendance }: { attendance: any[] }) {
  const byStatus = [
    { name: "Present", value: attendance.filter((a) => a.status === "present").length },
    { name: "Absent", value: attendance.filter((a) => a.status === "absent").length },
    { name: "Late", value: attendance.filter((a) => a.status === "late").length },
    { name: "Excused", value: attendance.filter((a) => a.status === "excused").length },
  ].filter((x) => x.value > 0);

  const total = attendance.length;
  const presentRate = total > 0 ? Math.round((attendance.filter((a) => a.status === "present").length / total) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-3xl font-bold text-green-600">{presentRate}%</p>
          <p className="text-sm text-gray-500">Attendance Rate</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-3xl font-bold text-gray-900">{total}</p>
          <p className="text-sm text-gray-500">Total Records</p>
        </div>
      </div>
      {byStatus.length > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byStatus}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {byStatus.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center text-gray-400 text-sm py-8">No attendance data yet.</p>
      )}
    </div>
  );
}

function MaintenanceSummaryChart({ tickets }: { tickets: any[] }) {
  const byStatus = [
    { name: "Open", count: tickets.filter((t) => t.status === "open").length },
    { name: "In Progress", count: tickets.filter((t) => t.status === "in-progress").length },
    { name: "Resolved", count: tickets.filter((t) => t.status === "resolved").length },
  ];
  const byPriority = [
    { name: "Low", count: tickets.filter((t) => t.priority === "low").length },
    { name: "Medium", count: tickets.filter((t) => t.priority === "medium").length },
    { name: "High", count: tickets.filter((t) => t.priority === "high").length },
    { name: "Urgent", count: tickets.filter((t) => t.priority === "urgent").length },
  ].filter((x) => x.count > 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {byStatus.map((s) => (
          <div key={s.name} className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{s.count}</p>
            <p className="text-sm text-gray-500">{s.name}</p>
          </div>
        ))}
      </div>
      {byPriority.length > 0 && (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={byPriority}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill={COLORS[4]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function IntakeFunnelChart({ calls, applications }: { calls: any[]; applications: any[] }) {
  const funnel = [
    { stage: "Calls Received", count: calls.length },
    { stage: "Leads Captured", count: calls.filter((c) => c.contactType === "Lead").length },
    { stage: "Applications", count: applications.length },
    { stage: "Approved", count: applications.filter((a) => a.status === "approved").length },
    { stage: "Onboarding", count: applications.filter((a) => a.status === "onboarding").length },
  ];

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        {funnel.map((stage, i) => {
          const pct = funnel[0].count > 0 ? Math.round((stage.count / funnel[0].count) * 100) : 0;
          return (
            <div key={stage.stage}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">{stage.stage}</span>
                <span className="font-semibold text-gray-900">{stage.count}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="h-3 rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GenericPlaceholder({ label }: { label: string }) {
  return (
    <div className="text-center py-12">
      <BarChart3 className="mx-auto h-10 w-10 text-gray-300 mb-3" />
      <p className="text-sm text-gray-400">
        {label} data will populate once the database is seeded.
      </p>
    </div>
  );
}

// ── Report View ───────────────────────────────────────────────────────────────

function ReportView({ reportId, days }: { reportId: ReportId; days: number }) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: () => apiRequest("GET", "/api/clients").then((r) => r.json()),
    enabled: reportId === "enrollment" || reportId === "stop-touchpoints",
  });

  const { data: caseNotes = [] } = useQuery({
    queryKey: ["/api/staff-case-notes"],
    queryFn: () => apiRequest("GET", "/api/staff-case-notes").then((r) => r.json()),
    enabled: reportId === "case-note-compliance",
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ["/api/event-attendance"],
    queryFn: () => apiRequest("GET", "/api/event-attendance").then((r) => r.json()),
    enabled: reportId === "attendance",
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ["/api/maintenance-tickets"],
    queryFn: () => apiRequest("GET", "/api/maintenance-tickets").then((r) => r.json()),
    enabled: reportId === "maintenance",
  });

  const { data: calls = [] } = useQuery({
    queryKey: ["/api/call-log"],
    queryFn: () => apiRequest("GET", "/api/call-log").then((r) => r.json()),
    enabled: reportId === "intake-funnel",
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["/api/intake-applications"],
    queryFn: () => apiRequest("GET", "/api/intake-applications").then((r) => r.json()),
    enabled: reportId === "intake-funnel",
  });

  const { toast } = useToast();

  function handleExport() {
    const dataMap: Record<ReportId, any[]> = {
      enrollment: clients as any[],
      "case-note-compliance": caseNotes as any[],
      attendance: attendance as any[],
      benefits: [],
      maintenance: tickets as any[],
      "intake-funnel": [...(calls as any[]), ...(applications as any[])],
      "stop-touchpoints": clients as any[],
    };
    const rows = dataMap[reportId];
    if (!rows.length) {
      toast({ title: "No data to export yet", variant: "destructive" });
      return;
    }
    exportCsv(rows, `${reportId}-report.csv`);
    toast({ title: "CSV downloaded" });
  }

  const template = REPORT_TEMPLATES.find((t) => t.id === reportId)!;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{template.name}</h2>
          <p className="text-xs text-gray-500">{template.description}</p>
        </div>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleExport}>
          <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-5">
          {reportId === "enrollment" && <EnrollmentChart clients={clients as any[]} />}
          {reportId === "case-note-compliance" && <CaseNoteComplianceChart notes={caseNotes as any[]} />}
          {reportId === "attendance" && <AttendanceSummaryChart attendance={attendance as any[]} />}
          {reportId === "maintenance" && <MaintenanceSummaryChart tickets={tickets as any[]} />}
          {reportId === "intake-funnel" && <IntakeFunnelChart calls={calls as any[]} applications={applications as any[]} />}
          {(reportId === "benefits" || reportId === "stop-touchpoints") && (
            <GenericPlaceholder label={template.name} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<ReportId | null>(null);
  const [days, setDays] = useState(30);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
            Reports
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Analytics and compliance reporting</p>
        </div>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map((r) => (
              <SelectItem key={r.days} value={String(r.days)}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template selector */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Report Templates</p>
          {REPORT_TEMPLATES.map((t) => {
            const Icon = t.icon;
            const isActive = selectedReport === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedReport(t.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                  isActive
                    ? "border-indigo-300 bg-indigo-50"
                    : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${t.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? "text-indigo-700" : "text-gray-800"}`}>
                      {t.name}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Report display */}
        <div className="lg:col-span-2">
          {selectedReport ? (
            <ReportView reportId={selectedReport} days={days} />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
              <BarChart3 className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-sm">Select a report template to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
