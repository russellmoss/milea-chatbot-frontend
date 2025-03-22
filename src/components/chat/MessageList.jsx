import React from 'react';
import MessageFeedback from './components/MessageFeedback';
import { useMessages } from './hooks/useMessages';

const MessageList = () => {
  const { messages, handleFeedback } = useMessages();

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg, index) => (
        <div
          key={msg.id || `msg_${Date.now()}_${index}`}
          className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-lg p-3 ${
              msg.isUser
                ? 'bg-[#5A3E00] text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            <div className="whitespace-pre-wrap">{msg.content}</div>
            {!msg.isUser && !msg.feedbackSubmitted && (
              <MessageFeedback
                messageId={msg.id || `msg_${Date.now()}_${index}`}
                conversationId={msg.conversationId || `conv_${Date.now()}`}
                onSubmit={handleFeedback}
                onClose={() => {
                  // Handle closing the feedback form if needed
                }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList; 