import { cleanText } from "./textUtils";

// Extract year from a wine title
export const extractYear = (title) => {
  const match = title.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0]) : 0;
};

// Remove year from wine title for better matching
export const removeYear = (title) => {
  return title.replace(/\b(19|20)\d{2}\b/, "").trim();
};

// Normalized wine name comparison (remove year, case, special chars)
export const normalizeWineName = (name) => {
  return removeYear(name)
    .toLowerCase()
    .replace(/[^\w\s]/gi, '') // Remove special characters
    .replace(/\s+/g, ' ')     // Normalize spaces
    .trim();
};

// Clean up wine title by removing periods that sometimes appear at the end
export const cleanWineTitle = (title) => {
  // Remove periods at the end of the title or before the year
  return title.replace(/\.\s*(19|20\d{2})?$/, '$1').trim();
};

// Export the cleanText function from textUtils to maintain API compatibility
export { cleanText };

// Define common wine varieties for reference
export const wineVarieties = [
  "chardonnay", "cabernet", "cabernet sauvignon", "franc", "pinot", 
  "noir", "pinot noir", "blaufränkisch", "blaufrankisch", "merlot", 
  "riesling", "syrah", "sauvignon", "blanc", "sauvignon blanc",
  "grüner veltliner", "gruner veltliner", "rosé", "rose",
  "red blend", "white blend", "cabernet franc", "proceedo"
];

// Define common typo corrections
export const typoCorrections = {
  "chardonay": "chardonnay", 
  "cabenet": "cabernet",
  "savignon": "sauvignon",
  "savingon": "sauvignon",
  "reisling": "riesling",
  "resling": "riesling",
  "blafrankisch": "blaufrankisch",
  "rose": "rosé",
  "gruner": "grüner veltliner",
  "gruener": "grüner veltliner"
  // Removed the proceedo/prosecco correction to avoid changing the wine name
};

// Define related wine varieties for recommendations
export const relatedVarieties = {
  "riesling": ["grüner veltliner", "chardonnay", "white"],
  "chardonnay": ["grüner veltliner", "white"],
  "cabernet": ["red blend", "merlot", "red"],
  "merlot": ["red blend", "cabernet", "red"],
  "rosé": ["rose", "white blend"],
  "pinot noir": ["red blend", "red"],
  "syrah": ["red blend", "red"],
  "proceedo": ["white", "rosé", "rose"] // Add proceedo relationships
};