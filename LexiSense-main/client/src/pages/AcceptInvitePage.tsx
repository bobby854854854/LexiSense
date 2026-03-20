import { useState, useEffect } from 'react'
import { useLocation, useRoute } from 'wouter'
import { UserPlus, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface InvitationData {
  id: string
  email: string
  organizationName: string
  inviterName: string
  expiresAt: string
  status: 'valid' | 'expired' | 'used' | 'invalid'
}

export default function AcceptInvitePage() {
  const [, setLocation] = useLocation()
  const [match, params] = useRoute('/accept-invite')
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
  })

  const token = new URLSearchParams(window.location.search).get('token')

  useEffect(() => {
    if (!token) {
      setLocation('/')
      return
    }
    validateInvitation()
  }, [token])

  const validateInvitation = async () => {
    try {
      setLoading(true)
      // Mock validation - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock invitation data
      setInvitation({
        id: '1',
        email: 'newuser@company.com',
        organizationName: 'Acme Corporation',
        inviterName: 'John Doe',
        expiresAt: '2024-02-15T23:59:59Z',
        status: 'valid',
      })
    } catch (error) {
      toast.error('Failed to validate invitation')
      setInvitation({
        id: '',
        email: '',
        organizationName: '',
        inviterName: '',
        expiresAt: '',
        status: 'invalid',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    try {
      setAccepting(true)
      // Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast.success('Welcome to LexiSense! Your account has been created.')
      setLocation('/dashboard')
    } catch (error) {
      toast.error('Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Validating invitation...</p>
        </div>
      </div>
    )
  }

  if (!invitation || invitation.status !== 'valid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Invalid Invitation
              </h2>
              <p className="text-gray-600 mb-6">
                This invitation link is invalid, expired, or has already been
                used.
              </p>
              <Button onClick={() => setLocation('/')} className="w-full">
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            Join {invitation.organizationName}
          </CardTitle>
          <p className="text-gray-600">
            {invitation.inviterName} has invited you to join their team on
            LexiSense
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAcceptInvitation} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                type="email"
                value={invitation.email}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                type="password"
                placeholder="Create a password (min. 8 characters)"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <Input
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                accepting ||
                !formData.name ||
                !formData.password ||
                !formData.confirmPassword
              }
            >
              {accepting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept Invitation
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              Invitation expires on{' '}
              {new Date(invitation.expiresAt).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
