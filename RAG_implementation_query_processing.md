# Query Processing for RAG Implementation

This guide covers how user queries are processed and matched with relevant documents in your Retrieval Augmented Generation (RAG) system.

## Table of Contents
- [Overview](#overview)
- [Implementation](#implementation)
- [Query Functions](#query-functions)
  - [Query Cleaning](#query-cleaning)
  - [Query Type Detection](#query-type-detection)
  - [Retrieval Count Optimization](#retrieval-count-optimization)
  - [Context Formatting](#context-formatting)
- [Usage Example](#usage-example)

## Overview

Query processing is a crucial part of the RAG pipeline that involves:
- Cleaning and normalizing user queries
- Detecting query types for specialized retrieval
- Determining the optimal number of documents to retrieve
- Formatting retrieved documents into a coherent context

## Implementation

Create `utils/queryProcessor.js`:

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

## Query Functions

### Query Cleaning

The `cleanQuery` function prepares user input for semantic search by:
- Removing excess whitespace 
- Converting to lowercase
- Removing special characters
- Standardizing spacing

### Query Type Detection

The `detectQueryType` function categorizes queries based on keywords:

| Query Type | Keywords | Example |
|------------|----------|---------|
| Wine | wine, red, white, rosé, bottle, vintage, chardonnay, etc. | "Do you have a cabernet franc?" |
| Visiting | visit, tour, tasting, hours, directions, location, etc. | "When can I visit the vineyard?" |
| Club | club, membership, subscribe, join, etc. | "How do I join your wine club?" |
| Event | event, upcoming, calendar, schedule, etc. | "What events are coming up?" |
| General | (default) | "Tell me about your vineyard" |

### Retrieval Count Optimization

The `determineRetrievalCount` function adjusts how many documents to retrieve based on query type:

| Query Type | Document Count | Rationale |
|------------|----------------|-----------|
| Wine | 4 | More details needed for specific wine information |
| Club | 3 | Moderate detail needed for membership information |
| Visiting | 3 | Moderate detail needed for visit information |
| Event | 3 | Moderate detail needed for event information |
| General | 5 | More documents for general information |

### Context Formatting

The `formatContext` function transforms retrieved documents into a structured context string for the LLM, including:
- Document indices for reference
- Source attribution
- Document content
- Spacing between documents

## Usage Example

Here's how to use the query processor in your application:

```javascript
const { processQuery } = require('./utils/queryProcessor');

async function handleUserQuery(userQuestion) {
  try {
    // Process the query and get relevant context
    const queryData = await processQuery(userQuestion);
    
    console.log('Query type:', queryData.queryType);
    console.log('Number of relevant documents:', queryData.relevantDocs.length);
    
    // The context can now be used for response generation with the LLM
    return queryData;
  } catch (error) {
    console.error('Error handling user query:', error);
    throw error;
  }
}

// Example usage
handleUserQuery("Tell me about your Cabernet Franc")
  .then(data => console.log(`Retrieved ${data.relevantDocs.length} documents about ${data.queryType}`))
  .catch(err => console.error('Query handling error:', err));
```

This query processing system optimizes retrieval by adapting to different types of user questions, ensuring the most relevant information is provided to the LLM for generating accurate responses.