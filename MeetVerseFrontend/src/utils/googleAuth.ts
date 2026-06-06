import { useEffect, useRef } from "react";
import { loginWithGoogle } from "../services/googleLogin";

export const useGoogleAuth = (
  containerRef: React.RefObject<HTMLDivElement>,
  onSuccess: (token: string) => Promise<void>,
  onError: (msg: string) => void,
  setLoading: (loading: boolean) => void
) => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isGoogleInitialized = useRef(false);

  const initializeGoogle = () => {
    if (isGoogleInitialized.current || !googleClientId || !window.google?.accounts?.id) {
      return false;
    }

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async (response: any) => {
        if (!response.credential) {
          onError("Google login failed");
          return;
        }

        onError(""); // Clear any previous errors
        setLoading(true);
        try {
          const authResponse = await loginWithGoogle(response.credential);
          await onSuccess(authResponse.token);
        } catch (err) {
          onError("Google sign-in failed. Please try again.");
        } finally {
          setLoading(false);
        }
      },
    });

    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        shape: "rectangular",
        type: "standard",
        text: "continue_with",
        logo_alignment: "left",
      });
    }

    isGoogleInitialized.current = true;
    return true;
  };

  useEffect(() => {
    if (!googleClientId) return;
    if (initializeGoogle()) return;

    const pollGoogleScript = window.setInterval(() => {
      if (initializeGoogle()) window.clearInterval(pollGoogleScript);
    }, 300);

    return () => window.clearInterval(pollGoogleScript);
  }, [googleClientId, containerRef]);

  const handleGoogleLoginClick = () => {
    onError("");
    const googleButton = containerRef.current?.querySelector("div[role='button']") as HTMLElement | null;

    if (!googleButton) {
      onError("Google sign-in is still loading. Please try again.");
      return;
    }

    googleButton.click();
  };

  return { handleGoogleLoginClick };
};
