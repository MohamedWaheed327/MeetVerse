import api from "./api";
import axios from "axios";

export const loginUser = async (data: { email: string; password: string }) => {
  try {
    const response = await api.post("/auth/login", data);
    return response.data;
  } catch (err: unknown) {
    let message = "Unable to login";
    if (axios.isAxiosError(err)) {
      const resp = err.response?.data;
      if (typeof resp === "string") message = resp;
      else if (resp?.message) message = resp.message;
      else if (resp?.error) message = resp.error;
      else if (err.message) message = err.message;
    } else if (err instanceof Error) {
      message = err.message;
    }
    throw new Error(message);
  }
};
