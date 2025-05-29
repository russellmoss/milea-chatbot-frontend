// src/components/chat/services/messageStore.ts
import api from '../services/apiService';
import { generateUUID } from "../utils/uuidGenerator";


export const storeMessage = async (messageData: MessageData) => {
  try {
    await api.post("/chat/messages", messageData);
  } catch (error) {
    console.error("Error storing message:", error);
  }
};

interface Message {
  role: 'user' | 'bot';
  content: string;
}

interface MessageData {
  id: string;
  sessionId: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: string;
  feedback?: {
    is_helpful: boolean;
    comment?: string;
  };
}


export const generateMessageData = (message: Message, sessionId: string): MessageData => {
  return {
    id: generateUUID(),
    sessionId: sessionId,
    sender: message.role,
    content: message.content,
    timestamp: new Date().toISOString(),
    feedback: undefined,
  };
};