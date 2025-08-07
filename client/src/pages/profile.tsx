import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Camera,
  Save,
  AlertCircle,
  Check
} from 'lucide-react';
import { useCurrentUser } from "@/lib/rbac";
import { toast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  dateOfBirth: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: (user as any)?.name || '',
      email: (user as any)?.email || '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      dateOfBirth: '',
      emergencyContact: '',
      emergencyPhone: '',
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await fetch(`/api/users/${(user as any)?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'mock-token-1'}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await fetch(`/api/users/${(user as any)?.id}/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'mock-token-1'}`,
        },
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to upload avatar');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Avatar uploaded",
        description: "Your avatar has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      setAvatarPreview(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload file
      setIsUploading(true);
      uploadAvatarMutation.mutate(file, {
        onSettled: () => setIsUploading(false),
      });
    }
  };

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  if (userLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 bg-gray-50">
          <div className="p-8">
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">Loading profile...</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 bg-gray-50">
          <div className="p-8">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to load user profile. Please try again later.
              </AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    );
  }

  const userInitials = ((user as any)?.name || 'User')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="p-8 max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-500 mt-2">
              Manage your personal information and account settings
            </p>
          </div>

          <div className="grid gap-6">
            {/* Profile Picture Card */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>
                  Upload a profile picture to personalize your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage 
                      src={avatarPreview || ''} 
                      alt={(user as any)?.name || 'User'} 
                    />
                    <AvatarFallback className="text-2xl">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                        disabled={isUploading}
                      >
                        <span>
                          <Camera className="w-4 h-4 mr-2" />
                          {isUploading ? 'Uploading...' : 'Change Photo'}
                        </span>
                      </Button>
                    </Label>
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                      disabled={isUploading}
                    />
                    <p className="text-xs text-gray-500">
                      JPG, GIF or PNG. Max size of 5MB.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input 
                                  placeholder="John Doe" 
                                  className="pl-10"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input 
                                  type="email"
                                  placeholder="john.doe@example.com" 
                                  className="pl-10"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input 
                                  type="tel"
                                  placeholder="(555) 123-4567" 
                                  className="pl-10"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input 
                                  type="date"
                                  className="pl-10"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Address Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Street Address</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input 
                                    placeholder="123 Main St" 
                                    className="pl-10"
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="Sacramento" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>State</FormLabel>
                                <FormControl>
                                  <Input placeholder="CA" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="zipCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ZIP Code</FormLabel>
                                <FormControl>
                                  <Input placeholder="95826" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Emergency Contact</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="emergencyContact"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Jane Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="emergencyPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Phone</FormLabel>
                              <FormControl>
                                <Input 
                                  type="tel"
                                  placeholder="(555) 987-6543" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => form.reset()}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <>Saving...</>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Account Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Your account details and security settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Role</p>
                        <p className="text-sm text-gray-500">Your system access level</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{(user as any)?.role || 'User'}</Badge>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Account Created</p>
                        <p className="text-sm text-gray-500">When you joined Life House</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(Date.now()).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Stage information would go here if available */}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}