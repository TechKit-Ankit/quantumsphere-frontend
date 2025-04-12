import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Chip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export default function CompanyManagement() {
    const [companies, setCompanies] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        emailDomain: '',
        emailSubdomain: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingCompany, setEditingCompany] = useState(null);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const response = await axios.get(`${API_URL}/companies`);
            setCompanies(response.data);
        } catch (error) {
            console.error('Error fetching companies:', error);
            setError('Failed to fetch companies');
        }
    };

    const handleOpenDialog = (company = null) => {
        if (company) {
            setEditingCompany(company);
            setFormData({
                name: company.name,
                emailDomain: company.emailDomain,
                emailSubdomain: company.emailSubdomain
            });
        } else {
            setEditingCompany(null);
            setFormData({
                name: '',
                emailDomain: '',
                emailSubdomain: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setError('');
        setSuccess('');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        if (!formData.name || !formData.emailDomain || !formData.emailSubdomain) {
            setError('All fields are required');
            return false;
        }
        if (!/^[a-z0-9]+$/.test(formData.emailSubdomain)) {
            setError('Subdomain can only contain lowercase letters and numbers');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            if (editingCompany) {
                await axios.put(`${API_URL}/companies/${editingCompany._id}`, formData);
            } else {
                await axios.post(`${API_URL}/companies`, formData);
            }
            setSuccess('Company saved successfully');
            handleCloseDialog();
            fetchCompanies();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to save company');
        }
    };

    const getEmailExample = (company) => {
        return `firstname.lastname@${company.emailSubdomain}.${company.emailDomain}`;
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">
                    Company Management
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Add Company
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Company Name</TableCell>
                            <TableCell>Email Domain</TableCell>
                            <TableCell>Email Format Example</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {companies.map((company) => (
                            <TableRow key={company._id}>
                                <TableCell>{company.name}</TableCell>
                                <TableCell>{`${company.emailSubdomain}.${company.emailDomain}`}</TableCell>
                                <TableCell>{getEmailExample(company)}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={company.status}
                                        color={company.status === 'active' ? 'success' : 'error'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleOpenDialog(company)}>
                                        <EditIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingCompany ? 'Edit Company' : 'Add New Company'}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Company Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Email Domain (e.g., company.com)"
                            name="emailDomain"
                            value={formData.emailDomain}
                            onChange={handleChange}
                            required
                            sx={{ mb: 2 }}
                            helperText="Main domain without subdomain"
                        />
                        <TextField
                            fullWidth
                            label="Email Subdomain"
                            name="emailSubdomain"
                            value={formData.emailSubdomain}
                            onChange={handleChange}
                            required
                            sx={{ mb: 2 }}
                            helperText="Only lowercase letters and numbers (e.g., 'hr' for hr.company.com)"
                        />
                        {formData.emailDomain && formData.emailSubdomain && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Email Format Example: firstname.lastname@{formData.emailSubdomain}.{formData.emailDomain}
                            </Alert>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">
                        {editingCompany ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
} 