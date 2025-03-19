import React, { useState, useEffect, useRef } from 'react';
import api from '../services/apiService';
import io from 'socket.io-client';

// The socket.io connection
let socket;

const SmsChat = ({ phoneNumber, sessionId, initialHistory = [], onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Initialize socket.io connection
  useEffect(() => {
    // Initialize the socket connection
    const socketUrl = process.env.REACT_APP_SOCKET_URL || window.location.origin;
    socket = io(socketUrl);
    
    // Register this customer with the socket
    socket.emit('register-customer', { phoneNumber, sessionId });
    
    // Listen for new SMS messages
    socket.on('sms-received', (message) => {
      setMessages(prevMessages => [...prevMessages, {
        id: message.messageId,
        body: message.body,
        direction: 'inbound',
        timestamp: message.timestamp
      }]);
    });
    
    // Clean up on unmount
    return () => {
      socket.disconnect();
    };
  }, [phoneNumber, sessionId]);
  
  // Initialize message history
  useEffect(() => {
    if (initialHistory && initialHistory.length > 0) {
      setMessages(initialHistory.map(msg => ({
        id: msg.id,
        body: msg.body,
        direction: msg.direction === 'inbound' ? 'inbound' : 'outbound',
        timestamp: msg.timestamp
      })));
    } else {
      // Fetch message history if not provided
      fetchMessageHistory();
    }
  }, [phoneNumber]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Fetch message history
  const fetchMessageHistory = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/twilio/history/${phoneNumber}`);
      
      if (response.data.success) {
        setMessages(response.data.history.map(msg => ({
          id: msg.id,
          body: msg.body,
          direction: msg.direction === 'inbound' ? 'inbound' : 'outbound',
          timestamp: msg.timestamp
        })));
      }
    } catch (error) {
      console.error('Error fetching message history:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Send a message
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    try {
      setIsLoading(true);
      
      // Send message through API
      const response = await api.post('/api/twilio/send', {
        phoneNumber,
        message: input
      });
      
      if (response.data.success) {
        // Add message to local state
        setMessages(prevMessages => [...prevMessages, {
          id: response.data.messageSid,
          body: input,
          direction: 'outbound',
          timestamp: response.data.timestamp
        }]);
        
        // Clear input
        setInput('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-amber-50 rounded-lg shadow-md border border-amber-300 p-3">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-amber-900">
          Conversation with {phoneNumber}
        </h3>
        <button
          onClick={onClose}
          className="text-amber-700 hover:text-amber-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {/* Messages container */}
      <div className="flex-grow overflow-y-auto mb-3 p-2 space-y-2">
        {isLoading && messages.length === 0 ? (
          <div className="text-center py-4 text-amber-700">
            Loading conversation history...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-4 text-amber-700">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`p-2 rounded-lg max-w-[80%] ${
                message.direction === 'outbound'
                  ? 'bg-amber-600 text-white ml-auto'
                  : 'bg-white border border-amber-200 mr-auto'
              }`}
            >
              <div className="text-sm">{message.body}</div>
              <div 
                className={`text-xs mt-1 ${
                  message.direction === 'outbound' ? 'text-amber-200' : 'text-amber-500'
                }`}
              >
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="flex border-t border-amber-200 pt-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-grow p-2 border border-amber-300 rounded-l resize-none"
          rows="2"
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className={`px-4 bg-amber-700 text-white rounded-r hover:bg-amber-800 flex items-center justify-center ${
            isLoading || !input.trim() ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default SmsChat; 