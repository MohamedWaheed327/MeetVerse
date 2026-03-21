import api from "./api";

/**
 * login new user
 * @param {Object} data
 * @param {string} data.email
 * @param {string} data.password
 */
export const loginUser = async (data) => {
    try {
        const response = await api.post("/auth/login", JSON.stringify({ email, password }),
            {
                headers: {
                    'Content-Type': 'application/json'
                }
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