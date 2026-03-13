import api from "./api";

/**
 * Register new user
 * @param {Object} data
 * @param {string} data.email
 * @param {string} data.password
 * @param {string} data.name
 */
export const registerUser = async (data) => {
    try {
        const response = await api.post("/auth/register", {
            email: data.email,
            password: data.password,
            name: data.name,
        });

        return response.data;
    } catch (error) {
        if (error.response) {
            throw error.response.data;
        } else {
            throw { message: "Network error" };
        }
    }
};