import React, { useState } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Alert,
  CircularProgress,
  Avatar,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Business,
  People,
  AttachMoney,
  Warning,
  CheckCircle,
  Cancel,
  Search,
  FilterList
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { tenantsAPI, subscriptionsAPI } from '../services/api';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  contact_email: string;
  contact_phone: string;
  created_at: string;
  updated_at: string;
  user_count: number;
  active_subscription?: {
    plan: {
      name: string;
      price: string;
    };
    status: string;
  };
}

interface TenantFormData {
  name: string;
  slug: string;
  description: string;
  contact_email: string;
  contact_phone: string;
  is_active: boolean;
}

const AdminTenants: React.FC = () => {
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState<TenantFormData>({
    name: '',
    slug: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    is_active: true
  });
  const queryClient = useQueryClient();

  // Fetch tenants
  const { data: tenants, isLoading } = useQuery<Tenant[]>(
    'tenants',
    tenantsAPI.getTenants
  );

  // Create tenant mutation
  const createTenantMutation = useMutation(
    (data: TenantFormData) => tenantsAPI.createTenant(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tenants');
        toast.success('Tenant created successfully');
        setDialogOpen(false);
        resetForm();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create tenant');
      }
    }
  );

  // Update tenant mutation
  const updateTenantMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<TenantFormData> }) =>
      tenantsAPI.updateTenant(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tenants');
        toast.success('Tenant updated successfully');
        setDialogOpen(false);
        resetForm();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update tenant');
      }
    }
  );

  // Delete tenant mutation
  const deleteTenantMutation = useMutation(
    (id: string) => tenantsAPI.deleteTenant(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tenants');
        toast.success('Tenant deleted successfully');
        setDeleteDialogOpen(false);
        setSelectedTenant(null);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete tenant');
      }
    }
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, tenant: Tenant) => {
    setAnchorEl(event.currentTarget);
    setSelectedTenant(tenant);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    if (selectedTenant) {
      setFormData({
        name: selectedTenant.name,
        slug: selectedTenant.slug,
        description: selectedTenant.description,
        contact_email: selectedTenant.contact_email,
        contact_phone: selectedTenant.contact_phone,
        is_active: selectedTenant.is_active
      });
      setDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleSubmit = () => {
    if (selectedTenant) {
      updateTenantMutation.mutate({ id: selectedTenant.id, data: formData });
    } else {
      createTenantMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      contact_email: '',
      contact_phone: '',
      is_active: true
    });
    setSelectedTenant(null);
  };

  const handleCreateNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  // Filter tenants based on search and status
  const filteredTenants = tenants?.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.contact_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && tenant.is_active) ||
                         (statusFilter === 'inactive' && !tenant.is_active);
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'trial': return 'info';
      case 'past_due': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  if (isLoading) {
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
          Tenant Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateNew}
        >
          Add Tenant
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search tenants"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box display="flex" gap={1}>
                <Chip
                  icon={<Business />}
                  label={`${tenants?.length || 0} Total`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  icon={<CheckCircle />}
                  label={`${tenants?.filter(t => t.is_active).length || 0} Active`}
                  color="success"
                  variant="outlined"
                />
                <Chip
                  icon={<Warning />}
                  label={`${tenants?.filter(t => !t.is_active).length || 0} Inactive`}
                  color="warning"
                  variant="outlined"
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tenant</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Users</TableCell>
              <TableCell>Subscription</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTenants?.map((tenant) => (
              <TableRow key={tenant.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      <Business />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">{tenant.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {tenant.slug}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{tenant.contact_email}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {tenant.contact_phone}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={<People />}
                    label={tenant.user_count}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  {tenant.active_subscription ? (
                    <Box>
                      <Typography variant="body2">
                        {tenant.active_subscription.plan.name}
                      </Typography>
                      <Chip
                        label={tenant.active_subscription.status}
                        size="small"
                        color={getStatusColor(tenant.active_subscription.status) as any}
                      />
                    </Box>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No subscription
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={tenant.is_active ? 'Active' : 'Inactive'}
                    color={tenant.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(tenant.created_at).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={(e) => handleMenuOpen(e, tenant)}
                    size="small"
                  >
                    <MoreVert />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedTenant ? 'Edit Tenant' : 'Create New Tenant'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tenant Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                helperText="URL-friendly identifier"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createTenantMutation.isLoading || updateTenantMutation.isLoading}
          >
            {createTenantMutation.isLoading || updateTenantMutation.isLoading ? (
              <CircularProgress size={20} />
            ) : (
              selectedTenant ? 'Update' : 'Create'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Tenant</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. All data associated with this tenant will be permanently deleted.
          </Alert>
          <Typography>
            Are you sure you want to delete <strong>{selectedTenant?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => selectedTenant && deleteTenantMutation.mutate(selectedTenant.id)}
            color="error"
            variant="contained"
            disabled={deleteTenantMutation.isLoading}
          >
            {deleteTenantMutation.isLoading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <Edit sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <Delete sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AdminTenants; 