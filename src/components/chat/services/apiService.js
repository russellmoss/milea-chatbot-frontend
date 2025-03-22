// src/components/chat/services/apiService.js
import axios from "axios";

// Default API base URL - can be overridden with environment variables or settings
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    "Content-Type": "application/json"
  }
});

// Add a request interceptor to include auth token if available
api.interceptors.request.use(
  (config) => {
    // Check if the endpoint is public (no auth required)
    const isPublicEndpoint = config.url.startsWith('/api/health') || 
                           config.url.startsWith('/api/analytics') || 
                           config.url.startsWith('/api/feedback');

    // Only add auth token for non-public endpoints
    if (!isPublicEndpoint) {
      const token = localStorage.getItem("commerce7Token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors by clearing token
    if (error.response?.status === 401) {
      localStorage.removeItem("commerce7Token");
      localStorage.removeItem("customerId");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
      
      // Redirect to login if needed
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/**
 * Subscribe a user to the mailing list
 * @param {Object} userData - User data for subscription
 * @param {string} userData.firstName - User's first name
 * @param {string} userData.lastName - User's last name
 * @param {string} userData.email - User's email address
 * @returns {Promise<Object>} - Subscription response
 */
export const subscribeToMailingList = async (userData) => {
  try {
    const response = await api.post("/api/subscribe", userData);
    return response.data;
  } catch (error) {
    console.error("Error subscribing to mailing list:", error);
    throw error;
  }
};

/**
 * Fetch wine data from Commerce7 API
 * @param {boolean} fetchAll - Whether to fetch all wines or just available ones
 * @returns {Promise<Array>} - Array of wine products
 */
export const fetchWineData = async (fetchAll = false) => {
  try {
    const response = await api.get(`/api/commerce7/products?fetchAll=${fetchAll}`);
    return response.data.products || [];
  } catch (error) {
    console.error("Error fetching wine data:", error);
    return [];
  }
};

/**
 * Process a chat request through the AI service
 * @param {string} message - User message
 * @returns {Promise<string>} - AI response message
 */
export const processChatRequest = async (message) => {
  try {
    const response = await api.post("/rag-chat", { message });
    return response.data.response || "I'm having trouble finding information about that.";
  } catch (error) {
    console.error("Error processing chat request:", error);
    throw new Error("Failed to process chat request");
  }
};

/**
 * Fetch wine club information
 * @returns {Promise<Object>} - Wine club information
 */
export const fetchWineClubInfo = async () => {
  try {
    const response = await api.get("/api/commerce7/club");
    return response.data;
  } catch (error) {
    console.error("Error fetching wine club info:", error);
    throw new Error("Failed to fetch wine club information");
  }
};

/**
 * Fetch information about a specific wine club by ID
 * @param {string} clubId - The club ID to fetch
 * @returns {Promise<Object>} - Wine club details
 */
export const fetchWineClubById = async (clubId) => {
  try {
    const response = await api.get(`/api/commerce7/club/${clubId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching club ${clubId}:`, error);
    throw new Error("Failed to fetch wine club details");
  }
};

/**
 * Submit a wine club membership application
 * @param {Object} formData - Wine club signup form data
 * @returns {Promise<Object>} - API response with membership details
 */
export const submitWineClubMembership = async (formData) => {
  try {
    // Format the data for the Commerce7 API
    const payload = formatMembershipData(formData);
    
    // Submit to our backend API (which will handle Commerce7 authentication)
    const response = await api.post("/api/commerce7/club-signup", payload);
    
    return response.data;
  } catch (error) {
    console.error('Wine club signup error:', error);
    throw error;
  }
};

/**
 * Format membership data for the Commerce7 API
 * @param {Object} formData - The form data from the signup component
 * @returns {Object} - Formatted data for the API
 */
const formatMembershipData = (formData) => {
  // Build the customer data
  const customerData = {
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    phone: formData.phone,
    password: formData.password,
    
    // Add addresses with firstName and lastName included
    addresses: [
      {
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.shippingAddress.address,
        address2: formData.shippingAddress.address2 || '',
        city: formData.shippingAddress.city,
        stateCode: formData.shippingAddress.stateCode,
        zipCode: formData.shippingAddress.zipCode,
        countryCode: formData.shippingAddress.countryCode,
        isDefault: true
      }
    ],
    
    // Club membership details - only include required fields
    clubMembership: {
      clubId: formData.clubId,
      deliveryMethod: formData.deliveryMethod
      // Do not include status or metaData here
      // The backend will add signupDate and convert deliveryMethod to orderDeliveryMethod
    }
  };
  
  // Add billing address if different from shipping
  if (!formData.billingAddressSame) {
    customerData.addresses.push({
      firstName: formData.firstName,
      lastName: formData.lastName,
      address: formData.billingAddress.address,
      address2: formData.billingAddress.address2 || '',
      city: formData.billingAddress.city,
      stateCode: formData.billingAddress.stateCode,
      zipCode: formData.billingAddress.zipCode,
      countryCode: formData.billingAddress.countryCode,
      isDefault: false
    });
  }
  
  return customerData;
};

/**
 * Check if a customer already exists in Commerce7
 * @param {string} email - Customer email address
 * @returns {Promise<Object|null>} - Customer data if exists, null otherwise
 */
export const checkExistingCustomer = async (email) => {
  try {
    const response = await api.get(`/api/commerce7/customer/search?email=${encodeURIComponent(email)}`);
    
    if (!response.data.customers || response.data.customers.length === 0) {
      return null;
    }
    
    return response.data.customers[0];
  } catch (error) {
    console.error('Error checking existing customer:', error);
    return null;
  }
};

/**
 * Fetch loyalty points for the authenticated user
 * @returns {Promise<Object>} - Loyalty points data
 */
export const fetchLoyaltyPoints = async () => {
  try {
    const response = await api.get("/api/customer/loyalty-points");
    return response.data;
  } catch (error) {
    console.error("Error fetching loyalty points:", error);
    throw new Error("Failed to fetch loyalty points");
  }
};

/**
 * Fetch customer account information
 * @returns {Promise<Object>} - Customer account data
 */
export const fetchCustomerAccount = async () => {
  try {
    const response = await api.get("/api/customer/me");
    return response.data;
  } catch (error) {
    console.error("Error fetching customer account:", error);
    throw new Error("Failed to fetch customer account");
  }
};

/**
 * Login with Commerce7 credentials
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise<Object>} - Login response
 */
export const login = async (credentials) => {
  try {
    const response = await api.post("/api/auth/login", credentials);
    return response.data;
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
};

/**
 * Fetch business hours from Google My Business
 * @returns {Promise<Object>} - Business hours information
 */
export const fetchBusinessHours = async () => {
  try {
    const response = await api.get("/api/business/hours");
    return response.data;
  } catch (error) {
    console.error("Error fetching business hours:", error);
    throw new Error("Failed to fetch business hours");
  }
};

/**
 * Initiate an SMS conversation
 * @param {Object} contactData - Contact information
 * @param {string} contactData.firstName - First name
 * @param {string} contactData.lastName - Last name
 * @param {string} contactData.email - Email address (optional)
 * @param {string} contactData.phoneNumber - Phone number
 * @param {string} contactData.birthdate - Birthdate (optional)
 * @param {string} contactData.message - Initial message
 * @param {string} contactData.sessionId - Unique session ID
 * @returns {Promise<Object>} - API response
 */
export const initiateSmsConversation = async (contactData) => {
  try {
    const response = await api.post('/api/twilio/initiate', contactData);
    return response.data;
  } catch (error) {
    console.error('Error initiating SMS conversation:', error);
    throw error;
  }
};

/**
 * Send an SMS message
 * @param {string} phoneNumber - Recipient's phone number
 * @param {string} message - Message content
 * @returns {Promise<Object>} - API response
 */
export const sendSmsMessage = async (phoneNumber, message) => {
  try {
    const response = await api.post('/api/twilio/send', { phoneNumber, message });
    return response.data;
  } catch (error) {
    console.error('Error sending SMS message:', error);
    throw error;
  }
};

/**
 * Fetch SMS conversation history
 * @param {string} phoneNumber - Phone number to fetch history for
 * @returns {Promise<Object>} - API response with message history
 */
export const fetchSmsHistory = async (phoneNumber) => {
  try {
    const response = await api.get(`/api/twilio/history/${phoneNumber}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching SMS history:', error);
    throw error;
  }
};

/**
 * Submit user feedback
 * @param {Object} feedbackData - Feedback data including rating and comments
 * @param {string} feedbackData.messageId - ID of the message being rated
 * @param {string} feedbackData.conversationId - ID of the conversation
 * @param {number} feedbackData.rating - Rating from 1-5
 * @param {string} feedbackData.comment - User's feedback comment
 * @returns {Promise<Object>} - API response
 */
export const submitFeedback = async (feedbackData) => {
  try {
    // Validate required fields
    if (!feedbackData.messageId || !feedbackData.rating) {
      throw new Error('Message ID and rating are required');
    }

    // Ensure rating is a number
    const rating = Number(feedbackData.rating);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      throw new Error('Rating must be a number between 1 and 5');
    }

    // Prepare the request data
    const requestData = {
      messageId: String(feedbackData.messageId),
      conversationId: String(feedbackData.conversationId),
      rating: rating,
      comment: feedbackData.comment ? String(feedbackData.comment).trim() : "",
      tags: Array.isArray(feedbackData.tags) ? feedbackData.tags : []
    };

    console.log('Submitting feedback with data:', requestData);
    const response = await api.post("/api/feedback", requestData);
    return response.data;
  } catch (error) {
    console.error("Error submitting feedback:", error);
    throw new Error("Failed to submit feedback");
  }
};

/**
 * Track user interaction for analytics
 * @param {Object} interactionData - Interaction data including type and details
 * @param {string} interactionData.type - Type of interaction
 * @param {Object} interactionData.details - Additional interaction details
 * @param {string} interactionData.sessionId - Unique session identifier
 * @returns {Promise<Object>} - API response
 */
export const trackInteraction = async (interactionData) => {
  try {
    const response = await api.post("/api/analytics/interaction", {
      ...interactionData,
      sessionId: localStorage.getItem("sessionId") || generateSessionId(),
      userId: localStorage.getItem("customerId") || null,
      timestamp: new Date().toISOString()
    });
    return response.data;
  } catch (error) {
    console.error("Error tracking interaction:", error);
    throw new Error("Failed to track interaction");
  }
};

/**
 * Track chat session metrics
 * @param {Object} sessionData - Session data including duration and message count
 * @param {number} sessionData.duration - Session duration in milliseconds
 * @param {number} sessionData.messageCount - Total number of messages
 * @param {number} sessionData.interactionCount - Total number of interactions
 * @param {Array} sessionData.interactions - Array of interaction objects
 * @returns {Promise<Object>} - API response
 */
export const trackSessionMetrics = async (sessionData) => {
  try {
    const sessionId = localStorage.getItem("sessionId") || generateSessionId();
    const metrics = {
      ...sessionData,
      sessionId,
      userId: localStorage.getItem("customerId") || null,
      timestamp: new Date().toISOString()
    };

    console.log('Tracking session metrics:', metrics);
    const response = await api.post("/api/analytics/session", metrics);
    return response.data;
  } catch (error) {
    // Log the error but don't throw it to prevent blocking other functionality
    console.warn('Error tracking session metrics:', error.message);
    // Don't rethrow the error
  }
};

/**
 * Generate a unique session ID
 * @returns {string} - Unique session identifier
 */
const generateSessionId = () => {
  const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
  localStorage.setItem("sessionId", sessionId);
  return sessionId;
};

export default api;