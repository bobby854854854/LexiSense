
import { useState } from 'react'
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

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const invitation = await api.inviteMember({ email, role })
      setInviteUrl((invitation as any).inviteUrl || null)
      toast.success('Invitation sent successfully')
      onInviteSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send invitation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyUrl = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      toast.success('Invite link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setEmail('')
    setRole('member')
    setInviteUrl(null)
    setCopied(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleClose} />

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
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!inviteUrl ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="member">Member - Can upload and view contracts</option>
                    <option value="viewer">Viewer - Read-only access</option>
                    <option value="admin">Admin - Full access including team management</option>
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    The invited user will receive an email with a link to join your organization.
                    The invitation expires in 7 days.
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invitation Link
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={inviteUrl}
                      readOnly
                      className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm"
                    />
                    <button
                      onClick={handleCopyUrl}
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

// File: client/src/components/features/team/TeamMemberList.tsx
import { useState } from 'react'
import { Users, MoreVertical, Trash2, Shield } from 'lucide-react'
import type { TeamMember, UserRole } from '@shared/types'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { getRoleBadgeColor, formatDate } from '@/lib/utils'

interface TeamMemberListProps {
  members: TeamMember[]
  onMemberUpdated: () => void
}

export default function TeamMemberList({ members, onMemberUpdated }: TeamMemberListProps) {
  const { user } = useAuth()
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    setIsUpdating(memberId)
    try {
      await api.updateMemberRole(memberId, { role: newRole })
      toast.success('Member role updated successfully')
      onMemberUpdated()
      setOpenMenuId(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update role')
    } finally {
      setIsUpdating(null)
    }
  }

  const handleRemoveMember = async (memberId: string, email: string) => {
    if (!window.confirm(`Are you sure you want to remove ${email} from the team?`)) {
      return
    }

    setIsUpdating(memberId)
    try {
      await api.removeMember(memberId)
      toast.success('Member removed successfully')
      onMemberUpdated()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove member')
    } finally {
      setIsUpdating(null)
    }
  }

  const isCurrentUser = (memberId: string) => user?.id === memberId
  const canManage = user?.role === 'admin'

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Team Members ({members.length})
        </h2>
      </div>
      <div className="divide-y divide-gray-200">
        {members.map((member) => (
          <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-primary">
                  {member.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900">{member.email}</p>
                  {isCurrentUser(member.id) && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      You
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Joined {formatDate(member.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                {member.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
              </span>

              {canManage && !isCurrentUser(member.id) && (
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                    disabled={isUpdating === member.id}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {openMenuId === member.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                        <div className="py-1">
                          <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                            Change Role
                          </div>
                          {(['admin', 'member', 'viewer'] as UserRole[]).map((roleOption) => (
                            <button
                              key={roleOption}
                              onClick={() => handleRoleChange(member.id, roleOption)}
                              disabled={member.role === roleOption}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                            </button>
                          ))}
                          <div className="border-t border-gray-200 my-1" />
                          <button
                            onClick={() => handleRemoveMember(member.id, member.email)}
                            className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors flex items-center"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove Member
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// File: client/src/components/features/team/InvitationsList.tsx
import { Clock, Mail, X, Loader2 } from 'lucide-react'
import type { InvitationWithCreator } from '@shared/types'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { formatDateTime, getRoleBadgeColor } from '@/lib/utils'
import { useState } from 'react'

interface InvitationsListProps {
  invitations: InvitationWithCreator[]
  onInvitationCancelled: () => void
}

export default function InvitationsList({ invitations, onInvitationCancelled }: InvitationsListProps) {
  const [cancelling, setCancelling] = useState<string | null>(null)

  const handleCancel = async (id: string) => {
    setCancelling(id)
    try {
      await api.cancelInvitation(id)
      toast.success('Invitation cancelled')
      onInvitationCancelled()
    } catch (error) {
      toast.error('Failed to cancel invitation')
    } finally {
      setCancelling(null)
    }
  }

  if (invitations.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Mail className="w-5 h-5 mr-2" />
          Pending Invitations ({invitations.length})
        </h2>
      </div>
      <div className="divide-y divide-gray-200">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-900">{invitation.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Invited by {invitation.creator.email} • Expires {formatDateTime(invitation.expiresAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(invitation.role)}`}>
                {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
              </span>

              <button
                onClick={() => handleCancel(invitation.id)}
                disabled={cancelling === invitation.id}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                title="Cancel invitation"
              >
                {cancelling === invitation.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <X className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
