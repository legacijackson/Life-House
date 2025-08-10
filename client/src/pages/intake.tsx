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
    queryKey: ['/api/admin/referrals'],
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/applications'],
  });

  const { data: properties } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
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

  const referralsByStatus = {
    new: referrals?.filter(r => r.status === 'new') || [],
    in_review: referrals?.filter(r => r.status === 'in_review') || [],
    accepted: referrals?.filter(r => r.status === 'accepted') || [],
    waitlist: referrals?.filter(r => r.status === 'waitlist') || [],
    declined: referrals?.filter(r => r.status === 'declined') || [],
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Intake & Referrals</h1>
                <p className="text-sm text-gray-600">Manage referrals and resident onboarding</p>
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
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-green-600" />
                    Housing Applications ({applications?.length || 0})
                  </CardTitle>
                  <CardDescription>Direct applications submitted via the website</CardDescription>
                </CardHeader>
                <CardContent>
                  {applicationsLoading ? (
                    <div className="text-center py-4">Loading applications...</div>
                  ) : applications?.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No applications found</div>
                  ) : (
                    <div className="space-y-3">
                      {applications?.map((app: any) => (
                        <Card key={app.id} className="p-4 hover:bg-gray-50">
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
                            <Badge className={getStatusBadgeColor(app.status)} variant="secondary">
                              {app.status}
                            </Badge>
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
                    <div className="text-center py-4 text-gray-500">Referral management coming soon</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="in_progress" className="space-y-6">
              <div className="text-center py-8 text-gray-500">
                In Progress functionality coming soon
              </div>
            </TabsContent>

            <TabsContent value="closed" className="space-y-6">
              <div className="text-center py-8 text-gray-500">
                Closed referrals functionality coming soon
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}