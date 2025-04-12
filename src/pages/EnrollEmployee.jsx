import { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext.jsx';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Alert,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    Check as CheckIcon,
    Close as CloseIcon,
    ContentCopy as CopyIcon
} from '@mui/icons-material';
import axios from 'axios';

export default function EnrollEmployee() {
    const { token } = useAuthContext();
    const [email, setEmail] = useState('');
    const [position, setPosition] = useState('');
    const [department, setDepartment] = useState('');
    const [pendingEmployees, setPendingEmployees] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [showApprovalDialog, setShowApprovalDialog] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [selectedRole, setSelectedRole] = useState('employee');

    // Fetch pending employees
    useEffect(() => {
        const fetchPendingEmployees = async () => {
            try {
                const response = await axios.get('/api/employees?status=pending', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPendingEmployees(response.data);
            } catch (error) {
                console.error('Error fetching pending employees:', error);
                showSnackbar('Failed to fetch pending employees', 'error');
            }
        };

        fetchPendingEmployees();
        // Set up polling every 30 seconds
        const interval = setInterval(fetchPendingEmployees, 30000);
        return () => clearInterval(interval);
    }, [token]);

    const handleGenerateInvite = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/employees/generate-invite', {
                email,
                position,
                department
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            showSnackbar('Invite link generated successfully!', 'success');
            copyToClipboard(response.data.inviteLink);
            setEmail('');
            setPosition('');
            setDepartment('');
        } catch (error) {
            console.error('Error generating invite:', error);
            showSnackbar(error.response?.data?.message || 'Failed to generate invite', 'error');
        }
    };

    const handleApproveEnrollment = async () => {
        try {
            await axios.post(
                `/api/employees/${selectedEmployee._id}/approve-enrollment`,
                { role: selectedRole },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setShowApprovalDialog(false);
            setSelectedEmployee(null);
            setSelectedRole('employee');
            showSnackbar('Enrollment approved successfully', 'success');
            fetchPendingEmployees();
        } catch (error) {
            console.error('Error approving enrollment:', error);
            showSnackbar(error.response?.data?.message || 'Failed to approve enrollment', 'error');
        }
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            showSnackbar('Invite link copied to clipboard!', 'success');
        } catch (error) {
            console.error('Failed to copy:', error);
            showSnackbar('Failed to copy invite link', 'error');
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Employee Enrollment Management
            </Typography>

            {/* Generate Invite Form */}
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Generate New Employee Invite
                </Typography>
                <Box component="form" onSubmit={handleGenerateInvite} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        sx={{ flexGrow: 1, minWidth: 200 }}
                    />
                    <TextField
                        label="Position"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        required
                        sx={{ flexGrow: 1, minWidth: 200 }}
                    />
                    <TextField
                        label="Department"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        required
                        sx={{ flexGrow: 1, minWidth: 200 }}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        sx={{ height: 56 }}
                    >
                        Generate Invite Link
                    </Button>
                </Box>
            </Paper>

            {/* Pending Enrollments Table */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Pending Enrollments
                </Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Position</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {pendingEmployees.map((employee) => (
                                <TableRow key={employee._id}>
                                    <TableCell>
                                        {employee.firstName} {employee.lastName}
                                    </TableCell>
                                    <TableCell>{employee.email}</TableCell>
                                    <TableCell>{employee.position}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={employee.enrollmentStatus}
                                            color={
                                                employee.enrollmentStatus === 'approved' ? 'success' :
                                                    employee.enrollmentStatus === 'rejected' ? 'error' :
                                                        'warning'
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            color="success"
                                            onClick={() => {
                                                setSelectedEmployee(employee);
                                                setShowApprovalDialog(true);
                                            }}
                                        >
                                            <CheckIcon />
                                        </IconButton>
                                        <IconButton
                                            color="error"
                                            onClick={() => {
                                                setSelectedEmployee(employee);
                                                setSelectedRole('employee');
                                            }}
                                        >
                                            <CloseIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {pendingEmployees.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        No pending enrollments
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Approval Dialog */}
            <Dialog open={showApprovalDialog} onClose={() => setShowApprovalDialog(false)}>
                <DialogTitle>Approve Employee Enrollment</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" gutterBottom>
                        Approve enrollment for {selectedEmployee?.firstName} {selectedEmployee?.lastName}?
                    </Typography>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Role</InputLabel>
                        <Select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            label="Role"
                        >
                            <MenuItem value="employee">Employee</MenuItem>
                            <MenuItem value="hr">HR</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowApprovalDialog(false)}>Cancel</Button>
                    <Button onClick={handleApproveEnrollment} variant="contained" color="primary">
                        Approve
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
} 