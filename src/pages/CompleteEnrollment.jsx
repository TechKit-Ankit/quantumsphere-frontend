import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Stepper,
    Step,
    StepLabel
} from '@mui/material';
import { useAuthContext } from '../contexts/AuthContext.jsx';
import axios from 'axios';

const steps = ['Verify Invite', 'Complete Profile', 'Create Account'];

export default function CompleteEnrollment() {
    const { token } = useParams();
    const navigate = useNavigate();
    const { verifyInviteToken, completeEnrollment } = useAuthContext();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [inviteData, setInviteData] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: ''
    });

    useEffect(() => {
        verifyToken();
    }, [token]);

    const verifyToken = async () => {
        try {
            const data = await verifyInviteToken(token);
            setInviteData(data);
            setFormData(prev => ({
                ...prev,
                email: data.email
            }));
            setActiveStep(1);
        } catch (error) {
            console.error('Error verifying token:', error);
            setError(error.response?.data?.message || 'Invalid or expired invite link');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await completeEnrollment(token, formData);
            setActiveStep(2);
        } catch (error) {
            console.error('Error completing enrollment:', error);
            setError(error.response?.data?.message || 'Failed to complete enrollment');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Button variant="contained" onClick={() => navigate('/')}>
                    Return to Home
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
            <Paper sx={{ p: 3 }}>
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {activeStep === 1 && (
                    <>
                        <Typography variant="h5" gutterBottom>
                            Complete Your Profile
                        </Typography>
                        <Typography color="text.secondary" paragraph>
                            You've been invited to join as a {inviteData?.position} in the {inviteData?.department} department.
                        </Typography>
                        <form onSubmit={handleSubmit}>
                            <TextField
                                fullWidth
                                label="First Name"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                label="Last Name"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                disabled
                                sx={{ mb: 3 }}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                            >
                                Complete Profile
                            </Button>
                        </form>
                    </>
                )}

                {activeStep === 2 && (
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" gutterBottom>
                            Profile Completed Successfully
                        </Typography>
                        <Typography paragraph>
                            Your profile has been submitted for approval. You will receive an email once your account is approved.
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/')}
                            size="large"
                        >
                            Return to Home
                        </Button>
                    </Box>
                )}
            </Paper>
        </Box>
    );
} 