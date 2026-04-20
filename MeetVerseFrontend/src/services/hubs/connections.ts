import * as signalR from "@microsoft/signalr";

const host = import.meta.env.DEV ? import.meta.env.VITE_BACKEND_DEV : import.meta.env.VITE_BACKEND_PROD;

export const meeting_chat_connection = new signalR.HubConnectionBuilder()
    .withUrl(host + "/hubs/meetingchat", {
        accessTokenFactory: () => localStorage.getItem("token") || "",
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();


export const group_chat_connection = new signalR.HubConnectionBuilder()
    .withUrl(host + "/hubs/groupchat", {
        accessTokenFactory: () => localStorage.getItem("token") || "",
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();
