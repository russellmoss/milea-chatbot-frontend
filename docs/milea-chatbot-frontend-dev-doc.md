# Milea Estate Vineyard Chatbot Frontend Developer Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Development Environment](#development-environment)
3. [Core Architecture](#core-architecture)
   - [Tech Stack](#tech-stack)
   - [Component Structure](#component-structure)
   - [State Management](#state-management)
4. [Key Components](#key-components)
   - [ChatWidget](#chatwidget)
   - [MessageList](#messagelist)
   - [MessageInput](#messageinput)
   - [LoginForm](#loginform)
   - [WineCard](#winecard)
5. [Custom Hooks](#custom-hooks)
   - [useMessages](#usemessages)
   - [useAuthentication](#useauthentication)
   - [useWineSearch](#usewinesearch)
   - [useCustomerQueries](#usecustomerqueries)
6. [API Integration](#api-integration)
   - [API Service](#api-service)
   - [Authentication Flow](#authentication-flow)
   - [RAG Chat Integration](#rag-chat-integration)
7. [Utility Functions](#utility-functions)
   - [Text Processing](#text-processing)
   - [Wine-Specific Utilities](#wine-specific-utilities)
   - [String Matching](#string-matching)
   - [Formatters](#formatters)
8. [Styling Guide](#styling-guide)
   - [Tailwind CSS Usage](#tailwind-css-usage)
   - [Theme Configuration](#theme-configuration)
   - [Custom CSS](#custom-css)
9. [Testing Guidelines](#testing-guidelines)
10. [Common Patterns and Best Practices](#common-patterns-and-best-practices)
11. [Troubleshooting](#troubleshooting)

## Introduction

The Milea Estate Vineyard Chatbot Frontend is a React-based web application that provides an intuitive interface for customers to interact with the Milea chatbot. The frontend connects to the backend RAG (Retrieval Augmented Generation) system to provide intelligent, context-aware responses about wines, visiting information, and customer account details.

This documentation is intended for developers who need to understand, maintain, or extend the frontend codebase.

## Getting Started

### Prerequisites

- Node.js (v16.0.0 or later)
- npm (v8.0.0 or later)
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-organization/milea-chatbot-frontend.git
   cd milea-chatbot-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your local backend URL
   ```

4. Start the development server:
   ```bash
   npm start
   ```

### Development Environment

The application will be available at [http://localhost:3000](http://localhost:3000) in your browser.

The development server supports:
- Hot reloading for React components
- Error overlay for React errors
- ESLint integration for code quality
- Browser compatibility warnings

## Core Architecture

### Tech Stack

The frontend is built with:

- **React 19.0.0**: Core UI library
- **Tailwind CSS 3.3.0**: Utility-first CSS framework
- **Axios 1.8.1**: HTTP client for API requests
- **Jest + React Testing Library**: Testing framework

### Component Structure

The application follows a component-based architecture with:

1. **Container Components**: Manage state and data flow
2. **Presentational Components**: Handle UI rendering
3. **Custom Hooks**: Encapsulate stateful logic
4. **Utility Functions**: Provide shared functionality

### State Management

The application uses React's built-in state management with hooks:

- **useState**: For component-level state
- **useEffect**: For side effects and lifecycle management
- **Custom hooks**: For domain-specific state logic

No external state management libraries are used, keeping the architecture simple and maintainable.

## Key Components

### ChatWidget

The main container component for the chat interface.

**File**: `src/components/chat/ChatWidget.jsx`

**Responsibilities**:
- Orchestrates the chat UI
- Conditionally renders login form or chat interface
- Manages overall chat state through hooks

**Usage**:
```jsx
import ChatWidget from './components/chat/ChatWidget';

function App() {
  return (
    <div className="app-container">
      <ChatWidget />
    </div>
  );
}
```

### MessageList

Displays the conversation history.

**File**: `src/components/chat/components/MessageList.jsx`

**Props**:
- `messages`: Array of message objects
- `loading`: Boolean indicating if a message is being loaded

**Message Object Format**:
```javascript
{
  role: "user" | "bot", // Sender of the message
  content: "Message text" // Content of the message
}
```

**Usage**:
```jsx
<MessageList 
  messages={messages} 
  loading={loading} 
/>
```

### MessageInput

Handles user input and message submission.

**File**: `src/components/chat/components/MessageInput.jsx`

**Props**:
- `input`: Current input value
- `setInput`: Function to update input
- `sendMessage`: Function to send the message
- `handleKeyDown`: Function to handle keyboard events
- `loading`: Boolean indicating if a message is being processed

**Usage**:
```jsx
<MessageInput 
  input={input}
  setInput={setInput}
  sendMessage={sendMessage}
  handleKeyDown={handleKeyDown}
  loading={loading}
/>
```

### LoginForm

Provides authentication functionality for account-specific queries.

**File**: `src/components/chat/components/LoginForm.jsx`

**Props**:
- `email`: Current email input value
- `setEmail`: Function to update email
- `password`: Current password input value
- `setPassword`: Function to update password
- `handleLogin`: Function to handle login submission
- `loading`: Boolean indicating if login is in progress

**Usage**:
```jsx
<LoginForm 
  email={email}
  setEmail={setEmail}
  password={password}
  setPassword={setPassword}
  handleLogin={handleLogin}
  loading={loginLoading}
/>
```

### WineCard

Displays detailed information about a wine.

**File**: `src/components/chat/components/WineCard.jsx`

**Props**:
- `wine`: Wine product data
- `isAvailable`: Boolean indicating if the wine is currently available

**Usage**:
```jsx
<WineCard 
  wine={wineData} 
  isAvailable={true} 
/>
```

## Custom Hooks

### useMessages

Manages the chat message state and handles message sending logic.

**File**: `src/components/chat/hooks/useMessages.js`

**Returns**:
- `messages`: Array of message objects
- `loading`: Boolean indicating if a message is being processed
- `input`: Current input value
- `setInput`: Function to update input
- `sendMessage`: Function to send a message
- `handleKeyDown`: Function to handle keyboard events
- And more (authentication-related returns)

**Usage**:
```jsx
const { 
  messages, 
  loading, 
  input, 
  setInput, 
  sendMessage, 
  handleKeyDown 
} = useMessages();
```

**Key Features**:
- Maintains message history
- Handles message sending
- Integrates with authentication flow
- Connects to the RAG chat backend

### useAuthentication

Manages authentication state and operations.

**File**: `src/components/chat/hooks/useAuthentication.js`

**Returns**:
- `authToken`: Current authentication token
- `customerData`: Authenticated customer information
- `email`: Current email input
- `setEmail`: Function to update email
- `password`: Current password input
- `setPassword`: Function to update password
- `loginLoading`: Boolean indicating if login is in progress
- `showLoginForm`: Boolean controlling login form display
- `setShowLoginForm`: Function to toggle login form
- `login`: Function to handle login
- `logout`: Function to handle logout
- `fetchCustomerData`: Function to fetch customer data
- `setupAutoLogout`: Function to configure auto-logout

**Usage**:
```jsx
const {
  authToken,
  showLoginForm,
  email,
  setEmail,
  password,
  setPassword,
  login,
  logout
} = useAuthentication();
```

### useWineSearch

Provides wine search functionality with advanced matching.

**File**: `src/components/chat/hooks/useWineSearch.js`

**Returns**:
- `formatProductData`: Function to format product data for display
- `findWineMatches`: Function to find matching wines based on search terms
- `formatWineResponse`: Function to format wine information for response
- `handleUnavailableWine`: Function to handle requests for unavailable wines

**Usage**:
```jsx
const { 
  findWineMatches, 
  formatWineResponse 
} = useWineSearch();

// Find matching wines
const matches = findWineMatches(allWines, "cabernet franc");

// Format the response
const response = formatWineResponse(matches[0]);
```

### useCustomerQueries

Handles customer-specific queries and account information retrieval.

**File**: `src/components/chat/hooks/useCustomerQueries.js`

**Returns**:
- `processAuthenticatedQuestion`: Function to process queries requiring authentication
- `requiresAuthentication`: Function to determine if a query requires authentication

**Usage**:
```jsx
const {
  processAuthenticatedQuestion,
  requiresAuthentication
} = useCustomerQueries();

// Check if a query requires authentication
const needsAuth = requiresAuthentication("What was my last order?");

// Process an authenticated query
if (authToken) {
  const response = await processAuthenticatedQuestion(query, customerData);
}
```

## API Integration

### API Service

Centralized service for all API communication.

**File**: `src/components/chat/services/apiService.js`

**Key Functions**:
- `fetchWineData(fetchAll)`: Retrieves wine product data
- `processChatRequest(message)`: Sends a message to the RAG chat endpoint
- `fetchWineClubInfo()`: Retrieves wine club information
- `fetchTastingEvents()`: Gets upcoming tasting events
- `bookTastingReservation(data)`: Books a tasting reservation

**Usage**:
```javascript
import { processChatRequest, fetchWineData } from '../services/apiService';

// Send a chat message
const response = await processChatRequest(userMessage);

// Fetch wine data
const wines = await fetchWineData();
```

### Authentication Flow

The authentication flow is as follows:

1. User submits a query that requires authentication
2. System detects authentication requirement and displays login form
3. User enters credentials
4. On successful login:
   - Authentication token is stored
   - Customer data is fetched
   - Original query is processed with authentication context
5. Auto-logout occurs on browser close or component unmount

### RAG Chat Integration

The frontend integrates with the RAG-enhanced backend:

1. User query is sent to the `/rag-chat` endpoint
2. Backend processes the query with contextual information
3. Response includes both text and potential sources
4. Frontend formats and displays the response

## Utility Functions

### Text Processing

Utilities for text cleaning and processing.

**File**: `src/components/chat/utils/textUtils.js`

**Key Functions**:
- `cleanText(text)`: Removes HTML entities and special characters
- `isWineCategory(str)`: Checks if a string is a wine category
- `normalizeWineName(name)`: Normalizes wine names for consistent matching

**Usage**:
```javascript
import { cleanText, normalizeWineName } from '../utils/textUtils';

const cleanedDescription = cleanText(wineDescription);
const normalizedName = normalizeWineName("Cabernet Franc 2019");
```

### Wine-Specific Utilities

Functions specific to wine data handling.

**File**: `src/components/chat/utils/wineUtils.js`

**Key Functions**:
- `extractYear(title)`: Extracts vintage year from a wine title
- `removeYear(title)`: Removes year from wine title
- `normalizeWineName(name)`: Normalizes wine names
- `cleanWineTitle(title)`: Cleans up wine titles
- `wineVarieties`: Array of common wine varieties
- `typoCorrections`: Object mapping common typos to correct terms
- `relatedVarieties`: Object mapping wine varieties to related ones

**Usage**:
```javascript
import { extractYear, wineVarieties } from '../utils/wineUtils';

const year = extractYear("Cabernet Franc 2019"); // Returns 2019
const isKnownVariety = wineVarieties.includes("chardonnay");
```

### String Matching

Advanced string matching algorithms.

**File**: `src/components/chat/utils/stringMatching.js`

**Key Functions**:
- `fuzzyMatch(str1, str2, threshold)`: Performs fuzzy string matching
- `containsSubstring(str, substring)`: Checks for substring presence
- `hasMatchingWords(str1, str2, minWordLength)`: Checks for matching words
- `wordOverlapScore(str1, str2, minWordLength)`: Calculates word overlap percentage

**Usage**:
```javascript
import { fuzzyMatch, wordOverlapScore } from '../utils/stringMatching';

const similarity = fuzzyMatch("cabernet", "cabrnet"); // Returns ~0.85
const overlapScore = wordOverlapScore("red wine", "wine red"); // Returns 1.0
```

### Formatters

Formatting utilities for consistent data presentation.

**File**: `src/components/chat/utils/formatters.js`

**Key Functions**:
- `formatWineList(wines)`: Formats a list of wines
- `formatWineDetails(wine)`: Formats detailed wine information
- `formatWinePrice(wine)`: Formats only the price information
- `formatWineAlternatives(wines, primaryWineName)`: Formats alternative wines
- `formatPrice(cents)`: Formats price values from cents to dollars
- `formatDate(dateString)`: Formats dates consistently

**Usage**:
```javascript
import { formatWineDetails, formatPrice } from '../utils/formatters';

const wineInfo = formatWineDetails(wineData);
const formattedPrice = formatPrice(2995); // Returns "$29.95"
```

## Styling Guide

### Tailwind CSS Usage

The application uses Tailwind CSS for utility-first styling.

**Key Principles**:
- Use utility classes for most styling needs
- Follow the configured color palette for consistency
- Use responsive utilities for different screen sizes

**Example**:
```jsx
<div className="w-full bg-[#EFE8D4] shadow-lg rounded-lg p-6 border border-[#5A3E00]">
  <h2 className="text-2xl font-bold text-primary mb-4">Wine Selection</h2>
  <p className="text-darkBrown">Explore our premium wines.</p>
</div>
```

### Theme Configuration

The Tailwind theme is configured in `tailwind.config.js`.

**Key Customizations**:
- **Colors**: Brand-specific colors including primary, background, darkBrown
- **Fonts**: Custom font family (Gilda Display)
- **Extensions**: Additional utility classes for specific needs

**Usage**:
```jsx
// Using configured theme colors
<button className="bg-darkBrown text-white hover:bg-darkBrownHover">
  Send
</button>
```

### Custom CSS

For specific components requiring more complex styling, custom CSS is used in `index.css`.

**Key Custom Styles**:
- Chat bubble styling
- Message alignment and formatting
- Custom animations

**Example**:
```css
/* Chat message styling */
.chat-bubble {
  display: block;
  max-width: 75%;
  padding: 10px 15px;
  border-radius: 10px;
  margin: 5px 0;
  word-wrap: break-word;
  line-height: 1.5;
}
```

## Testing Guidelines

The application uses Jest and React Testing Library for testing.

**Testing Principles**:
1. Focus on component behavior, not implementation details
2. Test user interactions as they would happen in the browser
3. Mock API calls and external dependencies
4. Test error states and loading states

**Example Test**:
```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import MessageInput from './MessageInput';

test('calls sendMessage when button is clicked', () => {
  const mockSendMessage = jest.fn();
  render(
    <MessageInput 
      input="Test message" 
      setInput={() => {}} 
      sendMessage={mockSendMessage}
      handleKeyDown={() => {}}
      loading={false}
    />
  );
  
  const button = screen.getByRole('button', { name: /send/i });
  fireEvent.click(button);
  
  expect(mockSendMessage).toHaveBeenCalledTimes(1);
});
```

## Common Patterns and Best Practices

### Component Structure

Follow this structure for new components:

```jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Component description
 * @param {Object} props - Component props
 * @param {string} props.propName - Prop description
 */
const ComponentName = ({ propName, otherProp }) => {
  // Component logic
  
  return (
    <div className="component-container">
      {/* Component content */}
    </div>
  );
};

ComponentName.propTypes = {
  propName: PropTypes.string.isRequired,
  otherProp: PropTypes.number
};

ComponentName.defaultProps = {
  otherProp: 0
};

export default ComponentName;
```

### Hook Patterns

For custom hooks:

```javascript
import { useState, useEffect } from 'react';

/**
 * Hook description
 * @param {string} param - Parameter description
 * @returns {Object} Hook values and functions
 */
export const useCustomHook = (param) => {
  // Hook state and logic
  
  // Side effects
  useEffect(() => {
    // Effect logic
    
    return () => {
      // Cleanup
    };
  }, [param]);
  
  // Return values and functions
  return {
    value1,
    value2,
    function1,
    function2
  };
};
```

### Error Handling

Use consistent error handling patterns:

```javascript
try {
  // Operation that might fail
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error("Operation failed:", error);
  
  // User-friendly error
  return {
    error: true,
    message: "We encountered a problem. Please try again."
  };
}
```

## Troubleshooting

### Common Issues

#### API Connection Problems

**Issue**: Unable to connect to backend API

**Solutions**:
- Check that the backend server is running
- Verify API URL in `.env.local` or configuration
- Check for CORS issues in browser console
- Ensure network requests aren't blocked by firewall/proxy

#### Authentication Issues

**Issue**: Login not working or token not persisting

**Solutions**:
- Check localStorage access in browser
- Verify login API endpoint is correct
- Clear browser storage and try again
- Check for expired tokens

#### Styling Inconsistencies

**Issue**: Components don't match the design or styling is inconsistent

**Solutions**:
- Verify Tailwind is configured correctly
- Check for CSS conflicts
- Ensure fonts are loading properly
- Test on different browsers

#### Performance Issues

**Issue**: Slow response or rendering performance

**Solutions**:
- Check for unnecessary re-renders using React DevTools
- Optimize expensive operations
- Implement memoization where appropriate
- Add loading states for better user experience

### Debugging Tips

1. Use React DevTools to inspect component hierarchy and props
2. Add console logs for key operations during development
3. Use browser network tab to inspect API requests
4. Set up error boundaries to catch and display React errors

### Support Resources

- React Documentation: https://reactjs.org/docs/getting-started.html
- Tailwind CSS Documentation: https://tailwindcss.com/docs
- Axios Documentation: https://axios-http.com/docs/intro
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro/