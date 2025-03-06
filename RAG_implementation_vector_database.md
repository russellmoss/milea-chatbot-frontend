# Vector Database

This section covers **ChromaDB** setup, storage, and retrieval functionality.

## **Create `utils/vectorStore.js`**

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