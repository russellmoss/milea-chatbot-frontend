// src/components/chat/services/conversation.ts
import api from '../services/apiService';


export const beginConversation = async (clientIp: string) => {
  try {
    const startTimestamp = new Date().toISOString();
    const response = await api.post("/chat/conversation/begin", {
      clientIp,
      startTimestamp
    });
    return response.data;
  } catch (error) {
    console.error("Error beginning conversation:", error);
    throw error;
  }
};