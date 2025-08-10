import React, { useState } from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Receipt,
  Payment,
  Download,
  Visibility,
  CreditCard,
  AccountBalance,
  TrendingUp,
  Warning,
  CheckCircle,
  ExpandMore,
  AttachMoney,
  CalendarToday,
  Description,
  ReceiptLong
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { billingAPI, subscriptionsAPI } from '../services/api.ts';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Invoice {
  id: string;
  invoice_number: string;
  tenant_name: string;
  subscription: {
    plan: {
      name: string;
      price: string;
    };
  };
  status: string;
  total_amount: string;
  subtotal: string;
  tax_amount: string;
  created_at: string;
  due_date: string;
  paid_at?: string;
  items: InvoiceItem[];
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: string;
  total: string;
}

interface UsageStats {
  current_users: number;
  max_users: number;
  current_storage_gb: number;
  max_storage_gb: number;
  current_api_calls: number;
  max_api_calls: number;
}

const Billing: React.FC = () => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const queryClient = useQueryClient();

  // Fetch invoices
  const { data: invoices, isLoading: invoicesLoading } = useQuery<Invoice[]>(
    'invoices',
    billingAPI.getInvoices
  );

  // Fetch current subscription for usage stats
  const { data: currentSubscription, isLoading: subscriptionLoading } = useQuery(
    'current-subscription',
    subscriptionsAPI.getSubscriptions,
    {
      select: (data) => data.find((sub: any) => sub.status === 'active' || sub.status === 'trial')
    }
  );

  // Process payment mutation
  const processPaymentMutation = useMutation(
    (paymentData: any) => billingAPI.processPayment(paymentData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices');
        toast.success('Payment processed successfully!');
        setPaymentDialogOpen(false);
        resetPaymentForm();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to process payment');
      }
    }
  );

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceDialogOpen(true);
  };

  const handlePayInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentDialogOpen(true);
  };

  const handleProcessPayment = () => {
    if (selectedInvoice) {
      const paymentData = {
        invoice_id: selectedInvoice.id,
        amount: selectedInvoice.total_amount,
        payment_method: paymentMethod,
        card_number: cardNumber,
        expiry_date: expiryDate,
        cvv: cvv
      };
      processPaymentMutation.mutate(paymentData);
    }
  };

  const resetPaymentForm = () => {
    setPaymentMethod('card');
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'pending': return 'Pending';
      case 'overdue': return 'Overdue';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  // Mock usage data - in real implementation, this would come from the API
  const usageStats: UsageStats = {
    current_users: 8,
    max_users: currentSubscription?.plan?.max_users || 10,
    current_storage_gb: 2.5,
    max_storage_gb: currentSubscription?.plan?.max_storage_gb || 5,
    current_api_calls: 750,
    max_api_calls: currentSubscription?.plan?.max_api_calls || 1000
  };

  // Mock usage chart data
  const usageData = [
    { month: 'Jan', users: 5, storage: 1.2, api_calls: 400 },
    { month: 'Feb', users: 6, storage: 1.8, api_calls: 550 },
    { month: 'Mar', users: 7, storage: 2.1, api_calls: 650 },
    { month: 'Apr', users: 8, storage: 2.5, api_calls: 750 },
  ];

  if (invoicesLoading || subscriptionLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const unpaidInvoices = invoices?.filter(invoice => invoice.status === 'pending' || invoice.status === 'overdue') || [];
  const totalOutstanding = unpaidInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.total_amount), 0);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Billing & Invoices
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Receipt color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Total Invoices
                  </Typography>
                  <Typography variant="h4">
                    {invoices?.length || 0}
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
                <Payment color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Paid
                  </Typography>
                  <Typography variant="h4">
                    {invoices?.filter(i => i.status === 'paid').length || 0}
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
                    Outstanding
                  </Typography>
                  <Typography variant="h4">
                    ${totalOutstanding.toFixed(2)}
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
                <TrendingUp color="info" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Current Plan
                  </Typography>
                  <Typography variant="h6">
                    {currentSubscription?.plan?.name || 'No Plan'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Usage Statistics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Usage Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#8884d8" name="Users" />
                  <Line type="monotone" dataKey="storage" stroke="#82ca9d" name="Storage (GB)" />
                  <Line type="monotone" dataKey="api_calls" stroke="#ffc658" name="API Calls" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Usage
              </Typography>
              
              <Box mb={3}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Users</Typography>
                  <Typography variant="body2">
                    {usageStats.current_users} / {usageStats.max_users}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(usageStats.current_users / usageStats.max_users) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box mb={3}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Storage</Typography>
                  <Typography variant="body2">
                    {usageStats.current_storage_gb} / {usageStats.max_storage_gb} GB
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(usageStats.current_storage_gb / usageStats.max_storage_gb) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box mb={3}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">API Calls</Typography>
                  <Typography variant="body2">
                    {usageStats.current_api_calls.toLocaleString()} / {usageStats.max_api_calls.toLocaleString()}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(usageStats.current_api_calls / usageStats.max_api_calls) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Outstanding Invoices Alert */}
      {unpaidInvoices.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            You have <strong>{unpaidInvoices.length}</strong> unpaid invoice(s) totaling <strong>${totalOutstanding.toFixed(2)}</strong>.
          </Typography>
        </Alert>
      )}

      {/* Invoices Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Invoice History
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices?.map((invoice) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {invoice.invoice_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {invoice.subscription?.plan?.name}
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">
                        ${invoice.total_amount}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(invoice.status)}
                        color={getStatusColor(invoice.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() => handleViewInvoice(invoice)}
                        size="small"
                      >
                        <Visibility />
                      </IconButton>
                      {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                        <IconButton
                          onClick={() => handlePayInvoice(invoice)}
                          size="small"
                          color="primary"
                        >
                          <Payment />
                        </IconButton>
                      )}
                      <IconButton size="small">
                        <Download />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Invoice Details Dialog */}
      <Dialog 
        open={invoiceDialogOpen} 
        onClose={() => setInvoiceDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Invoice Details - {selectedInvoice?.invoice_number}
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Box>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Invoice Number</Typography>
                  <Typography variant="subtitle1">{selectedInvoice.invoice_number}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Date</Typography>
                  <Typography variant="subtitle1">
                    {new Date(selectedInvoice.created_at).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Due Date</Typography>
                  <Typography variant="subtitle1">
                    {new Date(selectedInvoice.due_date).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Status</Typography>
                  <Chip
                    label={getStatusLabel(selectedInvoice.status)}
                    color={getStatusColor(selectedInvoice.status) as any}
                    size="small"
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Invoice Items
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedInvoice.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">${item.unit_price}</TableCell>
                        <TableCell align="right">${item.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Box textAlign="right">
                  <Typography variant="body2">
                    Subtotal: ${selectedInvoice.subtotal}
                  </Typography>
                  <Typography variant="body2">
                    Tax: ${selectedInvoice.tax_amount}
                  </Typography>
                  <Typography variant="h6">
                    Total: ${selectedInvoice.total_amount}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoiceDialogOpen(false)}>Close</Button>
          <Button startIcon={<Download />}>Download PDF</Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog 
        open={paymentDialogOpen} 
        onClose={() => setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Process Payment
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Amount to pay: <strong>${selectedInvoice.total_amount}</strong>
                </Typography>
              </Alert>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentMethod}
                  label="Payment Method"
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <MenuItem value="card">Credit/Debit Card</MenuItem>
                  <MenuItem value="bank">Bank Transfer</MenuItem>
                </Select>
              </FormControl>

              {paymentMethod === 'card' && (
                <Box>
                  <TextField
                    fullWidth
                    label="Card Number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    sx={{ mb: 2 }}
                    placeholder="1234 5678 9012 3456"
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Expiry Date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        placeholder="MM/YY"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="CVV"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        placeholder="123"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {paymentMethod === 'bank' && (
                <Alert severity="info">
                  <Typography variant="body2">
                    Bank transfer details will be provided after confirmation.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleProcessPayment}
            disabled={processPaymentMutation.isLoading}
          >
            {processPaymentMutation.isLoading ? (
              <CircularProgress size={20} />
            ) : (
              'Process Payment'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Billing; 