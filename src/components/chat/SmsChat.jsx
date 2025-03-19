import React, { useState, useEffect, useRef } from 'react';
import { sendSmsMessage, fetchSmsHistory } from '../../services/apiService';
import socketService from '../../services/socketService';
import './SmsChat.css';

const SmsChat = ({ 
    phoneNumber, 
    onClose, 
    messages: initialMessages = [], 
    onMessageUpdate 
}) => {
    const [messages, setMessages] = useState(initialMessages);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Connect to socket service
        socketService.connect();

        // Subscribe to SMS messages
        socketService.subscribeToSmsMessages((message) => {
            if (message.phoneNumber === phoneNumber) {
                setMessages(prev => [...prev, message]);
                onMessageUpdate([...messages, message]);
            }
        });

        // Fetch message history
        const fetchHistory = async () => {
            try {
                const history = await fetchSmsHistory(phoneNumber);
                setMessages(history);
                onMessageUpdate(history);
            } catch (error) {
                console.error('Error fetching SMS history:', error);
            }
        };

        fetchHistory();

        // Cleanup on unmount
        return () => {
            socketService.unsubscribeFromSmsMessages();
            socketService.disconnect();
        };
    }, [phoneNumber, onMessageUpdate]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        setIsLoading(true);
        try {
            const newMessage = {
                content: input.trim(),
                phoneNumber,
                timestamp: new Date().toISOString(),
                direction: 'outbound'
            };

            // Send message through API
            await sendSmsMessage(phoneNumber, input.trim());

            // Add message to local state
            setMessages(prev => [...prev, newMessage]);
            onMessageUpdate([...messages, newMessage]);

            // Send message through socket
            socketService.sendMessage(newMessage);

            setInput('');
        } catch (error) {
            console.error('Error sending SMS:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="sms-chat">
            <div className="sms-chat-header">
                <h3>SMS Chat with {phoneNumber}</h3>
                <button onClick={onClose} className="close-button">×</button>
            </div>
            <div className="sms-messages">
                {messages.map((message, index) => (
                    <div 
                        key={index} 
                        className={`sms-message ${message.direction === 'outbound' ? 'outbound' : 'inbound'}`}
                    >
                        <div className="message-content">{message.content}</div>
                        <div className="message-timestamp">
                            {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="sms-input-form">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send'}
                </button>
            </form>
        </div>
    );
};

export default SmsChat; 