// client/src/components/LandingPage.tsx - Marketing + Health Check
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://lexisense-api.onrender.com';

interface PricingTier {
  name: string;
  price: string;
  features: string[];
  highlighted?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Growth',
    price: '$18K',
    features: [
      'Up to 500 contracts/year',
      'AI-powered risk analysis',
      'Basic dashboard & reporting',
      'Email support',
      '5 user seats',
    ],
  },
  {
    name: 'Scale',
    price: '$60K',
    features: [
      'Up to 2,500 contracts/year',
      'Advanced AI co-pilot',
      'Custom workflows & templates',
      'Priority support',
      '25 user seats',
      'API access',
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise Elite',
    price: '$150K',
    features: [
      'Unlimited contracts',
      'White-glove onboarding',
      'SSO & advanced RBAC',
      '99.9% SLA',
      'Dedicated CSM',
      'Custom integrations',
      'Unlimited seats',
    ],
  },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // Health check query
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) throw new Error('Health check failed');
      return response.json();
    },
    retry: 1,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getHealthStatus = () => {
    if (healthLoading) {
      return { label: 'Checking...', color: 'default' as const, icon: <CircularProgress size={16} /> };
    }
    if (healthData?.status === 'ok' || healthData?.healthy) {
      return { label: 'Backend: Online', color: 'success' as const, icon: <CheckIcon fontSize="small" /> };
    }
    return { label: 'Backend: Offline', color: 'error' as const, icon: <ErrorIcon fontSize="small" /> };
  };

  const healthStatus = getHealthStatus();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: 'white',
          borderBottom: '1px solid',
          borderColor: 'divider',
          py: 2,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              LexiSense
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Chip
                label={healthStatus.label}
                color={healthStatus.color}
                size="small"
                icon={healthStatus.icon}
              />
              <Button
                variant="outlined"
                onClick={() => navigate('/dashboard')}
                sx={{ textTransform: 'none' }}
              >
                Sign In
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box sx={{ py: 12, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto' }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                fontWeight: 800,
                mb: 3,
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              AI-Powered Contract Intelligence
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: 'text.secondary',
                mb: 4,
                fontWeight: 400,
                lineHeight: 1.6,
              }}
            >
              Transform your contract lifecycle management with enterprise-grade AI. 
              Reduce risk, accelerate reviews, and unlock insights across your entire portfolio.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/dashboard')}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.125rem',
                }}
              >
                Get a Demo
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.125rem',
                }}
              >
                View Pricing
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Pricing Section */}
      <Box sx={{ py: 12, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
              Enterprise Pricing
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 400 }}>
              Choose the plan that scales with your business
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {pricingTiers.map((tier) => (
              <Grid item xs={12} md={4} key={tier.name} component="div">
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: tier.highlighted ? '2px solid' : '1px solid',
                    borderColor: tier.highlighted ? 'primary.main' : 'divider',
                    boxShadow: tier.highlighted ? 4 : 1,
                    position: 'relative',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                    },
                  }}
                >
                  {tier.highlighted && (
                    <Chip
                      label="Most Popular"
                      color="primary"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                      }}
                    />
                  )}
                  <CardContent sx={{ p: 4, flexGrow: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                      {tier.name}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 3, color: 'primary.main' }}>
                      {tier.price}
                      <Typography component="span" variant="h6" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                        /year
                      </Typography>
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                      {tier.features.map((feature, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                          <CheckIcon sx={{ color: 'success.main', mr: 1, fontSize: 20 }} />
                          <Typography variant="body2">{feature}</Typography>
                        </Box>
                      ))}
                    </Box>
                    <Button
                      variant={tier.highlighted ? 'contained' : 'outlined'}
                      fullWidth
                      size="large"
                      sx={{ mt: 'auto' }}
                    >
                      Contact Sales
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 4, bgcolor: 'white', borderTop: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
            © 2026 LexiSense. Enterprise Contract Lifecycle Management.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
