import { Box, Typography, Button, Container, Grid, Paper, Card, CardContent, CardMedia } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext.jsx';
import {
    BusinessCenter as BusinessIcon,
    People as PeopleIcon,
    Security as SecurityIcon,
    Speed as SpeedIcon,
    Logout as LogoutIcon
} from '@mui/icons-material';

export default function LandingPage() {
    const navigate = useNavigate();
    const { isAuthenticated, logout } = useAuthContext();

    const handleSignOut = () => {
        logout();
        navigate('/');
    };

    const features = [
        {
            title: 'Employee Management',
            description: 'Efficiently manage employee information, roles, and departments in one centralized system.',
            icon: <PeopleIcon fontSize="large" color="primary" />
        },
        {
            title: 'Leave Management',
            description: 'Streamlined leave request and approval process with comprehensive tracking.',
            icon: <BusinessIcon fontSize="large" color="primary" />
        },
        {
            title: 'Secure Access',
            description: 'Role-based permissions ensure data security and appropriate access levels.',
            icon: <SecurityIcon fontSize="large" color="primary" />
        },
        {
            title: 'Real-time Dashboard',
            description: 'Get instant insights with our comprehensive dashboard and reporting tools.',
            icon: <SpeedIcon fontSize="large" color="primary" />
        }
    ];

    return (
        <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }}>
            {/* Hero Section */}
            <Box
                sx={{
                    pt: 12,
                    pb: 8,
                    background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                    color: 'white'
                }}
            >
                <Container maxWidth="lg">
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
                                Employee Management System
                            </Typography>
                            <Typography variant="h5" paragraph sx={{ mb: 4, opacity: 0.9 }}>
                                Streamline your workplace operations with our comprehensive employee management solution.
                            </Typography>
                            {!isAuthenticated ? (
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        size="large"
                                        onClick={() => navigate('/auth')}
                                        sx={{
                                            px: 4,
                                            py: 1.5,
                                            fontWeight: 'bold',
                                            borderRadius: 2,
                                            backgroundColor: 'white',
                                            color: '#1976d2',
                                            '&:hover': {
                                                backgroundColor: '#f5f5f5'
                                            }
                                        }}
                                    >
                                        Sign In
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        onClick={() => navigate('/register-company')}
                                        sx={{
                                            px: 4,
                                            py: 1.5,
                                            fontWeight: 'bold',
                                            borderRadius: 2,
                                            borderColor: 'white',
                                            color: 'white',
                                            '&:hover': {
                                                borderColor: 'white',
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                            }
                                        }}
                                    >
                                        Register Company
                                    </Button>
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        size="large"
                                        onClick={() => navigate('/dashboard')}
                                        sx={{
                                            px: 4,
                                            py: 1.5,
                                            fontWeight: 'bold',
                                            borderRadius: 2,
                                            backgroundColor: 'white',
                                            color: '#1976d2',
                                            '&:hover': {
                                                backgroundColor: '#f5f5f5'
                                            }
                                        }}
                                    >
                                        Go to Dashboard
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="secondary"
                                        size="large"
                                        onClick={handleSignOut}
                                        startIcon={<LogoutIcon />}
                                        sx={{
                                            px: 4,
                                            py: 1.5,
                                            fontWeight: 'bold',
                                            borderRadius: 2,
                                            borderColor: 'white',
                                            color: 'white',
                                            '&:hover': {
                                                borderColor: 'white',
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                            }
                                        }}
                                    >
                                        Sign Out
                                    </Button>
                                </Box>
                            )}
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box
                                component="img"
                                src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                                alt="Team collaboration"
                                sx={{
                                    width: '100%',
                                    maxHeight: 400,
                                    objectFit: 'cover',
                                    borderRadius: 4,
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                                }}
                            />
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Features Section */}
            <Container sx={{ py: 8 }}>
                <Typography variant="h3" component="h2" align="center" gutterBottom sx={{ mb: 6 }}>
                    Key Features
                </Typography>
                <Grid container spacing={4}>
                    {features.map((feature, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <Paper
                                elevation={2}
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    p: 3,
                                    borderRadius: 2,
                                    transition: 'transform 0.3s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-5px)',
                                        boxShadow: 3
                                    }
                                }}
                            >
                                <Box sx={{ mb: 2 }}>
                                    {feature.icon}
                                </Box>
                                <Typography variant="h6" component="h3" gutterBottom fontWeight="bold">
                                    {feature.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {feature.description}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* Call to Action */}
            <Box sx={{ bgcolor: '#e3f2fd', py: 8 }}>
                <Container>
                    <Grid container justifyContent="center" spacing={4}>
                        <Grid item xs={12} md={6} textAlign="center">
                            <Typography variant="h4" component="h2" gutterBottom>
                                Already have an account?
                            </Typography>
                            <Typography variant="body1" paragraph sx={{ mb: 4 }}>
                                Sign in to access your employee management dashboard.
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                size="large"
                                onClick={() => navigate('/auth')}
                                sx={{ px: 4, py: 1.5 }}
                            >
                                Sign In
                            </Button>
                        </Grid>
                        <Grid item xs={12} md={6} textAlign="center">
                            <Typography variant="h4" component="h2" gutterBottom>
                                New to our platform?
                            </Typography>
                            <Typography variant="body1" paragraph sx={{ mb: 4 }}>
                                Register your company and start managing your employees efficiently.
                            </Typography>
                            <Button
                                variant="outlined"
                                color="primary"
                                size="large"
                                onClick={() => navigate('/register-company')}
                                sx={{ px: 4, py: 1.5 }}
                            >
                                Register Your Company
                            </Button>
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        </Box>
    );
} 