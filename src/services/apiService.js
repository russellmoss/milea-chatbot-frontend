import axios from 'axios';

class ApiService {
  constructor() {
    // Use REACT_APP_API_BASE_URL if available, otherwise fallback to REACT_APP_API_URL
    this.baseURL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:8080';
    this.isBackendAvailable = false;
    
    console.log('Initializing ApiService with base URL:', this.baseURL);
    
    // Create axios instance with default config
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      withCredentials: true // Required for CORS with credentials
    });

    // Add request interceptor for authentication and logging
    this.api.interceptors.request.use(
      (config) => {
        console.log('Making request to:', config.url);
        
        // Check if the endpoint is public (no auth required)
        const isPublicEndpoint = config.url.startsWith('/api/health') ||
                               config.url.startsWith('/api/analytics') ||
                               config.url.startsWith('/api/feedback');

        // For public endpoints, ensure no auth headers are present
        if (isPublicEndpoint) {
          delete config.headers.Authorization;
        } else {
          // For protected endpoints, add auth token if available
          const token = localStorage.getItem('commerce7Token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => {
        console.log('Response received:', response.data);
        return response;
      },
      (error) => {
        console.error('Response error:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
          config: error.config
        });

        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          throw new Error(error.response.data.message || 'Server error occurred');
        } else if (error.request) {
          // The request was made but no response was received
          throw new Error('No response from server. Please check your connection.');
        } else {
          // Something happened in setting up the request that triggered an Error
          throw new Error('Error setting up the request');
        }
      }
    );

    // Check backend availability on initialization
    this.checkBackendHealth();
  }

  async checkBackendHealth() {
    try {
      const response = await this.api.get('/api/health');
      this.isBackendAvailable = response.status === 200;
      console.log('Backend health check:', this.isBackendAvailable ? 'OK' : 'Failed');
    } catch (error) {
      this.isBackendAvailable = false;
      console.warn('Backend health check failed:', error.message);
    }
  }

  async trackSessionMetrics(metrics) {
    try {
      // Skip analytics if backend is not available
      if (!this.isBackendAvailable) {
        console.log('Backend unavailable, skipping session metrics');
        return;
      }

      console.log('Tracking session metrics:', metrics);
      await this.api.post('/api/analytics/session', metrics);
    } catch (error) {
      // Log the error but don't throw it to prevent blocking other functionality
      console.warn('Error tracking session metrics:', error.message);
      // Don't rethrow the error
    }
  }

  async submitFeedback(feedbackData) {
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

      console.log('Submitting feedback with data:', feedbackData);
      console.log('Using base URL:', this.baseURL);

      // Prepare the request data
      const requestData = {
        messageId: String(feedbackData.messageId),
        conversationId: String(feedbackData.conversationId),
        rating: rating,
        comment: feedbackData.comment ? String(feedbackData.comment).trim() : "",
        tags: Array.isArray(feedbackData.tags) ? feedbackData.tags : []
      };

      console.log('Prepared request data:', requestData);

      // Make the request
      const response = await this.api.post('/api/feedback', requestData);

      console.log('Feedback submission response:', response.data);

      if (response.data.success) {
        return response.data.feedback;
      } else {
        throw new Error(response.data.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      
      // Log detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        console.error('Response config:', error.response.config);
        console.error('Request data:', error.response.config?.data);
        
        // Check for specific error cases
        if (error.response.status === 404) {
          throw new Error('Feedback endpoint not found. Please check if the backend server is running.');
        } else if (error.response.status === 400) {
          throw new Error(error.response.data.message || 'Invalid feedback data');
        } else if (error.response.status === 500) {
          throw new Error('Server error occurred while submitting feedback');
        } else {
          throw new Error(error.response.data.message || 'Failed to submit feedback');
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Request was made but no response received:', error.request);
        throw new Error('No response from server. Please check if the backend server is running.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
        throw new Error('Error setting up the request');
      }
    }
  }

  // Add other API methods here as needed
}

export const apiService = new ApiService(); 