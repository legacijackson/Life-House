import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";

export default function Home() {
  const { user } = useAuth() as { user: User | undefined };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome to Life House, {user?.firstName || user?.name || 'User'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            You are successfully logged in.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Access your main dashboard and overview
              </p>
              <Button asChild>
                <a href="/app/staff-dashboard">Go to Dashboard</a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                View and edit your profile information
              </p>
              <Button asChild variant="outline">
                <a href="/app/profile">View Profile</a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sign Out</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Sign out of your account
              </p>
              <Button asChild variant="destructive">
                <a href="/api/logout">Sign Out</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}