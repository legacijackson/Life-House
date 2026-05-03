import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

import { 
  Building, 
  Users, 
  FileText, 
  UserCheck,
  Filter,
  Search,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Download
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";

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
  updatedAt: string;
}

const updateReferralSchema = z.object({
  status: z.enum(['new', 'in_review', 'accepted', 'waitlist', 'declined']),
  notes: z.string().optional(),
});

type UpdateReferralData = z.infer<typeof updateReferralSchema>;

export default function Referrals() {
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Fetch referrals
  const { data: referrals = [], isLoading } = useQuery<Referral[]>({
    queryKey: ["/api/admin/referrals", statusFilter],
    queryFn: () => {
      const url = statusFilter && statusFilter !== 'all'
        ? `/api/admin/referrals?status=${statusFilter}`
        : '/api/admin/referrals';
      return apiRequest('GET', url).then((r) => r.json());
    },
  });

  const form = useForm<UpdateReferralData>({
    resolver: zodResolver(updateReferralSchema),
    defaultValues: {
      status: 'new',
      notes: '',
    },
  });

  // Update referral mutation
  const updateReferralMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateReferralData }) => {
      const response = await apiRequest("PATCH", `/api/admin/referrals/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/referrals"] });
      toast({
        title: "Success",
        description: "Referral updated successfully",
      });
      setIsUpdateModalOpen(false);
      setSelectedReferral(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update referral",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateReferralData) => {
    if (selectedReferral) {
      updateReferralMutation.mutate({ id: selectedReferral.id, data });
    }
  };

  // Generate PDF for referral
  const generateReferralPDF = (referral: Referral) => {
    // Create a printable HTML content with Life House branding
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Referral Form - ${referral.basicResidentInfo.name}</title>
        <style>
          @page { size: letter; margin: 1in; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #6B46C1; }
          .logo { font-size: 28px; font-weight: bold; color: #6B46C1; }
          .title { font-size: 20px; color: #666; }
          .section { margin-bottom: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px; }
          .section-title { font-size: 16px; font-weight: 600; color: #6B46C1; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
          .field { margin-bottom: 12px; display: flex; }
          .label { font-weight: 600; min-width: 140px; color: #555; }
          .value { flex: 1; color: #333; }
          .status { display: inline-block; padding: 5px 12px; border-radius: 20px; font-weight: 600; text-transform: uppercase; font-size: 12px; }
          .status-new { background: #dbeafe; color: #1e40af; }
          .status-in_review { background: #fef3c7; color: #92400e; }
          .status-accepted { background: #d1fae5; color: #065f46; }
          .status-waitlist { background: #e9d5ff; color: #6b21a8; }
          .status-declined { background: #fee2e2; color: #991b1b; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #666; font-size: 12px; }
          .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 120px; color: rgba(107, 70, 193, 0.05); font-weight: bold; z-index: -1; }
        </style>
      </head>
      <body>
        <div class="watermark">LIFE HOUSE</div>
        <div class="header">
          <div>
            <div class="logo">LIFE HOUSE</div>
            <div class="title">Transitional Housing Referral Form</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; color: #666;">Generated: ${new Date().toLocaleDateString()}</div>
            <div style="font-size: 12px; color: #666;">Referral ID: ${referral.id.slice(0, 8)}</div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Status</div>
          <div class="field">
            <span class="status status-${referral.status}">${referral.status.replace('_', ' ')}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Resident Information</div>
          <div class="field"><span class="label">Name:</span><span class="value">${referral.basicResidentInfo.name}</span></div>
          <div class="field"><span class="label">Email:</span><span class="value">${referral.basicResidentInfo.email}</span></div>
          <div class="field"><span class="label">Phone:</span><span class="value">${referral.basicResidentInfo.phone}</span></div>
          <div class="field"><span class="label">ZIP Code:</span><span class="value">${referral.basicResidentInfo.zip}</span></div>
          <div class="field"><span class="label">Ready Date:</span><span class="value">${new Date(referral.basicResidentInfo.earliestReadyDate).toLocaleDateString()}</span></div>
        </div>

        <div class="section">
          <div class="section-title">Referrer Information</div>
          <div class="field"><span class="label">Organization:</span><span class="value">${referral.referrerOrg}</span></div>
          <div class="field"><span class="label">Contact Name:</span><span class="value">${referral.referrerName}</span></div>
          <div class="field"><span class="label">Email:</span><span class="value">${referral.referrerEmail}</span></div>
          <div class="field"><span class="label">Phone:</span><span class="value">${referral.referrerPhone}</span></div>
          <div class="field"><span class="label">Referral Source:</span><span class="value">${referral.source}</span></div>
        </div>

        <div class="section">
          <div class="section-title">Additional Notes</div>
          <div style="padding: 10px; background: white; border-radius: 4px; min-height: 100px;">
            ${referral.notes || 'No additional notes provided.'}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Administrative Information</div>
          <div class="field"><span class="label">Submitted Date:</span><span class="value">${new Date(referral.createdAt).toLocaleString()}</span></div>
          <div class="field"><span class="label">Last Updated:</span><span class="value">${new Date(referral.updatedAt).toLocaleString()}</span></div>
        </div>

        <div class="footer">
          <p><strong>Life House Reentry Inc.</strong></p>
          <p>Transforming Lives Through Transitional Housing</p>
          <p>This is a confidential document. Please handle with care.</p>
        </div>
      </body>
      </html>
    `;

    // Create a new window and print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load then trigger print
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

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

  const filteredReferrals = referrals.filter(referral => {
    const matchesStatus = statusFilter === "all" || referral.status === statusFilter;
    const matchesSearch = searchTerm === "" || 
      referral.basicResidentInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.referrerOrg.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.referrerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: referrals.length,
    new: referrals.filter(r => r.status === 'new').length,
    inReview: referrals.filter(r => r.status === 'in_review').length,
    accepted: referrals.filter(r => r.status === 'accepted').length,
    waitlist: referrals.filter(r => r.status === 'waitlist').length,
  };

  const handleViewReferral = (referral: Referral) => {
    setSelectedReferral(referral);
    form.setValue('status', referral.status);
    form.setValue('notes', '');
    setIsUpdateModalOpen(true);
  };

  return (
    <div className="flex-1 overflow-hidden">
      
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Referrals Management</h1>
                <p className="text-sm text-gray-600">Review and process housing referrals from community partners</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Total Referrals</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">New</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">In Review</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.inReview}</p>
                  </div>
                  <Search className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Accepted</p>
                    <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
                  </div>
                  <UserCheck className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Waitlist</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.waitlist}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by name or organization..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
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

          {/* Referrals Table */}
          <Card>
            <CardHeader>
              <CardTitle>Referrals List</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading referrals...</div>
              ) : filteredReferrals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No referrals found matching your criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Candidate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Referrer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredReferrals.map((referral) => (
                        <tr key={referral.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {referral.basicResidentInfo.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                <MapPin className="inline w-3 h-3 mr-1" />
                                {referral.basicResidentInfo.zip}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm text-gray-900">{referral.referrerName}</div>
                              <div className="text-sm text-gray-500">
                                <Building className="inline w-3 h-3 mr-1" />
                                {referral.referrerOrg}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <div className="flex items-center text-gray-900">
                                <Mail className="w-3 h-3 mr-1" />
                                {referral.referrerEmail}
                              </div>
                              <div className="flex items-center text-gray-500">
                                <Phone className="w-3 h-3 mr-1" />
                                {referral.referrerPhone}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getStatusBadgeColor(referral.status)}>
                              {referral.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(referral.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewReferral(referral)}
                              >
                                Review
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => generateReferralPDF(referral)}
                                title="Download PDF"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Update Referral Modal */}
        {selectedReferral && (
          <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Review Referral</DialogTitle>
                <DialogDescription>
                  Update the status and add notes for this referral.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mb-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Candidate Information</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm"><strong>Name:</strong> {selectedReferral.basicResidentInfo.name}</p>
                    <p className="text-sm"><strong>Email:</strong> {selectedReferral.basicResidentInfo.email}</p>
                    <p className="text-sm"><strong>Phone:</strong> {selectedReferral.basicResidentInfo.phone}</p>
                    <p className="text-sm"><strong>Ready Date:</strong> {new Date(selectedReferral.basicResidentInfo.earliestReadyDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700">Referrer Information</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm"><strong>Organization:</strong> {selectedReferral.referrerOrg}</p>
                    <p className="text-sm"><strong>Contact:</strong> {selectedReferral.referrerName}</p>
                  </div>
                </div>

                {selectedReferral.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Initial Notes</h4>
                    <p className="text-sm mt-1 text-gray-600">{selectedReferral.notes}</p>
                  </div>
                )}
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="in_review">In Review</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="waitlist">Waitlist</SelectItem>
                            <SelectItem value="declined">Declined</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Review Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any notes about this referral..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsUpdateModalOpen(false);
                        setSelectedReferral(null);
                      }}
                      disabled={updateReferralMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateReferralMutation.isPending}
                    >
                      {updateReferralMutation.isPending ? "Updating..." : "Update Referral"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}