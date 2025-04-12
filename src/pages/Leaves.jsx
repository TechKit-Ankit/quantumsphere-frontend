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
    IconButton,
    TextField,
    Typography,
    Alert,
    MenuItem,
    Chip,
    Select,
    FormControl,
    InputLabel,
    Tabs,
    Tab
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, CheckCircle as ApproveIcon, Cancel as RejectIcon } from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Leaves() {
    const { user } = useAuthContext();
    const [leaves, setLeaves] = useState([]);
    const [currentEmployee, setCurrentEmployee] = useState(null);
    const [reportingEmployees, setReportingEmployees] = useState([]);
    const [viewMode, setViewMode] = useState('my-leaves'); // 'my-leaves', 'team-leaves', 'all-leaves'
    const [open, setOpen] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [formData, setFormData] = useState({
        startDate: '',
        endDate: '',
        type: '',
        reason: '',
        status: 'pending'
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const isAdmin = user?.role === 'admin';
    const isHR = user?.role === 'hr';
    const isManager = reportingEmployees.length > 0;

    useEffect(() => {
        fetchCurrentEmployee();
    }, []);

    useEffect(() => {
        if (currentEmployee) {
            fetchLeaves();
            fetchReportingEmployees();
        }
    }, [currentEmployee, viewMode]);

    const fetchCurrentEmployee = async () => {
        try {
            console.log('Fetching current employee...');
            const response = await axios.get(`${API_URL}/employees/me`);
            console.log('Current employee data:', response.data);

            if (!response.data || !response.data._id) {
                console.error('Invalid employee data received:', response.data);
                setError('Unable to load your employee profile. Please try refreshing the page or contact admin.');
                return;
            }

            setCurrentEmployee(response.data);
        } catch (error) {
            console.error('Error fetching current employee:', error);

            // Attempt to retry once after a short delay
            setTimeout(async () => {
                try {
                    console.log('Retrying employee data fetch...');
                    const retryResponse = await axios.get(`${API_URL}/employees/me`);
                    if (retryResponse.data && retryResponse.data._id) {
                        console.log('Retry successful, employee data:', retryResponse.data);
                        setCurrentEmployee(retryResponse.data);
                    } else {
                        setError('Failed to load your employee profile. Please contact admin.');
                    }
                } catch (retryError) {
                    console.error('Retry failed:', retryError);
                    setError('Failed to load your employee profile. Please try logging out and back in.');
                }
            }, 1000);
        }
    };

    const fetchReportingEmployees = async () => {
        try {
            // Only fetch reporting employees if user is not admin or HR
            if (user?.role !== 'admin' && user?.role !== 'hr') {
                const response = await axios.get(`${API_URL}/employees/reporting-to-me`);
                setReportingEmployees(response.data || []);
            } else {
                // Admins and HR should have access to all leaves anyway
                setReportingEmployees([]);
            }
        } catch (error) {
            console.error('Error fetching reporting employees:', error);
            setReportingEmployees([]); // Default to empty array on error
        }
    };

    const fetchLeaves = async () => {
        try {
            let url = `${API_URL}/leaves`;

            // Add query parameters based on view mode
            const params = new URLSearchParams();
            params.append('view', viewMode);

            // If viewing team leaves and user is a manager but not admin/HR
            if (viewMode === 'team-leaves' && isManager && !isAdmin && !isHR) {
                // Let the backend handle the filtering
                url = `${API_URL}/leaves?${params.toString()}`;
            } else if (viewMode === 'all-leaves' && (isAdmin || isHR)) {
                // All leaves for admin/HR
                url = `${API_URL}/leaves?${params.toString()}`;
            } else {
                // My leaves (default)
                url = `${API_URL}/leaves?${params.toString()}`;
            }

            const response = await axios.get(url);
            setLeaves(response.data);
        } catch (err) {
            setError('Failed to fetch leaves');
        }
    };

    const handleOpen = (leave = null) => {
        console.log('Opening leave form dialog:', leave ? 'edit mode' : 'new mode');

        if (leave) {
            // Can only edit your own leaves unless you're an admin
            if (!isAdmin && leave.employee._id !== currentEmployee?._id) {
                setError("You can only edit your own leave requests");
                return;
            }

            setSelectedLeave(leave);
            const formValues = {
                startDate: new Date(leave.startDate).toISOString().split('T')[0],
                endDate: new Date(leave.endDate).toISOString().split('T')[0],
                type: leave.type || 'annual',
                reason: leave.reason || '',
                status: leave.status || 'pending'
            };
            console.log('Setting form data for edit:', formValues);
            setFormData(formValues);
        } else {
            setSelectedLeave(null);
            const today = new Date().toISOString().split('T')[0];
            const formValues = {
                startDate: today,
                endDate: today,
                type: 'annual', // Set a default leave type
                reason: '',
                status: 'pending'
            };
            console.log('Setting form data for new leave:', formValues);
            setFormData(formValues);
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedLeave(null);
        setFormData({
            startDate: '',
            endDate: '',
            type: '',
            reason: '',
            status: 'pending'
        });
        setError('');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'type') {
            console.log('Leave type changed to:', value);
        }

        setFormData({
            ...formData,
            [name]: value
        });

        // If start date is changed and is after end date, update end date
        if (name === 'startDate' && formData.endDate && new Date(value) > new Date(formData.endDate)) {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                endDate: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Basic validation
            if (new Date(formData.endDate) < new Date(formData.startDate)) {
                setError('End date cannot be before start date');
                return;
            }

            if (selectedLeave) {
                // Make a copy of the form data for the request
                const updatedData = { ...formData };

                // Only admin can change status
                if (!isAdmin) {
                    delete updatedData.status;
                }

                console.log('Updating leave:', updatedData);
                await axios.put(`${API_URL}/leaves/${selectedLeave._id}`, updatedData);
                setSuccess('Leave request updated successfully');
            } else {
                // Create a new leave request
                if (!currentEmployee || !currentEmployee._id) {
                    console.error('No employee ID found:', currentEmployee);
                    // Try to fetch the employee data again
                    try {
                        const response = await axios.get(`${API_URL}/employees/me`);
                        console.log('Refetched employee data:', response.data);
                        setCurrentEmployee(response.data);

                        // Create leave with the newly fetched employee ID
                        const newLeaveData = {
                            ...formData,
                            employee: response.data._id,
                            status: 'pending'
                        };

                        console.log('Submitting leave request with refetched ID:', newLeaveData);
                        const leaveResponse = await axios.post(`${API_URL}/leaves`, newLeaveData);
                        console.log('Leave request response:', leaveResponse.data);
                        setSuccess('Leave request submitted successfully');
                    } catch (fetchError) {
                        console.error('Error fetching employee data:', fetchError);
                        setError('Could not fetch employee profile. Please try logging out and back in.');
                        return;
                    }
                } else {
                    // Normal flow with existing employee ID
                    const newLeaveData = {
                        ...formData,
                        employee: currentEmployee._id,
                        status: 'pending'
                    };

                    console.log('Submitting leave request with existing ID:', newLeaveData);
                    const response = await axios.post(`${API_URL}/leaves`, newLeaveData);
                    console.log('Leave request response:', response.data);
                    setSuccess('Leave request submitted successfully');
                }
            }
            handleClose();
            fetchLeaves();
        } catch (err) {
            console.error('Leave request error:', err);
            setError(err.response?.data?.message || 'Failed to save leave request');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this leave request?')) {
            try {
                await axios.delete(`${API_URL}/leaves/${id}`);
                setSuccess('Leave request deleted successfully');
                fetchLeaves();
            } catch (err) {
                setError('Failed to delete leave request');
            }
        }
    };

    const handleUpdateStatus = async (leaveId, newStatus) => {
        try {
            await axios.put(`${API_URL}/leaves/${leaveId}`, { status: newStatus });
            setSuccess(`Leave request ${newStatus}`);
            fetchLeaves();
        } catch (err) {
            setError(`Failed to ${newStatus} leave request`);
        }
    };

    const handleManagerApproval = async (leaveId, approvalStatus, comments = '') => {
        try {
            await axios.put(`${API_URL}/leaves/${leaveId}/manager-approval`, {
                status: approvalStatus,
                comments
            });

            setSuccess(`Leave request ${approvalStatus === 'approved' ? 'approved' : 'rejected'}`);
            fetchLeaves();
        } catch (err) {
            setError(`Failed to ${approvalStatus} leave request`);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'success';
            case 'rejected':
                return 'error';
            default:
                return 'warning';
        }
    };

    const leaveTypes = [
        'annual',
        'sick',
        'personal',
        'other'
    ];

    const getDisplayLeaveType = (type) => {
        switch (type) {
            case 'annual':
                return 'Annual Leave';
            case 'sick':
                return 'Sick Leave';
            case 'personal':
                return 'Personal Leave';
            case 'other':
                return 'Other Leave';
            default:
                return type;
        }
    };

    const hasReportingManager = (employeeId) => {
        return reportingEmployees.some(emp => emp._id === employeeId);
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Leave Requests</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpen()}
                >
                    NEW LEAVE REQUEST
                </Button>
            </Box>

            {/* Tab Navigation for Different Leave Views */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={viewMode}
                    onChange={(e, newValue) => setViewMode(newValue)}
                    aria-label="leave view tabs"
                >
                    <Tab label="MY LEAVES" value="my-leaves" />
                    {(isAdmin || isHR) && <Tab label="ALL LEAVES" value="all-leaves" />}
                    {isManager && !isAdmin && !isHR && <Tab label="TEAM LEAVES" value="team-leaves" />}
                </Tabs>
            </Box>

            {/* Leave Balance Summary Card */}
            {currentEmployee && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Leave Balance Summary
                        </Typography>
                        <Box>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={4}>
                                    <Box textAlign="center">
                                        <Typography variant="subtitle1" color="text.secondary">
                                            Total Leave
                                        </Typography>
                                        <Typography variant="h5">
                                            {currentEmployee.leaveBalance?.total || 0} days
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Box textAlign="center">
                                        <Typography variant="subtitle1" color="text.secondary">
                                            Used Leave
                                        </Typography>
                                        <Typography variant="h5">
                                            {currentEmployee.leaveBalance?.used || 0} days
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Box textAlign="center">
                                        <Typography variant="subtitle1" color="text.secondary">
                                            Remaining Leave
                                        </Typography>
                                        <Typography variant="h5" color={
                                            (currentEmployee.leaveBalance?.remaining || 0) <= 5
                                                ? "error.main"
                                                : "primary.main"
                                        }>
                                            {currentEmployee.leaveBalance?.remaining || 0} days
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </CardContent>
                </Card>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            <Grid container spacing={3}>
                {leaves.map((leave) => (
                    <Grid item xs={12} sm={6} md={4} key={leave._id}>
                        <Card>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                    <Box>
                                        <Typography variant="h6">
                                            {leave.employee?.firstName} {leave.employee?.lastName}
                                        </Typography>
                                        <Typography color="textSecondary" gutterBottom>
                                            {getDisplayLeaveType(leave.type)}
                                        </Typography>
                                        <Typography variant="body2">
                                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                            {leave.reason}
                                        </Typography>

                                        {/* Show manager approval status if available */}
                                        {leave.managerApproval && leave.managerApproval.status !== 'pending' && (
                                            <Typography variant="body2" sx={{ mt: 1 }} component="div">
                                                <strong>Manager: </strong>
                                                <Chip
                                                    label={leave.managerApproval.status}
                                                    color={getStatusColor(leave.managerApproval.status)}
                                                    size="small"
                                                />
                                            </Typography>
                                        )}

                                        {/* Show warning if employee has no reporting manager */}
                                        {isAdmin && viewMode === 'all-leaves' &&
                                            !hasReportingManager(leave.employee?._id) &&
                                            leave.status === 'pending' && (
                                                <Typography variant="body2" color="warning.main" sx={{ mt: 1, fontSize: '0.75rem' }} component="div">
                                                    No reporting manager assigned
                                                </Typography>
                                            )}
                                    </Box>
                                    <Box display="flex" flexDirection="column" alignItems="flex-end">
                                        <Chip
                                            label={leave.status}
                                            color={getStatusColor(leave.status)}
                                            size="small"
                                            sx={{ mb: 1 }}
                                        />
                                        <Box>
                                            {/* Admin/HR Approval/Rejection buttons */}
                                            {(isAdmin || isHR) && leave.status === 'pending' && (
                                                <>
                                                    <IconButton
                                                        size="small"
                                                        color="success"
                                                        onClick={() => handleUpdateStatus(leave._id, 'approved')}
                                                        title="Approve"
                                                    >
                                                        <ApproveIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleUpdateStatus(leave._id, 'rejected')}
                                                        title="Reject"
                                                    >
                                                        <RejectIcon />
                                                    </IconButton>
                                                </>
                                            )}

                                            {/* Manager Approval/Rejection buttons - for manager of the employee */}
                                            {viewMode === 'team-leaves' &&
                                                leave.status === 'pending' &&
                                                reportingEmployees.some(emp => emp._id === leave.employee?._id) && (
                                                    <>
                                                        <IconButton
                                                            size="small"
                                                            color="success"
                                                            onClick={() => handleManagerApproval(leave._id, 'approved')}
                                                            title="Approve as Manager"
                                                        >
                                                            <ApproveIcon />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleManagerApproval(leave._id, 'rejected')}
                                                            title="Reject as Manager"
                                                        >
                                                            <RejectIcon />
                                                        </IconButton>
                                                    </>
                                                )}

                                            {/* Edit/Delete buttons - constrain to admin or the employee who requested */}
                                            {(isAdmin || leave.employee?._id === currentEmployee?._id) && (
                                                <>
                                                    <IconButton size="small" onClick={() => handleOpen(leave)}>
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => handleDelete(leave._id)}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}

                {leaves.length === 0 && (
                    <Grid item xs={12}>
                        <Alert severity="info">
                            No leave requests found.
                        </Alert>
                    </Grid>
                )}
            </Grid>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{selectedLeave ? 'Edit Leave Request' : 'New Leave Request'}</DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <FormControl fullWidth margin="normal" required>
                            <InputLabel>Leave Type</InputLabel>
                            <Select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                label="Leave Type"
                            >
                                {leaveTypes.map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {getDisplayLeaveType(type)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Start Date"
                            name="startDate"
                            type="date"
                            value={formData.startDate}
                            onChange={handleChange}
                            margin="normal"
                            required
                            InputLabelProps={{
                                shrink: true,
                            }}
                            inputProps={{
                                min: new Date().toISOString().split('T')[0]
                            }}
                        />

                        <TextField
                            fullWidth
                            label="End Date"
                            name="endDate"
                            type="date"
                            value={formData.endDate}
                            onChange={handleChange}
                            margin="normal"
                            required
                            InputLabelProps={{
                                shrink: true,
                            }}
                            inputProps={{
                                min: formData.startDate
                            }}
                        />

                        <TextField
                            fullWidth
                            label="Reason"
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            margin="normal"
                            required
                            multiline
                            rows={3}
                        />

                        {/* Status field - only visible to admins when editing an existing leave request */}
                        {isAdmin && selectedLeave && (
                            <FormControl fullWidth margin="normal">
                                <InputLabel id="status-label">Status</InputLabel>
                                <Select
                                    labelId="status-label"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    label="Status"
                                >
                                    <MenuItem value="pending">Pending</MenuItem>
                                    <MenuItem value="approved">Approved</MenuItem>
                                    <MenuItem value="rejected">Rejected</MenuItem>
                                </Select>
                            </FormControl>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Cancel</Button>
                        <Button type="submit" variant="contained" color="primary">
                            {selectedLeave ? 'Update' : 'Submit'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
} 