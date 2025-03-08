# Testing and Optimization

This section covers scripts and procedures for testing and optimizing the system.

## **Create scripts/testRagPipeline.js**

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

---

## **Optimization Tips**

### **Caching Responses**
```javascript
// Add a simple in-memory cache for frequently asked questions
const responseCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

function getCachedResponse(query) {
  const normalizedQuery = query.toLowerCase().trim();
  const cached = responseCache.get(normalizedQuery);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log(`🔍 Cache hit for query: "${normalizedQuery}"`);
    return cached.response;
  }
  
  return null;
}

function cacheResponse(query, response) {
  const normalizedQuery = query.toLowerCase().trim();
  responseCache.set(normalizedQuery, {
    response,
    timestamp: Date.now()
  });
}
```

### **Query Classification for Optimization**
```javascript
// Enhance query processor with query classification
function classifyQuery(query) {
  // Simple classification based on intent
  if (/price|cost|how much/i.test(query)) {
    return 'price_query';
  }
  
  if (/hours|open|closed|visit|when can i|schedule/i.test(query)) {
    return 'hours_query';
  }
  
  if (/where|location|address|directions/i.test(query)) {
    return 'location_query';
  }
  
  return 'general_query';
}
```

### **Performance Monitoring**
```javascript
// Add performance monitoring to track processing time
function measurePerformance(fn) {
  return async function(...args) {
    const start = Date.now();
    const result = await fn(...args);
    const duration = Date.now() - start;
    
    console.log(`⏱️ ${fn.name} took ${duration}ms to execute`);
    
    // Log metrics for operations taking longer than 1 second
    if (duration > 1000) {
      console.warn(`⚠️ Slow operation detected: ${fn.name} took ${duration}ms`);
    }
    
    return result;
  };
}

// Apply to key functions
const optimizedProcessQuery = measurePerformance(processQuery);
const optimizedGenerateResponse = measurePerformance(generateResponse);
```

### **Add an `index.js` File in Utils Folder**

```javascript
// utils/index.js
const { processDocuments } = require('./documentProcessor');
const { generateEmbeddings } = require('./embeddingService');
const { 
  initializeChromaDB, 
  storeDocuments, 
  searchSimilarDocuments, 
  deleteDocumentsBySource 
} = require('./vectorStore');
const { processQuery } = require('./queryProcessor');
const { generateResponse } = require('./responseGenerator');

module.exports = {
  // Document processing
  processDocuments,
  generateEmbeddings,
  
  // Vector database
  initializeChromaDB,
  storeDocuments,
  searchSimilarDocuments,
  deleteDocumentsBySource,
  
  // Query processing and response generation
  processQuery,
  generateResponse
};