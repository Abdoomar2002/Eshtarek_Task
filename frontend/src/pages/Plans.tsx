import React, { useState } from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  CheckCircle,
  Star,
  TrendingUp,
  People,
  Storage,
  Api,
  CreditCard,
  Security,
  Support,
  ExpandMore,
  ArrowForward,
  CompareArrows
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { plansAPI, subscriptionsAPI } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';

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
}

interface Subscription {
  id: string;
  plan: Plan;
  status: string;
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  cancel_at_period_end: boolean;
}

const Plans: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [activeStep, setActiveStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch available plans
  const { data: plans, isLoading: plansLoading } = useQuery<Plan[]>(
    'available-plans',
    plansAPI.getPlans
  );

  // Fetch current subscription
  const { data: currentSubscription, isLoading: subscriptionLoading } = useQuery<Subscription>(
    'current-subscription',
    subscriptionsAPI.getSubscriptions,
    {
      select: (data) => data.find((sub: any) => sub.status === 'active' || sub.status === 'trial')
    }
  );

  // Create subscription mutation
  const createSubscriptionMutation = useMutation(
    (subscriptionData: any) => subscriptionsAPI.createSubscription(subscriptionData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('current-subscription');
        toast.success('Subscription created successfully!');
        setSubscriptionDialogOpen(false);
        setActiveStep(0);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create subscription');
      }
    }
  );

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    setSubscriptionDialogOpen(true);
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubscribe = () => {
    if (selectedPlan) {
      const subscriptionData = {
        plan: selectedPlan.id,
        billing_cycle: billingCycle,
        payment_method: paymentMethod,
        tenant: user?.tenant
      };
      createSubscriptionMutation.mutate(subscriptionData);
    }
  };

  const getBillingCycleLabel = (cycle: string) => {
    switch (cycle) {
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      case 'quarterly': return 'Quarterly';
      default: return cycle;
    }
  };

  const getCurrentPlanPrice = (plan: Plan) => {
    const basePrice = parseFloat(plan.price);
    switch (billingCycle) {
      case 'yearly':
        return (basePrice * 12 * 0.8).toFixed(2); // 20% discount for yearly
      case 'quarterly':
        return (basePrice * 3 * 0.9).toFixed(2); // 10% discount for quarterly
      default:
        return plan.price;
    }
  };

  const getSavings = (plan: Plan) => {
    const basePrice = parseFloat(plan.price);
    const currentPrice = parseFloat(getCurrentPlanPrice(plan));
    const monthlyEquivalent = billingCycle === 'yearly' ? currentPrice / 12 : 
                             billingCycle === 'quarterly' ? currentPrice / 3 : currentPrice;
    return ((basePrice - monthlyEquivalent) / basePrice * 100).toFixed(0);
  };

  if (plansLoading || subscriptionLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const availablePlans = plans?.filter(plan => plan.is_active) || [];

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Choose Your Plan
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
          Select the perfect plan for your business needs
        </Typography>
        
        {currentSubscription && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              You are currently on the <strong>{currentSubscription.plan.name}</strong> plan.
              {currentSubscription.cancel_at_period_end && 
                ' Your subscription will be cancelled at the end of the current billing period.'
              }
            </Typography>
          </Alert>
        )}
      </Box>

      {/* Billing Cycle Selector */}
      <Box mb={3}>
        <FormControl component="fieldset">
          <FormLabel component="legend">Billing Cycle</FormLabel>
          <RadioGroup
            row
            value={billingCycle}
            onChange={(e) => setBillingCycle(e.target.value)}
          >
            <FormControlLabel value="monthly" control={<Radio />} label="Monthly" />
            <FormControlLabel value="quarterly" control={<Radio />} label="Quarterly (10% off)" />
            <FormControlLabel value="yearly" control={<Radio />} label="Yearly (20% off)" />
          </RadioGroup>
        </FormControl>
      </Box>

      {/* Plans Grid */}
      <Grid container spacing={3}>
        {availablePlans.map((plan) => (
          <Grid item xs={12} md={4} key={plan.id}>
            <Card 
              sx={{ 
                height: '100%',
                position: 'relative',
                ...(plan.is_popular && {
                  border: '2px solid',
                  borderColor: 'primary.main',
                  transform: 'scale(1.02)',
                  zIndex: 1
                }),
                ...(currentSubscription?.plan.id === plan.id && {
                  border: '2px solid',
                  borderColor: 'success.main'
                })
              }}
            >
              {plan.is_popular && (
                <Chip
                  icon={<Star />}
                  label="Most Popular"
                  color="primary"
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    zIndex: 1
                  }}
                />
              )}
              
              {currentSubscription?.plan.id === plan.id && (
                <Chip
                  label="Current Plan"
                  color="success"
                  sx={{
                    position: 'absolute',
                    top: plan.is_popular ? 60 : 16,
                    right: 16,
                    zIndex: 1
                  }}
                />
              )}

              <CardContent sx={{ pb: 1 }}>
                <Typography variant="h5" gutterBottom>
                  {plan.name}
                </Typography>
                
                <Box mb={2}>
                  <Typography variant="h3" color="primary" component="span">
                    ${getCurrentPlanPrice(plan)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" component="span">
                    /{getBillingCycleLabel(billingCycle)}
                  </Typography>
                  {billingCycle !== 'monthly' && (
                    <Chip
                      label={`Save ${getSavings(plan)}%`}
                      color="success"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>

                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  {plan.description}
                </Typography>

                {/* Usage Limits */}
                <Box sx={{ mb: 3 }}>
                  <Grid container spacing={2}>
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

                <Box mt={3}>
                  {currentSubscription?.plan.id === plan.id ? (
                    <Button
                      variant="outlined"
                      fullWidth
                      disabled
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => handlePlanSelect(plan)}
                      startIcon={<ArrowForward />}
                    >
                      {currentSubscription ? 'Change Plan' : 'Get Started'}
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Subscription Dialog */}
      <Dialog 
        open={subscriptionDialogOpen} 
        onClose={() => setSubscriptionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Subscribe to {selectedPlan?.name}
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            <Step>
              <StepLabel>Plan Details</StepLabel>
              <StepContent>
                {selectedPlan && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {selectedPlan.name} - ${getCurrentPlanPrice(selectedPlan)}/{getBillingCycleLabel(billingCycle)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {selectedPlan.description}
                    </Typography>
                    <List dense>
                      {selectedPlan.features.map((feature, index) => (
                        <ListItem key={index} sx={{ py: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircle color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={feature} />
                        </ListItem>
                      ))}
                    </List>
                    <Box mt={2}>
                      <Button
                        variant="contained"
                        onClick={handleNext}
                      >
                        Continue
                      </Button>
                    </Box>
                  </Box>
                )}
              </StepContent>
            </Step>
            
            <Step>
              <StepLabel>Payment Method</StepLabel>
              <StepContent>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Select Payment Method</FormLabel>
                  <RadioGroup
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <FormControlLabel 
                      value="card" 
                      control={<Radio />} 
                      label="Credit/Debit Card" 
                    />
                    <FormControlLabel 
                      value="bank" 
                      control={<Radio />} 
                      label="Bank Transfer" 
                    />
                  </RadioGroup>
                </FormControl>
                <Box mt={2}>
                  <Button onClick={handleBack} sx={{ mr: 1 }}>
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                  >
                    Continue
                  </Button>
                </Box>
              </StepContent>
            </Step>
            
            <Step>
              <StepLabel>Review & Confirm</StepLabel>
              <StepContent>
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Order Summary
                  </Typography>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Plan:</Typography>
                    <Typography>{selectedPlan?.name}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Billing Cycle:</Typography>
                    <Typography>{getBillingCycleLabel(billingCycle)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Payment Method:</Typography>
                    <Typography>{paymentMethod === 'card' ? 'Credit/Debit Card' : 'Bank Transfer'}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6" color="primary">
                      ${selectedPlan ? getCurrentPlanPrice(selectedPlan) : '0'}/{getBillingCycleLabel(billingCycle)}
                    </Typography>
                  </Box>
                </Paper>
                <Box>
                  <Button onClick={handleBack} sx={{ mr: 1 }}>
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSubscribe}
                    disabled={createSubscriptionMutation.isLoading}
                  >
                    {createSubscriptionMutation.isLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      'Confirm Subscription'
                    )}
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubscriptionDialogOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Plans; 