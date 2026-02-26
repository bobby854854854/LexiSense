// client/src/contexts/AuthContext.tsx - Enterprise Auth Context (MVP)
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { API_BASE_URL } from '../constants'

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  roles: string[]
  isAuthenticated: boolean
  accessToken: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hasRole: (role: string) => boolean
}

interface LoginErrorResponse {
  message?: string
  error?: string
  errors?: string[]
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [roles, setRoles] = useState<string[]>([])

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('lexisense_token')
    const storedUser = localStorage.getItem('lexisense_user')
    const storedRoles = localStorage.getItem('lexisense_roles')

    if (storedToken && storedUser) {
      setAccessToken(storedToken)
      setUser(JSON.parse(storedUser))
      setRoles(storedRoles ? JSON.parse(storedRoles) : [])
    }
  }, [])

  const login = async (email: string, password: string): Promise<void> => {
    // Client-side validation
    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()

    if (!trimmedEmail) {
      throw new Error('Email is required')
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      throw new Error('Invalid email format')
    }

    if (!trimmedPassword) {
      throw new Error('Password is required')
    }

    if (trimmedPassword.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }

    try {
      const response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          password: trimmedPassword,
        }),
      })

      if (!response.ok) {
        let errorMessage = 'Login failed'

        try {
          const errorData: LoginErrorResponse = await response.json()

          // Handle different error response formats
          if (errorData.message) {
            errorMessage = errorData.message
          } else if (errorData.error) {
            errorMessage = errorData.error
          } else if (
            errorData.errors &&
            Array.isArray(errorData.errors) &&
            errorData.errors.length > 0
          ) {
            errorMessage = errorData.errors.join(', ')
          } else if (response.status === 401) {
            errorMessage = 'Invalid email or password'
          } else if (response.status === 403) {
            errorMessage = 'Account access denied'
          } else if (response.status >= 500) {
            errorMessage = 'Server error. Please try again later'
          }
        } catch {
          // If error response is not JSON, use status-based messages
          if (response.status === 401) {
            errorMessage = 'Invalid email or password'
          } else if (response.status === 403) {
            errorMessage = 'Account access denied'
          } else if (response.status >= 500) {
            errorMessage = 'Server error. Please try again later'
          }
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()

      // Store auth data
      const token = data.token || data.accessToken
      const userData = data.user || {
        id: data.id,
        email: data.email,
        name: data.name,
      }
      const userRoles = data.roles || []

      setAccessToken(token)
      setUser(userData)
      setRoles(userRoles)

      // Persist to localStorage
      localStorage.setItem('lexisense_token', token)
      localStorage.setItem('lexisense_user', JSON.stringify(userData))
      localStorage.setItem('lexisense_roles', JSON.stringify(userRoles))
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = (): void => {
    setAccessToken(null)
    setUser(null)
    setRoles([])

    localStorage.removeItem('lexisense_token')
    localStorage.removeItem('lexisense_user')
    localStorage.removeItem('lexisense_roles')
  }

  const hasRole = (role: string): boolean => {
    return roles.includes(role)
  }

  const isAuthenticated = !!(accessToken && user)

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        isAuthenticated,
        accessToken,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
