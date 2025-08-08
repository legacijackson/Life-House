import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  User, 
  FileText, 
  Upload, 
  Briefcase, 
  Shield, 
  DollarSign, 
  UserCheck,
  FileSignature,
  Users
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CaseManagerOnboardingData {
  // Step 1: Personal Information
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    ssn: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  
  // Step 2: Professional Credentials
  credentials: {
    roleTitle: string;
    startDate: string;
    licenseNumber: string;
    licenseExpiry: string;
    certifications: string[];
    educationLevel: string;
    yearsOfExperience: number;
  };
  
  // Step 3: Emergency Contact
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
  };
  
  // Step 4: Tax & Banking
  taxBanking: {
    bankName: string;
    accountType: string;
    routingNumber: string;
    accountNumber: string;
    taxFilingStatus: string;
    allowances: number;
  };
  
  // Step 5: Background Check
  backgroundCheck: {
    consentGiven: boolean;
    criminalHistory: boolean;
    criminalHistoryDetails: string;
    drugTestConsent: boolean;
  };
  
  // Step 6: Documents
  documents: {
    resume: File | null;
    license: File | null;
    certifications: File[];
    idFront: File | null;
    idBack: File | null;
    w4: File | null;
    i9: File | null;
    directDeposit: File | null;
  };
  
  // Step 7: Policies & Agreements
  agreements: {
    employmentAgreement: boolean;
    confidentialityAgreement: boolean;
    hipaaCompliance: boolean;
    codeOfConduct: boolean;
    techPolicy: boolean;
    mediaRelease: boolean;
  };
  
  // Step 8: System Access
  systemAccess: {
    username: string;
    temporaryPassword: string;
    twoFactorEnabled: boolean;
    accessLevel: string;
  };
}

interface CaseManagerOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const STEPS = [
  { id: 1, title: "Personal Info", icon: User, description: "Basic personal information" },
  { id: 2, title: "Credentials", icon: Briefcase, description: "Professional qualifications" },
  { id: 3, title: "Emergency", icon: UserCheck, description: "Emergency contact details" },
  { id: 4, title: "Tax & Banking", icon: DollarSign, description: "Payroll information" },
  { id: 5, title: "Background", icon: Shield, description: "Background check consent" },
  { id: 6, title: "Documents", icon: Upload, description: "Required documentation" },
  { id: 7, title: "Agreements", icon: FileSignature, description: "Policy agreements" },
  { id: 8, title: "System Access", icon: Users, description: "Account setup" }
];

export function CaseManagerOnboarding({ isOpen, onClose, onComplete }: CaseManagerOnboardingProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<CaseManagerOnboardingData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      ssn: '',
      address: '',
      city: '',
      state: '',
      zipCode: ''
    },
    credentials: {
      roleTitle: 'CaseManager',
      startDate: '',
      licenseNumber: '',
      licenseExpiry: '',
      certifications: [],
      educationLevel: '',
      yearsOfExperience: 0
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    },
    taxBanking: {
      bankName: '',
      accountType: 'checking',
      routingNumber: '',
      accountNumber: '',
      taxFilingStatus: 'single',
      allowances: 0
    },
    backgroundCheck: {
      consentGiven: false,
      criminalHistory: false,
      criminalHistoryDetails: '',
      drugTestConsent: false
    },
    documents: {
      resume: null,
      license: null,
      certifications: [],
      idFront: null,
      idBack: null,
      w4: null,
      i9: null,
      directDeposit: null
    },
    agreements: {
      employmentAgreement: false,
      confidentialityAgreement: false,
      hipaaCompliance: false,
      codeOfConduct: false,
      techPolicy: false,
      mediaRelease: false
    },
    systemAccess: {
      username: '',
      temporaryPassword: '',
      twoFactorEnabled: true,
      accessLevel: 'CaseManager'
    }
  });

  const submitOnboardingMutation = useMutation({
    mutationFn: async (onboardingData: CaseManagerOnboardingData) => {
      const formData = new FormData();
      
      // Add all non-file data
      const { documents, ...otherData } = onboardingData;
      formData.append('data', JSON.stringify(otherData));
      
      // Add files
      if (documents.resume) formData.append('resume', documents.resume);
      if (documents.license) formData.append('license', documents.license);
      if (documents.idFront) formData.append('idFront', documents.idFront);
      if (documents.idBack) formData.append('idBack', documents.idBack);
      if (documents.w4) formData.append('w4', documents.w4);
      if (documents.i9) formData.append('i9', documents.i9);
      if (documents.directDeposit) formData.append('directDeposit', documents.directDeposit);
      
      documents.certifications.forEach((file, index) => {
        formData.append(`certification_${index}`, file);
      });

      return await apiRequest('/api/admin/onboard-case-manager', {
        method: 'POST',
        body: formData
      });
    },
    onSuccess: (result) => {
      toast({
        title: "Case Manager Onboarded Successfully",
        description: `${data.personalInfo.firstName} ${data.personalInfo.lastName} has been successfully onboarded as a case manager.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/staff/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/case-managers'] });
      onComplete();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Onboarding Failed",
        description: "There was an error processing the case manager onboarding. Please try again.",
        variant: "destructive"
      });
      console.error('Case manager onboarding error:', error);
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
    // Generate username from email if not provided
    if (!data.systemAccess.username && data.personalInfo.email) {
      data.systemAccess.username = data.personalInfo.email.split('@')[0];
    }
    
    // Generate temporary password if not provided
    if (!data.systemAccess.temporaryPassword) {
      data.systemAccess.temporaryPassword = `LifeHouse${Math.random().toString(36).slice(-8)}`;
    }
    
    submitOnboardingMutation.mutate(data);
  };

  const updateData = (section: keyof CaseManagerOnboardingData, updates: any) => {
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
              <User className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <p className="text-gray-600">Basic personal details for HR records</p>
            </div>
            
            <div className="space-y-4">
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
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={data.personalInfo.email}
                    onChange={(e) => updateData('personalInfo', { email: e.target.value })}
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
                  <Label htmlFor="ssn">Social Security Number *</Label>
                  <Input
                    id="ssn"
                    type="password"
                    value={data.personalInfo.ssn}
                    onChange={(e) => updateData('personalInfo', { ssn: e.target.value })}
                    placeholder="XXX-XX-XXXX"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  value={data.personalInfo.address}
                  onChange={(e) => updateData('personalInfo', { address: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={data.personalInfo.city}
                    onChange={(e) => updateData('personalInfo', { city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Select
                    value={data.personalInfo.state}
                    onValueChange={(value) => updateData('personalInfo', { state: value })}
                  >
                    <SelectTrigger id="state">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CA">California</SelectItem>
                      <SelectItem value="TX">Texas</SelectItem>
                      <SelectItem value="NY">New York</SelectItem>
                      <SelectItem value="FL">Florida</SelectItem>
                      {/* Add more states as needed */}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    value={data.personalInfo.zipCode}
                    onChange={(e) => updateData('personalInfo', { zipCode: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold">Professional Credentials</h3>
              <p className="text-gray-600">Qualifications and experience</p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="roleTitle">Role Title *</Label>
                  <Select
                    value={data.credentials.roleTitle}
                    onValueChange={(value) => updateData('credentials', { roleTitle: value })}
                  >
                    <SelectTrigger id="roleTitle">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CaseManager">Case Manager</SelectItem>
                      <SelectItem value="SeniorCaseManager">Senior Case Manager</SelectItem>
                      <SelectItem value="LeadCaseManager">Lead Case Manager</SelectItem>
                      <SelectItem value="CaseManagerSupervisor">Case Manager Supervisor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={data.credentials.startDate}
                    onChange={(e) => updateData('credentials', { startDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="licenseNumber">License Number (if applicable)</Label>
                  <Input
                    id="licenseNumber"
                    value={data.credentials.licenseNumber}
                    onChange={(e) => updateData('credentials', { licenseNumber: e.target.value })}
                    placeholder="e.g., LCSW, LMFT"
                  />
                </div>
                <div>
                  <Label htmlFor="licenseExpiry">License Expiry Date</Label>
                  <Input
                    id="licenseExpiry"
                    type="date"
                    value={data.credentials.licenseExpiry}
                    onChange={(e) => updateData('credentials', { licenseExpiry: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="educationLevel">Education Level *</Label>
                  <Select
                    value={data.credentials.educationLevel}
                    onValueChange={(value) => updateData('credentials', { educationLevel: value })}
                  >
                    <SelectTrigger id="educationLevel">
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high_school">High School</SelectItem>
                      <SelectItem value="associates">Associate's Degree</SelectItem>
                      <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                      <SelectItem value="masters">Master's Degree</SelectItem>
                      <SelectItem value="doctorate">Doctorate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="experience">Years of Experience *</Label>
                  <Input
                    id="experience"
                    type="number"
                    value={data.credentials.yearsOfExperience}
                    onChange={(e) => updateData('credentials', { yearsOfExperience: parseInt(e.target.value) })}
                    min="0"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="certifications">Certifications (comma-separated)</Label>
                <Textarea
                  id="certifications"
                  value={data.credentials.certifications.join(', ')}
                  onChange={(e) => updateData('credentials', { 
                    certifications: e.target.value.split(',').map(c => c.trim()).filter(c => c) 
                  })}
                  placeholder="e.g., CPR, First Aid, Crisis Intervention"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <UserCheck className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <h3 className="text-lg font-semibold">Emergency Contact</h3>
              <p className="text-gray-600">In case of emergency</p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyName">Contact Name *</Label>
                  <Input
                    id="emergencyName"
                    value={data.emergencyContact.name}
                    onChange={(e) => updateData('emergencyContact', { name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="relationship">Relationship *</Label>
                  <Input
                    id="relationship"
                    value={data.emergencyContact.relationship}
                    onChange={(e) => updateData('emergencyContact', { relationship: e.target.value })}
                    placeholder="e.g., Spouse, Parent, Sibling"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyPhone">Phone Number *</Label>
                  <Input
                    id="emergencyPhone"
                    value={data.emergencyContact.phone}
                    onChange={(e) => updateData('emergencyContact', { phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyEmail">Email Address</Label>
                  <Input
                    id="emergencyEmail"
                    type="email"
                    value={data.emergencyContact.email}
                    onChange={(e) => updateData('emergencyContact', { email: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold">Tax & Banking Information</h3>
              <p className="text-gray-600">For payroll processing</p>
            </div>
            
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-4">
                <p className="text-sm text-yellow-800">
                  🔒 All banking information is encrypted and stored securely. Only authorized HR personnel have access.
                </p>
              </CardContent>
            </Card>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    id="bankName"
                    value={data.taxBanking.bankName}
                    onChange={(e) => updateData('taxBanking', { bankName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="accountType">Account Type *</Label>
                  <Select
                    value={data.taxBanking.accountType}
                    onValueChange={(value) => updateData('taxBanking', { accountType: value })}
                  >
                    <SelectTrigger id="accountType">
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="routingNumber">Routing Number *</Label>
                  <Input
                    id="routingNumber"
                    value={data.taxBanking.routingNumber}
                    onChange={(e) => updateData('taxBanking', { routingNumber: e.target.value })}
                    placeholder="9 digits"
                    maxLength={9}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input
                    id="accountNumber"
                    type="password"
                    value={data.taxBanking.accountNumber}
                    onChange={(e) => updateData('taxBanking', { accountNumber: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="filingStatus">Tax Filing Status *</Label>
                  <Select
                    value={data.taxBanking.taxFilingStatus}
                    onValueChange={(value) => updateData('taxBanking', { taxFilingStatus: value })}
                  >
                    <SelectTrigger id="filingStatus">
                      <SelectValue placeholder="Select filing status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="married_separate">Married Filing Separately</SelectItem>
                      <SelectItem value="head_of_household">Head of Household</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="allowances">W-4 Allowances *</Label>
                  <Input
                    id="allowances"
                    type="number"
                    value={data.taxBanking.allowances}
                    onChange={(e) => updateData('taxBanking', { allowances: parseInt(e.target.value) })}
                    min="0"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Shield className="w-12 h-12 mx-auto mb-4 text-red-600" />
              <h3 className="text-lg font-semibold">Background Check</h3>
              <p className="text-gray-600">Required for all positions</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="bgConsent"
                  checked={data.backgroundCheck.consentGiven}
                  onCheckedChange={(checked) => updateData('backgroundCheck', { consentGiven: checked })}
                />
                <Label htmlFor="bgConsent" className="text-sm">
                  I consent to a background check including criminal history, employment verification, and reference checks
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="drugTest"
                  checked={data.backgroundCheck.drugTestConsent}
                  onCheckedChange={(checked) => updateData('backgroundCheck', { drugTestConsent: checked })}
                />
                <Label htmlFor="drugTest" className="text-sm">
                  I consent to drug testing as required by company policy
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="criminalHistory"
                  checked={data.backgroundCheck.criminalHistory}
                  onCheckedChange={(checked) => updateData('backgroundCheck', { criminalHistory: checked })}
                />
                <Label htmlFor="criminalHistory" className="text-sm">
                  I have a criminal history to disclose (check if yes)
                </Label>
              </div>
              
              {data.backgroundCheck.criminalHistory && (
                <div>
                  <Label htmlFor="criminalDetails">Please provide details</Label>
                  <Textarea
                    id="criminalDetails"
                    value={data.backgroundCheck.criminalHistoryDetails}
                    onChange={(e) => updateData('backgroundCheck', { criminalHistoryDetails: e.target.value })}
                    placeholder="Provide details about any criminal history..."
                    rows={4}
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Upload className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold">Document Upload</h3>
              <p className="text-gray-600">Required documentation</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="resume">Resume/CV *</Label>
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => updateData('documents', { resume: e.target.files?.[0] || null })}
                />
              </div>
              
              <div>
                <Label htmlFor="license">Professional License (if applicable)</Label>
                <Input
                  id="license"
                  type="file"
                  accept=".pdf,.jpg,.png"
                  onChange={(e) => updateData('documents', { license: e.target.files?.[0] || null })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="idFront">ID Front *</Label>
                  <Input
                    id="idFront"
                    type="file"
                    accept=".jpg,.png,.pdf"
                    onChange={(e) => updateData('documents', { idFront: e.target.files?.[0] || null })}
                  />
                </div>
                <div>
                  <Label htmlFor="idBack">ID Back *</Label>
                  <Input
                    id="idBack"
                    type="file"
                    accept=".jpg,.png,.pdf"
                    onChange={(e) => updateData('documents', { idBack: e.target.files?.[0] || null })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="w4">W-4 Form *</Label>
                  <Input
                    id="w4"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => updateData('documents', { w4: e.target.files?.[0] || null })}
                  />
                </div>
                <div>
                  <Label htmlFor="i9">I-9 Form *</Label>
                  <Input
                    id="i9"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => updateData('documents', { i9: e.target.files?.[0] || null })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="directDeposit">Direct Deposit Form *</Label>
                <Input
                  id="directDeposit"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => updateData('documents', { directDeposit: e.target.files?.[0] || null })}
                />
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <FileSignature className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <h3 className="text-lg font-semibold">Policies & Agreements</h3>
              <p className="text-gray-600">Review and acknowledge company policies</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="employment"
                  checked={data.agreements.employmentAgreement}
                  onCheckedChange={(checked) => updateData('agreements', { employmentAgreement: checked })}
                />
                <Label htmlFor="employment" className="text-sm">
                  I have read and agree to the Employment Agreement
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="confidentiality"
                  checked={data.agreements.confidentialityAgreement}
                  onCheckedChange={(checked) => updateData('agreements', { confidentialityAgreement: checked })}
                />
                <Label htmlFor="confidentiality" className="text-sm">
                  I have read and agree to the Confidentiality Agreement
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="hipaa"
                  checked={data.agreements.hipaaCompliance}
                  onCheckedChange={(checked) => updateData('agreements', { hipaaCompliance: checked })}
                />
                <Label htmlFor="hipaa" className="text-sm">
                  I have completed HIPAA training and agree to comply with all privacy regulations
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="conduct"
                  checked={data.agreements.codeOfConduct}
                  onCheckedChange={(checked) => updateData('agreements', { codeOfConduct: checked })}
                />
                <Label htmlFor="conduct" className="text-sm">
                  I have read and agree to the Code of Conduct
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="tech"
                  checked={data.agreements.techPolicy}
                  onCheckedChange={(checked) => updateData('agreements', { techPolicy: checked })}
                />
                <Label htmlFor="tech" className="text-sm">
                  I have read and agree to the Technology Use Policy
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="media"
                  checked={data.agreements.mediaRelease}
                  onCheckedChange={(checked) => updateData('agreements', { mediaRelease: checked })}
                />
                <Label htmlFor="media" className="text-sm">
                  I consent to the use of my image in company materials (optional)
                </Label>
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Users className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold">System Access Setup</h3>
              <p className="text-gray-600">Configure account access</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={data.systemAccess.username || data.personalInfo.email.split('@')[0]}
                    onChange={(e) => updateData('systemAccess', { username: e.target.value })}
                    placeholder="Auto-generated from email"
                  />
                </div>
                
                <div>
                  <Label htmlFor="tempPassword">Temporary Password</Label>
                  <Input
                    id="tempPassword"
                    value={data.systemAccess.temporaryPassword}
                    onChange={(e) => updateData('systemAccess', { temporaryPassword: e.target.value })}
                    placeholder="Auto-generated if left blank"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    User will be required to change password on first login
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="accessLevel">Access Level</Label>
                  <Select
                    value={data.systemAccess.accessLevel}
                    onValueChange={(value) => updateData('systemAccess', { accessLevel: value })}
                  >
                    <SelectTrigger id="accessLevel">
                      <SelectValue placeholder="Select access level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CaseManager">Case Manager</SelectItem>
                      <SelectItem value="SeniorCaseManager">Senior Case Manager</SelectItem>
                      <SelectItem value="Supervisor">Supervisor</SelectItem>
                      <SelectItem value="Admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="twoFactor"
                    checked={data.systemAccess.twoFactorEnabled}
                    onCheckedChange={(checked) => updateData('systemAccess', { twoFactorEnabled: checked })}
                  />
                  <Label htmlFor="twoFactor">Enable two-factor authentication</Label>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <h4 className="font-semibold mb-2">Onboarding Summary</h4>
                <div className="space-y-1 text-sm">
                  <p>Name: {data.personalInfo.firstName} {data.personalInfo.lastName}</p>
                  <p>Role: {data.credentials.roleTitle}</p>
                  <p>Start Date: {data.credentials.startDate}</p>
                  <p>Email: {data.personalInfo.email}</p>
                  <p>Access Level: {data.systemAccess.accessLevel}</p>
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Case Manager Onboarding</h2>
            <p className="text-gray-600">Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <Progress value={(currentStep / STEPS.length) * 100} className="mb-6" />

        <div className="mb-6">
          <div className="flex justify-between">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center ${
                    step.id === currentStep
                      ? 'text-blue-600'
                      : step.id < currentStep
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}
                >
                  <Icon className="w-6 h-6 mb-1" />
                  <span className="text-xs hidden sm:block">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

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
    </div>
  );
}