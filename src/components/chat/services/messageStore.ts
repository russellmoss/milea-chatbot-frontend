// src/components/chat/services/messageStore.ts
import api from '../services/apiService';


export const storeMessage = async (messageData: MessageData) => {
  try {
    await api.post("/chat/messages", messageData);
  } catch (error) {
    console.error("Error storing message:", error);
  }
};

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  action: any;
}

interface MessageData {
  id: string;
  sessionId: string;
  sender: 'user' | 'bot';
  content: string;
  action: any | null;
  timestamp: string;
  feedback: MessageFeedback;
}

interface MessageFeedback {
  feedbackGiven: boolean;
  positiveFeedback: string;
  negativeFeedback: string;
}


export const generateMessageData = (message: Message, sessionId: string): MessageData => {
  return {
    id: message.id,
    sessionId: sessionId,
    sender: message.role,
    content: message.content,
    action: message.action,
    timestamp: new Date().toISOString(),
    feedback: { feedbackGiven: false, positiveFeedback: "", negativeFeedback: "" }
  };
};