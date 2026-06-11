const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";

/**
 * Requests a Google OAuth2 access token with the drive.file scope.
 * Uses the Google Identity Services (GIS) Token Model.
 * Returns a promise that resolves with the access_token string.
 */
export const requestGoogleDriveAccessToken = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      reject(new Error("Google Client ID is not configured."));
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      reject(new Error("Google Identity Services SDK is not loaded."));
      return;
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_FILE_SCOPE,
      callback: (response) => {
        if (response.error) {
          reject(
            new Error(
              response.error_description || "Failed to obtain Google Drive access token."
            )
          );
          return;
        }
        resolve(response.access_token);
      },
      error_callback: (error) => {
        reject(new Error(error.message || "Google OAuth2 token request failed."));
      },
    });

    tokenClient.requestAccessToken({ prompt: "consent" });
  });
};
