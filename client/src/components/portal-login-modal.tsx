import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useLocation } from "wouter";

// Login schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  userType: z.enum(["Resident", "CaseManager", "Admin"], {
    required_error: "Please select your account type"
  }),
});

// Signup schema
const signupSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["Resident", "CaseManager", "Admin", "Partner"]),
  password: z.string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

interface PortalLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPortal?: string; // Which portal the user is trying to access
}

// Portal routing based on user role
const getPortalRoute = (role: string) => {
  const routes: Record<string, string> = {
    Resident: "/app/resident-portal",
    CaseManager: "/app/staff-dashboard",
    Admin: "/app/admin-panel",
    Partner: "/app/partner-portal",
  };
  return routes[role] || "/app/resident-portal";
};

// Get portal route by portal name
const getPortalRouteByName = (portalName: string) => {
  const routes: Record<string, string> = {
    "Resident Portal": "/app/resident-portal",
    "Staff Dashboard": "/app/staff-dashboard", 
    "Admin Panel": "/app/admin-panel",
  };
  return routes[portalName] || "/app/resident-portal";
};

// Validate if user role can access target portal
const validatePortalAccess = (userRole: string, targetPortal: string) => {
  const accessRules: Record<string, string[]> = {
    "Resident Portal": ["Resident", "Admin"],
    "Staff Dashboard": ["CaseManager", "Intake", "Admin"],
    "Admin Panel": ["Admin"],
  };
  return accessRules[targetPortal]?.includes(userRole) || false;
};

export function PortalLoginModal({ isOpen, onClose, targetPortal }: PortalLoginModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [, setLocation] = useLocation();

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      userType: "Resident",
    },
  });

  // Signup form
  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      role: "Resident",
      password: "",
      confirmPassword: "",
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest("/api/login", {
        method: "POST",
        body: {
          email: data.email,
          password: data.password
        }
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      if (data.user?.role) {
        localStorage.setItem("userRole", data.user.role);
      }
      if (data.user) {
        localStorage.setItem("userData", JSON.stringify(data.user));
      }
      
      // Allow flexible login - users can select any role type, but we'll redirect based on their actual role
      const actualUserRole = data.user?.role;
      
      // Note: For development, we'll allow any user to access any portal and redirect based on their actual role
      
      toast.success(`Welcome back, ${data.user?.name || data.user?.email}!`);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      loginForm.reset();
      onClose();
      
      // Navigate to target portal or appropriate portal based on role
      const portalRoute = targetPortal ? 
        getPortalRouteByName(targetPortal) : 
        getPortalRoute(data.user?.role || "Resident");
      setLocation(portalRoute);
    },
    onError: (error: any) => {
      toast.error(error.message || "Invalid email or password. Please try again.");
    },
  });

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: async (data: SignupFormData) => {
      const response = await apiRequest("/api/signup", {
        method: "POST",
        body: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: data.role,
          password: data.password,
        }
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      if (data.user?.role) {
        localStorage.setItem("userRole", data.user.role);
      }
      if (data.user) {
        localStorage.setItem("userData", JSON.stringify(data.user));
      }
      toast.success("Welcome to Life House! Your account has been created.");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      signupForm.reset();
      onClose();
      // Navigate to appropriate portal based on role
      const portalRoute = getPortalRoute(data.user?.role || signupForm.getValues("role"));
      setLocation(portalRoute);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create account. Please try again.");
    },
  });

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 12) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[^A-Za-z0-9]/.test(password)) strength += 20;
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (value: string) => {
    signupForm.setValue("password", value);
    calculatePasswordStrength(value);
  };

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onSignupSubmit = (data: SignupFormData) => {
    signupMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Life House Portal</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "signup")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Create Account</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-4">
            {targetPortal && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Accessing {targetPortal}</strong>
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {targetPortal === "Resident Portal" && "Please log in with your resident credentials to access your personal dashboard."}
                  {targetPortal === "Staff Dashboard" && "Please log in with your staff credentials (Case Manager, Intake, or Admin)."}
                  {targetPortal === "Admin Panel" && "Please log in with your administrator credentials."}
                </p>
              </div>
            )}
            
            
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="userType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>I am logging in as:</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Resident" id="resident" />
                            <FormLabel htmlFor="resident" className="font-normal cursor-pointer">
                              Resident - Access my personal dashboard and resources
                            </FormLabel>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="CaseManager" id="casemanager" />
                            <FormLabel htmlFor="casemanager" className="font-normal cursor-pointer">
                              Case Manager - Manage residents and case notes
                            </FormLabel>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Admin" id="admin" />
                            <FormLabel htmlFor="admin" className="font-normal cursor-pointer">
                              Administrator - Full system access
                            </FormLabel>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••••••"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => toast("Please contact support at support@lifehouse.org for password reset", { icon: "ℹ️" })}
                  >
                    Forgot password?
                  </Button>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="signup" className="mt-4">
            <Form {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={signupForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={signupForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signupForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>I am creating an account as:</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Resident" id="signup-resident" />
                            <FormLabel htmlFor="signup-resident" className="font-normal cursor-pointer">
                              Resident - Access my personal dashboard and resources
                            </FormLabel>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="CaseManager" id="signup-casemanager" />
                            <FormLabel htmlFor="signup-casemanager" className="font-normal cursor-pointer">
                              Case Manager - Manage residents and case notes
                            </FormLabel>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Admin" id="signup-admin" />
                            <FormLabel htmlFor="signup-admin" className="font-normal cursor-pointer">
                              Administrator - Full system access
                            </FormLabel>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Partner" id="signup-partner" />
                            <FormLabel htmlFor="signup-partner" className="font-normal cursor-pointer">
                              Partner Organization - Community resource provider
                            </FormLabel>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signupForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••••••"
                            {...field}
                            onChange={(e) => handlePasswordChange(e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <div className="mt-2">
                        <Progress value={passwordStrength} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">
                          Password strength: {passwordStrength <= 20 ? "Weak" : passwordStrength <= 60 ? "Fair" : passwordStrength <= 80 ? "Good" : "Strong"}
                        </p>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signupForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={signupMutation.isPending}
                >
                  {signupMutation.isPending ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}