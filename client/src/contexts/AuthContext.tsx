import { createContext, useContext } from 'react';

export const AuthContext = createContext({ isAuthenticated: false, isLoading: false });
export const useAuth = () => useContext(AuthContext);