import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { StatsCards } from "@/components/stats-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResidentModal } from "@/components/resident-modal";
import { useState } from "react";
import { 
  Eye, 
  Edit, 
  Calendar, 
  Users, 
  CheckSquare, 
  Search, 
  Bell,
  Plus
} from "lucide-react";

interface Resident {
  id: string;
  name: string;
  email: string;
  stage: number;
  lastContact: string;
  status: string;
}

export default function Dashboard() {
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  
  const { data: residents = [] } = useQuery<Resident[]>({
    queryKey: ['/api/residents'],
    queryFn: () => apiRequest('GET', '/api/residents').then((r) => r.json()),
  });

  const { data: stats } = useQuery<{
    activeResidents: number;
    pendingNotes: number; 
    avgStage: number;
    openTickets: number;
    totalCaseNotes: number;
    totalResources: number;
    totalReferrals: number;
  }>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: user } = useQuery<{
    id: string;
    role: string;
    name: string;
    email: string;
  }>({
    queryKey: ['/api/auth/user'],
  });

  const getStageColor = (stage: number) => {
    if (stage <= 2) return "bg-yellow-100 text-yellow-800";
    if (stage <= 4) return "bg-blue-100 text-blue-800";
    return "bg-green-100 text-green-800";
  };

  const getStatusColor = (status: string) => {
    if (status === "Active") return "bg-green-100 text-green-800";
    if (status === "Needs Attention") return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="h-full overflow-y-auto">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-600">
                  Welcome back, {user?.name || 'Sarah'}. Here's what's happening today.
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Button className="bg-primary text-white hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  New Resident
                </Button>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
                    3
                  </Badge>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <StatsCards stats={stats} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Residents Table */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>My Residents</CardTitle>
                    <Button variant="ghost" size="sm">View All</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <th className="pb-3">Resident</th>
                          <th className="pb-3">Stage</th>
                          <th className="pb-3">Last Contact</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="space-y-3">
                        {residents.slice(0, 10).map((resident) => (
                          <tr key={resident.id} className="border-b border-gray-100 last:border-0">
                            <td className="py-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-700">
                                    {resident.name.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{resident.name}</p>
                                  <p className="text-xs text-gray-500">{resident.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3">
                              <Badge className={getStageColor(resident.stage)}>
                                Stage {resident.stage}
                              </Badge>
                            </td>
                            <td className="py-3">
                              <p className="text-sm text-gray-900">{resident.lastContact}</p>
                            </td>
                            <td className="py-3">
                              <Badge className={getStatusColor(resident.status)}>
                                {resident.status}
                              </Badge>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setSelectedResident(resident)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start h-auto p-4 bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">Log Attendance</p>
                        <p className="text-xs text-gray-500">Record workshop or 1-on-1</p>
                      </div>
                    </div>
                  </Button>

                  <Button 
                    variant="ghost" 
                    className="w-full justify-start h-auto p-4 bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckSquare className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">Log Service</p>
                        <p className="text-xs text-gray-500">Record billable service</p>
                      </div>
                    </div>
                  </Button>

                  <Button 
                    variant="ghost" 
                    className="w-full justify-start h-auto p-4 bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Search className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">Find Resources</p>
                        <p className="text-xs text-gray-500">Search available services</p>
                      </div>
                    </div>
                  </Button>
                </CardContent>
              </Card>

              {/* Today's Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle>Today's Tasks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <input 
                      type="checkbox" 
                      className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">Complete intake checklist for Maria Garcia</p>
                      <p className="text-xs text-gray-500">Due: 2:00 PM</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <input 
                      type="checkbox" 
                      className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">Follow up with Robert Johnson - housing application</p>
                      <p className="text-xs text-gray-500">Due: 4:00 PM</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <input 
                      type="checkbox" 
                      checked 
                      className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-500 line-through">Submit weekly progress reports</p>
                      <p className="text-xs text-gray-400">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Alerts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <div className="w-4 h-4 text-yellow-600 mt-0.5">⚠️</div>
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Maintenance Required</p>
                        <p className="text-xs text-yellow-700">Unit 203B - Heating issue reported</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <div className="w-4 h-4 text-blue-600 mt-0.5">ℹ️</div>
                      <div>
                        <p className="text-sm font-medium text-blue-800">New Referral</p>
                        <p className="text-xs text-blue-700">Intake review needed for James Wilson</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Resident Modal */}
        {selectedResident && (
          <ResidentModal 
            resident={selectedResident} 
            onClose={() => setSelectedResident(null)} 
          />
        )}
      </div>
  );
}
