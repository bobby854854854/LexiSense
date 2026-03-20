import React, { useEffect, useState } from 'react';
import { 
  Container, Box, Typography, Button, Grid, Card, CardContent, 
  Chip, Alert, CircularProgress 
} from '@mui/material';
import { PlayCircleFilled } from '@mui/icons-material';

const API_BASE = import.meta.env.VITE_API_URL || 'https://lexisense-api.onrender.com';

export default function LandingPage() {
  const [backendStatus, setBackendStatus] = useState<'loading' | 'online' | 'offline'>('loading');

  useEffect(() => {
    fetch(`${API_BASE}/health`, { 
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })
      .then(res => res.ok ? setBackendStatus('online') : setBackendStatus('offline'))
      .catch(() => setBackendStatus('offline'));
  }, []);

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      pt: 8, pb: 12 
    }}>
      <Container maxWidth="lg">
        <Box textAlign="center" color="white" mb={12}>
          <Typography variant="h1" sx={{ fontSize: { xs: '3rem', md: '4.5rem' }, fontWeight: 800, mb: 3 }}>
            AI-Powered Brain for Enterprise Contracts
          </Typography>
          <Typography variant="h4" sx={{ opacity: 0.95, mb: 4, maxWidth: 600, mx: 'auto' }}>
            Transform static documents into strategic assets with AI contract intelligence
          </Typography>
          
          <Alert 
            severity={backendStatus === 'online' ? 'success' : 'warning'}
            sx={{ maxWidth: 400, mx: 'auto', mb: 4 }}
          >
            {backendStatus === 'loading' ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            {backendStatus === 'online' ? '✅ LexiSense Backend LIVE & Connected' : '⚠️ Checking backend connection...'}
          </Alert>

          <Box gap={2} display="flex" justifyContent="center" flexWrap="wrap">
            <Button 
              variant="contained" 
              size="large" 
              sx={{ px: 6, py: 1.5, fontSize: '1.1rem' }}
              onClick={() => window.open('/auth/login', '_self')}
            >
              Start Free Trial
            </Button>
            <Button 
              variant="outlined" 
              size="large" 
              startIcon={<PlayCircleFilled />}
              sx={{ px: 6, py: 1.5, borderWidth: 2, color: 'white', '&:hover': { borderWidth: 2 } }}
            >
              Watch Demo
            </Button>
          </Box>
        </Box>

        <Box textAlign="center" color="white">
          <Typography variant="h3" sx={{ mb: 2, fontWeight: 700 }}>
            Simple, Value-Based Pricing
          </Typography>
          <Typography sx={{ mb: 8, maxWidth: 600, mx: 'auto' }}>
            Choose the plan that grows with your contract portfolio
          </Typography>

          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} md={4}>
              <Card sx={{ 
                background: 'rgba(255,255,255,0.1)', 
                backdropFilter: 'blur(10px)', 
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                height: '100%'
              }}>
                <CardContent>
                  <Chip label="Most Popular" color="primary" sx={{ mb: 2 }} />
                  <Typography variant="h4" sx={{ mb: 1 }}>Core Intelligence</Typography>
                  <Typography variant="h2" sx={{ fontWeight: 800, mb: 1 }}>$18K - $25K<span style={{fontSize:'1rem'}}>/year</span></Typography>
                  <Typography sx={{ mb: 3, opacity: 0.9 }}>Up to 2,500 contracts</Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography sx={{ mb: 1 }}>✅ AI Data Extraction</Typography>
                    <Typography sx={{ mb: 1 }}>✅ Obligation Tracking</Typography>
                    <Typography sx={{ mb: 1 }}>✅ 10 Users Included</Typography>
                  </Box>
                  
                  <Button variant="contained" fullWidth size="large">
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}