// Advanced fuzzy string matching
export const fuzzyMatch = (str1, str2, threshold = 0.7) => {
    str1 = str1.toLowerCase();
    str2 = str2.toLowerCase();
    
    // Exact match
    if (str1 === str2) return 1;
    
    // Calculate Levenshtein distance
    const calculateDistance = (a, b) => {
      if (a.length === 0) return b.length;
      if (b.length === 0) return a.length;
      
      const matrix = [];
      
      // Initialize matrix
      for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
      }
      
      for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
      }
      
      // Fill matrix
      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          const cost = a[j - 1] === b[i - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,      // deletion
            matrix[i][j - 1] + 1,      // insertion
            matrix[i - 1][j - 1] + cost // substitution
          );
        }
      }
      
      return matrix[b.length][a.length];
    };
    
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1; // Both strings are empty
    
    const distance = calculateDistance(str1, str2);
    const similarity = 1 - (distance / maxLength);
    
    return similarity;
  };
  
  // Simple substring matching with normalization
  export const containsSubstring = (str, substring) => {
    str = str.toLowerCase().trim();
    substring = substring.toLowerCase().trim();
    
    return str.includes(substring);
  };
  
  // Word-based matching (checks if any words from str1 appear in str2)
  export const hasMatchingWords = (str1, str2, minWordLength = 3) => {
    const words1 = str1.toLowerCase().split(/\s+/).filter(w => w.length >= minWordLength);
    const words2 = str2.toLowerCase().split(/\s+/);
    
    return words1.some(word => words2.includes(word));
  };
  
  // Calculate word overlap percentage between two strings
  export const wordOverlapScore = (str1, str2, minWordLength = 3) => {
    const words1 = str1.toLowerCase().split(/\s+/).filter(w => w.length >= minWordLength);
    const words2 = str2.toLowerCase().split(/\s+/).filter(w => w.length >= minWordLength);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const matchingWords = words1.filter(word => words2.includes(word));
    return matchingWords.length / Math.max(words1.length, words2.length);
  };