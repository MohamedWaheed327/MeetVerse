import axios from "axios";

// TODO: change the backend host
const host = "http://localhost:5279"; // include protocol to avoid relative path issues

const api = axios.create({
    baseURL: host + "/api",
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;