
import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import TeamMemberList from '@/components/features/team/TeamMemberList'
import InvitationsList from '@/components/features/team/InvitationsList'
import InviteMemberDialog from '@/components/features/team/InviteMemberDialog'
import { useAuth } from '@/hooks/useAuth'
import { UserPlus, Loader2, Users } from 'lucide-react'
import { api } from '@/lib/api'
import type { TeamMember, InvitationWithCreator } from '@shared/types'
import { toast } from 'sonner'

export default function TeamPage() {
  const { user } = useAuth()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<InvitationWithCreator[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    fetchTeamData()
  }, [])

  const fetchTeamData = async () => {
    try {
      setLoading(true)
      const [membersData, invitationsData] = await Promise.all([
        api.getTeamMembers(),
        isAdmin ? api.getInvitations() : Promise.resolve([]),
      ])
      setMembers(membersData)
      setInvitations(invitationsData)
    } catch (error) {
      toast.error('Failed to load team data')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteSuccess = () => {
    fetchTeamData()
  }

  const handleMemberUpdated = () => {
    fetchTeamData()
  }

  const handleInvitationCancelled = () => {
    fetchTeamData()
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team</h1>
            <p className="mt-2 text-gray-600">
              Manage your organization's team members and invitations
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowInviteDialog(true)}
              className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </button>
          )}
        </div>

        {/* Admin Notice */}
        {!isAdmin && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Only administrators can invite new members or manage team roles.
              Contact your organization admin if you need to make changes.
            </p>
          </div>
        )}

        {/* Pending Invitations */}
        {isAdmin && invitations.length > 0 && (
          <InvitationsList
            invitations={invitations}
            onInvitationCancelled={handleInvitationCancelled}
          />
        )}

        {/* Team Members */}
        <TeamMemberList members={members} onMemberUpdated={handleMemberUpdated} />

        {/* Role Descriptions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Role Descriptions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="text-sm font-semibold text-purple-900 mb-2">Admin</h3>
              <p className="text-xs text-purple-800">
                Full access to all features including uploading contracts, viewing analysis,
                inviting team members, and managing roles.
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Member</h3>
              <p className="text-xs text-blue-800">
                Can upload contracts, view all contracts and analysis, and chat with contracts.
                Cannot manage team members or roles.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Viewer</h3>
              <p className="text-xs text-gray-800">
                Read-only access to view contracts and analysis. Cannot upload new contracts
                or manage team members.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Dialog */}
      <InviteMemberDialog
        isOpen={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        onInviteSuccess={handleInviteSuccess}
      />
    </Layout>
  )
}