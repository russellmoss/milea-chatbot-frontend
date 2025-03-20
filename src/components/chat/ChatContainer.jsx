import React, { useState, useEffect, useRef } from 'react';
import MessageList from './MessageList';
import api from '../../services/api';

const ChatContainer = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      id: `msg_${Date.now()}_user`
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/api/chat', { message: userMessage.content });
      
      const botMessage = {
        role: 'bot',
        content: response.data.response,
        id: `msg_${Date.now()}_bot`
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          content: 'I apologize, but I encountered an error processing your request. Please try again.',
          id: `msg_${Date.now()}_error`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-[#EFE8D4] rounded-lg shadow-lg border border-[#5A3E00]">
      <div className="flex-grow overflow-y-auto">
        <MessageList messages={messages} loading={loading} />
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 border-t border-[#5A3E00]">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow p-2 rounded-lg border border-[#5A3E00] bg-white focus:outline-none focus:ring-2 focus:ring-[#715100]"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`px-4 py-2 bg-[#715100] text-white rounded-lg ${
              !input.trim() || loading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-[#5A3E00]'
            }`}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatContainer; 