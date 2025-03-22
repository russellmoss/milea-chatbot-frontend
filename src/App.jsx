import React from 'react';
import ChatWidget from './components/chat/ChatWidget';
import { useMessages } from './components/chat/hooks/useMessages';

function App() {
  const {
    messages,
    setMessages,
    input,
    setInput,
    loading,
    sendMessage,
    handleLogin,
    handleMailingListSuccess,
    showSmsContactForm,
    setShowSmsContactForm,
    activeSmsChat,
    setActiveSmsChat,
    handleSmsFormSuccess,
    handleSmsFormClose,
    handleSmsChatClose,
    handleFeedback
  } = useMessages();

  return (
    <div className="App">
      <ChatWidget
        messages={messages}
        setMessages={setMessages}
        input={input}
        setInput={setInput}
        loading={loading}
        sendMessage={sendMessage}
        handleLogin={handleLogin}
        handleMailingListSuccess={handleMailingListSuccess}
        showSmsContactForm={showSmsContactForm}
        setShowSmsContactForm={setShowSmsContactForm}
        activeSmsChat={activeSmsChat}
        setActiveSmsChat={setActiveSmsChat}
        handleSmsFormSuccess={handleSmsFormSuccess}
        handleSmsFormClose={handleSmsFormClose}
        handleSmsChatClose={handleSmsChatClose}
        handleFeedback={handleFeedback}
      />
    </div>
  );
}

export default App; 