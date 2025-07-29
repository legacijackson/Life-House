export interface User {
  id: string;
  role: string;
  name: string;
  email: string;
}

export const getCurrentUser = (): User | null => {
  // In a real implementation, this would validate JWT tokens
  // For now, return a mock user for development
  return {
    id: "cm-user-1",
    role: "CaseManager",
    name: "Sarah Martinez",
    email: "sarah.martinez@example.com"
  };
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
