import { extractYear, normalizeWineName, cleanText, cleanWineTitle, typoCorrections } from "../utils/wineUtils";
import { fuzzyMatch } from "../utils/stringMatching";

export const useWineSearch = () => {
  // Format list of products for display
  const formatProductData = (products) => {
    if (!Array.isArray(products) || products.length === 0) {
      return "No matching products found.";
    }

    // Determine if results contain only wines
    const hasOnlyWines = products.every(p => p.type === "wine");
    
    // Sort by name for a consistent display
    const sortedWines = [...products].sort((a, b) => a.title.localeCompare(b.title));

    return sortedWines
      .map(product => {
        const price = product.variants && product.variants[0] ? 
          `$${(product.variants[0].price / 100).toFixed(2)}` : 
          "Price unavailable";
          
        return `🍷 ${product.title} - ${price}`;
      })
      .join("\n\n");
  };

  // Enhanced wine matching function with special handling for Proceedo wines
  const findWineMatches = (products, searchTerm) => {
    const searchLower = searchTerm.toLowerCase().trim();
    const normalizedSearch = normalizeWineName(searchTerm);
    const isRoseQuery = searchLower === "rose" || searchLower === "rosé";
    
    // Check if this is a price-specific query
    const isPriceQuery = searchLower.startsWith("how much is") || 
                        searchLower.includes("price of") || 
                        searchLower.includes("cost of") || 
                        searchLower.startsWith("what is the price of") ||
                        (searchLower.includes("how much does") && searchLower.includes("cost"));
    
    console.log(`🔍 Searching for: "${searchTerm}" among ${products.length} products`);
    console.log(`🔍 Normalized search term: "${normalizedSearch}"`);
    console.log(`🔍 Is price query: ${isPriceQuery}`);

    // *** DIRECT PROCEEDO DETECTION ***
    // First, check if this is a direct request for Proceedo wines
    const isProceedo = searchLower.includes("proceedo");
    const isWhite = searchLower.includes("white");
    const isRose = searchLower.includes("rosé") || searchLower.includes("rose");
    
    if (isProceedo) {
      console.log("🍷 SPECIAL CASE: Direct Proceedo wine request detected");
      
      // Filter to find Proceedo wines directly
      const proceedoWines = products.filter(p => {
        const title = p.title.toLowerCase();
        if (!title.includes("proceedo")) return false;
        
        // If specifically asking for white or rosé, filter accordingly
        if (isWhite) return title.includes("white");
        if (isRose) return title.includes("rosé") || title.includes("rose");
        
        // Otherwise return any Proceedo wine
        return true;
      });
      
      console.log(`🍷 Found ${proceedoWines.length} Proceedo wines through direct matching`);
      
      // If we found Proceedo wines with direct matching, return them with the isPriceQuery flag
      if (proceedoWines.length > 0) {
        return proceedoWines.map(wine => ({
          ...wine,
          isPriceQuery
        }));
      }
      
      // If we didn't find any, we'll fall back to the regular matching logic
      console.log("🍷 No direct Proceedo matches found, falling back to regular matching");
    }
    
    // Continue with the regular matching logic if direct detection didn't find Proceedo wines
    const typoCorrections = {
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
    };

    // Check for typos in search term - BUT PRESERVE "proceedo"
    let correctedSearch = searchLower;
    for (const [typo, correction] of Object.entries(typoCorrections)) {
      // Skip proceedo correction to preserve the actual wine name
      if (searchLower.includes(typo) && typo !== "proceedo") {
        correctedSearch = searchLower.replace(typo, correction);
        console.log(`🔄 Corrected typo: "${typo}" to "${correction}"`);
        break;
      }
    }
    
    // Special wine varieties to watch for - expanded list
    const wineVarieties = [
      "chardonnay", "cabernet", "cabernet sauvignon", "franc", "pinot", 
      "noir", "pinot noir", "blaufränkisch", "blaufrankisch", "merlot", 
      "riesling", "syrah", "sauvignon", "blanc", "sauvignon blanc",
      "grüner veltliner", "gruner veltliner", "rosé", "rose",
      "red blend", "white blend", "cabernet franc", "proceedo"
    ];
    
    // Look for varieties mentioned in the search
    const mentionedVarieties = wineVarieties.filter(variety => 
      searchLower.includes(variety)
    );
    
    if (mentionedVarieties.length > 0) {
      console.log(`🍇 Detected grape varieties: ${mentionedVarieties.join(", ")}`);
    }
    
    // Check for historical/unavailable products
    let includeUnavailable = false;
    if (searchLower.includes("do you have") || 
        searchLower.includes("have you") || 
        searchLower.includes("ever made") || 
        searchLower.includes("previous") || 
        searchLower.includes("past")) {
      includeUnavailable = true;
      console.log("🔍 Including unavailable products in search");
    }
    
    // Extract wine name from price query if applicable
    let wineName = searchTerm;
    if (isPriceQuery) {
      if (searchLower.startsWith("how much is")) {
        wineName = searchTerm.substring("how much is".length).trim();
      } else if (searchLower.includes("price of")) {
        wineName = searchLower.split("price of")[1].trim();
      } else if (searchLower.includes("cost of")) {
        wineName = searchLower.split("cost of")[1].trim();
      } else if (searchLower.startsWith("what is the price of")) {
        wineName = searchTerm.substring("what is the price of".length).trim();
      } else if ((searchLower.includes("how much does")) && (searchLower.includes("cost"))) {
        wineName = searchLower.split("how much does")[1].split("cost")[0].trim();
      }
      
      // Remove leading 'the' if present
      if (wineName.toLowerCase().startsWith("the ")) {
        wineName = wineName.substring(4).trim();
      }
      
      console.log(`🔍 Extracted wine name from price query: "${wineName}"`);
    }
    
    // Calculate match score for each product
    const wineProducts = products.filter(product => product.type && product.type.toLowerCase() === "wine");

    const productsWithScores = wineProducts.map(product => {
      // Skip unavailable wines unless specifically asked about historical wines
      if (!includeUnavailable && (product.adminStatus !== "Available" || product.webStatus !== "Available")) {
        return { product, score: 0 };
      }
      
      // Clean up the title by removing periods if needed
      const cleanedTitle = cleanWineTitle(product.title || "");
      
      const titleLower = cleanedTitle.toLowerCase();
      const normalizedTitle = normalizeWineName(cleanedTitle);
      const normalizedWineName = isPriceQuery ? normalizeWineName(wineName) : normalizedSearch;
      
      // Different matching strategies with weighted scores
      let score = 0;
      let matchDetails = [];
      
      // Prioritize Proceedo matches if searching for Proceedo
      if (isProceedo && titleLower.includes("proceedo")) {
        // Extra bonus for matching the type (white/rosé)
        if ((isWhite && titleLower.includes("white")) || 
            (isRose && (titleLower.includes("rosé") || titleLower.includes("rose")))) {
          score += 200; // Very high priority for exact Proceedo type match
          matchDetails.push(`Proceedo ${isWhite ? 'White' : 'Rosé'} exact match (+200)`);
        } else {
          score += 150; // High priority for any Proceedo
          matchDetails.push("Proceedo general match (+150)");
        }
      }
      
      // Ensure Rosé wines are prioritized when the user types "rose"
      if (isRoseQuery && titleLower.includes("rosé")) {
        score += 150; // Higher priority for Rosé wines
        matchDetails.push("Rosé wine match (+150)");
      }
      
      // 1. Direct title match (highest value)
      if (normalizedTitle === normalizedWineName) {
        score += 100;
        matchDetails.push("Direct match (+100)");
      }
      
      // 2. Substring matches
      if (normalizedTitle.includes(normalizedWineName)) {
        score += 50;
        matchDetails.push("Title contains search term (+50)");
      } else if (normalizedWineName.includes(normalizedTitle)) {
        score += 40;
        matchDetails.push("Search term contains title (+40)");
      }
      
      // 3. Word-level matches for multi-word searches
      const searchWords = normalizedWineName.split(' ').filter(w => w.length > 2);
      const titleWords = normalizedTitle.split(' ');
      
      const matchingWords = searchWords.filter(word => 
        titleWords.some(titleWord => titleWord.includes(word) || word.includes(titleWord))
      );
      
      if (matchingWords.length > 0) {
        const wordScore = (matchingWords.length / Math.max(1, searchWords.length)) * 30;
        score += wordScore;
        matchDetails.push(`Word matching: ${matchingWords.length}/${searchWords.length} words (+${wordScore.toFixed(1)})`);
      }

      // Handle corrected typos
      if (correctedSearch !== searchLower) {
        const correctedSearchNormalized = normalizeWineName(correctedSearch);
        if (normalizedTitle.includes(correctedSearchNormalized)) {
          score += 45;
          matchDetails.push(`Typo correction match (+45)`);
        }
      }

      // Variety matching with content
      if (mentionedVarieties.length > 0) {
        const contentLower = product.content ? product.content.toLowerCase() : "";
        const varietiesInTitle = mentionedVarieties.filter(v => titleLower.includes(v));
        const varietiesInContent = mentionedVarieties.filter(v => contentLower.includes(v));
        
        if (varietiesInTitle.length > 0) {
          score += 25;
          matchDetails.push(`Variety in title: ${varietiesInTitle.join(", ")} (+25)`);
        } else if (varietiesInContent.length > 0) {
          score += 15;
          matchDetails.push(`Variety in content: ${varietiesInContent.join(", ")} (+15)`);
        }
      }

      // Fuzzy matching for typos and misspellings
      if (score === 0) {
        for (const word of searchWords) {
          if (word.length < 4) continue; // Skip short words
          
          for (const titleWord of titleWords) {
            const similarity = fuzzyMatch(word, titleWord);
            if (similarity > 0.7) {
              const fuzzyScore = similarity * 30;
              score += fuzzyScore;
              matchDetails.push(`Fuzzy match: "${word}" ~ "${titleWord}" (${similarity.toFixed(2)}) (+${fuzzyScore.toFixed(1)})`);
              break;
            }
          }
        }
      }
      
      // Recent vintage bonus
      const year = extractYear(product.title || "");
      if (year > 2020) {
        score += 5;  // Prefer newer vintages slightly
        matchDetails.push(`Recent vintage: ${year} (+5)`);
      }
      
      // "Farmhouse" special case handling
      if (searchLower.includes("farmhouse") && titleLower.includes("farmhouse")) {
        score += 20;
        matchDetails.push("Farmhouse match (+20)");
      }
      
      // Check for specific mentions of "riesling" or other key varieties
      const specialVarieties = ["riesling", "rosé", "rose", "cabernet franc", "proceedo"];
      for (const special of specialVarieties) {
        if (searchLower.includes(special) && titleLower.includes(special)) {
          score += 35;  // Higher priority for these specific varieties
          matchDetails.push(`Special variety match: ${special} (+35)`);
        }
      }
      
      // Historical/past product bonus when asking about history
      if (includeUnavailable && (product.adminStatus !== "Available" || product.webStatus !== "Available")) {
        score += 10;  // Bonus for historical products when asked about past wines
        matchDetails.push("Historical product (+10)");
      }
      
      if (score > 0) {
        console.log(`  ✓ Match: "${product.title}" (Score: ${score.toFixed(1)})`);
        console.log(`    - Match reasons: ${matchDetails.join(", ")}`);
      }
      
      return { product, score, matchDetails, isPriceQuery };
    });
    
    // Filter products with a score and sort by score (highest first)
    return productsWithScores
      .filter(item => item.score > 0)
      .sort((a, b) => {
        // First by score
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // Then by vintage year
        return extractYear(b.product.title || "") - extractYear(a.product.title || "");
      })
      .map(item => {
        // Add isPriceQuery flag to the product object
        return { ...item.product, isPriceQuery };
      });
  };

  // Format wine information for response
  const formatWineResponse = (wine) => {
    // Check if this is a price-only query
    if (wine.isPriceQuery) {
      if (wine.variants && wine.variants.length > 0 && wine.variants[0].price) {
        const price = (wine.variants[0].price / 100).toFixed(2);
        return `💲 The price of **${cleanText(wine.title)}** is $${price}.`;
      } else {
        return `💲 Price information for **${cleanText(wine.title)}** is unavailable.`;
      }
    }
    
    // Regular full wine response
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
    
    return response;
  };

  // Handle additional context for wines that aren't available
  const handleUnavailableWine = (wineName, products) => {
    // Check if the wine existed in the past (include all products, not just available)
    const allProducts = products;
    const historicalMatches = findWineMatches(allProducts, wineName);
    
    if (historicalMatches.length > 0) {
      const match = historicalMatches[0];
      if (match.adminStatus !== "Available" || match.webStatus !== "Available") {
        return `We previously offered ${match.title}, but it's not currently available. Would you like to see our current selection of wines?`;
      }
    }
    
    // Try to suggest similar wines by grape variety
    const wineVarieties = {
      "riesling": ["grüner veltliner", "chardonnay", "white"],
      "chardonnay": ["grüner veltliner", "white"],
      "cabernet": ["red blend", "merlot", "red"],
      "merlot": ["red blend", "cabernet", "red"],
      "rosé": ["rose", "white blend"],
      "pinot noir": ["red blend", "red"],
      "syrah": ["red blend", "red"],
      "proceedo": ["white", "rosé", "rose"] // Add proceedo relationships
    };
    
    // Convert to lowercase for matching
    const lowerWineName = wineName.toLowerCase();
    
    // Check if the requested wine is one of our known varieties
    for (const [variety, alternatives] of Object.entries(wineVarieties)) {
      if (lowerWineName.includes(variety)) {
        // Try to find alternatives
        const availableWines = products.filter(p => 
          p.adminStatus === "Available" && p.webStatus === "Available"
        );
        
        // Look for alternatives
        const alternativeMatches = [];
        for (const alt of alternatives) {
          for (const product of availableWines) {
            if (product.title.toLowerCase().includes(alt)) {
              alternativeMatches.push(product);
            }
          }
          
          if (alternativeMatches.length > 0) {
            break;  // Found some alternatives
          }
        }
        
        if (alternativeMatches.length > 0) {
          let response = `We don't currently have a ${variety} wine available, but you might enjoy these alternatives:\n\n`;
          
          // Display up to 3 alternatives
          alternativeMatches.slice(0, 3).forEach((wine) => {
            response += `• ${wine.title}`;
            if (wine.variants && wine.variants[0] && wine.variants[0].price) {
              response += ` - $${(wine.variants[0].price / 100).toFixed(2)}`;
            }
            response += "\n";
          });
          
          return response;
        }
        
        break;
      }
    }
    
    return `I couldn't find any information about ${wineName} in our current or past inventory. Would you like to see our available wines?`;
  };

  return {
    formatProductData,
    findWineMatches,
    formatWineResponse,
    handleUnavailableWine
  };
};