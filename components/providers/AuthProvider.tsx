'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginRequest, ApiResponse } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/auth/me');
      if (response.ok) {
        const data: ApiResponse<User> = await response.json();
        if (data.success && data.data) {
          setUser(data.data);
        }
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data: ApiResponse<User> = await response.json();

      if (response.ok && data.success && data.data) {
        setUser(data.data);
        return true;
      } else {
        setError(data.error || 'Login failed');
        return false;
      }
    } catch (err) {
      setError('An error occurred during login');
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, checkAuth }}>
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