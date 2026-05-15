import api from "./api";

export const removeGroupMember = async (groupId: string, memberId: string): Promise<void> => {
  try {
    await api.delete(`/groups/${groupId}/members/${memberId}`);
  } catch (error) {
    console.error("Error removing group member:", error);
    throw error;
  }
};
