import { Switch, Route, RouteComponentProps } from 'wouter'
import { Toaster } from '@/components/ui/sonner'
import { useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ContractDetailPage } from './pages/ContractDetailPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { MainLayout } from './components/layout/MainLayout'

export function App() {
  const { isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return null
  }

  return (
    <>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/login" component={LoginPage} />

        {/* Protected Routes */}
        <ProtectedRoute
          path="/dashboard"
          isAuthenticated={isAuthenticated}
          component={() => (
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          )}
        />

        <ProtectedRoute
          path="/contracts/:id"
          isAuthenticated={isAuthenticated}
          component={(params) => (
            <MainLayout>
              <ContractDetailPage id={params.id} />
            </MainLayout>
          )}
        />

        <Route>
          <NotFoundPage />
        </Route>
      </Switch>
      <Toaster />
    </>
  )
}