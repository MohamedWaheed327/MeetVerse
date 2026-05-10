import api from "./api";

export type GroupDetails = {
  id: string;
  name: string;
  description: string | null;
  createdById: string;
  createdByName: string;
  createdAt: string;
  memberCount: number;
  currentUserRole: string;
};

export const getGroup = async (id: string): Promise<GroupDetails> => {
  try {
    const response = await api.get(`/groups/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching group:", error);
    throw error;
  }
};
