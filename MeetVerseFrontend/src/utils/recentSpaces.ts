export type RecentSpace = {
  id: string;
  name: string;
  gradient?: string;
};

const RECENT_SPACES_KEY = "meetverse:recent_spaces";

export function getRecentSpaces(): RecentSpace[] {
  try {
    const data = localStorage.getItem(RECENT_SPACES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function addRecentSpace(space: RecentSpace) {
  try {
    const recent = getRecentSpaces();
    const updated = [space, ...recent.filter((s) => s.id !== space.id)].slice(0, 3);
    localStorage.setItem(RECENT_SPACES_KEY, JSON.stringify(updated));
  } catch (e) {
    // Fail silently in incognito
  }
}
