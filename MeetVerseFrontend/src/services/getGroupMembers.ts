import api from "./api";

export const getGroupMembers = async (id: string) => {
    try {
        const response = await api.get(`/groups/${id}/members`);
        const processedData = response.data.map((member: { UserId: string, Role: string, name: string}) => ({
            ...member,
            status: "Online"
        }));

        return processedData;
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw Error(error.message);
        } else {
            throw Error("Network error");
        }
    }
};
