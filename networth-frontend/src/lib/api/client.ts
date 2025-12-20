import axios from 'axios';

// Use environment variable directly - no dynamic hostname detection
// NEXT_PUBLIC_API_URL is set at build time and baked into the bundle
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';



export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token} `;
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
                    const response = await axios.post(`${API_URL} /auth/refresh`, {
                        refreshToken,
                    });

                    const { accessToken } = response.data;
                    localStorage.setItem('accessToken', accessToken);

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${accessToken} `;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, redirect to login
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);


export const transactionsApi = {
    create: (data: any) => apiClient.post('/transactions?userId=test-user-id', data), // Mock userId for dev
    parseSMS: (text: string) => apiClient.post('/transactions/sms?userId=test-user-id', { text }),
    findAll: () => apiClient.get('/transactions?userId=test-user-id'),
    getDashboard: () => apiClient.get('/transactions/dashboard?userId=test-user-id'),
};

export default apiClient;

