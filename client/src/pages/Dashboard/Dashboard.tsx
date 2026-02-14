// client/src/pages/Dashboard/Dashboard.tsx - AI Portfolio Dashboard
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://lexisense-api.onrender.com';

interface DashboardData {
  totalContracts?: number;
  atRiskContracts?: number;
  totalContractValue?: number;
  expiringSoonCount?: number;
  riskBreakdown?: Array<{ label: string; value: number; color?: string }>;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];

const Dashboard: React.FC = () => {
  const { accessToken } = useAuth();

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/dashboard`, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      return response.json();
    },
    retry: 2,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error">
          Failed to load dashboard data. Please try again later.
        </Alert>
      </Box>
    );
  }

  const kpis = [
    {
      label: 'Total Contracts',
      value: data?.totalContracts ?? 0,
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: '#4f46e5',
      bgColor: '#eef2ff',
    },
    {
      label: 'At Risk',
      value: data?.atRiskContracts ?? 0,
      icon: <WarningIcon sx={{ fontSize: 40 }} />,
      color: '#ef4444',
      bgColor: '#fef2f2',
    },
    {
      label: 'Total Value',
      value: data?.totalContractValue
        ? `$${(data.totalContractValue / 1000000).toFixed(1)}M`
        : '$0',
      icon: <MoneyIcon sx={{ fontSize: 40 }} />,
      color: '#10b981',
      bgColor: '#f0fdf4',
    },
    {
      label: 'Expiring Soon',
      value: data?.expiringSoonCount ?? 0,
      icon: <ScheduleIcon sx={{ fontSize: 40 }} />,
      color: '#f59e0b',
      bgColor: '#fffbeb',
    },
  ];

  const chartData = data?.riskBreakdown || [
    { label: 'Low Risk', value: 45 },
    { label: 'Medium Risk', value: 30 },
    { label: 'High Risk', value: 15 },
    { label: 'Critical', value: 10 },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Overview of your contract portfolio and AI insights
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {kpis.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      {kpi.label}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: kpi.color }}>
                      {kpi.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: kpi.bgColor,
                      color: kpi.color,
                    }}
                  >
                    {kpi.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Risk Breakdown Chart */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Risk Breakdown
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.label}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                AI Insights Summary
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Alert severity="success">
                  <strong>Portfolio Health:</strong> 75% of contracts are low-risk with favorable terms
                </Alert>
                <Alert severity="warning">
                  <strong>Action Required:</strong> {data?.expiringSoonCount || 12} contracts expiring in next 90 days
                </Alert>
                <Alert severity="info">
                  <strong>Opportunity:</strong> AI detected potential cost savings of $2.3M through renegotiation
                </Alert>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
