import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    IconButton,
    Alert,
    Container,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext.jsx';

const API_URL = import.meta.env.VITE_API_URL;

export default function Employees() {
    const { user } = useAuthContext();
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [managers, setManagers] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        position: '',
        department: '',
        role: 'employee',
        phoneNumber: '',
        reportingManager: '',
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchEmployees();
        fetchDepartments();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/employees`);
            console.log('Employees data received:', response.data);
            setEmployees(response.data);
            setManagers(response.data);
        } catch (error) {
            console.error('Error fetching employees:', error);
            setError('Failed to fetch employees');
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/departments`);
            setDepartments(response.data);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const handleOpenDialog = (employee = null) => {
        if (employee) {
            setSelectedEmployee(employee);
            setFormData({
                firstName: employee.firstName,
                lastName: employee.lastName,
                email: employee.email,
                position: employee.position,
                department: employee.department?._id || '',
                role: employee.role,
                phoneNumber: employee.phoneNumber || '',
                reportingManager: employee.reportingManager || '',
            });
        } else {
            setSelectedEmployee(null);
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                position: '',
                department: '',
                role: 'employee',
                phoneNumber: '',
                reportingManager: '',
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setError('');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate that non-admin employees have a reporting manager
        if (formData.role !== 'admin' && !formData.reportingManager) {
            setError('Non-admin employees must have a reporting manager');
            return;
        }

        try {
            console.log('Submitting employee data:', formData);

            if (selectedEmployee) {
                // If role is changed to admin, clear the reporting manager
                const dataToSubmit = { ...formData };
                if (dataToSubmit.role === 'admin') {
                    dataToSubmit.reportingManager = null;
                }

                console.log('Updating employee with data:', dataToSubmit);
                const response = await axios.put(
                    `${API_URL}/api/employees/${selectedEmployee._id}`,
                    dataToSubmit
                );
                console.log('Update response:', response.data);

                // Close dialog first to avoid UI glitches
                handleCloseDialog();

                // Use a small delay to ensure the dialog is closed before refreshing
                setTimeout(() => {
                    fetchEmployees();
                }, 300);
            } else {
                await axios.post(`${API_URL}/api/employees`, formData);
                handleCloseDialog();
                fetchEmployees();
            }
        } catch (error) {
            console.error('Error saving employee:', error);
            setError(error.response?.data?.message || 'Failed to save employee');
        }
    };

    const handleDelete = async (employeeId) => {
        if (window.confirm('Are you sure you want to delete this employee?')) {
            try {
                await axios.delete(`${API_URL}/api/employees/${employeeId}`);
                fetchEmployees();
            } catch (error) {
                console.error('Error deleting employee:', error);
                setError('Failed to delete employee');
            }
        }
    };

    // Filter out the current employee from potential managers
    const getFilteredManagers = () => {
        if (!selectedEmployee) return managers;
        return managers.filter(manager => manager._id !== selectedEmployee._id);
    }

    // Get the manager's name from their ID
    const getManagerName = (managerId) => {
        // If we got a populated object with firstName/lastName
        if (typeof managerId === 'object' && managerId.firstName) {
            return `${managerId.firstName} ${managerId.lastName}`;
        }

        // If we got just an ID, look it up in the managers list
        const managerId_str = typeof managerId === 'object' ? managerId._id : managerId;
        const manager = managers.find(m => m._id === managerId_str);

        if (manager) {
            return `${manager.firstName} ${manager.lastName}`;
        }

        return 'Unknown';
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1">
                    Employees
                </Typography>
                {user?.role === 'admin' && (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/enroll')}
                    >
                        Enroll New Employee
                    </Button>
                )}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {employees.map((employee) => (
                    <Grid item xs={12} sm={6} md={4} key={employee._id}>
                        <Box
                            sx={{
                                p: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mb: 1,
                                }}
                            >
                                <Typography variant="h6">
                                    {employee.firstName} {employee.lastName}
                                </Typography>
                                {user?.role === 'admin' && (
                                    <Box>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleOpenDialog(employee)}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDelete(employee._id)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                )}
                            </Box>
                            <Typography color="textSecondary">{employee.position}</Typography>
                            <Typography color="textSecondary">
                                {employee.department?.name}
                            </Typography>
                            <Typography>{employee.email}</Typography>

                            {/* Display reporting manager information */}
                            {employee.role !== 'admin' && (
                                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2" color="text.secondary" component="span">
                                        <strong>Reports to: </strong>
                                    </Typography>
                                    {employee.reportingManager ? (
                                        <Typography
                                            variant="body2"
                                            component="span"
                                            sx={{
                                                ml: 0.5,
                                                px: 1,
                                                py: 0.25,
                                                borderRadius: 1,
                                                bgcolor: 'primary.light',
                                                color: 'white',
                                                fontSize: '0.75rem',
                                                fontWeight: 'medium'
                                            }}
                                        >
                                            {typeof employee.reportingManager === 'object' && employee.reportingManager.firstName ?
                                                `${employee.reportingManager.firstName} ${employee.reportingManager.lastName}` :
                                                getManagerName(employee.reportingManager)}
                                        </Typography>
                                    ) : (
                                        <Typography
                                            component="span"
                                            variant="body2"
                                            color="warning.main"
                                            sx={{
                                                ml: 0.5,
                                                px: 1,
                                                py: 0.25,
                                                borderRadius: 1,
                                                bgcolor: 'warning.light',
                                                color: 'warning.dark',
                                                fontSize: '0.75rem',
                                                fontStyle: 'italic'
                                            }}
                                        >
                                            No manager assigned
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </Box>
                    </Grid>
                ))}
            </Grid>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedEmployee ? 'Edit Employee' : 'Add Employee'}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    name="firstName"
                                    label="First Name"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    fullWidth
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    name="lastName"
                                    label="Last Name"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    fullWidth
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    name="email"
                                    label="Email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    fullWidth
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    name="position"
                                    label="Position"
                                    value={formData.position}
                                    onChange={handleInputChange}
                                    fullWidth
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Department</InputLabel>
                                    <Select
                                        name="department"
                                        value={formData.department}
                                        onChange={handleInputChange}
                                        label="Department"
                                    >
                                        {departments.map((dept) => (
                                            <MenuItem key={dept._id} value={dept._id}>
                                                {dept.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Role</InputLabel>
                                    <Select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        label="Role"
                                    >
                                        <MenuItem value="employee">Employee</MenuItem>
                                        <MenuItem value="hr">HR</MenuItem>
                                        <MenuItem value="admin">Admin</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    name="phoneNumber"
                                    label="Phone Number"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Reporting Manager</InputLabel>
                                    <Select
                                        name="reportingManager"
                                        value={formData.reportingManager}
                                        onChange={handleInputChange}
                                        label="Reporting Manager"
                                        required={formData.role !== 'admin'}
                                    >
                                        <MenuItem value="">
                                            <em>None</em>
                                        </MenuItem>
                                        {getFilteredManagers().map((manager) => (
                                            <MenuItem key={manager._id} value={manager._id}>
                                                {manager.firstName} {manager.lastName}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                {formData.role === 'admin' ? (
                                    <Typography variant="caption" color="text.secondary">
                                        Admin users do not require a reporting manager
                                    </Typography>
                                ) : (
                                    <Typography variant="caption" color="text.secondary">
                                        Required for non-admin employees
                                    </Typography>
                                )}
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {selectedEmployee ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
} 