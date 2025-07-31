import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'CaseManager' | 'Resident' | 'Intake' | 'Partner' | 'Auditor';
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  profileImageUrl?: string;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error
  };
}