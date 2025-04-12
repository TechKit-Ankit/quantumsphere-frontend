import { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext.jsx';
import axios from 'axios';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Grid,
    Paper,
    Alert,
    CircularProgress,
    Divider,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Tabs,
    Tab
} from '@mui/material';
import {
    AccessTime as ClockIcon,
    PlayArrow as ClockInIcon,
    Stop as ClockOutIcon,
    History as HistoryIcon,
    CalendarToday as CalendarIcon,
    Edit as EditIcon,
    Group as TeamIcon
} from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function TimeTracking() {
    const { user } = useAuthContext();
    const [todayEntry, setTodayEntry] = useState(null);
    const [recentEntries, setRecentEntries] = useState([]);
    const [teamEntries, setTeamEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [clockOutOpen, setClockOutOpen] = useState(false);
    const [notes, setNotes] = useState('');
    const [viewMode, setViewMode] = useState('my-time');
    const [isAdmin] = useState(user?.role === 'admin');
    const [isHR] = useState(user?.role === 'hr');
    const [isManager, setIsManager] = useState(false);

    useEffect(() => {
        fetchTimeData();
        checkManagerStatus();
    }, [viewMode]);

    const checkManagerStatus = async () => {
        try {
            const response = await axios.get('/api/employees/reporting-to-me');
            setIsManager(response.data.length > 0);
        } catch (err) {
            console.error('Error checking manager status:', err);
            setIsManager(false);
        }
    };

    const fetchTimeData = async () => {
        setLoading(true);
        try {
            // Get today's entry
            const todayResponse = await axios.get('/api/time-entries/today');
            setTodayEntry(todayResponse.data);

            if (viewMode === 'my-time') {
                // Get recent personal entries (last 10)
                const recentResponse = await axios.get('/api/time-entries?limit=10');
                setRecentEntries(recentResponse.data);
            } else if (viewMode === 'team-time' && (isManager || isAdmin || isHR)) {
                // Get team entries
                const teamResponse = await axios.get('/api/time-entries/team');
                setTeamEntries(teamResponse.data);
            }
        } catch (err) {
            console.error('Error fetching time data:', err);
            setError('Failed to load time data');
        } finally {
            setLoading(false);
        }
    };

    const handleClockIn = async () => {
        try {
            const response = await axios.post('/api/time-entries/clock-in', {
                location: 'Office'
            });

            setTodayEntry(response.data);
            setSuccess('Clocked in successfully');
            fetchTimeData(); // Refresh data
        } catch (err) {
            console.error('Error clocking in:', err);
            setError(err.response?.data?.message || 'Failed to clock in');
        }
    };

    const handleClockOutOpen = () => {
        setClockOutOpen(true);
    };

    const handleClockOutClose = () => {
        setClockOutOpen(false);
        setNotes('');
    };

    const handleClockOut = async () => {
        try {
            const response = await axios.post('/api/time-entries/clock-out', {
                location: 'Office',
                notes: notes
            });

            setTodayEntry(response.data);
            setSuccess('Clocked out successfully');
            handleClockOutClose();
            fetchTimeData(); // Refresh data
        } catch (err) {
            console.error('Error clocking out:', err);
            setError(err.response?.data?.message || 'Failed to clock out');
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const calculateDuration = (clockIn, clockOut) => {
        if (!clockIn || !clockOut) return 'N/A';

        const start = new Date(clockIn);
        const end = new Date(clockOut);
        const diffMs = end - start;

        // Convert to hours and minutes
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${minutes}m`;
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Time Tracking</Typography>
            </Box>

            {/* Tab Navigation for Different Views */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={viewMode}
                    onChange={(e, newValue) => setViewMode(newValue)}
                    aria-label="time tracking tabs"
                >
                    <Tab label="MY TIME" value="my-time" />
                    {(isManager || isAdmin || isHR) && (
                        <Tab label="TEAM TIME" value="team-time" />
                    )}
                </Tabs>
            </Box>

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

            {viewMode === 'my-time' && (
                <>
                    {/* Today's Time Entry Card */}
                    <Card sx={{ mb: 4 }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={2}>
                                <ClockIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="h5">Today's Attendance</Typography>
                            </Box>

                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={3}>
                                    <Box textAlign="center">
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Date
                                        </Typography>
                                        <Typography variant="h6">
                                            {new Date().toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} sm={3}>
                                    <Box textAlign="center">
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Clock In
                                        </Typography>
                                        <Typography variant="h6">
                                            {todayEntry?.clockIn?.time
                                                ? formatTime(todayEntry.clockIn.time)
                                                : 'Not Clocked In'}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} sm={3}>
                                    <Box textAlign="center">
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Clock Out
                                        </Typography>
                                        <Typography variant="h6">
                                            {todayEntry?.clockOut?.time
                                                ? formatTime(todayEntry.clockOut.time)
                                                : 'Not Clocked Out'}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} sm={3}>
                                    <Box textAlign="center">
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Hours Worked
                                        </Typography>
                                        <Typography variant="h6">
                                            {todayEntry?.totalHours ? `${todayEntry.totalHours} hrs` : 'N/A'}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            <Box display="flex" justifyContent="center" mt={3}>
                                {!todayEntry || !todayEntry.clockIn.time ? (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<ClockInIcon />}
                                        onClick={handleClockIn}
                                    >
                                        Clock In
                                    </Button>
                                ) : !todayEntry.clockOut.time ? (
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        startIcon={<ClockOutIcon />}
                                        onClick={handleClockOutOpen}
                                    >
                                        Clock Out
                                    </Button>
                                ) : (
                                    <Chip
                                        label="Shift Complete"
                                        color="success"
                                        variant="outlined"
                                    />
                                )}
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Recent Time Entries */}
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={2}>
                                <HistoryIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="h5">Recent Attendance</Typography>
                            </Box>

                            <TableContainer component={Paper} variant="outlined">
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Date</TableCell>
                                            <TableCell>Clock In</TableCell>
                                            <TableCell>Clock Out</TableCell>
                                            <TableCell>Hours</TableCell>
                                            <TableCell>Notes</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {recentEntries.length > 0 ? (
                                            recentEntries.map((entry) => (
                                                <TableRow key={entry._id}>
                                                    <TableCell>{formatDate(entry.date)}</TableCell>
                                                    <TableCell>{formatTime(entry.clockIn.time)}</TableCell>
                                                    <TableCell>{formatTime(entry.clockOut.time)}</TableCell>
                                                    <TableCell>{entry.totalHours} hrs</TableCell>
                                                    <TableCell>{entry.notes || '-'}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center">
                                                    No recent time entries found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </>
            )}

            {viewMode === 'team-time' && (
                <Card>
                    <CardContent>
                        <Box display="flex" alignItems="center" mb={2}>
                            <TeamIcon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="h5">Team Attendance</Typography>
                        </Box>

                        <TableContainer component={Paper} variant="outlined">
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Employee</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Clock In</TableCell>
                                        <TableCell>Clock Out</TableCell>
                                        <TableCell>Hours</TableCell>
                                        <TableCell>Notes</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {teamEntries.length > 0 ? (
                                        teamEntries.map((entry) => (
                                            <TableRow key={entry._id}>
                                                <TableCell>
                                                    {entry.employee?.firstName} {entry.employee?.lastName}
                                                </TableCell>
                                                <TableCell>{formatDate(entry.date)}</TableCell>
                                                <TableCell>{formatTime(entry.clockIn.time)}</TableCell>
                                                <TableCell>{formatTime(entry.clockOut.time)}</TableCell>
                                                <TableCell>{entry.totalHours} hrs</TableCell>
                                                <TableCell>{entry.notes || '-'}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
                                                No team time entries found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}

            {/* Clock Out Dialog */}
            <Dialog open={clockOutOpen} onClose={handleClockOutClose}>
                <DialogTitle>Clock Out</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" paragraph>
                        You are clocking out for {new Date().toLocaleDateString()}.
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Notes (Optional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any notes about your day..."
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClockOutClose}>Cancel</Button>
                    <Button variant="contained" color="primary" onClick={handleClockOut}>
                        Clock Out
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
} 