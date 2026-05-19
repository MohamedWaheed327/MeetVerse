import api from "./api";
import axios from "axios";

/**
 * Register new user
 * @param {Object} data
 * @param {string} data.email
 * @param {string} data.password
 * @param {string} data.name
 */
export const registerUser = async (data: { name: string, email: string, password: string }) => {
    try {
        const response = await api.post("/auth/register", data);
        return response.data;
    } catch (err: unknown) {
        let message = "Network error";
        if (axios.isAxiosError(err)) {
            // Try to extract a useful error message from server response
            if (err.response?.data) {
                // Some endpoints return a string, others an object { message: '...' }
                const resp = err.response.data as any;
                if (typeof resp === 'string') message = resp;
                else if (resp.message) message = resp.message;
                else if (resp.error) message = resp.error;
                else message = JSON.stringify(resp);
            } else if (err.message) {
                message = err.message;
            }
        } else if (err instanceof Error) {
            message = err.message;
        }

        throw new Error(message);
    }
};