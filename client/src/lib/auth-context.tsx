import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Resident' | 'CaseManager' | 'Admin' | 'Intake' | 'Partner' | 'Guest';
  isAdmin?: boolean;
  profileImage?: string;
  createdAt: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data: userData, isLoading, refetch } = useQuery<any>({
    queryKey: ['/api/auth/user'],
    retry: false,
    select: (data) => data?.user || null,
  });

  useEffect(() => {
    if (userData) {
      setUser(userData);
    } else if (userData === null) {
      setUser(null);
    }
  }, [userData]);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Login failed');
    }

    const data = await response.json();
    
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    
    setUser(data.user);
    queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('token'); // Remove legacy token key if it exists
    setUser(null);
    queryClient.clear();
    window.location.href = '/';
  };

  const refetchUser = () => {
    refetch();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}