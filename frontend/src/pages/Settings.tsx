import React, { useState } from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Radio,
  RadioGroup,
  FormLabel
} from '@mui/material';
import {
  Person,
  Security,
  Notifications,
  Business,
  Settings as SettingsIcon,
  ExpandMore,
  Save,
  Cancel,
  Edit,
  Visibility,
  VisibilityOff,
  Email,
  Phone,
  Language,
  Palette,
  NotificationsActive,
  NotificationsOff,
  VpnKey,
  Delete,
  Warning,
  CheckCircle,
  Info
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  avatar?: string;
  date_of_birth?: string;
  bio?: string;
  timezone: string;
  language: string;
}

interface SecuritySettings {
  two_factor_enabled: boolean;
  session_timeout: number;
  password_expiry_days: number;
  login_notifications: boolean;
  suspicious_activity_alerts: boolean;
}

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  marketing_emails: boolean;
  billing_notifications: boolean;
  security_alerts: boolean;
  system_updates: boolean;
}

interface TenantSettings {
  name: string;
  description: string;
  contact_email: string;
  contact_phone: string;
  timezone: string;
  currency: string;
  date_format: string;
  theme: string;
}

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  // Profile form state
  const [profileData, setProfileData] = useState<UserProfile>({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    timezone: 'UTC',
    language: 'en'
  });

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    two_factor_enabled: false,
    session_timeout: 30,
    password_expiry_days: 90,
    login_notifications: true,
    suspicious_activity_alerts: true
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    marketing_emails: false,
    billing_notifications: true,
    security_alerts: true,
    system_updates: true
  });

  // Tenant settings state
  const [tenantSettings, setTenantSettings] = useState<TenantSettings>({
    name: 'My Organization',
    description: 'Organization description',
    contact_email: 'admin@organization.com',
    contact_phone: '+1-555-0123',
    timezone: 'UTC',
    currency: 'USD',
    date_format: 'MM/DD/YYYY',
    theme: 'light'
  });

  // Update profile mutation
  const updateProfileMutation = useMutation(
    (data: Partial<UserProfile>) => authAPI.updateProfile(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('user-profile');
        toast.success('Profile updated successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      }
    }
  );

  // Change password mutation
  const changePasswordMutation = useMutation(
    (data: { current_password: string; new_password: string }) =>
      authAPI.changePassword(data),
    {
      onSuccess: () => {
        toast.success('Password changed successfully');
        setPasswordDialogOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to change password');
      }
    }
  );

  const handleProfileSubmit = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    changePasswordMutation.mutate({
      current_password: currentPassword,
      new_password: newPassword
    });
  };

  const handleDeleteAccount = () => {
    // Mock delete account functionality
    toast.success('Account deletion request submitted');
    setDeleteAccountDialogOpen(false);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <Person /> },
    { id: 'security', label: 'Security', icon: <Security /> },
    { id: 'notifications', label: 'Notifications', icon: <Notifications /> },
    { id: 'tenant', label: 'Organization', icon: <Business /> }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {/* Tab Navigation */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            {tabs.map((tab) => (
              <Grid item key={tab.id}>
                <Button
                  variant={activeTab === tab.id ? 'contained' : 'outlined'}
                  startIcon={tab.icon}
                  onClick={() => setActiveTab(tab.id)}
                  sx={{ minWidth: 120 }}
                >
                  {tab.label}
                </Button>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      {activeTab === 'profile' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                  <Avatar
                    sx={{ width: 100, height: 100, mb: 2, bgcolor: 'primary.main' }}
                  >
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Profile" />
                    ) : (
                      getInitials(user?.first_name || '', user?.last_name || '')
                    )}
                  </Avatar>
                  <Button variant="outlined" startIcon={<Edit />}>
                    Change Photo
                  </Button>
                </Box>
                <Typography variant="h6" gutterBottom>
                  Personal Information
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Update your personal information and preferences.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Profile Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={profileData.first_name}
                      onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={profileData.last_name}
                      onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={profileData.phone_number}
                      onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Bio"
                      multiline
                      rows={3}
                      value={profileData.bio || ''}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Timezone</InputLabel>
                      <Select
                        value={profileData.timezone}
                        label="Timezone"
                        onChange={(e) => setProfileData({ ...profileData, timezone: e.target.value })}
                      >
                        <MenuItem value="UTC">UTC</MenuItem>
                        <MenuItem value="EST">Eastern Time</MenuItem>
                        <MenuItem value="PST">Pacific Time</MenuItem>
                        <MenuItem value="GMT">GMT</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Language</InputLabel>
                      <Select
                        value={profileData.language}
                        label="Language"
                        onChange={(e) => setProfileData({ ...profileData, language: e.target.value })}
                      >
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="es">Spanish</MenuItem>
                        <MenuItem value="fr">French</MenuItem>
                        <MenuItem value="de">German</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                <Box mt={3}>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleProfileSubmit}
                    disabled={updateProfileMutation.isLoading}
                  >
                    {updateProfileMutation.isLoading ? <CircularProgress size={20} /> : 'Save Changes'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Password & Authentication
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <VpnKey />
                    </ListItemIcon>
                    <ListItemText
                      primary="Change Password"
                      secondary="Update your account password"
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setPasswordDialogOpen(true)}
                      >
                        Change
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Security />
                    </ListItemIcon>
                    <ListItemText
                      primary="Two-Factor Authentication"
                      secondary="Add an extra layer of security"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={securitySettings.two_factor_enabled}
                        onChange={(e) => setSecuritySettings({
                          ...securitySettings,
                          two_factor_enabled: e.target.checked
                        })}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Session & Privacy
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Timer />
                    </ListItemIcon>
                    <ListItemText
                      primary="Session Timeout"
                      secondary={`${securitySettings.session_timeout} minutes`}
                    />
                    <ListItemSecondaryAction>
                      <FormControl size="small">
                        <Select
                          value={securitySettings.session_timeout}
                          onChange={(e) => setSecuritySettings({
                            ...securitySettings,
                            session_timeout: e.target.value as number
                          })}
                        >
                          <MenuItem value={15}>15 minutes</MenuItem>
                          <MenuItem value={30}>30 minutes</MenuItem>
                          <MenuItem value={60}>1 hour</MenuItem>
                          <MenuItem value={120}>2 hours</MenuItem>
                        </Select>
                      </FormControl>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <NotificationsActive />
                    </ListItemIcon>
                    <ListItemText
                      primary="Login Notifications"
                      secondary="Get notified of new login attempts"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={securitySettings.login_notifications}
                        onChange={(e) => setSecuritySettings({
                          ...securitySettings,
                          login_notifications: e.target.checked
                        })}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="error">
                  Danger Zone
                </Typography>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    These actions are irreversible. Please proceed with caution.
                  </Typography>
                </Alert>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => setDeleteAccountDialogOpen(true)}
                >
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Notification Preferences
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Email Notifications
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Email />
                    </ListItemIcon>
                    <ListItemText
                      primary="Email Notifications"
                      secondary="Receive notifications via email"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={notificationSettings.email_notifications}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          email_notifications: e.target.checked
                        })}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <NotificationsActive />
                    </ListItemIcon>
                    <ListItemText
                      primary="Billing Notifications"
                      secondary="Get notified about billing updates"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={notificationSettings.billing_notifications}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          billing_notifications: e.target.checked
                        })}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Security />
                    </ListItemIcon>
                    <ListItemText
                      primary="Security Alerts"
                      secondary="Get notified about security events"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={notificationSettings.security_alerts}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          security_alerts: e.target.checked
                        })}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  System Notifications
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <NotificationsActive />
                    </ListItemIcon>
                    <ListItemText
                      primary="Push Notifications"
                      secondary="Receive push notifications"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={notificationSettings.push_notifications}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          push_notifications: e.target.checked
                        })}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Info />
                    </ListItemIcon>
                    <ListItemText
                      primary="System Updates"
                      secondary="Get notified about system updates"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={notificationSettings.system_updates}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          system_updates: e.target.checked
                        })}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Email />
                    </ListItemIcon>
                    <ListItemText
                      primary="Marketing Emails"
                      secondary="Receive marketing and promotional emails"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={notificationSettings.marketing_emails}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          marketing_emails: e.target.checked
                        })}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </Grid>
            </Grid>
            <Box mt={3}>
              <Button variant="contained" startIcon={<Save />}>
                Save Notification Settings
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Tenant Settings */}
      {activeTab === 'tenant' && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Organization Settings
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Organization Name"
                  value={tenantSettings.name}
                  onChange={(e) => setTenantSettings({ ...tenantSettings, name: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={tenantSettings.description}
                  onChange={(e) => setTenantSettings({ ...tenantSettings, description: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Contact Email"
                  type="email"
                  value={tenantSettings.contact_email}
                  onChange={(e) => setTenantSettings({ ...tenantSettings, contact_email: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Contact Phone"
                  value={tenantSettings.contact_phone}
                  onChange={(e) => setTenantSettings({ ...tenantSettings, contact_phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={tenantSettings.timezone}
                    label="Timezone"
                    onChange={(e) => setTenantSettings({ ...tenantSettings, timezone: e.target.value })}
                  >
                    <MenuItem value="UTC">UTC</MenuItem>
                    <MenuItem value="EST">Eastern Time</MenuItem>
                    <MenuItem value="PST">Pacific Time</MenuItem>
                    <MenuItem value="GMT">GMT</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={tenantSettings.currency}
                    label="Currency"
                    onChange={(e) => setTenantSettings({ ...tenantSettings, currency: e.target.value })}
                  >
                    <MenuItem value="USD">USD ($)</MenuItem>
                    <MenuItem value="EUR">EUR (€)</MenuItem>
                    <MenuItem value="GBP">GBP (£)</MenuItem>
                    <MenuItem value="CAD">CAD (C$)</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Date Format</InputLabel>
                  <Select
                    value={tenantSettings.date_format}
                    label="Date Format"
                    onChange={(e) => setTenantSettings({ ...tenantSettings, date_format: e.target.value })}
                  >
                    <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                    <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                    <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Theme</InputLabel>
                  <Select
                    value={tenantSettings.theme}
                    label="Theme"
                    onChange={(e) => setTenantSettings({ ...tenantSettings, theme: e.target.value })}
                  >
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="dark">Dark</MenuItem>
                    <MenuItem value="auto">Auto</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Box mt={3}>
              <Button variant="contained" startIcon={<Save />}>
                Save Organization Settings
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Current Password"
            type={showPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              )
            }}
          />
          <TextField
            fullWidth
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Confirm New Password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={newPassword !== confirmPassword && confirmPassword !== ''}
            helperText={newPassword !== confirmPassword && confirmPassword !== '' ? 'Passwords do not match' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handlePasswordChange}
            variant="contained"
            disabled={changePasswordMutation.isLoading}
          >
            {changePasswordMutation.isLoading ? <CircularProgress size={20} /> : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteAccountDialogOpen} onClose={() => setDeleteAccountDialogOpen(false)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              This action cannot be undone. All your data will be permanently deleted.
            </Typography>
          </Alert>
          <Typography>
            Are you sure you want to delete your account? This will:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <Warning color="error" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Permanently delete all your data" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Warning color="error" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Cancel all active subscriptions" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Warning color="error" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Remove access to all services" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAccountDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
          >
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings; 