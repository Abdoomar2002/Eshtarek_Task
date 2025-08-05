import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  People,
  Business,
  AttachMoney,
  Warning,
  CheckCircle,
  Cancel,
  MoreVert,
  Add,
  Refresh,
  Visibility,
  Edit,
  Delete
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { tenantsAPI, subscriptionsAPI, billingAPI } from '../services/api';

interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  overdueSubscriptions: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user: string;
  tenant: string;
}

const AdminDashboard: React.FC = () => {
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [tenantDialogOpen, setTenantDialogOpen] = useState(false);
  const [quickActionDialogOpen, setQuickActionDialogOpen] = useState(false);
  const [quickAction, setQuickAction] = useState('');
  const queryClient = useQueryClient();

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>(
    'admin-stats',
    async () => {
      const [tenants, subscriptions, invoices] = await Promise.all([
        tenantsAPI.getTenants(),
        subscriptionsAPI.getSubscriptions(),
        billingAPI.getInvoices()
      ]);

      const totalRevenue = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.total_amount), 0);
      const monthlyRevenue = invoices
        .filter(invoice => {
          const invoiceDate = new Date(invoice.created_at);
          const now = new Date();
          return invoiceDate.getMonth() === now.getMonth() && invoiceDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, invoice) => sum + parseFloat(invoice.total_amount), 0);

      return {
        totalTenants: tenants.length,
        activeTenants: tenants.filter(t => t.is_active).length,
        totalRevenue,
        monthlyRevenue,
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
        trialSubscriptions: subscriptions.filter(s => s.status === 'trial').length,
        overdueSubscriptions: subscriptions.filter(s => s.status === 'past_due').length,
      };
    },
    { refetchInterval: 30000 } // Refresh every 30 seconds
  );

  // Fetch recent activities
  const { data: recentActivities, isLoading: activitiesLoading } = useQuery<RecentActivity[]>(
    'recent-activities',
    async () => {
      // Mock data - in real implementation, this would come from an activity log API
      return [
        {
          id: '1',
          type: 'subscription_created',
          description: 'New Pro subscription created',
          timestamp: new Date().toISOString(),
          user: 'john.doe@techcorp.com',
          tenant: 'TechCorp'
        },
        {
          id: '2',
          type: 'tenant_registered',
          description: 'New tenant registered',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          user: 'admin@eshtarek.com',
          tenant: 'StartupXYZ'
        },
        {
          id: '3',
          type: 'payment_received',
          description: 'Payment received for Enterprise plan',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          user: 'billing@enterprise.com',
          tenant: 'EnterpriseABC'
        }
      ];
    }
  );

  // Mock data for charts
  const revenueData = [
    { month: 'Jan', revenue: 12000 },
    { month: 'Feb', revenue: 15000 },
    { month: 'Mar', revenue: 18000 },
    { month: 'Apr', revenue: 22000 },
    { month: 'May', revenue: 25000 },
    { month: 'Jun', revenue: 28000 },
  ];

  const subscriptionData = [
    { plan: 'Free', count: 45 },
    { plan: 'Pro', count: 28 },
    { plan: 'Enterprise', count: 12 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const handleQuickAction = async () => {
    try {
      // Handle different quick actions
      switch (quickAction) {
        case 'refresh_stats':
          await queryClient.invalidateQueries('admin-stats');
          toast.success('Statistics refreshed successfully');
          break;
        case 'send_notifications':
          toast.success('Notifications sent to all tenants');
          break;
        case 'backup_data':
          toast.success('Data backup initiated');
          break;
        default:
          break;
      }
      setQuickActionDialogOpen(false);
    } catch (error) {
      toast.error('Failed to perform action');
    }
  };

  if (statsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => queryClient.invalidateQueries()}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setQuickActionDialogOpen(true)}
          >
            Quick Actions
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Business color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Total Tenants
                  </Typography>
                  <Typography variant="h4">
                    {stats?.totalTenants || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {stats?.activeTenants || 0} active
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AttachMoney color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Monthly Revenue
                  </Typography>
                  <Typography variant="h4">
                    ${stats?.monthlyRevenue?.toLocaleString() || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    ${stats?.totalRevenue?.toLocaleString() || 0} total
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <People color="info" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Subscriptions
                  </Typography>
                  <Typography variant="h4">
                    {stats?.activeSubscriptions || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {stats?.trialSubscriptions || 0} in trial
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Warning color="warning" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Overdue
                  </Typography>
                  <Typography variant="h4">
                    {stats?.overdueSubscriptions || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Requires attention
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenue Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Subscription Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={subscriptionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ plan, percent }) => `${plan} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {subscriptionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activities */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activities
              </Typography>
              <List>
                {recentActivities?.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar>
                          {activity.type === 'subscription_created' && <CheckCircle />}
                          {activity.type === 'tenant_registered' && <Business />}
                          {activity.type === 'payment_received' && <AttachMoney />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.description}
                        secondary={
                          <React.Fragment>
                            <Typography component="span" variant="body2" color="textPrimary">
                              {activity.user}
                            </Typography>
                            {` — ${new Date(activity.timestamp).toLocaleString()}`}
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Alerts
              </Typography>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>3 subscriptions</strong> are past due and require attention.
                </Typography>
              </Alert>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>5 tenants</strong> are approaching their usage limits.
                </Typography>
              </Alert>
              <Alert severity="success">
                <Typography variant="body2">
                  <strong>System backup</strong> completed successfully.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions Dialog */}
      <Dialog open={quickActionDialogOpen} onClose={() => setQuickActionDialogOpen(false)}>
        <DialogTitle>Quick Actions</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Select Action"
            value={quickAction}
            onChange={(e) => setQuickAction(e.target.value)}
            sx={{ mt: 1 }}
          >
            <MenuItem value="refresh_stats">Refresh Statistics</MenuItem>
            <MenuItem value="send_notifications">Send Notifications</MenuItem>
            <MenuItem value="backup_data">Backup Data</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuickActionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleQuickAction} variant="contained">
            Execute
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard; 