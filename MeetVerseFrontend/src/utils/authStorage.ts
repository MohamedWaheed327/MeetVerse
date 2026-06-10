const REMEMBER_ME_KEY = "rememberMe";

export function getStoredRememberMe(): boolean {
  return localStorage.getItem(REMEMBER_ME_KEY) === "true";
}

export function setStoredRememberMe(remember: boolean): void {
  if (remember) {
    localStorage.setItem(REMEMBER_ME_KEY, "true");
  } else {
    localStorage.removeItem(REMEMBER_ME_KEY);
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

export function clearAuthStorage(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("userid");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("username");
  sessionStorage.removeItem("userid");
}

export function persistAuth(
  token: string,
  username: string,
  userid: string,
  rememberMe: boolean
): void {
  clearAuthStorage();
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem("token", token);
  storage.setItem("username", username);
  storage.setItem("userid", userid);
  setStoredRememberMe(rememberMe);
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}
