import { useState } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    TextField,
    Button,
    Alert,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext.jsx';

export default function Auth() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();
    const { login } = useAuthContext();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed');
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Paper elevation={3} sx={{ width: '100%', borderRadius: 2 }}>
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h5" align="center" gutterBottom>
                            Employee Portal Login
                        </Typography>
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                            Use your company email and password to access your account
                        </Typography>

                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                        <form onSubmit={handleSubmit}>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                label="Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                sx={{ mb: 3 }}
                            />
                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                size="large"
                            >
                                Sign In
                            </Button>
                        </form>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}