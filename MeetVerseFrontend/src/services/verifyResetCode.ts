import api from "./api";
import axios from "axios";

export async function verifyResetCode(email: string, code: string): Promise<void> {
  try {
    await api.post("/auth/verify-reset-code", { email, code });
  } catch (err: unknown) {
    let message = "Invalid or expired verification code.";
    if (axios.isAxiosError(err)) {
      const resp = err.response?.data;
      if (typeof resp === "string") message = resp;
      else if (resp?.message) message = resp.message;
    }
    throw new Error(message);
  }
}
