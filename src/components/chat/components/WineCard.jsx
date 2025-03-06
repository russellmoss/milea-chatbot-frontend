import React from "react";
import { cleanText } from "../utils/textUtils";

/**
 * Component to display information about a wine
 * @param {Object} props - Component props
 * @param {Object} props.wine - Wine product data
 * @param {boolean} props.isAvailable - Whether the wine is currently available
 */
const WineCard = ({ wine, isAvailable = true }) => {
  if (!wine) return null;
  
  const cleanedTitle = cleanText(wine.title);
  const cleanedTeaser = wine.teaser ? cleanText(wine.teaser) : "";
  const cleanedContent = cleanText(wine.content);
  
  // Calculate price display
  const priceDisplay = wine.variants && wine.variants.length > 0 && wine.variants[0].price
    ? `$${(wine.variants[0].price / 100).toFixed(2)}`
    : "Price information unavailable";
  
  return (
    <div className="wine-card bg-[#F9F4E9] p-4 rounded-lg border border-[#5A3E00] mb-4">
      <h3 className="text-xl font-bold text-[#5A3E00] mb-2">{cleanedTitle}</h3>
      
      {!isAvailable && (
        <div className="text-amber-600 font-medium mb-2">
          ⚠️ This wine is not currently available
        </div>
      )}
      
      {cleanedTeaser && (
        <p className="text-[#5A3E00] italic mb-2">{cleanedTeaser}</p>
      )}
      
      <p className="text-[#5A3E00] mb-3">{cleanedContent}</p>
      
      <div className="font-bold text-[#715100]">
        {priceDisplay}
      </div>
    </div>
  );
};

export default WineCard;