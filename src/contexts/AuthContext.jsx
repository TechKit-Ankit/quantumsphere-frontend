import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        setupAxiosInterceptors();
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.get('/api/auth/me');
            setUser(response.data.user);
            setIsAuthenticated(true);
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('token');
            setError(error.response?.data?.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    const setupAxiosInterceptors = () => {
        // Set base URL from environment variable
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        axios.defaults.baseURL = apiUrl;
        console.log('API URL set to:', apiUrl);

        // Clear any existing interceptors
        axios.interceptors.request.clear();
        axios.interceptors.response.clear();

        // Add request interceptor
        axios.interceptors.request.use((config) => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            console.log('Making request to:', config.url);
            return config;
        });

        // Add response interceptor
        axios.interceptors.response.use(
            (response) => response,
            (error) => {
                console.error('API Error:', error.response?.data);
                if (error.response?.status === 401) {
                    logout();
                }
                return Promise.reject(error);
            }
        );
    };

    const login = async (email, password) => {
        try {
            console.log('Attempting login with:', email);
            const response = await axios.post('/api/auth/login', { email, password });
            console.log('Login response:', response.data);

            const { token, user } = response.data;
            if (!token || !user) {
                throw new Error('Invalid response from server');
            }

            localStorage.setItem('token', token);
            setUser(user);
            setIsAuthenticated(true);
            return user;
        } catch (error) {
            console.error('Login error:', error);
            const errorMessage = error.response?.data?.message || 'Login failed';
            throw new Error(errorMessage);
        }
    };

    const register = async (email, password) => {
        try {
            console.log('Attempting registration with:', email);
            const response = await axios.post('/api/auth/register', { email, password });
            console.log('Registration response:', response.data);

            const { token, user } = response.data;
            if (!token || !user) {
                throw new Error('Invalid response from server');
            }

            localStorage.setItem('token', token);
            setUser(user);
            setIsAuthenticated(true);
            return user;
        } catch (error) {
            console.error('Registration error:', error);
            const errorMessage = error.response?.data?.message || 'Registration failed';
            throw new Error(errorMessage);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            isLoading,
            user,
            error,
            login,
            register,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};

// For backward compatibility
export const useAuth = () => useAuthContext(); 