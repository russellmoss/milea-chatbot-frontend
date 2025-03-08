# Milea Estate Vineyard Chatbot Frontend Architecture

## Directory Structure Overview

```
milea-chatbot-frontend/
├── public/                      # Static assets
│   ├── index.html                 # Main HTML file
│   ├── favicon.ico                # Site favicon
│   ├── manifest.json              # Web app manifest
│   ├── robots.txt                 # Robots configuration
│   └── logos/                     # Logo images
│
├── src/                         # Application source code
│   ├── App.js                     # Main application component
│   ├── App.css                    # Application-wide styles
│   ├── App.test.js                # Application tests
│   ├── index.js                   # Application entry point
│   ├── index.css                  # Global CSS styles
│   ├── logo.svg                   # React logo (can be replaced)
│   ├── reportWebVitals.js         # Performance reporting
│   ├── setupTests.js              # Test setup
│   ├── components/                # React components
│   │   └── chat/                  # Chat-specific components
│   │       ├── ChatWidget.jsx       # Main chat widget
│   │       ├── components/          # Chat sub-components
│   │       │   ├── LoginForm.jsx      # Authentication form
│   │       │   ├── MessageInput.jsx   # User input component
│   │       │   ├── MessageList.jsx    # Message display component
│   │       │   └── WineCard.jsx       # Wine information display
│   │       ├── hooks/               # Custom React hooks
│   │       │   ├── useAuthentication.js  # Authentication state management
│   │       │   ├── useCustomerQueries.js # Customer data handling
│   │       │   ├── useMessages.js       # Message state management
│   │       │   └── useWineSearch.js     # Wine search functionality
│   │       ├── services/            # API integrations
│   │       │   └── apiService.js      # Backend API client
│   │       ├── utils/               # Utility functions
│   │       │   ├── formatters.js      # Data formatting utilities
│   │       │   ├── stringMatching.js  # String matching algorithms
│   │       │   ├── textUtils.js       # Text processing utilities
│   │       │   └── wineUtils.js       # Wine-specific utilities
│   │       └── docs/                # Component documentation
│   │           └── widget-file-architecture.txt # File structure docs
│
├── .gitignore                   # Git ignore configuration
├── package.json                 # Project metadata & dependencies
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
└── README.md                    # Project documentation
```

## Component Descriptions

### 1. Public Assets

- **index.html**: The main HTML container for the React application, including font loading and basic SEO metadata.
- **manifest.json**: Web app manifest for Progressive Web App functionality.
- **robots.txt**: Instructions for web crawlers.

### 2. Main Application Files

- **App.js**: The root React component that sets up the application layout and includes the ChatWidget component.
- **index.js**: The application entry point that renders the App component to the DOM.
- **index.css**: Global CSS styles, including Tailwind CSS imports and global theme settings.

### 3. Chat Components

#### Main Component

- **ChatWidget.jsx**: The main chat interface component that orchestrates the chat experience. It manages the display of messages, user input, and authentication state.

#### Sub-Components

- **LoginForm.jsx**: Form component for user authentication to access account-specific information.
- **MessageInput.jsx**: User input component with message sending functionality.
- **MessageList.jsx**: Component to display the conversation history between the user and the chatbot.
- **WineCard.jsx**: Specialized component for displaying detailed wine information in a formatted card.

#### React Hooks

- **useAuthentication.js**: Manages authentication state, including login, logout, and token management.
- **useCustomerQueries.js**: Handles customer-specific queries and extracts information from customer profiles.
- **useMessages.js**: Core hook for managing chat message state, sending messages, and connecting to the backend.
- **useWineSearch.js**: Specialized hook for wine search functionality, including fuzzy matching and wine metadata processing.

#### Services

- **apiService.js**: Centralized API client for backend communication, including chat requests, wine data retrieval, and user authentication.

#### Utilities

- **formatters.js**: Utility functions for formatting various data types, including wine lists, prices, dates, and more.
- **stringMatching.js**: Advanced string matching algorithms for fuzzy wine name matching and query processing.
- **textUtils.js**: Text processing utilities, including HTML entity cleaning and text normalization.
- **wineUtils.js**: Wine-specific utilities for handling wine names, varieties, and metadata.

### 4. Configuration Files

- **tailwind.config.js**: Configures Tailwind CSS with custom colors, fonts, and theme extensions.
- **postcss.config.js**: Sets up PostCSS plugins for CSS processing, including Tailwind CSS and Autoprefixer.

## Key Architectural Features

### 1. Component Hierarchy

The frontend follows a clear component hierarchy:
```
App
└── ChatWidget
    ├── MessageList
    │   └── MessageItems
    ├── MessageInput
    └── LoginForm (conditional)
```

### 2. State Management

The application uses React hooks for state management:
- **Global chat state**: Managed by `useMessages` hook
- **Authentication state**: Managed by `useAuthentication` hook
- **Wine searching**: Handled by `useWineSearch` hook

### 3. API Integration

The frontend communicates with the backend through:
- **Chat endpoint**: For sending messages and receiving responses
- **RAG-enhanced endpoint**: For context-aware responses
- **Commerce7 endpoints**: For product information
- **Authentication endpoints**: For user login/logout

### 4. Styling Approach

The application uses a combination of:
- **Tailwind CSS**: For utility-first styling
- **Custom CSS**: For specific components and overrides
- **Theme variables**: For consistent branding (colors, fonts, etc.)

### 5. Responsive Design

The chat widget is designed to be responsive using:
- Flexible width settings (max-w-4xl, w-3/4)
- Mobile-friendly controls
- Responsive text sizing

### 6. Authentication Flow

When a user wants to access account-specific information:
1. The system detects queries requiring authentication
2. The LoginForm component is displayed
3. After successful login, the original query is processed
4. Authentication token is stored for the session

## Data Flow

### 1. Message Handling Flow

1. User enters a message in `MessageInput`
2. `useMessages` hook adds the message to the state
3. The message is sent to the backend via `apiService`
4. The response is received and added to the message list
5. `MessageList` displays the updated conversation

### 2. Wine Search Flow

1. User asks about a specific wine
2. `useWineSearch` matches the query against known wines
3. Wine information is retrieved and formatted
4. The response is displayed as part of the conversation
5. For detailed information, `WineCard` component may be used

### 3. Authentication Flow

1. User asks account-specific questions
2. `useCustomerQueries` detects need for authentication
3. `useAuthentication` triggers login form display
4. User provides credentials
5. On success, the original query is processed with account context
