// client/src/contexts/AuthContext.tsx - Enterprise SSO + RBAC
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'legal' | 'sales' | 'admin' | 'finance';
  tier: 'core' | 'pro' | 'enterprise';
  orgId: string;
  aiUsage: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  ssoLogin: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('lexisense_token');
    if (token) {
      validateToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/validate`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('lexisense_token', token);
      }
    } catch {
      localStorage.removeItem('lexisense_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    localStorage.setItem('lexisense_token', data.token);
    setUser(data.user);
  };

  const ssoLogin = async (token: string) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/sso`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const data = await response.json();
    localStorage.setItem('lexisense_token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('lexisense_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, ssoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};