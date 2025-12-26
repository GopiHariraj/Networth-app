import axios from 'axios';

// Dynamically determine API URL based on current hostname
// This allows mobile devices to connect using the network IP
const getApiUrl = () => {
    // 1. Prioritize environment variable
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    // 2. Browser-side fallback logic
    if (typeof window !== 'undefined') {
        const { hostname, port, origin } = window.location;

        // If we're on localhost:3000 (frontend dev), backend is usually on :3001
        if ((hostname === 'localhost' || hostname === '127.0.0.1') && port === '3000') {
            return 'http://localhost:3001/api';
        }

        // If we are on port 3000 but not localhost (e.g., staging IP:3000), 
        // fallback to :3001 if possible, or relative /api
        if (port === '3000') {
            return `${origin.replace(':3000', ':3001')}/api`;
        }

        // Default: use relative path for Nginx/reverse proxy setups
        // This handles port 80/443 and any custom paths
        return `${origin}/api`;
    }

    // 3. Absolute fallback for SSR
    return 'http://localhost:3001/api';
};

const API_URL = getApiUrl();
console.log('[API Client] Initialized with Base URL:', API_URL);

export const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 15000, // 15 seconds timeout to prevent indefinite hangs
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling errors and token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and we haven't retried yet, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(`${API_URL}/auth/refresh`, {
                        refreshToken,
                    });

                    const { token } = response.data;
                    localStorage.setItem('token', token);

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, clear all user data and redirect to login
                const savedUser = localStorage.getItem('user');
                let userId: string | null = null;

                try {
                    if (savedUser) {
                        const user = JSON.parse(savedUser);
                        userId = user.id;
                    }
                } catch (e) {
                    // ignore parsing errors
                }

                // Clear authentication data
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('refreshToken');

                // Clear user-scoped data
                if (userId) {
                    localStorage.removeItem(`activeGoal_${userId}`);
                    localStorage.removeItem(`preferredCurrency_${userId}`);
                }

                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);


export const transactionsApi = {
    create: (data: any) => apiClient.post('/transactions', data),
    parseSMS: (text: string) => apiClient.post('/transactions/sms', { text }),
    findAll: () => apiClient.get('/transactions'),
    getDashboard: () => apiClient.get('/transactions/dashboard'),
};

export default apiClient;

