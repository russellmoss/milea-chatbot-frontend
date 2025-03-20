I'll create a comprehensive implementation markdown document for the frontend components of your User Feedback Collection system. This will integrate seamlessly with the backend implementation you already have, focusing on the four key areas you mentioned.

# User Feedback Collection Implementation - Frontend

## Overview

This document provides a detailed implementation guide for the frontend components of the Milea Estate Vineyard Chatbot's User Feedback Collection system. These components will integrate with the backend API endpoints to create a complete feedback collection, analysis, and management system.

## Table of Contents

1. [Component Architecture](#1-component-architecture)
2. [State Management Design](#2-state-management-design)
3. [API Integration](#3-api-integration)
4. [Feedback Submission UI](#4-feedback-submission-ui)
5. [Feedback Dashboard](#5-feedback-dashboard)
6. [Feedback Detail View](#6-feedback-detail-view)
7. [Feedback Analytics](#7-feedback-analytics)
8. [Utilities and Helpers](#8-utilities-and-helpers)
9. [Integration Steps](#9-integration-steps)
10. [Testing and Validation](#10-testing-and-validation)

## 1. Component Architecture

The frontend components will follow this structure:

```
/src
  /dashboard                            # Dashboard components
    /components
      /feedback                         # Feedback-specific components
        FeedbackList.jsx                # List of feedback items
        FeedbackDetail.jsx              # Detailed view of a single feedback
        FeedbackStats.jsx               # Feedback statistics and charts
        FeedbackFilters.jsx             # Filtering controls
        FeedbackActions.jsx             # Action buttons for resolving, etc.
        FeedbackRatingDistribution.jsx  # Rating distribution chart
        FeedbackTimelineChart.jsx       # Timeline of feedback over time
        FeedbackTagCloud.jsx            # Visual display of feedback tags
    /context
      FeedbackContext.jsx               # State management for feedback
  /components
    /chat
      /components
        MessageFeedback.jsx             # Feedback UI in chat interface
```

## 2. State Management Design

We'll use React Context and `useReducer` for state management, which aligns with your current architecture.

### FeedbackContext.jsx

```jsx
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import api from '../../components/chat/services/apiService';

// Initial state
const initialState = {
  feedbackItems: [],
  selectedFeedback: null,
  stats: null,
  filters: {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    endDate: new Date(),
    minRating: 1,
    maxRating: 5,
    resolved: null, // null = show all, true/false = filter by resolved status
    tags: [],
    searchTerm: '',
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  },
  sortBy: 'timestamp',
  sortOrder: 'desc',
  loading: false,
  error: null
};

// Action types
const SET_FEEDBACK_ITEMS = 'SET_FEEDBACK_ITEMS';
const SET_SELECTED_FEEDBACK = 'SET_SELECTED_FEEDBACK';
const SET_STATS = 'SET_STATS';
const SET_FILTERS = 'SET_FILTERS';
const SET_PAGINATION = 'SET_PAGINATION';
const SET_SORT = 'SET_SORT';
const SET_LOADING = 'SET_LOADING';
const SET_ERROR = 'SET_ERROR';
const RESOLVE_FEEDBACK = 'RESOLVE_FEEDBACK';
const ADD_FEEDBACK_NOTE = 'ADD_FEEDBACK_NOTE';

// Reducer
function feedbackReducer(state, action) {
  switch (action.type) {
    case SET_FEEDBACK_ITEMS:
      return {
        ...state,
        feedbackItems: action.payload
      };
    case SET_SELECTED_FEEDBACK:
      return {
        ...state,
        selectedFeedback: action.payload
      };
    case SET_STATS:
      return {
        ...state,
        stats: action.payload
      };
    case SET_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        },
        pagination: {
          ...state.pagination,
          page: 1 // Reset to first page when filters change
        }
      };
    case SET_PAGINATION:
      return {
        ...state,
        pagination: {
          ...state.pagination,
          ...action.payload
        }
      };
    case SET_SORT:
      return {
        ...state,
        sortBy: action.payload.sortBy,
        sortOrder: action.payload.sortOrder
      };
    case SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    case SET_ERROR:
      return {
        ...state,
        error: action.payload
      };
    case RESOLVE_FEEDBACK:
      return {
        ...state,
        feedbackItems: state.feedbackItems.map(item => 
          item._id === action.payload.id
            ? { ...item, resolved: true, resolution: action.payload.resolution }
            : item
        ),
        selectedFeedback: state.selectedFeedback?._id === action.payload.id
          ? { ...state.selectedFeedback, resolved: true, resolution: action.payload.resolution }
          : state.selectedFeedback
      };
    case ADD_FEEDBACK_NOTE:
      return {
        ...state,
        feedbackItems: state.feedbackItems.map(item => 
          item._id === action.payload.id
            ? { 
                ...item, 
                notes: [...(item.notes || []), action.payload.note] 
              }
            : item
        ),
        selectedFeedback: state.selectedFeedback?._id === action.payload.id
          ? { 
              ...state.selectedFeedback, 
              notes: [...(state.selectedFeedback.notes || []), action.payload.note] 
            }
          : state.selectedFeedback
      };
    default:
      return state;
  }
}

// Create context
const FeedbackContext = createContext();

// Provider component
export const FeedbackProvider = ({ children }) => {
  const [state, dispatch] = useReducer(feedbackReducer, initialState);

  // Fetch feedback items
  const fetchFeedback = useCallback(async () => {
    const { filters, pagination, sortBy, sortOrder } = state;
    
    dispatch({ type: SET_LOADING, payload: true });
    dispatch({ type: SET_ERROR, payload: null });
    
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
        minRating: filters.minRating,
        maxRating: filters.maxRating,
        resolved: filters.resolved !== null ? filters.resolved : undefined,
        tags: filters.tags.length > 0 ? filters.tags.join(',') : undefined,
        searchTerm: filters.searchTerm || undefined
      };
      
      const response = await api.get('/api/dashboard/feedback', { params });
      
      dispatch({ type: SET_FEEDBACK_ITEMS, payload: response.data.feedback });
      dispatch({
        type: SET_PAGINATION,
        payload: {
          page: response.data.pagination.page,
          limit: response.data.pagination.limit,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }
      });
    } catch (error) {
      console.error('Error fetching feedback:', error);
      dispatch({
        type: SET_ERROR,
        payload: error.response?.data?.message || 'Error fetching feedback'
      });
    } finally {
      dispatch({ type: SET_LOADING, payload: false });
    }
  }, [state.filters, state.pagination.page, state.pagination.limit, state.sortBy, state.sortOrder]);

  // Fetch feedback statistics
  const fetchStats = useCallback(async () => {
    const { filters } = state;
    
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      const params = {
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString()
      };
      
      const response = await api.get('/api/dashboard/feedback/stats', { params });
      
      dispatch({ type: SET_STATS, payload: response.data.stats });
    } catch (error) {
      console.error('Error fetching stats:', error);
      dispatch({
        type: SET_ERROR,
        payload: error.response?.data?.message || 'Error fetching feedback statistics'
      });
    } finally {
      dispatch({ type: SET_LOADING, payload: false });
    }
  }, [state.filters.startDate, state.filters.endDate]);

  // Fetch a specific feedback item
  const fetchFeedbackById = useCallback(async (id) => {
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      const response = await api.get(`/api/dashboard/feedback/${id}`);
      
      dispatch({ type: SET_SELECTED_FEEDBACK, payload: response.data.feedback });
    } catch (error) {
      console.error('Error fetching feedback details:', error);
      dispatch({
        type: SET_ERROR,
        payload: error.response?.data?.message || 'Error fetching feedback details'
      });
    } finally {
      dispatch({ type: SET_LOADING, payload: false });
    }
  }, []);

  // Submit feedback (for the chat interface)
  const submitFeedback = useCallback(async (feedbackData) => {
    try {
      const response = await api.post('/api/feedback', feedbackData);
      return response.data;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }, []);

  // Resolve feedback
  const resolveFeedback = useCallback(async (id, resolution) => {
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      const response = await api.patch(`/api/dashboard/feedback/${id}/resolve`, resolution);
      
      dispatch({
        type: RESOLVE_FEEDBACK,
        payload: {
          id,
          resolution: response.data.feedback.resolution
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error resolving feedback:', error);
      dispatch({
        type: SET_ERROR,
        payload: error.response?.data?.message || 'Error resolving feedback'
      });
      throw error;
    } finally {
      dispatch({ type: SET_LOADING, payload: false });
    }
  }, []);

  // Add note to feedback
  const addFeedbackNote = useCallback(async (id, note) => {
    dispatch({ type: SET_LOADING, payload: true });
    
    try {
      const response = await api.post(`/api/dashboard/feedback/${id}/notes`, note);
      
      dispatch({
        type: ADD_FEEDBACK_NOTE,
        payload: {
          id,
          note: {
            note: note.note,
            author: note.author,
            timestamp: new Date().toISOString()
          }
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error adding note to feedback:', error);
      dispatch({
        type: SET_ERROR,
        payload: error.response?.data?.message || 'Error adding note to feedback'
      });
      throw error;
    } finally {
      dispatch({ type: SET_LOADING, payload: false });
    }
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    dispatch({ type: SET_FILTERS, payload: newFilters });
  }, []);

  // Update pagination
  const updatePagination = useCallback((newPagination) => {
    dispatch({ type: SET_PAGINATION, payload: newPagination });
  }, []);

  // Update sorting
  const updateSort = useCallback((sortBy, sortOrder) => {
    dispatch({
      type: SET_SORT,
      payload: { sortBy, sortOrder }
    });
  }, []);

  // Context value
  const value = {
    ...state,
    fetchFeedback,
    fetchStats,
    fetchFeedbackById,
    submitFeedback,
    resolveFeedback,
    addFeedbackNote,
    updateFilters,
    updatePagination,
    updateSort
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  );
};

// Custom hook to use the feedback context
export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  
  return context;
};
```

## 3. API Integration

### Enhanced apiService.js

Add these methods to your existing `apiService.js`:

```javascript
// src/components/chat/services/apiService.js

// Add these methods to your existing apiService.js file

/**
 * Submit feedback for a chatbot message
 * @param {Object} feedbackData - Feedback data
 * @returns {Promise<Object>} - API response
 */
export const submitFeedback = async (feedbackData) => {
  try {
    const response = await api.post('/api/feedback', feedbackData);
    return response.data;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
};

/**
 * Get feedback by message ID
 * @param {string} messageId - Message ID
 * @returns {Promise<Object>} - API response
 */
export const getFeedbackByMessageId = async (messageId) => {
  try {
    const response = await api.get(`/api/feedback/message/${messageId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting feedback by message ID:', error);
    throw error;
  }
};

/**
 * Get all feedback with pagination and filtering
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - API response
 */
export const getAllFeedback = async (params) => {
  try {
    const response = await api.get('/api/dashboard/feedback', { params });
    return response.data;
  } catch (error) {
    console.error('Error getting all feedback:', error);
    throw error;
  }
};

/**
 * Get feedback statistics
 * @param {Object} params - Query parameters (startDate, endDate)
 * @returns {Promise<Object>} - API response
 */
export const getFeedbackStats = async (params) => {
  try {
    const response = await api.get('/api/dashboard/feedback/stats', { params });
    return response.data;
  } catch (error) {
    console.error('Error getting feedback statistics:', error);
    throw error;
  }
};

/**
 * Resolve feedback
 * @param {string} id - Feedback ID
 * @param {Object} resolutionData - Resolution data
 * @returns {Promise<Object>} - API response
 */
export const resolveFeedback = async (id, resolutionData) => {
  try {
    const response = await api.patch(`/api/dashboard/feedback/${id}/resolve`, resolutionData);
    return response.data;
  } catch (error) {
    console.error('Error resolving feedback:', error);
    throw error;
  }
};

/**
 * Add note to feedback
 * @param {string} id - Feedback ID
 * @param {Object} noteData - Note data
 * @returns {Promise<Object>} - API response
 */
export const addFeedbackNote = async (id, noteData) => {
  try {
    const response = await api.post(`/api/dashboard/feedback/${id}/notes`, noteData);
    return response.data;
  } catch (error) {
    console.error('Error adding note to feedback:', error);
    throw error;
  }
};
```

## 4. Feedback Submission UI

### MessageFeedback.jsx

This component will be displayed after each bot message in the chat interface to collect user feedback.

```jsx
import React, { useState, useEffect } from 'react';
import { submitFeedback, getFeedbackByMessageId } from '../services/apiService';

/**
 * Feedback component for chat messages
 * @param {Object} props - Component props
 * @param {string} props.messageId - ID of the message to provide feedback for
 * @param {string} props.conversationId - ID of the conversation
 */
const MessageFeedback = ({ messageId, conversationId }) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [existingFeedback, setExistingFeedback] = useState(null);
  
  // Check if feedback already exists for this message
  useEffect(() => {
    if (!messageId) return;
    
    const checkExistingFeedback = async () => {
      try {
        const response = await getFeedbackByMessageId(messageId);
        if (response.success && response.feedback) {
          setExistingFeedback(response.feedback);
          setRating(response.feedback.rating);
          setComment(response.feedback.comment || '');
          setSubmitted(true);
        }
      } catch (error) {
        // No feedback exists yet, which is fine
        console.log('No existing feedback found for this message');
      }
    };
    
    checkExistingFeedback();
  }, [messageId]);
  
  // Handle rating selection
  const handleRatingClick = (selectedRating) => {
    setRating(selectedRating);
    
    // If a rating is selected and feedback form isn't shown, show it
    if (!showFeedback) {
      setShowFeedback(true);
    }
  };
  
  // Handle feedback submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!rating) {
      setError('Please select a rating');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const feedbackData = {
        messageId,
        conversationId,
        rating,
        comment: comment.trim() || null
      };
      
      await submitFeedback(feedbackData);
      setSubmitted(true);
    } catch (error) {
      setError('Failed to submit feedback. Please try again.');
      console.error('Feedback submission error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // If feedback already submitted, show a thank you message
  if (submitted) {
    return (
      <div className="flex items-center text-sm text-gray-500 mt-2">
        <span className="mr-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={`text-lg ${i < rating ? 'text-amber-500' : 'text-gray-300'}`}
            >
              ★
            </span>
          ))}
        </span>
        <span>Thank you for your feedback!</span>
      </div>
    );
  }
  
  return (
    <div className="mt-2">
      {/* Feedback prompt */}
      <div 
        className="text-sm text-gray-500 cursor-pointer hover:text-gray-700"
        onClick={() => setShowFeedback(!showFeedback)}
      >
        {!showFeedback && (
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            Rate this response
          </span>
        )}
      </div>
      
      {/* Feedback form */}
      {showFeedback && (
        <div className="mt-2 bg-gray-50 p-3 rounded-md border border-gray-200">
          <div className="mb-2">
            <p className="text-sm text-gray-700 mb-1">How helpful was this response?</p>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  className={`text-2xl focus:outline-none ${
                    star <= rating ? 'text-amber-500' : 'text-gray-300'
                  }`}
                  aria-label={`Rate ${star} stars`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                rows="2"
                placeholder="What could be improved? (optional)"
              ></textarea>
            </div>
            
            {error && (
              <div className="text-red-500 text-xs mb-2">{error}</div>
            )}
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowFeedback(false)}
                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !rating}
                className={`px-3 py-1 text-sm bg-amber-600 text-white rounded ${
                  loading || !rating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-amber-700'
                }`}
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MessageFeedback;
```

### Modify MessageList.jsx

Update your existing `MessageList.jsx` to include the feedback component:

```jsx
import React from "react";
import MileaMilesReferral from "./MileaMilesReferral";
import MessageFeedback from "./MessageFeedback"; // Import the feedback component
import parseMarkdown from "../utils/markdownParser";

/**
 * Component to display the list of messages
 * @param {Object} props - Component props
 * @param {Array} props.messages - List of message objects
 * @param {boolean} props.loading - Whether a message is being loaded
 * @param {Function} props.onActionClick - Function to handle action button clicks
 */
const MessageList = ({ messages, loading, onActionClick }) => {
  // Get or create conversation ID
  const conversationId = localStorage.getItem('conversationId') || `conv_${Date.now()}`;
  
  // Store conversation ID if not already stored
  if (!localStorage.getItem('conversationId')) {
    localStorage.setItem('conversationId', conversationId);
  }
  
  return (
    <div className="h-96 overflow-y-auto border-b pb-4 flex flex-col space-y-3">
      {messages.map((msg, index) => (
        <div 
          key={index} 
          className={`chat-bubble ${
            msg.role === "user" ? "user-message bg-[#715100] text-white text-right ml-12" : "bot-message bg-[#F9F4E9] text-[#5A3E00] mr-12"
          } p-3 rounded-lg`}
        >
          {msg.component === "MileaMilesReferral" ? (
            <MileaMilesReferral />
          ) : (
            <>
              <div className="markdown-content" dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />
              
              {/* Add feedback component for bot messages */}
              {msg.role === 'bot' && (
                <MessageFeedback 
                  messageId={msg.id || `msg_${Date.now()}_${index}`}
                  conversationId={conversationId}
                />
              )}
              
              {/* Render action button if present */}
              {msg.action && (
                <div className="mt-3">
                  <button 
                    onClick={() => {
                      if (msg.action.type === "external-link") {
                        // Open external link in a new tab
                        window.open(msg.action.url, "_blank", "noopener,noreferrer");
                      } else if (onActionClick) {
                        // Existing action click handler
                        onActionClick(msg.action);
                      }
                    }}
                    className="py-2 px-4 bg-[#5A3E00] text-white rounded-md hover:bg-[#483200] transition-colors"
                  >
                    {msg.action.text}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ))}
      {loading && (
        <div className="bot-message bg-[#F9F4E9] text-[#5A3E00] p-3 rounded-lg mr-12">
          <span className="animate-pulse">Thinking...</span>
        </div>
      )}
    </div>
  );
};

export default MessageList;
```

### Modify useMessages.js

Update your `useMessages.js` hook to generate unique IDs for messages:

```javascript
// Inside the sendMessage function in useMessages.js

// Generate unique ID for the message
const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

// Add message to the messages state with the ID
setMessages(prev => [...prev, { 
  role: "user", 
  content: input,
  id: messageId  // Add ID to the message object
}]);

// Later, when adding bot response
const botMessageId = `msg_bot_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

setMessages(prev => [...prev, { 
  role: "bot", 
  content: botResponse,
  id: botMessageId  // Add ID to the bot message
}]);
```

## 5. Feedback Dashboard

This is the main dashboard page for feedback management:

### FeedbackPage.jsx

```javascript

import React, { useEffect } from 'react';
import { FeedbackProvider } from '../context/FeedbackContext';
import FeedbackList from '../components/feedback/FeedbackList';
import FeedbackFilters from '../components/feedback/FeedbackFilters';
import FeedbackStats from '../components/feedback/FeedbackStats';

const FeedbackPage = () => {
  return (
    <FeedbackProvider>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-amber-900 mb-6">User Feedback</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Overview */}
          <div className="lg:col-span-3">
            <FeedbackStats />
          </div>
          
          {/* Filters Section */}
          <div className="lg:col-span-1">
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-amber-800 mb-4">Filters</h2>
              <FeedbackFilters />
            </div>
          </div>
          
          {/* Feedback List */}
          <div className="lg:col-span-2">
            <FeedbackList />
          </div>
        </div>
      </div>
    </FeedbackProvider>
  );
};

export default FeedbackPage;

### FeedbackList.jsx

```javascript 
import React, { useEffect } from 'react';
import { useFeedback } from '../../context/FeedbackContext';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

const FeedbackList = () => {
  const { 
    feedbackItems, 
    loading, 
    error, 
    pagination, 
    sortBy, 
    sortOrder, 
    fetchFeedback, 
    updatePagination,
    updateSort
  } = useFeedback();
  
  // Fetch feedback when component mounts or filters/pagination change
  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback, pagination.page, pagination.limit, sortBy, sortOrder]);
  
  // Handle pagination change
  const handlePageChange = (newPage) => {
    updatePagination({ page: newPage });
  };
  
  // Handle sort change
  const handleSortChange = (field) => {
    // If already sorting by this field, toggle order
    if (field === sortBy) {
      updateSort(field, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to descending for new sort field
      updateSort(field, 'desc');
    }
  };
  
  // Render feedback ratings as stars
  const renderRating = (rating) => {
    return (
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`text-lg ${i < rating ? 'text-amber-500' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };
  
  if (loading && feedbackItems.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
          <p className="font-medium">Error loading feedback</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }
  
  if (feedbackItems.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-center py-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No feedback found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No feedback matches your current filters. Try adjusting your search criteria.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortChange('rating')}
              >
                <div className="flex items-center">
                  Rating
                  {sortBy === 'rating' && (
                    <span className="ml-1">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Feedback
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortChange('timestamp')}
              >
                <div className="flex items-center">
                  Date
                  {sortBy === 'timestamp' && (
                    <span className="ml-1">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortChange('resolved')}
              >
                <div className="flex items-center">
                  Status
                  {sortBy === 'resolved' && (
                    <span className="ml-1">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {feedbackItems.map((feedback) => (
              <tr 
                key={feedback._id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => window.location.href = `/dashboard/feedback/${feedback._id}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  {renderRating(feedback.rating)}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {feedback.comment ? (
                      <p className="line-clamp-2">{feedback.comment}</p>
                    ) : (
                      <p className="text-gray-500 italic">No comment provided</p>
                    )}
                  </div>
                  {feedback.tags && feedback.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {feedback.tags.map((tag) => (
                        <span 
                          key={tag} 
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800"
                        >
                          {tag.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {feedback.metadata && feedback.metadata.timestamp && (
                    <time dateTime={feedback.metadata.timestamp}>
                      {formatDistanceToNow(new Date(feedback.metadata.timestamp), { addSuffix: true })}
                    </time>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span 
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      feedback.resolved
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {feedback.resolved ? 'Resolved' : 'Open'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-4">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-medium">{pagination.total}</span> results
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${
                  pagination.page === 1
                    ? 'cursor-not-allowed'
                    : 'hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                }`}
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                // Calculate which page numbers to show
                let pageNum;
                if (pagination.pages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.pages - 2) {
                  pageNum = pagination.pages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      pagination.page === pageNum
                        ? 'z-10 bg-amber-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${
                  pagination.page === pagination.pages
                    ? 'cursor-not-allowed'
                    : 'hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                }`}
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackList;


### FeedbackFilters.jsx

```jsx
import React, { useState } from 'react';
import { useFeedback } from '../../context/FeedbackContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const FeedbackFilters = () => {
  const { filters, updateFilters, fetchFeedback } = useFeedback();
  const [localFilters, setLocalFilters] = useState(filters);
  
  const handleFilterChange = (field, value) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  };
  
  const handleRatingChange = (min, max) => {
    setLocalFilters(prev => ({
      ...prev,
      minRating: min,
      maxRating: max
    }));
  };
  
  const handleTagChange = (tag) => {
    // Toggle tag selection
    setLocalFilters(prev => {
      const updatedTags = prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag];
      
      return {
        ...prev,
        tags: updatedTags
      };
    });
  };
  
  const applyFilters = () => {
    updateFilters(localFilters);
    fetchFeedback();
  };
  
  const resetFilters = () => {
    const defaultFilters = {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      minRating: 1,
      maxRating: 5,
      resolved: null,
      tags: [],
      searchTerm: ''
    };
    
    setLocalFilters(defaultFilters);
    updateFilters(defaultFilters);
    fetchFeedback();
  };
  
  // Common tags
  const commonTags = [
    'helpful', 'not_helpful', 'inaccurate', 'confusing', 'excellent', 'needs_improvement'
  ];
  
  return (
    <div className="space-y-6">
      {/* Date range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
        <div className="flex space-x-2">
          <div className="flex-1">
            <DatePicker
              selected={localFilters.startDate}
              onChange={date => handleFilterChange('startDate', date)}
              selectsStart
              startDate={localFilters.startDate}
              endDate={localFilters.endDate}
              maxDate={new Date()}
              className="w-full p-2 border border-gray-300 rounded"
              placeholderText="Start Date"
            />
          </div>
          <div className="flex-1">
            <DatePicker
              selected={localFilters.endDate}
              onChange={date => handleFilterChange('endDate', date)}
              selectsEnd
              startDate={localFilters.startDate}
              endDate={localFilters.endDate}
              minDate={localFilters.startDate}
              maxDate={new Date()}
              className="w-full p-2 border border-gray-300 rounded"
              placeholderText="End Date"
            />
          </div>
        </div>
      </div>
      
      {/* Rating range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleRatingChange(1, 5)}
            className={`px-3 py-1 rounded text-sm ${
              localFilters.minRating === 1 && localFilters.maxRating === 5
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleRatingChange(4, 5)}
            className={`px-3 py-1 rounded text-sm ${
              localFilters.minRating === 4 && localFilters.maxRating === 5
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Positive
          </button>
          <button
            onClick={() => handleRatingChange(3, 3)}
            className={`px-3 py-1 rounded text-sm ${
              localFilters.minRating === 3 && localFilters.maxRating === 3
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Neutral
          </button>
          <button
            onClick={() => handleRatingChange(1, 2)}
            className={`px-3 py-1 rounded text-sm ${
              localFilters.minRating === 1 && localFilters.maxRating === 2
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Negative
          </button>
        </div>
      </div>
      
      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleFilterChange('resolved', null)}
            className={`px-3 py-1 rounded text-sm ${
              localFilters.resolved === null
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleFilterChange('resolved', false)}
            className={`px-3 py-1 rounded text-sm ${
              localFilters.resolved === false
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Open
          </button>
          <button
            onClick={() => handleFilterChange('resolved', true)}
            className={`px-3 py-1 rounded text-sm ${
              localFilters.resolved === true
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Resolved
          </button>
        </div>
      </div>
      
      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
        <div className="flex flex-wrap gap-2">
          {commonTags.map(tag => (
            <button
              key={tag}
              onClick={() => handleTagChange(tag)}
              className={`px-3 py-1 rounded text-sm ${
                localFilters.tags.includes(tag)
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {tag.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
      
      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
        <input
          type="text"
          value={localFilters.searchTerm}
          onChange={e => handleFilterChange('searchTerm', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="Search in comments..."
        />
      </div>
      
      {/* Action buttons */}
      <div className="flex space-x-2 pt-2">
        <button
          onClick={applyFilters}
          className="flex-1 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
        >
          Apply Filters
        </button>
        <button
          onClick={resetFilters}
          className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default FeedbackFilters;
```

## 6. Feedback Detail View

### FeedbackDetail.jsx

```jsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFeedback } from '../../context/FeedbackContext';
import { format } from 'date-fns';

const FeedbackDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    selectedFeedback, 
    loading, 
    error, 
    fetchFeedbackById, 
    resolveFeedback,
    addFeedbackNote
  } = useFeedback();
  
  const [actionTaken, setActionTaken] = useState('');
  const [note, setNote] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Fetch feedback details
  useEffect(() => {
    fetchFeedbackById(id);
  }, [fetchFeedbackById, id]);
  
  // Handle resolve submission
  const handleResolve = async (e) => {
    e.preventDefault();
    
    if (!actionTaken.trim()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      await resolveFeedback(id, {
        actionTaken,
        resolvedBy: 'admin' // This should be the current user's name or ID
      });
      
      setShowResolveForm(false);
      setActionTaken('');
    } catch (error) {
      console.error('Error resolving feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle note submission
  const handleAddNote = async (e) => {
    e.preventDefault();
    
    if (!note.trim()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      await addFeedbackNote(id, {
        note,
        author: 'admin' // This should be the current user's name or ID
      });
      
      setShowNoteForm(false);
      setNote('');
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Render stars for rating
  const renderRating = (rating) => {
    return (
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`text-2xl ${i < rating ? 'text-amber-500' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };
  
  if (loading && !selectedFeedback) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
          <p className="font-medium">Error loading feedback</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => navigate('/dashboard/feedback')}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Back to Feedback List
          </button>
        </div>
      </div>
    );
  }
  
  if (!selectedFeedback) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-center py-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Feedback not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The feedback you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/dashboard/feedback')}
            className="mt-3 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
          >
            Back to Feedback List
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard/feedback')}
          className="flex items-center text-amber-600 hover:text-amber-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Feedback List
        </button>
      </div>
      
      {/* Header with rating and status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Feedback Details</h1>
          <div className="flex items-center">
            {renderRating(selectedFeedback.rating)}
            <span 
              className={`ml-4 px-2 py-1 text-xs font-semibold rounded-full ${
                selectedFeedback.resolved
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {selectedFeedback.resolved ? 'Resolved' : 'Open'}
            </span>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            onClick={() => setShowNoteForm(true)}
            className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Add Note
          </button>
          {!selectedFeedback.resolved && (
            <button
              onClick={() => setShowResolveForm(true)}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Resolve
            </button>
          )}
        </div>
      </div>
      
      {/* Feedback content */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Feedback</h2>
          {selectedFeedback.comment ? (
            <p className="text-gray-700 whitespace-pre-line">{selectedFeedback.comment}</p>
          ) : (
            <p className="text-gray-500 italic">No comment provided</p>
          )}
        </div>
        
        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Details</h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Date</dt>
                <dd className="text-gray-900">
                  {selectedFeedback.metadata && selectedFeedback.metadata.timestamp && (
                    format(new Date(selectedFeedback.metadata.timestamp), 'PPpp')
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Message ID</dt>
                <dd className="text-gray-900 font-mono text-xs">{selectedFeedback.messageId}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Conversation ID</dt>
                <dd className="text-gray-900 font-mono text-xs">{selectedFeedback.conversationId}</dd>
              </div>
              {selectedFeedback.metadata && selectedFeedback.metadata.userAgent && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">User Agent</dt>
                  <dd className="text-gray-900 text-xs truncate max-w-[200px]">{selectedFeedback.metadata.userAgent}</dd>
                </div>
              )}
            </dl>
          </div>
          
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Context</h3>
            {selectedFeedback.context ? (
              <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm">
                {selectedFeedback.context.queryType && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Query Type</dt>
                    <dd className="text-gray-900">{selectedFeedback.context.queryType}</dd>
                  </div>
                )}
                {selectedFeedback.context.topic && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Topic</dt>
                    <dd className="text-gray-900">{selectedFeedback.context.topic}</dd>
                  </div>
                )}
                {selectedFeedback.context.documentSources && selectedFeedback.context.documentSources.length > 0 && (
                  <div className="mt-2">
                    <dt className="text-gray-500 mb-1">Document Sources</dt>
                    <dd className="text-gray-900 text-xs">
                      <ul className="list-disc pl-4 space-y-1">
                        {selectedFeedback.context.documentSources.map((source, index) => (
                          <li key={index}>{source}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-gray-500 italic">No context available</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Tags */}
      {selectedFeedback.tags && selectedFeedback.tags.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {selectedFeedback.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full"
              >
                {tag.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Resolution details if resolved */}
      {selectedFeedback.resolved && selectedFeedback.resolution && (
        <div className="mb-8 bg-green-50 p-4 rounded-lg border border-green-200">
          <h2 className="text-lg font-semibold text-green-900 mb-2">Resolution</h2>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm">
            <div>
              <dt className="text-green-700 font-medium">Action Taken</dt>
              <dd className="text-green-900 mt-1">{selectedFeedback.resolution.actionTaken}</dd>
            </div>
            {selectedFeedback.resolution.resolvedBy && (
              <div className="mt-2">
                <dt className="text-green-700 font-medium">Resolved By</dt>
                <dd className="text-green-900">{selectedFeedback.resolution.resolvedBy}</dd>
              </div>
            )}
            {selectedFeedback.resolution.resolvedAt && (
              <div className="mt-2">
                <dt className="text-green-700 font-medium">Resolved At</dt>
                <dd className="text-green-900">
                  {format(new Date(selectedFeedback.resolution.resolvedAt), 'PPpp')}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
      
      {/* Notes */}
      {selectedFeedback.notes && selectedFeedback.notes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
          <div className="space-y-4">
            {selectedFeedback.notes.map((noteItem, index) => (
              <div key={index} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-blue-900 whitespace-pre-line">{noteItem.note}</p>
                <div className="mt-2 flex justify-between text-xs text-blue-700">
                  <span>{noteItem.author}</span>
                  {noteItem.timestamp && (
                    <span>{format(new Date(noteItem.timestamp), 'PPpp')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Resolve form */}
      {showResolveForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Resolve Feedback</h2>
            <form onSubmit={handleResolve}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action Taken
                </label>
                <textarea
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  rows="4"
                  placeholder="Describe the action taken to resolve this feedback..."
                  required
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowResolveForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Resolve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Add note form */}
      {showNoteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Note</h2>
            <form onSubmit={handleAddNote}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  rows="4"
                  placeholder="Add a note about this feedback..."
                  required
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNoteForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Add Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackDetail;

Let me create section 7 of the implementation document focusing on Feedback Analytics components:

### 7. Feedback Analytics

The Feedback Analytics section provides visualizations and statistics to help analyze user feedback patterns and trends. This will help identify areas for improvement in the chatbot and track the overall user satisfaction.

### FeedbackStats.jsx

``jsx
import React, { useEffect } from 'react';
import { useFeedback } from '../../context/FeedbackContext';
import FeedbackRatingDistribution from './FeedbackRatingDistribution';
import FeedbackTimelineChart from './FeedbackTimelineChart';
import FeedbackTagCloud from './FeedbackTagCloud';

const FeedbackStats = () => {
  const { stats, fetchStats, filters, loading, error } = useFeedback();
  
  // Fetch stats when component mounts or filters change
  useEffect(() => {
    fetchStats();
  }, [fetchStats, filters.startDate, filters.endDate]);
  
  // Loading state
  if (loading && !stats) {
    return (
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
          <p className="font-medium">Error loading feedback statistics</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }
  
  // No data state
  if (!stats) {
    return (
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="text-center py-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No statistics available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your date range or collecting more feedback.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {/* Key metrics overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total feedback */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Feedback</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCount}</p>
            </div>
            <div className="bg-amber-100 p-3 rounded-full text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Average rating */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Average Rating</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-bold text-gray-900">{Number(stats.averageRating).toFixed(1)}</p>
                <p className="ml-1 text-sm text-gray-500">/ 5</p>
              </div>
            </div>
            <div className="bg-amber-100 p-3 rounded-full text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Positive feedback */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Positive Feedback</p>
              <p className="text-2xl font-bold text-gray-900">{stats.positivePercentage}%</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <span className="text-green-500">▲</span> Ratings 4-5
          </div>
        </div>
        
        {/* Open vs. Resolved */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Resolution Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.resolvedCount > 0 
                  ? ((stats.resolvedCount / (stats.resolvedCount + stats.unresolvedCount)) * 100).toFixed(0)
                  : 0}%
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {stats.resolvedCount} resolved, {stats.unresolvedCount} open
          </div>
        </div>
      </div>
      
      {/* Charts and detailed stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating distribution */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h2>
          <FeedbackRatingDistribution distribution={stats.ratingDistribution} />
        </div>
        
        {/* Feedback over time */}
        <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Feedback Over Time</h2>
          <FeedbackTimelineChart data={stats.dailyFeedback} />
        </div>
      </div>
      
      {/* Tag analysis */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Common Feedback Themes</h2>
        <FeedbackTagCloud tags={stats.tagDistribution} />
      </div>
    </div>
  );
};

export default FeedbackStats;
```

### FeedbackRatingDistribution.jsx

```jsx
import React from 'react';

const FeedbackRatingDistribution = ({ distribution }) => {
  // Calculate the maximum count for scaling
  const maxCount = Math.max(...Object.values(distribution));
  
  // Calculate percentage for each rating
  const calculatePercentage = (count) => {
    const sum = Object.values(distribution).reduce((acc, val) => acc + val, 0);
    return sum > 0 ? Math.round((count / sum) * 100) : 0;
  };
  
  // Colors for different ratings
  const getRatingColor = (rating) => {
    switch (rating) {
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-lime-500';
      case 5: return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <div className="space-y-4">
      {[5, 4, 3, 2, 1].map((rating) => (
        <div key={rating} className="flex items-center">
          <div className="w-8 text-sm font-medium text-gray-900">{rating}</div>
          <div className="flex-1 h-5 mx-2 bg-gray-100 rounded overflow-hidden">
            <div 
              className={`h-full ${getRatingColor(rating)}`} 
              style={{ 
                width: maxCount > 0 ? `${(distribution[rating] / maxCount) * 100}%` : '0%' 
              }}
            ></div>
          </div>
          <div className="w-12 text-right text-sm text-gray-500">
            {calculatePercentage(distribution[rating])}%
          </div>
          <div className="w-12 text-right text-sm text-gray-500">
            ({distribution[rating]})
          </div>
        </div>
      ))}
      
      {/* Rating legend */}
      <div className="pt-4 border-t mt-4">
        <div className="flex justify-between text-xs text-gray-500">
          <div>1 = Poor</div>
          <div>3 = Average</div>
          <div>5 = Excellent</div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackRatingDistribution;
```

### FeedbackTimelineChart.jsx

```jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, BarChart } from 'recharts';

const FeedbackTimelineChart = ({ data }) => {
  // Format the data for the chart
  const formattedData = data.map(item => ({
    ...item,
    // Format rating for display
    avgRating: Number(item.averageRating).toFixed(1)
  }));
  
  // Custom tooltip to display both count and average rating
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-amber-600">
            <span className="font-medium">Count:</span> {payload[0].value}
          </p>
          <p className="text-blue-600">
            <span className="font-medium">Avg Rating:</span> {payload[1].value}
          </p>
        </div>
      );
    }
    return null;
  };
  
  // If no data, show empty state
  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-50 rounded">
        <p className="text-gray-500 text-sm">No timeline data available</p>
      </div>
    );
  }
  
  // Determine if we should use a bar chart (few data points) or line chart (many data points)
  const useBarChart = data.length <= 7;
  
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        {useBarChart ? (
          <BarChart
            data={formattedData}
            margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              angle={-45} 
              textAnchor="end" 
              height={60}
              tick={{ fontSize: 12 }}
            />
            <YAxis yAxisId="left" orientation="left" stroke="#A16207" />
            <YAxis yAxisId="right" orientation="right" stroke="#2563EB" domain={[0, 5]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="count" name="Feedback Count" fill="#A16207" />
            <Bar yAxisId="right" dataKey="avgRating" name="Avg Rating" fill="#2563EB" />
          </BarChart>
        ) : (
          <LineChart
            data={formattedData}
            margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              angle={-45} 
              textAnchor="end" 
              height={60}
              tick={{ fontSize: 12 }}
              minTickGap={15}
            />
            <YAxis yAxisId="left" orientation="left" stroke="#A16207" />
            <YAxis yAxisId="right" orientation="right" stroke="#2563EB" domain={[0, 5]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              yAxisId="left" 
              type="monotone" 
              dataKey="count" 
              name="Feedback Count" 
              stroke="#A16207" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="avgRating" 
              name="Avg Rating" 
              stroke="#2563EB" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default FeedbackTimelineChart;
```

### FeedbackTagCloud.jsx

```jsx
import React from 'react';

const FeedbackTagCloud = ({ tags }) => {
  // If no tags, display empty state
  if (!tags || tags.length === 0) {
    return (
      <div className="flex justify-center items-center h-48 bg-gray-50 rounded">
        <p className="text-gray-500 text-sm">No tag data available</p>
      </div>
    );
  }
  
  // Sort tags by count (descending)
  const sortedTags = [...tags].sort((a, b) => b.count - a.count);
  
  // Find the highest count for scaling
  const maxCount = sortedTags[0]?.count || 1;
  
  // Calculate the font size and opacity based on the count
  const calculateStyle = (count) => {
    // Scale font size between 0.75rem and 2rem based on the count
    const fontSize = 0.75 + (count / maxCount) * 1.25;
    
    // Scale opacity between 0.7 and 1 based on the count
    const opacity = 0.7 + (count / maxCount) * 0.3;
    
    return {
      fontSize: `${fontSize}rem`,
      opacity
    };
  };
  
  // Determine color based on tag name
  const getTagColor = (tag) => {
    // Map certain tags to specific colors
    if (tag.includes('helpful') || tag.includes('excellent')) return 'text-green-600';
    if (tag.includes('confusing') || tag.includes('inaccurate')) return 'text-red-600';
    if (tag.includes('improvement')) return 'text-amber-600';
    
    // Default color
    return 'text-blue-600';
  };
  
  return (
    <div className="p-4 flex flex-wrap justify-center gap-4 min-h-[12rem]">
      {sortedTags.map((tag, index) => (
        <div 
          key={index}
          className={`${getTagColor(tag._id)} rounded-full px-3 py-1 hover:bg-gray-100 cursor-default`}
          style={calculateStyle(tag.count)}
          title={`${tag._id}: ${tag.count} occurrences`}
        >
          {tag._id.replace('_', ' ')}
          <span className="ml-1 text-gray-500 text-xs align-super">
            {tag.count}
          </span>
        </div>
      ))}
    </div>
  );
};

export default FeedbackTagCloud;
```

### FeedbackSentimentAnalysis.jsx

This component provides insights into the sentiment of feedback over time:

```jsx
import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const FeedbackSentimentAnalysis = ({ data }) => {
  const [timeframe, setTimeframe] = useState('weekly'); // 'daily', 'weekly', 'monthly'
  
  // Process data based on selected timeframe
  const processData = () => {
    if (!data || data.length === 0) return [];
    
    // Group data by timeframe
    const groupedData = {};
    
    data.forEach(item => {
      const date = new Date(item.date);
      let key;
      
      if (timeframe === 'daily') {
        key = item.date; // Already formatted as YYYY-MM-DD
      } else if (timeframe === 'weekly') {
        // Get first day of the week (Sunday)
        const day = date.getUTCDay();
        const diff = date.getUTCDate() - day;
        const firstDay = new Date(date);
        firstDay.setUTCDate(diff);
        key = firstDay.toISOString().split('T')[0];
      } else if (timeframe === 'monthly') {
        key = `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}`;
      }
      
      if (!groupedData[key]) {
        groupedData[key] = {
          date: key,
          positive: 0,
          neutral: 0,
          negative: 0,
          total: 0
        };
      }
      
      // Count positive (4-5), neutral (3), and negative (1-2) ratings
      if (item.averageRating >= 4) {
        groupedData[key].positive += item.count;
      } else if (item.averageRating >= 3) {
        groupedData[key].neutral += item.count;
      } else {
        groupedData[key].negative += item.count;
      }
      
      groupedData[key].total += item.count;
    });
    
    // Convert to array and sort by date
    return Object.values(groupedData).sort((a, b) => a.date.localeCompare(b.date));
  };
  
  const chartData = processData();
  
  // Format the date label based on timeframe
  const formatDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    
    if (timeframe === 'monthly') {
      return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    } else if (timeframe === 'weekly') {
      return `Week of ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    }
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium text-gray-900">{formatDateLabel(label)}</p>
          <p className="text-green-600">
            <span className="font-medium">Positive:</span> {data.positive} ({Math.round((data.positive / data.total) * 100)}%)
          </p>
          <p className="text-yellow-600">
            <span className="font-medium">Neutral:</span> {data.neutral} ({Math.round((data.neutral / data.total) * 100)}%)
          </p>
          <p className="text-red-600">
            <span className="font-medium">Negative:</span> {data.negative} ({Math.round((data.negative / data.total) * 100)}%)
          </p>
          <p className="text-gray-600 border-t mt-1 pt-1">
            <span className="font-medium">Total:</span> {data.total}
          </p>
        </div>
      );
    }
    return null;
  };
  
  // If no data, show empty state
  if (!data || data.length === 0 || chartData.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Sentiment Analysis</h2>
          <div className="flex space-x-1">
            {['daily', 'weekly', 'monthly'].map((option) => (
              <button
                key={option}
                onClick={() => setTimeframe(option)}
                className={`px-3 py-1 text-xs rounded ${
                  timeframe === option
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-center items-center h-64 bg-gray-50 rounded">
          <p className="text-gray-500 text-sm">No sentiment data available</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Sentiment Analysis</h2>
        <div className="flex space-x-1">
          {['daily', 'weekly', 'monthly'].map((option) => (
            <button
              key={option}
              onClick={() => setTimeframe(option)}
              className={`px-3 py-1 text-xs rounded ${
                timeframe === option
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
            stackOffset="expand"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              angle={-45} 
              textAnchor="end" 
              height={60}
              tick={{ fontSize: 12 }}
              tickFormatter={formatDateLabel}
              minTickGap={15}
            />
            <YAxis 
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="positive" 
              name="Positive" 
              stackId="1"
              stroke="#10B981" 
              fill="#D1FAE5" 
            />
            <Area 
              type="monotone" 
              dataKey="neutral" 
              name="Neutral" 
              stackId="1"
              stroke="#F59E0B" 
              fill="#FEF3C7" 
            />
            <Area 
              type="monotone" 
              dataKey="negative" 
              name="Negative" 
              stackId="1"
              stroke="#EF4444" 
              fill="#FEE2E2" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center mt-4 text-xs text-gray-500">
        <div className="flex items-center mr-4">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
          <span>Positive (4-5)</span>
        </div>
        <div className="flex items-center mr-4">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
          <span>Neutral (3)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
          <span>Negative (1-2)</span>
        </div>
      </div>
    </div>
  );
};

export default FeedbackSentimentAnalysis;
```

### Enhanced FeedbackPage.jsx

Update the FeedbackPage.jsx to include the new sentiment analysis component:

```jsx
import React, { useEffect } from 'react';
import { FeedbackProvider } from '../context/FeedbackContext';
import FeedbackList from '../components/feedback/FeedbackList';
import FeedbackFilters from '../components/feedback/FeedbackFilters';
import FeedbackStats from '../components/feedback/FeedbackStats';
import FeedbackSentimentAnalysis from '../components/feedback/FeedbackSentimentAnalysis';

const FeedbackPage = () => {
  const { stats } = useFeedback();
  
  return (
    <FeedbackProvider>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-amber-900 mb-6">User Feedback</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Overview */}
          <div className="lg:col-span-3">
            <FeedbackStats />
          </div>
          
          {/* Sentiment Analysis */}
          <div className="lg:col-span-3 mt-6">
            <FeedbackSentimentAnalysis data={stats?.dailyFeedback || []} />
          </div>
          
          {/* Filters Section */}
          <div className="lg:col-span-1">
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-amber-800 mb-4">Filters</h2>
              <FeedbackFilters />
            </div>
          </div>
          
          {/* Feedback List */}
          <div className="lg:col-span-2">
            <FeedbackList />
          </div>
        </div>
      </div>
    </FeedbackProvider>

    Let me create section 7 of the implementation document focusing on Feedback Analytics components:

## 7. Feedback Analytics

The Feedback Analytics section provides visualizations and statistics to help analyze user feedback patterns and trends. This will help identify areas for improvement in the chatbot and track the overall user satisfaction.

### FeedbackStats.jsx

```jsx
import React, { useEffect } from 'react';
import { useFeedback } from '../../context/FeedbackContext';
import FeedbackRatingDistribution from './FeedbackRatingDistribution';
import FeedbackTimelineChart from './FeedbackTimelineChart';
import FeedbackTagCloud from './FeedbackTagCloud';

const FeedbackStats = () => {
  const { stats, fetchStats, filters, loading, error } = useFeedback();
  
  // Fetch stats when component mounts or filters change
  useEffect(() => {
    fetchStats();
  }, [fetchStats, filters.startDate, filters.endDate]);
  
  // Loading state
  if (loading && !stats) {
    return (
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
          <p className="font-medium">Error loading feedback statistics</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }
  
  // No data state
  if (!stats) {
    return (
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="text-center py-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No statistics available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your date range or collecting more feedback.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {/* Key metrics overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total feedback */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Feedback</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCount}</p>
            </div>
            <div className="bg-amber-100 p-3 rounded-full text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Average rating */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Average Rating</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-bold text-gray-900">{Number(stats.averageRating).toFixed(1)}</p>
                <p className="ml-1 text-sm text-gray-500">/ 5</p>
              </div>
            </div>
            <div className="bg-amber-100 p-3 rounded-full text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Positive feedback */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Positive Feedback</p>
              <p className="text-2xl font-bold text-gray-900">{stats.positivePercentage}%</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <span className="text-green-500">▲</span> Ratings 4-5
          </div>
        </div>
        
        {/* Open vs. Resolved */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Resolution Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.resolvedCount > 0 
                  ? ((stats.resolvedCount / (stats.resolvedCount + stats.unresolvedCount)) * 100).toFixed(0)
                  : 0}%
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {stats.resolvedCount} resolved, {stats.unresolvedCount} open
          </div>
        </div>
      </div>
      
      {/* Charts and detailed stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating distribution */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h2>
          <FeedbackRatingDistribution distribution={stats.ratingDistribution} />
        </div>
        
        {/* Feedback over time */}
        <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Feedback Over Time</h2>
          <FeedbackTimelineChart data={stats.dailyFeedback} />
        </div>
      </div>
      
      {/* Tag analysis */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Common Feedback Themes</h2>
        <FeedbackTagCloud tags={stats.tagDistribution} />
      </div>
    </div>
  );
};

export default FeedbackStats;
```

### FeedbackRatingDistribution.jsx

```jsx
import React from 'react';

const FeedbackRatingDistribution = ({ distribution }) => {
  // Calculate the maximum count for scaling
  const maxCount = Math.max(...Object.values(distribution));
  
  // Calculate percentage for each rating
  const calculatePercentage = (count) => {
    const sum = Object.values(distribution).reduce((acc, val) => acc + val, 0);
    return sum > 0 ? Math.round((count / sum) * 100) : 0;
  };
  
  // Colors for different ratings
  const getRatingColor = (rating) => {
    switch (rating) {
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-lime-500';
      case 5: return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <div className="space-y-4">
      {[5, 4, 3, 2, 1].map((rating) => (
        <div key={rating} className="flex items-center">
          <div className="w-8 text-sm font-medium text-gray-900">{rating}</div>
          <div className="flex-1 h-5 mx-2 bg-gray-100 rounded overflow-hidden">
            <div 
              className={`h-full ${getRatingColor(rating)}`} 
              style={{ 
                width: maxCount > 0 ? `${(distribution[rating] / maxCount) * 100}%` : '0%' 
              }}
            ></div>
          </div>
          <div className="w-12 text-right text-sm text-gray-500">
            {calculatePercentage(distribution[rating])}%
          </div>
          <div className="w-12 text-right text-sm text-gray-500">
            ({distribution[rating]})
          </div>
        </div>
      ))}
      
      {/* Rating legend */}
      <div className="pt-4 border-t mt-4">
        <div className="flex justify-between text-xs text-gray-500">
          <div>1 = Poor</div>
          <div>3 = Average</div>
          <div>5 = Excellent</div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackRatingDistribution;
```

### FeedbackTimelineChart.jsx

```jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, BarChart } from 'recharts';

const FeedbackTimelineChart = ({ data }) => {
  // Format the data for the chart
  const formattedData = data.map(item => ({
    ...item,
    // Format rating for display
    avgRating: Number(item.averageRating).toFixed(1)
  }));
  
  // Custom tooltip to display both count and average rating
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-amber-600">
            <span className="font-medium">Count:</span> {payload[0].value}
          </p>
          <p className="text-blue-600">
            <span className="font-medium">Avg Rating:</span> {payload[1].value}
          </p>
        </div>
      );
    }
    return null;
  };
  
  // If no data, show empty state
  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-50 rounded">
        <p className="text-gray-500 text-sm">No timeline data available</p>
      </div>
    );
  }
  
  // Determine if we should use a bar chart (few data points) or line chart (many data points)
  const useBarChart = data.length <= 7;
  
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        {useBarChart ? (
          <BarChart
            data={formattedData}
            margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              angle={-45} 
              textAnchor="end" 
              height={60}
              tick={{ fontSize: 12 }}
            />
            <YAxis yAxisId="left" orientation="left" stroke="#A16207" />
            <YAxis yAxisId="right" orientation="right" stroke="#2563EB" domain={[0, 5]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="count" name="Feedback Count" fill="#A16207" />
            <Bar yAxisId="right" dataKey="avgRating" name="Avg Rating" fill="#2563EB" />
          </BarChart>
        ) : (
          <LineChart
            data={formattedData}
            margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              angle={-45} 
              textAnchor="end" 
              height={60}
              tick={{ fontSize: 12 }}
              minTickGap={15}
            />
            <YAxis yAxisId="left" orientation="left" stroke="#A16207" />
            <YAxis yAxisId="right" orientation="right" stroke="#2563EB" domain={[0, 5]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              yAxisId="left" 
              type="monotone" 
              dataKey="count" 
              name="Feedback Count" 
              stroke="#A16207" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="avgRating" 
              name="Avg Rating" 
              stroke="#2563EB" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default FeedbackTimelineChart;
```

### FeedbackTagCloud.jsx

```jsx
import React from 'react';

const FeedbackTagCloud = ({ tags }) => {
  // If no tags, display empty state
  if (!tags || tags.length === 0) {
    return (
      <div className="flex justify-center items-center h-48 bg-gray-50 rounded">
        <p className="text-gray-500 text-sm">No tag data available</p>
      </div>
    );
  }
  
  // Sort tags by count (descending)
  const sortedTags = [...tags].sort((a, b) => b.count - a.count);
  
  // Find the highest count for scaling
  const maxCount = sortedTags[0]?.count || 1;
  
  // Calculate the font size and opacity based on the count
  const calculateStyle = (count) => {
    // Scale font size between 0.75rem and 2rem based on the count
    const fontSize = 0.75 + (count / maxCount) * 1.25;
    
    // Scale opacity between 0.7 and 1 based on the count
    const opacity = 0.7 + (count / maxCount) * 0.3;
    
    return {
      fontSize: `${fontSize}rem`,
      opacity
    };
  };
  
  // Determine color based on tag name
  const getTagColor = (tag) => {
    // Map certain tags to specific colors
    if (tag.includes('helpful') || tag.includes('excellent')) return 'text-green-600';
    if (tag.includes('confusing') || tag.includes('inaccurate')) return 'text-red-600';
    if (tag.includes('improvement')) return 'text-amber-600';
    
    // Default color
    return 'text-blue-600';
  };
  
  return (
    <div className="p-4 flex flex-wrap justify-center gap-4 min-h-[12rem]">
      {sortedTags.map((tag, index) => (
        <div 
          key={index}
          className={`${getTagColor(tag._id)} rounded-full px-3 py-1 hover:bg-gray-100 cursor-default`}
          style={calculateStyle(tag.count)}
          title={`${tag._id}: ${tag.count} occurrences`}
        >
          {tag._id.replace('_', ' ')}
          <span className="ml-1 text-gray-500 text-xs align-super">
            {tag.count}
          </span>
        </div>
      ))}
    </div>
  );
};

export default FeedbackTagCloud;
```

### FeedbackSentimentAnalysis.jsx

This component provides insights into the sentiment of feedback over time:

```jsx
import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const FeedbackSentimentAnalysis = ({ data }) => {
  const [timeframe, setTimeframe] = useState('weekly'); // 'daily', 'weekly', 'monthly'
  
  // Process data based on selected timeframe
  const processData = () => {
    if (!data || data.length === 0) return [];
    
    // Group data by timeframe
    const groupedData = {};
    
    data.forEach(item => {
      const date = new Date(item.date);
      let key;
      
      if (timeframe === 'daily') {
        key = item.date; // Already formatted as YYYY-MM-DD
      } else if (timeframe === 'weekly') {
        // Get first day of the week (Sunday)
        const day = date.getUTCDay();
        const diff = date.getUTCDate() - day;
        const firstDay = new Date(date);
        firstDay.setUTCDate(diff);
        key = firstDay.toISOString().split('T')[0];
      } else if (timeframe === 'monthly') {
        key = `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}`;
      }
      
      if (!groupedData[key]) {
        groupedData[key] = {
          date: key,
          positive: 0,
          neutral: 0,
          negative: 0,
          total: 0
        };
      }
      
      // Count positive (4-5), neutral (3), and negative (1-2) ratings
      if (item.averageRating >= 4) {
        groupedData[key].positive += item.count;
      } else if (item.averageRating >= 3) {
        groupedData[key].neutral += item.count;
      } else {
        groupedData[key].negative += item.count;
      }
      
      groupedData[key].total += item.count;
    });
    
    // Convert to array and sort by date
    return Object.values(groupedData).sort((a, b) => a.date.localeCompare(b.date));
  };
  
  const chartData = processData();
  
  // Format the date label based on timeframe
  const formatDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    
    if (timeframe === 'monthly') {
      return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    } else if (timeframe === 'weekly') {
      return `Week of ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    }
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium text-gray-900">{formatDateLabel(label)}</p>
          <p className="text-green-600">
            <span className="font-medium">Positive:</span> {data.positive} ({Math.round((data.positive / data.total) * 100)}%)
          </p>
          <p className="text-yellow-600">
            <span className="font-medium">Neutral:</span> {data.neutral} ({Math.round((data.neutral / data.total) * 100)}%)
          </p>
          <p className="text-red-600">
            <span className="font-medium">Negative:</span> {data.negative} ({Math.round((data.negative / data.total) * 100)}%)
          </p>
          <p className="text-gray-600 border-t mt-1 pt-1">
            <span className="font-medium">Total:</span> {data.total}
          </p>
        </div>
      );
    }
    return null;
  };
  
  // If no data, show empty state
  if (!data || data.length === 0 || chartData.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Sentiment Analysis</h2>
          <div className="flex space-x-1">
            {['daily', 'weekly', 'monthly'].map((option) => (
              <button
                key={option}
                onClick={() => setTimeframe(option)}
                className={`px-3 py-1 text-xs rounded ${
                  timeframe === option
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-center items-center h-64 bg-gray-50 rounded">
          <p className="text-gray-500 text-sm">No sentiment data available</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Sentiment Analysis</h2>
        <div className="flex space-x-1">
          {['daily', 'weekly', 'monthly'].map((option) => (
            <button
              key={option}
              onClick={() => setTimeframe(option)}
              className={`px-3 py-1 text-xs rounded ${
                timeframe === option
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
            stackOffset="expand"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              angle={-45} 
              textAnchor="end" 
              height={60}
              tick={{ fontSize: 12 }}
              tickFormatter={formatDateLabel}
              minTickGap={15}
            />
            <YAxis 
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="positive" 
              name="Positive" 
              stackId="1"
              stroke="#10B981" 
              fill="#D1FAE5" 
            />
            <Area 
              type="monotone" 
              dataKey="neutral" 
              name="Neutral" 
              stackId="1"
              stroke="#F59E0B" 
              fill="#FEF3C7" 
            />
            <Area 
              type="monotone" 
              dataKey="negative" 
              name="Negative" 
              stackId="1"
              stroke="#EF4444" 
              fill="#FEE2E2" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center mt-4 text-xs text-gray-500">
        <div className="flex items-center mr-4">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
          <span>Positive (4-5)</span>
        </div>
        <div className="flex items-center mr-4">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
          <span>Neutral (3)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
          <span>Negative (1-2)</span>
        </div>
      </div>
    </div>
  );
};

export default FeedbackSentimentAnalysis;
```

### Enhanced FeedbackPage.jsx

Update the FeedbackPage.jsx to include the new sentiment analysis component:

```jsx
import React, { useEffect } from 'react';
import { FeedbackProvider } from '../context/FeedbackContext';
import FeedbackList from '../components/feedback/FeedbackList';
import FeedbackFilters from '../components/feedback/FeedbackFilters';
import FeedbackStats from '../components/feedback/FeedbackStats';
import FeedbackSentimentAnalysis from '../components/feedback/FeedbackSentimentAnalysis';

const FeedbackPage = () => {
  const { stats } = useFeedback();
  
  return (
    <FeedbackProvider>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-amber-900 mb-6">User Feedback</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Overview */}
          <div className="lg:col-span-3">
            <FeedbackStats />
          </div>
          
          {/* Sentiment Analysis */}
          <div className="lg:col-span-3 mt-6">
            <FeedbackSentimentAnalysis data={stats?.dailyFeedback || []} />
          </div>
          
          {/* Filters Section */}
          <div className="lg:col-span-1">
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-amber-800 mb-4">Filters</h2>
              <FeedbackFilters />
            </div>
          </div>
          
          {/* Feedback List */}
          <div className="lg:col-span-2">
            <FeedbackList />
          </div>
        </div>
      </div>
    </FeedbackProvider>

    I'll continue with sections 8-10 of the user feedback frontend implementation document:

## 8. Utilities and Helpers

### feedbackUtils.js

This utility file provides helper functions for processing and formatting feedback data:

``javascript
// src/utils/feedbackUtils.js

/**
 * Format a date string to a readable format
 * @param {string} dateString - ISO date string
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' })
  };
  
  return date.toLocaleDateString(undefined, options);
};

/**
 * Calculate the percentage of a value relative to a total
 * @param {number} value - The value
 * @param {number} total - The total
 * @returns {string} - Formatted percentage
 */
export const calculatePercentage = (value, total) => {
  if (!total) return '0%';
  return `${Math.round((value / total) * 100)}%`;
};

/**
 * Group feedback by date
 * @param {Array} feedback - Feedback items
 * @param {string} groupBy - Grouping type ('day', 'week', 'month')
 * @returns {Object} - Grouped feedback
 */
export const groupFeedbackByDate = (feedback, groupBy = 'day') => {
  if (!feedback || !Array.isArray(feedback) || feedback.length === 0) {
    return {};
  }
  
  const grouped = {};
  
  feedback.forEach(item => {
    if (!item.metadata || !item.metadata.timestamp) return;
    
    const date = new Date(item.metadata.timestamp);
    let key;
    
    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case 'week':
        // Get first day of the week (Sunday)
        const day = date.getUTCDay();
        const diff = date.getUTCDate() - day;
        const weekStart = new Date(date);
        weekStart.setUTCDate(diff);
        key = weekStart.toISOString().split('T')[0]; // Week starting YYYY-MM-DD
        break;
      case 'month':
        key = `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}`;
        break;
      default:
        key = date.toISOString().split('T')[0]; // Default to day
    }
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    
    grouped[key].push(item);
  });
  
  return grouped;
};

/**
 * Calculate average rating for feedback items
 * @param {Array} feedback - Feedback items
 * @returns {number} - Average rating
 */
export const calculateAverageRating = (feedback) => {
  if (!feedback || !Array.isArray(feedback) || feedback.length === 0) {
    return 0;
  }
  
  const sum = feedback.reduce((acc, item) => acc + (item.rating || 0), 0);
  return (sum / feedback.length).toFixed(1);
};

/**
 * Count feedback by rating
 * @param {Array} feedback - Feedback items
 * @returns {Object} - Counts by rating
 */
export const countFeedbackByRating = (feedback) => {
  if (!feedback || !Array.isArray(feedback)) {
    return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  }
  
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  feedback.forEach(item => {
    if (item.rating >= 1 && item.rating <= 5) {
      counts[item.rating]++;
    }
  });
  
  return counts;
};

/**
 * Count feedback by tag
 * @param {Array} feedback - Feedback items
 * @returns {Object} - Counts by tag
 */
export const countFeedbackByTag = (feedback) => {
  if (!feedback || !Array.isArray(feedback)) {
    return {};
  }
  
  const counts = {};
  
  feedback.forEach(item => {
    if (item.tags && Array.isArray(item.tags)) {
      item.tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    }
  });
  
  return counts;
};

/**
 * Get feedback sentiment breakdown
 * @param {Array} feedback - Feedback items
 * @returns {Object} - Sentiment counts
 */
export const getFeedbackSentiment = (feedback) => {
  if (!feedback || !Array.isArray(feedback)) {
    return { positive: 0, neutral: 0, negative: 0 };
  }
  
  const sentiment = { positive: 0, neutral: 0, negative: 0 };
  
  feedback.forEach(item => {
    if (item.rating >= 4) {
      sentiment.positive++;
    } else if (item.rating === 3) {
      sentiment.neutral++;
    } else if (item.rating <= 2) {
      sentiment.negative++;
    }
  });
  
  return sentiment;
};

/**
 * Extract common words from feedback comments
 * @param {Array} feedback - Feedback items
 * @param {number} limit - Maximum number of words to return
 * @returns {Array} - Common words with counts
 */
export const extractCommonWords = (feedback, limit = 20) => {
  if (!feedback || !Array.isArray(feedback)) {
    return [];
  }
  
  // Combine all comments
  const allComments = feedback
    .filter(item => item.comment && typeof item.comment === 'string')
    .map(item => item.comment.toLowerCase())
    .join(' ');
  
  // Split into words
  const words = allComments.split(/\s+/);
  
  // Count word frequencies
  const wordCounts = {};
  const stopWords = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 
    'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'could', 'did', 'do', 'does', 
    'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having', 'he', 
    'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 
    'itself', 'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 
    'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 
    'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 
    'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 
    'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with', 'would', 'you', 'your', 'yours', 'yourself', 
    'yourselves'
  ]);
  
  words.forEach(word => {
    // Clean the word of punctuation
    const cleanWord = word.replace(/[^\w]/g, '');
    
    // Skip empty words and stop words
    if (!cleanWord || cleanWord.length <= 2 || stopWords.has(cleanWord)) {
      return;
    }
    
    wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;
  });
  
  // Convert to array and sort by frequency
  const sortedWords = Object.entries(wordCounts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  
  return sortedWords;
};
```

### datePicker.js

A utility for creating date ranges for the feedback filters:

```javascript
// src/utils/datePicker.js

/**
 * Get date range options for feedback filters
 * @returns {Object} - Date range options
 */
export const getDateRangeOptions = () => {
  const today = new Date();
  
  // Last 7 days
  const last7Days = {
    startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7),
    endDate: today
  };
  
  // Last 30 days
  const last30Days = {
    startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30),
    endDate: today
  };
  
  // Last 90 days
  const last90Days = {
    startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 90),
    endDate: today
  };
  
  // This month
  const thisMonth = {
    startDate: new Date(today.getFullYear(), today.getMonth(), 1),
    endDate: today
  };
  
  // Last month
  const lastMonth = {
    startDate: new Date(today.getFullYear(), today.getMonth() - 1, 1),
    endDate: new Date(today.getFullYear(), today.getMonth(), 0)
  };
  
  // This year
  const thisYear = {
    startDate: new Date(today.getFullYear(), 0, 1),
    endDate: today
  };
  
  return {
    last7Days,
    last30Days,
    last90Days,
    thisMonth,
    lastMonth,
    thisYear
  };
};

/**
 * Format a date range as a string
 * @param {Object} dateRange - Date range object with startDate and endDate
 * @returns {string} - Formatted date range
 */
export const formatDateRange = (dateRange) => {
  if (!dateRange || !dateRange.startDate || !dateRange.endDate) {
    return 'Invalid date range';
  }
  
  const formatDate = (date) => {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  return `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`;
};

/**
 * Check if two date ranges are equal
 * @param {Object} range1 - First date range
 * @param {Object} range2 - Second date range
 * @returns {boolean} - Whether the ranges are equal
 */
export const areDateRangesEqual = (range1, range2) => {
  if (!range1 || !range2) return false;
  
  const start1 = range1.startDate.toISOString().split('T')[0];
  const end1 = range1.endDate.toISOString().split('T')[0];
  const start2 = range2.startDate.toISOString().split('T')[0];
  const end2 = range2.endDate.toISOString().split('T')[0];
  
  return start1 === start2 && end1 === end2;
};
```

## 9. Integration Steps

Follow these steps to integrate the User Feedback Collection system into your existing application:

### Step 1: Update Package Dependencies

Add the required dependencies to your project:

```bash
npm install react-datepicker date-fns recharts
```

### Step 2: Add New Files

Create all the necessary component files following the structure outlined in this document:

1. Create the feedback context:
   - `src/dashboard/context/FeedbackContext.jsx`

2. Create the feedback components:
   - `src/dashboard/components/feedback/FeedbackList.jsx`
   - `src/dashboard/components/feedback/FeedbackDetail.jsx`
   - `src/dashboard/components/feedback/FeedbackStats.jsx`
   - `src/dashboard/components/feedback/FeedbackFilters.jsx`
   - `src/dashboard/components/feedback/FeedbackRatingDistribution.jsx`
   - `src/dashboard/components/feedback/FeedbackTimelineChart.jsx`
   - `src/dashboard/components/feedback/FeedbackTagCloud.jsx`
   - `src/dashboard/components/feedback/FeedbackSentimentAnalysis.jsx`

3. Create the chat feedback component:
   - `src/components/chat/components/MessageFeedback.jsx`

4. Create utility files:
   - `src/utils/feedbackUtils.js`
   - `src/utils/datePicker.js`

### Step 3: Update Existing Files

1. Modify `MessageList.jsx` to include the feedback component:

```jsx
// Add import for MessageFeedback
import MessageFeedback from './MessageFeedback';

// Inside the MessageList component, add the feedback component to bot messages
{msg.role === 'bot' && (
  <MessageFeedback 
    messageId={msg.id || `msg_${Date.now()}_${index}`}
    conversationId={conversationId}
  />
)}
```

2. Update `useMessages.js` to generate unique IDs for messages:

```javascript
// Inside the sendMessage function
const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

// Add ID to message objects
setMessages(prev => [...prev, { 
  role: "user", 
  content: input,
  id: messageId
}]);

// Similarly for bot messages
const botMessageId = `msg_bot_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
```

3. Update `apiService.js` to include the feedback API methods (as detailed in Section 3).

### Step 4: Update Routes

Add the feedback routes to your application:

1. In `DashboardRoutes.jsx`, add routes for the feedback pages:

```jsx
<Routes>
  {/* ... existing routes ... */}
  
  <Route 
    path="/dashboard/feedback" 
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <FeedbackPage />
        </DashboardLayout>
      </ProtectedRoute>
    } 
  />
  
  <Route 
    path="/dashboard/feedback/:id" 
    element={
      <ProtectedRoute>
        <DashboardLayout>
          <FeedbackDetail />
        </DashboardLayout>
      </ProtectedRoute>
    } 
  />
</Routes>
```

### Step 5: Initialize the FeedbackProvider

Add the FeedbackProvider to your dashboard layout:

```jsx
// In App.js or a similar top-level component
import { FeedbackProvider } from './dashboard/context/FeedbackContext';

// Wrap your dashboard components
<FeedbackProvider>
  <DashboardRoutes />
</FeedbackProvider>
```

### Step 6: Test the Integration

1. Start your development server:
   ```bash
   npm start
   ```

2. Navigate to the chatbot interface and test the feedback functionality:
   - Send a few messages and provide feedback using the new feedback UI
   - Verify that feedback is being stored correctly by checking the feedback API responses

3. Navigate to the dashboard and test the feedback management features:
   - Check that feedback items are displayed in the feedback list
   - Test filtering and sorting functionality
   - View detailed feedback information
   - Test resolving feedback and adding notes

## 10. Testing and Validation

### Automated Testing

Create test files for key components to ensure functionality works correctly:

#### 1. FeedbackContext.test.js

```javascript
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { FeedbackProvider, useFeedback } from '../context/FeedbackContext';
import { act } from 'react-dom/test-utils';
import api from '../../components/chat/services/apiService';

// Mock the API service
jest.mock('../../components/chat/services/apiService', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn()
}));

// Test component to access context values
const TestComponent = () => {
  const context = useFeedback();
  
  return (
    <div>
      <div data-testid="loading">{context.loading.toString()}</div>
      <button 
        data-testid="fetch-feedback" 
        onClick={context.fetchFeedback}
      >
        Fetch Feedback
      </button>
      <button 
        data-testid="fetch-stats" 
        onClick={context.fetchStats}
      >
        Fetch Stats
      </button>
      <button 
        data-testid="update-filters" 
        onClick={() => context.updateFilters({ minRating: 3 })}
      >
        Update Filters
      </button>
    </div>
  );
};

describe('FeedbackContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('provides initial state values', () => {
    render(
      <FeedbackProvider>
        <TestComponent />
      </FeedbackProvider>
    );
    
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });
  
  test('fetches feedback data', async () => {
    // Mock API response
    api.get.mockResolvedValueOnce({
      data: {
        feedback: [{ id: '1', rating: 5 }],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 }
      }
    });
    
    render(
      <FeedbackProvider>
        <TestComponent />
      </FeedbackProvider>
    );
    
    // Click fetch button
    fireEvent.click(screen.getByTestId('fetch-feedback'));
    
    // Loading should be true while fetching
    expect(screen.getByTestId('loading')).toHaveTextContent('true');
    
    // Wait for API call to resolve
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/dashboard/feedback', expect.anything());
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  });
  
  test('updates filters', async () => {
    render(
      <FeedbackProvider>
        <TestComponent />
      </FeedbackProvider>
    );
    
    // Click update filters button
    fireEvent.click(screen.getByTestId('update-filters'));
    
    // Click fetch button to trigger API call with updated filters
    fireEvent.click(screen.getByTestId('fetch-feedback'));
    
    // Verify API called with updated filters
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/api/dashboard/feedback',
        expect.objectContaining({
          params: expect.objectContaining({
            minRating: 3
          })
        })
      );
    });
  });
});
```

#### 2. MessageFeedback.test.js

```javascript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MessageFeedback from '../components/chat/components/MessageFeedback';
import { submitFeedback, getFeedbackByMessageId } from '../components/chat/services/apiService';

// Mock the API functions
jest.mock('../components/chat/services/apiService', () => ({
  submitFeedback: jest.fn(),
  getFeedbackByMessageId: jest.fn()
}));

describe('MessageFeedback', () => {
  const messageId = 'test-message-id';
  const conversationId = 'test-conversation-id';
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Default implementation for API calls
    getFeedbackByMessageId.mockRejectedValue(new Error('No feedback found'));
    submitFeedback.mockResolvedValue({ success: true });
  });
  
  test('renders feedback prompt initially', () => {
    render(<MessageFeedback messageId={messageId} conversationId={conversationId} />);
    
    expect(screen.getByText('Rate this response')).toBeInTheDocument();
  });
  
  test('expands to show rating form when clicked', () => {
    render(<MessageFeedback messageId={messageId} conversationId={conversationId} />);
    
    // Click on the feedback prompt
    fireEvent.click(screen.getByText('Rate this response'));
    
    // Check that the form appears
    expect(screen.getByText('How helpful was this response?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('What could be improved? (optional)')).toBeInTheDocument();
  });
  
  test('submits feedback successfully', async () => {
    render(<MessageFeedback messageId={messageId} conversationId={conversationId} />);
    
    // Click on the feedback prompt
    fireEvent.click(screen.getByText('Rate this response'));
    
    // Select a rating
    const stars = screen.getAllByText('★');
    fireEvent.click(stars[3]); // 4-star rating
    
    // Add a comment
    fireEvent.change(screen.getByPlaceholderText('What could be improved? (optional)'), {
      target: { value: 'Great response!' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByText('Submit'));
    
    // Check that the API was called correctly
    await waitFor(() => {
      expect(submitFeedback).toHaveBeenCalledWith({
        messageId,
        conversationId,
        rating: 4,
        comment: 'Great response!'
      });
    });
    
    // Check that thank you message appears
    await waitFor(() => {
      expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument();
    });
  });
  
  test('shows existing feedback if present', async () => {
    // Mock existing feedback
    getFeedbackByMessageId.mockResolvedValue({
      success: true,
      feedback: {
        rating: 5,
        comment: 'Excellent!'
      }
    });
    
    render(<MessageFeedback messageId={messageId} conversationId={conversationId} />);
    
    // Wait for the component to check for existing feedback
    await waitFor(() => {
      expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument();
    });
  });
});
```

#### 3. FeedbackStats.test.js

```javascript
import React from 'react';
import { render, screen } from '@testing-library/react';
import FeedbackStats from '../components/feedback/FeedbackStats';
import { FeedbackProvider } from '../context/FeedbackContext';

// Mock the charts to avoid rendering issues in tests
jest.mock('../components/feedback/FeedbackRatingDistribution', () => () => <div data-testid="rating-distribution" />);
jest.mock('../components/feedback/FeedbackTimelineChart', () => () => <div data-testid="timeline-chart" />);
jest.mock('../components/feedback/FeedbackTagCloud', () => () => <div data-testid="tag-cloud" />);

// Mock the useFeedback hook
jest.mock('../../context/FeedbackContext', () => {
  const originalModule = jest.requireActual('../../context/FeedbackContext');
  
  return {
    ...originalModule,
    useFeedback: () => ({
      stats: {
        totalCount: 100,
        averageRating: 4.2,
        ratingDistribution: { 1: 5, 2: 10, 3: 15, 4: 30, 5: 40 },
        positivePercentage: 70,
        neutralPercentage: 15,
        negativePercentage: 15,
        resolvedCount: 60,
        unresolvedCount: 40,
        dailyFeedback: [
          { date: '2023-01-01', count: 10, averageRating: 4.5 },
          { date: '2023-01-02', count: 15, averageRating: 4.2 }
        ],
        tagDistribution: [
          { _id: 'helpful', count: 30 },
          { _id: 'confusing', count: 10 }
        ]
      },
      loading: false,
      error: null,
      fetchStats: jest.fn()
    })
  };
});

describe('FeedbackStats', () => {
  test('renders key metrics', () => {
    render(
      <FeedbackProvider>
        <FeedbackStats />
      </FeedbackProvider>
    );
    
    // Check for metric values
    expect(screen.getByText('100')).toBeInTheDocument(); // Total Feedback
    expect(screen.getByText('4.2')).toBeInTheDocument(); // Average Rating
    expect(screen.getByText('70%')).toBeInTheDocument(); // Positive Feedback
  });
  
  test('renders chart components', () => {
    render(
      <FeedbackProvider>
        <FeedbackStats />
      </FeedbackProvider>
    );
    
    // Check that chart components are rendered
    expect(screen.getByTestId('rating-distribution')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-chart')).toBeInTheDocument();
    expect(screen.getByTestId('tag-cloud')).toBeInTheDocument();
  });
  
  test('handles loading state', () => {
    // Override the mock to simulate loading
    jest.spyOn(React, 'useContext').mockImplementation(() => ({
      stats: null,
      loading: true,
      error: null,
      fetchStats: jest.fn(),
      filters: { startDate: new Date(), endDate: new Date() }
    }));
    
    render(
      <FeedbackProvider>
        <FeedbackStats />
      </FeedbackProvider>
    );
    
    // Check for loading indicator
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
```

### Manual Testing Checklist

Use this checklist to verify all components are working correctly:

#### MessageFeedback Component

- [ ] Feedback prompt appears after each bot message
- [ ] Clicking prompt shows rating options
- [ ] Can select a star rating
- [ ] Can add an optional comment
- [ ] Submit button is disabled until rating is selected
- [ ] Successful submission shows thank you message
- [ ] Error handling works if submission fails
- [ ] Previously submitted feedback is displayed correctly

#### Feedback Dashboard

- [ ] Feedback list displays correctly
- [ ] Pagination works for navigating through feedback
- [ ] Sorting works for different columns
- [ ] Filters change the displayed feedback
- [ ] Date range filter works correctly
- [ ] Rating filter works correctly
- [ ] Status filter (open/resolved) works correctly
- [ ] Search function works correctly

#### Feedback Detail View

- [ ] Full feedback details display correctly
- [ ] Can navigate back to feedback list
- [ ] Resolve button appears for unresolved feedback
- [ ] Resolve form works correctly
- [ ] Can add notes to feedback
- [ ] Notes are displayed in chronological order
- [ ] Metadata and context information display correctly

#### Feedback Analytics

- [ ] Key metrics display correctly
- [ ] Rating distribution chart renders accurately
- [ ] Timeline chart shows correct data
- [ ] Time period switcher (daily/weekly/monthly) works
- [ ] Tag cloud displays correctly
- [ ] Sentiment analysis chart shows data correctly

### Performance Testing

Check that the feedback system performs well:

1. **Load testing**:
   - Test with 1000+ feedback items to ensure smooth pagination
   - Check chart rendering performance with large datasets

2. **Response time**:
   - Feedback submission should complete within 500ms
   - Dashboard page should load within 1000ms

3. **Memory usage**:
   - Monitor for memory leaks during long usage sessions
   - Check performance with React DevTools

### Browser Compatibility

Test the feedback components across different browsers:

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Mobile Responsiveness

Verify that all components work on mobile devices:

- [ ] Feedback prompt and form are usable on mobile
- [ ] Dashboard adapts correctly to small screens
- [ ] Charts remain readable on mobile
- [ ] Filters work properly on touch interfaces

### Accessibility Testing

Ensure the feedback system is accessible:

- [ ] All interactive elements are keyboard accessible
- [ ] Proper ARIA attributes are used
- [ ] Color contrast meets WCAG standards
- [ ] Screen readers can access all content

By following this comprehensive implementation guide, you'll have a complete user feedback collection, analysis, and management system integrated with your winery chatbot. This will provide valuable insights into user satisfaction and help you continuously improve the chatbot experience.