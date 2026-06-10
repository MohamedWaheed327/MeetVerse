import api from "./api";
import axios from "axios";

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  try {
    await api.post("/auth/reset-password", { email, code, newPassword });
  } catch (err: unknown) {
    let message = "Unable to reset password. Please try again.";
    if (axios.isAxiosError(err)) {
      const resp = err.response?.data;
      if (typeof resp === "string") message = resp;
      else if (resp?.message) message = resp.message;
    }
    throw new Error(message);
  }
}
