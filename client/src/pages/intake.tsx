import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { OnboardingWizard } from "@/components/onboarding-wizard";

import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  UserPlus,
  Search,
  Eye,
  X,
  ChevronDown
} from 'lucide-react';

interface Referral {
  id: string;
  source: string;
  referrerOrg: string;
  referrerName: string;
  referrerEmail: string;
  referrerPhone: string;
  basicResidentInfo: {
    name: string;
    email: string;
    phone: string;
    zip: string;
    earliestReadyDate: string;
  };
  notes: string;
  status: 'new' | 'in_review' | 'accepted' | 'waitlist' | 'declined';
  createdAt: string;
}

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  bedrooms: number;
  bedsTotal: number;
  bedsAvailable: number;
}

export default function Intake() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  const [selectedTab, setSelectedTab] = useState('referrals');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnboardingFlow, setShowOnboardingFlow] = useState(false);

  const { data: referrals, isLoading: referralsLoading } = useQuery<Referral[]>({
    queryKey: ['/api/admin/referrals'],
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/applications'],
  });

  const { data: properties } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });

  const { data: staff } = useQuery<any[]>({
    queryKey: ['/api/staff/users'],
  });

  const { data: programs } = useQuery<any[]>({
    queryKey: ['/api/programs'],
  });



  const updateReferralMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest(`/api/admin/referrals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/referrals'] });
      toast({
        title: "Success",
        description: "Referral updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update referral",
        variant: "destructive",
      });
    },
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest(`/api/admin/applications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/applications'] });
      toast({
        title: "Success",
        description: "Application status updated successfully",
      });
      setSelectedApplication(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
    },
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'waitlisted': return 'bg-orange-100 text-orange-800';
      case 'waitlist': return 'bg-orange-100 text-orange-800';
      case 'denied': return 'bg-red-100 text-red-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'onboard': return 'bg-emerald-100 text-emerald-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = (referralId: string, newStatus: string) => {
    updateReferralMutation.mutate({
      id: referralId,
      data: { status: newStatus as any }
    });
  };

  const handleApplicationStatusUpdate = (applicationId: string, newStatus: string) => {
    if (newStatus === 'onboard') {
      setShowOnboardingFlow(true);
    } else {
      updateApplicationMutation.mutate({
        id: applicationId,
        data: { status: newStatus }
      });
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'in_progress': return 'In Progress';
      case 'accepted': return 'Accept';
      case 'denied': return 'Deny';
      case 'waitlist': return 'Waitlist';
      case 'onboard': return 'Onboard';
      case 'closed': return 'Close';
      default: return status;
    }
  };

  const referralsByStatus = {
    new: referrals?.filter(r => r.status === 'new') || [],
    in_review: referrals?.filter(r => r.status === 'in_review') || [],
    accepted: referrals?.filter(r => r.status === 'accepted') || [],
    waitlist: referrals?.filter(r => r.status === 'waitlist') || [],
    declined: referrals?.filter(r => r.status === 'declined') || [],
  };

  // Filter applications based on search query
  const filteredApplications = applications?.filter(app => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      app.name?.toLowerCase().includes(query) ||
      app.email?.toLowerCase().includes(query) ||
      app.confirmationNumber?.toLowerCase().includes(query) ||
      app.phone?.includes(query)
    );
  }) || [];

  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Intake & Referrals</h1>
                <p className="text-sm text-gray-600">Manage referrals and client onboarding</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  Applications: {applications?.length || 0} | Referrals: {referrals?.length || 0}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="referrals">Referrals Queue</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
            </TabsList>

            <TabsContent value="referrals" className="space-y-6">
              {/* Applications Section */}
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-green-600" />
                        Housing Applications ({filteredApplications.length})
                      </CardTitle>
                      <CardDescription>Direct applications submitted via the website</CardDescription>
                    </div>
                    <div className="relative w-80">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search by name, email, or confirmation number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {applicationsLoading ? (
                    <div className="text-center py-4">Loading applications...</div>
                  ) : filteredApplications.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      {searchQuery ? 'No applications match your search' : 'No applications found'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredApplications.map((app: any) => (
                        <Card key={app.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedApplication(app)}>
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="font-medium">{app.name}</div>
                              <div className="text-sm text-gray-600">
                                Email: {app.email} | Phone: {app.phone}
                              </div>
                              <div className="text-sm text-gray-500">
                                Release Date: {new Date(app.releaseDate).toLocaleDateString()} | 
                                Status: {app.justiceStatus} | 
                                Confirmation: {app.confirmationNumber}
                              </div>
                              <div className="text-xs text-gray-400">
                                Submitted: {new Date(app.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusBadgeColor(app.status)} variant="secondary">
                                {app.status}
                              </Badge>
                              <Eye className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Referrals Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
                    Referrals ({referrals?.length || 0})
                  </CardTitle>
                  <CardDescription>Referrals from partner organizations</CardDescription>
                </CardHeader>
                <CardContent>
                  {referralsLoading ? (
                    <div className="text-center py-4">Loading referrals...</div>
                  ) : referrals?.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No referrals found</div>
                  ) : (
                    <div className="space-y-3">
                      {referrals?.filter(r => r.status === 'new' || r.status === 'in_review').map((referral) => (
                        <Card key={referral.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedReferral(referral)}>
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="font-medium">{referral.basicResidentInfo?.name || 'Unknown'}</div>
                              <div className="text-sm text-gray-600">
                                From: {referral.referrerOrg} — {referral.referrerName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {referral.referrerEmail} {referral.referrerPhone ? `| ${referral.referrerPhone}` : ''}
                              </div>
                              {referral.basicResidentInfo?.earliestReadyDate && (
                                <div className="text-xs text-gray-400">
                                  Ready: {new Date(referral.basicResidentInfo.earliestReadyDate).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge className={getStatusBadgeColor(referral.status)} variant="secondary">
                                {referral.status === 'in_review' ? 'In Review' : referral.status}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={e => e.stopPropagation()}>
                                    Update <ChevronDown className="w-3 h-3 ml-1" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={e => { e.stopPropagation(); handleStatusUpdate(referral.id, 'in_review'); }}>
                                    <Clock className="w-4 h-4 mr-2 text-yellow-600" /> Mark In Review
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={e => { e.stopPropagation(); handleStatusUpdate(referral.id, 'accepted'); }}>
                                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" /> Accept
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={e => { e.stopPropagation(); handleStatusUpdate(referral.id, 'waitlist'); }}>
                                    <Users className="w-4 h-4 mr-2 text-orange-600" /> Waitlist
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={e => { e.stopPropagation(); handleStatusUpdate(referral.id, 'declined'); }}>
                                    <X className="w-4 h-4 mr-2 text-red-600" /> Decline
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          {referral.notes && (
                            <p className="text-xs text-gray-500 mt-2 border-t pt-2">{referral.notes}</p>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="in_progress" className="space-y-6">
              {/* In-progress applications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-purple-600" />
                    In-Progress Applications ({applications?.filter(a => a.status === 'in_progress' || a.status === 'approved' || a.status === 'waitlisted').length || 0})
                  </CardTitle>
                  <CardDescription>Applications being actively reviewed or awaiting onboarding</CardDescription>
                </CardHeader>
                <CardContent>
                  {applicationsLoading ? (
                    <div className="text-center py-4">Loading…</div>
                  ) : applications?.filter(a => ['in_progress', 'approved', 'waitlisted'].includes(a.status)).length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No in-progress applications</div>
                  ) : (
                    <div className="space-y-3">
                      {applications?.filter(a => ['in_progress', 'approved', 'waitlisted'].includes(a.status)).map((app: any) => (
                        <Card key={app.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedApplication(app)}>
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="font-medium">{app.name}</div>
                              <div className="text-sm text-gray-600">{app.email} | {app.phone}</div>
                              <div className="text-xs text-gray-400">Confirmation: {app.confirmationNumber}</div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge className={getStatusBadgeColor(app.status)} variant="secondary">{app.status}</Badge>
                              <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); setSelectedApplication(app); }}>
                                <Eye className="w-3 h-3 mr-1" /> Review
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* In-review referrals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
                    Accepted / Waitlisted Referrals ({referrals?.filter(r => r.status === 'accepted' || r.status === 'waitlist').length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {referralsLoading ? (
                    <div className="text-center py-4">Loading…</div>
                  ) : referrals?.filter(r => r.status === 'accepted' || r.status === 'waitlist').length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No accepted or waitlisted referrals</div>
                  ) : (
                    <div className="space-y-3">
                      {referrals?.filter(r => r.status === 'accepted' || r.status === 'waitlist').map((referral) => (
                        <Card key={referral.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="font-medium">{referral.basicResidentInfo?.name || 'Unknown'}</div>
                              <div className="text-sm text-gray-600">{referral.referrerOrg} — {referral.referrerName}</div>
                            </div>
                            <Badge className={getStatusBadgeColor(referral.status)} variant="secondary">
                              {referral.status === 'waitlist' ? 'Waitlisted' : 'Accepted'}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="closed" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-gray-500" />
                    Closed Applications ({applications?.filter(a => ['denied', 'closed'].includes(a.status)).length || 0})
                  </CardTitle>
                  <CardDescription>Denied, closed, or inactive applications</CardDescription>
                </CardHeader>
                <CardContent>
                  {applicationsLoading ? (
                    <div className="text-center py-4">Loading…</div>
                  ) : applications?.filter(a => ['denied', 'closed'].includes(a.status)).length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No closed applications</div>
                  ) : (
                    <div className="space-y-3">
                      {applications?.filter(a => ['denied', 'closed'].includes(a.status)).map((app: any) => (
                        <Card key={app.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedApplication(app)}>
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="font-medium text-gray-700">{app.name}</div>
                              <div className="text-sm text-gray-500">{app.email}</div>
                              <div className="text-xs text-gray-400">
                                {app.confirmationNumber} · Submitted {new Date(app.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <Badge className={getStatusBadgeColor(app.status)} variant="secondary">{app.status}</Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserPlus className="w-5 h-5 mr-2 text-gray-500" />
                    Declined Referrals ({referrals?.filter(r => r.status === 'declined').length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {referralsLoading ? (
                    <div className="text-center py-4">Loading…</div>
                  ) : referrals?.filter(r => r.status === 'declined').length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No declined referrals</div>
                  ) : (
                    <div className="space-y-3">
                      {referrals?.filter(r => r.status === 'declined').map((referral) => (
                        <Card key={referral.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="font-medium text-gray-700">{referral.basicResidentInfo?.name || 'Unknown'}</div>
                              <div className="text-sm text-gray-500">{referral.referrerOrg}</div>
                              <div className="text-xs text-gray-400">{new Date(referral.createdAt).toLocaleDateString()}</div>
                            </div>
                            <Badge className={getStatusBadgeColor(referral.status)} variant="secondary">Declined</Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Application Details Modal */}
      {selectedApplication && (
        <Dialog open={true} onOpenChange={() => setSelectedApplication(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Application Details - {selectedApplication.name}</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedApplication(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </DialogTitle>
              <DialogDescription>
                Confirmation: {selectedApplication.confirmationNumber} | Submitted: {new Date(selectedApplication.createdAt).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Full Name</Label>
                      <p className="text-sm">{selectedApplication.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Email</Label>
                      <p className="text-sm">{selectedApplication.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Phone</Label>
                      <p className="text-sm">{selectedApplication.phone}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Date of Birth</Label>
                      <p className="text-sm">{new Date(selectedApplication.dateOfBirth).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Justice System Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Justice System Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Release Date</Label>
                      <p className="text-sm">{new Date(selectedApplication.releaseDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Current Status</Label>
                      <p className="text-sm capitalize">{selectedApplication.justiceStatus.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Application Status</Label>
                      <Badge className={getStatusBadgeColor(selectedApplication.status)} variant="secondary">
                        {selectedApplication.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Emergency Contact */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Emergency Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Contact Name</Label>
                      <p className="text-sm">{selectedApplication.emergencyContact || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Contact Phone</Label>
                      <p className="text-sm">{selectedApplication.emergencyPhone || 'Not provided'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Medical/Special Needs</Label>
                      <p className="text-sm">{selectedApplication.medicalNeeds || 'None specified'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Employment Goals</Label>
                      <p className="text-sm">{selectedApplication.employmentGoals || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Has Children</Label>
                      <p className="text-sm">{selectedApplication.hasChildren ? 'Yes' : 'No'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedApplication(null)}>
                  Close
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button disabled={updateApplicationMutation.isPending}>
                      {updateApplicationMutation.isPending ? 'Updating...' : 'Process Application'}
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleApplicationStatusUpdate(selectedApplication.id, 'in_progress')}>
                      <Clock className="w-4 h-4 mr-2" />
                      Mark In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleApplicationStatusUpdate(selectedApplication.id, 'approved')}>
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      Approve Application
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleApplicationStatusUpdate(selectedApplication.id, 'denied')}>
                      <X className="w-4 h-4 mr-2 text-red-600" />
                      Deny Application
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleApplicationStatusUpdate(selectedApplication.id, 'waitlisted')}>
                      <Users className="w-4 h-4 mr-2 text-orange-600" />
                      Add to Waitlist
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleApplicationStatusUpdate(selectedApplication.id, 'onboard')}>
                      <UserPlus className="w-4 h-4 mr-2 text-blue-600" />
                      Onboard Client
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleApplicationStatusUpdate(selectedApplication.id, 'closed')}>
                      <AlertCircle className="w-4 h-4 mr-2 text-gray-600" />
                      Close Application
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Onboarding Flow Modal */}
      <OnboardingWizard
        isOpen={showOnboardingFlow}
        onClose={() => setShowOnboardingFlow(false)}
        onComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/admin/applications'] });
          queryClient.invalidateQueries({ queryKey: ['/api/staff/residents'] });
          setShowOnboardingFlow(false);
          setSelectedApplication(null);
        }}
      />
    </div>
  );
}