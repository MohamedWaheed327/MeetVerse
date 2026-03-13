import api from "./api";

// Get current user profile
export const getCurrentUser = async (data) => {
    try {
        const response = await api.get("/profile/me", {});
        return response.data;
    } catch (error) {
        if (error.response) {
            throw error.response.data;
        } else {
            throw { message: "Network error" };
        }
    }
};


// // Update profile info
// export const updateUserProfile = async (data) => {
//     try {
//         const response = await api.put("/profile/me", data);
//         return response.data;
//     } catch (error) {
//         if (error.response) {
//             throw error.response.data;
//         } else {
//             throw { message: "Network error" };
//         }
//     }
// };

// // Update password
// export const updateUserPassword = async (data) => {
//     try {
//         const response = await api.put("/profile/me/password", data);
//         return response.data;
//     } catch (error) {
//         if (error.response) {
//             throw error.response.data;
//         } else {
//             throw { message: "Network error" };
//         }
//     }
// };

// // Delete account
// export const deleteUserAccount = async () => {
//     try {
//         const response = await api.delete("/profile/me");
//         return response.data;
//     } catch (error) {
//         if (error.response) {
//             throw error.response.data;
//         } else {
//             throw { message: "Network error" };
//         }
//     }
// };