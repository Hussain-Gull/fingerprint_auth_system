import axios from "axios";

const axiosClient = axios.create({
    baseURL: "http://localhost:8000/", // or full backend URL like "http://localhost:5000/api/v1"
    withCredentials: true, // 🔐 Required to send cookies with requests
    headers: {
        "Content-Type": "application/json",
    },
});

export default axiosClient;