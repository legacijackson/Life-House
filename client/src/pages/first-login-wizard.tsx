import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Upload, 
  Shield, 
  CheckCircle, 
  Camera,
  Mail,
  Phone,
  Calendar,
  MapPin
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface ProfileData {
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  avatar?: File;
  avatarUrl?: string;
}

export default function FirstLoginWizard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth || '',
    avatarUrl: user?.profileImageUrl || ''
  });
  const [pinConfirm, setPinConfirm] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profileData.avatarUrl || null);

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  // Profile completion mutation
  const completeProfileMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest('POST', '/api/auth/complete-profile', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({ 
        title: "Profile completed successfully!",
        description: "Welcome to Life House. You can now access all features." 
      });
      // Redirect to dashboard
      window.location.href = '/app';
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to complete profile", 
        description: error.message || "Please try again.",
        variant: "destructive" 
      });
    }
  });

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileData({ ...profileData, avatar: file });
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    const formData = new FormData();
    formData.append('firstName', profileData.firstName);
    formData.append('lastName', profileData.lastName);
    formData.append('phone', profileData.phone);
    formData.append('dateOfBirth', profileData.dateOfBirth);
    formData.append('pinConfirm', pinConfirm);
    
    if (profileData.avatar) {
      formData.append('avatar', profileData.avatar);
    }

    completeProfileMutation.mutate(formData);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <User className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h2 className="text-2xl font-bold">Welcome to Life House!</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Let's set up your profile to get you started
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={profileData.dateOfBirth}
                    onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Camera className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h2 className="text-2xl font-bold">Add Your Photo</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Upload a profile picture to personalize your account
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Profile preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50">
                      <User className="w-16 h-16 text-blue-300" />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <Button
                  asChild
                  size="sm"
                  className="absolute bottom-0 right-0 rounded-full"
                >
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <Upload className="h-4 w-4" />
                  </label>
                </Button>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Click the upload button to add your photo
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG or GIF. Max file size 5MB.
                </p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h2 className="text-2xl font-bold">Security Setup</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Confirm your security preferences
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="pinConfirm">Confirm Your PIN</Label>
                <Input
                  id="pinConfirm"
                  type="password"
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value)}
                  placeholder="Enter your 4-digit PIN"
                  maxLength={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This PIN will be used for quick authentication
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Get updates via email</p>
                    </div>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Enhanced security</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Optional</Badge>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold">You're All Set!</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Your profile is ready. Welcome to the Life House community!
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">Profile Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-green-600" />
                    <span>{profileData.firstName} {profileData.lastName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-green-600" />
                    <span>{profileData.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <span>{profileData.dateOfBirth}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default">Profile Photo: {avatarPreview ? 'Added' : 'Not Added'}</Badge>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  You can update your profile information anytime from your account settings.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">LH</span>
            </div>
            <span className="text-xl font-bold">Life House</span>
          </div>
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-gray-500 mt-2">Step {currentStep} of {totalSteps}</p>
        </CardHeader>
        
        <CardContent>
          {renderStep()}
          
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            
            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && (!profileData.firstName || !profileData.lastName || !profileData.phone)) ||
                  (currentStep === 3 && pinConfirm.length !== 4)
                }
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={completeProfileMutation.isPending}
              >
                {completeProfileMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Setup
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}