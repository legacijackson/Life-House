import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface UnifiedIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface IntakeFormData {
  // Step 1: Basic Info
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  // Step 2: Justice Status
  releaseDate: string;
  justiceStatus: string;
  paroleOfficer?: string;
  // Step 3: Housing & Support
  emergencyContact: string;
  emergencyPhone: string;
  hasChildren: boolean;
  medicalNeeds: string;
  // Step 4: Documents
  uploadedDocs: File[];
  // Step 5: Consent & Agreements
  privacyConsent: boolean;
  handbookConsent: boolean;
  dataSharing: boolean;
}

const TOTAL_STEPS = 5;

export function UnifiedIntakeModal({ isOpen, onClose }: UnifiedIntakeModalProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<IntakeFormData>({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    releaseDate: '',
    justiceStatus: '',
    paroleOfficer: '',
    emergencyContact: '',
    emergencyPhone: '',
    hasChildren: false,
    medicalNeeds: '',
    uploadedDocs: [],
    privacyConsent: false,
    handbookConsent: false,
    dataSharing: false,
  });

  const progressPercentage = (currentStep / TOTAL_STEPS) * 100;

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setFormData(prev => ({
        ...prev,
        uploadedDocs: [...prev.uploadedDocs, ...newFiles]
      }));
      toast({
        title: "Documents uploaded",
        description: `${newFiles.length} file(s) added successfully`
      });
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.email && formData.phone && formData.dateOfBirth;
      case 2:
        return formData.releaseDate && formData.justiceStatus;
      case 3:
        return formData.emergencyContact && formData.emergencyPhone;
      case 4:
        return formData.uploadedDocs.length > 0;
      case 5:
        return formData.privacyConsent && formData.handbookConsent;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/public/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          releaseDate: formData.releaseDate,
          justiceStatus: formData.justiceStatus,
          emergencyContact: formData.emergencyContact,
          emergencyPhone: formData.emergencyPhone,
          medicalNeeds: formData.medicalNeeds,
          hasChildren: formData.hasChildren,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Application submitted successfully!",
          description: `Application ID: ${result.applicationId}. We will contact you within 24-48 hours.`
        });
        onClose();
        // Reset form
        setCurrentStep(1);
        setFormData({
          name: '', email: '', phone: '', dateOfBirth: '', releaseDate: '', justiceStatus: '',
          paroleOfficer: '', emergencyContact: '', emergencyPhone: '', hasChildren: false,
          medicalNeeds: '', uploadedDocs: [], privacyConsent: false, handbookConsent: false, dataSharing: false,
        });
      } else {
        throw new Error(result.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Application submission error:', error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive"
      });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter your full legal name"
                className="mt-1"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="your.email@example.com"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="(555) 123-4567"
                  className="mt-1"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                className="mt-1"
                required
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="releaseDate">Release Date *</Label>
              <Input
                id="releaseDate"
                type="date"
                value={formData.releaseDate}
                onChange={(e) => setFormData({...formData, releaseDate: e.target.value})}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="justiceStatus">Current Status *</Label>
              <Select value={formData.justiceStatus} onValueChange={(value) => setFormData({...formData, justiceStatus: value})}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select your current status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parole">Parole</SelectItem>
                  <SelectItem value="probation">Probation</SelectItem>
                  <SelectItem value="formerly_incarcerated">Formerly Incarcerated</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(formData.justiceStatus === 'parole' || formData.justiceStatus === 'probation') && (
              <div>
                <Label htmlFor="paroleOfficer">Parole/Probation Officer</Label>
                <Input
                  id="paroleOfficer"
                  value={formData.paroleOfficer || ''}
                  onChange={(e) => setFormData({...formData, paroleOfficer: e.target.value})}
                  placeholder="Officer name and contact info"
                  className="mt-1"
                />
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergencyContact">Emergency Contact Name *</Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                  placeholder="Contact person name"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="emergencyPhone">Emergency Contact Phone *</Label>
                <Input
                  id="emergencyPhone"
                  type="tel"
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})}
                  placeholder="(555) 123-4567"
                  className="mt-1"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="medicalNeeds">Medical or Special Needs</Label>
              <Textarea
                id="medicalNeeds"
                value={formData.medicalNeeds}
                onChange={(e) => setFormData({...formData, medicalNeeds: e.target.value})}
                placeholder="Please describe any medical conditions, disabilities, or special accommodations..."
                className="mt-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasChildren"
                checked={formData.hasChildren}
                onCheckedChange={(checked) => setFormData({...formData, hasChildren: checked as boolean})}
              />
              <Label htmlFor="hasChildren">I have children under 18</Label>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Upload Required Documents</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please upload: ID (driver's license, state ID), proof of income, and any relevant court documents
              </p>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <div>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-500">Click to upload</span>
                  <span className="text-gray-600"> or drag and drop</span>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">PDF, JPG, PNG up to 10MB each</p>
            </div>
            
            {formData.uploadedDocs.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Uploaded Documents:</h4>
                {formData.uploadedDocs.map((file, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-green-50 rounded">
                    <FileText className="w-4 h-4 text-green-600" />
                    <span className="text-sm">{file.name}</span>
                    <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Consent & Agreements</h3>
              <p className="text-sm text-gray-600">
                Please review and accept the following to complete your application
              </p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Privacy Notice & Data Handling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="privacyConsent"
                    checked={formData.privacyConsent}
                    onCheckedChange={(checked) => setFormData({...formData, privacyConsent: checked as boolean})}
                    required
                  />
                  <Label htmlFor="privacyConsent" className="text-sm">
                    I acknowledge that I have read and understand the Life House Privacy Notice. I consent to the collection, use, and disclosure of my personal information as described. *
                  </Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Program Handbook & House Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="handbookConsent"
                    checked={formData.handbookConsent}
                    onCheckedChange={(checked) => setFormData({...formData, handbookConsent: checked as boolean})}
                    required
                  />
                  <Label htmlFor="handbookConsent" className="text-sm">
                    I agree to abide by all Life House program requirements, house rules, and participation guidelines. I understand that housing is contingent on program compliance. *
                  </Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Sharing (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="dataSharing"
                    checked={formData.dataSharing}
                    onCheckedChange={(checked) => setFormData({...formData, dataSharing: checked as boolean})}
                  />
                  <Label htmlFor="dataSharing" className="text-sm">
                    I consent to Life House sharing my progress data with partner agencies (parole/probation, CalAIM, workforce programs) to coordinate services and support.
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Life House Housing Application
            <Badge variant="outline" className="ml-2">
              Step {currentStep} of {TOTAL_STEPS}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>

          {/* Step Content */}
          <div className="min-h-[300px]">
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {currentStep < TOTAL_STEPS ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center bg-green-600 hover:bg-green-700"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed()}
                className="flex items-center bg-green-600 hover:bg-green-700"
              >
                Submit Application
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}