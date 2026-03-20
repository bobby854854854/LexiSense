import { useState, useEffect } from 'react'
import { Users, Mail, Plus, Trash2, UserCheck, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface TeamMember {
  id: string
  email: string
  name?: string
  role: string
  status: 'active' | 'pending'
  joinedAt: string
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    try {
      // Mock data for now - replace with actual API call
      setMembers([
        {
          id: '1',
          email: 'admin@company.com',
          name: 'Admin User',
          role: 'admin',
          status: 'active',
          joinedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          email: 'user@company.com',
          name: 'Team Member',
          role: 'member',
          status: 'active',
          joinedAt: '2024-01-20T14:30:00Z',
        },
        {
          id: '3',
          email: 'pending@company.com',
          role: 'member',
          status: 'pending',
          joinedAt: '2024-02-01T09:15:00Z',
        },
      ])
    } catch (error) {
      toast.error('Failed to load team members')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    try {
      setInviting(true)
      // Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
      fetchTeamMembers()
    } catch (error) {
      toast.error('Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return

    try {
      // Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      setMembers((prev) => prev.filter((m) => m.id !== memberId))
      toast.success('Team member removed')
    } catch (error) {
      toast.error('Failed to remove team member')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Active
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRoleDisplay = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-2">
            Manage your team members and invitations
          </p>
        </div>
      </div>

      {/* Invite Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Invite Team Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex gap-4">
            <Input
              type="email"
              placeholder="Enter email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={inviting || !inviteEmail.trim()}>
              {inviting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Send Invite
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Team Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    {member.status === 'active' ? (
                      <UserCheck className="w-5 h-5 text-primary" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">
                        {member.name || member.email}
                      </p>
                      {getStatusBadge(member.status)}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span>{member.email}</span>
                      <span>•</span>
                      <span>{getRoleDisplay(member.role)}</span>
                      <span>•</span>
                      <span>
                        {member.status === 'active' ? 'Joined' : 'Invited'}{' '}
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {member.role !== 'admin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
