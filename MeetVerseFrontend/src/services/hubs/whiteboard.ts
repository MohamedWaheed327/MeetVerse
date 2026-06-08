import * as signalR from "@microsoft/signalr";

const host = import.meta.env.DEV ? import.meta.env.VITE_BACKEND_DEV : import.meta.env.VITE_BACKEND_PROD;

export const whiteboard_connection = new signalR.HubConnectionBuilder()
  .withUrl(host + "/hubs/whiteboard", {
    accessTokenFactory: () => localStorage.getItem("token") || "",
  })
  .withAutomaticReconnect()
  .configureLogging(signalR.LogLevel.Information)
  .build();

export async function startWhiteboardConnection() {
  if (whiteboard_connection.state === signalR.HubConnectionState.Disconnected) {
    await whiteboard_connection.start();
  }
}

export async function joinSession(sessionId: string) {
  await startWhiteboardConnection();
  await whiteboard_connection.invoke("JoinSession", sessionId);
}

export async function sendWhiteboardEvent(sessionId: string, type: string, payloadJson: string) {
  await startWhiteboardConnection();
  await whiteboard_connection.invoke("SendWhiteboardEvent", sessionId, type, payloadJson);
}

export function onReceiveWhiteboardEvent(callback: (payload: any) => void) {
  whiteboard_connection.on("ReceiveWhiteboardEvent", (payload: any) => {
    callback(payload);
  });
}

export function onWhiteboardError(callback: (message: string) => void) {
  whiteboard_connection.on("Error", (message: string) => callback(message));
}
