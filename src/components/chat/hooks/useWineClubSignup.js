// src/components/chat/hooks/useWineClubSignup.js
import { useState } from 'react';

/**
 * Custom hook to manage wine club signup flow in the chat
 */
export const useWineClubSignup = () => {
  // Track signup flow state
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const [clubLevel, setClubLevel] = useState(null);
  
  // Function to detect wine club queries
  const isWineClubQuery = (message) => {
    const lowercaseMsg = message.toLowerCase();
    
    // Common wine club related terms
    const clubTerms = [
      'wine club', 
      'join club', 
      'membership', 
      'wine subscription',
      'monthly wine',
      'quarterly wine',
      'wine delivery'
    ];
    
    return clubTerms.some(term => lowercaseMsg.includes(term));
  };
  
  // Function to detect interest in signing up
  const isSignupInterest = (message) => {
    const lowercaseMsg = message.toLowerCase();
    
    // Common signup interest phrases
    const signupPhrases = [
      'sign up',
      'sign me up',
      'join now',
      'enroll',
      'register',
      'become a member',
      'start membership',
      'yes, i want to join',
      'yes, sign me up',
      'i\'d like to join',
      'i want to join',
      'how do i join',
      'how to join'
    ];
    
    return signupPhrases.some(phrase => lowercaseMsg.includes(phrase));
  };
  
  // Handle a wine club query
  const handleWineClubQuery = (query) => {
    const lowercaseQuery = query.toLowerCase();
    
    // Check for specific club level mention
    const clubLevelMentions = {
      'jumper': 'Jumper',
      'grand prix': 'Grand Prix',
      'triple crown': 'Triple Crown'
    };
    
    let mentionedClubLevel = null;
    for (const [term, clubName] of Object.entries(clubLevelMentions)) {
      if (lowercaseQuery.includes(term)) {
        mentionedClubLevel = clubName;
        break;
      }
    }
    
    // Check if it's a general wine club query or signup interest
    if (isSignupInterest(query)) {
      return {
        isClubQuery: true,
        isSignupInterest: true,
        clubLevel: mentionedClubLevel,
        response: "Great! I'd be happy to help you join our Wine Club. It's free to sign up, and our team will contact you to finalize your membership. Would you like to sign up now?",
        suggestSignup: true
      };
    } else {
      return {
        isClubQuery: true,
        isSignupInterest: false,
        clubLevel: mentionedClubLevel,
        response: `Our Wine Club offers three membership levels:

1. **Jumper Club** - Quarterly shipments of 3 bottles
2. **Grand Prix Club** - Quarterly shipments of 6 bottles with access to limited releases
3. **Triple Crown Club** - Quarterly shipments of 12 bottles with exclusive member events

All members receive discounts on wine purchases, complimentary tastings, and special event invitations. Would you like to join today? It's free to sign up!`,
        suggestSignup: true
      };
    }
  };
  
  // Start the signup flow
  const startSignupFlow = (selectedClub = null) => {
    if (selectedClub) {
      setClubLevel(selectedClub);
    }
    setShowSignupForm(true);
  };
  
  // Complete the signup flow
  const completeSignupFlow = () => {
    setShowSignupForm(false);
    setSignupComplete(true);
    // Reset after some time
    setTimeout(() => {
      setSignupComplete(false);
      setClubLevel(null);
    }, 5000);
  };
  
  // Cancel the signup flow
  const cancelSignupFlow = () => {
    setShowSignupForm(false);
    setClubLevel(null);
  };
  
  return {
    showSignupForm,
    signupComplete,
    clubLevel,
    isWineClubQuery,
    isSignupInterest,
    handleWineClubQuery,
    startSignupFlow,
    completeSignupFlow,
    cancelSignupFlow
  };
};