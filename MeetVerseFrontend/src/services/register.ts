import api from "./api";

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
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw error.message;
        } else {
            throw { message: "Network error" };
        }
    }
};