import * as signalR from "@microsoft/signalr";

const host = import.meta.env.DEV ? import.meta.env.VITE_BACKEND_DEV : import.meta.env.VITE_BACKEND_PROD;

const connection = new signalR.HubConnectionBuilder()
    .withUrl(host + "/hubs/meetingchat", {
        accessTokenFactory: () => localStorage.getItem("token") || "",
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();

export default connection;
