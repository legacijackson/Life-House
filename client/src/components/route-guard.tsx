import { useLocation, useRoute } from 'wouter';
import { hasPermission, getAccessibleRoutes, useCurrentUser } from '@/lib/rbac';
import { Loader2 } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not authenticated
    if (location !== '/') {
      setLocation('/');
    }
    return null;
  }

  // Get accessible routes for the user's role
  const accessibleRoutes = getAccessibleRoutes(user.role);

  // Check if current route is accessible
  const isAccessible = accessibleRoutes.some(route => 
    location.startsWith(route) || location === route
  );

  if (!isAccessible) {
    // Redirect to appropriate dashboard based on role
    const defaultRoute = user.role === 'Resident' ? '/app/resident-portal' : '/app';
    setLocation(defaultRoute);
    return null;
  }

  return <>{children}</>;
}

// Portal-specific route guard
interface PortalGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  redirectTo?: string;
}

export function PortalGuard({ 
  allowedRoles, 
  children, 
  redirectTo = '/app' 
}: PortalGuardProps) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    setLocation(redirectTo);
    return null;
  }

  return <>{children}</>;
}