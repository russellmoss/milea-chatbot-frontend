// Enhanced text cleaning function for HTML entities and special characters
export const cleanText = (text) => {
    if (!text) return "No description available.";
    
    return text
      .replace(/<\/?[^>]+(>|$)/g, "")     // Remove HTML tags
      .replace(/&nbsp;/g, " ")            // Replace &nbsp; with spaces
      .replace(/&amp;/g, "&")             // Replace &amp; with &
      .replace(/&lt;/g, "<")              // Replace &lt; with <
      .replace(/&gt;/g, ">")              // Replace &gt; with >
      .replace(/&quot;/g, '"')            // Replace &quot; with "
      .replace(/&#39;/g, "'")             // Replace &#39; with '
      .replace(/&eacute;/g, "é")          // Replace &eacute; with é
      .replace(/&egrave;/g, "è")          // Replace &egrave; with è
      .replace(/&agrave;/g, "à")          // Replace &agrave; with à
      .replace(/&uuml;/g, "ü")            // Replace &uuml; with ü
      .replace(/&ouml;/g, "ö")            // Replace &ouml; with ö
      .replace(/&auml;/g, "ä")            // Replace &auml; with ä
      .replace(/&iuml;/g, "ï")            // Replace &iuml; with ï
      .replace(/&ccedil;/g, "ç")          // Replace &ccedil; with ç
      .trim();                             // Remove extra whitespace
};
  
// Function to check if a string is a wine category/type
export const isWineCategory = (str) => {
    const categories = [
      "chardonnay", "cabernet", "franc", "pinot", "noir", 
      "riesling", "syrah", "sauvignon", "blanc", "rosé", "rose",
      "red blend", "white blend", "cabernet franc", "gruner", "veltliner",
      "prosecco", "sparkling", "merlot", "zinfandel", "malbec", "finger lakes"
    ];
    return categories.some(cat => str.toLowerCase().includes(cat));
};

// Function to normalize wine names for consistent matching
export const normalizeWineName = (name) => {
    if (!name) return "";

    let processedName = name
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')  // Remove special characters
      .replace(/\s+/g, ' ')      // Normalize spaces
      .trim();
      
    // Convert "rose" to "rosé" when referring to wine
    if (processedName === "rose") {
      return "rosé";
    }

    return processedName;
};
