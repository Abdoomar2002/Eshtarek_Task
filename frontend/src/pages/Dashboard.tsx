import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Button,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  People,
  Storage,
  Api,
  TrendingUp,
  Warning,
  CheckCircle,
  Schedule,
  Payment,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext.tsx';
import { api } from '../services/api.ts';

interface DashboardData {
  tenant: {
    name: string;
    user_count: number;
    active_subscription: any;
    current_plan: any;
  };
  usage: {
    users: number;
    storage_gb: number;
    api_calls: number;
  };
  limits: {
    max_users: number;
    max_storage_gb: number;
    max_api_calls: number;
  };
  billing: {
    total_spent: number;
    invoice_count: number;
    current_plan: string;
    plan_price: number;
    next_billing: string;
  };
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch tenant information
      const tenantResponse = await api.get(`/tenants/${user?.tenant?.id}/`);
      
      // Fetch usage data
      const usageResponse = await api.get('/subscriptions/usage/');
      
      // Fetch billing analytics
      const billingResponse = await api.get('/billing/analytics/');
      
      setDashboardData({
        tenant: tenantResponse.data,
        usage: usageResponse.data,
        limits: usageResponse.data.limits,
        billing: billingResponse.data,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min(100, (current / limit) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'error';
    if (percentage >= 75) return 'warning';
    return 'success';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">No dashboard data available</Alert>
      </Box>
    );
  }

  const { tenant, usage, limits, billing } = dashboardData;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Welcome back, {user?.first_name}!
      </Typography>

      {/* Tenant Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {tenant.name}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Current Plan: {billing.current_plan || 'No active plan'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Plan Price: ${billing.plan_price}/month
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Total Users: {tenant.user_count}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Spent: ${billing.total_spent}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Usage Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Users</Typography>
              </Box>
              <Typography variant="h4" gutterBottom>
                {usage.users} / {limits.max_users}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={getUsagePercentage(usage.users, limits.max_users)}
                color={getUsageColor(getUsagePercentage(usage.users, limits.max_users))}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {Math.round(getUsagePercentage(usage.users, limits.max_users))}% used
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Storage sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Storage</Typography>
              </Box>
              <Typography variant="h4" gutterBottom>
                {usage.storage_gb} / {limits.max_storage_gb} GB
              </Typography>
              <LinearProgress
                variant="determinate"
                value={getUsagePercentage(usage.storage_gb, limits.max_storage_gb)}
                color={getUsageColor(getUsagePercentage(usage.storage_gb, limits.max_storage_gb))}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {Math.round(getUsagePercentage(usage.storage_gb, limits.max_storage_gb))}% used
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Api sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">API Calls</Typography>
              </Box>
              <Typography variant="h4" gutterBottom>
                {usage.api_calls.toLocaleString()} / {limits.max_api_calls.toLocaleString()}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={getUsagePercentage(usage.api_calls, limits.max_api_calls)}
                color={getUsageColor(getUsagePercentage(usage.api_calls, limits.max_api_calls))}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {Math.round(getUsagePercentage(usage.api_calls, limits.max_api_calls))}% used
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Subscription Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Subscription Status
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {tenant.active_subscription ? (
                  <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                ) : (
                  <Warning sx={{ mr: 1, color: 'warning.main' }} />
                )}
                <Typography variant="body1">
                  {tenant.active_subscription ? 'Active Subscription' : 'No Active Subscription'}
                </Typography>
              </Box>
              {tenant.active_subscription && (
                <Typography variant="body2" color="text.secondary">
                  Next billing: {new Date(billing.next_billing).toLocaleDateString()}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<Schedule />}
                  href="/plans"
                >
                  View Plans
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Payment />}
                  href="/billing"
                >
                  Billing
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                href="/users"
                startIcon={<People />}
              >
                Manage Users
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                href="/plans"
                startIcon={<TrendingUp />}
              >
                Upgrade Plan
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                href="/billing"
                startIcon={<Payment />}
              >
                View Invoices
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                href="/settings"
                startIcon={<Storage />}
              >
                Settings
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard; 