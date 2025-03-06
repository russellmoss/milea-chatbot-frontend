import { useState } from 'react';

export const useAuthentication = () => {
  const [authToken, setAuthToken] = useState(localStorage.getItem("commerce7Token"));
  const [customerData, setCustomerData] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);

  // Fetch customer data with token
  const fetchCustomerData = async (token) => {
    try {
      const response = await fetch("http://localhost:8080/api/customer/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCustomerData(data);
        return data;
      } else {
        // Token might be expired
        logout();
        return null;
      }
    } catch (error) {
      console.error("Error fetching customer data:", error);
      return null;
    }
  };
  
  // Handle login submission
  const login = async (onLoginSuccess, onLoginFailure) => {
    if (!email || !password) return;
    
    setLoginLoading(true);
    
    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Save token and customer ID
        localStorage.setItem("commerce7Token", data.token);
        localStorage.setItem("customerId", data.customerId);
        
        setAuthToken(data.token);
        
        // Hide login form
        setShowLoginForm(false);
        
        // Clear login form
        setEmail("");
        setPassword("");
        
        // Fetch customer data
        const customerInfo = await fetchCustomerData(data.token);
        
        if (onLoginSuccess) {
          onLoginSuccess(customerInfo);
        }
      } else {
        if (onLoginFailure) {
          onLoginFailure();
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      if (onLoginFailure) {
        onLoginFailure(error);
      }
    } finally {
      setLoginLoading(false);
    }
  };
  
  // Handle logout
  const logout = () => {
    localStorage.removeItem("commerce7Token");
    localStorage.removeItem("customerId");
    setAuthToken(null);
    setCustomerData(null);
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
    setupAutoLogout
  };
};