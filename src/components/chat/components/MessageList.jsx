import React from "react";
import MileaMilesReferral from "./MileaMilesReferral";
import parseMarkdown from "../utils/markdownParser";

/**
 * Component to display the list of messages
 * @param {Object} props - Component props
 * @param {Array} props.messages - List of message objects
 * @param {boolean} props.loading - Whether a message is being loaded
 */
const MessageList = ({ messages, loading }) => {
  return (
    <div className="h-96 overflow-y-auto border-b pb-4 flex flex-col space-y-3">
      {messages.map((msg, index) => (
        <div 
          key={index} 
          className={`chat-bubble ${
            msg.role === "user" ? "user-message bg-[#715100] text-white text-right ml-12" : "bot-message bg-[#F9F4E9] text-[#5A3E00] mr-12"
          } p-3 rounded-lg`}
        >
          {msg.component === "MileaMilesReferral" ? (
            <MileaMilesReferral />
          ) : (
            <div className="markdown-content" dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />
          )}
        </div>
      ))}
      {loading && (
        <div className="bot-message bg-[#F9F4E9] text-[#5A3E00] p-3 rounded-lg mr-12">
          <span className="animate-pulse">Thinking...</span>
        </div>
      )}
    </div>
  );
};

export default MessageList;