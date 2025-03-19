I've analyzed your codebase and understand your requirements for implementing a Twilio-based text messaging system within your Milea chatbot. Let me create a comprehensive implementation guide and debugging document for you.

# Milea Chatbot Twilio SMS Integration Implementation Guide

This guide will walk you through implementing the SMS integration with your existing Milea chatbot, enabling customers to initiate text conversations while leveraging your Commerce7 customer database.

## Table of Contents
1. [Initial Twilio Setup](#1-initial-twilio-setup)
2. [Backend Implementation](#2-backend-implementation)
3. [Frontend Implementation](#4-frontend-implementation)
4. [Testing with ngrok](#5-testing-with-ngrok)
5. [Deployment Checklist](#6-deployment-checklist)

## 1. Initial Twilio Setup

### 1.1 Create a Twilio Account and Get Credentials

1. Sign up or log in to [Twilio](https://www.twilio.com)
2. Navigate to your dashboard
3. Note your Account SID and Auth Token (you'll need these later)
4. Purchase a new phone number or use an existing one with SMS capabilities
5. Note the phone number (in E.164 format, e.g., +12125551234)

### 1.2 Configure Webhooks

1. In your Twilio dashboard, navigate to "Phone Numbers" > "Manage" > Select your number
2. In the "Messaging" section, configure the webhook URL for when "A message comes in"
   - During development: `https://your-ngrok-url.ngrok.io/api/twilio/webhook`
   - In production: `https://your-domain.com/api/twilio/webhook`
3. Set the HTTP method to `POST`
4. Save your changes

## 2. Backend Implementation

### 2.1 Install Required Packages

```bash
cd milea-chatbot
npm install --save twilio cors-anywhere socket.io
```

### 2.2 Add Environment Variables

Add these to your `.env` file:

```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### 2.3 Create Twilio Service

Create a new file `services/twilioService.js`:

```javascript
// services/twilioService.js
const twilio = require('twilio');
const logger = require('../utils/logger');

// Initialize Twilio client with your credentials
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send an SMS message using Twilio
 * @param {string} to - Recipient phone number in E.164 format (+1XXXXXXXXXX)
 * @param {string} body - Message content
 * @returns {Promise<Object>} - Twilio message object
 */
async function sendMessage(to, body) {
  try {
    logger.info(`Sending SMS to ${to}`);
    
    const message = await client.messages.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
      body
    });
    
    logger.info(`Message sent successfully. SID: ${message.sid}`);
    return message;
  } catch (error) {
    logger.error('Error sending SMS:', error);
    throw error;
  }
}

/**
 * Get message conversation history for a specific phone number
 * @param {string} phoneNumber - Phone number in E.164 format
 * @returns {Promise<Array>} - Array of messages
 */
async function getConversationHistory(phoneNumber) {
  try {
    logger.info(`Fetching conversation history for ${phoneNumber}`);
    
    const messages = await client.messages.list({
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      limit: 50
    });
    
    // Add messages sent from the customer to Twilio number
    const incomingMessages = await client.messages.list({
      from: phoneNumber,
      to: process.env.TWILIO_PHONE_NUMBER,
      limit: 50
    });
    
    // Combine and sort messages by date
    const allMessages = [...messages, ...incomingMessages]
      .sort((a, b) => new Date(a.dateCreated) - new Date(b.dateCreated));
    
    logger.info(`Found ${allMessages.length} messages in conversation history`);
    return allMessages;
  } catch (error) {
    logger.error('Error fetching conversation history:', error);
    throw error;
  }
}

module.exports = {
  sendMessage,
  getConversationHistory,
  client // Export the client for direct use if needed
};
```

### 2.4 Create Twilio Routes

Create a new file `routes/twilio.js`:

```javascript
// routes/twilio.js
const express = require('express');
const router = express.Router();
const twilioService = require('../services/twilioService');
const commerce7Service = require('../services/commerce7Service');
const logger = require('../utils/logger');
const { authConfig } = require('../config/commerce7');
const axios = require('axios');

// Initialize socket.io reference (will be set from server.js)
let io;

// Initialize socket storage to track customer connections
const customerSockets = new Map();

// Set socket.io instance
const setSocketIO = (socketIO) => {
  io = socketIO;
};

// Setup socket connection tracking
const setupSocketEvents = (socket) => {
  socket.on('register-customer', (data) => {
    const { phoneNumber, sessionId } = data;
    if (phoneNumber && sessionId) {
      logger.info(`Registering customer socket: ${phoneNumber} with session: ${sessionId}`);
      customerSockets.set(phoneNumber, {
        socket,
        sessionId
      });
    }
  });
  
  socket.on('disconnect', () => {
    // Find and remove this socket
    for (const [phoneNumber, data] of customerSockets.entries()) {
      if (data.socket.id === socket.id) {
        logger.info(`Removing customer socket: ${phoneNumber}`);
        customerSockets.delete(phoneNumber);
        break;
      }
    }
  });
};

/**
 * Find customer by phone number or email in Commerce7
 * @param {string} phoneNumber - Phone number to search
 * @param {string} email - Email to search
 * @returns {Promise<Object|null>} - Customer data or null
 */
async function findCustomer(phoneNumber, email) {
  try {
    // Try finding by phone number first
    if (phoneNumber) {
      // Format phone for searching (strip any non-numeric chars)
      const formattedPhone = phoneNumber.replace(/\D/g, '');
      
      // Search by phone
      logger.info(`Searching for customer by phone: ${formattedPhone}`);
      const phoneResponse = await axios.get(
        `https://api.commerce7.com/v1/customer?q=${formattedPhone}`,
        authConfig
      );
      
      if (phoneResponse.data.customers && phoneResponse.data.customers.length > 0) {
        logger.info(`Found customer by phone: ${phoneResponse.data.customers[0].id}`);
        return phoneResponse.data.customers[0];
      }
    }
    
    // If not found by phone, try email
    if (email) {
      logger.info(`Searching for customer by email: ${email}`);
      const emailResponse = await axios.get(
        `https://api.commerce7.com/v1/customer?q=${encodeURIComponent(email)}`,
        authConfig
      );
      
      if (emailResponse.data.customers && emailResponse.data.customers.length > 0) {
        logger.info(`Found customer by email: ${emailResponse.data.customers[0].id}`);
        return emailResponse.data.customers[0];
      }
    }
    
    // No customer found
    logger.info('No customer found by phone or email');
    return null;
  } catch (error) {
    logger.error('Error searching for customer:', error);
    return null;
  }
}

/**
 * Create or update customer in Commerce7
 * @param {Object} customerData - Customer information
 * @returns {Promise<Object>} - Customer data from Commerce7
 */
async function createOrUpdateCustomer(customerData) {
  try {
    const { firstName, lastName, email, phoneNumber, birthdate } = customerData;
    
    // Format phone number for Commerce7
    let formattedPhone = null;
    if (phoneNumber) {
      formattedPhone = phoneNumber.replace(/\D/g, "");
      if (formattedPhone.length === 10) {
        formattedPhone = `+1${formattedPhone}`;
      }
    }
    
    // Check if customer exists
    const existingCustomer = await findCustomer(phoneNumber, email);
    
    if (existingCustomer) {
      // Update existing customer
      logger.info(`Updating existing customer: ${existingCustomer.id}`);
      
      const payload = {
        firstName,
        lastName,
        emails: email ? [{ email }] : undefined,
        phones: formattedPhone ? [{ phone: formattedPhone }] : undefined,
        birthDate: birthdate || undefined,
        emailMarketingStatus: "Subscribed",
        countryCode: "US"
      };
      
      const response = await axios.put(
        `https://api.commerce7.com/v1/customer/${existingCustomer.id}`,
        payload,
        authConfig
      );
      
      return response.data;
    } else {
      // Create new customer
      logger.info('Creating new customer');
      
      const payload = {
        firstName,
        lastName,
        emails: email ? [{ email }] : [],
        phones: formattedPhone ? [{ phone: formattedPhone }] : [],
        birthDate: birthdate || undefined,
        emailMarketingStatus: "Subscribed",
        countryCode: "US",
        metaData: {
          source: 'sms_chatbot'
        }
      };
      
      const response = await axios.post(
        'https://api.commerce7.com/v1/customer',
        payload,
        authConfig
      );
      
      return response.data;
    }
  } catch (error) {
    logger.error('Error creating/updating customer:', error);
    throw error;
  }
}

// Twilio webhook to receive incoming messages
router.post('/webhook', async (req, res) => {
  try {
    // Extract message data from Twilio webhook
    const { From, Body, MessageSid } = req.body;
    
    logger.info(`Received SMS from ${From}: "${Body.substring(0, 30)}..."`);
    
    // Acknowledge receipt immediately
    res.status(200).set('Content-Type', 'text/xml').send(`
      <Response></Response>
    `);
    
    // Check if we have an active socket for this phone number
    if (customerSockets.has(From)) {
      const { socket } = customerSockets.get(From);
      
      // Emit message to the client
      socket.emit('sms-received', {
        from: From,
        body: Body,
        messageId: MessageSid,
        timestamp: new Date().toISOString()
      });
      
      logger.info(`Message forwarded to client socket for ${From}`);
    } else {
      logger.info(`No active socket found for ${From}`);
      // TODO: Implement offline message handling if needed
    }
  } catch (error) {
    logger.error('Error processing Twilio webhook:', error);
    res.status(500).send('Error processing webhook');
  }
});

// Initialize SMS conversation from chatbot
router.post('/initiate', async (req, res) => {
  try {
    // Extract customer information from request
    const { firstName, lastName, email, phoneNumber, birthdate, message, sessionId } = req.body;
    
    if (!firstName || !lastName || !phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: "First name, last name, and phone number are required" 
      });
    }
    
    logger.info(`Initiating SMS conversation with ${firstName} ${lastName} at ${phoneNumber}`);
    
    // Normalize phone number to E.164 format
    let formattedPhoneNumber = phoneNumber.replace(/\D/g, '');
    if (formattedPhoneNumber.length === 10) {
      formattedPhoneNumber = `+1${formattedPhoneNumber}`;
    } else if (!formattedPhoneNumber.startsWith('+')) {
      formattedPhoneNumber = `+${formattedPhoneNumber}`;
    }
    
    // Create or update customer in Commerce7
    await createOrUpdateCustomer({
      firstName,
      lastName,
      email,
      phoneNumber: formattedPhoneNumber,
      birthdate
    });
    
    // Send initial message if provided
    let messageSid = null;
    if (message && message.trim()) {
      const result = await twilioService.sendMessage(
        formattedPhoneNumber,
        `${message}\n\n- ${firstName} via Milea Estate Vineyard Chat`
      );
      messageSid = result.sid;
    }
    
    // Get conversation history
    const history = await twilioService.getConversationHistory(formattedPhoneNumber);
    
    // Return success response
    res.status(200).json({
      success: true,
      phoneNumber: formattedPhoneNumber,
      messageSid,
      history: history.map(msg => ({
        id: msg.sid,
        body: msg.body,
        from: msg.from,
        to: msg.to,
        direction: msg.direction,
        timestamp: msg.dateCreated
      }))
    });
  } catch (error) {
    logger.error('Error initiating SMS conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate SMS conversation',
      error: error.message
    });
  }
});

// Send message from chatbot to customer
router.post('/send', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        message: "Phone number and message are required"
      });
    }
    
    logger.info(`Sending message to ${phoneNumber}: "${message.substring(0, 30)}..."`);
    
    // Send the message via Twilio
    const result = await twilioService.sendMessage(phoneNumber, message);
    
    res.status(200).json({
      success: true,
      messageSid: result.sid,
      timestamp: result.dateCreated
    });
  } catch (error) {
    logger.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// Get conversation history
router.get('/history/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    logger.info(`Fetching conversation history for ${phoneNumber}`);
    
    // Get conversation history from Twilio
    const history = await twilioService.getConversationHistory(phoneNumber);
    
    res.status(200).json({
      success: true,
      history: history.map(msg => ({
        id: msg.sid,
        body: msg.body,
        from: msg.from,
        to: msg.to,
        direction: msg.direction,
        timestamp: msg.dateCreated
      }))
    });
  } catch (error) {
    logger.error('Error fetching conversation history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation history',
      error: error.message
    });
  }
});

module.exports = {
  router,
  setSocketIO,
  setupSocketEvents
};
```

### 2.5 Create Commerce7 Service for Customer Management

Create a service for managing Commerce7 customers at `services/commerce7Service.js`:

```javascript
// services/commerce7Service.js
const axios = require('axios');
const { authConfig } = require('../config/commerce7');
const logger = require('../utils/logger');

/**
 * Find customer by phone number or email in Commerce7
 * @param {string} phoneNumber - Phone number to search
 * @param {string} email - Email to search
 * @returns {Promise<Object|null>} - Customer data or null
 */
async function findCustomer(phoneNumber, email) {
  try {
    // Try finding by phone number first
    if (phoneNumber) {
      // Format phone for searching (strip any non-numeric chars except +)
      const formattedPhone = phoneNumber.replace(/[^0-9+]/g, '');
      
      // Search by phone
      logger.info(`Searching for customer by phone: ${formattedPhone}`);
      const phoneResponse = await axios.get(
        `https://api.commerce7.com/v1/customer?q=${encodeURIComponent(formattedPhone)}`,
        authConfig
      );
      
      if (phoneResponse.data.customers && phoneResponse.data.customers.length > 0) {
        logger.info(`Found customer by phone: ${phoneResponse.data.customers[0].id}`);
        return phoneResponse.data.customers[0];
      }
    }
    
    // If not found by phone, try email
    if (email) {
      logger.info(`Searching for customer by email: ${email}`);
      const emailResponse = await axios.get(
        `https://api.commerce7.com/v1/customer?q=${encodeURIComponent(email)}`,
        authConfig
      );
      
      if (emailResponse.data.customers && emailResponse.data.customers.length > 0) {
        logger.info(`Found customer by email: ${emailResponse.data.customers[0].id}`);
        return emailResponse.data.customers[0];
      }
    }
    
    // No customer found
    logger.info('No customer found by phone or email');
    return null;
  } catch (error) {
    logger.error('Error searching for customer:', error);
    return null;
  }
}

/**
 * Create or update customer in Commerce7
 * @param {Object} customerData - Customer information
 * @returns {Promise<Object>} - Customer data from Commerce7
 */
async function createOrUpdateCustomer(customerData) {
  try {
    const { firstName, lastName, email, phoneNumber, birthdate } = customerData;
    
    // Format phone number for Commerce7
    let formattedPhone = null;
    if (phoneNumber) {
      // Keep + if it exists, otherwise format as US number
      if (phoneNumber.startsWith('+')) {
        formattedPhone = phoneNumber;
      } else {
        formattedPhone = phoneNumber.replace(/\D/g, "");
        if (formattedPhone.length === 10) {
          formattedPhone = `+1${formattedPhone}`;
        }
      }
    }
    
    // Check if customer exists
    const existingCustomer = await findCustomer(phoneNumber, email);
    
    if (existingCustomer) {
      // Update existing customer
      logger.info(`Updating existing customer: ${existingCustomer.id}`);
      
      const payload = {
        firstName,
        lastName,
        countryCode: "US"
      };
      
      // Only add email if provided and different from existing
      if (email && (!existingCustomer.emails || !existingCustomer.emails.some(e => e.email.toLowerCase() === email.toLowerCase()))) {
        payload.emails = [{ email }];
      }
      
      // Only add phone if provided and different from existing
      if (formattedPhone && (!existingCustomer.phones || !existingCustomer.phones.some(p => p.phone === formattedPhone))) {
        payload.phones = [{ phone: formattedPhone }];
      }
      
      // Only add birthdate if provided
      if (birthdate) {
        payload.birthDate = birthdate;
      }
      
      // Set email marketing status to subscribed
      payload.emailMarketingStatus = "Subscribed";
      
      // Update metadata to track SMS enrollment
      payload.metaData = {
        ...existingCustomer.metaData,
        sms_enrolled: "true",
        sms_enrolled_date: new Date().toISOString().split('T')[0]
      };
      
      const response = await axios.put(
        `https://api.commerce7.com/v1/customer/${existingCustomer.id}`,
        payload,
        authConfig
      );
      
      return response.data;
    } else {
      // Create new customer
      logger.info('Creating new customer');
      
      const payload = {
        firstName,
        lastName,
        countryCode: "US",
        emailMarketingStatus: "Subscribed",
        metaData: {
          source: 'sms_chatbot',
          sms_enrolled: "true",
          sms_enrolled_date: new Date().toISOString().split('T')[0]
        }
      };
      
      // Add email if provided
      if (email) {
        payload.emails = [{ email }];
      }
      
      // Add phone if provided
      if (formattedPhone) {
        payload.phones = [{ phone: formattedPhone }];
      }
      
      // Add birthdate if provided
      if (birthdate) {
        payload.birthDate = birthdate;
      }
      
      const response = await axios.post(
        'https://api.commerce7.com/v1/customer',
        payload,
        authConfig
      );
      
      return response.data;
    }
  } catch (error) {
    logger.error('Error creating/updating customer:', error);
    throw error;
  }
}

module.exports = {
  findCustomer,
  createOrUpdateCustomer
};
```

### 2.6 Update Server.js

Update your server.js file to include the new Twilio routes and socket.io:

```javascript
// server.js - Add these imports at the top
const http = require('http');
const socketIo = require('socket.io');
const twilioRoutes = require('./routes/twilio');

// ...existing imports...

// Initialize express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Set up socket handling
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Setup Twilio socket event handlers
  twilioRoutes.setupSocketEvents(socket);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Pass socket.io instance to Twilio routes
twilioRoutes.setSocketIO(io);

// ...existing middleware...

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customer', require('./routes/customers'));
app.use('/api/commerce7', require('./routes/commerce7'));
app.use('/api/subscribe', require('./routes/subscribe'));
app.use('/chat', require('./routes/chat'));
app.use('/rag-chat', require('./routes/rag'));
app.use('/api/business', require('./routes/businessInfo'));
app.use('/api/twilio', twilioRoutes.router); // Add Twilio routes

// ...existing error handling and server setup...

// Start server with HTTP server instead of Express app
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  logger.success(`Server running on port ${PORT}`);
});
```

## 3. Frontend Implementation

### 3.1 Create SMS Contact Card Component

Create a new file `src/components/chat/components/SmsContactCard.jsx`;

```javascript 
import React, { useState } from 'react';
import api from '../services/apiService';

const SmsContactCard = ({ onClose, onSuccess }) => {
  // State for form inputs
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthdate: '',
    email: '',
    phoneNumber: '',
    message: ''
  });
  
  // State for form status
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [error, setError] = useState('');
  
  // State for terms acknowledgment
  const [termsAcknowledged, setTermsAcknowledged] = useState(false);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  // Handle checkbox change
  const handleCheckboxChange = (e) => {
    setTermsAcknowledged(e.target.checked);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.phoneNumber) {
      setError('First name, last name, and phone number are required.');
      return;
    }
    
    // Validate phone number format
    const phonePattern = /^\+?[1-9]\d{9,14}$/;
    if (!phonePattern.test(formData.phoneNumber.replace(/\D/g, ''))) {
      setError('Please enter a valid phone number.');
      return;
    }
    
    // Validate terms acknowledgment
    if (!termsAcknowledged) {
      setError('You must acknowledge the terms to proceed.');
      return;
    }
    
    setStatus('submitting');
    setError('');
    
    try {
      // Generate a unique session ID for this conversation
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Submit the form data
      const response = await api.post('/api/twilio/initiate', {
        ...formData,
        sessionId
      });
      
      if (response.data.success) {
        setStatus('success');
        
        // Send successful contact information to parent component
        if (onSuccess) {
          onSuccess({
            phoneNumber: response.data.phoneNumber,
            history: response.data.history,
            sessionId
          });
        }
        
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          birthdate: '',
          email: '',
          phoneNumber: '',
          message: ''
        });
        setTermsAcknowledged(false);
        
        // Close the form after a short delay
        setTimeout(() => {
          if (onClose) onClose();
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to send message');
      }
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.message || err.message || 'An error occurred while sending your message');
    }
  };
  
  // Component for showing terms & conditions
  const TermsAndConditions = () => (
    <div className="mt-2 text-xs text-amber-800 bg-amber-50 p-2 rounded">
      <p className="mb-1">
        By submitting this form, you give Milea Family Wines permission to send text messages with info, promotions, 
        and offers to the number you provided, including use of an automated system, even if that number is listed 
        on any do not call list. Consent is not a condition of purchase. Texts are recorded. Message and/or data 
        rates may apply. Use is subject to <a href="/terms.html" target="_blank" className="underline">Terms</a> with 
        an arbitration clause and a <a href="/privacy.html" target="_blank" className="underline">Privacy Policy</a>.
      </p>
    </div>
  );
  
  return (
    <div className="w-full p-4 bg-amber-50 rounded-lg shadow-md border border-amber-300">
      <h3 className="text-xl font-bold text-amber-900 mb-3">Text Us</h3>
      
      {status === 'success' ? (
        <div className="text-green-700 font-medium bg-green-50 p-3 rounded-lg">
          <p>Thanks for reaching out! We've received your message and will respond shortly.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-amber-800 text-sm font-medium mb-1">First Name*</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full p-2 border border-amber-300 rounded bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-amber-800 text-sm font-medium mb-1">Last Name*</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full p-2 border border-amber-300 rounded bg-white"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-amber-800 text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 border border-amber-300 rounded bg-white"
              />
            </div>
            <div>
              <label className="block text-amber-800 text-sm font-medium mb-1">Phone Number*</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full p-2 border border-amber-300 rounded bg-white"
                placeholder="e.g., +15551234567"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-amber-800 text-sm font-medium mb-1">Birthdate</label>
            <input
              type="date"
              name="birthdate"
              value={formData.birthdate}
              onChange={handleChange}
              className="w-full p-2 border border-amber-300 rounded bg-white"
            />
          </div>
          
          <div>
            <label className="block text-amber-800 text-sm font-medium mb-1">Message*</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="3"
              className="w-full p-2 border border-amber-300 rounded bg-white"
              required
            ></textarea>
          </div>
          
          <div className="flex items-start mt-2">
            <input
              type="checkbox"
              id="terms"
              checked={termsAcknowledged}
              onChange={handleCheckboxChange}
              className="mt-1 mr-2"
              required
            />
            <label htmlFor="terms" className="text-sm text-amber-800">
              I understand and agree to the terms and conditions
            </label>
          </div>
          
          <TermsAndConditions />
          
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="flex justify-between mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-amber-900 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-700 text-white rounded hover:bg-amber-800 flex items-center"
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SmsContactCard;

3.2 Create SMS Chat Component
Create a new file src/components/chat/components/SmsChat.jsx:
jsxCopyimport React, { useState, useEffect, useRef } from 'react';
import api from '../services/apiService';
import io from 'socket.io-client';

// The socket.io connection
let socket;

const SmsChat = ({ phoneNumber, sessionId, initialHistory = [], onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Initialize socket.io connection
  useEffect(() => {
    // Initialize the socket connection
    const socketUrl = process.env.REACT_APP_SOCKET_URL || window.location.origin;
    socket = io(socketUrl);
    
    // Register this customer with the socket
    socket.emit('register-customer', { phoneNumber, sessionId });
    
    // Listen for new SMS messages
    socket.on('sms-received', (message) => {
      setMessages(prevMessages => [...prevMessages, {
        id: message.messageId,
        body: message.body,
        direction: 'inbound',
        timestamp: message.timestamp
      }]);
    });
    
    // Clean up on unmount
    return () => {
      socket.disconnect();
    };
  }, [phoneNumber, sessionId]);
  
  // Initialize message history
  useEffect(() => {
    if (initialHistory && initialHistory.length > 0) {
      setMessages(initialHistory.map(msg => ({
        id: msg.id,
        body: msg.body,
        direction: msg.direction === 'inbound' ? 'inbound' : 'outbound',
        timestamp: msg.timestamp
      })));
    } else {
      // Fetch message history if not provided
      fetchMessageHistory();
    }
  }, [phoneNumber]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Fetch message history
  const fetchMessageHistory = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/twilio/history/${phoneNumber}`);
      
      if (response.data.success) {
        setMessages(response.data.history.map(msg => ({
          id: msg.id,
          body: msg.body,
          direction: msg.direction === 'inbound' ? 'inbound' : 'outbound',
          timestamp: msg.timestamp
        })));
      }
    } catch (error) {
      console.error('Error fetching message history:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Send a message
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    try {
      setIsLoading(true);
      
      // Send message through API
      const response = await api.post('/api/twilio/send', {
        phoneNumber,
        message: input
      });
      
      if (response.data.success) {
        // Add message to local state
        setMessages(prevMessages => [...prevMessages, {
          id: response.data.messageSid,
          body: input,
          direction: 'outbound',
          timestamp: response.data.timestamp
        }]);
        
        // Clear input
        setInput('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-amber-50 rounded-lg shadow-md border border-amber-300 p-3">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-amber-900">
          Conversation with {phoneNumber}
        </h3>
        <button
          onClick={onClose}
          className="text-amber-700 hover:text-amber-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {/* Messages container */}
      <div className="flex-grow overflow-y-auto mb-3 p-2 space-y-2">
        {isLoading && messages.length === 0 ? (
          <div className="text-center py-4 text-amber-700">
            Loading conversation history...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-4 text-amber-700">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`p-2 rounded-lg max-w-[80%] ${
                message.direction === 'outbound'
                  ? 'bg-amber-600 text-white ml-auto'
                  : 'bg-white border border-amber-200 mr-auto'
              }`}
            >
              <div className="text-sm">{message.body}</div>
              <div 
                className={`text-xs mt-1 ${
                  message.direction === 'outbound' ? 'text-amber-200' : 'text-amber-500'
                }`}
              >
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="flex border-t border-amber-200 pt-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-grow p-2 border border-amber-300 rounded-l resize-none"
          rows="2"
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className={`px-4 bg-amber-700 text-white rounded-r hover:bg-amber-800 flex items-center justify-center ${
            isLoading || !input.trim() ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default SmsChat;
3.3 Update API Service
Add new SMS-related methods to src/components/chat/services/apiService.js:
javascriptCopy// Add these methods to your existing apiService.js file

/**
 * Initiate an SMS conversation
 * @param {Object} contactData - Contact information
 * @param {string} contactData.firstName - First name
 * @param {string} contactData.lastName - Last name
 * @param {string} contactData.email - Email address (optional)
 * @param {string} contactData.phoneNumber - Phone number
 * @param {string} contactData.birthdate - Birthdate (optional)
 * @param {string} contactData.message - Initial message
 * @param {string} contactData.sessionId - Unique session ID
 * @returns {Promise<Object>} - API response
 */
export const initiateSmsConversation = async (contactData) => {
  try {
    const response = await api.post('/api/twilio/initiate', contactData);
    return response.data;
  } catch (error) {
    console.error('Error initiating SMS conversation:', error);
    throw error;
  }
};

/**
 * Send an SMS message
 * @param {string} phoneNumber - Recipient's phone number
 * @param {string} message - Message content
 * @returns {Promise<Object>} - API response
 */
export const sendSmsMessage = async (phoneNumber, message) => {
  try {
    const response = await api.post('/api/twilio/send', { phoneNumber, message });
    return response.data;
  } catch (error) {
    console.error('Error sending SMS message:', error);
    throw error;
  }
};

/**
 * Fetch SMS conversation history
 * @param {string} phoneNumber - Phone number to fetch history for
 * @returns {Promise<Object>} - API response with message history
 */
export const fetchSmsHistory = async (phoneNumber) => {
  try {
    const response = await api.get(`/api/twilio/history/${phoneNumber}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching SMS history:', error);
    throw error;
  }
};
3.4 Modify useMessages.js Hook
Update src/components/chat/hooks/useMessages.js to handle SMS functionality:
javascriptCopy// Add these imports and state variables to useMessages.js
import { initiateSmsConversation, sendSmsMessage } from "../services/apiService";

// Inside your useMessages hook, add these state variables
const [showSmsContactForm, setShowSmsContactForm] = useState(false);
const [activeSmsChat, setActiveSmsChat] = useState(null);

// Add this function to check for SMS-related requests
const isSmsRequest = (text) => {
  const textLower = text.toLowerCase();
  const smsPatterns = [
    'text us',
    'text you',
    'send you a text',
    'send a text',
    'text message',
    'sms',
    'message you',
    'message the winery',
    'contact via text',
    'text contact'
  ];
  
  return smsPatterns.some(pattern => textLower.includes(pattern));
};

// Modify your sendMessage function to handle SMS requests
// Inside the try block of sendMessage, add this after the existing checks:
  // Check for SMS contact request
  else if (isSmsRequest(userInput)) {
    setShowSmsContactForm(true);
    botResponse = "I'd be happy to help you send us a text message. Please fill out the form below:";
  }

// Add these handler functions
const handleSmsFormSuccess = (data) => {
  setMessages(prev => [
    ...prev,
    { role: "bot", content: `✅ Thanks for reaching out! We've received your message and will respond to ${data.phoneNumber} shortly.` }
  ]);
  
  setShowSmsContactForm(false);
  setActiveSmsChat({
    phoneNumber: data.phoneNumber,
    sessionId: data.sessionId,
    history: data.history
  });
};

const handleSmsFormClose = () => {
  setShowSmsContactForm(false);
};

const handleSmsChatClose = () => {
  setActiveSmsChat(null);
};

// Include the new state and handlers in your return statement
return {
  messages,
  setMessages,
  loading,
  input,
  setInput,
  sendMessage,
  handleKeyDown,
  // ...other existing values
  showSmsContactForm,
  setShowSmsContactForm,
  activeSmsChat,
  setActiveSmsChat,
  handleSmsFormSuccess,
  handleSmsFormClose,
  handleSmsChatClose
};
3.5 Update ChatWidget.jsx
Modify src/components/chat/ChatWidget.jsx to include SMS functionality:
jsxCopy// Add these imports
import SmsContactCard from "./components/SmsContactCard";
import SmsChat from "./components/SmsChat";

// Destructure the new SMS-related props from useMessages
const { 
  // ...existing destructured props
  showSmsContactForm,
  activeSmsChat,
  handleSmsFormSuccess,
  handleSmsFormClose,
  handleSmsChatClose
} = useMessages();

// In the return statement, add these components after the showMilesReferral check
return (
  <div className="w-full bg-[#EFE8D4] shadow-lg rounded-lg p-6 border border-[#5A3E00]">
    <MessageList 
      messages={messages} 
      loading={loading} 
      onActionClick={handleActionClick}
    />
    
    {showLoginForm ? (
      <LoginForm 
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        handleLogin={handleLogin}
        loading={loginLoading}
      />
    ) : showMailingListSignup ? (
      <MailingListSignup 
        onClose={() => setShowMailingListSignup(false)}
        onSuccess={handleMailingListSuccess}
      />
    ) : showSignupForm ? (
      <WineClubSignup 
        preSelectedClub={clubLevel}
        onSubmit={handleWineClubSuccess}
        onCancel={cancelSignupFlow}
      />
    ) : showSmsContactForm ? (
      <SmsContactCard
        onClose={handleSmsFormClose}
        onSuccess={handleSmsFormSuccess}
      />
    ) : (
      <>
        {/* Show SMS Chat if active */}
        {activeSmsChat ? (
          <SmsChat
            phoneNumber={activeSmsChat.phoneNumber}
            sessionId={activeSmsChat.sessionId}
            initialHistory={activeSmsChat.history}
            onClose={handleSmsChatClose}
          />
        ) : (
          <>
            {/* Existing components */}
            {showMilesReferral && (
              <div className="mb-4">
                <MileaMilesReferral />
                <button 
                  onClick={() => setShowMilesReferral(false)}
                  className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Close
                </button>
              </div>
            )}
            <MessageInput 
              input={input}
              setInput={setInput}
              sendMessage={handleSendMessage}
              handleKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              loading={loading}
            />
          </>
        )}
      </>
    )}
  </div>
);
3.6 Add Static HTML Files for Terms and Privacy
Create the public/terms.html and public/privacy.html files:
htmlCopy<!-- Copy the terms.html and privacy.html provided earlier -->
3.7 Add Socket.io Client
Install the socket.io client in your frontend project:
bashCopycd milea-chatbot-frontend
npm install socket.io-client
4. Testing with ngrok
4.1 Set Up ngrok

Download and install ngrok
Sign up for a free account and get your auth token
Authenticate your ngrok CLI:
bashCopyngrok authtoken YOUR_AUTH_TOKEN


4.2 Start Your Backend Server
bashCopycd milea-chatbot
npm run dev
4.3 Start ngrok to Tunnel to Your Local Server
bashCopyngrok http 8080
4.4 Update Twilio Webhook

Copy the https URL provided by ngrok
Go to your Twilio dashboard > Phone Numbers > Manage > Select your number
Under "Messaging" section, update the webhook URL to https://your-ngrok-url.ngrok.io/api/twilio/webhook
Ensure the HTTP method is set to POST
Save your changes

4.5 Start Your Frontend
bashCopycd milea-chatbot-frontend
npm start
4.6 Test the SMS Integration Flow

Open your chatbot in the browser
Type "I want to text you" or "Send a text message" to trigger the SMS contact form
Fill out the form and submit
Check that the message is sent to your phone via Twilio
Reply to the message and verify it appears in the chat interface

5. Deployment Checklist

 Update all environment variables in production
 Set up proper CORS settings for production environment
 Update Twilio webhook URLs to point to production server
 Configure Socket.io to use secure connections in production
 Test all functionality in production environment
 Monitor Twilio logs for any issues
 Set up error reporting and monitoring


Common Issues and Debugging Guide
This section covers common issues you might encounter during implementation and testing, along with troubleshooting steps.
Twilio Configuration Issues
1. Webhook Not Receiving Messages
Symptoms:

Sent messages don't appear in the chat
No errors in server logs when messages are sent to your Twilio number

Troubleshooting:

Verify webhook URL in Twilio console is correct
Check ngrok tunnel is active and the URL hasn't changed
Ensure server is running and listening on the correct port
Check Twilio logs in the dashboard for failed webhook attempts
Verify that your server is responding with a 200 status code to webhook requests

2. Invalid Phone Number Format
Symptoms:

Error when sending messages: "The 'To' number is not a valid phone number"

Troubleshooting:

Ensure all phone numbers are in E.164 format (e.g., +15551234567)
Check your phone number formatting logic in twilioService.js
Validate user input for phone numbers using a regex pattern

3. Authentication Errors
Symptoms:

Error messages related to Twilio authentication
"Unauthorized" responses from Twilio API

Troubleshooting:

Verify your Twilio Account SID and Auth Token are correct
Check that environment variables are properly loaded
Ensure the Twilio number belongs to your account

Socket.io Connection Issues
1. Messages Not Appearing in Real-time
Symptoms:

Have to refresh the page to see new messages
No errors in console, but updates don't appear

Troubleshooting:

Check browser console for socket.io connection errors
Verify socket.io server is initialized correctly in server.js
Ensure CORS settings allow connections from your frontend
Confirm socket events are properly registered with correct event names
Check that socket.emit() is being called with the correct parameters

2. Multiple Connections for Same User
Symptoms:

Duplicate messages appearing
Messages appearing in multiple browser tabs

Troubleshooting:

Implement proper session tracking with session IDs
Make sure to unregister sockets on disconnect
Add logging to track socket connections and disconnections

Commerce7 Integration Issues
1. Customer Creation Failures
Symptoms:

Error message when trying to create or update customer records
"Validation error" from Commerce7 API

Troubleshooting:

Verify Commerce7 credentials are correct
Check payload format matches Commerce7 API requirements
Ensure required fields are included (firstName, lastName, etc.)
Validate phone number and email format before sending to Commerce7
Check Commerce7 logs for specific error details

2. Duplicate Customer Records
Symptoms:

Multiple customer records with the same information
"Already exists" errors when creating customers

Troubleshooting:

Review the customer lookup logic in commerce7Service.js
Ensure proper search by both phone and email before creating
Add better logging for customer lookup and creation
Consider adding a deduplication process

Frontend Issues
1. Form Submission Failures
Symptoms:

Form doesn't submit or returns errors
No data appears in server logs

Troubleshooting:

Check network tab in browser for API call errors
Verify form validation logic is working correctly
Ensure all required fields are properly filled
Check CORS settings if getting cross-origin errors
Add more detailed error logging on the server

2. Chat Interface Problems
Symptoms:

Messages appearing out of order
Missing messages in the interface

Troubleshooting:

Verify message sorting logic in SmsChat.jsx
Check timestamp handling and formatting
Ensure socket connections are maintained
Add proper error handling for failed message sends

ngrok Issues
1. Webhook URL Changes
Symptoms:

Webhooks stop working after restarting ngrok
Error: "No such host is known"

Troubleshooting:

ngrok free tier URLs change every time you restart ngrok
Update Twilio webhook URL after each ngrok restart
Consider upgrading to ngrok paid plan for persistent URLs
Implement a webhook update script to automate this process

2. Timeout Issues
Symptoms:

Requests taking too long or timing out
"Gateway timeout" errors

Troubleshooting:

Check your server performance and response times
Ensure ngrok is running on a stable connection
Consider using ngrok's inspect interface to debug requests
Monitor ngrok traffic to identify slow requests

Performance Considerations
1. Message History Loading
For users with extensive conversation history, loading all messages can cause performance issues:

Implement pagination for message history
Load only the most recent messages initially
Add "load more" functionality for older messages
Consider caching recent conversations

2. Socket Connection Management
For scaling beyond a single server:

Consider using Redis adapter for Socket.io
Implement proper socket connection tracking
Add monitoring for socket connections and memory usage
Consider session persistence for socket connections

Security Considerations
1. Data Protection
When handling customer data:

Ensure sensitive data is not logged (phone numbers, emails)
Implement proper rate limiting on SMS sending endpoints
Validate permission to view conversation history
Consider encrypting message content in your database

2. Authentication
To protect SMS endpoints:

Implement proper authentication for all API endpoints
Add validation to ensure only authorized users can send messages
Consider implementing separate API keys for Twilio operations
Log all access attempts for security auditing