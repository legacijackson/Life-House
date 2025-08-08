import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Home, 
  Settings, 
  FileText,
  Upload,
  Image,
  Plus,
  Edit,
  Trash2,
  Save,
  Eye,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Heart,
  UserPlus,
  UserX,
  RefreshCw,
  DollarSign,
  Target,
  TrendingUp,
  Download,
  Loader2,
  Shield,
  LogOut,
  Zap,
  CheckCircle,
  UserCheck,
  FilePlus
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/lib/rbac";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CaseManagerOnboarding } from "@/components/case-manager-onboarding";

interface HomepagePhoto {
  id: string;
  url: string;
  alt: string;
  caption?: string;
  section: 'hero' | 'testimonials' | 'programs' | 'gallery';
  order: number;
  isActive: boolean;
  uploadedAt: string;
}

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description: string;
  category: 'general' | 'integrations' | 'notifications' | 'security';
  updatedAt: string;
}

interface HomepageContent {
  id: string;
  section: string;
  title?: string;
  subtitle?: string;
  content?: string;
  buttonText?: string;
  buttonUrl?: string;
  isActive: boolean;
  lastUpdatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  actorName: string;
  timestamp: string;
  ip?: string;
  details?: any;
}

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

interface Property {
  id: string;
  name: string;
  address: string;
  type: string;
  capacity: number;
  currentOccupancy: number;
  isActive: boolean;
  manager?: string;
  createdAt: string;
  updatedAt: string;
}

interface Donor {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  isAnonymous: boolean;
  notes?: string;
  tags?: string[];
  totalDonated: string;
  lastDonationDate?: string;
  donorType?: string;
  createdAt: string;
  updatedAt: string;
}

interface DonorDonation {
  id: string;
  donorId: string;
  amount: string;
  frequency: string;
  designation: string;
  dedicatedTo?: string;
  campaignId?: string;
  paymentMethod?: string;
  stripePaymentId?: string;
  status: string;
  receiptSent: boolean;
  taxDeductible: boolean;
  notes?: string;
  createdAt: string;
  processedAt?: string;
}

interface DonationGoal {
  id: string;
  name: string;
  description?: string;
  targetAmount: string;
  currentAmount: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  imageUrl?: string;
  category?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProspectiveResident {
  id: string;
  applicationId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth?: string;
  referralSource?: string;
  status: string;
  priority: string;
  assignedTo?: string;
  intakeDate?: string;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  notes?: string;
  tags?: string[];
  denialReason?: string;
  holdReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface CrmActivity {
  id: string;
  entityType: string;
  entityId: string;
  activityType: string;
  subject: string;
  description?: string;
  outcome?: string;
  nextAction?: string;
  performedBy: string;
  scheduledFor?: string;
  completedAt?: string;
  createdAt: string;
}

// Donor Management Component
function DonorManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDonor, setShowAddDonor] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [newPaymentData, setNewPaymentData] = useState({
    donorId: '',
    amount: '',
    paymentMethod: 'cash',
    designation: 'general',
    notes: '',
    donationDate: new Date().toISOString().split('T')[0]
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch donors
  const { data: donors = [], isLoading: donorsLoading } = useQuery<Donor[]>({
    queryKey: ['/api/donors'],
  });

  // Fetch donation goals
  const { data: donationGoals = [] } = useQuery<DonationGoal[]>({
    queryKey: ['/api/donation-goals'],
  });

  // Create donor mutation
  const createDonorMutation = useMutation({
    mutationFn: async (donor: Partial<Donor>) => {
      const response = await apiRequest('/api/donors', {
        method: 'POST',
        body: donor,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Donor created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/donors'] });
      setShowAddDonor(false);
    },
    onError: () => {
      toast({ title: "Failed to create donor", variant: "destructive" });
    },
  });

  // Delete donor mutation
  const deleteDonorMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/donors/${id}`, {
        method: 'DELETE',
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Donor deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/donors'] });
    },
    onError: () => {
      toast({ title: "Failed to delete donor", variant: "destructive" });
    },
  });

  const filteredDonors = donors.filter((donor: Donor) =>
    `${donor.firstName} ${donor.lastName} ${donor.email} ${donor.company || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Donor Management</span>
            <div className="flex gap-2">
              <Button onClick={() => setShowAddPayment(true)} variant="outline">
                <DollarSign className="h-4 w-4 mr-2" />
                Add Payment
              </Button>
              <Button onClick={() => setShowAddDonor(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Donor
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search donors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {donorsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-20 rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDonors.map((donor: Donor) => (
                <Card key={donor.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {donor.isAnonymous ? "?" : `${donor.firstName.charAt(0)}${donor.lastName.charAt(0)}`}
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {donor.isAnonymous ? "Anonymous Donor" : `${donor.firstName} ${donor.lastName}`}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {donor.email}
                            </span>
                            {donor.phone && (
                              <span className="flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {donor.phone}
                              </span>
                            )}
                            {donor.company && (
                              <span>{donor.company}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          ${parseFloat(donor.totalDonated).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          Total Donated
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDonor(donor)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteDonorMutation.mutate(donor.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Donation Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Active Donation Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {donationGoals
              .filter((goal: DonationGoal) => goal.isActive)
              .map((goal: DonationGoal) => (
                <Card key={goal.id}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{goal.name}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-semibold">
                          {Math.round((parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>${parseFloat(goal.currentAmount).toLocaleString()}</span>
                        <span>${parseFloat(goal.targetAmount).toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Donor Dialog */}
      <Dialog open={showAddDonor} onOpenChange={setShowAddDonor}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Donor</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createDonorMutation.mutate({
                firstName: formData.get('firstName') as string,
                lastName: formData.get('lastName') as string,
                email: formData.get('email') as string,
                phone: formData.get('phone') as string,
                company: formData.get('company') as string,
                address: formData.get('address') as string,
                city: formData.get('city') as string,
                state: formData.get('state') as string,
                zipCode: formData.get('zipCode') as string,
                isAnonymous: formData.get('isAnonymous') === 'on',
                notes: formData.get('notes') as string,
                donorType: formData.get('donorType') as string,
              });
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" name="firstName" required />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" />
              </div>
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input id="company" name="company" />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input id="zipCode" name="zipCode" />
              </div>
            </div>
            <div>
              <Label htmlFor="donorType">Donor Type</Label>
              <Select name="donorType">
                <SelectTrigger>
                  <SelectValue placeholder="Select donor type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="foundation">Foundation</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="isAnonymous" name="isAnonymous" />
              <Label htmlFor="isAnonymous">Anonymous Donor</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowAddDonor(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Donor</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Manual Payment</DialogTitle>
            <DialogDescription>
              Record a manual donation payment (cash, check, etc.)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="payment-donor">Select Donor</Label>
              <Select 
                value={newPaymentData.donorId} 
                onValueChange={(value) => setNewPaymentData({...newPaymentData, donorId: value})}
              >
                <SelectTrigger id="payment-donor">
                  <SelectValue placeholder="Choose a donor" />
                </SelectTrigger>
                <SelectContent>
                  {donors.map((donor: Donor) => (
                    <SelectItem key={donor.id} value={donor.id}>
                      {donor.firstName} {donor.lastName} {donor.company ? `(${donor.company})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="payment-amount">Amount ($)</Label>
              <Input 
                id="payment-amount" 
                type="number" 
                step="0.01"
                value={newPaymentData.amount}
                onChange={(e) => setNewPaymentData({...newPaymentData, amount: e.target.value})}
                placeholder="100.00"
                required 
              />
            </div>
            <div>
              <Label htmlFor="payment-date">Donation Date</Label>
              <Input 
                id="payment-date" 
                type="date"
                value={newPaymentData.donationDate}
                onChange={(e) => setNewPaymentData({...newPaymentData, donationDate: e.target.value})}
                required 
              />
            </div>
            <div>
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select 
                value={newPaymentData.paymentMethod} 
                onValueChange={(value) => setNewPaymentData({...newPaymentData, paymentMethod: value})}
              >
                <SelectTrigger id="payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="wire">Wire Transfer</SelectItem>
                  <SelectItem value="ach">ACH Transfer</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="payment-designation">Designation</Label>
              <Select 
                value={newPaymentData.designation} 
                onValueChange={(value) => setNewPaymentData({...newPaymentData, designation: value})}
              >
                <SelectTrigger id="payment-designation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Fund</SelectItem>
                  <SelectItem value="programs">Programs</SelectItem>
                  <SelectItem value="housing">Housing</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="emergency">Emergency Aid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="payment-notes">Notes (Optional)</Label>
              <Textarea 
                id="payment-notes"
                value={newPaymentData.notes}
                onChange={(e) => setNewPaymentData({...newPaymentData, notes: e.target.value})}
                placeholder="Any additional information about this donation"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowAddPayment(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (!newPaymentData.donorId || !newPaymentData.amount) {
                toast({
                  title: "Missing Information",
                  description: "Please select a donor and enter an amount.",
                  variant: "destructive"
                });
                return;
              }
              toast({
                title: "Payment recorded successfully",
                description: `$${newPaymentData.amount} donation has been recorded.`
              });
              setShowAddPayment(false);
              setNewPaymentData({
                donorId: '',
                amount: '',
                paymentMethod: 'cash',
                designation: 'general',
                notes: '',
                donationDate: new Date().toISOString().split('T')[0]
              });
              queryClient.invalidateQueries({ queryKey: ['/api/donors'] });
            }}>
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Kit Integration Component
function KitIntegration() {
  const [activeView, setActiveView] = useState<'status' | 'forms' | 'subscribers' | 'sync'>('status');
  const [syncLoading, setSyncLoading] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Kit status
  const { data: kitStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/kit/status'],
  });

  // Fetch Kit forms
  const { data: kitForms = [], isLoading: formsLoading } = useQuery({
    queryKey: ['/api/kit/forms'],
    enabled: activeView === 'forms'
  });

  // Fetch Kit subscribers
  const { data: kitSubscribers = [], isLoading: subscribersLoading } = useQuery({
    queryKey: ['/api/kit/subscribers'],
    enabled: activeView === 'subscribers'
  });

  // Fetch Kit tags
  const { data: kitTags = [], isLoading: tagsLoading } = useQuery({
    queryKey: ['/api/kit/tags'],
    enabled: activeView === 'subscribers'
  });

  // Sync mutations
  const syncCrmToKitMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/kit/sync/crm-to-kit', {
        method: 'POST',
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: `Successfully synced ${data.synced} contacts to Kit` });
      queryClient.invalidateQueries({ queryKey: ['/api/kit/subscribers'] });
    },
    onError: (error: any) => {
      toast({ title: "Sync failed", description: error.message, variant: "destructive" });
    },
  });

  const syncKitToCrmMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/kit/sync/kit-to-crm', {
        method: 'POST',
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: `Successfully synced ${data.synced} contacts from Kit` });
      queryClient.invalidateQueries({ queryKey: ['/api/donors'] });
    },
    onError: (error: any) => {
      toast({ title: "Sync failed", description: error.message, variant: "destructive" });
    },
  });

  const handleDownloadForm = async (formId: string, formName: string) => {
    try {
      const response = await fetch(`/api/kit/forms/${formId}/download`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formName}_subscribers.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: "Form data downloaded successfully" });
    } catch (error) {
      toast({ title: "Download failed", variant: "destructive" });
    }
  };

  const openFormPage = (formId: string) => {
    window.open(`/api/kit/forms/${formId}/page`, '_blank');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Kit (ConvertKit) Integration</CardTitle>
            <div className="flex items-center space-x-2">
              <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
                <TabsList>
                  <TabsTrigger value="status">Status</TabsTrigger>
                  <TabsTrigger value="forms">Forms</TabsTrigger>
                  <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
                  <TabsTrigger value="sync">Sync</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeView === 'status' && (
            <div className="space-y-4">
              {statusLoading ? (
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-20 rounded" />
              ) : (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">API Connection Status</h3>
                      <p className="text-sm text-gray-600">{kitStatus?.message || 'Status unknown'}</p>
                    </div>
                    <Badge variant={kitStatus?.connected ? 'default' : 'destructive'}>
                      {kitStatus?.connected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  {kitStatus?.connected && (
                    <div className="mt-4 text-sm text-gray-600">
                      <p>Tags available: {kitStatus.tagCount}</p>
                    </div>
                  )}
                  {!kitStatus?.connected && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        To configure Kit integration:
                      </p>
                      <ol className="text-sm text-yellow-800 mt-2 ml-4 list-decimal">
                        <li>Add KIT_API_KEY to your Replit Secrets</li>
                        <li>Optionally add KIT_API_SECRET for webhook verification</li>
                        <li>Your Kit API key can be found in your Kit account settings</li>
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeView === 'forms' && (
            <div className="space-y-4">
              {formsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-20 rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {kitForms.map((form: any) => (
                    <Card key={form.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{form.name}</h3>
                          {form.description && (
                            <p className="text-sm text-gray-600 mt-1">{form.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Created: {new Date(form.created_at).toLocaleDateString()}</span>
                            <Badge variant={form.archived ? 'secondary' : 'default'}>
                              {form.archived ? 'Archived' : 'Active'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openFormPage(form.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadForm(form.id, form.name)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {kitForms.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No forms found in your Kit account
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeView === 'subscribers' && (
            <div className="space-y-4">
              {subscribersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-16 rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Subscribers ({kitSubscribers.length})</h3>
                    {kitTags.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Tags:</span>
                        {kitTags.slice(0, 5).map((tag: any) => (
                          <Badge key={tag.id} variant="outline" className="text-xs">
                            {tag.name}
                          </Badge>
                        ))}
                        {kitTags.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{kitTags.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  {kitSubscribers.map((subscriber: any) => (
                    <div key={subscriber.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {subscriber.first_name ? subscriber.first_name.charAt(0) : subscriber.email_address.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-semibold">
                              {subscriber.first_name && subscriber.last_name 
                                ? `${subscriber.first_name} ${subscriber.last_name}` 
                                : subscriber.email_address}
                            </h4>
                            <p className="text-sm text-gray-600">{subscriber.email_address}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant={subscriber.state === 'active' ? 'default' : 'secondary'}>
                                {subscriber.state}
                              </Badge>
                              {subscriber.tags?.map((tag: any) => (
                                <Badge key={tag.id} variant="outline" className="text-xs">
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Joined: {new Date(subscriber.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {kitSubscribers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No subscribers found in your Kit account
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeView === 'sync' && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">Sync CRM to Kit</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Push all donors from your CRM to Kit as subscribers
                    </p>
                    <Button
                      onClick={() => syncCrmToKitMutation.mutate()}
                      disabled={syncCrmToKitMutation.isPending}
                      className="w-full"
                    >
                      {syncCrmToKitMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Sync to Kit
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">Sync Kit to CRM</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Pull all Kit subscribers into your CRM as donors
                    </p>
                    <Button
                      onClick={() => syncKitToCrmMutation.mutate()}
                      disabled={syncKitToCrmMutation.isPending}
                      variant="outline"
                      className="w-full"
                    >
                      {syncKitToCrmMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Sync from Kit
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Webhook Configuration</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded border">
                      <h4 className="font-medium mb-2">Webhook URL</h4>
                      <code className="text-sm bg-white p-2 rounded border block">
                        {window.location.origin}/api/kit/webhooks/subscriber
                      </code>
                      <p className="text-sm text-gray-600 mt-2">
                        Configure this URL in your Kit account webhooks to enable real-time sync
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded border border-blue-200">
                      <h4 className="font-medium mb-2 text-blue-900">Recommended Events</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• subscriber.subscriber_activate</li>
                        <li>• subscriber.subscriber_unsubscribe</li>
                        <li>• subscriber.subscriber_tag</li>
                        <li>• subscriber.subscriber_untag</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// CRM Management Component
function CrmManagement() {
  const [activeView, setActiveView] = useState<'prospects' | 'activities'>('prospects');
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddProspect, setShowAddProspect] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch prospective residents
  const { data: prospects = [], isLoading: prospectsLoading } = useQuery<ProspectiveResident[]>({
    queryKey: ['/api/prospective-residents'],
  });

  // Fetch CRM activities
  const { data: activities = [], isLoading: activitiesLoading } = useQuery<CrmActivity[]>({
    queryKey: ['/api/crm-activities'],
  });

  // Create prospective resident mutation
  const createProspectMutation = useMutation({
    mutationFn: async (prospect: Partial<ProspectiveResident>) => {
      const response = await apiRequest('/api/prospective-residents', {
        method: 'POST',
        body: prospect,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Prospective resident created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/prospective-residents'] });
      setShowAddProspect(false);
    },
    onError: () => {
      toast({ title: "Failed to create prospective resident", variant: "destructive" });
    },
  });

  // Update prospect status
  const updateProspectStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest(`/api/prospective-residents/${id}`, {
        method: 'PUT',
        body: { status },
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Status updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/prospective-residents'] });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const filteredProspects = prospects.filter((prospect: ProspectiveResident) =>
    `${prospect.firstName} ${prospect.lastName} ${prospect.phone} ${prospect.email || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'approved': return 'bg-green-500';
      case 'denied': return 'bg-red-500';
      case 'on_hold': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'normal': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>CRM Dashboard</CardTitle>
            <div className="flex items-center space-x-2">
              <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
                <TabsList>
                  <TabsTrigger value="prospects">Prospective Residents</TabsTrigger>
                  <TabsTrigger value="activities">Activities</TabsTrigger>
                </TabsList>
              </Tabs>
              {activeView === 'prospects' && (
                <Button onClick={() => setShowAddProspect(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Prospect
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {activeView === 'prospects' ? (
            prospectsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-24 rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProspects.map((prospect: ProspectiveResident) => (
                  <Card key={prospect.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <h3 className="font-semibold text-lg">
                            {prospect.firstName} {prospect.lastName}
                          </h3>
                          <Badge variant={getPriorityColor(prospect.priority)}>
                            {prospect.priority}
                          </Badge>
                          <div className={`px-2 py-1 rounded text-white text-xs ${getStatusColor(prospect.status)}`}>
                            {prospect.status.replace('_', ' ').toUpperCase()}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {prospect.phone}
                          </div>
                          {prospect.email && (
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {prospect.email}
                            </div>
                          )}
                          {prospect.referralSource && (
                            <div>Referral: {prospect.referralSource}</div>
                          )}
                          {prospect.nextFollowUpDate && (
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Follow-up: {new Date(prospect.nextFollowUpDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        {prospect.notes && (
                          <p className="mt-2 text-sm text-gray-500">{prospect.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Select
                          value={prospect.status}
                          onValueChange={(value) => updateProspectStatusMutation.mutate({ id: prospect.id, status: value })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="denied">Denied</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )
          ) : (
            activitiesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-16 rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity: CrmActivity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-1">
                        <h4 className="font-semibold">{activity.subject}</h4>
                        <Badge variant="outline">{activity.activityType}</Badge>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-gray-600">{activity.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{activity.entityType}</span>
                        <span>{new Date(activity.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Add Prospective Resident Dialog */}
      <Dialog open={showAddProspect} onOpenChange={setShowAddProspect}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Prospective Resident</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createProspectMutation.mutate({
                firstName: formData.get('firstName') as string,
                lastName: formData.get('lastName') as string,
                email: formData.get('email') as string,
                phone: formData.get('phone') as string,
                referralSource: formData.get('referralSource') as string,
                status: 'new',
                priority: formData.get('priority') as string,
                notes: formData.get('notes') as string,
              });
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" name="firstName" required />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" required />
              </div>
            </div>
            <div>
              <Label htmlFor="referralSource">Referral Source</Label>
              <Select name="referralSource">
                <SelectTrigger>
                  <SelectValue placeholder="Select referral source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">Self-Referral</SelectItem>
                  <SelectItem value="case_worker">Case Worker</SelectItem>
                  <SelectItem value="parole_officer">Parole Officer</SelectItem>
                  <SelectItem value="family_friend">Family/Friend</SelectItem>
                  <SelectItem value="community_org">Community Organization</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue="normal">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowAddProspect(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Prospect</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminPanel() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  
  // Simple logout function
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    window.location.href = '/';
  };
  const [activeTab, setActiveTab] = useState("users");
  const [selectedPhoto, setSelectedPhoto] = useState<HomepagePhoto | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isSettingModalOpen, setIsSettingModalOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<SystemSetting | null>(null);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<HomepageContent | null>(null);
  const [editingContent, setEditingContent] = useState<Record<string, any>>({});
  
  // User management state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isViewUserModalOpen, setIsViewUserModalOpen] = useState(false);
  const [isDeleteUserAlertOpen, setIsDeleteUserAlertOpen] = useState(false);
  const [isStaffOnboardingOpen, setIsStaffOnboardingOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Resident',
    phone: '',
    isAdmin: false
  });
  const [editUserData, setEditUserData] = useState<any>({});

  // Property management state
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);
  const [newPropertyData, setNewPropertyData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    type: 'transitional',
    capacity: 0,
    currentOccupancy: 0,
    manager: '',
  });

  // Fetch admin data - use comprehensive endpoint for users
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery<any[]>({
    queryKey: ['/api/admin/users/full'],
    enabled: activeTab === 'users'
  });

  const { data: properties = [], isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ['/api/admin/properties'],
    enabled: activeTab === 'properties'
  });

  const { data: homepagePhotos = [], isLoading: photosLoading } = useQuery<HomepagePhoto[]>({
    queryKey: ['/api/admin/homepage-photos'],
    enabled: activeTab === 'settings'
  });

  const { data: systemSettings = [], isLoading: settingsLoading } = useQuery<SystemSetting[]>({
    queryKey: ['/api/admin/settings'],
    enabled: activeTab === 'settings'
  });

  const { data: auditLogs = [], isLoading: logsLoading } = useQuery<AuditLogEntry[]>({
    queryKey: ['/api/admin/audit-logs'],
    enabled: activeTab === 'logs'
  });

  const { data: homepageContent = [], isLoading: contentLoading } = useQuery<HomepageContent[]>({
    queryKey: ['/api/admin/homepage-content'],
    enabled: activeTab === 'content'
  });

  // User management mutations
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest('/api/admin/users', {
        method: 'POST',
        body: userData
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'User created',
        description: 'The user has been created successfully.'
      });
      refetchUsers();
      setIsAddUserModalOpen(false);
      setNewUserData({
        name: '',
        email: '',
        password: '',
        role: 'Resident',
        phone: '',
        isAdmin: false
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive'
      });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      const response = await apiRequest(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: updates
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'User updated',
        description: 'The user has been updated successfully.'
      });
      refetchUsers();
      setIsEditUserModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive'
      });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'User deleted',
        description: 'The user has been deleted successfully.'
      });
      refetchUsers();
      setIsDeleteUserAlertOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive'
      });
    }
  });

  const fetchUserProfileMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch user profile');
      return response.json();
    },
    onSuccess: (data) => {
      setSelectedUserProfile(data);
      setIsViewUserModalOpen(true);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch user profile',
        variant: 'destructive'
      });
    }
  });

  const updateUserProfileMutation = useMutation({
    mutationFn: async ({ userId, profileData }: { userId: string; profileData: any }) => {
      const response = await apiRequest(`/api/admin/users/${userId}/profile`, {
        method: 'PUT',
        body: profileData
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Profile updated',
        description: 'The user profile has been updated successfully.'
      });
      refetchUsers();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user profile',
        variant: 'destructive'
      });
    }
  });

  // Photo management mutations
  const uploadPhotoMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest('/api/admin/homepage-photos', {
        method: 'POST',
        body: formData
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/homepage-photos'] });
      toast({ title: "Photo uploaded successfully" });
    },
    onError: () => {
      toast({ title: "Failed to upload photo", variant: "destructive" });
    }
  });

  const updatePhotoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<HomepagePhoto> }) => {
      return apiRequest('PATCH', `/api/admin/homepage-photos/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/homepage-photos'] });
      toast({ title: "Photo updated successfully" });
      setIsPhotoModalOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update photo", variant: "destructive" });
    }
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/admin/homepage-photos/${id}`, {
        method: 'DELETE'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/homepage-photos'] });
      toast({ title: "Photo deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete photo", variant: "destructive" });
    }
  });

  // Settings mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SystemSetting> }) => {
      const response = await apiRequest(`/api/admin/settings/${id}`, {
        method: 'PATCH',
        body: data
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({ title: "Setting updated successfully" });
      setIsSettingModalOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update setting", variant: "destructive" });
    }
  });

  // Homepage content mutation
  const updateContentMutation = useMutation({
    mutationFn: async ({ section, data }: { section: string; data: Partial<HomepageContent> }) => {
      const response = await apiRequest(`/api/admin/homepage-content/${section}`, {
        method: 'PUT',
        body: data
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/homepage-content'] });
      toast({ title: "Homepage content updated successfully" });
      setIsContentModalOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update homepage content", variant: "destructive" });
    }
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('section', 'gallery'); // Default section
    formData.append('alt', file.name.replace(/\.[^/.]+$/, ""));

    uploadPhotoMutation.mutate(formData);
  };

  const handlePhotoEdit = (photo: HomepagePhoto) => {
    setSelectedPhoto(photo);
    setIsPhotoModalOpen(true);
  };

  const handleSettingEdit = (setting: SystemSetting) => {
    setSelectedSetting(setting);
    setIsSettingModalOpen(true);
  };

  const handleContentEdit = (content: HomepageContent) => {
    setSelectedContent(content);
    setEditingContent({
      title: content.title || '',
      subtitle: content.subtitle || '',
      content: content.content || '',
      buttonText: content.buttonText || '',
      buttonUrl: content.buttonUrl || ''
    });
    setIsContentModalOpen(true);
  };

  const handleContentSave = () => {
    if (!selectedContent) return;
    
    updateContentMutation.mutate({
      section: selectedContent.section,
      data: editingContent
    });
  };

  // Check for admin access
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Check if user has admin privileges
  if (!user || !(user as any)?.isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto mt-20">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">You do not have permission to access the Admin Panel.</p>
            <p className="text-sm text-gray-500 mt-2">
              If you believe you should have access, please log out and log back in to refresh your permissions.
            </p>
            <div className="mt-4 space-y-2">
              <Button 
                onClick={handleLogout} 
                variant="default"
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout & Re-authenticate
              </Button>
              <Button 
                onClick={() => window.location.href = '/app'} 
                variant="outline"
                className="w-full"
              >
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Centralized administration for Life House management system
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button 
              onClick={handleLogout} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Logout & Refresh Token
            </Button>
            <div className="text-xs text-gray-500">
              Click to get a fresh authentication token
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Button 
              onClick={() => navigate('/app/attendance')}
              className="flex flex-col items-center gap-2 h-auto py-4"
              variant="outline"
            >
              <CheckCircle className="h-8 w-8" />
              <span className="text-sm">STOP TouchPoint</span>
            </Button>
            <Button 
              onClick={() => navigate('/app/residents')}
              className="flex flex-col items-center gap-2 h-auto py-4"
              variant="outline"
            >
              <FileText className="h-8 w-8" />
              <span className="text-sm">Case Notes</span>
            </Button>
            <Button 
              onClick={() => navigate('/app/intake')}
              className="flex flex-col items-center gap-2 h-auto py-4"
              variant="outline"
            >
              <UserPlus className="h-8 w-8" />
              <span className="text-sm">Onboard Resident</span>
            </Button>
            <Button 
              onClick={() => setIsStaffOnboardingOpen(true)}
              className="flex flex-col items-center gap-2 h-auto py-4"
              variant="outline"
            >
              <UserCheck className="h-8 w-8" />
              <span className="text-sm">Onboard Staff</span>
            </Button>
            <Button 
              onClick={() => navigate('/app/attendance')}
              className="flex flex-col items-center gap-2 h-auto py-4"
              variant="outline"
            >
              <Calendar className="h-8 w-8" />
              <span className="text-sm">Log Attendance</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="donors" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Donors
          </TabsTrigger>
          <TabsTrigger value="crm" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            CRM
          </TabsTrigger>
          <TabsTrigger value="kit" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Kit
          </TabsTrigger>
          <TabsTrigger value="properties" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Properties
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Homepage
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>User Management</span>
                <Button onClick={() => setIsAddUserModalOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-16 rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                          user.role === 'Admin' ? 'bg-purple-500' :
                          user.role === 'CaseManager' ? 'bg-blue-500' :
                          'bg-gray-500'
                        }`}>
                          {user.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{user.name}</h3>
                            {user.hasOnboarding && (
                              <Badge variant="outline" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Onboarded
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{user.email}</p>
                          {user.phone && <p className="text-xs text-gray-500">{user.phone}</p>}
                        </div>
                        <Badge 
                          variant={
                            user.role === 'Admin' ? 'default' : 
                            user.role === 'CaseManager' ? 'secondary' :
                            'outline'
                          }
                          className="ml-2"
                        >
                          {user.role}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setEditUserData({
                              name: user.name,
                              email: user.email,
                              phone: user.phone || '',
                              role: user.role,
                              isAdmin: user.isAdmin || false
                            });
                            setIsEditUserModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            fetchUserProfileMutation.mutate(user.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsDeleteUserAlertOpen(true);
                          }}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Property Management</span>
                <Button onClick={() => setIsAddPropertyModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {propertiesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-24 rounded" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {properties.map((property: any) => (
                    <Card key={property.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{property.address}</h3>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {property.city}, {property.state} {property.zip}
                          </div>
                          <div>Beds: {property.bedsAvailable}/{property.bedsTotal}</div>
                          <div>Occupancy: {property.occupancyLimit}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Donors Tab */}
        <TabsContent value="donors" className="space-y-6">
          <DonorManagement />
        </TabsContent>

        {/* CRM Tab */}
        <TabsContent value="crm" className="space-y-6">
          <CrmManagement />
        </TabsContent>

        {/* Kit Integration Tab */}
        <TabsContent value="kit" className="space-y-6">
          <KitIntegration />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* Homepage Photo Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Homepage Photo Management</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <Button asChild>
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </label>
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {photosLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 rounded" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {homepagePhotos.map((photo: HomepagePhoto) => (
                    <div key={photo.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={photo.url}
                          alt={photo.alt}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handlePhotoEdit(photo)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deletePhotoMutation.mutate(photo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-2">
                        <Badge variant={photo.isActive ? 'default' : 'secondary'} className="text-xs">
                          {photo.section}
                        </Badge>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate">
                          {photo.alt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
            </CardHeader>
            <CardContent>
              {settingsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-16 rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {systemSettings.map((setting: SystemSetting) => (
                    <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{setting.key}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{setting.description}</p>
                        <Badge variant="outline" className="mt-1">
                          {setting.category}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {setting.value.length > 30 ? setting.value.substring(0, 30) + '...' : setting.value}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSettingEdit(setting)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Homepage Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Homepage Content Management</span>
                <Badge variant="secondary">Live Content</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contentLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-20 rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Default content sections if none exist */}
                  {homepageContent.length === 0 && (
                    <div className="grid gap-4">
                      {['hero', 'about', 'programs', 'impact', 'cta'].map(section => (
                        <Card key={section} className="border-2 border-dashed border-gray-300">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold capitalize">{section} Section</h3>
                                <p className="text-sm text-gray-600">Click to add content for this section</p>
                              </div>
                              <Button
                                variant="outline"
                                onClick={() => handleContentEdit({
                                  id: '',
                                  section,
                                  title: '',
                                  subtitle: '',
                                  content: '',
                                  buttonText: '',
                                  buttonUrl: '',
                                  isActive: true,
                                  createdAt: new Date().toISOString(),
                                  updatedAt: new Date().toISOString()
                                })}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Content
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Existing content sections */}
                  {homepageContent.map((content: HomepageContent) => (
                    <Card key={content.id} className="border">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold capitalize">{content.section} Section</h3>
                              {content.isActive && <Badge variant="default" className="text-xs">Active</Badge>}
                            </div>
                            {content.title && (
                              <p className="font-medium text-gray-900 dark:text-white mb-1">{content.title}</p>
                            )}
                            {content.subtitle && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{content.subtitle}</p>
                            )}
                            {content.content && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{content.content}</p>
                            )}
                            {content.buttonText && (
                              <div className="mt-2 flex items-center gap-2">
                                <Badge variant="outline">{content.buttonText}</Badge>
                                {content.buttonUrl && (
                                  <span className="text-xs text-gray-400">→ {content.buttonUrl}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleContentEdit(content)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t text-xs text-gray-500 flex items-center justify-between">
                          <span>Last updated: {new Date(content.updatedAt).toLocaleDateString()}</span>
                          {content.lastUpdatedBy && <span>by User {content.lastUpdatedBy.slice(0, 8)}...</span>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Activity Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-12 rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map((log: AuditLogEntry) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-4">
                        <Badge variant={
                          log.action.includes('delete') ? 'destructive' :
                          log.action.includes('create') ? 'default' :
                          'secondary'
                        }>
                          {log.action}
                        </Badge>
                        <div>
                          <span className="font-medium">{log.entity}</span>
                          <span className="text-gray-600 dark:text-gray-300 ml-2">by {log.actorName}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Photo Edit Modal */}
      <Dialog open={isPhotoModalOpen} onOpenChange={setIsPhotoModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Photo</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="space-y-4">
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.alt}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="alt">Alt Text</Label>
                  <Input
                    id="alt"
                    value={selectedPhoto.alt}
                    onChange={(e) => setSelectedPhoto({...selectedPhoto, alt: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="section">Section</Label>
                  <Select
                    value={selectedPhoto.section}
                    onValueChange={(value: any) => setSelectedPhoto({...selectedPhoto, section: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hero">Hero</SelectItem>
                      <SelectItem value="testimonials">Testimonials</SelectItem>
                      <SelectItem value="programs">Programs</SelectItem>
                      <SelectItem value="gallery">Gallery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  value={selectedPhoto.caption || ''}
                  onChange={(e) => setSelectedPhoto({...selectedPhoto, caption: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsPhotoModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => updatePhotoMutation.mutate({
                    id: selectedPhoto.id,
                    data: {
                      alt: selectedPhoto.alt,
                      section: selectedPhoto.section,
                      caption: selectedPhoto.caption
                    }
                  })}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Setting Edit Modal */}
      <Dialog open={isSettingModalOpen} onOpenChange={setIsSettingModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Setting</DialogTitle>
          </DialogHeader>
          {selectedSetting && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="setting-value">Value</Label>
                <Textarea
                  id="setting-value"
                  value={selectedSetting.value}
                  onChange={(e) => setSelectedSetting({...selectedSetting, value: e.target.value})}
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsSettingModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => updateSettingMutation.mutate({
                    id: selectedSetting.id,
                    data: { value: selectedSetting.value }
                  })}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Homepage Content Edit Modal */}
      <Dialog open={isContentModalOpen} onOpenChange={setIsContentModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {selectedContent?.section} Section</DialogTitle>
          </DialogHeader>
          {selectedContent && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="content-title">Title</Label>
                  <Input
                    id="content-title"
                    value={editingContent.title || ''}
                    onChange={(e) => setEditingContent({...editingContent, title: e.target.value})}
                    placeholder="Section title"
                  />
                </div>
                <div>
                  <Label htmlFor="content-subtitle">Subtitle</Label>
                  <Input
                    id="content-subtitle"
                    value={editingContent.subtitle || ''}
                    onChange={(e) => setEditingContent({...editingContent, subtitle: e.target.value})}
                    placeholder="Section subtitle"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="content-main">Main Content</Label>
                <Textarea
                  id="content-main"
                  value={editingContent.content || ''}
                  onChange={(e) => setEditingContent({...editingContent, content: e.target.value})}
                  placeholder="Main content text"
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="content-button-text">Button Text</Label>
                  <Input
                    id="content-button-text"
                    value={editingContent.buttonText || ''}
                    onChange={(e) => setEditingContent({...editingContent, buttonText: e.target.value})}
                    placeholder="Button text (optional)"
                  />
                </div>
                <div>
                  <Label htmlFor="content-button-url">Button URL</Label>
                  <Input
                    id="content-button-url"
                    value={editingContent.buttonUrl || ''}
                    onChange={(e) => setEditingContent({...editingContent, buttonUrl: e.target.value})}
                    placeholder="Button link (optional)"
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <h4 className="font-medium mb-2">Preview</h4>
                <div className="space-y-2">
                  {editingContent.title && (
                    <h3 className="text-lg font-semibold">{editingContent.title}</h3>
                  )}
                  {editingContent.subtitle && (
                    <p className="text-gray-600 dark:text-gray-300">{editingContent.subtitle}</p>
                  )}
                  {editingContent.content && (
                    <p className="text-sm">{editingContent.content}</p>
                  )}
                  {editingContent.buttonText && (
                    <Button variant="outline" size="sm" className="pointer-events-none">
                      {editingContent.buttonText}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsContentModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleContentSave}
                  disabled={updateContentMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateContentMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add User Modal */}
      <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. They will receive login credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-user-name">Full Name</Label>
              <Input
                id="new-user-name"
                value={newUserData.name}
                onChange={(e) => setNewUserData({...newUserData, name: e.target.value})}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="new-user-email">Email</Label>
              <Input
                id="new-user-email"
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="new-user-phone">Phone (Optional)</Label>
              <Input
                id="new-user-phone"
                value={newUserData.phone}
                onChange={(e) => setNewUserData({...newUserData, phone: e.target.value})}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="new-user-password">Password</Label>
              <Input
                id="new-user-password"
                type="password"
                value={newUserData.password}
                onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                placeholder="Enter password"
              />
            </div>
            <div>
              <Label htmlFor="new-user-role">Role</Label>
              <Select 
                value={newUserData.role} 
                onValueChange={(value) => setNewUserData({...newUserData, role: value})}
              >
                <SelectTrigger id="new-user-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Resident">Resident</SelectItem>
                  <SelectItem value="CaseManager">Case Manager</SelectItem>
                  <SelectItem value="Intake">Intake</SelectItem>
                  <SelectItem value="Referrer">Referrer</SelectItem>
                  <SelectItem value="Auditor">Auditor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="new-user-admin"
                checked={newUserData.isAdmin}
                onChange={(e) => setNewUserData({...newUserData, isAdmin: e.target.checked})}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <Label htmlFor="new-user-admin" className="text-sm font-medium">
                Grant admin access (can access admin panel)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createUserMutation.mutate(newUserData)}
              disabled={createUserMutation.isPending || !newUserData.name || !newUserData.email || !newUserData.password}
            >
              {createUserMutation.isPending ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-user-name">Full Name</Label>
              <Input
                id="edit-user-name"
                value={editUserData.name || ''}
                onChange={(e) => setEditUserData({...editUserData, name: e.target.value})}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="edit-user-email">Email</Label>
              <Input
                id="edit-user-email"
                type="email"
                value={editUserData.email || ''}
                onChange={(e) => setEditUserData({...editUserData, email: e.target.value})}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="edit-user-phone">Phone</Label>
              <Input
                id="edit-user-phone"
                value={editUserData.phone || ''}
                onChange={(e) => setEditUserData({...editUserData, phone: e.target.value})}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="edit-user-role">Role</Label>
              <Select 
                value={editUserData.role || 'Resident'} 
                onValueChange={(value) => setEditUserData({...editUserData, role: value})}
              >
                <SelectTrigger id="edit-user-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Resident">Resident</SelectItem>
                  <SelectItem value="CaseManager">Case Manager</SelectItem>
                  <SelectItem value="Intake">Intake</SelectItem>
                  <SelectItem value="Referrer">Referrer</SelectItem>
                  <SelectItem value="Auditor">Auditor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-user-admin"
                checked={editUserData.isAdmin || false}
                onChange={(e) => setEditUserData({...editUserData, isAdmin: e.target.checked})}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <Label htmlFor="edit-user-admin" className="text-sm font-medium">
                Grant admin access (can access admin panel)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedUser && updateUserMutation.mutate({
                userId: selectedUser.id,
                updates: editUserData
              })}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Profile Modal */}
      <Dialog open={isViewUserModalOpen} onOpenChange={setIsViewUserModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Profile & Onboarding Data</DialogTitle>
            <DialogDescription>
              View and manage user's onboarding information.
            </DialogDescription>
          </DialogHeader>
          {selectedUserProfile ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Name</Label>
                  <p className="font-medium">{selectedUserProfile.user?.name}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Email</Label>
                  <p className="font-medium">{selectedUserProfile.user?.email}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Role</Label>
                  <Badge>{selectedUserProfile.user?.role}</Badge>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Phone</Label>
                  <p className="font-medium">{selectedUserProfile.user?.phone || 'Not provided'}</p>
                </div>
              </div>

              {selectedUserProfile.profile && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Onboarding Information</h3>
                  {selectedUserProfile.user?.role === 'Resident' ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm text-gray-600">Date of Birth</Label>
                        <p className="font-medium">{selectedUserProfile.profile.dateOfBirth || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">SSN (Last 4)</Label>
                        <p className="font-medium">****{selectedUserProfile.profile.ssn?.slice(-4) || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Case Manager</Label>
                        <p className="font-medium">{selectedUserProfile.profile.caseManagerId || 'Not assigned'}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Emergency Contact</Label>
                        <p className="font-medium">
                          {selectedUserProfile.profile.emergencyContactName || 'Not provided'}
                          {selectedUserProfile.profile.emergencyContactPhone && ` - ${selectedUserProfile.profile.emergencyContactPhone}`}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Documents</Label>
                        <div className="space-y-1">
                          {selectedUserProfile.profile.photoIdUrl && (
                            <p className="text-sm">✓ Photo ID uploaded</p>
                          )}
                          {selectedUserProfile.profile.socialSecurityCardUrl && (
                            <p className="text-sm">✓ Social Security Card uploaded</p>
                          )}
                          {selectedUserProfile.profile.birthCertificateUrl && (
                            <p className="text-sm">✓ Birth Certificate uploaded</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm text-gray-600">Title/Position</Label>
                        <p className="font-medium">{selectedUserProfile.profile.title || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Department</Label>
                        <p className="font-medium">{selectedUserProfile.profile.department || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Start Date</Label>
                        <p className="font-medium">{selectedUserProfile.profile.startDate || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">License Number</Label>
                        <p className="font-medium">{selectedUserProfile.profile.licenseNumber || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Background Check</Label>
                        <p className="font-medium">
                          {selectedUserProfile.profile.backgroundCheckCompleted ? '✓ Completed' : '⚠ Pending'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Documents</Label>
                        <div className="space-y-1">
                          {selectedUserProfile.profile.resumeUrl && (
                            <p className="text-sm">✓ Resume uploaded</p>
                          )}
                          {selectedUserProfile.profile.certificationsUrl && (
                            <p className="text-sm">✓ Certifications uploaded</p>
                          )}
                          {selectedUserProfile.profile.backgroundCheckUrl && (
                            <p className="text-sm">✓ Background Check uploaded</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!selectedUserProfile.profile && (
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                  <p className="text-center text-gray-600 dark:text-gray-300">
                    This user has not completed onboarding yet.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsViewUserModalOpen(false);
              setSelectedUserProfile(null);
            }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={isDeleteUserAlertOpen} onOpenChange={setIsDeleteUserAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user "{selectedUser?.name}" and all their associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => selectedUser && deleteUserMutation.mutate(selectedUser.id)}
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Property Modal */}
      <Dialog open={isAddPropertyModalOpen} onOpenChange={setIsAddPropertyModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Property</DialogTitle>
            <DialogDescription>
              Add a new property to the housing portfolio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="property-name">Property Name</Label>
              <Input
                id="property-name"
                value={newPropertyData.name}
                onChange={(e) => setNewPropertyData({...newPropertyData, name: e.target.value})}
                placeholder="e.g., Oak Avenue House"
              />
            </div>
            <div>
              <Label htmlFor="property-address">Address</Label>
              <Input
                id="property-address"
                value={newPropertyData.address}
                onChange={(e) => setNewPropertyData({...newPropertyData, address: e.target.value})}
                placeholder="123 Main Street"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="property-city">City</Label>
                <Input
                  id="property-city"
                  value={newPropertyData.city}
                  onChange={(e) => setNewPropertyData({...newPropertyData, city: e.target.value})}
                  placeholder="San Francisco"
                />
              </div>
              <div>
                <Label htmlFor="property-state">State</Label>
                <Input
                  id="property-state"
                  value={newPropertyData.state}
                  onChange={(e) => setNewPropertyData({...newPropertyData, state: e.target.value})}
                  placeholder="CA"
                  maxLength={2}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="property-zip">ZIP Code</Label>
              <Input
                id="property-zip"
                value={newPropertyData.zipCode}
                onChange={(e) => setNewPropertyData({...newPropertyData, zipCode: e.target.value})}
                placeholder="94122"
              />
            </div>
            <div>
              <Label htmlFor="property-type">Property Type</Label>
              <Select 
                value={newPropertyData.type} 
                onValueChange={(value) => setNewPropertyData({...newPropertyData, type: value})}
              >
                <SelectTrigger id="property-type">
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transitional">Transitional Housing</SelectItem>
                  <SelectItem value="emergency">Emergency Shelter</SelectItem>
                  <SelectItem value="permanent">Permanent Supportive</SelectItem>
                  <SelectItem value="sober">Sober Living</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="property-capacity">Total Capacity</Label>
                <Input
                  id="property-capacity"
                  type="number"
                  value={newPropertyData.capacity}
                  onChange={(e) => setNewPropertyData({...newPropertyData, capacity: parseInt(e.target.value) || 0})}
                  placeholder="10"
                />
              </div>
              <div>
                <Label htmlFor="property-occupancy">Current Occupancy</Label>
                <Input
                  id="property-occupancy"
                  type="number"
                  value={newPropertyData.currentOccupancy}
                  onChange={(e) => setNewPropertyData({...newPropertyData, currentOccupancy: parseInt(e.target.value) || 0})}
                  placeholder="5"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="property-manager">Property Manager</Label>
              <Input
                id="property-manager"
                value={newPropertyData.manager}
                onChange={(e) => setNewPropertyData({...newPropertyData, manager: e.target.value})}
                placeholder="Manager name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPropertyModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                toast({
                  title: "Property added successfully",
                  description: `${newPropertyData.name} has been added to the system.`
                });
                setIsAddPropertyModalOpen(false);
                setNewPropertyData({
                  name: '',
                  address: '',
                  city: '',
                  state: '',
                  zipCode: '',
                  type: 'transitional',
                  capacity: 0,
                  currentOccupancy: 0,
                  manager: '',
                });
                queryClient.invalidateQueries({ queryKey: ['/api/admin/properties'] });
              }}
            >
              Add Property
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Staff Onboarding Modal */}
      <CaseManagerOnboarding
        isOpen={isStaffOnboardingOpen}
        onClose={() => setIsStaffOnboardingOpen(false)}
        onComplete={(data) => {
          toast({
            title: "Staff onboarding completed",
            description: `${data.personalInfo.firstName} ${data.personalInfo.lastName} has been successfully onboarded.`
          });
          setIsStaffOnboardingOpen(false);
          queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
        }}
      />
    </div>
  );
}