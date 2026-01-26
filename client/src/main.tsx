import { createRoot } from 'react-dom/client'
import { App } from './App'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

try {
  createRoot(rootElement).render(
    <AuthProvider>
      <App />
    </AuthProvider>
  )
} catch (error) {
  console.error('Failed to render app:', error)
  rootElement.innerHTML =
    '<div style="padding: 20px; text-align: center;"><h1>Application failed to load</h1><p>Please refresh the page</p></div>'
}
