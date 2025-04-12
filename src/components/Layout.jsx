import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, Navigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext.jsx';
import {
    AppBar,
    Box,
    CssBaseline,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    Button,
    Divider,
    useTheme,
    useMediaQuery,
    CircularProgress,
    Avatar
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    Person as PersonIcon,
    ExitToApp as ExitToAppIcon,
    CalendarToday as CalendarIcon,
    Assessment as AssessmentIcon,
    Settings as SettingsIcon,
    Business as BusinessIcon,
    PersonAdd as PersonAddIcon,
    EventNote as LeavesIcon,
    HowToReg as EnrollmentIcon,
    AccessTime as TimeTrackingIcon
} from '@mui/icons-material';
import axios from 'axios';

const drawerWidth = 240;

export default function Layout() {
    const { isAuthenticated, isLoading, error, user, logout } = useAuthContext();
    const [employeeData, setEmployeeData] = useState(null);
    const [hasReportingEmployees, setHasReportingEmployees] = useState(false);
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const fetchEmployeeData = async () => {
            try {
                const response = await axios.get('/api/employees/me');
                setEmployeeData(response.data);

                // Only check for reporting employees if the user is not an admin
                if (user?.role !== 'admin') {
                    try {
                        const reportingResponse = await axios.get('/api/employees/reporting-to-me');
                        setHasReportingEmployees(reportingResponse.data.length > 0);
                    } catch (error) {
                        console.error('Error checking reporting employees:', error);
                        // Default to false for reporting employees on error
                        setHasReportingEmployees(false);
                    }
                } else {
                    // Admins should have access to the leave management regardless
                    setHasReportingEmployees(false);
                }
            } catch (error) {
                console.error('Error fetching employee data:', error);
            }
        };

        if (isAuthenticated && user) {
            fetchEmployeeData();
        }
    }, [isAuthenticated, user]);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'Employees', icon: <PeopleIcon />, path: '/employees', role: 'admin' },
        { text: 'Departments', icon: <BusinessIcon />, path: '/departments', role: 'admin' },
        {
            text: 'Leave Management',
            icon: <LeavesIcon />,
            path: '/leaves',
        },
        {
            text: 'Time Tracking',
            icon: <TimeTrackingIcon />,
            path: '/time-tracking',
        },
        { text: 'Enrollment Management', icon: <EnrollmentIcon />, path: '/enroll', role: 'admin' },
        { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
    ];

    const drawer = (
        <div>
            <Toolbar sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                <Avatar
                    src={user?.imageUrl}
                    alt={(employeeData?.firstName || user?.firstName || '')}
                    sx={{ width: 60, height: 60, mb: 1 }}
                />
                <Typography variant="subtitle1" noWrap sx={{ fontWeight: 'bold' }}>
                    {employeeData?.firstName} {employeeData?.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || ''}
                </Typography>
            </Toolbar>
            <Divider />
            <List>
                {menuItems
                    .filter(item =>
                        (!item.role || item.role === user?.role) &&
                        (!item.showIf || item.showIf())
                    )
                    .map((item) => (
                        <ListItem
                            button
                            key={item.text}
                            onClick={() => navigate(item.path)}
                        >
                            <ListItemIcon>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItem>
                    ))}
            </List>
            <Divider />
            <List>
                <ListItem button onClick={handleLogout}>
                    <ListItemIcon><ExitToAppIcon /></ListItemIcon>
                    <ListItemText primary="Logout" />
                </ListItem>
            </List>
        </div>
    );

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 2 }}>
                <Typography color="error" variant="h6">Error</Typography>
                <Typography color="error">{error}</Typography>
                <Button variant="contained" onClick={handleLogout}>Sign Out</Button>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    zIndex: (theme) => theme.zIndex.drawer + 1
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Employee Management System
                    </Typography>
                    {user?.role && (
                        <Typography variant="body2" color="inherit" sx={{ mr: 2 }}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Typography>
                    )}
                    <IconButton color="inherit" onClick={handleLogout}>
                        <ExitToAppIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
                {isMobile ? (
                    <Drawer
                        variant="temporary"
                        open={mobileOpen}
                        onClose={handleDrawerToggle}
                        ModalProps={{
                            keepMounted: true, // Better open performance on mobile.
                        }}
                        sx={{
                            display: { xs: 'block', sm: 'none' },
                            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                        }}
                    >
                        {drawer}
                    </Drawer>
                ) : (
                    <Drawer
                        variant="permanent"
                        sx={{
                            display: { xs: 'none', sm: 'block' },
                            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                        }}
                        open
                    >
                        {drawer}
                    </Drawer>
                )}
            </Box>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    mt: 8
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
} 