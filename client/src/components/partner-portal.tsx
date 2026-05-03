import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  FileText, 
  Building2, 
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { useLocation } from "wouter";

export function PartnerPortal() {
  const [, setLocation] = useLocation();
  
  // Fetch partner organization data
  const { data: partnerData } = useQuery<any>({
    queryKey: ["/api/partner/profile"],
  });

  // Fetch referrals submitted by this partner
  const { data: referrals = [] } = useQuery<any[]>({
    queryKey: ["/api/partner/referrals"],
  });

  const stats = {
    totalReferrals: referrals?.length || 0,
    pendingReferrals: referrals?.filter((r: any) => r.status === "new" || r.status === "in_review").length || 0,
    acceptedReferrals: referrals?.filter((r: any) => r.status === "accepted").length || 0,
    declinedReferrals: referrals?.filter((r: any) => r.status === "declined").length || 0,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <Clock className="h-4 w-4" />;
      case "in_review":
        return <AlertCircle className="h-4 w-4" />;
      case "accepted":
        return <CheckCircle className="h-4 w-4" />;
      case "declined":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "secondary";
      case "in_review":
        return "default";
      case "accepted":
        return "secondary";
      case "declined":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Partner Portal</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {partnerData?.organizationName || "Partner Organization"}
              </p>
            </div>
            <Button onClick={() => setLocation("/refer")} className="bg-green-600 hover:bg-green-700">
              <Send className="mr-2 h-4 w-4" />
              New Referral
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReferrals}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingReferrals}</div>
              <p className="text-xs text-muted-foreground">Awaiting decision</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.acceptedReferrals}</div>
              <p className="text-xs text-muted-foreground">Successfully placed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Declined</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.declinedReferrals}</div>
              <p className="text-xs text-muted-foreground">Not eligible</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="referrals" className="space-y-4">
          <TabsList>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="organization">Organization Info</TabsTrigger>
          </TabsList>

          <TabsContent value="referrals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Referrals</CardTitle>
                <CardDescription>
                  Track the status of all referrals submitted by your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {referrals && referrals.length > 0 ? (
                    referrals.map((referral: any) => (
                      <div
                        key={referral.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <Users className="h-8 w-8 text-gray-400" />
                          <div>
                            <p className="font-medium">{referral.basicResidentInfo?.name || "Unknown"}</p>
                            <p className="text-sm text-gray-600">
                              Referred on {new Date(referral.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getStatusColor(referral.status)}>
                            {getStatusIcon(referral.status)}
                            <span className="ml-1">{referral.status}</span>
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No referrals yet</p>
                      <p className="text-sm mt-2">Submit your first referral to get started</p>
                      <Button 
                        onClick={() => setLocation("/refer")} 
                        className="mt-4 bg-green-600 hover:bg-green-700"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Submit Referral
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="organization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Organization Information</CardTitle>
                <CardDescription>
                  Manage your organization's profile and contact information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Organization Name</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {partnerData?.organizationName || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Organization Type</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {partnerData?.organizationType || "Community Based Organization"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Primary Contact</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {partnerData?.contactName || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Contact Email</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {partnerData?.contactEmail || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Contact Phone</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {partnerData?.contactPhone || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Partnership Since</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {partnerData?.createdAt 
                          ? new Date(partnerData.createdAt).toLocaleDateString()
                          : "Not specified"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button variant="outline">
                      Edit Organization Info
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}