import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign, TrendingUp, Users, Heart, Download,
  CreditCard, Calendar, CheckCircle, Clock, XCircle,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useToast } from "@/hooks/use-toast";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444"];

function fmt(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function fmtShort(amount: number) {
  return "$" + amount.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function FinancePage() {
  const { toast } = useToast();

  const { data: donors = [] } = useQuery<any[]>({
    queryKey: ['/api/donors'],
    queryFn: () => apiRequest('GET', '/api/donors').then((r) => r.json()),
  });

  const { data: donations = [] } = useQuery<any[]>({
    queryKey: ['/api/donor-donations'],
    queryFn: () => apiRequest('GET', '/api/donor-donations').then((r) => r.json()),
  });

  // ── Derived stats ────────────────────────────────────────────────────────────
  const totalRaised = donations.reduce((sum: number, d: any) => sum + Number(d.amount ?? 0), 0);
  const uniqueDonorIds = new Set(donations.map((d: any) => d.donorId));
  const totalDonors = donors.length || uniqueDonorIds.size;
  const monthlyRecurring = donations.filter((d: any) => d.frequency === "monthly").length;

  const now = new Date();
  const thisMonthTotal = donations
    .filter((d: any) => {
      if (!d.processedAt) return false;
      const dt = new Date(d.processedAt);
      return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
    })
    .reduce((sum: number, d: any) => sum + Number(d.amount ?? 0), 0);

  // ── Monthly bar chart (last 6 months) ────────────────────────────────────────
  const monthlyData = (() => {
    const months: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      months[key] = 0;
    }
    for (const d of donations) {
      if (!d.processedAt) continue;
      const dt = new Date(d.processedAt);
      const key = dt.toLocaleString("en-US", { month: "short", year: "2-digit" });
      if (key in months) months[key] += Number(d.amount ?? 0);
    }
    return Object.entries(months).map(([month, total]) => ({ month, total }));
  })();

  // ── Designation pie chart ─────────────────────────────────────────────────────
  const designationData = (() => {
    const map: Record<string, number> = {};
    for (const d of donations) {
      const key = d.designation ?? "general";
      map[key] = (map[key] ?? 0) + Number(d.amount ?? 0);
    }
    return Object.entries(map).map(([name, value]) => ({
      name: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value,
    }));
  })();

  // ── Donor lookup map ──────────────────────────────────────────────────────────
  const donorMap = new Map<number, any>(donors.map((d: any) => [d.id, d]));

  // ── Donor totals map ──────────────────────────────────────────────────────────
  const donorTotals = new Map<number, number>();
  const donorLastGift = new Map<number, string>();
  const donorHasMonthly = new Set<number>();
  for (const d of donations) {
    const id = d.donorId;
    donorTotals.set(id, (donorTotals.get(id) ?? 0) + Number(d.amount ?? 0));
    if (!donorLastGift.has(id) || new Date(d.processedAt) > new Date(donorLastGift.get(id)!)) {
      donorLastGift.set(id, d.processedAt);
    }
    if (d.frequency === "monthly") donorHasMonthly.add(id);
  }

  const summaryCards = [
    {
      title: "Total Raised",
      value: fmtShort(totalRaised),
      icon: DollarSign,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "Total Donors",
      value: String(totalDonors),
      icon: Users,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Monthly Recurring",
      value: `${monthlyRecurring} donors`,
      icon: Heart,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      title: "This Month",
      value: fmtShort(thisMonthTotal),
      icon: Calendar,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  function statusBadge(status: string) {
    if (status === "completed") return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>;
    if (status === "pending") return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>;
    if (status === "failed") return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Failed</Badge>;
    return <Badge variant="secondary">{status ?? "—"}</Badge>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-indigo-600" />
            Finance Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Donations, donors, and financial overview</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast({ title: "Export feature coming soon" })}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${card.bg}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{card.title}</p>
                  <p className="text-xl font-bold text-gray-900">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Monthly Donations (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.some((m) => m.total > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="total" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                No donation data yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Designation Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {designationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={designationData}
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}
                    labelLine={false}
                  >
                    {designationData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                No designation data yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Donations + Donors */}
      <Tabs defaultValue="donations">
        <TabsList>
          <TabsTrigger value="donations">Donations</TabsTrigger>
          <TabsTrigger value="donors">Donors</TabsTrigger>
        </TabsList>

        <TabsContent value="donations">
          <Card>
            <CardContent className="p-0">
              {donations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <CreditCard className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm">No donations recorded yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 text-left">
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Donor</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Method</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Designation</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {donations.map((d: any) => {
                        const donor = donorMap.get(d.donorId);
                        const donorName = donor
                          ? `${donor.firstName ?? ""} ${donor.lastName ?? ""}`.trim() || donor.name || "Anonymous"
                          : "Anonymous";
                        return (
                          <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                              {d.processedAt ? new Date(d.processedAt).toLocaleDateString() : "—"}
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-900">{donorName}</td>
                            <td className="px-4 py-3 text-gray-900 font-medium">{fmt(Number(d.amount ?? 0))}</td>
                            <td className="px-4 py-3 text-gray-600 capitalize">{d.paymentMethod ?? "—"}</td>
                            <td className="px-4 py-3 text-gray-600 capitalize">
                              {(d.designation ?? "general").replace(/_/g, " ")}
                            </td>
                            <td className="px-4 py-3">{statusBadge(d.status)}</td>
                            <td className="px-4 py-3">
                              {d.receiptSent ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Clock className="h-4 w-4 text-gray-400" />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="donors">
          <Card>
            <CardContent className="p-0">
              {donors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Users className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm">No donors recorded yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 text-left">
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Given</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Donation</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Recurring</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {donors.map((donor: any) => {
                        const name = `${donor.firstName ?? ""} ${donor.lastName ?? ""}`.trim() || donor.name || "—";
                        const total = donorTotals.get(donor.id) ?? 0;
                        const lastGift = donorLastGift.get(donor.id);
                        const isMonthly = donorHasMonthly.has(donor.id);
                        return (
                          <tr key={donor.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-900">{name}</td>
                            <td className="px-4 py-3 text-gray-600">{donor.email ?? "—"}</td>
                            <td className="px-4 py-3 text-gray-600 capitalize">{donor.donorType ?? donor.type ?? "individual"}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{fmt(total)}</td>
                            <td className="px-4 py-3 text-gray-600">
                              {lastGift ? new Date(lastGift).toLocaleDateString() : "—"}
                            </td>
                            <td className="px-4 py-3">
                              {isMonthly && (
                                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">Monthly</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
