import { useState } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Alert,
    Stepper,
    Step,
    StepLabel,
    FormControl,
    InputLabel,
    OutlinedInput,
    InputAdornment,
    IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const steps = ['Company Details', 'Admin Account', 'Review'];

export default function CompanyRegistration() {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        emailDomain: '',
        adminFirstName: '',
        adminLastName: '',
        adminPassword: '',
        adminEmail: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Generate admin email when name changes
        if (name === 'adminFirstName' || name === 'adminLastName') {
            const firstName = name === 'adminFirstName' ? value : formData.adminFirstName;
            const lastName = name === 'adminLastName' ? value : formData.adminLastName;
            if (firstName && lastName && formData.emailDomain) {
                const cleanFirstName = firstName.toLowerCase().replace(/[^a-z]/g, '');
                const cleanLastName = lastName.toLowerCase().replace(/[^a-z]/g, '');
                const adminEmail = `${cleanFirstName}.${cleanLastName}@admin.${formData.emailDomain}`;
                setFormData(prev => ({ ...prev, adminEmail }));
            }
        }

        // Update admin email when domain changes
        if (name === 'emailDomain' && formData.adminFirstName && formData.adminLastName) {
            const cleanFirstName = formData.adminFirstName.toLowerCase().replace(/[^a-z]/g, '');
            const cleanLastName = formData.adminLastName.toLowerCase().replace(/[^a-z]/g, '');
            const adminEmail = `${cleanFirstName}.${cleanLastName}@admin.${value}`;
            setFormData(prev => ({ ...prev, adminEmail }));
        }
    };

    const validateStep = () => {
        switch (activeStep) {
            case 0:
                if (!formData.companyName || !formData.emailDomain) {
                    setError('Please fill in all company details');
                    return false;
                }
                if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/.test(formData.emailDomain)) {
                    setError('Please enter a valid domain (e.g., company.com)');
                    return false;
                }
                break;
            case 1:
                if (!formData.adminFirstName || !formData.adminLastName || !formData.adminPassword) {
                    setError('Please fill in all admin details');
                    return false;
                }
                if (formData.adminPassword.length < 6) {
                    setError('Password must be at least 6 characters long');
                    return false;
                }
                break;
            default:
                return true;
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep()) {
            setError('');
            setActiveStep((prevStep) => prevStep + 1);
        }
    };

    const handleBack = () => {
        setError('');
        setActiveStep((prevStep) => prevStep - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${API_URL}/api/companies/register`, formData);
            // Check for the new response structure
            const isSuccess = response.data.success !== false;

            if (isSuccess) {
                navigate('/auth', {
                    state: {
                        message: 'Company registered successfully! Please log in with your admin credentials.',
                        email: formData.adminEmail
                    }
                });
            } else {
                throw new Error(response.data.message || 'Registration failed');
            }
        } catch (error) {
            setError(error.response?.data?.message || error.message || 'Registration failed');
        }
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Company Name"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleChange}
                            required
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Email Domain"
                            name="emailDomain"
                            value={formData.emailDomain}
                            onChange={handleChange}
                            required
                            helperText="e.g., company.com"
                            sx={{ mb: 2 }}
                        />
                    </Box>
                );
            case 1:
                return (
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Admin First Name"
                            name="adminFirstName"
                            value={formData.adminFirstName}
                            onChange={handleChange}
                            required
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Admin Last Name"
                            name="adminLastName"
                            value={formData.adminLastName}
                            onChange={handleChange}
                            required
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Admin Email"
                            value={formData.adminEmail}
                            InputProps={{ readOnly: true }}
                            sx={{ mb: 2 }}
                        />
                        <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                            <InputLabel>Password</InputLabel>
                            <OutlinedInput
                                type={showPassword ? 'text' : 'password'}
                                name="adminPassword"
                                value={formData.adminPassword}
                                onChange={handleChange}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                                label="Password"
                            />
                        </FormControl>
                    </Box>
                );
            case 2:
                return (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>Review Your Details</Typography>
                        <Typography><strong>Company Name:</strong> {formData.companyName}</Typography>
                        <Typography><strong>Email Domain:</strong> {formData.emailDomain}</Typography>
                        <Typography><strong>Admin Name:</strong> {formData.adminFirstName} {formData.adminLastName}</Typography>
                        <Typography><strong>Admin Email:</strong> {formData.adminEmail}</Typography>
                        <Alert severity="info" sx={{ mt: 2 }}>
                            Email Format Examples:
                            <br />
                            Admin: firstname.lastname@admin.{formData.emailDomain}
                            <br />
                            HR: firstname.lastname@hr.{formData.emailDomain}
                            <br />
                            Employee: firstname.lastname@{formData.emailDomain}
                        </Alert>
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h4" align="center" gutterBottom>
                        Register Your Company
                    </Typography>

                    <Stepper activeStep={activeStep} sx={{ mt: 3, mb: 4 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <form onSubmit={handleSubmit}>
                        {renderStepContent(activeStep)}

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                            <Button
                                onClick={handleBack}
                                disabled={activeStep === 0}
                            >
                                Back
                            </Button>
                            {activeStep === steps.length - 1 ? (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSubmit}
                                >
                                    Register Company
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    onClick={handleNext}
                                >
                                    Next
                                </Button>
                            )}
                        </Box>
                    </form>
                </Paper>
            </Box>
        </Container>
    );
} 