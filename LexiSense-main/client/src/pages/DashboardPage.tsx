
import React from 'responsive';
import { 
  Container, Grid, Card, CardContent, Typography, Chip, 
  LinearProgress, Alert, Button 
} from '@mui/material';
import { 
  PieChart, pieChartDefaults, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveBar 
} from 'recharts';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { TrendingUp, Warning, CheckCircle } from '@mui/icons-material';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface Contract {
  id: number;
  title: string;
  status: 'active' | 'expiring' | 'risky' | 'draft';
  riskScore: number;
  endDate: string;
  value: number;
  counterparty: string;
}

const fetchDashboardData = async () => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/dashboard`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });
  return response.json();
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery(['dashboard'], fetchDashboardData);

  const riskData = [
    { name: 'Low Risk', value: data?.riskDistribution?.low || 1870, fill: '#00C49F' },
    { name: 'Medium Risk', value: data?.riskDistribution?.medium || 450, fill: '#FFBB28' },
    { name: 'High Risk', value: data?.riskDistribution?.high || 180, fill: '#FF8042' }
  ];

  const expiringContracts: Contract[] = data?.expiringSoon || [];

  const columns: GridColDef[] = [
    { field: 'title', headerName: 'Contract', flex: 2 },
    { field: 'counterparty', headerName: 'Counterparty', flex: 1 },
    { 
      field: 'riskScore', 
      headerName: 'Risk Score', 
      flex: 1,
      renderCell: (params) => (
        <Chip 
          label={`${params.value}%`}
          color={params.value > 70 ? 'error' : params.value > 40 ? 'warning' : 'success'}
          size="small"
        />
      )
    },
    { 
      field: 'endDate', 
      headerName: 'Expires', 
      flex: 1,
      renderCell: (params) => {
        const days = Math.floor((new Date(params.value).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return <Chip label={`${days}d`} color={days < 30 ? 'error' : 'default'} size="small" />;
      }
    },
    { field: 'value', headerName: 'Value', flex: 1, valueFormatter: (v) => `$${v.toLocaleString()}` }
  ];

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <Alert severity="error">Failed to load dashboard data</Alert>;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
        Contract Portfolio Overview
        <Chip label={`Tier ${user.tier}`} sx={{ ml: 2 }} />
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" sx={{ mb: 1 }}>Total Contracts</Typography>
              <Typography variant="h3">{data.totalContracts?.toLocaleString() || '2,543'}</Typography>
              <Chip icon={<TrendingUp />} label="+12% vs last month" color="success" size="small" />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" sx={{ mb: 1 }}>High Risk</Typography>
              <Typography variant="h3" color="error">{data.highRisk || 180}</Typography>
              <LinearProgress variant="determinate" value={data.highRisk / data.totalContracts * 100 || 7} color="error" />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" sx={{ mb: 1 }}>Expiring Soon</Typography>
              <Typography variant="h3" color="warning">{data.expiringSoonCount || 23}</Typography>
              <Chip icon={<Warning />} label="30 days" color="warning" size="small" />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" sx={{ mb: 1 }}>AI Insights Generated</Typography>
              <Typography variant="h3">{data.aiInteractions?.toLocaleString() || '1,247'}</Typography>
              <Chip icon={<CheckCircle />} label="This month" color="success" size="small" />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Risk Distribution */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>Risk Distribution</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Expiring Contracts Table */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Expiring Soon <Chip label={expiringContracts.length} size="small" color="warning" />
              </Typography>
              <DataGrid
                rows={expiringContracts.slice(0, 5)}
                columns={columns}
                disableRowSelectionOnClick
                autoHeight
                hideFooter
                sx={{ '& .MuiDataGrid-cell': { fontSize: '0.875rem' } }}
              />
              <Button fullWidth variant="outlined" sx={{ mt: 2 }}>
                View All Contracts →
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* AI Insights Cards */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>AI Recommendation</Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                15 contracts missing auto-renewal clauses. Use AI Co-Pilot to standardize.
              </Alert>
              <Button variant="contained" startIcon={<SmartToy />}>
                Bulk Fix with AI
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}