import api from "./api";

export const deleteGroup = async (groupId: string): Promise<void> => {
  try {
    await api.delete(`/groups/${groupId}`);
  } catch (error) {
    console.error("Error deleting group:", error);
    throw error;
  }
};
