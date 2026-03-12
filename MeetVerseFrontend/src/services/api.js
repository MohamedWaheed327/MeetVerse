import axios from "axios";

// TODO: change the backend host
const host = "localhost:5279";

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