import { Route, Router } from 'wouter'
import { Toaster } from 'sonner'

function App() {
  return (
    <Router>
      <Toaster />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <h1 className="text-4xl font-bold text-indigo-600 mb-2">LexiSense</h1>
          <p className="text-gray-600 mb-8">Contract Intelligence Platform</p>

          <div className="bg-green-100 text-green-700 rounded-xl p-4 mb-6">
            ✅ Frontend is live and connected to backend!
          </div>

          <button
            onClick={() => alert('Login flow coming next!')}
            className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-700 transition"
          >
            Try Login (demo)
          </button>

          <p className="text-xs text-gray-400 mt-6">
            Backend: https://lexisense-api.onrender.com
            <br />
            Deployed on Vercel • {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Add real routes later */}
      <Route path="/login" component={() => <div>Login Page</div>} />
    </Router>
  )
}

export default App
