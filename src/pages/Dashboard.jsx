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
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    People,
    Business,
    EventNote,
    CheckCircle,
    Pending,
    Person,
    CalendarToday
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export default function Dashboard() {
    const { user } = useAuthContext();
    const [stats, setStats] = useState({
        totalEmployees: 0,
        pendingEnrollments: 0,
        activeLeaves: 0
    });
    const [recentActivities, setRecentActivities] = useState([]);
    const [recentLeaves, setRecentLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [employeeData, setEmployeeData] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, activitiesRes, leavesRes, employeeRes] = await Promise.all([
                    axios.get(`${API_URL}/dashboard/stats`),
                    axios.get(`${API_URL}/dashboard/recent-activities`),
                    axios.get(`${API_URL}/dashboard/recent-leaves`),
                    axios.get(`${API_URL}/employees/me`)
                ]);

                setStats(statsRes.data);
                setRecentActivities(activitiesRes.data);
                setRecentLeaves(leavesRes.data);
                setEmployeeData(employeeRes.data);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setError('Failed to fetch dashboard data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const statCards = [
        {
            title: 'Total Employees',
            value: stats.totalEmployees,
            icon: <People sx={{ fontSize: 40 }} />,
            color: '#1976d2',
        },
        {
            title: 'Pending Enrollments',
            value: stats.pendingEnrollments,
            icon: <Business sx={{ fontSize: 40 }} />,
            color: '#2e7d32',
        },
        {
            title: 'Active Leaves',
            value: stats.activeLeaves,
            icon: <EventNote sx={{ fontSize: 40 }} />,
            color: '#ed6c02',
        }
    ];

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

            <Grid container spacing={3}>
                {statCards.map((card) => (
                    <Grid item xs={12} sm={6} md={3} key={card.title}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Box sx={{ color: card.color, mr: 2 }}>{card.icon}</Box>
                                    <Typography variant="h6" component="div">
                                        {card.title}
                                    </Typography>
                                </Box>
                                <Typography variant="h4" component="div">
                                    {card.value}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Recent Activities
                        </Typography>
                        <List>
                            {recentActivities.length > 0 ? (
                                recentActivities.map((activity, index) => (
                                    <Box key={index}>
                                        <ListItem>
                                            <ListItemIcon>
                                                <Person />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={activity.description}
                                                secondary={new Date(activity.timestamp).toLocaleString()}
                                            />
                                        </ListItem>
                                        {index < recentActivities.length - 1 && <Divider />}
                                    </Box>
                                ))
                            ) : (
                                <ListItem>
                                    <ListItemText primary="No recent activities" />
                                </ListItem>
                            )}
                        </List>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Recent Leave Requests
                        </Typography>
                        <List>
                            {recentLeaves.length > 0 ? (
                                recentLeaves.map((leave, index) => (
                                    <Box key={index}>
                                        <ListItem>
                                            <ListItemIcon>
                                                <CalendarToday />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={`${leave.employee.firstName} ${leave.employee.lastName}`}
                                                secondary={`${leave.type} - ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()}`}
                                            />
                                        </ListItem>
                                        {index < recentLeaves.length - 1 && <Divider />}
                                    </Box>
                                ))
                            ) : (
                                <ListItem>
                                    <ListItemText primary="No recent leave requests" />
                                </ListItem>
                            )}
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
} 