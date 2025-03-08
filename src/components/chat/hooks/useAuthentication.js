// src/components/chat/hooks/useAuthentication.js
import { useState, useEffect } from 'react';
import api from '../services/apiService';

export const useAuthentication = () => {
  const [authToken, setAuthToken] = useState(localStorage.getItem("commerce7Token"));
  const [customerData, setCustomerData] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loyaltyError, setLoyaltyError] = useState(null);

  // Fetch customer data with token
  const fetchCustomerData = async (token) => {
    try {
      const response = await api.get("/api/customer/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data) {
        setCustomerData(response.data);
        setLoyaltyPoints(response.data.loyaltyPoints || 0);
        return response.data;
      } else {
        // Token might be expired
        logout();
        return null;
      }
    } catch (error) {
      console.error("Error fetching customer data:", error);
      if (error.response?.status === 401) {
        logout(); // Unauthorized - clear token
      }
      setLoyaltyError("Could not fetch customer data");
      return null;
    }
  };
  
  // Handle login submission
  const login = async (onLoginSuccess, onLoginFailure) => {
    if (!email || !password) return;
    
    setLoginLoading(true);
    setLoyaltyError(null);
    
    try {
      const response = await api.post("/api/auth/login", {
        email, 
        password
      });
      
      if (response.data && response.data.success && response.data.user) {
        // Save token and customer ID
        localStorage.setItem("commerce7Token", response.data.token);
        localStorage.setItem("customerId", response.data.customerId);
        
        // Make sure user data exists before trying to use it
        if (response.data.user.firstName && response.data.user.lastName) {
          localStorage.setItem("userName", `${response.data.user.firstName} ${response.data.user.lastName}`);
        } else {
          localStorage.setItem("userName", "Milea Customer");
        }
        
        localStorage.setItem("userEmail", response.data.user.email || email);
        
        setAuthToken(response.data.token);
        
        // Set loyalty points directly from the login response
        setLoyaltyPoints(response.data.user.loyaltyPoints || 0);
        
        // Hide login form
        setShowLoginForm(false);
        
        // Clear login form
        setEmail("");
        setPassword("");
        
        // Set customer data from login response
        const customerInfo = response.data.user;
        setCustomerData(customerInfo);
        
        if (onLoginSuccess) {
          onLoginSuccess(customerInfo);
        }
      } else {
        // Clear any stored authentication data on error
        localStorage.removeItem("commerce7Token");
        localStorage.removeItem("customerId");
        localStorage.removeItem("userName");
        localStorage.removeItem("userEmail");
        
        if (onLoginFailure) {
          onLoginFailure(response.data?.error || "Login failed");
        }
        setLoyaltyError("Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      
      let errorMessage = "An error occurred during login";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 404) {
        errorMessage = "Customer not found";
      }
      
      // Clear any stored authentication data on error
      localStorage.removeItem("commerce7Token");
      localStorage.removeItem("customerId");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
      
      setLoyaltyError(errorMessage);
      
      if (onLoginFailure) {
        onLoginFailure(errorMessage);
      }
    } finally {
      setLoginLoading(false);
    }
  };
  
  // Fetch loyalty points separately
  const fetchLoyaltyPoints = async () => {
    if (!authToken) return;
    
    try {
      const response = await api.get("/api/customer/loyalty-points", {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      
      setLoyaltyPoints(response.data.points || 0);
      setLoyaltyError(null);
    } catch (error) {
      console.error("Error fetching loyalty points:", error);
      setLoyaltyError("Could not fetch loyalty points");
    }
  };
  
  // Handle logout
  const logout = () => {
    localStorage.removeItem("commerce7Token");
    localStorage.removeItem("customerId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    setAuthToken(null);
    setCustomerData(null);
    setLoyaltyPoints(0);
  };
  
  // Auto-logout when component unmounts or window unloads
  const setupAutoLogout = () => {
    // Add a beforeunload event listener for page close
    window.addEventListener('beforeunload', logout);
    
    // Return cleanup function for useEffect
    return () => {
      window.removeEventListener('beforeunload', logout);
      logout(); // Also logout on component unmount
    };
  };

  // Check token on initialization
  useEffect(() => {
    if (authToken) {
      fetchCustomerData(authToken);
    }
  }, [authToken]);

  return {
    authToken,
    customerData,
    email,
    setEmail,
    password,
    setPassword,
    loginLoading,
    showLoginForm,
    setShowLoginForm,
    login,
    logout,
    fetchCustomerData,
    setupAutoLogout,
    loyaltyPoints,
    fetchLoyaltyPoints,
    loyaltyError
  };
};