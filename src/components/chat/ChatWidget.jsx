import React from "react";
import { useMessages } from "./hooks/useMessages";
import MessageList from "./components/MessageList";
import MessageInput from "./components/MessageInput";
import LoginForm from "./components/LoginForm";
import MailingListSignup from "./components/MailingListSignup";
import MileaMilesReferral from "./components/MileaMilesReferral";

const ChatWidget = () => {
  const { 
    messages, 
    loading, 
    input, 
    setInput, 
    sendMessage, 
    handleKeyDown,
    showLoginForm,
    handleLogin,
    email,
    setEmail,
    password,
    setPassword,
    loginLoading,
    showMailingListSignup,
    setShowMailingListSignup,
    handleMailingListSuccess,
    // Add new state for Miles referral
    showMilesReferral,
    setShowMilesReferral
  } = useMessages();

  return (
    <div className="w-full bg-[#EFE8D4] shadow-lg rounded-lg p-6 border border-[#5A3E00]">
      <MessageList messages={messages} loading={loading} />
      
      {showLoginForm ? (
        <LoginForm 
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          handleLogin={handleLogin}
          loading={loginLoading}
        />
      ) : showMailingListSignup ? (
        <MailingListSignup 
          onClose={() => setShowMailingListSignup(false)}
          onSuccess={handleMailingListSuccess}
        />
      ) : (
        <>
          {/* Add the MileaMilesReferral component when needed */}
          {showMilesReferral && (
            <div className="mb-4">
              <MileaMilesReferral />
              <button 
                onClick={() => setShowMilesReferral(false)}
                className="mt-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          )}
          <MessageInput 
            input={input}
            setInput={setInput}
            sendMessage={sendMessage}
            handleKeyDown={handleKeyDown}
            loading={loading}
          />
        </>
      )}
    </div>
  );
};

export default ChatWidget;