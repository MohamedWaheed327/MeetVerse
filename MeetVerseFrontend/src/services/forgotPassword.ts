import api from "./api";
import axios from "axios";

export async function requestPasswordReset(email: string): Promise<void> {
  try {
    await api.post("/auth/forgot-password", { email });
  } catch (err: unknown) {
    let message = "Unable to send reset code. Please try again.";
    if (axios.isAxiosError(err)) {
      const resp = err.response?.data;
      if (typeof resp === "string") message = resp;
      else if (resp?.message) message = resp.message;
    }
    throw new Error(message);
  }
}
