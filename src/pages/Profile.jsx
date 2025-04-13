import { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext.jsx';
import {
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    TextField,
    Typography,
    Alert,
    Divider,
    List,
    ListItem,
    ListItemText,
    Chip,
    CircularProgress
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Profile() {
    const { user, isLoading: authLoading } = useAuthContext();
    const [employeeData, setEmployeeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const fetchEmployeeData = async () => {
            try {
                const response = await axios.get('/api/employees/me');

                if (response.data && response.data.data) {
                    setEmployeeData(response.data.data);
                    setError('');
                } else {
                    setError('No employee record found');
                }
            } catch (err) {
                console.error('Error fetching employee data:', err);
                setError('Failed to fetch employee data. Please contact your administrator.');
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchEmployeeData();
        }
    }, [authLoading]);

    const handlePasswordChange = async () => {
        // Validate passwords
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setError('New password must be at least 6 characters long');
            return;
        }

        try {
            await axios.post(`${API_URL}/auth/change-password`, {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            setSuccess('Password changed successfully');
            setOpenPasswordDialog(false);
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password');
        }
    };

    if (authLoading || loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!employeeData) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <Alert severity="warning">No employee data available</Alert>
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">My Profile</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setOpenPasswordDialog(true)}
                >
                    Change Password
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Personal Information
                            </Typography>
                            <List>
                                <ListItem>
                                    <ListItemText
                                        primary="Name"
                                        secondary={`${employeeData.firstName || 'N/A'} ${employeeData.lastName || ''}`}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary="Email"
                                        secondary={employeeData.email || 'Not provided'}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary="Phone"
                                        secondary={employeeData.phoneNumber || 'Not provided'}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary="Address"
                                        secondary={
                                            employeeData.address ?
                                                `${employeeData.address.street}, ${employeeData.address.city}, ${employeeData.address.state} ${employeeData.address.zipCode}`
                                                : 'Not provided'
                                        }
                                    />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Work Information
                            </Typography>
                            <List>
                                <ListItem>
                                    <ListItemText
                                        primary="Position"
                                        secondary={employeeData.position || 'Not assigned'}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary="Department"
                                        secondary={employeeData.department?.name || 'Not assigned'}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary="Role"
                                        secondary={employeeData.role ? employeeData.role.charAt(0).toUpperCase() + employeeData.role.slice(1) : 'Not assigned'}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary="Status"
                                        secondary={employeeData.status ? employeeData.status.charAt(0).toUpperCase() + employeeData.status.slice(1) : 'Not assigned'}
                                    />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)}>
                <DialogTitle>Change Password</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        type="password"
                        label="Current Password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        type="password"
                        label="New Password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        type="password"
                        label="Confirm New Password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        margin="normal"
                        required
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPasswordDialog(false)}>Cancel</Button>
                    <Button onClick={handlePasswordChange} variant="contained" color="primary">
                        Change Password
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
} 