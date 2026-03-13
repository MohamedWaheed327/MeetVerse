import api from "./api";

/**
 * getCurrent new user
 * @param {Object} data
 */
export const getCurrentUser = async (data) => {
    try {
        const response = await api.post("/profile/me", {
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