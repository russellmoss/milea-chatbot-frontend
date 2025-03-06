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
    
    // Remove mock data fallback to ensure we're using real data
    console.error("No wine data available");
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
    // ✅ Use the RAG-enhanced endpoint instead of /chat
    const response = await api.post("/rag-chat", { message });
    
    // ✅ Extract the response field from the RAG response
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
 * Fetch tasting event information
 * @returns {Promise<Array>} - List of available tastings
 */
export const fetchTastingEvents = async () => {
  try {
    const response = await api.get("/api/commerce7/events");
    return response.data.events || [];
  } catch (error) {
    console.error("Error fetching tasting events:", error);
    throw new Error("Failed to fetch tasting events");
  }
};

/**
 * Book a tasting reservation
 * @param {Object} reservationData - Reservation details
 * @returns {Promise<Object>} - Booking confirmation
 */
export const bookTastingReservation = async (reservationData) => {
  try {
    const response = await api.post("/api/commerce7/reservations", reservationData);
    return response.data;
  } catch (error) {
    console.error("Error booking reservation:", error);
    throw new Error("Failed to book reservation");
  }
};

export default api;