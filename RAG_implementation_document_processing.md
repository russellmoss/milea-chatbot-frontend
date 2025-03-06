# Document Processing for RAG Implementation

This guide covers how to process documents, chunk content, and generate embeddings for your Retrieval Augmented Generation (RAG) system.

## Table of Contents
- [Overview](#overview)
- [Document Processor](#document-processor)
- [Embedding Service](#embedding-service)
- [Usage Example](#usage-example)

## Overview

Document processing is a critical component of any RAG system. It involves:
- Loading documents from your knowledge base
- Detecting content type to optimize chunking
- Splitting documents into appropriate chunks
- Adding metadata to chunks for better retrieval
- Generating embeddings for vector search

## Document Processor

Create `utils/documentProcessor.js`:

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

## Embedding Service

Create `utils/embeddingService.js`:

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

## Usage Example

Here's a simple example of how to use these modules together:

```javascript
const path = require('path');
const { processDocuments } = require('./utils/documentProcessor');
const { generateEmbeddings } = require('./utils/embeddingService');

async function processKnowledgeBase() {
  try {
    // Step 1: Process documents into chunks
    const knowledgeDir = path.join(__dirname, 'knowledge');
    const documentChunks = await processDocuments(knowledgeDir);
    
    // Step 2: Generate embeddings for the chunks
    const embeddedChunks = await generateEmbeddings(documentChunks);
    
    console.log(`Successfully processed ${embeddedChunks.length} document chunks with embeddings`);
    
    // Now these chunks can be stored in your vector database
    return embeddedChunks;
  } catch (error) {
    console.error('Error processing knowledge base:', error);
    throw error;
  }
}

// Run the function
processKnowledgeBase()
  .then(chunks => console.log(`Processed ${chunks.length} chunks`))
  .catch(err => console.error(err));
```

## Notes for Custom Chunking

The document processor automatically assigns different chunking parameters based on content type:

| Content Type | Chunk Size | Overlap | Use Case |
|-------------|------------|---------|----------|
| Wine        | 500        | 50      | Wine descriptions and product details |
| History     | 1000       | 100     | Longer historical content about the vineyard |
| Visiting    | 700        | 70      | Information about visits and tours |
| Event       | 500        | 50      | Event details and schedules |
| Club        | 700        | 70      | Wine club membership information |
| General     | 800        | 80      | Default for other content types |

These values can be adjusted based on your specific needs and content characteristics.