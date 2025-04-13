// API URL configuration
const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) {
    throw new Error('VITE_API_URL environment variable is not set');
}

// API endpoints
export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/api/auth/login',
        REGISTER: '/api/auth/register',
        ME: '/api/auth/me',
        CHECK_EMAIL: '/api/auth/check-email',
        CHANGE_PASSWORD: '/api/auth/change-password'
    },
    EMPLOYEES: {
        ME: '/api/employees/me',
        ALL: '/api/employees',
        REPORTING: '/api/employees/reporting-to-me',
        CHANGE_PASSWORD: '/api/employees/change-password'
    },
    LEAVES: {
        ALL: '/api/leaves',
        TEAM: '/api/leaves?view=team-leaves',
        EMPLOYEE: (employeeId) => `/api/leaves/employee/${employeeId}`,
        UPDATE_STATUS: (id) => `/api/leaves/${id}/status`,
        UPDATE: (id) => `/api/leaves/${id}`,
        DELETE: (id) => `/api/leaves/${id}`
    },
    TIME_ENTRIES: {
        TODAY: '/api/time-entries/today',
        CLOCK_IN: '/api/time-entries/clock-in',
        CLOCK_OUT: '/api/time-entries/clock-out',
        TEAM: '/api/time-entries/team',
        RECENT: '/api/time-entries?limit=10'
    },
    DASHBOARD: {
        STATS: '/api/dashboard/stats',
        RECENT_ACTIVITIES: '/api/dashboard/recent-activities',
        RECENT_LEAVES: '/api/dashboard/recent-leaves'
    },
    DEPARTMENTS: {
        ALL: '/api/departments',
        GET: (id) => `/api/departments/${id}`,
        CREATE: '/api/departments',
        UPDATE: (id) => `/api/departments/${id}`,
        DELETE: (id) => `/api/departments/${id}`
    },
    COMPANIES: {
        ALL: '/api/companies',
        REGISTER: '/api/companies/register',
        CREATE: '/api/companies',
        UPDATE: (id) => `/api/companies/${id}`,
        DELETE: (id) => `/api/companies/${id}`
    },
    HEALTH: '/api/health'
};

// Validate API endpoints
const validateEndpoints = () => {
    const requiredEndpoints = [
        '/api/health',
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/me',
        '/api/auth/check-email',
        '/api/employees/me',
        '/api/leaves',
        '/api/dashboard/stats',
        '/api/time-entries/today',
        '/api/departments',
        '/api/companies'
    ];

    const missingEndpoints = requiredEndpoints.filter(endpoint =>
        !Object.values(API_ENDPOINTS).some(group => {
            if (typeof group === 'object') {
                return Object.values(group).some(value =>
                    typeof value === 'string' && value === endpoint
                );
            }
            return false;
        })
    );

    if (missingEndpoints.length > 0) {
        console.warn('Missing API endpoints:', missingEndpoints);
    }
};

validateEndpoints();

// Log the API URL being used (only in development)
if (import.meta.env.DEV) {
    console.log('Using API URL:', API_URL);
}

export { API_URL }; 