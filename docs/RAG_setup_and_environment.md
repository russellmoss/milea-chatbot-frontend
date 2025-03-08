# Setup and Environment

This section covers installing dependencies, setting up environment variables, and establishing the project structure.

## **Install Required Packages**

Run the following command to install necessary dependencies:

```bash
npm install chromadb langchain @langchain/openai @langchain/community dotenv node-cron axios
```

## **Create or Update Your `.env` File**

Add the following required environment variables to your `.env` file:

```ini
OPENAI_API_KEY=your_openai_api_key
CHROMA_DB_PATH=./chroma_db
C7_APP_ID=your_commerce7_app_id
C7_SECRET_KEY=your_commerce7_secret_key
C7_TENANT_ID=your_commerce7_tenant_id
ADMIN_API_KEY=your_admin_api_key_for_protected_routes
```

## **Add Scripts to `package.json`**

Modify your `package.json` file to include these commands:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "init-kb": "node scripts/initializeKnowledgeBase.js",
  "test-rag": "node scripts/testRagPipeline.js",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

## **Project Structure**

Your project directory should be structured as follows:

```
/utils       - Utility functions for document processing, vector storage, etc.
/scripts     - Scripts for initialization, testing, and synchronization
/knowledge   - Folder containing markdown documents for the knowledge base
/routes      - Express routes for the API
