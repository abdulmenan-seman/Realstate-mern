import axios from "axios";

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// Response interceptor for consistent error extraction
apiClient.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        const message =
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "An unexpected error occurred. Please try again.";

        return Promise.reject({
            statusCode: error.response?.status || 500,
            message,
            errors: error.response?.data?.errors || [],
            originalError: error,
        });
    }
);

export default apiClient;
