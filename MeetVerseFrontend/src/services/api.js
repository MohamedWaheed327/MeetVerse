import axios from "axios";

// TODO: put host in json file
// const host = "http://meetverse-env.eba-qcpudpcc.us-east-1.elasticbeanstalk.com"; // include protocol to avoid relative path issues
const host = "https://d278p5zvdcqqh2.cloudfront.net"; // include protocol to avoid relative path issues

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