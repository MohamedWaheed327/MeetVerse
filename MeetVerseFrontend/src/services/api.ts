import axios from "axios";

const host = import.meta.env.DEV ? import.meta.env.VITE_BACKEND_DEV : import.meta.env.VITE_BACKEND_PROD;

const api = axios.create({
    baseURL: host + "/api",
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;


export function update_api_authentication() {
    api.interceptors.request.use((config) => {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });
};