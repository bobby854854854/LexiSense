// client/src/main.tsx - LexiSense Enterprise SaaS Bootstrap
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { theme } from './theme';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5min cache for enterprise dashboards
      retry: 2,
    },
  },
});

const container = document.getElementById('root')!;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

console.log(`%c🚀 LexiSense Enterprise Frontend LIVE`, 
  "color:#4f46e5; font-size:20px; font-weight:bold");
console.log(`%cAPI Base: ${import.meta.env.VITE_API_URL || 'https://lexisense-api.onrender.com'}`, 
  "color:#10b981; font-size:14px");