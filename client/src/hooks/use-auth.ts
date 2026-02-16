import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

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
  const { data, isLoading, error } = useQuery<any>({
    queryKey: ['/api/auth/user'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 30000,
  });

  const user = data?.user as User | null || null;

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error
  };
}
