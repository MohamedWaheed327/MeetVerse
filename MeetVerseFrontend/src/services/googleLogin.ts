import api from "./api";

type GoogleLoginResponse = {
  token: string;
};

export const loginWithGoogle = async (idToken: string): Promise<GoogleLoginResponse> => {
  try {
    const response = await api.post("/auth/google-login", { idToken });
    return response.data;
  } catch {
    throw new Error("Google login failed");
  }
};
