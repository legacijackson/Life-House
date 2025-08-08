import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Lock, Mail, AlertCircle } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function StaffLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      
      // After successful login, we need to check the user data
      // The auth context will handle the token storage
      const token = localStorage.getItem("token");
      if (token) {
        // Fetch user data to check role
        const userResponse = await fetch("/api/auth/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const user = userData.user;
          
          // Check if user is staff or admin
          if (user?.isAdmin || user?.role === "CaseManager" || user?.role === "Intake") {
            toast({
              title: "Login successful",
              description: `Welcome back, ${user?.name || user?.email}!`,
            });
            
            // Redirect based on role
            if (user?.isAdmin) {
              setLocation("/app/admin-panel");
            } else {
              setLocation("/app/staff-dashboard");
            }
          } else {
            // If not staff/admin, show error
            toast({
              title: "Access denied",
              description: "This portal is for staff and administrators only.",
              variant: "destructive",
            });
            
            // Clear the invalid login
            localStorage.removeItem("token");
            window.location.href = '/';
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-cream-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo className="h-16" />
        </div>

        <Card className="shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Staff Portal</CardTitle>
            <CardDescription>
              Sign in to access the case management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Access Notice */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Staff Access Only</p>
                  <p>This portal is restricted to Life House staff members and administrators. Residents should use the resident portal.</p>
                </div>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="your.email@lifehouse.org"
                            className="pl-10"
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            {...field}
                            type="password"
                            placeholder="Enter your password"
                            className="pl-10"
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>
                Need help accessing your account?{" "}
                <a href="mailto:support@lifehouse.org" className="text-green-600 hover:underline">
                  Contact IT Support
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <a href="/" className="hover:text-green-600">
            ← Back to Homepage
          </a>
        </div>
      </div>
    </div>
  );
}