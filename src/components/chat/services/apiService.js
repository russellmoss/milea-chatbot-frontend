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
    const token = localStorage.getItem("commerce7Token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    
    // Add addresses
    addresses: [
      {
        type: 'shipping',
        address: formData.shippingAddress.address,
        address2: formData.shippingAddress.address2 || '',
        city: formData.shippingAddress.city,
        stateCode: formData.shippingAddress.stateCode,
        zipCode: formData.shippingAddress.zipCode,
        countryCode: formData.shippingAddress.countryCode,
        isDefault: true
      }
    ],
    
    // Club membership details
    clubMembership: {
      clubId: formData.clubId,
      clubName: formData.clubName,
      deliveryMethod: formData.deliveryMethod
    }
  };
  
  // Add billing address if different from shipping
  if (!formData.billingAddressSame) {
    customerData.addresses.push({
      type: 'billing',
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

export default api;