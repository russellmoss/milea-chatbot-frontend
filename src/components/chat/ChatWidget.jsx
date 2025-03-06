import React from "react";
import { useMessages } from "./hooks/useMessages";
import MessageList from "./components/MessageList";
import MessageInput from "./components/MessageInput";
import LoginForm from "./components/LoginForm"; // We'll create this component

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
    loginLoading
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
      ) : (
        <MessageInput 
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          handleKeyDown={handleKeyDown}
          loading={loading}
        />
      )}
    </div>
  );
};

export default ChatWidget;