# Milea Estate Vineyard Chatbot - Complete RAG Implementation Guide

## Overview

This guide outlines the step-by-step process for implementing Retrieval Augmented Generation (RAG) using ChromaDB for the Milea Estate Vineyard chatbot. RAG enhances the chatbot's responses by retrieving relevant information from a knowledge base and injecting it into the context provided to the language model.

## Table of Contents

1. [Setting Up Environment](#1-setting-up-environment)
2. [Document Preparation and Chunking](#2-document-preparation-and-chunking)
3. [Embedding Generation](#3-embedding-generation)
4. [ChromaDB Setup and Vector Storage](#4-chromadb-setup-and-vector-storage)
5. [Query Processing and Vector Retrieval](#5-query-processing-and-vector-retrieval)
6. [Response Generation with Context](#6-response-generation-with-context)
7. [Integrating RAG into the Server](#7-integrating-rag-into-the-server)
8. [Optimizing and Testing the RAG Pipeline](#8-optimizing-and-testing-the-rag-pipeline)
9. [Automatic Commerce7 Synchronization](#9-automatic-commerce7-synchronization)
   - [Commerce7 Product Sync Script](#commerce7-product-sync-script)
   - [Scheduled Synchronization](#scheduled-synchronization)
   - [Webhook-Based Real-Time Updates](#webhook-based-real-time-updates)
   - [Manual Sync Endpoint](#manual-sync-endpoint)

## 1. Setting Up Environment

First, we need to install the necessary packages for our RAG implementation.

```bash
# Install required packages
npm install chromadb langchain @langchain/openai @langchain/community dotenv node-cron axios
```

Create or update your `.env` file to include the required API keys:

```
OPENAI_API_KEY=your_openai_api_key
CHROMA_DB_PATH=./chroma_db
C7_APP_ID=your_commerce7_app_id
C7_SECRET_KEY=your_commerce7_secret_key
C7_TENANT_ID=your_commerce7_tenant_id
ADMIN_API_KEY=your_admin_api_key_for_protected_routes
```

## 2. Document Preparation and Chunking

Create a utility to process and chunk the markdown documents into manageable segments. We'll create a new file called `utils/documentProcessor.js`:

```javascript
const fs = require('fs');
const path = require('path');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');

/**
 * Process and chunk documents from a directory
 * @param {string} directoryPath - Path to the directory containing markdown files
 * @returns {Promise<Array>} - Array of document chunks with metadata
 */
async function processDocuments(directoryPath) {
  console.log(`📂 Processing documents from: ${directoryPath}`);
  
  // Get all markdown files from the directory
  const files = fs.readdirSync(directoryPath).filter(file => 
    file.endsWith('.md')
  );
  
  console.log(`📑 Found ${files.length} markdown files`);
  
  // Create document chunks array
  let allChunks = [];
  
  // Process each file
  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    console.log(`✨ Processing file: ${file}`);
    
    // Read file content
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Detect content type based on filename
    const contentType = detectContentType(file);
    
    // Get appropriate chunk size and overlap based on content type
    const { chunkSize, chunkOverlap } = getChunkParameters(contentType);
    
    // Create text splitter
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators: ["\n\n", "\n", ". ", "! ", "? ", ", ", " ", ""]
    });
    
    // Split text into chunks
    const chunks = await textSplitter.createDocuments(
      [content],
      [{ 
        source: file,
        contentType,
        createdAt: new Date().toISOString()
      }]
    );
    
    console.log(`🧩 Created ${chunks.length} chunks from ${file}`);
    allChunks = [...allChunks, ...chunks];
  }
  
  console.log(`🏁 Total chunks created: ${allChunks.length}`);
  return allChunks;
}

/**
 * Detect content type based on filename
 * @param {string} filename - Name of the file
 * @returns {string} - Content type
 */
function detectContentType(filename) {
  const lowerFilename = filename.toLowerCase();
  
  if (lowerFilename.includes('wine') || lowerFilename.includes('product')) {
    return 'wine';
  } else if (lowerFilename.includes('history') || lowerFilename.includes('about')) {
    return 'history';
  } else if (lowerFilename.includes('visit') || lowerFilename.includes('tour')) {
    return 'visiting';
  } else if (lowerFilename.includes('event')) {
    return 'event';
  } else if (lowerFilename.includes('club') || lowerFilename.includes('membership')) {
    return 'club';
  }
  
  return 'general';
}

/**
 * Get chunk parameters based on content type
 * @param {string} contentType - Type of content
 * @returns {Object} - Chunk size and overlap parameters
 */
function getChunkParameters(contentType) {
  switch (contentType) {
    case 'wine':
      return { chunkSize: 500, chunkOverlap: 50 };
    case 'history':
      return { chunkSize: 1000, chunkOverlap: 100 };
    case 'visiting':
      return { chunkSize: 700, chunkOverlap: 70 };
    case 'event':
      return { chunkSize: 500, chunkOverlap: 50 };
    case 'club':
      return { chunkSize: 700, chunkOverlap: 70 };
    default:
      return { chunkSize: 800, chunkOverlap: 80 };
  }
}

module.exports = {
  processDocuments
};
```

## 3. Embedding Generation

Create a utility to generate embeddings for the document chunks. Create a file called `utils/embeddingService.js`:

```javascript
require('dotenv').config();
const { OpenAIEmbeddings } = require('@langchain/openai');

/**
 * Generate embeddings for document chunks
 * @param {Array} documentChunks - Array of document chunks
 * @returns {Promise<Array>} - Array of document chunks with embeddings
 */
async function generateEmbeddings(documentChunks) {
  console.log(`🧮 Generating embeddings for ${documentChunks.length} chunks`);
  
  try {
    // Initialize OpenAI embeddings with your API key
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small' // Using the latest embedding model
    });
    
    // Process chunks in batches to avoid rate limits
    const BATCH_SIZE = 20;
    let processedChunks = [];
    
    for (let i = 0; i < documentChunks.length; i += BATCH_SIZE) {
      console.log(`📊 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(documentChunks.length/BATCH_SIZE)}`);
      
      // Get current batch
      const batch = documentChunks.slice(i, i + BATCH_SIZE);
      
      // Wait briefly to avoid rate limits
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Add chunks to processed array
      processedChunks = [...processedChunks, ...batch];
    }
    
    console.log(`✅ Embedding generation complete for ${processedChunks.length} chunks`);
    return processedChunks;
  } catch (error) {
    console.error('❌ Error generating embeddings:', error);
    throw error;
  }
}

module.exports = {
  generateEmbeddings
};
```

## 4. ChromaDB Setup and Vector Storage

Create a utility to set up and manage the ChromaDB vector store. Create a file called `utils/vectorStore.js`:

```javascript
require('dotenv').config();
const { ChromaClient } = require('chromadb');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { Chroma } = require('@langchain/community/vectorstores/chroma');
const path = require('path');

// ChromaDB collection name
const COLLECTION_NAME = 'milea_vineyard_knowledge';

/**
 * Initialize ChromaDB and create/get collection
 * @returns {Promise<Object>} - ChromaDB collection
 */
async function initializeChromaDB() {
  console.log('🔄 Initializing ChromaDB...');
  
  try {
    // Initialize ChromaDB client
    const client = new ChromaClient({
      path: process.env.CHROMA_DB_PATH || path.join(__dirname, '../chroma_db')
    });
    
    // List all collections
    const collections = await client.listCollections();
    console.log(`📚 Found ${collections.length} existing collections`);
    
    // Check if our collection exists
    const collectionExists = collections.some(c => c.name === COLLECTION_NAME);
    
    if (collectionExists) {
      console.log(`✅ Collection "${COLLECTION_NAME}" already exists`);
    } else {
      // Create new collection
      await client.createCollection({
        name: COLLECTION_NAME,
        metadata: {
          description: 'Milea Estate Vineyard Knowledge Base',
          createdAt: new Date().toISOString()
        }
      });
      console.log(`✅ Created new collection: "${COLLECTION_NAME}"`);
    }
    
    return client.getCollection({ name: COLLECTION_NAME });
  } catch (error) {
    console.error('❌ Error initializing ChromaDB:', error);
    throw error;
  }
}

/**
 * Store document chunks in ChromaDB
 * @param {Array} chunks - Document chunks with embeddings
 * @returns {Promise<boolean>} - Success status
 */
async function storeDocuments(chunks) {
  console.log(`🔄 Storing ${chunks.length} document chunks in ChromaDB...`);
  
  try {
    // Initialize OpenAI embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small'
    });
    
    // Initialize or get ChromaDB collection using LangChain's Chroma integration
    const vectorStore = await Chroma.fromExistingCollection(
      embeddings,
      { collectionName: COLLECTION_NAME }
    );
    
    // Add documents to the collection
    await vectorStore.addDocuments(chunks);
    
    console.log(`✅ Successfully stored ${chunks.length} chunks in ChromaDB`);
    return true;
  } catch (error) {
    console.error('❌ Error storing documents in ChromaDB:', error);
    throw error;
  }
}

/**
 * Delete documents from ChromaDB by source filename
 * @param {Array<string>} sources - Array of source filenames
 * @returns {Promise<boolean>} - Success status
 */
async function deleteDocumentsBySource(sources) {
  console.log(`🗑️ Deleting documents from sources: ${sources.join(', ')}`);
  
  try {
    // Initialize OpenAI embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small'
    });
    
    // Initialize ChromaDB with LangChain
    const vectorStore = await Chroma.fromExistingCollection(
      embeddings,
      { collectionName: COLLECTION_NAME }
    );
    
    // Get ChromaDB client collection
    const client = new ChromaClient({
      path: process.env.CHROMA_DB_PATH || path.join(__dirname, '../chroma_db')
    });
    const collection = await client.getCollection({ name: COLLECTION_NAME });
    
    // Query documents to get IDs for deletion
    for (const source of sources) {
      try {
        // Get document IDs by metadata filter
        const results = await collection.get({
          where: { source: source }
        });
        
        if (results.ids.length > 0) {
          // Delete the documents
          await collection.delete({
            ids: results.ids
          });
          console.log(`✅ Deleted ${results.ids.length} documents from source: ${source}`);
        } else {
          console.log(`ℹ️ No documents found for source: ${source}`);
        }
      } catch (sourceError) {
        console.error(`❌ Error deleting documents from source ${source}:`, sourceError);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error deleting documents by source:', error);
    return false;
  }
}

/**
 * Search for similar documents in ChromaDB
 * @param {string} query - User query
 * @param {number} k - Number of results to return
 * @returns {Promise<Array>} - Array of similar documents
 */
async function searchSimilarDocuments(query, k = 5) {
  console.log(`🔍 Searching for documents similar to: "${query}"`);
  
  try {
    // Initialize OpenAI embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small'
    });
    
    // Initialize ChromaDB with LangChain
    const vectorStore = await Chroma.fromExistingCollection(
      embeddings,
      { collectionName: COLLECTION_NAME }
    );
    
    // Search for similar documents
    const results = await vectorStore.similaritySearch(query, k);
    
    console.log(`✅ Found ${results.length} similar documents`);
    return results;
  } catch (error) {
    console.error('❌ Error searching similar documents:', error);
    return [];
  }
}

module.exports = {
  initializeChromaDB,
  storeDocuments,
  searchSimilarDocuments,
  deleteDocumentsBySource
};
```

## 5. Query Processing and Vector Retrieval

Create a utility for processing queries and retrieving relevant context. Create a file called `utils/queryProcessor.js`:

```javascript
const { OpenAIEmbeddings } = require('@langchain/openai');
const { searchSimilarDocuments } = require('./vectorStore');

/**
 * Process a user query and retrieve relevant context
 * @param {string} query - User query
 * @returns {Promise<Object>} - Processed query with context
 */
async function processQuery(query) {
  console.log(`🔄 Processing query: "${query}"`);
  
  try {
    // Clean and normalize the query
    const cleanedQuery = cleanQuery(query);
    
    // Get query type to help with retrieval
    const queryType = detectQueryType(cleanedQuery);
    
    // Retrieve relevant documents based on query
    const k = determineRetrievalCount(queryType);
    const relevantDocs = await searchSimilarDocuments(cleanedQuery, k);
    
    // Extract and format context from relevant documents
    const context = formatContext(relevantDocs);
    
    console.log(`📚 Retrieved ${relevantDocs.length} relevant documents for context`);
    
    return {
      originalQuery: query,
      cleanedQuery,
      queryType,
      relevantDocs,
      context,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error processing query:', error);
    return {
      originalQuery: query,
      cleanedQuery: query,
      context: '',
      error: error.message
    };
  }
}

/**
 * Clean and normalize a query
 * @param {string} query - Raw query
 * @returns {string} - Cleaned query
 */
function cleanQuery(query) {
  return query
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s?,.]/g, '')
    .toLowerCase();
}

/**
 * Detect the type of query to optimize retrieval
 * @param {string} query - Cleaned query
 * @returns {string} - Query type
 */
function detectQueryType(query) {
  // Keywords for different types of queries
  const wineKeywords = ['wine', 'red', 'white', 'rosé', 'rose', 'bottle', 'vintage', 'chardonnay', 'cabernet', 'pinot', 'merlot', 'sauvignon', 'riesling', 'proceedo'];
  const visitKeywords = ['visit', 'tour', 'tasting', 'hours', 'directions', 'location', 'reservation', 'book'];
  const clubKeywords = ['club', 'membership', 'subscribe', 'join', 'subscription'];
  const eventKeywords = ['event', 'upcoming', 'calendar', 'schedule'];
  
  // Check for matches
  if (wineKeywords.some(keyword => query.includes(keyword))) {
    return 'wine';
  } else if (visitKeywords.some(keyword => query.includes(keyword))) {
    return 'visiting';
  } else if (clubKeywords.some(keyword => query.includes(keyword))) {
    return 'club';
  } else if (eventKeywords.some(keyword => query.includes(keyword))) {
    return 'event';
  }
  
  return 'general';
}

/**
 * Determine how many documents to retrieve based on query type
 * @param {string} queryType - Type of query
 * @returns {number} - Number of documents to retrieve
 */
function determineRetrievalCount(queryType) {
  switch (queryType) {
    case 'wine':
      return 4;
    case 'club':
      return 3;
    case 'visiting':
      return 3;
    case 'event':
      return 3;
    default:
      return 5;
  }
}

/**
 * Format retrieved documents into a context string
 * @param {Array} documents - Retrieved documents
 * @returns {string} - Formatted context
 */
function formatContext(documents) {
  if (!documents || documents.length === 0) {
    return '';
  }
  
  return documents.map((doc, index) => {
    const source = doc.metadata?.source || 'unknown source';
    return `[Document ${index + 1} from ${source}]\n${doc.pageContent}`;
  }).join('\n\n');
}

module.exports = {
  processQuery
};
```

## 6. Response Generation with Context

Create a utility for generating responses using the LLM with retrieved context. Create a file called `utils/responseGenerator.js`:

```javascript
require('dotenv').config();
const { OpenAI } = require('@langchain/openai');

/**
 * Generate a response using the LLM with context
 * @param {Object} queryData - Processed query data with context
 * @returns {Promise<Object>} - Generated response
 */
async function generateResponse(queryData) {
  console.log(`🤖 Generating response for query: "${queryData.originalQuery}"`);
  
  try {
    // Prepare the prompt with context
    const prompt = constructPrompt(queryData);
    
    // Initialize OpenAI LLM
    const model = new OpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000
    });
    
    // Generate response
    const response = await model.call(prompt);
    
    // Extract sources for attribution
    const sources = extractSources(queryData.relevantDocs);
    
    console.log(`✅ Response generated successfully`);
    
    return {
      query: queryData.originalQuery,
      response,
      sources,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error generating response:', error);
    
    return {
      query: queryData.originalQuery,
      response: "I apologize, but I'm having trouble generating a response right now. Please try asking again, or contact Milea Estate Vineyard directly for immediate assistance.",
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Construct a prompt for the LLM with context
 * @param {Object} queryData - Processed query data
 * @returns {string} - Formatted prompt
 */
function constructPrompt(queryData) {
  return `You are an AI assistant for Milea Estate Vineyard, a family-owned and operated vineyard and winery in the Hudson Valley of New York. You help customers learn about wines, plan their visits, and make purchases. Answer the question based on the context provided below. If the answer cannot be determined from the context, acknowledge that you don't know rather than making up information. When appropriate, recommend relevant wines based on the information provided.

USER QUESTION: ${queryData.originalQuery}

CONTEXT INFORMATION:
${queryData.context || "No specific context available."}

Please provide a helpful, accurate response in a warm, conversational tone that matches Milea Estate Vineyard's brand voice. When discussing wines, emphasize their unique qualities and the vineyard's sustainable practices.`;
}

/**
 * Extract sources from relevant documents for attribution
 * @param {Array} documents - Retrieved documents
 * @returns {Array} - Formatted sources
 */
function extractSources(documents) {
  if (!documents || documents.length === 0) {
    return [];
  }
  
  // Extract unique sources
  const uniqueSources = [...new Set(documents.map(doc => doc.metadata?.source || 'unknown'))];
  
  return uniqueSources.map(source => ({
    type: 'document',
    title: source
  }));
}

module.exports = {
  generateResponse
};
```

## 7. Integrating RAG into the Server

Now, let's integrate our RAG implementation into the main server. Create a script to initialize the RAG system and add a new route for the enhanced chat functionality.

First, create a script to initialize the knowledge base in `scripts/initializeKnowledgeBase.js`:

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

Next, update the server.js file to include the RAG-enhanced chat endpoint:

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

// Initialize the scheduled sync when server starts
const { startScheduledSync } = require('./scripts/scheduledSync');
startScheduledSync();

// Add webhook routes
const webhookRoutes = require('./routes/webhooks');
app.use('/api/webhooks', webhookRoutes);
```

Add a new command to your `package.json` scripts:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "init-kb": "node scripts/initializeKnowledgeBase.js",
  "test": "echo \"Error: no test specified\" && exit 1"
},
```

## 8. Optimizing and Testing the RAG Pipeline

Create a test script to validate your RAG implementation in `scripts/testRagPipeline.js`:

```javascript
require('dotenv').config();
const { processQuery } = require('../utils/queryProcessor');
const { generateResponse } = require('../utils/responseGenerator');

/**
 * Test the RAG pipeline with a sample query
 * @param {string} query - Test query
 */
async function testRagPipeline(query) {
  try {
    console.log(`🧪 Testing RAG pipeline with query: "${query}"`);
    
    // Step 1: Process the query and retrieve relevant context
    console.log('🔄 Step 1: Processing query and retrieving context...');
    const queryData = await processQuery(query);
    
    console.log('\n📚 Retrieved Context:');
    console.log('-------------------');
    console.log(queryData.context.substring(0, 500) + '...');
    console.log('-------------------\n');
    
    // Step 2: Generate a response using the LLM with context
    console.log('🔄 Step 2: Generating response with context...');
    const responseData = await generateResponse(queryData);
    
    console.log('\n🤖 Generated Response:');
    console.log('-------------------');
    console.log(responseData.response);
    console.log('-------------------\n');
    
    console.log('📊 Response Sources:');
    console.log(responseData.sources);
    
    console.log('\n✅ RAG pipeline test completed successfully');
  } catch (error) {
    console.error('❌ Error testing RAG pipeline:', error);
  }
}

// Run test with sample queries
const testQueries = [
  "Tell me about your Proceedo White wine",
  "What are your visiting hours?",
  "How do I join your wine club?",
  "Do you have any upcoming events?"
];

// Test each query sequentially
async function runTests() {
  for (const query of testQueries) {
    await testRagPipeline(query);
    console.log('\n------------------------------------------\n');
    // Wait a bit between queries to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

runTests()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
```

Add a test command to your `package.json` scripts:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "init-kb": "node scripts/initializeKnowledgeBase.js",
  "test-rag": "node scripts/testRagPipeline.js",
  "test": "echo \"Error: no test specified\" && exit 1"
},
```

## 9. Automatic Commerce7 Synchronization

Now, let's add automatic synchronization between Commerce7 and your RAG knowledge base to ensure your chatbot always has up-to-date product information. This will allow the chatbot to reference the latest wines and products without manual updates.

### Commerce7 Product Sync Script

First, let's create a script that fetches products from Commerce7 and automatically converts them to markdown documents that will be incorporated into our knowledge base:

Create a script that fetches products from Commerce7 and converts them to markdown documents in `scripts/syncCommerce7Products.js`:

```javascript
// scripts/syncCommerce7Products.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const authConfig = require('../utils/commerce7Auth');
const { processDocuments } = require('../utils/documentProcessor');
const { generateEmbeddings } = require('../utils/embeddingService');
const { initializeChromaDB, storeDocuments, deleteDocumentsBySource } = require('../utils/vectorStore');

const PRODUCTS_FOLDER = path.join(__dirname, '../knowledge/products');

/**
 * Synchronize Commerce7 products with the knowledge base
 */
async function syncCommerce7Products() {
  try {
    console.log('🔄 Starting Commerce7 product synchronization...');
    
    // Create products folder if it doesn't exist
    if (!fs.existsSync(PRODUCTS_FOLDER)) {
      fs.mkdirSync(PRODUCTS_FOLDER, { recursive: true });
      console.log(`📁 Created products folder at ${PRODUCTS_FOLDER}`);
    }
    
    // Fetch all products from Commerce7
    console.log('📡 Fetching products from Commerce7...');
    const products = await fetchAllProducts();
    console.log(`📊 Retrieved ${products.length} products from Commerce7`);
    
    // Convert products to markdown documents
    console.log('📝 Converting products to markdown documents...');
    const filenames = await convertProductsToMarkdown(products);
    
    // Process the new markdown documents
    console.log('📚 Processing updated product documents...');
    const documentChunks = await processDocuments(PRODUCTS_FOLDER);
    
    // Generate embeddings
    console.log('🧮 Generating embeddings for product documents...');
    const embeddedChunks = await generateEmbeddings(documentChunks);
    
    // Initialize ChromaDB
    console.log('💾 Initializing ChromaDB...');
    await initializeChromaDB();
    
    // Remove old product documents from ChromaDB
    console.log('🧹 Removing old product documents from ChromaDB...');
    await deleteDocumentsBySource(filenames.map(f => path.basename(f)));
    
    // Store new product documents in ChromaDB
    console.log('💽 Storing updated product documents in ChromaDB...');
    await storeDocuments(embeddedChunks);
    
    console.log('✅ Commerce7 product synchronization completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error synchronizing Commerce7 products:', error);
    return false;
  }
}

/**
 * Fetch all products from Commerce7 API
 * @returns {Promise<Array>} - List of products
 */
async function fetchAllProducts() {
  let allProducts = [];
  let page = 1;
  let hasMoreProducts = true;
  
  while (hasMoreProducts) {
    try {
      console.log(`📄 Fetching products page ${page}...`);
      
      const response = await axios.get(
        `https://api.commerce7.com/v1/product`,
        {
          ...authConfig,
          params: {
            page: page,
            limit: 50 // Commerce7 API limit
          }
        }
      );
      
      const products = response.data.products || [];
      allProducts = [...allProducts, ...products];
      
      console.log(`✅ Received ${products.length} products for page ${page}`);
      
      // If we received fewer than 50 products, we've reached the end
      if (products.length < 50) {
        hasMoreProducts = false;
      } else {
        page++;
      }
    } catch (error) {
      console.error(`❌ Error fetching page ${page}:`, error.message);
      hasMoreProducts = false;
    }
  }
  
  return allProducts;
}

/**
 * Convert products to markdown documents
 * @param {Array} products - List of products from Commerce7
 * @returns {Promise<Array>} - List of created file paths
 */
async function convertProductsToMarkdown(products) {
  const createdFiles = [];
  
  for (const product of products) {
    // Generate filename (sanitize product title for the filesystem)
    const filename = `product_${product.id}.md`;
    const filePath = path.join(PRODUCTS_FOLDER, filename);
    
    // Generate markdown content
    const markdown = generateProductMarkdown(product);
    
    // Write to file
    fs.writeFileSync(filePath, markdown, 'utf8');
    createdFiles.push(filePath);
  }
  
  return createdFiles;
}

/**
 * Generate markdown content for a product
 * @param {Object} product - Commerce7 product
 * @returns {string} - Markdown content
 */
function generateProductMarkdown(product) {
  // Format price if available
  let priceText = 'Price information unavailable';
  if (product.variants && product.variants.length > 0 && product.variants[0].price) {
    const price = (product.variants[0].price / 100).toFixed(2);
    priceText = `${price}`;
  }
  
  // Format availability
  const isAvailable = 
    product.adminStatus === "Available" && 
    product.webStatus === "Available";
  const availabilityText = isAvailable ? 
    "Available for purchase" : 
    "Currently unavailable";
  
  // Generate markdown
  return `# ${product.title}

## Product Information
- **ID**: ${product.id}
- **Type**: ${product.type || 'Wine'}
- **Price**: ${priceText}
- **Availability**: ${availabilityText}
- **Created**: ${new Date(product.createdAt).toLocaleDateString()}
- **Updated**: ${new Date(product.updatedAt).toLocaleDateString()}

## Description
${product.content || 'No description available.'}

${product.teaser ? `## Quick Overview\n${product.teaser}\n` : ''}

## Product Details
${product.metaData ? formatMetaData(product.metaData) : 'No additional details available.'}
`;
}

/**
 * Format product meta data
 * @param {Object} metaData - Product meta data
 * @returns {string} - Formatted text
 */
function formatMetaData(metaData) {
  if (!metaData || Object.keys(metaData).length === 0) {
    return 'No additional details available.';
  }
  
  return Object.entries(metaData)
    .map(([key, value]) => `- **${key.replace(/_/g, ' ')}**: ${value}`)
    .join('\n');
}

// Run if called directly
if (require.main === module) {
  syncCommerce7Products()
    .then(success => {
      if (success) {
        console.log('🏁 Commerce7 product synchronization complete');
      } else {
        console.error('❌ Commerce7 product synchronization failed');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
}

// Export for programmatic use
module.exports = {
  syncCommerce7Products
};
```

### Scheduled Synchronization

Next, let's create a script to schedule automatic product updates on a regular basis using `node-cron`:

```javascript
// scripts/scheduledSync.js
require('dotenv').config();
const cron = require('node-cron');
const { syncCommerce7Products } = require('./syncCommerce7Products');

/**
 * Start scheduled synchronization jobs
 */
function startScheduledSync() {
  console.log('🔄 Starting scheduled synchronization services...');

  // Schedule product sync to run daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ Running scheduled Commerce7 product synchronization...');
    const success = await syncCommerce7Products();
    if (success) {
      console.log('✅ Scheduled product sync completed successfully');
    } else {
      console.error('❌ Scheduled product sync failed');
    }
  });

  console.log('✅ Scheduled synchronization services started');
}

// Run immediately if executed directly
if (require.main === module) {
  startScheduledSync();
}

module.exports = {
  startScheduledSync
};
```

### Webhook-Based Real-Time Updates

For real-time updates, we can create a Commerce7 webhook handler that triggers synchronization when products change:

```javascript
// routes/webhooks.js
const express = require('express');
const router = express.Router();
const { syncCommerce7Products } = require('../scripts/syncCommerce7Products');

// Commerce7 webhook handler
router.post('/commerce7', async (req, res) => {
  try {
    // Get webhook payload
    const { object, action, payload } = req.body;
    
    console.log(`📩 Received Commerce7 webhook: ${object} ${action}`);
    
    // Check if it's a product-related webhook
    if (object === 'Product' && ['Create', 'Update', 'Delete'].includes(action)) {
      console.log(`🔔 Product ${action} event detected, triggering synchronization...`);
      
      // Trigger product synchronization
      syncCommerce7Products()
        .then(success => {
          console.log(`${success ? '✅' : '❌'} Product sync after webhook ${success ? 'completed' : 'failed'}`);
        })
        .catch(error => {
          console.error('❌ Error in webhook-triggered sync:', error);
        });
      
      // Return success immediately, let sync run in background
      res.status(200).json({ success: true });
    } else {
      // Not a product event we care about
      res.status(200).json({ success: true, ignored: true });
    }
  } catch (error) {
    console.error('❌ Error processing Commerce7 webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

### Manual Sync Endpoint

Finally, add a protected endpoint to trigger synchronization manually through an API call:

```javascript
// Add to server.js
const { syncCommerce7Products } = require('./scripts/syncCommerce7Products');

// Middleware to check API key for protected routes
function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
}

// Add manual sync endpoint
app.post('/api/admin/sync-products', apiKeyAuth, async (req, res) => {
  try {
    console.log('🔄 Manual product sync triggered');
    
    // Run product synchronization
    const success = await syncCommerce7Products();
    
    if (success) {
      res.json({ 
        success: true, 
        message: 'Commerce7 product synchronization completed successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Commerce7 product synchronization failed' 
      });
    }
  } catch (error) {
    console.error('❌ Error in manual product sync:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Commerce7 product synchronization failed',
      error: error.message 
    });
  }
});
```