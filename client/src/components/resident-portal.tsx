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
  Plus
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";


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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

  // Dashboard data query
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<ResidentDashboardData>({
    queryKey: ['/api/resident/dashboard'],
  });

  // Maintenance tickets query
  const { data: tickets } = useQuery<MaintenanceTicket[]>({
    queryKey: ['/api/tickets'],
  });

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

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bed Status</CardTitle>
              <Home className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {dashboardData?.bedStatus || 'Active'}
              </div>
              <Badge className="mt-2 bg-green-100 text-green-800">Confirmed</Badge>
            </CardContent>
          </Card>

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
          {/* Maintenance Requests */}
          <Card>
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
          </Card>

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
      </div>
  );
}