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
  const [showMailingListSignup, setShowMailingListSignup] = useState(false);
  // New state for showing the Miles referral component
  const [showMilesReferral, setShowMilesReferral] = useState(false);
  
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
        content: "👋 Hello! I'm your Milea Wine assistant. Ask me about our wines, club memberships, check your Milea Miles balance, send free tastings or join our mailing list by typing 'subscribe'."
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

  // Handle successful mailing list signup
  const handleMailingListSuccess = (successMessage) => {
    setMessages(prev => [
      ...prev,
      { role: "bot", content: `✅ ${successMessage}` }
    ]);
    setShowMailingListSignup(false);
  };
  
  // Check if text contains referral-related keywords
  const isReferralRequest = (text) => {
    const textLower = text.toLowerCase();
    
    // Define patterns that indicate referral intent
    const referralPatterns = [
      'send free tasting',
      'free tasting',
      'send tasting',
      'send a free',
      'send a tasting',
      'refer friend',
      'refer a friend',
      'invite friend',
      'share tasting',
      'gift tasting',
      'give tasting',
      'free wine tasting',
      'miles referral',
      'milea miles',
      'miles program'
    ];
    
    return referralPatterns.some(pattern => textLower.includes(pattern));
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
      
      // *** NEW: Check for referral request first ***
      if (isReferralRequest(userInput)) {
        setShowMilesReferral(true);
        botResponse = "You can send free wine tastings to friends through our Milea Miles program! I've provided a link below to access the Milea Miles portal where you can send referrals:";
      }
      // Check for mailing list signup request
      else if (userInput.includes("subscribe") || 
          userInput.includes("sign up") ||
          userInput.includes("mailing list") || 
          userInput.includes("newsletter") ||
          userInput.includes("email list") ||
          userInput.includes("join list")) {
        // Show the mailing list signup form
        setShowMailingListSignup(true);
        botResponse = "I'd be happy to help you subscribe to our mailing list. Please fill out the form below:";
      }
      // Check for logout requests
      else if (userInput.includes("log me out") || 
               userInput.includes("logout") || 
               userInput.includes("log out") || 
               userInput.includes("sign out") ||
               userInput.includes("sign me out")) {
        if (authToken) {
          // User is logged in, so log them out
          logout();
          botResponse = "You have been logged out successfully. Your session has ended.";
        } else {
          // User isn't logged in
          botResponse = "You're not currently logged in.";
        }
      }
      // Handle general wine club info via RAG
      else if ((userInput.includes("join") && userInput.includes("wine club")) ||
               (userInput.includes("joining") && userInput.includes("wine club")) ||
               (userInput.includes("information") && userInput.includes("wine club")) ||
               (userInput.includes("about") && userInput.includes("wine club")) ||
               (userInput.includes("learn") && userInput.includes("wine club"))) {
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
    loginLoading,
    showMailingListSignup,
    setShowMailingListSignup,
    handleMailingListSuccess,
    // Add new state for Miles referral
    showMilesReferral,
    setShowMilesReferral
  };
};