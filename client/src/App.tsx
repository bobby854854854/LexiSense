// client/src/App.tsx - Enterprise Shell + Routing
import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { Toaster } from 'sonner';
import { useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import LandingPage from './components/LandingPage';
import Dashboard from './pages/Dashboard/Dashboard';
import AIPilot from './pages/AIPilot/AIPilot';
import Contracts from './pages/Contracts/Contracts';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Navigation />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
          marginLeft: '260px', // Match drawer width
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      
      <Routes>
        {/* Public route - Landing Page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Protected routes with layout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/ai-pilot"
          element={
            <ProtectedRoute>
              <AppLayout>
                <AIPilot />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/contracts"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Contracts />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;