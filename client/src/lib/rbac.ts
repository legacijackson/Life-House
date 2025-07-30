// Role-Based Access Control (RBAC) utilities
import React from 'react';
import { useQuery } from '@tanstack/react-query';

export type UserRole = 'Resident' | 'CaseManager' | 'Intake' | 'Admin' | 'Referrer' | 'Auditor';

interface Permission {
  resource: string;
  actions: string[];
}

// Define permissions for each role
const rolePermissions: Record<UserRole, Permission[]> = {
  Resident: [
    { resource: 'profile', actions: ['view', 'edit'] },
    { resource: 'case-notes', actions: ['view'] },
    { resource: 'resources', actions: ['view'] },
    { resource: 'maintenance', actions: ['view', 'create'] },
    { resource: 'attendance', actions: ['view'] }
  ],
  CaseManager: [
    { resource: 'residents', actions: ['view', 'edit'] },
    { resource: 'case-notes', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'attendance', actions: ['view', 'create', 'edit'] },
    { resource: 'resources', actions: ['view', 'create', 'edit'] },
    { resource: 'reports', actions: ['view', 'generate'] },
    { resource: 'maintenance', actions: ['view'] }
  ],
  Intake: [
    { resource: 'applications', actions: ['view', 'create', 'edit'] },
    { resource: 'referrals', actions: ['view', 'create', 'edit'] },
    { resource: 'residents', actions: ['view', 'create'] },
    { resource: 'case-notes', actions: ['view', 'create'] },
    { resource: 'resources', actions: ['view'] }
  ],
  Admin: [
    { resource: '*', actions: ['*'] } // Full access to everything
  ],
  Referrer: [
    { resource: 'referrals', actions: ['view', 'create', 'edit'] },
    { resource: 'resources', actions: ['view'] }
  ],
  Auditor: [
    { resource: '*', actions: ['view'] }, // Read-only access to everything
    { resource: 'reports', actions: ['view', 'generate', 'export'] }
  ]
};

// Mock current user - in production, this would come from authentication
const mockCurrentUser = {
  id: 'current-user',
  name: 'Sarah Williams',
  email: 'sarah.williams@lifehouse.org',
  role: 'CaseManager' as UserRole
};

// Hook to get current user
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      // In production, this would fetch from API
      return mockCurrentUser;
    },
    staleTime: Infinity // User data rarely changes
  });
}

// Check if user has permission for a specific action on a resource
export function hasPermission(
  userRole: UserRole,
  resource: string,
  action: string
): boolean {
  const permissions = rolePermissions[userRole];
  
  if (!permissions) return false;
  
  // Check for wildcard permissions (Admin)
  const wildcardPermission = permissions.find(p => p.resource === '*');
  if (wildcardPermission && (wildcardPermission.actions.includes('*') || wildcardPermission.actions.includes(action))) {
    return true;
  }
  
  // Check specific resource permissions
  const resourcePermission = permissions.find(p => p.resource === resource);
  if (!resourcePermission) return false;
  
  return resourcePermission.actions.includes('*') || resourcePermission.actions.includes(action);
}

// Hook to check permissions
export function usePermission(resource: string, action: string): boolean {
  const { data: user } = useCurrentUser();
  
  if (!user) return false;
  
  return hasPermission(user.role, resource, action);
}

// Component wrapper to conditionally render based on permissions
interface PermissionGateProps {
  resource: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ 
  resource, 
  action, 
  children, 
  fallback = null 
}: PermissionGateProps) {
  const hasAccess = usePermission(resource, action);
  
  return React.createElement(React.Fragment, null, hasAccess ? children : fallback);
}

// Get all accessible routes for a user role
export function getAccessibleRoutes(userRole: UserRole): string[] {
  const routes: string[] = ['/app']; // Dashboard is accessible to all
  
  if (hasPermission(userRole, 'residents', 'view')) routes.push('/app/residents');
  if (hasPermission(userRole, 'case-notes', 'view')) routes.push('/app/case-notes');
  if (hasPermission(userRole, 'attendance', 'view')) routes.push('/app/attendance');
  if (hasPermission(userRole, 'resources', 'view')) routes.push('/app/resources');
  if (hasPermission(userRole, 'applications', 'view')) routes.push('/app/intake');
  if (hasPermission(userRole, 'referrals', 'view')) routes.push('/app/referrals');
  if (hasPermission(userRole, 'reports', 'view')) routes.push('/app/reports');
  if (hasPermission(userRole, 'maintenance', 'view')) routes.push('/app/maintenance');
  if (hasPermission(userRole, 'properties', 'view')) routes.push('/app/properties');
  
  // Special portals
  if (userRole === 'Resident') routes.push('/app/resident-portal');
  if (['CaseManager', 'Intake', 'Admin'].includes(userRole)) routes.push('/app/staff-dashboard');
  if (userRole === 'Admin') routes.push('/app/admin-panel');
  
  return routes;
}

// Filter sidebar items based on permissions
export function filterSidebarItems(items: any[], userRole: UserRole): any[] {
  const accessibleRoutes = getAccessibleRoutes(userRole);
  
  return items.filter(item => {
    if (item.href) {
      return accessibleRoutes.includes(item.href);
    }
    
    // For items with children, filter the children
    if (item.items) {
      const filteredChildren = item.items.filter((child: any) => 
        accessibleRoutes.includes(child.href)
      );
      return filteredChildren.length > 0;
    }
    
    return false;
  }).map(item => {
    // If item has children, return with filtered children
    if (item.items) {
      return {
        ...item,
        items: item.items.filter((child: any) => 
          accessibleRoutes.includes(child.href)
        )
      };
    }
    return item;
  });
}