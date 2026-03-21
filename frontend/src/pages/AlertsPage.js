import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { alertsAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import {
  Bell,
  Clock,
  AlertTriangle,
  Send,
  Settings,
  History,
  Loader2,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const UrgencyBadge = ({ days }) => {
  if (days <= 7) {
    return <Badge variant="destructive">Critical - {days} days</Badge>;
  }
  if (days <= 14) {
    return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">{days} days</Badge>;
  }
  return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">{days} days</Badge>;
};

export default function AlertsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [expiringContracts, setExpiringContracts] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [settings, setSettings] = useState({ alertDays: [30, 14, 7, 1], emailEnabled: true });
  const [sendingAlerts, setSendingAlerts] = useState(false);
  const [alertDaysInput, setAlertDaysInput] = useState('30, 14, 7, 1');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expiringRes, settingsRes, historyRes] = await Promise.all([
        alertsAPI.getExpiring(60),
        alertsAPI.getSettings(),
        alertsAPI.getHistory(20),
      ]);
      setExpiringContracts(expiringRes.data.contracts || []);
      setSettings(settingsRes.data);
      setAlertDaysInput((settingsRes.data.alertDays || [30, 14, 7, 1]).join(', '));
      setAlertHistory(historyRes.data.alerts || []);
    } catch (error) {
      toast.error('Failed to load alert data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendAlerts = async () => {
    setSendingAlerts(true);
    try {
      const result = await alertsAPI.checkAndSend();
      toast.success(`${result.data.alertsSent} alert(s) sent`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send alerts');
    } finally {
      setSendingAlerts(false);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      const alertDays = alertDaysInput
        .split(',')
        .map((d) => parseInt(d.trim()))
        .filter((d) => !isNaN(d) && d > 0);

      await alertsAPI.updateSettings(alertDays, settings.emailEnabled);
      toast.success('Alert settings updated');
      setSettings({ ...settings, alertDays });
    } catch (error) {
      toast.error('Failed to update settings');
    }
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 lg:col-span-2" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="alerts-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bell className="h-8 w-8 text-primary" />
              Expiration Alerts
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor contracts approaching expiry dates
            </p>
          </div>
          {isAdmin && (
            <Button onClick={handleSendAlerts} disabled={sendingAlerts} data-testid="send-alerts-btn">
              {sendingAlerts ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Alert Emails
                </>
              )}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Expiring Contracts */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Contracts Expiring Soon
              </CardTitle>
              <CardDescription>
                {expiringContracts.length} contracts expiring in the next 60 days
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {expiringContracts.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">No contracts expiring soon</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contract</TableHead>
                      <TableHead>Counterparty</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Time Left</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiringContracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell>
                          <Link
                            to={`/contracts/${contract.id}`}
                            className="font-medium hover:text-primary transition-colors flex items-center gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            {contract.title}
                          </Link>
                        </TableCell>
                        <TableCell>{contract.counterparty || '-'}</TableCell>
                        <TableCell>{contract.expiryDate || '-'}</TableCell>
                        <TableCell>
                          <UrgencyBadge days={contract.daysRemaining} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Settings & History */}
          <div className="space-y-6">
            {/* Alert Settings */}
            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="h-5 w-5" />
                    Alert Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-enabled">Email Notifications</Label>
                    <Switch
                      id="email-enabled"
                      checked={settings.emailEnabled}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, emailEnabled: checked })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alert-days">Alert Days (comma-separated)</Label>
                    <Input
                      id="alert-days"
                      value={alertDaysInput}
                      onChange={(e) => setAlertDaysInput(e.target.value)}
                      placeholder="30, 14, 7, 1"
                    />
                    <p className="text-xs text-muted-foreground">
                      Days before expiry to send alerts
                    </p>
                  </div>
                  <Button onClick={handleUpdateSettings} className="w-full" size="sm">
                    Save Settings
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Alert History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <History className="h-5 w-5" />
                  Recent Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {alertHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No alerts sent yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {alertHistory.slice(0, 5).map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[150px]">
                            {alert.contractTitle}
                          </span>
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {alert.daysBeforeExpiry}d alert
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
