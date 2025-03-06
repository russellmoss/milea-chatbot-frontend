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
    
    // Instead of throwing an error, return mock data as fallback
    console.log("Returning mock wine data as fallback");
    return [
      {
        id: "mock-chardonnay",
        title: "Estate Chardonnay 2022",
        type: "wine",
        content: "A vibrant and crisp Chardonnay with notes of green apple, pear, and a subtle hint of oak. Our Estate Chardonnay is fermented in stainless steel and aged for 6 months in French oak barrels, creating a perfect balance between fruit and oak characteristics.",
        teaser: "Bright and balanced with apple and pear notes",
        adminStatus: "Available",
        webStatus: "Available",
        variants: [{ price: 2899 }]
      },
      {
        id: "mock-cabernet-franc",
        title: "Reserve Cabernet Franc 2020",
        type: "wine",
        content: "Our flagship Cabernet Franc showcases the best of Hudson Valley viticulture. Rich dark fruit flavors with subtle herbal notes and smooth tannins make this wine perfect for special occasions. Aged for 18 months in French oak barrels.",
        teaser: "Bold and complex with blackberry and spice notes",
        adminStatus: "Available",
        webStatus: "Available",
        variants: [{ price: 3599 }]
      },
      {
        id: "mock-rose",
        title: "Rosé of Pinot Noir 2022",
        type: "wine",
        content: "This delightful rosé offers bright flavors of strawberry and watermelon with a crisp, refreshing finish. Perfect for warm weather enjoyment and light cuisine. Made from 100% Pinot Noir grapes with minimal skin contact.",
        teaser: "Bright and fruity with strawberry notes",
        adminStatus: "Available",
        webStatus: "Available",
        variants: [{ price: 2499 }]
      },
      {
        id: "mock-riesling",
        title: "Estate Riesling 2021",
        type: "wine",
        content: "Our Estate Riesling offers beautiful aromas of peach and citrus blossom. The palate showcases vibrant acidity balanced with a touch of residual sweetness, creating a versatile wine that pairs well with a wide range of cuisines.",
        teaser: "Aromatic and balanced with stone fruit notes",
        adminStatus: "Available",
        webStatus: "Available",
        variants: [{ price: 2699 }]
      },
      {
        id: "mock-pinot-noir",
        title: "Estate Pinot Noir 2020",
        type: "wine",
        content: "Our Estate Pinot Noir expresses the unique terroir of the Hudson Valley with notes of cherry, raspberry, and forest floor. Silky tannins and a medium body make this wine both elegant and versatile with food.",
        teaser: "Elegant and silky with red fruit notes",
        adminStatus: "Available",
        webStatus: "Available",
        variants: [{ price: 3299 }]
      },
      // Add Proceedo wines
      {
        id: "mock-proceedo-white",
        title: "Proceedo White 2023",
        type: "wine",
        content: "Proceedo White is our signature white blend, featuring bright citrus notes with hints of tropical fruit and a clean, crisp finish. Made from a carefully selected blend of Hudson Valley grapes, this versatile white wine pairs perfectly with seafood, salads, and light appetizers.",
        teaser: "Bright citrus with a crisp, refreshing finish",
        adminStatus: "Available",
        webStatus: "Available",
        variants: [{ price: 2799 }]
      },
      {
        id: "mock-proceedo-rose",
        title: "Proceedo Rosé 2023",
        type: "wine",
        content: "Our Proceedo Rosé offers delicate aromas of red berries and floral notes. This dry rosé features vibrant acidity and a clean, refreshing finish. Perfect for warm weather enjoyment, it pairs beautifully with a wide range of foods from salads to grilled chicken and light pasta dishes.",
        teaser: "Delicate berry notes with refreshing acidity",
        adminStatus: "Available",
        webStatus: "Available",
        variants: [{ price: 2599 }]
      },
      {
        id: "mock-proceedo-white-period",
        title: "Proceedo White. 2022",
        type: "wine",
        content: "The 2022 vintage of our Proceedo White features lively notes of citrus, green apple, and white peach. With a medium body and refreshing acidity, this wine offers a crisp, clean finish that makes it perfect for sipping on its own or pairing with light cuisine.",
        teaser: "Lively citrus with clean minerality",
        adminStatus: "Available",
        webStatus: "Available",
        variants: [{ price: 2599 }]
      }
    ];
  }
};

/**
 * Process a chat request through the AI service
 * @param {string} message - User message
 * @returns {Promise<string>} - AI response message
 */
export const processChatRequest = async (message) => {
  try {
    const response = await api.post("/chat", { message });
    return response.data.response;
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