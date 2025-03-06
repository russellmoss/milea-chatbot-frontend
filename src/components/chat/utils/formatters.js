import { cleanText, extractYear, removeYear } from "./wineUtils";

/**
 * Format a list of wines into a readable text format
 * @param {Array} wines - Array of wine products
 * @returns {string} - Formatted text listing wines
 */
export const formatWineList = (wines) => {
  if (!Array.isArray(wines) || wines.length === 0) {
    return "No matching products found.";
  }

  // Determine if results contain only wines
  const hasOnlyWines = wines.every(p => p.type === "wine");
  
  // Sort by name for a consistent display
  const sortedWines = [...wines].sort((a, b) => a.title.localeCompare(b.title));

  return sortedWines
    .map(wine => {
      const price = wine.variants && wine.variants[0] ? 
        `$${(wine.variants[0].price / 100).toFixed(2)}` : 
        "Price unavailable";
        
      return `🍷 ${wine.title} - ${price}`;
    })
    .join("\n\n");
};

/**
 * Format detailed information about a single wine
 * @param {Object} wine - Wine product data
 * @returns {string} - Formatted text with wine details
 */
export const formatWineDetails = (wine) => {
  if (!wine) return "Wine information not available.";
  
  const cleanedTitle = cleanText(wine.title);
  const cleanedTeaser = wine.teaser ? cleanText(wine.teaser) : "";
  const cleanedContent = cleanText(wine.content);
  
  let response = `🍷 **${cleanedTitle}**\n\n`;
  
  if (cleanedTeaser) {
    response += `📌 ${cleanedTeaser}\n\n`;
  }
  
  response += `📖 ${cleanedContent}\n\n`;
  
  if (wine.variants && wine.variants.length > 0 && wine.variants[0].price) {
    const price = (wine.variants[0].price / 100).toFixed(2);
    response += `💲 Price: $${price}`;
  } else {
    response += `💲 Price information unavailable`;
  }
  
  // Add availability information if present
  if (wine.adminStatus && wine.webStatus) {
    const isAvailable = wine.adminStatus === "Available" && wine.webStatus === "Available";
    if (!isAvailable) {
      response += "\n\n⚠️ Please note that this wine is not currently available for purchase.";
    }
  }
  
  return response;
};

/**
 * Format only the price information for a wine
 * @param {Object} wine - Wine product data
 * @returns {string} - Formatted text with only the wine price
 */
export const formatWinePrice = (wine) => {
  if (!wine) return "Wine information not available.";
  
  const cleanedTitle = cleanText(wine.title);
  
  if (wine.variants && wine.variants.length > 0 && wine.variants[0].price) {
    const price = (wine.variants[0].price / 100).toFixed(2);
    return `💲 The price of **${cleanedTitle}** is $${price}.`;
  } else {
    return `💲 Price information for **${cleanedTitle}** is unavailable.`;
  }
};

/**
 * Format multiple wine matches as suggestions
 * @param {Array} wines - Array of matching wine products
 * @param {string} primaryWineName - Name of the primary wine being displayed
 * @returns {string} - Formatted text with alternatives
 */
export const formatWineAlternatives = (wines, primaryWineName = "") => {
  if (!Array.isArray(wines) || wines.length <= 1) return "";
  
  // Determine if results contain only wines
  const hasOnlyWines = wines.every(p => p.type === "wine");
  
  // Use appropriate header based on product types
  const suggestionHeader = hasOnlyWines 
    ? "📋 I also found these wines that might interest you:" 
    : "📋 I also found these products that might interest you:";
  
  let response = `\n\n${suggestionHeader}`;
  
  // Filter out the primary wine if it's in the list
  const wineAlternatives = wines.filter(wine => wine.type.toLowerCase() === "wine");

const alternatives = primaryWineName ? 
    wineAlternatives.filter(wine => !wine.title.includes(primaryWineName)) : 
    wineAlternatives.slice(1);

  
  // Add up to 3 alternative wines
  alternatives.slice(0, 3).forEach((wine) => {
    // Extract year for display
    const year = wine.title.match(/\b(19|20)\d{2}\b/)?.[0] || "";
    const wineName = removeYear(wine.title);
    response += `\n• ${wineName} ${year}`;
  });
  
  return response;
};

/**
 * Format wine club information
 * @param {Object} clubInfo - Wine club data
 * @returns {string} - Formatted text with club details
 */
export const formatWineClub = (clubInfo) => {
  if (!clubInfo) return "Wine club information not available.";
  
  let response = `🍇 **${clubInfo.name || "Wine Club"}**\n\n`;
  
  if (clubInfo.description) {
    response += `${cleanText(clubInfo.description)}\n\n`;
  }
  
  if (clubInfo.price) {
    response += `💲 Membership starts at $${(clubInfo.price / 100).toFixed(2)} per shipment\n`;
  }
  
  if (clubInfo.benefits && clubInfo.benefits.length) {
    response += "\n📋 Membership benefits include:";
    clubInfo.benefits.forEach(benefit => {
      response += `\n• ${benefit}`;
    });
  }
  
  return response;
};

/**
 * Format tasting event information
 * @param {Object} event - Tasting event data
 * @returns {string} - Formatted text with event details
 */
export const formatTastingEvent = (event) => {
  if (!event) return "Event information not available.";
  
  let response = `🥂 **${event.title || "Wine Tasting"}**\n\n`;
  
  if (event.date) {
    const date = new Date(event.date);
    response += `📅 ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\n\n`;
  }
  
  if (event.description) {
    response += `${cleanText(event.description)}\n\n`;
  }
  
  if (event.price) {
    response += `💲 Price: $${(event.price / 100).toFixed(2)} per person\n`;
  }
  
  return response;
};

/**
 * Format currency values consistently
 * @param {number} cents - Price in cents
 * @returns {string} - Formatted price string
 */
export const formatPrice = (cents) => {
  if (!cents && cents !== 0) return "Price unavailable";
  return `$${(cents / 100).toFixed(2)}`;
};

/**
 * Format dates in a consistent way
 * @param {string} dateString - Date string from API
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};