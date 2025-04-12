import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext.jsx';

export default function NotEnrolled() {
    const navigate = useNavigate();
    const { logout } = useAuthContext();

    const handleLogout = () => {
        console.log('Signing out...');
        logout();
        navigate('/');
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Not Enrolled
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Your account is not yet enrolled in the system. Please contact your administrator to complete the enrollment process.
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleLogout}
                        sx={{ mt: 2 }}
                    >
                        Sign Out
                    </Button>
                </Paper>
            </Box>
        </Container>
    );
} 