// client/src/App.tsx
import { Route, Router, Switch, Redirect } from 'wouter';
import { Toaster } from 'sonner';
import { useAuth } from './hooks/useAuth';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ContractsPage from './pages/ContractsPage';
import ContractDetailPage from './pages/ContractDetailPage';
import TeamPage from './pages/TeamPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Redirect to="/login" />;
  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <Toaster position="top-right" richColors />

      <Switch>
        {/* Public routes */}
        <Route path="/login" component={LoginPage} />

        {/* Protected routes */}
        <Route path="/">
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        </Route>

        <Route path="/contracts">
          <ProtectedRoute>
            <ContractsPage />
          </ProtectedRoute>
        </Route>

        <Route path="/contracts/:id">
          <ProtectedRoute>
            <ContractDetailPage />
          </ProtectedRoute>
        </Route>

        <Route path="/team">
          <ProtectedRoute>
            <TeamPage />
          </ProtectedRoute>
        </Route>

        {/* Fallback */}
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;