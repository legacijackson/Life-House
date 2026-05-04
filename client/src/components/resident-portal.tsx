import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Home,
  DollarSign,
  Target,
  Wrench,
  Search,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  FileText,
  Bell,
  BookOpen
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface ClientProfileData {
  housingStatus: 'not_needed' | 'requested' | 'pending_assignment' | 'assigned' | 'exited' | null;
  programStatus: string | null;
  propertyAssignment: string | null;
  roomAssignment: string | null;
  moveInDate: string | null;
  roommates: { id: string; name: string; avatar?: string }[];
}


interface ResidentDashboardData {
  bedStatus: string;
  currentStage: number;
  savings: number;
  savingsGoal: number;
  upcomingEvents: Array<{
    id: string;
    title: string;
    date: string;
    type: string;
  }>;
  recentProgress: Array<{
    id: string;
    achievement: string;
    date: string;
  }>;
}

interface MaintenanceTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
}

interface Resource {
  id: string;
  name: string;
  category: string;
  description: string;
  contact: string;
  address?: string;
  phone?: string;
  website?: string;
  hours?: string;
}

export function ResidentPortal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [housingRequestOpen, setHousingRequestOpen] = useState(false);
  const [housingForm, setHousingForm] = useState({
    housingNeedReason: '',
    preferredLocation: '',
    accommodationNeeds: '',
  });

  // Dashboard data query
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<ResidentDashboardData>({
    queryKey: ['/api/resident/dashboard'],
  });

  // Client profile query (for housing status gating)
  const { data: clientProfile } = useQuery<ClientProfileData>({
    queryKey: ['/api/resident/profile'],
    select: (data: any) => ({
      housingStatus: data?.housingStatus ?? null,
      programStatus: data?.programStatus ?? null,
      propertyAssignment: data?.propertyAssignment ?? null,
      roomAssignment: data?.roomAssignment ?? null,
      moveInDate: data?.moveInDate ?? null,
      roommates: data?.roommates ?? [],
    }),
  });

  const housingStatus = clientProfile?.housingStatus;
  const housingAssigned = housingStatus === 'assigned';
  const housingRequested = housingStatus === 'requested' || housingStatus === 'pending_assignment';

  // Request housing mutation
  const requestHousingMutation = useMutation({
    mutationFn: (data: { housingNeedReason: string; preferredLocation: string; accommodationNeeds: string }) =>
      apiRequest('POST', `/api/clients/${(user as any)?.id}/request-housing`, data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resident/profile'] });
      toast({
        title: "Housing request submitted",
        description: "Your request has been submitted and staff will follow up with you soon."
      });
    },
    onError: () => {
      toast({
        title: "Error submitting request",
        description: "Please try again or contact staff directly.",
        variant: "destructive"
      });
    }
  });

  // Maintenance tickets query
  const { data: tickets } = useQuery<MaintenanceTicket[]>({
    queryKey: ['/api/tickets'],
  });

  // House rules query
  const { data: houseRules } = useQuery<{ id: string; title: string; content: string; category: string }[]>({
    queryKey: ['/api/house-rules'],
  });

  // Housing notices query
  const { data: housingNotices } = useQuery<{ id: string; title: string; content: string; priority: string; createdAt: string }[]>({
    queryKey: ['/api/housing/notices'],
  });

  // Move-in checklist query (only when housed)
  const { data: checklists } = useQuery<{ id: string; type: string; items: any[]; completedAt: string | null }[]>({
    queryKey: ['/api/housing/checklists', (user as any)?.id],
    queryFn: () => fetch(`/api/housing/checklists/${(user as any)?.id}`, { credentials: 'include' }).then(r => r.json()),
    enabled: housingAssigned && !!(user as any)?.id,
  });

  const moveInChecklist = checklists?.find(c => c.type === 'move_in');

  // Resources query with search
  const { data: resources, isLoading: resourcesLoading } = useQuery<Resource[]>({
    queryKey: ['/api/resources', searchQuery, selectedCategory],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
      return fetch(`/api/resources?${params}`).then((r) => r.json());
    },
    enabled: searchQuery.length > 2 || selectedCategory !== 'all',
  });

  // Maintenance ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: (ticketData: any) => apiRequest('POST', '/api/tickets', ticketData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: "Maintenance request submitted",
        description: "Your request has been submitted and staff will respond within 24-48 hours."
      });
      setIsMaintenanceModalOpen(false);
    },
    onError: () => {
      toast({
        title: "Error submitting request",
        description: "Please try again or contact staff directly.",
        variant: "destructive"
      });
    }
  });

  const handleTicketSubmit = (formData: FormData) => {
    const ticketData = {
      title: formData.get('title'),
      description: formData.get('description'),
      category: formData.get('category'),
      priority: formData.get('priority'),
      propertyId: 'default', // Would be dynamic in real implementation
    };
    createTicketMutation.mutate(ticketData);
  };

  const filteredResources = resources?.filter(resource => {
    const matchesSearch = searchQuery.length < 3 || 
      resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  if (dashboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Client Portal</h1>
          <p className="text-gray-600">Welcome back! Here's your current status and resources.</p>
        </div>

        {/* Housing status banners for non-housed clients */}
        {!housingAssigned && housingStatus === 'not_needed' && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Home className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900">Housing Available</h3>
                  <p className="text-sm text-blue-700 mt-1">You are currently enrolled as a client without housing. If you need housing assistance, you can submit a request to be placed on the housing waitlist.</p>
                  <Button
                    size="sm"
                    className="mt-3 bg-blue-600 hover:bg-blue-700"
                    onClick={() => setHousingRequestOpen(true)}
                  >
                    Request Housing
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!housingAssigned && housingRequested && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900">Housing Request Pending</h3>
                  <p className="text-sm text-yellow-700 mt-1">Your housing request has been submitted and is under review. Staff will contact you when a placement is available.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {housingAssigned && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Housing</CardTitle>
              <Home className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Active</div>
              {clientProfile?.roomAssignment && (
                <p className="text-xs text-gray-500 mt-1">Room: {clientProfile.roomAssignment}</p>
              )}
              {clientProfile?.moveInDate && (
                <p className="text-xs text-gray-400 mt-0.5">Since {new Date(clientProfile.moveInDate).toLocaleDateString()}</p>
              )}
              <Badge className="mt-2 bg-green-100 text-green-800">Confirmed</Badge>
            </CardContent>
          </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Program Stage</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                Stage {dashboardData?.currentStage || 3}
              </div>
              <p className="text-xs text-gray-500 mt-1">7-Stage Reentry Program</p>
              <Progress value={(dashboardData?.currentStage || 3) * 14.3} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Savings Progress</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                ${dashboardData?.savings || 2450}
              </div>
              <p className="text-xs text-gray-500">Goal: ${dashboardData?.savingsGoal || 5000}</p>
              <Progress value={((dashboardData?.savings || 2450) / (dashboardData?.savingsGoal || 5000)) * 100} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Maintenance Requests - only shown when housing is assigned */}
          {housingAssigned && <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Wrench className="w-5 h-5 mr-2 text-orange-600" />
                  Maintenance Requests
                </span>
                <Dialog open={isMaintenanceModalOpen} onOpenChange={setIsMaintenanceModalOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Request Maintenance
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Submit Maintenance Request</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target as HTMLFormElement);
                      handleTicketSubmit(formData);
                    }} className="space-y-4">
                      <div>
                        <Label htmlFor="title">Issue Title</Label>
                        <Input
                          id="title"
                          name="title"
                          placeholder="Brief description of the issue"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select name="category" defaultValue="plumbing">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="plumbing">Plumbing</SelectItem>
                            <SelectItem value="electrical">Electrical</SelectItem>
                            <SelectItem value="hvac">HVAC</SelectItem>
                            <SelectItem value="appliances">Appliances</SelectItem>
                            <SelectItem value="general">General Maintenance</SelectItem>
                            <SelectItem value="emergency">Emergency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select name="priority" defaultValue="medium">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="description">Detailed Description</Label>
                        <Textarea
                          id="description"
                          name="description"
                          placeholder="Please provide detailed information about the issue, location, and any safety concerns..."
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={createTicketMutation.isPending}>
                        {createTicketMutation.isPending ? 'Submitting...' : 'Submit Request'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tickets?.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No active maintenance requests</p>
                ) : (
                  tickets?.map(ticket => (
                    <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{ticket.title}</h4>
                        <p className="text-sm text-gray-600">{ticket.category}</p>
                        <p className="text-xs text-gray-500">{ticket.createdAt}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <div className="mt-1">
                          {ticket.status === 'resolved' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Clock className="w-4 h-4 text-orange-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>}

          {/* Resource Navigator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="w-5 h-5 mr-2 text-blue-600" />
                Resource Navigator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search resources (e.g., 'ID card', 'job training')"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="employment">Employment</SelectItem>
                      <SelectItem value="housing">Housing</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="legal">Legal Aid</SelectItem>
                      <SelectItem value="benefits">Benefits</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-3">
                  {resourcesLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
                      ))}
                    </div>
                  ) : filteredResources.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      {searchQuery.length < 3 ? 'Start typing to search resources...' : 'No resources found. Try different keywords.'}
                    </p>
                  ) : (
                    filteredResources.map(resource => (
                      <div key={resource.id} className="p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-blue-600">{resource.name}</h4>
                          <Badge variant="outline">{resource.category}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {resource.phone && (
                            <div className="flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {resource.phone}
                            </div>
                          )}
                          {resource.address && (
                            <div className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {resource.address}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Progress & Upcoming Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.recentProgress?.map(progress => (
                  <div key={progress.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                      <span className="font-medium">{progress.achievement}</span>
                    </div>
                    <span className="text-sm text-gray-500">{progress.date}</span>
                  </div>
                )) || [
                  <div key="1" className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                      <span className="font-medium">Completed employment workshop</span>
                    </div>
                    <span className="text-sm text-gray-500">2 days ago</span>
                  </div>
                ]}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData?.upcomingEvents?.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-gray-600">{event.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{event.date}</p>
                      <Clock className="w-4 h-4 text-gray-400 ml-auto" />
                    </div>
                  </div>
                )) || [
                  <div key="1" className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Case Manager Check-in</h4>
                      <p className="text-sm text-gray-600">Weekly Meeting</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Tomorrow 2:00 PM</p>
                      <Clock className="w-4 h-4 text-gray-400 ml-auto" />
                    </div>
                  </div>
                ]}
              </div>
            </CardContent>
          </Card>
        </div>
        </div>

        {/* Housing Notices */}
        {housingNotices && housingNotices.length > 0 && (
          <Card className="mb-6 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-800">
                <Bell className="w-5 h-5 mr-2" />
                Housing Notices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {housingNotices.map(notice => (
                  <div key={notice.id} className={`p-3 rounded-lg border ${notice.priority === 'urgent' ? 'bg-red-50 border-red-200' : notice.priority === 'high' ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm">{notice.title}</h4>
                      {notice.priority !== 'normal' && (
                        <Badge className={notice.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'} variant="secondary">
                          {notice.priority}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{notice.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Roommate Info */}
        {housingAssigned && clientProfile?.roommates && clientProfile.roommates.length > 0 && (
          <Card className="mb-6 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800 text-sm flex items-center">
                <Home className="w-4 h-4 mr-2" />
                Your Roommates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {clientProfile.roommates.map(roommate => (
                  <div key={roommate.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {roommate.avatar ? (
                        <img src={roommate.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <span className="text-xs font-medium text-blue-700">
                          {roommate.name?.split(' ').map(n => n[0]).join('') || '?'}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-700">{roommate.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Move-in Checklist (shown when housed and checklist exists) */}
        {housingAssigned && moveInChecklist && (
          <Card className="mb-6 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center text-green-800">
                  <FileText className="w-5 h-5 mr-2" />
                  Move-in Checklist
                </span>
                {moveInChecklist.completedAt ? (
                  <Badge className="bg-green-100 text-green-800">Completed</Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {moveInChecklist.items.filter((i: any) => i.status === 'done' || i.status === 'na').length} / {moveInChecklist.items.length} Done
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {moveInChecklist.items.map((item: any) => (
                  <div key={item.key} className="flex items-center gap-3 py-2 border-b last:border-0">
                    {item.status === 'done' ? (
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    ) : item.status === 'na' ? (
                      <div className="w-4 h-4 rounded-full bg-gray-200 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${item.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">Contact your case manager to complete any pending items.</p>
            </CardContent>
          </Card>
        )}

        {/* House Rules */}
        {housingAssigned && houseRules && houseRules.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-800">
                <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                House Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {houseRules.map(rule => (
                  <div key={rule.id} className="border-b last:border-0 pb-3 last:pb-0">
                    <h4 className="font-semibold text-sm text-gray-900">{rule.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{rule.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={housingRequestOpen} onOpenChange={setHousingRequestOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Request Housing Placement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-sm text-gray-600">
                Submit a housing request to be placed on the Life House waitlist. Staff will review your request and contact you.
              </p>
              <div>
                <Label htmlFor="housingNeedReason">Why do you need housing? *</Label>
                <Textarea
                  id="housingNeedReason"
                  className="mt-1"
                  rows={3}
                  placeholder="Briefly describe your current housing situation and need..."
                  value={housingForm.housingNeedReason}
                  onChange={(e) => setHousingForm(p => ({ ...p, housingNeedReason: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="preferredLocation">Preferred Location (optional)</Label>
                <Input
                  id="preferredLocation"
                  className="mt-1"
                  placeholder="e.g. Sacramento area, near public transit..."
                  value={housingForm.preferredLocation}
                  onChange={(e) => setHousingForm(p => ({ ...p, preferredLocation: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="accommodationNeeds">Special Accommodation Needs (optional)</Label>
                <Input
                  id="accommodationNeeds"
                  className="mt-1"
                  placeholder="e.g. wheelchair access, no stairs..."
                  value={housingForm.accommodationNeeds}
                  onChange={(e) => setHousingForm(p => ({ ...p, accommodationNeeds: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!housingForm.housingNeedReason || requestHousingMutation.isPending}
                  onClick={() => {
                    requestHousingMutation.mutate(housingForm);
                    setHousingRequestOpen(false);
                  }}
                >
                  {requestHousingMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </Button>
                <Button variant="outline" onClick={() => setHousingRequestOpen(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}