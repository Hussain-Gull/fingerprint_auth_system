import axios from "axios";

const axiosClient = axios.create({
    baseURL: "http://localhost:8000/api", // Updated to match backend API structure
    withCredentials: true, // Required to send cookies with requests
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 30000, // 30 second timeout for API calls
});

// Add request interceptor for logging
axiosClient.interceptors.request.use(
    (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error("API Request Error:", error);
        return Promise.reject(error);
    }
);

// Add response interceptor for error handling
axiosClient.interceptors.response.use(
    (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        console.error("API Response Error:", error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default axiosClient;