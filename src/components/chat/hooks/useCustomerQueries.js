export const useCustomerQueries = () => {
    // Helper function to safely log errors without breaking the flow
    const logError = (message, error) => {
      console.error(`${message}:`, error);
      console.error("Error details:", {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
    };
  
    // Process questions that require authentication
    const processAuthenticatedQuestion = async (question, customerInfo) => {
      if (!customerInfo) {
        return "I'm having trouble accessing your account information. Please try logging in again.";
      }
      
      const questionLower = question.toLowerCase();
      
      // Loyalty points query
      if (questionLower.includes("loyalty") || questionLower.includes("points") || 
          questionLower.includes("miles") || questionLower.includes("reward")) {
        return `You currently have ${customerInfo.loyalty?.points || 0} loyalty points.`;
      }
      
      // Last wine purchase query
      if ((questionLower.includes("last") || questionLower.includes("recent")) && 
          questionLower.includes("wine") && 
          (questionLower.includes("bought") || questionLower.includes("purchased") || questionLower.includes("order"))) {
        
        if (customerInfo.orders && customerInfo.orders.length > 0) {
          // Check if we might need to process more orders than initially loaded
          const totalOrderCount = customerInfo.totalOrderCount || customerInfo.orders.length;
          
          console.log(`Processing ${customerInfo.orders.length} orders out of ${totalOrderCount} total orders for wine purchases`);
          
          // Look through orders to find the last wine purchase
          for (const order of customerInfo.orders) {
            const items = order.items || order.orderItems || [];
            const wineItems = items.filter(item => {
              // First check if the item has a product type of "Wine"
              if (item.productType === "Wine") {
                return true;
              }
              
              // If product type is not available or not "Wine", check against wine-related keywords as fallback
              const itemName = (item.productTitle || item.name || "").toLowerCase();
              return (itemName.includes("wine") && !itemName.includes("wine glass") && !itemName.includes("wineglass")) || 
                     itemName.includes("chardonnay") || 
                     itemName.includes("cabernet") || 
                     itemName.includes("pinot noir") || 
                     itemName.includes("riesling") || 
                     itemName.includes("merlot") || 
                     itemName.includes("sauvignon blanc") ||
                     (itemName.includes("rosé") && !itemName.includes("chocolate")) ||
                     (itemName.includes("rose") && !itemName.includes("chocolate"));
            });
            
            if (wineItems.length > 0) {
              const orderDate = new Date(order.orderDate || order.createdAt).toLocaleDateString();
              return `Your last wine purchase was on ${orderDate}: ${wineItems.map(item => item.productTitle || item.name).join(", ")}.`;
            }
          }
          
          // If we've processed fewer orders than the total and found no wine, note this limitation
          if (customerInfo.orders.length < totalOrderCount) {
            return "I searched through your most recent orders but couldn't find any wine purchases. You have more orders in your history that I couldn't access in this request. Try asking about more specific recent purchases.";
          }
          
          return "I couldn't find any wine purchases in your order history.";
        } else {
          return "I don't see any orders in your account history.";
        }
      }
      
      // Last order query
      if (questionLower.includes("last order") || 
          questionLower.includes("recent purchase") || 
          questionLower.includes("last purchase")) {
        
        if (customerInfo.orders && customerInfo.orders.length > 0) {
          const lastOrder = customerInfo.orders[0]; // Assuming orders are sorted by date
          const orderDate = new Date(lastOrder.orderDate || lastOrder.createdAt).toLocaleDateString();
          const items = lastOrder.items || lastOrder.orderItems || [];
          
          // Convert total from pennies to dollars (divide by 100 and format with 2 decimal places)
          const totalRaw = lastOrder.total || lastOrder.grandTotal || 0;
          const totalFormatted = (totalRaw / 100).toFixed(2);
          
          return `Your last order was placed on ${orderDate} for a total of $${totalFormatted}.
                  It included ${items.length} item(s): ${items.map(item => item.productTitle || item.name).join(", ")}.`;
        } else {
          return "I don't see any previous orders in your account history.";
        }
      }
      
      // Most ordered wine query - including "favorite wine"
      if ((questionLower.includes("most") || 
           questionLower.includes("common") || 
           questionLower.includes("frequently") || 
           questionLower.includes("favorite") || 
           (questionLower.includes("what") && questionLower.includes("wine") && (questionLower.includes("buy") || questionLower.includes("order") || questionLower.includes("purchase")))) && 
          (questionLower.includes("wine") || questionLower.includes("wines"))) {
        
        try {
          if (customerInfo.orders && customerInfo.orders.length > 0) {
            // Find and count all wine products across all orders
            const wineCount = {};
            let hasWines = false;
            
            // Check if we're potentially missing orders due to pagination
            const totalOrderCount = customerInfo.totalOrderCount || customerInfo.orders.length;
            console.log(`Processing ${customerInfo.orders.length} orders out of ${totalOrderCount} total orders for wine counting`);
            
            customerInfo.orders.forEach(order => {
              const items = order.items || order.orderItems || [];
              items.forEach(item => {
                // ONLY count items explicitly marked as Wine type
                const isWine = item.productType === "Wine";
                
                // Count the product if it's a wine
                if (isWine) {
                  const productName = item.productTitle || item.name;
                  wineCount[productName] = (wineCount[productName] || 0) + 1;
                  hasWines = true;
                }
              });
            });
            
            // Find the most ordered wine
            let mostOrderedWine = null;
            let maxCount = 0;
            
            for (const [wine, count] of Object.entries(wineCount)) {
              if (count > maxCount) {
                mostOrderedWine = wine;
                maxCount = count;
              }
            }
            
            if (mostOrderedWine) {
              // For "favorite wine" questions
              if (questionLower.includes("favorite")) {
                return `Based on your purchase history, your favorite wine appears to be ${mostOrderedWine}, which you've ordered ${maxCount} time(s).`;
              }
              
              // For other "most purchased" questions
              return `Your most frequently ordered wine is ${mostOrderedWine}, which you've ordered ${maxCount} time(s).`;
            }
            
            if (!hasWines) {
              // If we've processed fewer orders than the total and found no wine, note this limitation
              if (customerInfo.orders.length < totalOrderCount) {
                if (questionLower.includes("favorite")) {
                  return "I've looked through your most recent orders but couldn't identify a favorite wine. You have more orders in your history that I couldn't access in this request.";
                } else {
                  return "I've looked through your most recent orders but couldn't find any wine purchases. You have more orders in your history that I couldn't access in this request.";
                }
              } else {
                if (questionLower.includes("favorite")) {
                  return "I don't see any wine purchases in your order history, so I can't determine your favorite wine.";
                } else {
                  return "I don't see any wine purchases in your order history.";
                }
              }
            }
            
            return "I don't have enough order history to determine your most ordered wine.";
          } else {
            return "I don't see any orders in your account history.";
          }
        } catch (error) {
          logError("Error processing most ordered wine query", error);
          
          // Give user a more helpful message instead of a generic error
          if (questionLower.includes("favorite")) {
            return "I don't see any wine purchases in your order history, so I can't determine your favorite wine.";
          } else {
            return "I don't see any wine purchases in your order history.";
          }
        }
      }
      
      // Total spent calculation
      if (questionLower.includes("total") || questionLower.includes("how much") || questionLower.includes("spent")) {
        try {
          if (customerInfo.orders && customerInfo.orders.length > 0) {
            // Calculate total spent
            let totalSpent = 0;
            
            customerInfo.orders.forEach(order => {
              const orderTotal = order.total || order.grandTotal || 0;
              totalSpent += orderTotal;
            });
            
            // Format as dollars (assuming amounts are in pennies)
            const formattedTotal = (totalSpent / 100).toFixed(2);
            
            // Check if we're only showing partial data due to pagination
            const totalOrderCount = customerInfo.totalOrderCount || customerInfo.orders.length;
            if (customerInfo.orders.length < totalOrderCount) {
              return `Based on your ${customerInfo.orders.length} most recent orders, you have spent a total of $${formattedTotal} with us. Note: You have ${totalOrderCount} total orders, but I can only access your most recent ones.`;
            } else {
              return `Based on your order history, you have spent a total of $${formattedTotal} with us.`;
            }
          } else {
            return "I don't see any orders in your account history.";
          }
        } catch (error) {
          logError("Error calculating total spent", error);
          return "I couldn't calculate your total spent amount at this time. Please try again later.";
        }
      }
      
      // Club memberships query
      if (questionLower.includes("club") || 
          questionLower.includes("membership") || 
          questionLower.includes("subscription") ||
          questionLower.includes("am i a member")) {
        try {
          if (customerInfo.clubMemberships && customerInfo.clubMemberships.length > 0) {
            const clubs = customerInfo.clubMemberships;
            
            // Detailed response with sign-up date if asking specifically when they signed up
            if (questionLower.includes("when did i sign") || 
                questionLower.includes("join date") || 
                questionLower.includes("sign up date")) {
              
              const joinDates = clubs.map(club => {
                const signupDate = new Date(club.signupDate || club.createdAt);
                return `${club.clubTitle || 'Wine Club'}: ${signupDate.toLocaleDateString()}`;
              });
              
              return `You signed up for our wine club on the following dates:\n${joinDates.join('\n')}`;
            }
            
            // Standard response for general membership queries
            return `You are a member of the following club(s): ${clubs.map(club => club.clubTitle || 'Wine Club').join(", ")}.`;
          } else {
            return "You currently don't have any active club memberships. Would you like information about our wine club options?";
          }
        } catch (error) {
          console.error("Error processing club data:", error);
          return "I'm having trouble accessing your club membership information right now.";
        }
      }
      
      // Generic account question
      return `Here's a summary of your account:
              • Name: ${customerInfo.firstName} ${customerInfo.lastName}
              • Email: ${customerInfo.email}
              ${customerInfo.loyalty ? `• Loyalty Points: ${customerInfo.loyalty.points || 0}` : ''}
              • Total Orders: ${customerInfo.totalOrderCount || customerInfo.orders?.length || 0}
              
              What specific information would you like to know?`;
    };
  
    // Detect if a question requires authentication
    const requiresAuthentication = (text) => {
      const textLower = text.toLowerCase();
      
      // Direct check for loyalty points related queries
      if (textLower.includes("loyalty point") || 
          textLower.includes("milea miles") || 
          textLower.includes("reward point") || 
          (textLower.includes("points") && !textLower.includes("points about")) ||
          textLower.includes("miles")) {
        return true;
      }
      
      // Direct check for club membership queries
      if (textLower.includes("club member") || 
          textLower.includes("wine club") || 
          textLower.includes("am i a member") || 
          textLower.includes("my club") ||
          textLower.includes("club membership") ||
          textLower.includes("sign up for the club") ||
          textLower.includes("when did i sign")) {
        return true;
      }
      
      const authPatterns = [
        "my account",
        "my order",
        "my purchase", 
        "my wine",
        "my profile",
        "my loyalty",
        "my points",
        "my membership",
        "my subscription",
        "my history",
        "my wines",
        "my shipment",
        "last order",
        "recent purchase",
        "what did i",
        "what have i",
        "i ordered",
        "i bought",
        "did i buy"
      ];
      
      return authPatterns.some(pattern => textLower.includes(pattern));
    };
  
    return {
      processAuthenticatedQuestion,
      requiresAuthentication
    };
  };