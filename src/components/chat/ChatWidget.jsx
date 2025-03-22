import React, { useEffect } from "react";
import MessageList from "./components/MessageList";
import MessageInput from "./components/MessageInput";
import WineClubSignUp from "./components/WineClubSignUp";
import MilesReferral from "./components/MilesReferral";
import SmsContactCard from "./components/SmsContactCard";
import SmsChat from "./components/SmsChat";
import { useMessages } from "./hooks/useMessages";

const ChatWidget = () => {
  const {
    messages,
    setMessages,
    input,
    setInput,
    loading,
    sendMessage,
    handleKeyDown,
    showWineClubSignup,
    setShowWineClubSignup,
    showMilesReferral,
    setShowMilesReferral,
    signupComplete,
    showSmsContactForm,
    setShowSmsContactForm,
    activeSmsChat,
    setActiveSmsChat,
    handleSmsFormSuccess,
    handleSmsFormClose,
    handleSmsChatClose,
    handleFeedback
  } = useMessages();

  useEffect(() => {
    // Scroll to bottom when messages change
    const messageContainer = document.querySelector(".message-container");
    if (messageContainer) {
      messageContainer.scrollTop = messageContainer.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto message-container p-4">
        <MessageList 
          messages={messages} 
          onFeedbackClick={handleFeedback}
        />
        {showWineClubSignup && (
          <WineClubSignUp
            onClose={() => setShowWineClubSignup(false)}
            onSuccess={() => {
              setShowWineClubSignup(false);
              setShowMilesReferral(true);
            }}
          />
        )}
        {showMilesReferral && (
          <MilesReferral
            onClose={() => setShowMilesReferral(false)}
          />
        )}
        {showSmsContactForm && (
          <SmsContactCard
            onSuccess={handleSmsFormSuccess}
            onClose={handleSmsFormClose}
          />
        )}
        {activeSmsChat && (
          <SmsChat
            chat={activeSmsChat}
            onClose={handleSmsChatClose}
          />
        )}
      </div>
      <div className="p-4 border-t">
        <MessageInput
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          handleKeyDown={handleKeyDown}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default ChatWidget;