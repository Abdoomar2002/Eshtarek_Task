import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Badge,
  Switch,
  FormControlLabel,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Menu,
  MenuItem as MUIMenuItem,
  CircularProgress,
} from '@mui/material';
import {
  ExpandMore,
  Visibility,
  Email,
  Phone,
  Refresh,
  FilterList,
  PersonAdd,
  Add,
  Person,
  CheckCircle,
  AdminPanelSettings,
  Warning,
  Search,
  MoreVert,
  Block,
  Edit,
  Delete,
  Send,
} from '@mui/icons-material';
import { usersAPI } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  role: string;
  is_active: boolean;
  is_tenant_admin: boolean;
  avatar?: string;
  date_joined: string;
  last_login?: string;
  profile?: {
    department: string;
    position: string;
    bio: string;
  };
}

interface UserFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  role: string;
  is_active: boolean;
  is_tenant_admin: boolean;
  password?: string;
}

interface InvitationFormData {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  message?: string;
}

const Users: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState<UserFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    role: 'user',
    is_active: true,
    is_tenant_admin: false
  });
  const [inviteData, setInviteData] = useState<InvitationFormData>({
    email: '',
    first_name: '',
    last_name: '',
    role: 'user',
    message: ''
  });
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Fetch users
  const { data: users, isLoading } = useQuery<User[]>(
    'users',
    usersAPI.getUsers
  );

  // Create user mutation
  const createUserMutation = useMutation(
    (data: UserFormData) => usersAPI.createUser(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('User created successfully');
        setUserDialogOpen(false);
        resetForm();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create user');
      }
    }
  );

  // Update user mutation
  const updateUserMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<UserFormData> }) =>
      usersAPI.updateUser(parseInt(id), data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('User updated successfully');
        setUserDialogOpen(false);
        resetForm();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update user');
      }
    }
  );

  // Delete user mutation
  const deleteUserMutation = useMutation(
    (id: string) => usersAPI.deleteUser(parseInt(id)),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('User deleted successfully');
        setDeleteDialogOpen(false);
        setSelectedUser(null);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete user');
      }
    }
  );

  // Invite user mutation
  const inviteUserMutation = useMutation(
    (data: InvitationFormData) => {
      // Mock invitation API call
      return Promise.resolve({ data: { message: 'Invitation sent successfully' } });
    },
    {
      onSuccess: () => {
        toast.success('Invitation sent successfully');
        setInviteDialogOpen(false);
        resetInviteForm();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to send invitation');
      }
    }
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    if (selectedUser) {
      setFormData({
        first_name: selectedUser.first_name,
        last_name: selectedUser.last_name,
        email: selectedUser.email,
        phone_number: selectedUser.phone_number,
        role: selectedUser.role,
        is_active: selectedUser.is_active,
        is_tenant_admin: selectedUser.is_tenant_admin
      });
      setUserDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleSubmit = () => {
    if (selectedUser) {
      updateUserMutation.mutate({ id: selectedUser.id, data: formData });
    } else {
      createUserMutation.mutate(formData);
    }
  };

  const handleInviteSubmit = () => {
    inviteUserMutation.mutate(inviteData);
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      role: 'user',
      is_active: true,
      is_tenant_admin: false
    });
    setSelectedUser(null);
  };

  const resetInviteForm = () => {
    setInviteData({
      email: '',
      first_name: '',
      last_name: '',
      role: 'user',
      message: ''
    });
  };

  const handleCreateNew = () => {
    resetForm();
    setUserDialogOpen(true);
  };

  const handleInviteNew = () => {
    resetInviteForm();
    setInviteDialogOpen(true);
  };

  // Filter users based on search and filters
  const filteredUsers = users?.data?.results?.filter(user => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.is_active) ||
                         (statusFilter === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'tenant_admin': return 'warning';
      case 'user': return 'default';
      default: return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'System Admin';
      case 'tenant_admin': return 'Tenant Admin';
      case 'user': return 'User';
      default: return role;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const activeUsers = users?.data?.results?.filter(u => u.is_active).length || 0;
  const inactiveUsers = users?.data?.results?.filter(u => !u.is_active).length || 0;
  const adminUsers = users?.data?.results?.filter(u => u.role === 'admin' || u.role === 'tenant_admin').length || 0;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          User Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<PersonAdd />}
            onClick={handleInviteNew}
            sx={{ mr: 1 }}
          >
            Invite User
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateNew}
          >
            Add User
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Person color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Total Users
                  </Typography>
                  <Typography variant="h4">
                    {users?.length || 0}
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
                <CheckCircle color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Active Users
                  </Typography>
                  <Typography variant="h4">
                    {activeUsers}
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
                <AdminPanelSettings color="warning" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Administrators
                  </Typography>
                  <Typography variant="h4">
                    {adminUsers}
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
                <Warning color="error" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="h6">
                    Inactive Users
                  </Typography>
                  <Typography variant="h4">
                    {inactiveUsers}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search users"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  label="Role"
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  <MenuItem value="admin">System Admin</MenuItem>
                  <MenuItem value="tenant_admin">Tenant Admin</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
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
            <Grid item xs={12} md={4}>
              <Box display="flex" gap={1}>
                <Chip
                  icon={<Person />}
                  label={`${users?.length || 0} Total`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  icon={<CheckCircle />}
                  label={`${activeUsers} Active`}
                  color="success"
                  variant="outlined"
                />
                <Chip
                  icon={<AdminPanelSettings />}
                  label={`${adminUsers} Admins`}
                  color="warning"
                  variant="outlined"
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers?.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        user.is_active ? (
                          <CheckCircle color="success" fontSize="small" />
                        ) : (
                          <Block color="error" fontSize="small" />
                        )
                      }
                    >
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {user.avatar ? (
                          <img src={user.avatar} alt={`${user.first_name} ${user.last_name}`} />
                        ) : (
                          getInitials(user.first_name, user.last_name)
                        )}
                      </Avatar>
                    </Badge>
                    <Box>
                      <Typography variant="subtitle2">
                        {user.first_name} {user.last_name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {user.profile?.position || 'No position'}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{user.email}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {user.phone_number}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getRoleLabel(user.role)}
                    color={getRoleColor(user.role) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.is_active ? 'Active' : 'Inactive'}
                    color={user.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(user.date_joined).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={(e) => handleMenuOpen(e, user)}
                    size="small"
                    disabled={user.id === currentUser?.id}
                  >
                    <MoreVert />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit User Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Edit User' : 'Create New User'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              />
            </Grid>
            {!selectedUser && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="tenant_admin">Tenant Admin</MenuItem>
                  {currentUser?.role === 'admin' && (
                    <MenuItem value="admin">System Admin</MenuItem>
                  )}
                </Select>
              </FormControl>
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
                    checked={formData.is_tenant_admin}
                    onChange={(e) => setFormData({ ...formData, is_tenant_admin: e.target.checked })}
                  />
                }
                label="Tenant Administrator"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createUserMutation.isLoading || updateUserMutation.isLoading}
          >
            {createUserMutation.isLoading || updateUserMutation.isLoading ? (
              <CircularProgress size={20} />
            ) : (
              selectedUser ? 'Update' : 'Create'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Invite New User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={inviteData.first_name}
                onChange={(e) => setInviteData({ ...inviteData, first_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={inviteData.last_name}
                onChange={(e) => setInviteData({ ...inviteData, last_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={inviteData.role}
                  label="Role"
                  onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="tenant_admin">Tenant Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Personal Message (Optional)"
                value={inviteData.message}
                onChange={(e) => setInviteData({ ...inviteData, message: e.target.value })}
                multiline
                rows={3}
                placeholder="Add a personal message to the invitation email..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleInviteSubmit}
            variant="contained"
            startIcon={<Send />}
            disabled={inviteUserMutation.isLoading}
          >
            {inviteUserMutation.isLoading ? (
              <CircularProgress size={20} />
            ) : (
              'Send Invitation'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. The user will lose access to the system.
          </Alert>
          <Typography>
            Are you sure you want to delete <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => selectedUser && deleteUserMutation.mutate(selectedUser.id)}
            color="error"
            variant="contained"
            disabled={deleteUserMutation.isLoading}
          >
            {deleteUserMutation.isLoading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MUIMenuItem onClick={handleEdit}>
          <Edit sx={{ mr: 1 }} /> Edit
        </MUIMenuItem>
        <MUIMenuItem onClick={handleDelete}>
          <Delete sx={{ mr: 1 }} /> Delete
        </MUIMenuItem>
      </Menu>
    </Box>
  );
};

export default Users; 