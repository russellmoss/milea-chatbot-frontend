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
    const response = await api.get("/api/commerce7/clubs");
    return response.data;
  } catch (error) {
    console.error("Error fetching wine club info:", error);
    throw new Error("Failed to fetch wine club information");
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

// src/components/chat/services/apiService.js

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