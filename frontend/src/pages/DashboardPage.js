import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { dashboardAPI } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import {
  FileText,
  AlertTriangle,
  Clock,
  Users,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, description, color = 'primary' }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}/10`}>
          <Icon className={`h-6 w-6 text-${color}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const RiskBadge = ({ level }) => {
  const colors = {
    high: 'bg-red-500/10 text-red-500 border-red-500/20',
    medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    low: 'bg-green-500/10 text-green-500 border-green-500/20',
  };
  return (
    <Badge variant="outline" className={colors[level] || colors.low}>
      {level || 'Unknown'}
    </Badge>
  );
};

const StatusBadge = ({ status }) => {
  const colors = {
    active: 'bg-green-500/10 text-green-500',
    draft: 'bg-blue-500/10 text-blue-500',
    expired: 'bg-gray-500/10 text-gray-500',
    pending: 'bg-yellow-500/10 text-yellow-500',
    review: 'bg-orange-500/10 text-orange-500',
    approved: 'bg-emerald-500/10 text-emerald-500',
  };
  const labels = { review: 'In Review', approved: 'Approved' };
  return (
    <Badge variant="secondary" className={colors[status] || colors.draft}>
      {labels[status] || status || 'Draft'}
    </Badge>
  );
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const overview = stats?.overview || {};

  return (
    <Layout>
      <div className="space-y-8" data-testid="dashboard-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your contract portfolio</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Contracts"
            value={overview.totalContracts || 0}
            icon={FileText}
            color="primary"
          />
          <StatCard
            title="Active Contracts"
            value={overview.activeContracts || 0}
            icon={TrendingUp}
            description="Currently in effect"
            color="green-500"
          />
          <StatCard
            title="Expiring Soon"
            value={overview.expiringSoon || 0}
            icon={Clock}
            description="Next 30 days"
            color="yellow-500"
          />
          <StatCard
            title="High Risk"
            value={overview.highRisk || 0}
            icon={AlertTriangle}
            description="Requires attention"
            color="red-500"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Contracts */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold">Recent Contracts</CardTitle>
              <Link
                to="/contracts"
                className="text-sm text-primary hover:underline flex items-center gap-1"
                data-testid="view-all-contracts"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {stats?.recentContracts?.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentContracts.map((contract) => (
                    <Link
                      key={contract.id}
                      to={`/contracts/${contract.id}`}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{contract.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {contract.counterparty || 'No counterparty'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={contract.status} />
                        {contract.riskLevel && <RiskBadge level={contract.riskLevel} />}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">No contracts yet</p>
                  <Link
                    to="/contracts"
                    className="text-primary hover:underline text-sm mt-2 inline-block"
                  >
                    Upload your first contract
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats Sidebar */}
          <div className="space-y-6">
            {/* Team Members */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{overview.teamMembers || 1}</p>
                <p className="text-sm text-muted-foreground">Team members</p>
                <Link
                  to="/team"
                  className="text-sm text-primary hover:underline mt-3 inline-block"
                  data-testid="manage-team"
                >
                  Manage team
                </Link>
              </CardContent>
            </Card>

            {/* Contract Types */}
            {stats?.byType && Object.keys(stats.byType).length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">By Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(stats.byType).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{type}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Risk Distribution */}
            {stats?.byRisk && Object.keys(stats.byRisk).length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Risk Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(stats.byRisk).map(([level, count]) => (
                      <div key={level} className="flex justify-between items-center">
                        <RiskBadge level={level} />
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
