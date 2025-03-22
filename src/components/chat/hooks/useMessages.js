import { useState, useEffect } from "react";
import { fetchWineData, processChatRequest, initiateSmsConversation, sendSmsMessage, submitFeedback } from "../services/apiService";
import { useWineSearch } from "./useWineSearch";
import { useAuthentication } from "./useAuthentication";
import { useCustomerQueries } from "./useCustomerQueries";
import { isReservationQuery } from '../utils/queryHelpers';
import { analyticsService } from '../services/analyticsService';

export const useMessages = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState(null);
  const [showMailingListSignup, setShowMailingListSignup] = useState(false);
  // New state for showing the Miles referral component
  const [showMilesReferral, setShowMilesReferral] = useState(false);
  // Add new state for SMS functionality
  const [showSmsContactForm, setShowSmsContactForm] = useState(false);
  const [activeSmsChat, setActiveSmsChat] = useState(null);
  
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
  
  // Add cleanup effect for analytics
  useEffect(() => {
    return () => {
      analyticsService.trackSessionEnd();
    };
  }, []);
  
  // Add this function to intercept RAG responses related to wine clubs
  const interceptRagResponse = (response, query) => {
    // Check if the response is about wine clubs but doesn't include the signup button
    if (
      (query.toLowerCase().includes('club') || 
       query.toLowerCase().includes('membership') || 
       query.toLowerCase().includes('join')) && 
      (response.includes('wine club') || 
       response.includes('membership') || 
       response.includes('tier')) && 
      !response.includes('Click the button below')
    ) {
      // This appears to be a wine club response without a signup button
      // Let's add the button to the message list separately
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          { 
            role: "bot", 
            content: "Would you like to join our wine club now? It's free to sign up!",
            action: {
              type: "club-signup",
              text: "Join Wine Club",
              clubLevel: null // Let the user select during signup
            }
          }
        ]);
      }, 500);
    }
    return response;
  };
  
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
  
  // Add function to check for SMS-related requests
  const isSmsRequest = (text) => {
    const textLower = text.toLowerCase();
    const smsPatterns = [
      'text us',
      'text you',
      'send you a text',
      'send a text',
      'text message',
      'sms',
      'message you',
      'message the winery',
      'contact via text',
      'text contact'
    ];
    
    return smsPatterns.some(pattern => textLower.includes(pattern));
  };

  // Add handler functions for SMS
  const handleSmsFormSuccess = (data) => {
    setMessages(prev => [
      ...prev,
      { role: "bot", content: `✅ Thanks for reaching out! We've received your message and will respond to ${data.phoneNumber} shortly.` }
    ]);
    
    setShowSmsContactForm(false);
    setActiveSmsChat({
      phoneNumber: data.phoneNumber,
      sessionId: data.sessionId,
      history: data.history
    });
  };

  const handleSmsFormClose = () => {
    setShowSmsContactForm(false);
  };

  const handleSmsChatClose = () => {
    setActiveSmsChat(null);
  };

  // Message sending logic
  const sendMessage = async () => {
    if (!input.trim()) return;
    const updatedMessages = [...messages, { role: "user", content: input }];
    setMessages(updatedMessages);
    
    // Track user message
    analyticsService.trackMessage(input, 'user');
    
    setInput("");
    setLoading(true);
    
    try {
      let botResponse;
      const userInput = input.toLowerCase();
      
      // Check for SMS requests
      if (isSmsRequest(userInput)) {
        setShowSmsContactForm(true);
        botResponse = "I'd be happy to help you send us a text message. Please fill out the form below:";
      }
      // Check for reservation queries
      else if (isReservationQuery(userInput)) {
        botResponse = "We recommend making reservations online through Tock for the most convenient booking experience. Our tasting experiences can be booked quickly and easily.";
        
        // Add a message with a reservation booking action button
        setMessages(prev => [
          ...prev, 
          { 
            role: "bot", 
            content: botResponse,
            action: {
              type: "external-link",
              text: "Make Your Reservation Online",
              url: "https://www.exploretock.com/mileaestatevineyard/"
            }
          }
        ]);
        return;
      }
      
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
          botResponse = interceptRagResponse(response, input);
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
          botResponse = interceptRagResponse(response, input);
        } catch (error) {
          console.error("❌ Error calling RAG endpoint:", error);
          botResponse = "I'm sorry, I couldn't process your request. Please try again later.";
        }
      }
      
      // Track bot response
      if (botResponse) {
        analyticsService.trackMessage(botResponse, 'bot');
      }
      
      setMessages(prev => [...prev, { role: "bot", content: botResponse }]);
    } catch (error) {
      console.error("Error processing message:", error);
      const errorMessage = "I'm having trouble processing your request. Please try again.";
      analyticsService.trackMessage(errorMessage, 'bot');
      setMessages(prev => [...prev, { role: "bot", content: errorMessage }]);
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

  // Add feedback handling
  const handleFeedback = async (feedbackData) => {
    try {
      // Submit feedback to the API
      await submitFeedback(feedbackData);

      // Update the message to show feedback was submitted
      setMessages(prev => prev.map(msg => 
        msg.id === feedbackData.messageId
          ? { ...msg, feedbackSubmitted: true }
          : msg
      ));

      // Track feedback in analytics
      analyticsService.trackFeedback(feedbackData.rating, feedbackData.comment);
      
      return true;
    } catch (error) {
      console.error("Error submitting feedback:", error);
      throw error;
    }
  };

  return {
    messages,
    setMessages, // Added this line to expose setMessages
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
    setShowMilesReferral,
    // Add new SMS-related state and handlers
    showSmsContactForm,
    setShowSmsContactForm,
    activeSmsChat,
    setActiveSmsChat,
    handleSmsFormSuccess,
    handleSmsFormClose,
    handleSmsChatClose,
    handleFeedback
  };
};