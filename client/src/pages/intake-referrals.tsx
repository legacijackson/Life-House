import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  UserPlus, 
  FileText, 
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Check,
  X,
  Clock,
  Calendar,
  Mail,
  Phone,
  MapPin,
  AlertCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";

interface Application {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  releaseDate: string;
  justiceStatus: string;
  emergencyContact: string;
  emergencyPhone: string;
  medicalNeeds?: string;
  employmentGoals?: string;
  hasChildren: boolean;
  status: 'new' | 'under_review' | 'approved' | 'waitlisted' | 'denied';
  createdAt: string;
  updatedAt: string;
}

interface Referral {
  id: string;
  residentName: string;
  resourceName: string;
  referredBy: string;
  status: 'pending' | 'contacted' | 'scheduled' | 'completed' | 'cancelled';
  urgency: 'low' | 'medium' | 'high';
  notes?: string;
  scheduledDate?: string;
  createdAt: string;
  updatedAt: string;
}

export default function IntakeReferrals() {
  const { toast } = useToast();
  const { user, isLoading: userLoading } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("applications");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);

  const isAdmin = user?.role === 'Admin';

  // Fetch applications
  const { data: applications = [], isLoading: applicationsLoading } = useQuery<Application[]>({
    queryKey: [`/api/admin/applications?status=${statusFilter}`],
    enabled: activeTab === 'applications'
  });

  // Fetch referrals
  const { data: referrals = [], isLoading: referralsLoading } = useQuery<Referral[]>({
    queryKey: [`/api/admin/referrals?status=${statusFilter}`],
    enabled: activeTab === 'referrals'
  });

  // Update application mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Application> }) => {
      return apiRequest(`/api/admin/applications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/applications'] });
      toast({ title: "Application updated successfully" });
      setIsApplicationModalOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update application", variant: "destructive" });
    }
  });

  // Update referral mutation
  const updateReferralMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Referral> }) => {
      return apiRequest(`/api/admin/referrals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/referrals'] });
      toast({ title: "Referral updated successfully" });
      setIsReferralModalOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update referral", variant: "destructive" });
    }
  });

  // Download applications as CSV
  const downloadApplications = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Status', 'Justice Status', 'Release Date', 'Applied Date'],
      ...applications.map((app: Application) => [
        app.name,
        app.email,
        app.phone,
        app.status,
        app.justiceStatus,
        app.releaseDate,
        new Date(app.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredApplications = applications.filter((app: Application) =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReferrals = referrals.filter((ref: Referral) =>
    ref.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.resourceName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'under_review':
        return <Eye className="h-4 w-4" />;
      case 'approved':
      case 'completed':
        return <Check className="h-4 w-4" />;
      case 'denied':
      case 'cancelled':
        return <X className="h-4 w-4" />;
      case 'waitlisted':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'default';
      case 'new':
      case 'pending':
        return 'secondary';
      case 'denied':
      case 'cancelled':
        return 'destructive';
      case 'waitlisted':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Debug logging
  console.log('IntakeReferrals - user:', user);
  console.log('IntakeReferrals - userLoading:', userLoading);

  if (userLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'Admin' && user.role !== 'CaseManager')) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-gray-600 dark:text-gray-300">
              You don't have permission to access intake and referrals management.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              Debug: User Role = {user?.role || 'No user'} | Loading = {userLoading.toString()}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Intake & Referrals</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Manage housing applications and resident referrals
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Applications
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Referrals
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="waitlisted">Waitlisted</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {activeTab === 'applications' && (
            <Button onClick={downloadApplications} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Housing Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {applicationsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-16 rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredApplications.map((application: Application) => (
                    <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {application.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{application.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {application.email}
                            </div>
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-1" />
                              {application.phone}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              Release: {new Date(application.releaseDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <Badge 
                          variant={getStatusBadgeVariant(application.status)}
                          className="flex items-center gap-1"
                        >
                          {getStatusIcon(application.status)}
                          {application.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedApplication(application);
                              setIsApplicationModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                          
                          {isAdmin && (
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                onClick={() => updateApplicationMutation.mutate({
                                  id: application.id,
                                  data: { status: 'approved' }
                                })}
                                disabled={application.status === 'approved'}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateApplicationMutation.mutate({
                                  id: application.id,
                                  data: { status: 'denied' }
                                })}
                                disabled={application.status === 'denied'}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredApplications.length === 0 && (
                    <div className="text-center py-8">
                      <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No applications found</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {searchTerm ? 'Try adjusting your search terms' : 'No applications match the current filters'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resident Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              {referralsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-16 rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReferrals.map((referral: Referral) => (
                    <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div>
                        <h3 className="font-semibold">{referral.residentName}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Referred to: <span className="font-medium">{referral.resourceName}</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          By {referral.referredBy} • {new Date(referral.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <Badge 
                          variant={referral.urgency === 'high' ? 'destructive' : 
                                  referral.urgency === 'medium' ? 'default' : 'secondary'}
                        >
                          {referral.urgency.toUpperCase()}
                        </Badge>
                        
                        <Badge 
                          variant={getStatusBadgeVariant(referral.status)}
                          className="flex items-center gap-1"
                        >
                          {getStatusIcon(referral.status)}
                          {referral.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReferral(referral);
                            setIsReferralModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Update
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {filteredReferrals.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No referrals found</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {searchTerm ? 'Try adjusting your search terms' : 'No referrals match the current filters'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Application Detail Modal */}
      <Dialog open={isApplicationModalOpen} onOpenChange={setIsApplicationModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Name</Label>
                  <p className="text-lg font-semibold">{selectedApplication.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge variant={getStatusBadgeVariant(selectedApplication.status)} className="ml-2">
                    {selectedApplication.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p>{selectedApplication.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Phone</Label>
                  <p>{selectedApplication.phone}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Date of Birth</Label>
                  <p>{new Date(selectedApplication.dateOfBirth).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Release Date</Label>
                  <p>{new Date(selectedApplication.releaseDate).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Justice Status</Label>
                <p className="capitalize">{selectedApplication.justiceStatus.replace('_', ' ')}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Emergency Contact</Label>
                  <p>{selectedApplication.emergencyContact}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Emergency Phone</Label>
                  <p>{selectedApplication.emergencyPhone}</p>
                </div>
              </div>
              
              {selectedApplication.medicalNeeds && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Medical Needs</Label>
                  <p className="text-sm">{selectedApplication.medicalNeeds}</p>
                </div>
              )}
              
              {selectedApplication.employmentGoals && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Employment Goals</Label>
                  <p className="text-sm">{selectedApplication.employmentGoals}</p>
                </div>
              )}
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Has Children</Label>
                <p>{selectedApplication.hasChildren ? 'Yes' : 'No'}</p>
              </div>
              
              {isAdmin && (
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => updateApplicationMutation.mutate({
                      id: selectedApplication.id,
                      data: { status: 'waitlisted' }
                    })}
                  >
                    Waitlist
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => updateApplicationMutation.mutate({
                      id: selectedApplication.id,
                      data: { status: 'denied' }
                    })}
                  >
                    Deny
                  </Button>
                  <Button
                    onClick={() => updateApplicationMutation.mutate({
                      id: selectedApplication.id,
                      data: { status: 'approved' }
                    })}
                  >
                    Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Referral Update Modal */}
      <Dialog open={isReferralModalOpen} onOpenChange={setIsReferralModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Referral</DialogTitle>
          </DialogHeader>
          {selectedReferral && (
            <div className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select 
                  value={selectedReferral.status}
                  onValueChange={(value) => setSelectedReferral({...selectedReferral, status: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={selectedReferral.notes || ''}
                  onChange={(e) => setSelectedReferral({...selectedReferral, notes: e.target.value})}
                  placeholder="Add notes about this referral..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsReferralModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => updateReferralMutation.mutate({
                    id: selectedReferral.id,
                    data: {
                      status: selectedReferral.status,
                      notes: selectedReferral.notes
                    }
                  })}
                >
                  Update
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}