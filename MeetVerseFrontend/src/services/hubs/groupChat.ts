import { group_chat_connection } from "./connections";


type GroupChat = {
    id: string;
    groupId: string;
    senderId: string;
    senderName: string;
    senderAvatarUrl: string;
    content: string;
    sentAt: string;
};


export const subscribeToGroup = async (GroupId: string) => {
    await group_chat_connection.invoke("JoinGroup", GroupId);
};

export const unsubscribeFromGroup = async (GroupId: string) => {
    await group_chat_connection.invoke("LeaveGroup", GroupId);
};

export const onMessageReceived = (callback: (payload: GroupChat) => void) => {
    group_chat_connection.on("ReceiveMessage", (payload: GroupChat) => {
        console.log("message recieved");
        
        callback(payload);
    });
};

export const onError = (callback: (message: string) => void) => {
    group_chat_connection.on("Error", (message: string) => {
        callback(message);
    });
};
