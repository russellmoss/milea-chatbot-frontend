# Commerce7 Synchronization for RAG Implementation

This guide explains how to set up automated synchronization between Commerce7 and your RAG knowledge base, ensuring your chatbot always has the latest product information.

## Table of Contents
- [Overview](#overview)
- [Implementation Steps](#implementation-steps)
  - [1. Commerce7 Product Sync Script](#1-commerce7-product-sync-script)
  - [2. Scheduled Synchronization](#2-scheduled-synchronization)
  - [3. Webhook-Based Real-Time Updates](#3-webhook-based-real-time-updates)
  - [4. Manual Sync Endpoint](#4-manual-sync-endpoint)

## Overview

The Commerce7 synchronization system:
- Fetches product data from Commerce7 API
- Converts products to markdown documents
- Processes these documents into vector embeddings
- Updates the knowledge base with the latest information
- Provides multiple sync methods: scheduled, webhook-triggered, and manual

## Implementation Steps

### 1. Commerce7 Product Sync Script

Create `scripts/syncCommerce7Products.js`:

```javascript
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

### 2. Scheduled Synchronization

Create `scripts/scheduledSync.js` to run automatic updates on a regular basis:

```javascript
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

### 3. Webhook-Based Real-Time Updates

Create `routes/webhooks.js` for real-time updates when products change:

```javascript
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

### 4. Manual Sync Endpoint

Add this endpoint to your `server.js` to trigger synchronization manually:

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

## Integration with Main Application

Update your `server.js` to initialize the scheduled sync and webhook routes:

```javascript
// Initialize the scheduled sync when server starts
const { startScheduledSync } = require('./scripts/scheduledSync');
startScheduledSync();

// Add webhook routes
const webhookRoutes = require('./routes/webhooks');
app.use('/api/webhooks', webhookRoutes);
```

## Usage Instructions

1. **Scheduled Synchronization**:
   - Runs automatically at 2 AM daily
   - No manual intervention required

2. **Webhook-Based Updates**:
   - Configure Commerce7 to send product webhooks to: `https://your-domain.com/api/webhooks/commerce7`
   - Updates trigger automatically when products change

3. **Manual Synchronization**:
   - Send a POST request to `/api/admin/sync-products` with the API key in the header:
     ```
     curl -X POST https://your-domain.com/api/admin/sync-products \
       -H "x-api-key: your_admin_api_key"
     ```

This implementation keeps your knowledge base always up-to-date with the latest product information from Commerce7.