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
import { API_URL, API_ENDPOINTS } from '../config';

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
            const response = await axios.get('/api/employees/me');
            console.log('Current employee data:', response.data);

            const employeeData = response.data.data || response.data;

            if (!employeeData || !employeeData._id) {
                console.error('Invalid employee data received:', employeeData);
                setError('Unable to load your employee profile. Please try refreshing the page or contact admin.');
                return;
            }

            setCurrentEmployee(employeeData);
        } catch (error) {
            console.error('Error fetching current employee:', error);

            setTimeout(async () => {
                try {
                    console.log('Retrying employee data fetch...');
                    const retryResponse = await axios.get('/api/employees/me');

                    const employeeData = retryResponse.data.data || retryResponse.data;

                    if (employeeData && employeeData._id) {
                        console.log('Retry successful, employee data:', employeeData);
                        setCurrentEmployee(employeeData);
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
            if (user?.role !== 'admin' && user?.role !== 'hr') {
                const response = await axios.get('/api/employees/reporting-to-me');
                setReportingEmployees(response.data.data || response.data || []);
            } else {
                setReportingEmployees([]);
            }
        } catch (error) {
            console.error('Error fetching reporting employees:', error);
            setReportingEmployees([]);
        }
    };

    const fetchLeaves = async () => {
        try {
            let endpointUrl;

            // Determine which endpoint to use based on view mode
            if (viewMode === 'team-leaves' && isManager && !isAdmin && !isHR) {
                endpointUrl = API_ENDPOINTS.LEAVES.TEAM;
            } else if (viewMode === 'all-leaves' && (isAdmin || isHR)) {
                endpointUrl = API_ENDPOINTS.LEAVES.ALL;
            } else {
                endpointUrl = API_ENDPOINTS.LEAVES.ALL + '?view=' + viewMode;
            }

            const response = await axios.get(endpointUrl);
            const leavesData = response.data.data || response.data;
            setLeaves(Array.isArray(leavesData) ? leavesData : []);
        } catch (err) {
            console.error('Error fetching leaves:', err);
            setError('Failed to fetch leaves');
            setLeaves([]);
        }
    };

    const handleOpen = (leave = null) => {
        console.log('Opening leave form dialog:', leave ? 'edit mode' : 'new mode');

        if (leave) {
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
                type: 'annual',
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
            if (new Date(formData.endDate) < new Date(formData.startDate)) {
                setError('End date cannot be before start date');
                return;
            }

            if (selectedLeave) {
                const updatedData = { ...formData };

                if (!isAdmin) {
                    delete updatedData.status;
                }

                console.log('Updating leave:', updatedData);
                await axios.put(API_ENDPOINTS.LEAVES.UPDATE(selectedLeave._id), updatedData);
                setSuccess('Leave request updated successfully');
            } else {
                if (!currentEmployee || !currentEmployee._id) {
                    console.error('No employee ID found:', currentEmployee);
                    try {
                        const response = await axios.get(API_ENDPOINTS.EMPLOYEES.ME);
                        console.log('Refetched employee data:', response.data);
                        const employeeData = response.data.data || response.data;
                        setCurrentEmployee(employeeData);

                        const newLeaveData = {
                            ...formData,
                            employee: employeeData._id,
                            status: 'pending'
                        };

                        console.log('Submitting leave request with refetched ID:', newLeaveData);
                        const leaveResponse = await axios.post(API_ENDPOINTS.LEAVES.ALL, newLeaveData);
                        console.log('Leave request response:', leaveResponse.data);
                        setSuccess('Leave request submitted successfully');
                    } catch (fetchError) {
                        console.error('Error fetching employee data:', fetchError);
                        setError('Could not fetch employee profile. Please try logging out and back in.');
                        return;
                    }
                } else {
                    const newLeaveData = {
                        ...formData,
                        employee: currentEmployee._id,
                        status: 'pending'
                    };

                    console.log('Submitting leave request with existing ID:', newLeaveData);
                    const response = await axios.post(API_ENDPOINTS.LEAVES.ALL, newLeaveData);
                    console.log('Leave request response:', response.data);
                    setSuccess('Leave request submitted successfully');
                }
            }
            handleClose();
            fetchLeaves();
        } catch (err) {
            console.error('Leave request error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to save leave request');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this leave request?')) {
            try {
                await axios.delete(API_ENDPOINTS.LEAVES.DELETE(id));
                setSuccess('Leave request deleted successfully');
                fetchLeaves();
            } catch (err) {
                console.error('Error deleting leave:', err.response?.data || err.message);
                setError('Failed to delete leave request: ' + (err.response?.data?.message || err.message));
            }
        }
    };

    const handleUpdateStatus = async (leaveId, newStatus) => {
        try {
            console.log(`Updating leave ${leaveId} status to ${newStatus}`);

            // Use the regular update endpoint instead of status-specific endpoint
            await axios.put(API_ENDPOINTS.LEAVES.UPDATE(leaveId), {
                status: newStatus
            });

            setSuccess(`Leave request ${newStatus}`);
            fetchLeaves();
        } catch (err) {
            console.error('Error updating status:', err.response?.data || err.message);
            setError(`Failed to ${newStatus} leave request: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleManagerApproval = async (leaveId, approvalStatus, comments = '') => {
        try {
            console.log(`Approving leave ${leaveId} with manager status ${approvalStatus}`);

            // Send payload matching the exact structure in the database
            const payload = {
                managerApproval: {
                    status: approvalStatus,
                    approvedBy: currentEmployee?._id,
                    approvedAt: new Date().toISOString(),
                    comments: comments || ''
                }
            };

            console.log('Sending manager approval with payload:', payload);

            await axios.put(API_ENDPOINTS.LEAVES.UPDATE(leaveId), payload);

            setSuccess(`Leave request ${approvalStatus === 'approved' ? 'approved' : 'rejected'} by manager`);
            fetchLeaves();
        } catch (err) {
            console.error('Error in manager approval:', err);
            if (err.response) {
                console.error('API response:', err.response.status, err.response.data);
            }
            setError(`Failed to ${approvalStatus} leave request. Please try again.`);
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