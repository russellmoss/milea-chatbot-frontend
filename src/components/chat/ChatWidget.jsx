import React, { useEffect } from "react";
import { useMessages } from "./hooks/useMessages";
import { useWineClubSignup } from "./hooks/useWineClubSignup";
import MessageList from "./components/MessageList";
import MessageInput from "./components/MessageInput";
import LoginForm from "./components/LoginForm";
import MailingListSignup from "./components/MailingListSignup";
import MileaMilesReferral from "./components/MileaMilesReferral";
import WineClubSignup from "./components/WineClubSignUp";

const ChatWidget = () => {
  // Modified useMessages hook usage
  const { 
    messages, 
    setMessages,
    loading, 
    input, 
    setInput, 
    sendMessage: originalSendMessage, 
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
    showMilesReferral,
    setShowMilesReferral
  } = useMessages();
  
  // Function to add a bot message
  const addBotMessage = (message) => {
    setMessages(prev => [...prev, { role: "bot", content: message }]);
  };
  
  // Add wine club signup integration
  const {
    showSignupForm,
    signupComplete,
    clubLevel,
    isWineClubQuery,
    isSignupInterest,
    handleWineClubQuery,
    startSignupFlow,
    completeSignupFlow,
    cancelSignupFlow
  } = useWineClubSignup();
  
  // Handle successful wine club signup
  const handleWineClubSuccess = (data) => {
    // Add a confirmation message to the chat
    addBotMessage(`Thank you for joining the ${data.clubName} Club! Your membership application has been submitted. A member of our team will call you to finalize your membership. Welcome to the Milea Family! 🍷`);
    completeSignupFlow();
  };
  
  // Extend the sendMessage function to handle wine club queries
  const handleSendMessage = () => {
    if (!input.trim()) return;
    
    // Expand this check to capture more signup intent variations
    if (isWineClubQuery(input) || isSignupInterest(input)) {
      const result = handleWineClubQuery(input);
      
      // Add the user message
      const updatedMessages = [...messages, { role: "user", content: input }];
      setMessages(updatedMessages);
      
      // Add bot response with signup button
      setTimeout(() => {
        let responseMessages = [];
        
        // Add main response
        responseMessages.push({ 
          role: "bot", 
          content: result.response 
        });
        
        // Always add signup prompt for club-related queries
        responseMessages.push({ 
          role: "bot", 
          content: "To join our Wine Club, simply click the button below to start the signup process. It's free to join!",
          action: {
            type: "club-signup",
            text: "Join Wine Club",
            clubLevel: result.clubLevel
          }
        });
        
        setMessages(prev => [...prev, ...responseMessages]);
      }, 500);
      
      setInput("");
    } else {
      // Process normal message
      originalSendMessage();
    }
  };
  
  // Handle action button clicks
  const handleActionClick = (action) => {
    if (action.type === "external-link") {
      // Open external link in a new tab
      window.open(action.url, "_blank", "noopener,noreferrer");
    } else if (action.type === "club-signup") {
      startSignupFlow(action.clubLevel);
    }
  };

  return (
    <div className="w-full bg-[#EFE8D4] shadow-lg rounded-lg p-6 border border-[#5A3E00]">
      <MessageList 
        messages={messages} 
        loading={loading} 
        onActionClick={handleActionClick}
      />
      
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
      ) : showSignupForm ? (
        <WineClubSignup 
          preSelectedClub={clubLevel}
          onSubmit={handleWineClubSuccess}
          onCancel={cancelSignupFlow}
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
            sendMessage={handleSendMessage}
            handleKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            loading={loading}
          />
        </>
      )}
    </div>
  );
};

export default ChatWidget;