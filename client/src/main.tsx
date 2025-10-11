import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({ error }: { error?: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-4">
          {error?.message || "We're sorry, but something unexpected happened."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Reload page
        </button>
      </div>
    </div>
  )
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

try {
  createRoot(rootElement).render(
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <App />
    </ErrorBoundary>
  )
} catch (error) {
  console.error('Failed to render app:', error)
  rootElement.innerHTML =
    '<div style="padding: 20px; text-align: center;"><h1>Application failed to load</h1><p>Please refresh the page</p></div>'
}
