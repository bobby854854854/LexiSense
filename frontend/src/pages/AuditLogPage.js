import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { auditAPI } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
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
import {
  ScrollText,
  FileText,
  Users,
  Shield,
  Bell,
  Upload,
  Trash2,
  CheckCircle,
  XCircle,
  Send,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

const ACTION_CONFIG = {
  contract_uploaded: { label: 'Contract Uploaded', icon: Upload, cls: 'text-blue-500 bg-blue-500/10' },
  contract_deleted: { label: 'Contract Deleted', icon: Trash2, cls: 'text-red-500 bg-red-500/10' },
  contract_submit_for_review: { label: 'Submitted for Review', icon: Send, cls: 'text-yellow-500 bg-yellow-500/10' },
  contract_approve: { label: 'Contract Approved', icon: CheckCircle, cls: 'text-green-500 bg-green-500/10' },
  contract_reject: { label: 'Contract Rejected', icon: XCircle, cls: 'text-red-500 bg-red-500/10' },
  contract_activate: { label: 'Contract Activated', icon: CheckCircle, cls: 'text-green-500 bg-green-500/10' },
  team_invite_sent: { label: 'Team Invite Sent', icon: Users, cls: 'text-purple-500 bg-purple-500/10' },
};

const RESOURCE_ICONS = {
  contract: FileText,
  team: Users,
  template: ScrollText,
  alert: Bell,
  settings: Shield,
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resourceFilter, setResourceFilter] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [resourceFilter]);

  const fetchLogs = async () => {
    try {
      const params = { limit: 100 };
      if (resourceFilter && resourceFilter !== 'all') {
        params.resource_type = resourceFilter;
      }
      const response = await auditAPI.list(params);
      setLogs(response.data);
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="audit-page">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ScrollText className="h-8 w-8 text-primary" />
              Audit Log
            </h1>
            <p className="text-muted-foreground mt-1">Track all actions across your organization</p>
          </div>
          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger className="w-full sm:w-48" data-testid="audit-filter">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="contract">Contracts</SelectItem>
              <SelectItem value="team">Team</SelectItem>
              <SelectItem value="template">Templates</SelectItem>
              <SelectItem value="settings">Settings</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-16">
                <ScrollText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium">No audit logs yet</h3>
                <p className="text-muted-foreground mt-1">Actions will be tracked automatically</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="text-right">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const config = ACTION_CONFIG[log.action] || { label: log.action, icon: Shield, cls: 'text-gray-500 bg-gray-500/10' };
                      const Icon = config.icon;
                      const ResIcon = RESOURCE_ICONS[log.resourceType] || Shield;
                      return (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded ${config.cls}`}>
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-sm font-medium">{config.label}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{log.userEmail || 'System'}</TableCell>
                          <TableCell>
                            {log.resourceTitle && (
                              <div className="flex items-center gap-2">
                                <ResIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm truncate max-w-[200px]">{log.resourceTitle}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.details && (
                              <span className="text-xs text-muted-foreground">
                                {Object.entries(log.details)
                                  .filter(([, v]) => v)
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(', ')}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                            {formatTime(log.createdAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
