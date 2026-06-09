import api from "./api";

export type GroupMember = {
  userId: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  role: string;
  joinedAt?: string;
  status: string;
};

function normalizeMember(raw: Record<string, unknown>): GroupMember {
  const userId = String(raw.userId ?? raw.UserId ?? "");
  const role = String(raw.role ?? raw.Role ?? "Member");
  return {
    userId,
    name: String(raw.name ?? raw.Name ?? "Unknown"),
    email: (raw.email ?? raw.Email) as string | undefined,
    avatarUrl: (raw.avatarUrl ?? raw.AvatarUrl) as string | undefined,
    role,
    joinedAt: (raw.joinedAt ?? raw.JoinedAt) as string | undefined,
    status: "Online",
  };
}

export const getGroupMembers = async (id: string): Promise<GroupMember[]> => {
  const response = await api.get(`/groups/${id}/members`);
  return (response.data as Record<string, unknown>[]).map(normalizeMember);
};
