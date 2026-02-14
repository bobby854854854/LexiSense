// client/src/contexts/AuthContext.tsx - Enterprise Auth Context (MVP)
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://lexisense-api.onrender.com';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  roles: string[];
  isAuthenticated: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('lexisense_token');
    const storedUser = localStorage.getItem('lexisense_user');
    const storedRoles = localStorage.getItem('lexisense_roles');
    
    if (storedToken && storedUser) {
      setAccessToken(storedToken);
      setUser(JSON.parse(storedUser));
      setRoles(storedRoles ? JSON.parse(storedRoles) : []);
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      
      // Store auth data
      const token = data.token || data.accessToken;
      const userData = data.user || { id: data.id, email: data.email, name: data.name };
      const userRoles = data.roles || [];

      setAccessToken(token);
      setUser(userData);
      setRoles(userRoles);

      // Persist to localStorage
      localStorage.setItem('lexisense_token', token);
      localStorage.setItem('lexisense_user', JSON.stringify(userData));
      localStorage.setItem('lexisense_roles', JSON.stringify(userRoles));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = (): void => {
    setAccessToken(null);
    setUser(null);
    setRoles([]);
    
    localStorage.removeItem('lexisense_token');
    localStorage.removeItem('lexisense_user');
    localStorage.removeItem('lexisense_roles');
  };

  const hasRole = (role: string): boolean => {
    return roles.includes(role);
  };

  const isAuthenticated = !!(accessToken && user);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        roles, 
        isAuthenticated, 
        accessToken, 
        login, 
        logout, 
        hasRole 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};