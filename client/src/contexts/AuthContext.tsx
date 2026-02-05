import { createContext, useContext, ReactNode } from 'react';

export interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user?: { id: string; email: string }
}

export const AuthContext = createContext<AuthContextType>({ 
  isAuthenticated: false, 
  isLoading: true 
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // For now, use a simple implementation. In production, this would check auth status.
  const value: AuthContextType = {
    isAuthenticated: false,
    isLoading: false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};