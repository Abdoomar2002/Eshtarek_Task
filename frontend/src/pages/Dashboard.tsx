import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  People,
  Business,
  Payment,
  TrendingUp,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Mock data - in a real app, this would come from API
  const stats = {
    totalUsers: 12,
    activeSubscriptions: 1,
    monthlyRevenue: 299.99,
    usagePercentage: 75,
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: '50%',
              p: 1,
              mr: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" gutterBottom>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.first_name}!
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Here's what's happening with your {user?.tenant_name || 'organization'}.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<People sx={{ color: 'white' }} />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Subscriptions"
            value={stats.activeSubscriptions}
            icon={<Payment sx={{ color: 'white' }} />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Revenue"
            value={`$${stats.monthlyRevenue}`}
            icon={<TrendingUp sx={{ color: 'white' }} />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tenant"
            value={user?.tenant_name || 'N/A'}
            icon={<Business sx={{ color: 'white' }} />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Plan Usage
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  {stats.usagePercentage}% used
                </Typography>
                <Chip
                  label="Pro Plan"
                  color="primary"
                  size="small"
                  sx={{ ml: 'auto' }}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={stats.usagePercentage}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {stats.totalUsers} of 25 users
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  • New user John Doe joined the team
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Subscription renewed successfully
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Payment processed for $299.99
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Plan upgraded to Pro
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 