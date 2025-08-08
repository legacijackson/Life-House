import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  User, 
  FileText, 
  Upload, 
  Home, 
  BookOpen, 
  Shield, 
  Archive, 
  AlertTriangle, 
  LogOut,
  Layout
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface OnboardingData {
  // Step 1: Pre-Screen
  isEligible: boolean;
  isVeteran: boolean;
  hasDisability: boolean;
  eligibilityNotes?: string;
  
  // Step 2: Full Intake
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    phone: string;
    email: string;
    ssn: string;
    emergencyContact: string;
    emergencyPhone: string;
    caseManagerId: string;
  };
  demographics: {
    race: string;
    ethnicity: string;
    gender: string;
    preferredPronouns: string;
  };
  justiceInfo: {
    releaseDate: string;
    justiceStatus: 'pre_trial' | 'parole' | 'probation' | 'completed_sentence' | 'other';
    paroleProbationOfficer?: string;
    paroleProbationPhone?: string;
    courtDate?: string;
  };
  needsAssessment: {
    housingHistory: string;
    employmentStatus: string;
    educationLevel: string;
    hasChildren: boolean;
    childrenDetails?: string;
    medicalNeeds: string;
    mentalHealthNeeds: string;
    substanceUseHistory: string;
    employmentGoals: string;
    educationGoals: string;
    literacyLevel: 'basic' | 'intermediate' | 'advanced';
  };
  
  // Step 3: Document Upload
  documents: {
    id: File | null;
    dd214: File | null;
    benefitsLetters: File | null;
    medicalRecords: File | null;
    courtDocuments: File | null;
    other: File[];
  };
  
  // Step 4: Lease & Property Assignment
  propertyAssignment: {
    propertyId: string;
    roomId: string;
    rentAmount: number;
    moveInDate: string;
    leaseTermMonths: number;
  };
  
  // Step 5-10: Completion flags
  houseRulesCompleted: boolean;
  safetyWalkCompleted: boolean;
  resourceMenuCompleted: boolean;
  warningsReviewCompleted: boolean;
  offboardingPathCompleted: boolean;
  welcomeDashboardCompleted: boolean;
}

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const STEPS = [
  { id: 1, title: "Pre-Screen", icon: CheckCircle, description: "Eligibility & veteran/disability flags" },
  { id: 2, title: "Full Intake", icon: User, description: "Demographics, needs, literacy assessment" },
  { id: 3, title: "Documents", icon: Upload, description: "ID, DD-214, benefits letters, etc." },
  { id: 4, title: "Property", icon: Home, description: "Lease & property assignment" },
  { id: 5, title: "House Rules", icon: BookOpen, description: "Program policies & agreements" },
  { id: 6, title: "Safety Walk", icon: Shield, description: "Safety walkthrough & checklist" },
  { id: 7, title: "Resources", icon: Archive, description: "Resource & service menu" },
  { id: 8, title: "Warnings", icon: AlertTriangle, description: "Warnings, dismissal & grievance" },
  { id: 9, title: "Off-boarding", icon: LogOut, description: "Off-boarding path overview" },
  { id: 10, title: "Dashboard", icon: Layout, description: "Welcome dashboard setup" }
];

export function OnboardingWizard({ isOpen, onClose, onComplete }: OnboardingWizardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Fetch case managers
  const { data: caseManagers = [] } = useQuery({
    queryKey: ['/api/staff/users', { role: 'CaseManager' }],
    queryFn: async () => {
      const response = await fetch('/api/staff/users?role=CaseManager');
      if (!response.ok) throw new Error('Failed to fetch case managers');
      return response.json();
    }
  });
  const [data, setData] = useState<OnboardingData>({
    isEligible: false,
    isVeteran: false,
    hasDisability: false,
    personalInfo: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      phone: '',
      email: '',
      ssn: '',
      emergencyContact: '',
      emergencyPhone: '',
      caseManagerId: ''
    },
    demographics: {
      race: '',
      ethnicity: '',
      gender: '',
      preferredPronouns: ''
    },
    justiceInfo: {
      releaseDate: '',
      justiceStatus: 'parole'
    },
    needsAssessment: {
      housingHistory: '',
      employmentStatus: '',
      educationLevel: '',
      hasChildren: false,
      medicalNeeds: '',
      mentalHealthNeeds: '',
      substanceUseHistory: '',
      employmentGoals: '',
      educationGoals: '',
      literacyLevel: 'basic'
    },
    documents: {
      id: null,
      dd214: null,
      benefitsLetters: null,
      medicalRecords: null,
      courtDocuments: null,
      other: []
    },
    propertyAssignment: {
      propertyId: '',
      roomId: '',
      rentAmount: 0,
      moveInDate: '',
      leaseTermMonths: 12
    },
    houseRulesCompleted: false,
    safetyWalkCompleted: false,
    resourceMenuCompleted: false,
    warningsReviewCompleted: false,
    offboardingPathCompleted: false,
    welcomeDashboardCompleted: false
  });

  // Submit onboarding data
  const submitOnboardingMutation = useMutation({
    mutationFn: async (onboardingData: OnboardingData) => {
      const formData = new FormData();
      
      // Add all non-file data
      const { documents, ...otherData } = onboardingData;
      formData.append('data', JSON.stringify(otherData));
      
      // Add files
      if (documents.id) formData.append('id', documents.id);
      if (documents.dd214) formData.append('dd214', documents.dd214);
      if (documents.benefitsLetters) formData.append('benefitsLetters', documents.benefitsLetters);
      if (documents.medicalRecords) formData.append('medicalRecords', documents.medicalRecords);
      if (documents.courtDocuments) formData.append('courtDocuments', documents.courtDocuments);
      documents.other.forEach((file, index) => {
        formData.append(`other_${index}`, file);
      });

      return await apiRequest('/api/admin/onboard-resident', {
        method: 'POST',
        body: formData
      });
    },
    onSuccess: (result) => {
      toast({
        title: "Resident Onboarded Successfully",
        description: `New resident has been successfully onboarded.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/staff/residents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/staff/dashboard'] });
      onComplete();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Onboarding Failed",
        description: "There was an error processing the onboarding. Please try again.",
        variant: "destructive"
      });
      console.error('Onboarding error:', error);
    }
  });

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    submitOnboardingMutation.mutate(data);
  };

  const updateData = (section: keyof OnboardingData, updates: any) => {
    setData(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object' && prev[section] !== null
        ? { ...prev[section], ...updates }
        : updates
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold">Pre-Screen Assessment</h3>
              <p className="text-gray-600">Quick eligibility check and special considerations</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="eligible"
                  checked={data.isEligible}
                  onCheckedChange={(checked) => updateData('isEligible', checked)}
                />
                <Label htmlFor="eligible">Eligible for transitional housing program</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="veteran"
                  checked={data.isVeteran}
                  onCheckedChange={(checked) => updateData('isVeteran', checked)}
                />
                <Label htmlFor="veteran">Military veteran</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="disability"
                  checked={data.hasDisability}
                  onCheckedChange={(checked) => updateData('hasDisability', checked)}
                />
                <Label htmlFor="disability">Has disability requiring accommodation</Label>
              </div>
              
              <div>
                <Label htmlFor="notes">Eligibility Notes</Label>
                <Textarea
                  id="notes"
                  value={data.eligibilityNotes || ''}
                  onChange={(e) => updateData('eligibilityNotes', e.target.value)}
                  placeholder="Any additional notes about eligibility or special considerations..."
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <User className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold">Full Intake Assessment</h3>
              <p className="text-gray-600">Complete personal and needs assessment</p>
            </div>
            
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={data.personalInfo.firstName}
                      onChange={(e) => updateData('personalInfo', { firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={data.personalInfo.lastName}
                      onChange={(e) => updateData('personalInfo', { lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={data.personalInfo.dateOfBirth}
                      onChange={(e) => updateData('personalInfo', { dateOfBirth: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={data.personalInfo.phone}
                      onChange={(e) => updateData('personalInfo', { phone: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={data.personalInfo.email}
                    onChange={(e) => updateData('personalInfo', { email: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="caseManager">Assigned Case Manager *</Label>
                  <Select
                    value={data.personalInfo.caseManagerId}
                    onValueChange={(value) => updateData('personalInfo', { caseManagerId: value })}
                  >
                    <SelectTrigger id="caseManager">
                      <SelectValue placeholder="Select a case manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {caseManagers.map((manager: any) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyContact">Emergency Contact *</Label>
                    <Input
                      id="emergencyContact"
                      value={data.personalInfo.emergencyContact}
                      onChange={(e) => updateData('personalInfo', { emergencyContact: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyPhone">Emergency Phone *</Label>
                    <Input
                      id="emergencyPhone"
                      value={data.personalInfo.emergencyPhone}
                      onChange={(e) => updateData('personalInfo', { emergencyPhone: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Justice System Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Justice System Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="releaseDate">Release Date *</Label>
                    <Input
                      id="releaseDate"
                      type="date"
                      value={data.justiceInfo.releaseDate}
                      onChange={(e) => updateData('justiceInfo', { releaseDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="justiceStatus">Current Status *</Label>
                    <Select
                      value={data.justiceInfo.justiceStatus}
                      onValueChange={(value) => updateData('justiceInfo', { justiceStatus: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pre_trial">Pre-trial</SelectItem>
                        <SelectItem value="parole">Parole</SelectItem>
                        <SelectItem value="probation">Probation</SelectItem>
                        <SelectItem value="completed_sentence">Completed Sentence</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Needs Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Needs Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="employmentStatus">Current Employment Status</Label>
                  <Input
                    id="employmentStatus"
                    value={data.needsAssessment.employmentStatus}
                    onChange={(e) => updateData('needsAssessment', { employmentStatus: e.target.value })}
                    placeholder="e.g., Unemployed, Part-time, Looking for work"
                  />
                </div>
                
                <div>
                  <Label htmlFor="employmentGoals">Employment Goals</Label>
                  <Textarea
                    id="employmentGoals"
                    value={data.needsAssessment.employmentGoals}
                    onChange={(e) => updateData('needsAssessment', { employmentGoals: e.target.value })}
                    placeholder="What are your employment goals?"
                  />
                </div>
                
                <div>
                  <Label htmlFor="medicalNeeds">Medical Needs</Label>
                  <Textarea
                    id="medicalNeeds"
                    value={data.needsAssessment.medicalNeeds}
                    onChange={(e) => updateData('needsAssessment', { medicalNeeds: e.target.value })}
                    placeholder="Any medical conditions, medications, or healthcare needs"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hasChildren"
                    checked={data.needsAssessment.hasChildren}
                    onCheckedChange={(checked) => updateData('needsAssessment', { hasChildren: checked })}
                  />
                  <Label htmlFor="hasChildren">Has children</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Upload className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <h3 className="text-lg font-semibold">Document Upload</h3>
              <p className="text-gray-600">Upload required and supporting documents</p>
            </div>
            
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Required Documents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="id-upload">Government-issued ID *</Label>
                    <Input
                      id="id-upload"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) updateData('documents', { id: file });
                      }}
                    />
                  </div>
                  
                  {data.isVeteran && (
                    <div>
                      <Label htmlFor="dd214-upload">DD-214 (Military Discharge)</Label>
                      <Input
                        id="dd214-upload"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) updateData('documents', { dd214: file });
                        }}
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="benefits-upload">Benefits Letters (SSI, SSDI, etc.)</Label>
                    <Input
                      id="benefits-upload"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) updateData('documents', { benefitsLetters: file });
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Home className="w-12 h-12 mx-auto mb-4 text-indigo-600" />
              <h3 className="text-lg font-semibold">Property Assignment</h3>
              <p className="text-gray-600">Assign property and set lease terms</p>
            </div>
            
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <Label htmlFor="propertyId">Property *</Label>
                  <Select
                    value={data.propertyAssignment.propertyId}
                    onValueChange={(value) => updateData('propertyAssignment', { propertyId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="life-house-main">Life House Main Campus</SelectItem>
                      <SelectItem value="life-house-annex">Life House Annex</SelectItem>
                      <SelectItem value="transitional-unit-a">Transitional Unit A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rentAmount">Monthly Rent</Label>
                    <Input
                      id="rentAmount"
                      type="number"
                      value={data.propertyAssignment.rentAmount}
                      onChange={(e) => updateData('propertyAssignment', { rentAmount: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="moveInDate">Move-in Date</Label>
                    <Input
                      id="moveInDate"
                      type="date"
                      value={data.propertyAssignment.moveInDate}
                      onChange={(e) => updateData('propertyAssignment', { moveInDate: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold">House Rules & Program Policies</h3>
              <p className="text-gray-600">Review and acknowledge program rules</p>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Key House Rules:</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>• Curfew: 10 PM on weeknights, 12 AM on weekends</li>
                      <li>• No alcohol or drugs on premises</li>
                      <li>• Maintain common areas</li>
                      <li>• Attend required meetings and programs</li>
                      <li>• Respect for all residents and staff</li>
                    </ul>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="houseRules"
                      checked={data.houseRulesCompleted}
                      onCheckedChange={(checked) => updateData('houseRulesCompleted', checked)}
                    />
                    <Label htmlFor="houseRules">I have reviewed and agree to follow all house rules and program policies</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Shield className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold">Safety Walkthrough</h3>
              <p className="text-gray-600">Complete safety orientation and checklist</p>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium mb-2">Safety Checklist Completed:</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>✓ Fire safety and evacuation procedures</li>
                      <li>✓ Emergency contact information</li>
                      <li>✓ Building security procedures</li>
                      <li>✓ First aid kit locations</li>
                      <li>✓ Incident reporting procedures</li>
                    </ul>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="safetyWalk"
                      checked={data.safetyWalkCompleted}
                      onCheckedChange={(checked) => updateData('safetyWalkCompleted', checked)}
                    />
                    <Label htmlFor="safetyWalk">Safety walkthrough and orientation completed</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Archive className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <h3 className="text-lg font-semibold">Resource & Service Menu</h3>
              <p className="text-gray-600">Introduction to available resources and services</p>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium mb-2">Available Resources:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                      <div>• Employment assistance</div>
                      <div>• Mental health counseling</div>
                      <div>• Medical care coordination</div>
                      <div>• Legal aid services</div>
                      <div>• Financial literacy classes</div>
                      <div>• Substance abuse support</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="resourceMenu"
                      checked={data.resourceMenuCompleted}
                      onCheckedChange={(checked) => updateData('resourceMenuCompleted', checked)}
                    />
                    <Label htmlFor="resourceMenu">Resource orientation completed</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-orange-600" />
              <h3 className="text-lg font-semibold">Warnings, Dismissal & Grievance</h3>
              <p className="text-gray-600">Understanding consequences and appeal processes</p>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-medium mb-2">Important Information:</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>• Warning system: Verbal → Written → Final Warning</li>
                      <li>• Grievance process for disputes</li>
                      <li>• Appeal procedures</li>
                      <li>• Termination policies</li>
                      <li>• Readmission criteria</li>
                    </ul>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="warningsReview"
                      checked={data.warningsReviewCompleted}
                      onCheckedChange={(checked) => updateData('warningsReviewCompleted', checked)}
                    />
                    <Label htmlFor="warningsReview">Warnings and grievance procedures reviewed</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <LogOut className="w-12 h-12 mx-auto mb-4 text-red-600" />
              <h3 className="text-lg font-semibold">Off-boarding Path</h3>
              <p className="text-gray-600">Understanding graduation and transition planning</p>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-medium mb-2">Transition Planning:</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>• Program completion requirements</li>
                      <li>• Housing transition assistance</li>
                      <li>• Employment placement support</li>
                      <li>• Ongoing case management</li>
                      <li>• Alumni network access</li>
                    </ul>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="offboardingPath"
                      checked={data.offboardingPathCompleted}
                      onCheckedChange={(checked) => updateData('offboardingPathCompleted', checked)}
                    />
                    <Label htmlFor="offboardingPath">Off-boarding and transition planning reviewed</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 10:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Layout className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold">Welcome Dashboard Setup</h3>
              <p className="text-gray-600">Complete onboarding and setup resident portal</p>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium mb-2">Onboarding Summary:</h4>
                    <div className="space-y-2 text-sm">
                      <div>Resident: {data.personalInfo.firstName} {data.personalInfo.lastName}</div>
                      <div>Move-in Date: {data.propertyAssignment.moveInDate}</div>
                      <div>Property: {data.propertyAssignment.propertyId}</div>
                      <div>Veteran Status: {data.isVeteran ? 'Yes' : 'No'}</div>
                      <div>Special Accommodations: {data.hasDisability ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="welcomeDashboard"
                      checked={data.welcomeDashboardCompleted}
                      onCheckedChange={(checked) => updateData('welcomeDashboardCompleted', checked)}
                    />
                    <Label htmlFor="welcomeDashboard">Resident portal access configured</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const progress = (currentStep / STEPS.length) * 100;
  const currentStepData = STEPS.find(step => step.id === currentStep);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[95vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {currentStepData?.icon && <currentStepData.icon className="w-5 h-5" />}
                Step {currentStep} of {STEPS.length}: {currentStepData?.title}
              </CardTitle>
              <p className="text-gray-600 text-sm mt-1">{currentStepData?.description}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <span className="text-2xl">&times;</span>
            </Button>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-[calc(95vh-200px)] p-6">
          {renderStepContent()}
        </CardContent>
        
        <div className="border-t p-4 flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            {currentStep === STEPS.length ? (
              <Button
                onClick={handleSubmit}
                disabled={submitOnboardingMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitOnboardingMutation.isPending ? 'Processing...' : 'Complete Onboarding'}
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}