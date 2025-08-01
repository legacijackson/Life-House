export interface User {
  id: string;
  role: string;
  name: string;
  email: string;
}

export const getCurrentUser = (): User | null => {
  // Check if user has a valid token and is actually logged in
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const userData = localStorage.getItem('userData');
  
  // Only return user if they have proper authentication tokens
  if (token && userRole && userData) {
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }
  
  return null;
};

export const hasRole = (user: User | null, roles: string[]): boolean => {
  return user ? roles.includes(user.role) : false;
};

export const canAccessResident = (user: User | null, residentId: string): boolean => {
  if (!user) return false;
  
  // Admin can access all residents
  if (user.role === "Admin") return true;
  
  // Case managers can access their assigned residents
  // In a real implementation, check assignment table
  if (user.role === "CaseManager") return true;
  
  // Intake can access residents during onboarding
  if (user.role === "Intake") return true;
  
  return false;
};
