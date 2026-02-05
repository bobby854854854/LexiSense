import { Route, Switch } from 'wouter'
import { Toaster } from 'sonner'

function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">LexiSense</h1>
        <p className="text-xl text-gray-600 mb-8">
          AI-powered Contract Lifecycle Management Platform
        </p>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">🚀 Beta Coming Soon</h2>
          <p className="text-gray-600">
            Enterprise-grade contract management with AI-powered analysis, 
            team collaboration, and advanced security features.
          </p>
        </div>
      </div>
    </div>
  )
}

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>
        <p className="text-center text-gray-600">Beta access coming soon!</p>
      </div>
    </div>
  )
}

export function App() {
  return (
    <>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/login" component={LoginPage} />
        <Route component={HomePage} />
      </Switch>
      <Toaster />
    </>
  )
}