import React from "react";

/**
 * Component for user input and message sending
 * @param {Object} props - Component props
 * @param {string} props.input - Current input value
 * @param {Function} props.setInput - Function to update input
 * @param {Function} props.sendMessage - Function to send the message
 * @param {Function} props.handleKeyDown - Function to handle keyboard events
 * @param {boolean} props.loading - Whether a message is being processed
 */
const MessageInput = ({ 
  input = "", // Add default value
  setInput = () => {}, // Add default function
  sendMessage = () => {}, // Add default function
  handleKeyDown = () => {}, // Add default function
  loading = false // Add default value
}) => {
  // Ensure input is a string
  const inputValue = String(input || "");
  
  return (
    <div className="flex mt-3">
      <input
        type="text"
        className="flex-1 border p-3 rounded-l bg-[#F9F4E9] text-[#715100] placeholder-[#715100] text-lg"
        value={inputValue}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about our wines..."
        disabled={loading}
      />
      <button
        onClick={sendMessage}
        className={`bg-[#5A3E00] text-white p-3 rounded-r hover:bg-[#3D2900] text-lg ${loading ? 'opacity-50' : ''}`}
        disabled={loading || !inputValue.trim()}
      >
        {loading ? "..." : "Send"}
      </button>
    </div>
  );
};

export default MessageInput;