import React from 'react';
import MessageFeedback from './MessageFeedback';

const MessageList = ({ messages, loading }) => {
  // Get or create conversation ID
  const conversationId = localStorage.getItem('conversationId') || `conv_${Date.now()}`;
  
  // Store conversation ID if not already stored
  if (!localStorage.getItem('conversationId')) {
    localStorage.setItem('conversationId', conversationId);
  }

  return (
    <div className="flex flex-col space-y-4 p-4">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-lg p-3 ${
              msg.role === 'user'
                ? 'bg-[#715100] text-white'
                : 'bg-[#F9F4E9] text-[#5A3E00]'
            }`}
          >
            <div className="prose prose-sm">{msg.content}</div>
            
            {/* Add feedback component for bot messages */}
            {msg.role === 'bot' && (
              <MessageFeedback
                messageId={msg.id || `msg_${Date.now()}_${index}`}
                conversationId={conversationId}
              />
            )}
          </div>
        </div>
      ))}
      
      {loading && (
        <div className="flex justify-start">
          <div className="bg-[#F9F4E9] text-[#5A3E00] rounded-lg p-3 max-w-[80%]">
            <div className="animate-pulse">Thinking...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList; 