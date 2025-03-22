const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const auth = require('./middleware/auth');

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    process.env.CHAT_FRONTEND_URL || 'http://localhost:3001',
    process.env.DASHBOARD_FRONTEND_URL || 'http://localhost:3002'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// Define public routes first (no auth required)
const publicRoutes = express.Router();

// Health check
publicRoutes.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Analytics endpoints
publicRoutes.post('/api/analytics/session', (req, res) => {
  const { sessionId, userId, timestamp, duration, messageCount, interactionCount, interactions } = req.body;
  
  // Validate required fields
  if (!sessionId || !timestamp) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: sessionId and timestamp are required' 
    });
  }

  console.log('Received analytics session data:', {
    sessionId,
    userId,
    timestamp,
    duration,
    messageCount,
    interactionCount,
    interactions
  });

  res.json({ success: true });
});

publicRoutes.post('/api/analytics/event', (req, res) => {
  const { sessionId, eventType, eventData, timestamp } = req.body;
  
  // Validate required fields
  if (!sessionId || !eventType || !timestamp) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: sessionId, eventType, and timestamp are required' 
    });
  }

  console.log('Received analytics event:', {
    sessionId,
    eventType,
    eventData,
    timestamp
  });

  res.json({ success: true });
});

// Feedback endpoint
publicRoutes.post('/api/feedback', (req, res) => {
  const { messageId, conversationId, rating, comment, tags } = req.body;
  
  // Validate required fields
  if (!messageId || !rating) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: messageId and rating are required' 
    });
  }

  // Validate rating is a number between 1 and 5
  const ratingNum = Number(rating);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ 
      success: false, 
      error: 'Rating must be a number between 1 and 5' 
    });
  }

  console.log('Received feedback:', {
    messageId,
    conversationId,
    rating: ratingNum,
    comment,
    tags
  });

  // TODO: Save feedback to database
  // For now, just return success
  res.json({ 
    success: true,
    feedback: {
      messageId,
      conversationId,
      rating: ratingNum,
      comment,
      tags,
      timestamp: new Date().toISOString()
    }
  });
});

// Apply public routes first
app.use(publicRoutes);

// Protected routes (auth required)
app.use('/api/dashboard', auth);
app.use('/api/admin', auth);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/milea_chatbot')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Initialize scheduled tasks
const { startScheduledSync } = require('./scripts/scheduledSync');
startScheduledSync();

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
}); 