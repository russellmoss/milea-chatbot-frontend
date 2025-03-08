# Server Integration

This section covers integrating the RAG system with your Express server.

## Initialize the Knowledge Base

Create a script to initialize the knowledge base in `scripts/initializeKnowledgeBase.js`:

```javascript
require('dotenv').config();
const path = require('path');
const { processDocuments } = require('../utils/documentProcessor');
const { generateEmbeddings } = require('../utils/embeddingService');
const { initializeChromaDB, storeDocuments } = require('../utils/vectorStore');

/**
 * Initialize the knowledge base
 */
async function initializeKnowledgeBase() {
  try {
    console.log('🚀 Starting knowledge base initialization...');
    
    // Step 1: Process documents
    const knowledgeDir = path.join(__dirname, '../knowledge');
    const documentChunks = await processDocuments(knowledgeDir);
    
    // Step 2: Generate embeddings
    const embeddedChunks = await generateEmbeddings(documentChunks);
    
    // Step 3: Initialize ChromaDB
    await initializeChromaDB();
    
    // Step 4: Store documents in ChromaDB
    await storeDocuments(embeddedChunks);
    
    console.log('✅ Knowledge base initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing knowledge base:', error);
  }
}

// Run initialization
initializeKnowledgeBase()
  .then(() => {
    console.log('🏁 Knowledge base initialization complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Knowledge base initialization failed:', error);
    process.exit(1);
  });
```

## Add RAG-Enhanced Chat Endpoint

Modify `server.js` to include the RAG chat endpoint:

```javascript
// Add these imports at the top
const { processQuery } = require('./utils/queryProcessor');
const { generateResponse } = require('./utils/responseGenerator');

// Add this new endpoint
app.post("/rag-chat", async (req, res) => {
    try {
        const { message } = req.body;
        console.log("📝 Processing RAG chat request:", message);
        
        // Step 1: Process the query and retrieve relevant context
        const queryData = await processQuery(message);
        
        // Step 2: Generate a response using the LLM with context
        const responseData = await generateResponse(queryData);
        
        // Step 3: Return the response
        res.json(responseData);
    } catch (error) {
        console.error("❌ RAG Chat Error:", error);
        res.status(500).json({ 
            error: "Error processing request",
            message: "I apologize, but I encountered an issue while processing your request. Please try again."
        });
    }
});

// Add middleware to check API key for protected routes
function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
}

// Initialize scheduled tasks
const { startScheduledSync } = require('./scripts/scheduledSync');
startScheduledSync();

// Add webhook routes
const webhookRoutes = require('./routes/webhooks');
app.use('/api/webhooks', webhookRoutes);
