import { useState, useEffect } from "react";
import { fetchWineData, processChatRequest } from "../services/apiService";
import { useWineSearch } from "./useWineSearch";
import { useAuthentication } from "./useAuthentication";
import { useCustomerQueries } from "./useCustomerQueries";

export const useMessages = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState(null);
  
  const { 
    formatProductData, 
    findWineMatches, 
    formatWineResponse,
    handleUnavailableWine 
  } = useWineSearch();
  
  const {
    authToken,
    customerData,
    email,
    setEmail,
    password,
    setPassword,
    loginLoading,
    showLoginForm,
    setShowLoginForm,
    login,
    logout,
    fetchCustomerData,
    setupAutoLogout
  } = useAuthentication();
  
  const {
    processAuthenticatedQuestion,
    requiresAuthentication
  } = useCustomerQueries();
  
  // Add initialization message and check for existing login
  useEffect(() => {
    setMessages([
      { 
        role: "bot", 
        content: "👋 Hello! I'm your Milea Wine assistant. Ask me about our wines, inventory, club memberships, or your account information."
      }
    ]);
    
    // Check for existing token
    if (authToken) {
      fetchCustomerData(authToken);
    }
    
    // Setup auto-logout when component unmounts or page closes
    return setupAutoLogout();
  }, []);
  
  // Handle login with callback for pending questions
  const handleLogin = async () => {
    await login(
      // Success callback
      async (customerInfo) => {
        setMessages(prev => [
          ...prev, 
          { role: "bot", content: "✅ Login successful! I can now provide information about your account." }
        ]);
        
        // Process pending question if any
        if (pendingQuestion) {
          const response = await processAuthenticatedQuestion(pendingQuestion, customerInfo);
          setMessages(prev => [...prev, { role: "bot", content: response }]);
          setPendingQuestion(null);
        }
      },
      // Failure callback
      () => {
        setMessages(prev => [
          ...prev, 
          { role: "bot", content: "❌ Login failed. Please check your email and password and try again." }
        ]);
      }
    );
  };
  
  // Message sending logic
  const sendMessage = async () => {
    if (!input.trim()) return;
    const updatedMessages = [...messages, { role: "user", content: input }];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    
    try {
      let botResponse;
      const userInput = input.toLowerCase();
      
      // Check for logout requests
      const isLogoutRequest = userInput.includes("log me out") || 
                             userInput.includes("logout") || 
                             userInput.includes("log out") || 
                             userInput.includes("sign out") ||
                             userInput.includes("sign me out");
      
      if (isLogoutRequest) {
        if (authToken) {
          // User is logged in, so log them out
          logout();
          botResponse = "You have been logged out successfully. Your session has ended.";
        } else {
          // User isn't logged in
          botResponse = "You're not currently logged in.";
        }
      }
      // Check for queries requiring authentication
      else if (requiresAuthentication(userInput)) {
        try {
          if (authToken) {
            // User is already logged in
            botResponse = await processAuthenticatedQuestion(userInput, customerData);
          } else {
            // User needs to log in
            setShowLoginForm(true);
            setPendingQuestion(userInput);
            botResponse = "Let's look that up. First, you need to log in to your account.";
          }
        } catch (error) {
          console.error("❌ Error processing authenticated question:", error);
          botResponse = "I'm having trouble accessing your account information right now. Please try again later.";
        }
      }
      // All other queries (wine and general) - USE RAG ENDPOINT
      else {
        try {
          console.log("📡 Sending query to RAG endpoint:", input);
          // Use the processChatRequest function which now calls the RAG endpoint
          const response = await processChatRequest(input);
          botResponse = response;
        } catch (error) {
          console.error("❌ Error calling RAG endpoint:", error);
          botResponse = "I'm sorry, I couldn't process your request. Please try again later.";
        }
      }
      setMessages([...updatedMessages, { role: "bot", content: botResponse }]);
    } catch (error) {
      console.error("❌ Error processing request:", error);
      setMessages([
        ...updatedMessages,
        { role: "bot", content: "⚠️ Sorry, I couldn't process your request. Try again!" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  };

  // Add a handler for explicit logout requests
  const handleLogout = () => {
    logout();
    setMessages(prev => [
      ...prev,
      { role: "bot", content: "You have been logged out successfully." }
    ]);
  };

  return {
    messages,
    loading,
    input,
    setInput,
    sendMessage,
    handleKeyDown,
    showLoginForm,
    handleLogin,
    handleLogout,
    email,
    setEmail,
    password,
    setPassword,
    loginLoading
  };
};