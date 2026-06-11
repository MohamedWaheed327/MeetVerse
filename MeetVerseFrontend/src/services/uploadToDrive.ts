import api from "./api";

export type UploadToDriveResponse = {
  driveFileId: string;
  webViewLink: string;
  fileName: string;
};

/**
 * Uploads a recording file to the user's Google Drive via the backend.
 * @param file - The recording blob or file to upload.
 * @param googleAccessToken - The user's Google OAuth2 access token with drive.file scope.
 * @returns The Drive file metadata including the web view link.
 */
export const uploadRecordingToDrive = async (
  file: Blob | File,
  googleAccessToken: string
): Promise<UploadToDriveResponse> => {
  const formData = new FormData();
  formData.append("file", file, file instanceof File ? file.name : "recording.webm");
  formData.append("googleAccessToken", googleAccessToken);

  const response = await api.post<UploadToDriveResponse>(
    "/recordings/upload-to-drive",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};
