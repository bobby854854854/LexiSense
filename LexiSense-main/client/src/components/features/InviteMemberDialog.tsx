import { useEffect, useRef, useState, type FormEvent } from 'react'
import { X, Loader2, UserPlus, Mail, Copy, Check } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { UserRole } from '@shared/types'

interface InviteMemberDialogProps {
  isOpen: boolean
  onClose: () => void
  onInviteSuccess: () => void
}

export default function InviteMemberDialog({
  isOpen,
  onClose,
  onInviteSuccess,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('member')
  const [isLoading, setIsLoading] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const copyResetTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyResetTimeoutId.current) clearTimeout(copyResetTimeoutId.current)
    }
  }, [])

  if (!isOpen) return null

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const invitation = await api.inviteMember({ email, role })
      setInviteUrl(invitation.inviteUrl ?? null)
      toast.success('Invitation sent successfully')
      onInviteSuccess()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to send invitation'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyUrl = async () => {
    if (!inviteUrl) return

    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      toast.success('Invite link copied to clipboard')

      if (copyResetTimeoutId.current) clearTimeout(copyResetTimeoutId.current)
      copyResetTimeoutId.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy invite link')
    }
  }

  const handleClose = () => {
    if (copyResetTimeoutId.current) {
      clearTimeout(copyResetTimeoutId.current)
      copyResetTimeoutId.current = null
    }
    setEmail('')
    setRole('member')
    setInviteUrl(null)
    setCopied(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <UserPlus className="w-5 h-5 mr-2 text-primary" />
                Invite Team Member
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!inviteUrl ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="colleague@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Role
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="member">
                      Member - Can upload and view contracts
                    </option>
                    <option value="viewer">Viewer - Read-only access</option>
                    <option value="admin">
                      Admin - Full access including team management
                    </option>
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    The invited user will receive an email with a link to join
                    your organization. The invitation expires in 7 days.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Send Invitation
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 mb-2">
                    ✓ Invitation created successfully!
                  </p>
                  <p className="text-xs text-green-700">
                    Share the link below with <strong>{email}</strong>
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="invite-url"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Invitation Link
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      id="invite-url"
                      type="text"
                      value={inviteUrl}
                      readOnly
                      aria-label="Invitation URL"
                      className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm"
                    />
                    <button
                      onClick={handleCopyUrl}
                      aria-label="Copy invitation link"
                      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
