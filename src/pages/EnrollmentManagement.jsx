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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
} from '@mui/material';
import { ContentCopy as CopyIcon } from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export default function EnrollmentManagement() {
    const { user } = useAuthContext();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        position: '',
        department: '',
        newDepartment: '',
        role: 'employee',
        reportingManager: '',
        phoneNumber: '',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: ''
        },
        emergencyContact: {
            name: '',
            relationship: '',
            phoneNumber: ''
        },
        salary: {
            amount: '',
            currency: 'USD'
        },
        leaveBalance: {
            total: 0
        },
        workSchedule: {
            startTime: '09:00',
            endTime: '18:00'
        }
    });
    const [departments, setDepartments] = useState([]);
    const [managers, setManagers] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [inviteLink, setInviteLink] = useState('');
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [emailExists, setEmailExists] = useState(false);
    const [isNewDepartment, setIsNewDepartment] = useState(false);

    useEffect(() => {
        fetchDepartments();
        fetchManagers();
    }, []);

    // Generate corporate email when name or role changes
    useEffect(() => {
        if (formData.firstName && formData.lastName) {
            generateUniqueEmail(formData.firstName, formData.lastName, formData.role);
        }
    }, [formData.firstName, formData.lastName, formData.role]);

    const generateUniqueEmail = async (firstName, lastName, role) => {
        try {
            // Convert to lowercase and remove special characters
            const cleanFirstName = firstName.toLowerCase().replace(/[^a-z]/g, '');
            const cleanLastName = lastName.toLowerCase().replace(/[^a-z]/g, '');

            // Get company domain from environment
            const domain = import.meta.env.VITE_COMPANY_DOMAIN || 'company.com';

            // Try different email formats until we find a unique one
            const emailFormats = [
                `${cleanFirstName}.${cleanLastName}`,
                `${cleanFirstName}${cleanLastName}`,
                `${cleanFirstName}.${cleanLastName}${Math.floor(Math.random() * 100)}`,
                `${cleanFirstName[0]}${cleanLastName}`,
                `${cleanFirstName}${cleanLastName[0]}`
            ];

            for (const format of emailFormats) {
                let email;
                if (role === 'admin') {
                    email = `${format}@admin.${domain}`;
                } else if (role === 'hr') {
                    email = `${format}@hr.${domain}`;
                } else {
                    email = `${format}@${domain}`;
                }

                // Check if email exists
                try {
                    const response = await axios.post(`${API_URL}/api/auth/check-email`, { email });
                    if (!response.data.exists) {
                        setFormData(prev => ({ ...prev, email }));
                        setEmailExists(false);
                        return;
                    }
                } catch (error) {
                    console.error('Error checking email:', error);
                }
            }

            // If all formats are taken, use timestamp
            const timestamp = Date.now();
            const email = role === 'admin'
                ? `${cleanFirstName}.${cleanLastName}.${timestamp}@admin.${domain}`
                : role === 'hr'
                    ? `${cleanFirstName}.${cleanLastName}.${timestamp}@hr.${domain}`
                    : `${cleanFirstName}.${cleanLastName}.${timestamp}@${domain}`;

            setFormData(prev => ({ ...prev, email }));
            setEmailExists(false);
        } catch (error) {
            console.error('Error generating email:', error);
            setError('Failed to generate unique email');
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/departments`);
            setDepartments(response.data);
        } catch (error) {
            console.error('Error fetching departments:', error);
            setError('Failed to fetch departments');
        }
    };

    const fetchManagers = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/employees?status=active`);
            setManagers(response.data);
        } catch (error) {
            console.error('Error fetching managers:', error);
            setError('Failed to fetch managers');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Handle department selection
        if (name === 'department') {
            if (value === 'new') {
                setIsNewDepartment(true);
                setFormData(prev => ({ ...prev, department: '', newDepartment: '' }));
            } else {
                setIsNewDepartment(false);
                setFormData(prev => ({ ...prev, department: value }));
            }
            return;
        }

        // Handle nested object fields
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (emailExists) {
            setError('Please wait for a unique email to be generated');
            return;
        }

        try {
            let departmentId = formData.department;

            // If adding new department
            if (isNewDepartment && formData.newDepartment) {
                try {
                    const deptResponse = await axios.post(`${API_URL}/api/departments`, {
                        name: formData.newDepartment,
                        description: `${formData.newDepartment} Department`,
                        status: 'active'
                    });

                    // Update departments list and get the new department's ID
                    await fetchDepartments();
                    departmentId = deptResponse.data._id;
                } catch (error) {
                    setError(error.response?.data?.message || 'Failed to create department');
                    return;
                }
            }

            // Validate that we have a department ID
            if (!departmentId && !isNewDepartment) {
                setError('Please select a department or create a new one');
                return;
            }

            // Get current user's company ID
            const meResponse = await axios.get(`${API_URL}/api/auth/me`);
            console.log('Current user data:', meResponse.data);

            // Extract company ID from the response
            const userData = meResponse.data;
            const companyId = userData?.user?.company;

            if (!companyId) {
                console.error('Company ID not found in user data:', userData);
                setError('Company information not found. Please contact support.');
                return;
            }

            // Check if email exists one last time before registration
            const emailCheckResponse = await axios.post(`${API_URL}/api/auth/check-email`, {
                email: formData.email
            });

            if (emailCheckResponse.data.exists) {
                await generateUniqueEmail(formData.firstName, formData.lastName, formData.role);
            }

            // Create user with company ID
            const userResponse = await axios.post(`${API_URL}/api/auth/register`, {
                email: formData.email,
                password: 'Welcome123',
                role: formData.role,
                company: companyId,
                firstName: formData.firstName,
                lastName: formData.lastName,
                status: 'active'
            });

            console.log('User creation response:', userResponse.data);

            if (!userResponse.data?.user?._id) {
                console.error('Invalid user creation response:', userResponse.data);
                throw new Error('Failed to create user account');
            }

            // Create employee with user reference and company ID
            const employeeData = {
                ...formData,
                userId: userResponse.data.user._id,
                department: departmentId,
                company: companyId, // Explicitly set company ID
                enrollmentStatus: 'completed',
                status: 'active',
                joinDate: new Date(),
                salary: {
                    ...formData.salary,
                    lastUpdated: new Date()
                },
                leaveBalance: {
                    ...formData.leaveBalance,
                    used: 0,
                    remaining: formData.leaveBalance.total || 0,
                    total: formData.leaveBalance.total || 0
                },
                workSchedule: {
                    startTime: formData.workSchedule?.startTime || '09:00',
                    endTime: formData.workSchedule?.endTime || '18:00',
                    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                }
            };

            // Remove any undefined or null values
            Object.keys(employeeData).forEach(key => {
                if (employeeData[key] === undefined || employeeData[key] === null) {
                    delete employeeData[key];
                }
            });

            console.log('Creating employee with data:', employeeData);
            const response = await axios.post(`${API_URL}/api/employees`, employeeData);

            setSuccess(`Employee enrolled successfully!
Login Credentials:
Email: ${formData.email}
Default Password: Welcome123
Please ask the employee to change their password after first login.`);
            setError('');
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                position: '',
                department: '',
                newDepartment: '',
                role: 'employee',
                reportingManager: '',
                phoneNumber: '',
                address: {
                    street: '',
                    city: '',
                    state: '',
                    zipCode: ''
                },
                emergencyContact: {
                    name: '',
                    relationship: '',
                    phoneNumber: ''
                },
                salary: {
                    amount: '',
                    currency: 'USD'
                },
                leaveBalance: {
                    total: 0
                },
                workSchedule: {
                    startTime: '09:00',
                    endTime: '18:00'
                }
            });
            setIsNewDepartment(false);
        } catch (error) {
            console.error('Enrollment error:', error.response?.data);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to enroll employee';
            setError(errorMessage);
        }
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setSnackbarMessage('Invite link copied to clipboard!');
            setShowSnackbar(true);
        } catch (err) {
            setSnackbarMessage('Failed to copy invite link');
            setShowSnackbar(true);
        }
    };

    return (
        <Box component={Paper} p={3}>
            <Typography variant="h5" gutterBottom>
                Employee Enrollment
            </Typography>

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

            <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="First Name"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                            margin="normal"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Last Name"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                            margin="normal"
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Corporate Email"
                            name="email"
                            value={formData.email}
                            InputProps={{ readOnly: true }}
                            margin="normal"
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Phone Number"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            required
                            margin="normal"
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Position"
                            name="position"
                            value={formData.position}
                            onChange={handleChange}
                            required
                            margin="normal"
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Role</InputLabel>
                            <Select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                required
                            >
                                <MenuItem value="employee">Employee</MenuItem>
                                <MenuItem value="hr">HR</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Department</InputLabel>
                            <Select
                                name="department"
                                value={isNewDepartment ? 'new' : formData.department}
                                onChange={handleChange}
                                required={!isNewDepartment}
                            >
                                {departments.map((dept) => (
                                    <MenuItem key={dept._id} value={dept._id}>
                                        {dept.name}
                                    </MenuItem>
                                ))}
                                <MenuItem value="new">+ Add New Department</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    {isNewDepartment && (
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="New Department Name"
                                name="newDepartment"
                                value={formData.newDepartment}
                                onChange={handleChange}
                                required
                                margin="normal"
                                autoFocus
                            />
                        </Grid>
                    )}

                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                            Address Information
                        </Typography>
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Street Address"
                            name="address.street"
                            value={formData.address.street}
                            onChange={handleChange}
                            required
                            margin="normal"
                        />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            label="City"
                            name="address.city"
                            value={formData.address.city}
                            onChange={handleChange}
                            required
                            margin="normal"
                        />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            label="State"
                            name="address.state"
                            value={formData.address.state}
                            onChange={handleChange}
                            required
                            margin="normal"
                        />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            label="ZIP Code"
                            name="address.zipCode"
                            value={formData.address.zipCode}
                            onChange={handleChange}
                            required
                            margin="normal"
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                            Emergency Contact
                        </Typography>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            label="Contact Name"
                            name="emergencyContact.name"
                            value={formData.emergencyContact.name}
                            onChange={handleChange}
                            required
                            margin="normal"
                        />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            label="Relationship"
                            name="emergencyContact.relationship"
                            value={formData.emergencyContact.relationship}
                            onChange={handleChange}
                            required
                            margin="normal"
                        />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            label="Contact Phone"
                            name="emergencyContact.phoneNumber"
                            value={formData.emergencyContact.phoneNumber}
                            onChange={handleChange}
                            required
                            margin="normal"
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                            Reporting Manager
                        </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Reporting Manager</InputLabel>
                            <Select
                                name="reportingManager"
                                value={formData.reportingManager}
                                onChange={handleChange}
                                required={formData.role !== 'admin'}
                            >
                                <MenuItem value="">Select a Reporting Manager</MenuItem>
                                {managers.map((manager) => (
                                    <MenuItem key={manager._id} value={manager._id}>
                                        {manager.firstName} {manager.lastName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {formData.role === 'admin' && (
                            <Typography variant="caption" color="text.secondary">
                                Note: Admin users do not require a reporting manager
                            </Typography>
                        )}
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                            Compensation & Schedule
                        </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Salary Amount"
                            name="salary.amount"
                            type="number"
                            value={formData.salary.amount}
                            onChange={handleChange}
                            required
                            margin="normal"
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Annual Leave Days"
                            name="leaveBalance.total"
                            type="number"
                            value={formData.leaveBalance.total}
                            onChange={handleChange}
                            required
                            margin="normal"
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Work Start Time"
                            name="workSchedule.startTime"
                            type="time"
                            value={formData.workSchedule.startTime}
                            onChange={handleChange}
                            required
                            margin="normal"
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Work End Time"
                            name="workSchedule.endTime"
                            type="time"
                            value={formData.workSchedule.endTime}
                            onChange={handleChange}
                            required
                            margin="normal"
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            size="large"
                            fullWidth
                            sx={{ mt: 3 }}
                        >
                            Enroll Employee
                        </Button>
                    </Grid>
                </Grid>
            </form>

            <Snackbar
                open={showSnackbar}
                autoHideDuration={3000}
                onClose={() => setShowSnackbar(false)}
                message={snackbarMessage}
            />
        </Box>
    );
} 