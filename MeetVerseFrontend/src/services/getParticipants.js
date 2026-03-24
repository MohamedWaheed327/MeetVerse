import api from "./api";

const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const getParticipants = async (data) => {
    try {
        const response = await api.get("/meetings/participants", {
            params: {
                meetingId: data.meetingId
            }
        });
        
        const colors = ["from-blue-600 to-indigo-700", "from-purple-600 to-pink-600", "from-emerald-600 to-teal-600", "from-orange-600 to-red-600", ];
        const processedData = response.data.map(participant => ({
            ...participant,
            isSpeaking: false,
            initial: participant.name[0].toUpperCase(),
            color: colors[random(0, 3)]
        }));

        return processedData;
    } catch (error) {
        if (error.response) {
            throw error.response.data;
        } else {
            throw { message: "Network error" };
        }
    }
};