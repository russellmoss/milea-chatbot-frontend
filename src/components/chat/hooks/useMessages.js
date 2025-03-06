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
      // Check for queries requiring authentication (including club membership queries)
      else {
        // Check if this is a query requiring authentication (including club membership queries)
        if (requiresAuthentication(userInput)) {
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
        // Wine list request
        else if (userInput.includes("all wines") || 
                userInput.includes("all your wines") || 
                userInput.includes("wine list") || 
                userInput.includes("show me all") || 
                userInput === "yes") {
          
          try {
            const products = await fetchWineData(true);
            const availableWines = products.filter(p => 
              p.adminStatus === "Available" && p.webStatus === "Available"
            );
            
            botResponse = "Here are our currently available wines:\n\n" + formatProductData(availableWines);
          } catch (error) {
            console.error("❌ Error fetching all wines:", error.message);
            botResponse = "I'm sorry, I encountered an error retrieving our wine list. Please try again later.";
          }
        } 
        // All other wine queries and general questions
        else {
          console.log("📡 Fetching all wines from Commerce7...");
          try {
            const products = await fetchWineData(true);
            console.log(`✅ Total products received: ${products?.length || 0}`);
    
            // Filter only available wines for primary search
            const availableWines = products.filter(p => 
              p.adminStatus === "Available" && p.webStatus === "Available"
            );
            
            console.log(`📊 Available wines: ${availableWines.length} out of ${products.length}`);
    
            // Check if this might be a price query
            const isPriceQuery = userInput.startsWith("how much is") || 
                                userInput.includes("price of") ||
                                userInput.includes("cost of") ||
                                userInput.startsWith("what is the price of") ||
                                (userInput.includes("how much does") && userInput.includes("cost"));
    
            // Use the enhanced wine matching function - search in available wines first
            const matchedWines = findWineMatches(availableWines, userInput);
            console.log(`🔍 Found ${matchedWines.length} matching available wines`);
    
            if (matchedWines.length > 0) {
              // Get the best match (already sorted by score and then vintage)
              const bestMatch = matchedWines[0];
              console.log(`✅ Selected best match: ${bestMatch.title}`);
    
              // Check if this is a price query
              if (bestMatch.isPriceQuery) {
                // Format just the price information
                botResponse = formatWineResponse(bestMatch);
              } else {
                // Format the full response with clean text
                botResponse = formatWineResponse(bestMatch);
                
                // If multiple matches found, offer alternatives (but only for non-price queries)
                if (matchedWines.length > 1) {
                  botResponse += "\n\n📋 I also found these similar wines that might interest you:";
                  
                  // Add up to 3 alternative wines
                  matchedWines.slice(1, 4).forEach((wine) => {
                    // Extract year for display
                    const year = wine.title.match(/\b(19|20)\d{2}\b/)?.[0] || "";
                    const wineName = wine.title.replace(/\b(19|20)\d{2}\b/, "").trim();
                    botResponse += `\n• ${wineName} ${year}`;
                  });
                }
              }
            } else {
              // Check if we're looking for wines that might have existed in the past
              // or try to check all products (not just available ones)
              const isHistoricalSearch = userInput.includes("do you have") || 
                                        userInput.includes("have you") || 
                                        userInput.includes("ever made") ||
                                        userInput.includes("previous") ||
                                        userInput.includes("past");
              
              if (isHistoricalSearch) {
                // Search among all products, not just available ones
                const historicalMatches = findWineMatches(products, userInput);
                
                if (historicalMatches.length > 0) {
                  const bestMatch = historicalMatches[0];
                  
                  // Check if this is a price query for a historical wine
                  if (bestMatch.isPriceQuery) {
                    botResponse = formatWineResponse(bestMatch);
                    
                    // Add note about availability for price queries
                    if (bestMatch.adminStatus !== "Available" || bestMatch.webStatus !== "Available") {
                      botResponse += "\n\n⚠️ Please note that this wine is not currently available for purchase.";
                    }
                  } else {
                    botResponse = formatWineResponse(bestMatch);
                    
                    // Add note about availability for regular queries
                    if (bestMatch.adminStatus !== "Available" || bestMatch.webStatus !== "Available") {
                      botResponse += "\n\n⚠️ Please note that this wine is not currently available for purchase.";
                    }
                  }
                } else {
                  // Check if we can detect a specific grape variety
                  const wineVarieties = [
                    "chardonnay", "cabernet", "franc", "pinot", "noir", 
                    "riesling", "syrah", "sauvignon", "blanc", "rosé", "rose"
                  ];
                  
                  const detectedVariety = wineVarieties.find(variety => userInput.includes(variety));
                  
                  if (detectedVariety) {
                    botResponse = handleUnavailableWine(detectedVariety, products);
                  } else {
                    botResponse = "I couldn't find any information about that wine in our current or past inventory. Would you like to see our available wines?";
                  }
                }
              } else if (isPriceQuery) {
                // Handle price query for a wine we couldn't find in available inventory
                // Extract wine name from price query
                let wineName = userInput;
                if (userInput.startsWith("how much is")) {
                  wineName = userInput.substring("how much is".length).trim();
                } else if (userInput.includes("price of")) {
                  wineName = userInput.split("price of")[1].trim();
                } else if (userInput.includes("cost of")) {
                  wineName = userInput.split("cost of")[1].trim();
                } else if (userInput.startsWith("what is the price of")) {
                  wineName = userInput.substring("what is the price of".length).trim();
                } else if (userInput.includes("how much does") && userInput.includes("cost")) {
                  wineName = userInput.split("how much does")[1].split("cost")[0].trim();
                }
                
                // Remove leading 'the' if present
                if (wineName.toLowerCase().startsWith("the ")) {
                  wineName = wineName.substring(4).trim();
                }
                
                // Search all products for the wine
                const historicalMatches = findWineMatches(products, wineName);
                
                if (historicalMatches.length > 0) {
                  const bestMatch = historicalMatches[0];
                  botResponse = formatWineResponse(bestMatch);
                  
                  // Add note about availability
                  if (bestMatch.adminStatus !== "Available" || bestMatch.webStatus !== "Available") {
                    botResponse += "\n\n⚠️ Please note that this wine is not currently available for purchase.";
                  }
                } else {
                  botResponse = `I couldn't find price information for "${wineName}" in our inventory. Would you like to see our available wines?`;
                }
              } else {
                // Check if we detected specific wine varieties
                const wineVarieties = [
                  "chardonnay", "cabernet", "franc", "pinot", "noir", 
                  "blaufränkisch", "blaufrankisch", "merlot", "riesling", 
                  "syrah", "sauvignon", "blanc", "grüner veltliner", "gruner veltliner",
                  "rosé", "rose"
                ];
                
                const detectedVariety = wineVarieties.find(variety => userInput.includes(variety));
    
                if (detectedVariety) {
                  botResponse = handleUnavailableWine(detectedVariety, products);
                } else {
                  // Default to OpenAI for general questions
                  console.log("❌ No specific wine found, defaulting to OpenAI...");
                  const response = await processChatRequest(input);
                  botResponse = response;
                }
              }
            }
          } catch (error) {
            console.error("❌ Error processing wine search:", error.message);
            botResponse = "I'm sorry, I couldn't access our wine inventory. Please try again later.";
          }
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