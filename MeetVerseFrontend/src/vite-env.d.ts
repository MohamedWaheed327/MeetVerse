/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_DEV: string;
  readonly VITE_BACKEND_PROD: string;
  readonly VITE_LIVEKIT_DEV: string;
  readonly VITE_LIVEKIT_PROD: string;
  readonly VITE_FASTAPI_WS_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface GoogleCredentialResponse {
  credential: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
}

interface TokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: TokenResponse) => void;
  error_callback?: (error: { type: string; message: string }) => void;
  prompt?: "" | "none" | "consent" | "select_account";
}

interface TokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: GoogleCredentialResponse) => void;
        }) => void;
        renderButton: (
          parent: HTMLElement,
          options: {
            theme?: "outline" | "filled_blue" | "filled_black";
            size?: "large" | "medium" | "small";
            text?:
            | "signin_with"
            | "signup_with"
            | "continue_with"
            | "signin";
            shape?: "rectangular" | "pill" | "circle" | "square";
            width?: number;
          }
        ) => void;
      };
      oauth2: {
        initTokenClient: (config: TokenClientConfig) => TokenClient;
      };
    };
  };
}
