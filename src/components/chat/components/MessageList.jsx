import React, { useState } from "react";
import MileaMilesReferral from "./MileaMilesReferral";
import parseMarkdown from "../utils/markdownParser";
import { ThumbsUp, ThumbsDown, Copy, RotateCw } from 'lucide-react';

/**
 * Component to display the list of messages
 * @param {Object} props - Component props
 * @param {Array} props.messages - List of message objects
 * @param {boolean} props.loading - Whether a message is being loaded
 * @param {Function} props.onActionClick - Function to handle action button clicks
 * @param {Function} props.onFeedbackClick - Function to handle feedback button clicks
 */
const MessageList = ({ messages = [], loading = false, onActionClick, onFeedbackClick }) => {
  const [upvoted, setUpvoted] = useState(false);
  const [downvoted, setDownvoted] = useState(false);

  if (!Array.isArray(messages)) {
    console.warn('MessageList received invalid messages prop:', messages);
    return (
      <div className="h-96 overflow-y-auto border-b pb-4 flex flex-col space-y-3">
        <div className="bot-message bg-[#F9F4E9] text-[#5A3E00] p-3 rounded-lg mr-12">
          No messages to display.
        </div>
      </div>
    );
  }

  return (
    <div className="h-96 overflow-y-auto border-b pb-4 flex flex-col space-y-3">
      {messages.map((msg, index) => (
        <div 
          key={index} 
          className={`chat-bubble ${
            msg.role === "user" ? "user-message bg-[#715100] text-white text-right ml-12" : "bot-message bg-[#F9F4E9] text-[#5A3E00] mr-12"
          } p-3 rounded-lg relative`}
        >
          {msg.component === "MileaMilesReferral" ? (
            <MileaMilesReferral />
          ) : (
            <>
              <div className="markdown-content" dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />
              
              {/* Render action button if present */}
              {msg.action && (
                <div className="mt-3">
                  <button 
                    onClick={() => {
                      if (msg.action.type === "external-link") {
                        // Open external link in a new tab
                        window.open(msg.action.url, "_blank", "noopener,noreferrer");
                      } else if (onActionClick) {
                        // Existing action click handler
                        onActionClick(msg.action);
                      }
                    }}
                    className="py-2 px-4 bg-[#5A3E00] text-white rounded-md hover:bg-[#483200] transition-colors"
                  >
                    {msg.action.text}
                  </button>
                </div>
              )}

              {/* Add feedback button for bot messages */}
              {msg.role === "bot" && !msg.feedbackSubmitted && (
                // <button
                //   onClick={() => onFeedbackClick(msg)}
                //   className="absolute -right-2 -bottom-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                //   title="Provide feedback"
                // >
                //   <ChatBubbleLeftIcon className="h-4 w-4 text-gray-600" />
                // </button>
                <div className="flex flex-row absolute right-1 -bottom-5 space-x-1 bg-white rounded-full shadow-md p-1 hover:bg-gray-50 transition-colors">
                  <button
                    onClick={() => { onFeedbackClick({msg, feedbackType: 'upvote'}) }}
                    className="p-1 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                    title="Upvote"
                  >
                    <ThumbsUp className="h-3 w-3 text-green-600" fill={upvoted ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={() => { onFeedbackClick({msg, feedbackType: 'downvote'}) }}
                    className="p-1 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                    title="Downvote"
                  >
                    <ThumbsDown className="h-3 w-3 text-red-600" fill={downvoted ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={() => onFeedbackClick({msg, feedbackType: 'copy'})}
                    className="p-1 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                    title="Copy message"
                  >
                    <Copy className="h-3 w-3 text-blue-600" />
                  </button>
                  <button
                    onClick={() => onFeedbackClick({msg, feedbackType: 'regenerate'})}
                    className="p-1 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                    title="Regenerate response"
                  >
                    <RotateCw className="h-3 w-3 text-yellow-600" />
                  </button>
                </div>
              )}
            </>
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