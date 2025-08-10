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
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  AttachMoney,
  People,
  Storage,
  Api,
  CheckCircle,
  ExpandMore,
  Star,
  TrendingUp,
  Settings
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { plansAPI } from '../services/api.ts';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  currency: string;
  billing_cycle: string;
  max_users: number;
  max_storage_gb: number;
  max_api_calls: number;
  features: string[];
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  subscription_count?: number;
}

interface PlanFormData {
  name: string;
  slug: string;
  description: string;
  price: string;
  currency: string;
  billing_cycle: string;
  max_users: number;
  max_storage_gb: number;
  max_api_calls: number;
  features: string[];
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
}

const AdminPlans: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [newFeature, setNewFeature] = useState('');
  const [formData, setFormData] = useState<PlanFormData>({
    name: '',
    slug: '',
    description: '',
    price: '',
    currency: 'USD',
    billing_cycle: 'monthly',
    max_users: 1,
    max_storage_gb: 1,
    max_api_calls: 1000,
    features: [],
    is_active: true,
    is_popular: false,
    sort_order: 0
  });
  const queryClient = useQueryClient();

  // Fetch plans
  const { data: plans, isLoading } = useQuery<Plan[]>(
    'plans',
    plansAPI.getPlans
  );

  // Create plan mutation
  const createPlanMutation = useMutation(
    (data: PlanFormData) => plansAPI.createPlan(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('plans');
        toast.success('Plan created successfully');
        setDialogOpen(false);
        resetForm();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create plan');
      }
    }
  );

  // Update plan mutation
  const updatePlanMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<PlanFormData> }) =>
      plansAPI.updatePlan(parseInt(id), data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('plans');
        toast.success('Plan updated successfully');
        setDialogOpen(false);
        resetForm();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update plan');
      }
    }
  );

  // Delete plan mutation
  const deletePlanMutation = useMutation(
    (id: string) => plansAPI.deletePlan(parseInt(id)),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('plans');
        toast.success('Plan deleted successfully');
        setDeleteDialogOpen(false);
        setSelectedPlan(null);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete plan');
      }
    }
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, plan: Plan) => {
    setAnchorEl(event.currentTarget);
    setSelectedPlan(plan);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    if (selectedPlan) {
      setFormData({
        name: selectedPlan.name,
        slug: selectedPlan.slug,
        description: selectedPlan.description,
        price: selectedPlan.price,
        currency: selectedPlan.currency,
        billing_cycle: selectedPlan.billing_cycle,
        max_users: selectedPlan.max_users,
        max_storage_gb: selectedPlan.max_storage_gb,
        max_api_calls: selectedPlan.max_api_calls,
        features: selectedPlan.features,
        is_active: selectedPlan.is_active,
        is_popular: selectedPlan.is_popular,
        sort_order: selectedPlan.sort_order
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
    if (selectedPlan) {
      updatePlanMutation.mutate({ id: selectedPlan.id, data: formData });
    } else {
      createPlanMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: '',
      currency: 'USD',
      billing_cycle: 'monthly',
      max_users: 1,
      max_storage_gb: 1,
      max_api_calls: 1000,
      features: [],
      is_active: true,
      is_popular: false,
      sort_order: 0
    });
    setSelectedPlan(null);
  };

  const handleCreateNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  const getBillingCycleLabel = (cycle: string) => {
    switch (cycle) {
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      case 'quarterly': return 'Quarterly';
      default: return cycle;
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
          Plan Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateNew}
        >
          Create Plan
        </Button>
      </Box>

      {/* Plans Grid */}
      <Grid container spacing={3}>
        {plans?.data?.results?.map((plan) => (
          <Grid item xs={12} md={6} lg={4} key={plan.id}>
            <Card 
              sx={{ 
                height: '100%',
                position: 'relative',
                ...(plan.is_popular && {
                  border: '2px solid',
                  borderColor: 'primary.main'
                })
              }}
            >
              {plan.is_popular && (
                <Chip
                  icon={<Star />}
                  label="Popular"
                  color="primary"
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    zIndex: 1
                  }}
                />
              )}
              <CardContent sx={{ pb: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      {plan.name}
                    </Typography>
                    <Typography variant="h4" color="primary" gutterBottom>
                      ${plan.price}
                      <Typography component="span" variant="body2" color="textSecondary">
                        /{getBillingCycleLabel(plan.billing_cycle)}
                      </Typography>
                    </Typography>
                  </Box>
                  <IconButton
                    onClick={(e) => handleMenuOpen(e, plan)}
                    size="small"
                  >
                    <MoreVert />
                  </IconButton>
                </Box>

                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {plan.description}
                </Typography>

                {/* Usage Limits */}
                <Box sx={{ mb: 2 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <People color="action" />
                        <Typography variant="body2">
                          {plan.max_users} Users
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Storage color="action" />
                        <Typography variant="body2">
                          {plan.max_storage_gb} GB
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Api color="action" />
                        <Typography variant="body2">
                          {plan.max_api_calls.toLocaleString()}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* Features */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="body2">Features</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {plan.features.map((feature, index) => (
                        <ListItem key={index} sx={{ py: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircle color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={feature} />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>

                {/* Status */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                  <Chip
                    label={plan.is_active ? 'Active' : 'Inactive'}
                    color={plan.is_active ? 'success' : 'default'}
                    size="small"
                  />
                  {plan.subscription_count !== undefined && (
                    <Typography variant="body2" color="textSecondary">
                      {plan.subscription_count} subscribers
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedPlan ? 'Edit Plan' : 'Create New Plan'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Plan Name"
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
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={formData.currency}
                  label="Currency"
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="GBP">GBP</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Billing Cycle</InputLabel>
                <Select
                  value={formData.billing_cycle}
                  label="Billing Cycle"
                  onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
                >
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Max Users"
                type="number"
                value={formData.max_users}
                onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Max Storage (GB)"
                type="number"
                value={formData.max_storage_gb}
                onChange={(e) => setFormData({ ...formData, max_storage_gb: parseInt(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Max API Calls"
                type="number"
                value={formData.max_api_calls}
                onChange={(e) => setFormData({ ...formData, max_api_calls: parseInt(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  label="Add Feature"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                  sx={{ flexGrow: 1 }}
                />
                <Button onClick={addFeature} variant="outlined">
                  Add
                </Button>
              </Box>
              <List dense>
                {formData.features.map((feature, index) => (
                  <ListItem key={index} sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={feature} />
                    <IconButton
                      size="small"
                      onClick={() => removeFeature(index)}
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
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
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_popular}
                    onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                  />
                }
                label="Popular"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Sort Order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createPlanMutation.isLoading || updatePlanMutation.isLoading}
          >
            {createPlanMutation.isLoading || updatePlanMutation.isLoading ? (
              <CircularProgress size={20} />
            ) : (
              selectedPlan ? 'Update' : 'Create'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Plan</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. All subscriptions to this plan will be affected.
          </Alert>
          <Typography>
            Are you sure you want to delete <strong>{selectedPlan?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => selectedPlan && deletePlanMutation.mutate(selectedPlan.id)}
            color="error"
            variant="contained"
            disabled={deletePlanMutation.isLoading}
          >
            {deletePlanMutation.isLoading ? <CircularProgress size={20} /> : 'Delete'}
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

export default AdminPlans; 