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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Bed,
  FileText,
  UserPlus
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

interface IntakeChecklistItem {
  key: string;
  label: string;
  status: 'pending' | 'done' | 'na';
  completedAt?: string;
  staffId?: string;
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
  const [selectedTab, setSelectedTab] = useState('referrals');

  const { data: referrals, isLoading: referralsLoading } = useQuery<Referral[]>({
    queryKey: ['/api/referrals'],
  });

  const { data: properties } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });

  const updateReferralMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Referral> }) => {
      return apiRequest(`/api/referrals/${id}`, 'PATCH', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/referrals'] });
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

  const createResidentMutation = useMutation({
    mutationFn: async (referralId: string) => {
      return apiRequest('/api/intake/create-resident', 'POST', { referralId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/referrals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/residents'] });
      toast({
        title: "Success",
        description: "Resident created and enrolled successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create resident",
        variant: "destructive",
      });
    },
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in_review': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'waitlist': return 'bg-orange-100 text-orange-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = (referralId: string, newStatus: string) => {
    updateReferralMutation.mutate({
      id: referralId,
      data: { status: newStatus as any }
    });
  };

  const handleCreateResident = (referralId: string) => {
    createResidentMutation.mutate(referralId);
  };

  const referralsByStatus = {
    new: referrals?.filter(r => r.status === 'new') || [],
    in_review: referrals?.filter(r => r.status === 'in_review') || [],
    accepted: referrals?.filter(r => r.status === 'accepted') || [],
    waitlist: referrals?.filter(r => r.status === 'waitlist') || [],
    declined: referrals?.filter(r => r.status === 'declined') || [],
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Intake & Referrals</h1>
          <p className="text-gray-600">Manage referrals and resident onboarding</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Total Referrals: {referrals?.length || 0}
          </div>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="referrals">Referrals Queue</TabsTrigger>
          <TabsTrigger value="beds">Bed Assignment</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
        </TabsList>

        <TabsContent value="referrals" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* New Referrals */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm">
                  <AlertCircle className="w-4 h-4 mr-2 text-blue-600" />
                  New ({referralsByStatus.new.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {referralsByStatus.new.map((referral) => (
                  <Card key={referral.id} className="p-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedReferral(referral)}>
                    <div className="space-y-2">
                      <div className="font-medium text-sm">{referral.basicResidentInfo.name}</div>
                      <div className="text-xs text-gray-500">{referral.referrerOrg}</div>
                      <Badge className={getStatusBadgeColor(referral.status)} variant="secondary">
                        {referral.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* In Review */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm">
                  <Clock className="w-4 h-4 mr-2 text-yellow-600" />
                  In Review ({referralsByStatus.in_review.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {referralsByStatus.in_review.map((referral) => (
                  <Card key={referral.id} className="p-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedReferral(referral)}>
                    <div className="space-y-2">
                      <div className="font-medium text-sm">{referral.basicResidentInfo.name}</div>
                      <div className="text-xs text-gray-500">{referral.referrerOrg}</div>
                      <Badge className={getStatusBadgeColor(referral.status)} variant="secondary">
                        {referral.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Accepted */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Accepted ({referralsByStatus.accepted.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {referralsByStatus.accepted.map((referral) => (
                  <Card key={referral.id} className="p-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedReferral(referral)}>
                    <div className="space-y-2">
                      <div className="font-medium text-sm">{referral.basicResidentInfo.name}</div>
                      <div className="text-xs text-gray-500">{referral.referrerOrg}</div>
                      <Badge className={getStatusBadgeColor(referral.status)} variant="secondary">
                        {referral.status.replace('_', ' ')}
                      </Badge>
                      <Button size="sm" className="w-full mt-2" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCreateResident(referral.id);
                              }}>
                        <UserPlus className="w-3 h-3 mr-1" />
                        Create Resident
                      </Button>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Waitlist */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm">
                  <Clock className="w-4 h-4 mr-2 text-orange-600" />
                  Waitlist ({referralsByStatus.waitlist.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {referralsByStatus.waitlist.map((referral) => (
                  <Card key={referral.id} className="p-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedReferral(referral)}>
                    <div className="space-y-2">
                      <div className="font-medium text-sm">{referral.basicResidentInfo.name}</div>
                      <div className="text-xs text-gray-500">{referral.referrerOrg}</div>
                      <Badge className={getStatusBadgeColor(referral.status)} variant="secondary">
                        {referral.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Declined */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm">
                  <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
                  Declined ({referralsByStatus.declined.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {referralsByStatus.declined.map((referral) => (
                  <Card key={referral.id} className="p-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedReferral(referral)}>
                    <div className="space-y-2">
                      <div className="font-medium text-sm">{referral.basicResidentInfo.name}</div>
                      <div className="text-xs text-gray-500">{referral.referrerOrg}</div>
                      <Badge className={getStatusBadgeColor(referral.status)} variant="secondary">
                        {referral.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Referral Details */}
          {selectedReferral && (
            <Card>
              <CardHeader>
                <CardTitle>Referral Details</CardTitle>
                <CardDescription>
                  Review and update referral status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">Referred Person</Label>
                    <div className="mt-1 space-y-1">
                      <div>{selectedReferral.basicResidentInfo.name}</div>
                      <div className="text-sm text-gray-600">{selectedReferral.basicResidentInfo.email}</div>
                      <div className="text-sm text-gray-600">{selectedReferral.basicResidentInfo.phone}</div>
                      <div className="text-sm text-gray-600">Zip: {selectedReferral.basicResidentInfo.zip}</div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="font-semibold">Referrer Information</Label>
                    <div className="mt-1 space-y-1">
                      <div>{selectedReferral.referrerName}</div>
                      <div className="text-sm text-gray-600">{selectedReferral.referrerOrg}</div>
                      <div className="text-sm text-gray-600">{selectedReferral.referrerEmail}</div>
                      <div className="text-sm text-gray-600">{selectedReferral.referrerPhone}</div>
                    </div>
                  </div>
                </div>
                
                {selectedReferral.notes && (
                  <div>
                    <Label className="font-semibold">Notes</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      {selectedReferral.notes}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-4">
                  <Label className="font-semibold">Update Status:</Label>
                  <Select 
                    value={selectedReferral.status} 
                    onValueChange={(value) => handleStatusUpdate(selectedReferral.id, value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="waitlist">Waitlist</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="beds" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bed className="w-5 h-5 mr-2" />
                Bed Assignment
              </CardTitle>
              <CardDescription>
                Manage property occupancy and assign beds to residents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties?.map((property) => (
                  <Card key={property.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{property.address}</CardTitle>
                      <CardDescription className="text-xs">
                        {property.city}, {property.state}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Bedrooms:</span>
                          <span>{property.bedrooms}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total Beds:</span>
                          <span>{property.bedsTotal}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Available:</span>
                          <span className={property.bedsAvailable > 0 ? 'text-green-600' : 'text-red-600'}>
                            {property.bedsAvailable}
                          </span>
                        </div>
                        <Button size="sm" className="w-full mt-2" disabled={property.bedsAvailable === 0}>
                          Assign Bed
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Onboarding Checklist
              </CardTitle>
              <CardDescription>
                Track onboarding progress for new residents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Select a resident to view their onboarding checklist
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}