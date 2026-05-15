import api from "./api";

export type UpdateGroupPayload = {
  name?: string;
  description?: string;
};

export const updateGroup = async (id: string, payload: UpdateGroupPayload): Promise<void> => {
  try {
    await api.put(`/groups/${id}`, payload);
  } catch (error) {
    console.error("Error updating group:", error);
    throw error;
  }
};
