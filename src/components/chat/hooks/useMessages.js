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
  
  // Function to detect referral-related queries
  const isReferralRequest = (message) => {
    const lowerMessage = message.toLowerCase();
    const referralPatterns = [
      'send a free tasting',
      'send free tasting',
      'send a referral', 
      'send referral',
      'refer a friend',
      'invite a friend',
      'give a free tasting',
      'free tasting referral',
      'share a tasting',
      'sign up for milea miles',
      'access milea miles',
      'milea miles account',
      'my milea miles'
    ];
    
    return referralPatterns.some(pattern => lowerMessage.includes(pattern));
  };
  
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
          { role: "bot", content: `✅ Login successful! Welcome back, ${customerInfo.firstName || 'valued customer'}. I can now provide information about your account.` }
        ]);
        
        // Process pending question if any
        if (pendingQuestion) {
          try {
            const response = await processAuthenticatedQuestion(pendingQuestion, customerInfo);
            setMessages(prev => [...prev, { role: "bot", content: response }]);
          } catch (error) {
            console.error("Error processing authenticated question:", error);
            setMessages(prev => [
              ...prev, 
              { role: "bot", content: "I'm sorry, but I encountered an error while retrieving your account information. Please try asking your question again." }
            ]);
          }
          setPendingQuestion(null);
        }
      },
      // Failure callback
      (errorMessage) => {
        setMessages(prev => [
          ...prev, 
          { role: "bot", content: `❌ Login failed. ${errorMessage || 'Please check your email and password and try again.'}` }
        ]);
        
        // Reset the login form state after a short delay
        setTimeout(() => {
          setShowLoginForm(false);
          setPendingQuestion(null);
        }, 3000);
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
      
      // Check for Milea Miles referral requests
      if (isReferralRequest(userInput)) {
        setMessages([
          ...updatedMessages,
          { 
            role: "bot", 
            content: "I'd be happy to help you send a free tasting through our Milea Miles program! You can access it below:",
            component: "MileaMilesReferral" // This tells your UI to render the iframe component
          }
        ]);
        setLoading(false);
        return;
      }
      
      // Check for logout requests
      const isLogoutRequest = userInput.includes("log me out") || 
                             userInput.includes("logout") || 
                             userInput.includes("log out") || 
                             userInput.includes("sign out") ||
                             userInput.includes("sign me out");
      
      // NEW: Check for wine club general information queries first
      const isGeneralWineClubQuery = 
          (userInput.includes("join") && userInput.includes("wine club")) ||
          (userInput.includes("joining") && userInput.includes("wine club")) ||
          (userInput.includes("information") && userInput.includes("wine club")) ||
          (userInput.includes("about") && userInput.includes("wine club")) ||
          (userInput.includes("learn") && userInput.includes("wine club"));
          
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
      // NEW: Handle general wine club info via RAG
      else if (isGeneralWineClubQuery) {
        try {
          console.log("📡 Sending wine club query to RAG endpoint:", input);
          // Use the processChatRequest function which now calls the RAG endpoint
          const response = await processChatRequest(input);
          botResponse = response;
        } catch (error) {
          console.error("❌ Error calling RAG endpoint:", error);
          botResponse = "I'm sorry, I couldn't process your request. Please try again later.";
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