import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STOPTouchPointCounter } from "@/components/stop-touchpoint-counter";
import { 
  Users, 
  FileText, 
  Download, 
  Calendar,
  CheckSquare,
  AlertTriangle,
  TrendingUp,
  Clock,
  Target,
  DollarSign,
  Bell,
  MessageSquare,
  Home,
  Wrench,
  Activity
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";


interface StaffDashboardData {
  totalResidents: number;
  activeResidents: number;
  pendingIntakes: number;
  overdueNotes: number;
  maintenanceTickets: number;
  completionRate: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    residentName?: string;
  }>;
  overdueNotesList?: Array<{
    id: string;
    residentId: string;
    residentName: string;
    noteType: string;
    dueDate: string;
    daysOverdue: number;
  }>;
  notifications?: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    read: boolean;
  }>;
  messages?: Array<{
    id: string;
    from: string;
    subject: string;
    preview: string;
    timestamp: string;
    read: boolean;
  }>;
  upcomingEvents?: Array<{
    id: string;
    type: string;
    title: string;
    residentName: string;
    datetime: string;
  }>;
}

interface Resident {
  id: string;
  name: string;
  email: string;
  currentStage: number;
  lastContact: string;
  status: string;
  caseManagerId: string;
  savings?: number;
  upcomingEvents: number;
}

export function StaffDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedResident, setSelectedResident] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'notifications' | 'messages'>('notifications');
  const [showOverdueModal, setShowOverdueModal] = useState(false);

  // Staff dashboard stats
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<StaffDashboardData>({
    queryKey: ['/api/staff/dashboard'],
  });

  // Residents assigned to this case manager
  const { data: residents } = useQuery<Resident[]>({
    queryKey: ['/api/staff/residents'],
  });

  // PDF generation mutation
  const generatePDFMutation = useMutation({
    mutationFn: (data: { residentId: string; type: 'consent' | 'handbook' | 'monthly_report' }) => 
      apiRequest(`/api/staff/generate-pdf`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (data: { downloadUrl: string; fileName: string }) => {
      // Create download link
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.fileName;
      link.click();
      
      toast({
        title: "PDF Generated",
        description: `${data.fileName} has been downloaded successfully.`
      });
    },
    onError: () => {
      toast({
        title: "PDF Generation Failed",
        description: "Unable to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Monthly report generation
  const generateMonthlyReportMutation = useMutation({
    mutationFn: () => apiRequest(`/api/staff/monthly-report`, {
      method: 'POST',
    }),
    onSuccess: (data: { downloadUrl: string; fileName: string }) => {
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.fileName;
      link.click();
      
      toast({
        title: "Monthly Report Generated",
        description: `${data.fileName} has been downloaded successfully.`
      });
    },
    onError: () => {
      toast({
        title: "Report Generation Failed", 
        description: "Unable to generate monthly report. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleGeneratePDF = (residentId: string, type: 'consent' | 'handbook') => {
    generatePDFMutation.mutate({ residentId, type });
  };

  const handleGenerateMonthlyReport = () => {
    generateMonthlyReportMutation.mutate();
  };

  if (dashboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Dashboard</h1>
            <p className="text-gray-600">Case management and administrative tools</p>
          </div>
          <div className="flex items-center space-x-4">
            <STOPTouchPointCounter />
            <Button variant="ghost" size="icon" className="relative">
              <MessageSquare className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                {dashboardData?.messages?.filter(m => !m.read).length || 0}
              </Badge>
            </Button>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                {dashboardData?.notifications?.filter(n => !n.read).length || 0}
              </Badge>
            </Button>
            <Button 
              onClick={handleGenerateMonthlyReport}
              disabled={generateMonthlyReportMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              {generateMonthlyReportMutation.isPending ? 'Generating...' : 'Monthly Report'}
            </Button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Residents</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {dashboardData?.totalResidents || 0}
              </div>
              <p className="text-xs text-gray-500">
                {dashboardData?.activeResidents || 0} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Intakes</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {dashboardData?.pendingIntakes || 0}
              </div>
              <p className="text-xs text-gray-500">Awaiting review</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setShowOverdueModal(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Notes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {dashboardData?.overdueNotes || 0}
              </div>
              <p className="text-xs text-gray-500">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance Tickets</CardTitle>
              <Wrench className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {dashboardData?.maintenanceTickets || 0}
              </div>
              <p className="text-xs text-gray-500">Total tickets</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Notification Center */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Center</CardTitle>
              <div className="flex space-x-2 mt-2">
                <Button
                  variant={activeTab === 'notifications' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('notifications')}
                >
                  Notifications
                </Button>
                <Button
                  variant={activeTab === 'messages' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('messages')}
                >
                  Messages
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === 'notifications' ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {dashboardData?.notifications?.length ? (
                    dashboardData.notifications.map(notification => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border ${
                          notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{notification.timestamp}</p>
                          </div>
                          {!notification.read && (
                            <Badge className="bg-blue-500 text-white ml-2">New</Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No notifications</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {dashboardData?.messages?.length ? (
                    dashboardData.messages.map(message => (
                      <div
                        key={message.id}
                        className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 ${
                          message.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{message.from}</p>
                            <p className="text-sm text-gray-700">{message.subject}</p>
                            <p className="text-xs text-gray-500 mt-1">{message.preview}</p>
                            <p className="text-xs text-gray-400 mt-1">{message.timestamp}</p>
                          </div>
                          {!message.read && (
                            <Badge className="bg-blue-500 text-white ml-2">New</Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No messages</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-orange-600" />
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {dashboardData?.upcomingEvents?.length ? (
                  dashboardData.upcomingEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-gray-600">{event.residentName}</p>
                        <p className="text-xs text-gray-500 mt-1">{event.datetime}</p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {event.type}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">No upcoming events</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Residents - moved down */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                My Residents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {residents?.map(resident => (
                  <div key={resident.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <h4 className="font-medium">{resident.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Stage {resident.currentStage}</span>
                        <span>Last contact: {resident.lastContact}</span>
                        {resident.savings && (
                          <span className="text-green-600">${resident.savings} saved</span>
                        )}
                      </div>
                      {resident.upcomingEvents > 0 && (
                        <Badge variant="outline" className="mt-1">
                          <Clock className="w-3 h-3 mr-1" />
                          {resident.upcomingEvents} upcoming
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={resident.status === 'Active' ? 'default' : 'secondary'}
                        className={resident.status === 'Active' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {resident.status}
                      </Badge>
                      <div className="flex flex-col space-y-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGeneratePDF(resident.id, 'consent')}
                          disabled={generatePDFMutation.isPending}
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Consent PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGeneratePDF(resident.id, 'handbook')}
                          disabled={generatePDFMutation.isPending}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Handbook PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No residents assigned yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {dashboardData?.recentActivity?.map(activity => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {activity.type}
                        </Badge>
                        <span>{activity.timestamp}</span>
                        {activity.residentName && (
                          <span>• {activity.residentName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )) || [
                  <div key="placeholder" className="text-center py-8 text-gray-500">
                    <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                ]}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Calendar className="w-6 h-6 mb-2" />
                <span>Schedule TouchPoint</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <FileText className="w-6 h-6 mb-2" />
                <span>Add Case Note</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Target className="w-6 h-6 mb-2" />
                <span>Update Goals</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Notes Modal */}
      {showOverdueModal && dashboardData?.overdueNotesList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Overdue Case Notes</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowOverdueModal(false)}
                >
                  <span className="text-2xl">&times;</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="space-y-4 mt-4">
                {dashboardData.overdueNotesList.map(note => (
                  <div key={note.id} className="p-4 border rounded-lg bg-red-50 border-red-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-lg">{note.residentName}</h4>
                        <p className="text-sm text-gray-700 mt-1">
                          <span className="font-medium">Note Type:</span> {note.noteType}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Due Date:</span> {note.dueDate}
                        </p>
                      </div>
                      <Badge className="bg-red-500 text-white">
                        {note.daysOverdue} days overdue
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}