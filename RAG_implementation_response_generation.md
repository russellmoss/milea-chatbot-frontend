# Response Generation

This section covers using retrieved context and OpenAI to generate responses.

## Create utils/responseGenerator.js

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

## Key Components Explained

### 1. Response Generation Function

The `generateResponse` function is the core function that:
- Takes processed query data (containing the original query and retrieved context)
- Constructs a prompt using the context
- Calls the OpenAI API (using LangChain's OpenAI integration)
- Extracts sources for attribution
- Returns a structured response object

### 2. Prompt Construction

The `constructPrompt` function builds a specialized prompt that:
- Sets the AI's role and context (Milea Estate Vineyard assistant)
- Includes the user's original query
- Incorporates retrieved context information
- Provides guidelines for response style and content

### 3. Source Attribution

The `extractSources` function:
- Extracts unique document sources from the retrieved documents
- Formats them for attribution in the final response
- Helps maintain transparency about where information is sourced from

## Usage Example

```javascript
const { generateResponse } = require('./utils/responseGenerator');
const queryProcessor = require('./utils/queryProcessor');

async function handleUserQuery(userQuery) {
  // Process the query and retrieve relevant documents
  const processedQuery = await queryProcessor.processQuery(userQuery);
  
  // Generate response using the processed query data
  const response = await generateResponse(processedQuery);
  
  return response;
}
```

## Configuration Notes

- The implementation uses GPT-4 with a temperature of 0.7 for a balance of creativity and accuracy
- Response length is limited to 1000 tokens
- Environment variables are used for API keys (requires a `.env` file)
- Error handling provides a graceful fallback message to users