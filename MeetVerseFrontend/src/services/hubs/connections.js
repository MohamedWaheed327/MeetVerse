import * as signalR from "@microsoft/signalr";

// TODO: put host in json file
// const host = "http://meetverse-env.eba-qcpudpcc.us-east-1.elasticbeanstalk.com"; // include protocol to avoid relative path issues
const host = "https://d278p5zvdcqqh2.cloudfront.net/"; // include protocol to avoid relative path issues

const connection = new signalR.HubConnectionBuilder()
    .withUrl(host + "/hubs/meetingchat", {
        accessTokenFactory: () => localStorage.getItem("token"),
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();

export default connection;
