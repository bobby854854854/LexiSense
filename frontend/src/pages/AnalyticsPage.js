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
  TrendingUp,
  Download,
  FileText,
  AlertTriangle,
  Users,
  Clock,
  Loader2,
  GitCompare,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import { toast } from 'sonner';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
const RISK_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981', unassessed: '#6b7280' };

const RiskBadge = ({ level }) => {
  const colors = {
    high: 'bg-red-500/10 text-red-500',
    medium: 'bg-yellow-500/10 text-yellow-500',
    low: 'bg-green-500/10 text-green-500',
    unassessed: 'bg-gray-500/10 text-gray-500',
  };
  return <Badge className={colors[level] || colors.unassessed}>{level}</Badge>;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-medium text-foreground">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="mt-1">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
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

  // Chart data
  const riskPieData = Object.entries(riskDist)
    .filter(([, count]) => count > 0)
    .map(([level, count]) => ({ name: level.charAt(0).toUpperCase() + level.slice(1), value: count, fill: RISK_COLORS[level] }));

  const typeBarData = (analytics?.byType || []).map((item) => ({
    name: item.type.length > 12 ? item.type.slice(0, 12) + '...' : item.type,
    count: item.count,
  }));

  const trendLineData = (analytics?.monthlyTrend || []).map((item) => ({
    month: item.month,
    contracts: item.count,
  }));

  const statusData = [
    { name: 'Active', value: summary.activeContracts || 0, fill: '#10b981' },
    { name: 'Draft', value: summary.draftContracts || 0, fill: '#3b82f6' },
    { name: 'Expired', value: summary.expiredContracts || 0, fill: '#6b7280' },
  ].filter((d) => d.value > 0);

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Contracts', val: summary.totalContracts || 0, icon: FileText, cls: 'text-primary bg-primary/10' },
            { label: 'Active', val: summary.activeContracts || 0, icon: TrendingUp, cls: 'text-green-500 bg-green-500/10' },
            { label: 'High Risk', val: riskDist.high || 0, icon: AlertTriangle, cls: 'text-red-500 bg-red-500/10' },
            { label: 'Team Members', val: summary.teamMembers || 0, icon: Users, cls: 'text-blue-500 bg-blue-500/10' },
          ].map(({ label, val, icon: Icon, cls }) => (
            <Card key={label} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="text-2xl sm:text-3xl font-bold mt-1">{val}</p>
                  </div>
                  <div className={`p-2 sm:p-3 rounded-lg ${cls}`}>
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Distribution Pie */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Risk Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {riskPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={riskPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {riskPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                  No risk data available yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contracts by Type Bar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contracts by Type</CardTitle>
            </CardHeader>
            <CardContent>
              {typeBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={typeBarData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Contracts" radius={[4, 4, 0, 0]}>
                      {typeBarData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                  No type data available yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Trend Line */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {trendLineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={trendLineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="contracts" name="Contracts" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                  No trend data available yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expiration Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Expiration Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Next 7 Days', val: expiring.next7Days || 0, cls: 'bg-red-500/10 text-red-500' },
                  { label: 'Next 30 Days', val: expiring.next30Days || 0, cls: 'bg-yellow-500/10 text-yellow-500' },
                  { label: 'Next 90 Days', val: expiring.next90Days || 0, cls: 'bg-green-500/10 text-green-500' },
                ].map(({ label, val, cls }) => (
                  <div key={label} className={`flex items-center justify-between p-4 rounded-lg ${cls.split(' ')[0]}`}>
                    <p className="font-medium text-sm sm:text-base">{label}</p>
                    <span className={`text-xl sm:text-2xl font-bold ${cls.split(' ')[1]}`}>{val}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status Breakdown Pie */}
          {statusData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Top Uploaders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Uploaders</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.topUploaders?.length > 0 ? (
                <div className="space-y-3">
                  {analytics.topUploaders.map((item, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="min-w-0 mr-3">
                        <p className="font-medium truncate">{item.user}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.email}</p>
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
              <div className="border rounded-lg overflow-x-auto">
                <div className="grid grid-cols-3 bg-muted min-w-[500px]">
                  <div className="p-3 font-medium border-r">Field</div>
                  <div className="p-3 font-medium border-r truncate">{comparison.contract1?.title}</div>
                  <div className="p-3 font-medium truncate">{comparison.contract2?.title}</div>
                </div>
                {['contractType', 'status', 'riskLevel', 'counterparty', 'value', 'effectiveDate', 'expiryDate'].map((field) => (
                  <div key={field} className="grid grid-cols-3 border-t min-w-[500px]">
                    <div className="p-3 bg-muted/50 border-r capitalize text-sm">{field.replace(/([A-Z])/g, ' $1')}</div>
                    <div className="p-3 border-r text-sm">
                      {field === 'riskLevel' && comparison.contract1?.[field] ? (
                        <RiskBadge level={comparison.contract1[field]} />
                      ) : (
                        comparison.contract1?.[field] || '-'
                      )}
                    </div>
                    <div className="p-3 text-sm">
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
                        <li key={i}>{diff.field}: "{diff.contract1 || 'N/A'}" vs "{diff.contract2 || 'N/A'}"</li>
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
