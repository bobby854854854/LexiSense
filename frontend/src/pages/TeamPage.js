import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { teamAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Skeleton } from '../components/ui/skeleton';
import {
  Users,
  UserPlus,
  Mail,
  MoreVertical,
  Trash2,
  Shield,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { toast } from 'sonner';

const RoleBadge = ({ role }) => {
  const colors = {
    admin: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    user: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    viewer: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  };
  return (
    <Badge variant="outline" className={colors[role] || colors.user}>
      {role}
    </Badge>
  );
};

const InviteStatusBadge = ({ status }) => {
  const configs = {
    pending: { color: 'bg-yellow-500/10 text-yellow-500', icon: Clock },
    accepted: { color: 'bg-green-500/10 text-green-500', icon: CheckCircle },
    expired: { color: 'bg-gray-500/10 text-gray-500', icon: XCircle },
  };
  const config = configs[status] || configs.pending;
  const Icon = config.icon;
  return (
    <Badge variant="secondary" className={config.color}>
      <Icon className="h-3 w-3 mr-1" />
      {status}
    </Badge>
  );
};

export default function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', role: 'user' });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      const [membersRes, invitesRes] = await Promise.all([
        teamAPI.listMembers(),
        isAdmin ? teamAPI.listInvitations() : Promise.resolve({ data: [] }),
      ]);
      setMembers(membersRes.data);
      setInvitations(invitesRes.data);
    } catch (error) {
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);

    try {
      await teamAPI.invite(inviteData.email, inviteData.role);
      toast.success(`Invitation sent to ${inviteData.email}`);
      setInviteOpen(false);
      setInviteData({ email: '', role: 'user' });
      fetchTeamData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      await teamAPI.updateRole(memberId, newRole);
      toast.success('Role updated');
      fetchTeamData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId, email) => {
    if (!window.confirm(`Remove ${email} from the team?`)) return;

    try {
      await teamAPI.removeMember(memberId);
      toast.success('Member removed');
      fetchTeamData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to remove member');
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    try {
      await teamAPI.cancelInvitation(invitationId);
      toast.success('Invitation cancelled');
      fetchTeamData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to cancel invitation');
    }
  };

  const getInitials = (member) => {
    if (member.firstName && member.lastName) {
      return `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
    }
    return member.email[0].toUpperCase();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="team-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Team</h1>
            <p className="text-muted-foreground mt-1">Manage your organization members</p>
          </div>
          {isAdmin && (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button data-testid="invite-member-btn">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your organization
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteData.email}
                      onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                      required
                      data-testid="invite-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={inviteData.role}
                      onValueChange={(value) => setInviteData({ ...inviteData, role: value })}
                    >
                      <SelectTrigger data-testid="invite-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Admin - Full access
                          </div>
                        </SelectItem>
                        <SelectItem value="user">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            User - Can manage contracts
                          </div>
                        </SelectItem>
                        <SelectItem value="viewer">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Viewer - Read-only access
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setInviteOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={inviting} data-testid="invite-submit">
                      {inviting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Invitation'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(member)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {member.firstName || member.lastName
                              ? `${member.firstName || ''} ${member.lastName || ''}`.trim()
                              : member.email.split('@')[0]}
                            {member.id === user.id && (
                              <span className="text-xs text-muted-foreground ml-2">(You)</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={member.role} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.isActive ? 'default' : 'secondary'}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.lastLogin ? formatDate(member.lastLogin) : 'Never'}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        {member.id !== user.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleUpdateRole(member.id, 'admin')}
                                disabled={member.role === 'admin'}
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                Make Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdateRole(member.id, 'user')}
                                disabled={member.role === 'user'}
                              >
                                <Users className="mr-2 h-4 w-4" />
                                Make User
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdateRole(member.id, 'viewer')}
                                disabled={member.role === 'viewer'}
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                Make Viewer
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleRemoveMember(member.id, member.email)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        {isAdmin && invitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Pending Invitations ({invitations.filter((i) => i.status === 'pending').length})
              </CardTitle>
              <CardDescription>Invitations waiting to be accepted</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium">{invite.email}</TableCell>
                      <TableCell>
                        <RoleBadge role={invite.role} />
                      </TableCell>
                      <TableCell>
                        <InviteStatusBadge status={invite.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(invite.expiresAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {invite.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCancelInvitation(invite.id)}
                          >
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
