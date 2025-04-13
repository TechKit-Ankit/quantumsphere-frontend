import { useEffect, useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext.jsx';
import {
    Box,
    Container,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    People,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Dashboard() {
    const { user } = useAuthContext();
    const [stats, setStats] = useState({
        totalEmployees: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [employeeData, setEmployeeData] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            setError('');
            try {
                const [statsRes, employeeRes] = await Promise.all([
                    axios.get(`${API_URL}/api/dashboard/stats`),
                    axios.get(`${API_URL}/api/employees/me`)
                ]);

                setStats(statsRes.data.data || statsRes.data);
                setEmployeeData(employeeRes.data.data || employeeRes.data);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setError('Failed to fetch dashboard data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Welcome back, {employeeData?.firstName || user?.email?.split('@')[0] || 'User'}!
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Here's what's happening in your organization today.
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Box sx={{ color: '#1976d2', mr: 2 }}><People sx={{ fontSize: 40 }} /></Box>
                                <Typography variant="h6" component="div">
                                    Total Employees
                                </Typography>
                            </Box>
                            <Typography variant="h4" component="div">
                                {stats.totalEmployees}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

        </Container>
    );
} 