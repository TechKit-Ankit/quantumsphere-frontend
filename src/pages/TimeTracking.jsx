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
import { API_ENDPOINTS } from '../config';
import { extractResponseData, ensureArray, extractErrorMessage } from '../utils/apiUtils';

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
    const [viewMode, setViewMode] = useState('personal');
    const [isAdmin] = useState(user?.role === 'admin');
    const [isHR] = useState(user?.role === 'hr');
    const [isManager, setIsManager] = useState(false);

    useEffect(() => {
        checkManagerStatus();
        fetchTimeData();
    }, [viewMode]);

    const checkManagerStatus = async () => {
        try {
            const response = await axios.get(API_ENDPOINTS.EMPLOYEES.ME);
            if (!response || !response.data) {
                console.error('Empty response when checking manager status');
                return;
            }

            const employeeData = extractResponseData(response);
            if (employeeData) {
                setIsManager(employeeData.role === 'manager');
            }
        } catch (error) {
            console.error('Error checking manager status:', error);
        }
    };

    const fetchTimeData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch today's entry
            try {
                const todayResponse = await axios.get(API_ENDPOINTS.TIME_ENTRIES.TODAY);
                const todayData = extractResponseData(todayResponse);
                setTodayEntry(todayData);
            } catch (err) {
                console.error('Error fetching today\'s time entry:', err);
                setTodayEntry(null);
            }

            // Fetch recent entries
            try {
                const recentResponse = await axios.get(API_ENDPOINTS.TIME_ENTRIES.RECENT);
                const recentData = extractResponseData(recentResponse);
                setRecentEntries(ensureArray(recentData));
            } catch (err) {
                console.error('Error fetching recent time entries:', err);
                setRecentEntries([]);
            }

            // Fetch team entries if manager
            if (isManager && viewMode === 'team') {
                try {
                    const teamResponse = await axios.get(API_ENDPOINTS.TIME_ENTRIES.TEAM);
                    const teamData = extractResponseData(teamResponse);
                    setTeamEntries(ensureArray(teamData));
                } catch (err) {
                    console.error('Error fetching team time entries:', err);
                    setTeamEntries([]);
                }
            }
        } catch (error) {
            console.error('Error fetching time data:', error);
            setError('Failed to fetch time data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleClockIn = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.post(API_ENDPOINTS.TIME_ENTRIES.CLOCK_IN);
            if (!response || !response.data) {
                throw new Error('Empty response received when clocking in');
            }

            const entryData = extractResponseData(response);
            if (entryData) {
                setTodayEntry(entryData);
                setSuccess('Successfully clocked in!');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                throw new Error('Invalid data received when clocking in');
            }
        } catch (error) {
            console.error('Error clocking in:', error);
            setError(extractErrorMessage(error) || 'Failed to clock in. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClockOut = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.post(API_ENDPOINTS.TIME_ENTRIES.CLOCK_OUT, { notes });
            if (!response || !response.data) {
                throw new Error('Empty response received when clocking out');
            }

            const entryData = extractResponseData(response);
            if (entryData) {
                setTodayEntry(entryData);
                setSuccess('Successfully clocked out!');
                setClockOutOpen(false);
                setNotes('');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                throw new Error('Invalid data received when clocking out');
            }
        } catch (error) {
            console.error('Error clocking out:', error);
            setError(extractErrorMessage(error) || 'Failed to clock out. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const calculateDuration = (startTime, endTime) => {
        if (!startTime || !endTime) return 'In Progress';
        const start = new Date(startTime);
        const end = new Date(endTime);
        const diff = end - start;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
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
                    <Tab label="MY TIME" value="personal" />
                    {(isManager || isAdmin || isHR) && (
                        <Tab label="TEAM TIME" value="team" />
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

            {viewMode === 'personal' && (
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
                                        onClick={() => setClockOutOpen(true)}
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
                                                    <TableCell>{formatDate(entry.clockIn)}</TableCell>
                                                    <TableCell>{formatTime(entry.clockIn)}</TableCell>
                                                    <TableCell>{formatTime(entry.clockOut)}</TableCell>
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

            {viewMode === 'team' && (
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
                                                <TableCell>{formatDate(entry.clockIn)}</TableCell>
                                                <TableCell>{formatTime(entry.clockIn)}</TableCell>
                                                <TableCell>{formatTime(entry.clockOut)}</TableCell>
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
            <Dialog open={clockOutOpen} onClose={() => setClockOutOpen(false)}>
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
                    <Button onClick={() => setClockOutOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="primary" onClick={handleClockOut}>
                        Clock Out
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
} 