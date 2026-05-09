import api from "./api";

type GithubLoginResponse = {
  token: string;
};

export const loginWithGithub = async (code: string): Promise<GithubLoginResponse> => {
  try {
    const response = await api.post("/auth/github-login", { code });
    return response.data;
  } catch {
    throw new Error("GitHub login failed");
  }
};
