import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { analyticsAPI, exportAPI, contractsAPI } from '../api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
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
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  FileText,
  AlertTriangle,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  GitCompare,
} from 'lucide-react';
import { toast } from 'sonner';

const StatCard = ({ title, value, icon: Icon, trend, trendDirection, color = 'primary' }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${trendDirection === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {trendDirection === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trend}
            </p>
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
    high: 'bg-red-500/10 text-red-500',
    medium: 'bg-yellow-500/10 text-yellow-500',
    low: 'bg-green-500/10 text-green-500',
    unassessed: 'bg-gray-500/10 text-gray-500',
  };
  return <Badge className={colors[level] || colors.unassessed}>{level}</Badge>;
};

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [compareContract1, setCompareContract1] = useState('');
  const [compareContract2, setCompareContract2] = useState('');
  const [comparing, setComparing] = useState(false);
  const [comparison, setComparison] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, contractsRes] = await Promise.all([
        analyticsAPI.getOverview(),
        contractsAPI.list({}),
      ]);
      setAnalytics(analyticsRes.data);
      setContracts(contractsRes.data);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const response = await exportAPI.analyticsPDF();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'lexisense_analytics_report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report downloaded');
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const handleCompare = async () => {
    if (!compareContract1 || !compareContract2) {
      toast.error('Please select two contracts to compare');
      return;
    }
    if (compareContract1 === compareContract2) {
      toast.error('Please select different contracts');
      return;
    }
    
    setComparing(true);
    try {
      const response = await analyticsAPI.compare(compareContract1, compareContract2);
      setComparison(response.data);
    } catch (error) {
      toast.error('Failed to compare contracts');
    } finally {
      setComparing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </Layout>
    );
  }

  const summary = analytics?.summary || {};
  const expiring = analytics?.expiring || {};
  const riskDist = analytics?.riskDistribution || {};

  return (
    <Layout>
      <div className="space-y-6" data-testid="analytics-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              Analytics
            </h1>
            <p className="text-muted-foreground mt-1">Insights and reports for your contract portfolio</p>
          </div>
          <Button onClick={handleExportPDF} disabled={exporting} data-testid="export-pdf-btn">
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export PDF Report
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Contracts" value={summary.totalContracts || 0} icon={FileText} color="primary" />
          <StatCard title="Active" value={summary.activeContracts || 0} icon={TrendingUp} color="green-500" />
          <StatCard title="High Risk" value={riskDist.high || 0} icon={AlertTriangle} color="red-500" />
          <StatCard title="Team Members" value={summary.teamMembers || 0} icon={Users} color="blue-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expiration Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Expiration Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/10">
                  <div>
                    <p className="font-medium">Next 7 Days</p>
                    <p className="text-sm text-muted-foreground">Critical attention needed</p>
                  </div>
                  <span className="text-2xl font-bold text-red-500">{expiring.next7Days || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-500/10">
                  <div>
                    <p className="font-medium">Next 30 Days</p>
                    <p className="text-sm text-muted-foreground">Plan for review</p>
                  </div>
                  <span className="text-2xl font-bold text-yellow-500">{expiring.next30Days || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10">
                  <div>
                    <p className="font-medium">Next 90 Days</p>
                    <p className="text-sm text-muted-foreground">Monitor upcoming</p>
                  </div>
                  <span className="text-2xl font-bold text-green-500">{expiring.next90Days || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Risk Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(riskDist).map(([level, count]) => {
                  const total = Object.values(riskDist).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                  const colors = {
                    high: 'bg-red-500',
                    medium: 'bg-yellow-500',
                    low: 'bg-green-500',
                    unassessed: 'bg-gray-500',
                  };
                  return (
                    <div key={level}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium capitalize">{level}</span>
                        <span className="text-sm text-muted-foreground">{count} ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${colors[level] || colors.unassessed}`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* By Type */}
          <Card>
            <CardHeader>
              <CardTitle>Contracts by Type</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.byType?.length > 0 ? (
                <div className="space-y-3">
                  {analytics.byType.map((item) => (
                    <div key={item.type} className="flex justify-between items-center">
                      <span className="text-sm">{item.type}</span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Top Uploaders */}
          <Card>
            <CardHeader>
              <CardTitle>Top Uploaders</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.topUploaders?.length > 0 ? (
                <div className="space-y-3">
                  {analytics.topUploaders.map((item, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.user}</p>
                        <p className="text-xs text-muted-foreground">{item.email}</p>
                      </div>
                      <Badge>{item.uploads} uploads</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contract Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Contract Comparison
            </CardTitle>
            <CardDescription>Compare two contracts side by side</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Select value={compareContract1} onValueChange={setCompareContract1}>
                <SelectTrigger className="w-full sm:w-64" data-testid="compare-contract-1">
                  <SelectValue placeholder="Select first contract" />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={compareContract2} onValueChange={setCompareContract2}>
                <SelectTrigger className="w-full sm:w-64" data-testid="compare-contract-2">
                  <SelectValue placeholder="Select second contract" />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleCompare} disabled={comparing} data-testid="compare-btn">
                {comparing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitCompare className="mr-2 h-4 w-4" />}
                Compare
              </Button>
            </div>

            {comparison && (
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-3 bg-muted">
                  <div className="p-3 font-medium border-r">Field</div>
                  <div className="p-3 font-medium border-r">{comparison.contract1?.title}</div>
                  <div className="p-3 font-medium">{comparison.contract2?.title}</div>
                </div>
                {['contractType', 'status', 'riskLevel', 'counterparty', 'value', 'effectiveDate', 'expiryDate'].map((field) => (
                  <div key={field} className="grid grid-cols-3 border-t">
                    <div className="p-3 bg-muted/50 border-r capitalize">{field.replace(/([A-Z])/g, ' $1')}</div>
                    <div className="p-3 border-r">
                      {field === 'riskLevel' && comparison.contract1?.[field] ? (
                        <RiskBadge level={comparison.contract1[field]} />
                      ) : (
                        comparison.contract1?.[field] || '-'
                      )}
                    </div>
                    <div className="p-3">
                      {field === 'riskLevel' && comparison.contract2?.[field] ? (
                        <RiskBadge level={comparison.contract2[field]} />
                      ) : (
                        comparison.contract2?.[field] || '-'
                      )}
                    </div>
                  </div>
                ))}
                {comparison.differences?.length > 0 && (
                  <div className="p-4 bg-yellow-500/10 border-t">
                    <p className="font-medium text-yellow-600 mb-2">Key Differences:</p>
                    <ul className="text-sm space-y-1">
                      {comparison.differences.map((diff, i) => (
                        <li key={i}>• {diff.field}: "{diff.contract1 || 'N/A'}" vs "{diff.contract2 || 'N/A'}"</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
