# Milea Chatbot Frontend Deployment Guide

## Table of Contents
- [Environment Setup](#environment-setup)
  - [Environment Variables](#environment-variables)
  - [Build Configuration](#build-configuration)
- [Deployment Options](#deployment-options)
  - [Static Hosting](#static-hosting)
  - [Docker Deployment](#docker-deployment)
  - [Integration with Backend](#integration-with-backend)
- [Continuous Integration/Continuous Deployment](#continuous-integrationcontinuous-deployment)
  - [GitHub Actions](#github-actions)
  - [AWS Amplify](#aws-amplify)
  - [Netlify or Vercel](#netlify-or-vercel)
- [Production Optimizations](#production-optimizations)
  - [Performance Considerations](#performance-considerations)
  - [Caching Strategy](#caching-strategy)
  - [Content Delivery Network](#content-delivery-network)
- [Domain Configuration](#domain-configuration)
  - [Custom Domain Setup](#custom-domain-setup)
  - [SSL Certificate](#ssl-certificate)
- [Monitoring and Analytics](#monitoring-and-analytics)
  - [Error Tracking](#error-tracking)
  - [Performance Monitoring](#performance-monitoring)
  - [User Analytics](#user-analytics)
- [Scaling Considerations](#scaling-considerations)
  - [Traffic Management](#traffic-management)
  - [Global Distribution](#global-distribution)
- [Maintenance and Updates](#maintenance-and-updates)
  - [Update Strategy](#update-strategy)
  - [Rollback Procedures](#rollback-procedures)
  - [Backup Strategy](#backup-strategy)

## Environment Setup

### Environment Variables

The Milea Chatbot Frontend uses environment variables for configuration. Create appropriate `.env` files for each environment:

#### Development (.env.development)
```
REACT_APP_API_URL=http://localhost:8080
REACT_APP_ENVIRONMENT=development
```

#### Production (.env.production)
```
REACT_APP_API_URL=https://api.mileaestatevineyard.com
REACT_APP_ENVIRONMENT=production
```

#### Test (.env.test)
```
REACT_APP_API_URL=http://localhost:8080
REACT_APP_ENVIRONMENT=test
```

### Build Configuration

The application is built using Create React App's build system. The following npm scripts are available:

- `npm start`: Run the development server
- `npm test`: Run tests
- `npm run build`: Create a production build
- `npm run eject`: Eject from Create React App (use only if necessary)

To create a production build:

```bash
npm run build
```

This will generate a `build` directory with optimized, minified assets ready for deployment.

## Deployment Options

### Static Hosting

The Milea Chatbot Frontend can be deployed to various static hosting services as it's a client-side React application.

#### AWS S3 + CloudFront Deployment

1. **Create an S3 bucket**:
   ```bash
   aws s3 mb s3://milea-chatbot-frontend --region us-east-1
   ```

2. **Configure bucket for static website hosting**:
   ```bash
   aws s3 website s3://milea-chatbot-frontend --index-document index.html --error-document index.html
   ```

3. **Set bucket policy for public access**:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::milea-chatbot-frontend/*"
       }
     ]
   }
   ```

4. **Upload build files to S3**:
   ```bash
   aws s3 sync build/ s3://milea-chatbot-frontend --delete
   ```

5. **Create CloudFront distribution**:
   ```bash
   aws cloudfront create-distribution \
     --origin-domain-name milea-chatbot-frontend.s3-website-us-east-1.amazonaws.com \
     --default-root-object index.html
   ```

6. **Configure CloudFront for SPA routing**:
   Create an error response that redirects 404 errors to index.html:
   ```bash
   aws cloudfront create-distribution \
     --distribution-config '{
       "CustomErrorResponses": {
         "Quantity": 1,
         "Items": [
           {
             "ErrorCode": 404,
             "ResponsePagePath": "/index.html",
             "ResponseCode": 200,
             "ErrorCachingMinTTL": 300
           }
         ]
       }
     }'
   ```

#### Firebase Hosting Deployment

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase project**:
   ```bash
   firebase init
   ```
   Select "Hosting" and follow the prompts, specifying "build" as your public directory.

4. **Deploy to Firebase**:
   ```bash
   firebase deploy
   ```

### Docker Deployment

For containerized environments, you can create a Docker image for the frontend:

#### Create a Dockerfile

```dockerfile
# Build stage
FROM node:16-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create an nginx configuration file at `nginx/nginx.conf`:

```nginx
server {
    listen 80;
    
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html =404;
    }
    
    # Proxy API requests to the backend
    location /api {
        proxy_pass http://backend-service:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Build and run the Docker image

```bash
# Build the image
docker build -t milea-chatbot-frontend .

# Run the container
docker run -p 80:80 milea-chatbot-frontend
```

### Integration with Backend

For a complete deployment with both frontend and backend, use Docker Compose:

Create a `docker-compose.yml` file:

```yaml
version: '3'

services:
  frontend:
    build:
      context: ./milea-chatbot-frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - milea-network

  backend:
    build:
      context: ./milea-chatbot-backend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - COMMERCE7_APP_ID=${COMMERCE7_APP_ID}
      - COMMERCE7_SECRET_KEY=${COMMERCE7_SECRET_KEY}
    volumes:
      - ./data:/app/data
    networks:
      - milea-network

networks:
  milea-network:
    driver: bridge
```

Run both services:

```bash
docker-compose up -d
```

## Continuous Integration/Continuous Deployment

### GitHub Actions

Set up automated builds and deployments with GitHub Actions:

Create a `.github/workflows/deploy.yml` file:

```yaml
name: Deploy Milea Chatbot Frontend

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build
      env:
        REACT_APP_API_URL: ${{ secrets.REACT_APP_API_URL }}
    
    - name: Deploy to S3
      uses: jakejarvis/s3-sync-action@master
      with:
        args: --delete
      env:
        AWS_S3_BUCKET: ${{ secrets.AWS_S3_BUCKET }}
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        AWS_REGION: 'us-east-1'
        SOURCE_DIR: 'build'
    
    - name: Invalidate CloudFront distribution
      uses: chetan/invalidate-cloudfront-action@master
      env:
        DISTRIBUTION: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}
        PATHS: '/*'
        AWS_REGION: 'us-east-1'
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

### AWS Amplify

AWS Amplify provides an integrated solution for deploying and hosting React applications:

1. **Connect your repository to Amplify**:
   - Log in to the AWS Management Console
   - Navigate to AWS Amplify
   - Click "New app" → "Host web app"
   - Connect to your Git provider and select your repository

2. **Configure build settings**:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: build
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

3. **Configure environment variables**:
   - Add `REACT_APP_API_URL` and other necessary environment variables

4. **Deploy**:
   - Amplify will automatically deploy when you push to your main branch

### Netlify or Vercel

Both Netlify and Vercel provide simple deployment workflows for React applications:

#### Netlify Deployment

1. **Create a `netlify.toml` file**:
   ```toml
   [build]
     publish = "build"
     command = "npm run build"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Connect your repository to Netlify**:
   - Log in to Netlify
   - Click "New site from Git"
   - Select your repository
   - Netlify will automatically detect your build settings

#### Vercel Deployment

1. **Create a `vercel.json` file**:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/static-build",
         "config": { "distDir": "build" }
       }
     ],
     "routes": [
       { "src": "/static/(.*)", "dest": "/static/$1" },
       { "src": "/favicon.ico", "dest": "/favicon.ico" },
       { "src": "/manifest.json", "dest": "/manifest.json" },
       { "src": "/logo192.png", "dest": "/logo192.png" },
       { "src": "/(.*)", "dest": "/index.html" }
     ]
   }
   ```

2. **Deploy to Vercel**:
   - Install Vercel CLI: `npm i -g vercel`
   - Run: `vercel --prod`
   - Or connect your repository in the Vercel dashboard for automatic deployments

## Production Optimizations

### Performance Considerations

Optimize your React application for production:

1. **Code Splitting**:
   Implement React's code splitting to reduce bundle size:
   ```jsx
   import React, { lazy, Suspense } from 'react';
   
   const ChatWidget = lazy(() => import('./components/chat/ChatWidget'));
   
   function App() {
     return (
       <div className="app">
         <Suspense fallback={<div>Loading...</div>}>
           <ChatWidget />
         </Suspense>
       </div>
     );
   }
   ```

2. **Image Optimization**:
   - Use WebP format for images
   - Implement responsive images with srcset
   - Lazy load images below the fold

3. **PurgeCSS for Tailwind**:
   This is enabled by default in the Tailwind configuration, but ensure it's properly configured for production:
   ```js
   // tailwind.config.js
   module.exports = {
     purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
     // other config
   }
   ```

4. **Implement Memoization**:
   Use React's memoization features for expensive calculations:
   ```jsx
   import React, { useMemo } from 'react';
   
   function ExpensiveComponent({ data }) {
     const processedData = useMemo(() => {
       return expensiveProcessing(data);
     }, [data]);
     
     return <div>{processedData}</div>;
   }
   ```

### Caching Strategy

Implement an effective caching strategy:

1. **Service Worker**:
   Create React App includes a service worker configuration. Enable it in `index.js`:
   ```javascript
   // If you want your app to work offline and load faster, you can change
   // unregister() to register() below. Note this comes with some pitfalls.
   serviceWorker.register();
   ```

2. **Cache Control Headers**:
   Configure proper Cache-Control headers for static assets:
   
   For S3/CloudFront:
   ```bash
   aws s3 sync build/ s3://milea-chatbot-frontend \
     --cache-control "public, max-age=31536000, immutable" \
     --exclude "index.html"
   
   aws s3 cp build/index.html s3://milea-chatbot-frontend/index.html \
     --cache-control "public, max-age=0, must-revalidate"
   ```

3. **Local Storage Caching**:
   Implement wine data caching to reduce API calls:
   ```javascript
   // In useWineSearch.js
   const getWineData = async () => {
     const cachedData = localStorage.getItem('wineData');
     const cacheTime = localStorage.getItem('wineDataTimestamp');
     
     // Check if cache is valid (less than 1 day old)
     if (cachedData && cacheTime && (Date.now() - cacheTime < 86400000)) {
       return JSON.parse(cachedData);
     }
     
     // Fetch fresh data
     const data = await fetchWineData();
     
     // Update cache
     localStorage.setItem('wineData', JSON.stringify(data));
     localStorage.setItem('wineDataTimestamp', Date.now());
     
     return data;
   };
   ```

### Content Delivery Network

Using a CDN improves loading performance globally:

1. **CloudFront Configuration**:
   - Implement compression
   - Configure proper caching behaviors
   - Set up origin failover for high availability

2. **Multi-Region Deployment**:
   For applications with global audience, deploy to multiple AWS regions:
   ```bash
   # Deploy to US region
   aws s3 sync build/ s3://milea-chatbot-frontend-us --delete
   
   # Deploy to EU region
   aws s3 sync build/ s3://milea-chatbot-frontend-eu --delete
   ```

3. **Cache Invalidation Strategy**:
   Implement versioned asset paths to avoid the need for cache invalidation:
   ```javascript
   // webpack.config.js (if ejected)
   output: {
     filename: '[name].[contenthash].js',
     path: path.resolve(__dirname, 'build'),
   }
   ```

## Domain Configuration

### Custom Domain Setup

Configure a custom domain for your deployed application:

#### AWS Route 53 + CloudFront

1. **Register a domain or use existing domain in Route 53**:
   ```bash
   aws route53 create-hosted-zone --name mileachatbot.com --caller-reference $(date +%s)
   ```

2. **Create an SSL certificate in AWS Certificate Manager**:
   ```bash
   aws acm request-certificate \
     --domain-name mileachatbot.com \
     --validation-method DNS \
     --subject-alternative-names www.mileachatbot.com
   ```

3. **Add domain to CloudFront distribution**:
   ```bash
   aws cloudfront update-distribution \
     --id YOUR_DISTRIBUTION_ID \
     --aliases Quantity=2,Items=["mileachatbot.com","www.mileachatbot.com"]
   ```

4. **Create Route 53 records pointing to CloudFront**:
   ```bash
   aws route53 change-resource-record-sets \
     --hosted-zone-id YOUR_HOSTED_ZONE_ID \
     --change-batch '{
       "Changes": [
         {
           "Action": "CREATE",
           "ResourceRecordSet": {
             "Name": "mileachatbot.com",
             "Type": "A",
             "AliasTarget": {
               "HostedZoneId": "Z2FDTNDATAQYW2",
               "DNSName": "YOUR_CLOUDFRONT_DOMAIN.cloudfront.net",
               "EvaluateTargetHealth": false
             }
           }
         }
       ]
     }'
   ```

### SSL Certificate

Ensure your application is served over HTTPS:

1. **Using AWS Certificate Manager (ACM)**:
   - Request a certificate (as shown above)
   - Validate ownership via DNS validation
   - Associate certificate with CloudFront distribution

2. **Using Let's Encrypt with Nginx**:
   ```bash
   # Install Certbot
   apt-get update
   apt-get install certbot python3-certbot-nginx
   
   # Obtain certificate
   certbot --nginx -d mileachatbot.com -d www.mileachatbot.com
   ```

3. **Redirect HTTP to HTTPS**:
   For Nginx configuration:
   ```nginx
   server {
       listen 80;
       server_name mileachatbot.com www.mileachatbot.com;
       return 301 https://$host$request_uri;
   }
   
   server {
       listen 443 ssl;
       server_name mileachatbot.com www.mileachatbot.com;
       
       ssl_certificate /etc/letsencrypt/live/mileachatbot.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/mileachatbot.com/privkey.pem;
       
       # Rest of your configuration
   }
   ```

## Monitoring and Analytics

### Error Tracking

Implement error tracking to identify and fix issues:

1. **Setup Sentry Integration**:
   ```bash
   npm install @sentry/react @sentry/tracing
   ```
   
   Initialize in `index.js`:
   ```javascript
   import * as Sentry from "@sentry/react";
   import { BrowserTracing } from "@sentry/tracing";
   
   Sentry.init({
     dsn: "your-sentry-dsn",
     integrations: [new BrowserTracing()],
     tracesSampleRate: 1.0,
     environment: process.env.REACT_APP_ENVIRONMENT
   });
   
   ReactDOM.render(
     <React.StrictMode>
       <App />
     </React.StrictMode>,
     document.getElementById('root')
   );
   ```

2. **Custom Error Boundary**:
   ```jsx
   import React from 'react';
   import * as Sentry from '@sentry/react';
   
   class ErrorBoundary extends React.Component {
     constructor(props) {
       super(props);
       this.state = { hasError: false };
     }
   
     static getDerivedStateFromError(error) {
       return { hasError: true };
     }
   
     componentDidCatch(error, errorInfo) {
       Sentry.captureException(error);
     }
   
     render() {
       if (this.state.hasError) {
         return <h1>Something went wrong. Please refresh the page.</h1>;
       }
       
       return this.props.children; 
     }
   }
   
   export default ErrorBoundary;
   ```

### Performance Monitoring

Track application performance:

1. **Web Vitals Monitoring**:
   Create React App includes web vitals monitoring. Enable it in `index.js`:
   ```javascript
   import reportWebVitals from './reportWebVitals';
   
   // Send metrics to your analytics service
   reportWebVitals(console.log);
   ```

2. **Custom Performance Metrics**:
   ```javascript
   // Measure chat response time
   const sendMessage = async () => {
     const startTime = performance.now();
     
     await processChatRequest(message);
     
     const responseTime = performance.now() - startTime;
     
     // Log or send to analytics
     console.log(`Chat response time: ${responseTime}ms`);
   };
   ```

### User Analytics

Implement user behavior analytics:

1. **Google Analytics Integration**:
   ```bash
   npm install react-ga
   ```
   
   Initialize in `App.js`:
   ```javascript
   import ReactGA from 'react-ga';
   
   function App() {
     useEffect(() => {
       ReactGA.initialize('UA-XXXXXXXX-X');
       ReactGA.pageview(window.location.pathname);
     }, []);
     
     // Rest of your component
   }
   ```

2. **Track Chat Interactions**:
   ```javascript
   const sendMessage = async () => {
     // Send message
     const response = await processChatRequest(message);
     
     // Track event
     ReactGA.event({
       category: 'Chat',
       action: 'Send Message',
       label: message.substring(0, 50) // Truncate for privacy
     });
     
     return response;
   };
   ```

## Scaling Considerations

### Traffic Management

Prepare your application for high traffic:

1. **Implement Rate Limiting**:
   Add rate limiting for API requests to prevent abuse:
   ```javascript
   // apiService.js
   import axios from 'axios';
   import rateLimit from 'axios-rate-limit';
   
   const http = rateLimit(axios.create({
     baseURL: process.env.REACT_APP_API_URL
   }), { maxRequests: 10, perMilliseconds: 1000 });
   
   export const processChatRequest = async (message) => {
     try {
       const response = await http.post('/rag-chat', { message });
       return response.data;
     } catch (error) {
       console.error('Error processing chat request:', error);
       throw new Error('Failed to process chat request');
     }
   };
   ```

2. **Implement Request Queuing**:
   For high-traffic scenarios, implement request queuing:
   ```javascript
   const requestQueue = [];
   let isProcessing = false;
   
   const processQueue = async () => {
     if (isProcessing || requestQueue.length === 0) return;
     
     isProcessing = true;
     const { request, resolve, reject } = requestQueue.shift();
     
     try {
       const result = await request();
       resolve(result);
     } catch (error) {
       reject(error);
     } finally {
       isProcessing = false;
       processQueue();
     }
   };
   
   const queueRequest = (requestFn) => {
     return new Promise((resolve, reject) => {
       requestQueue.push({ request: requestFn, resolve, reject });
       processQueue();
     });
   };
   
   export const processChatRequest = (message) => {
     return queueRequest(() => http.post('/rag-chat', { message }));
   };
   ```

### Global Distribution

For international users, implement global distribution:

1. **Use a Global CDN**:
   - CloudFront with multiple edge locations
   - Cloudflare CDN for global caching

2. **Implement Content Negotiation**:
   ```javascript
   const getUserLanguage = () => {
     return navigator.language || navigator.userLanguage || 'en-US';
   };
   
   const getLocalizedContent = async () => {
     const language = getUserLanguage();
     try {
       const response = await fetch(`/locales/${language}.json`);
       return await response.json();
     } catch (error) {
       // Fall back to English
       const fallbackResponse = await fetch('/locales/en-US.json');
       return await fallbackResponse.json();
     }
   };
   ```

3. **Implement Regional API Endpoints**:
   ```javascript
   const getRegionalApiUrl = () => {
     // Simplified example
     const region = navigator.language.includes('eu') ? 'eu' : 'us';
     return region === 'eu' 
       ? 'https://api-eu.mileaestatevineyard.com' 
       : 'https://api.mileaestatevineyard.com';
   };
   
   const apiUrl = getRegionalApiUrl();
   const api = axios.create({
     baseURL: apiUrl
   });
   ```

## Maintenance and Updates

### Update Strategy

Plan for regular updates and maintenance:

1. **Feature Flagging**:
   Implement feature flags for controlled rollouts:
   ```javascript
   // featureFlags.js
   const getFeatureFlags = async () => {
     try {
       const response = await fetch('/api/feature-flags');
       return await response.json();
     } catch (error) {
       return {
         enableNewChatUI: false,
         enableWineClubFeatures: false,
         // Default values
       };
     }
   };
   
   // Usage in component
   const [flags, setFlags] = useState({});
   
   useEffect(() => {
     const loadFlags = async () => {
       const featureFlags = await getFeatureFlags();
       setFlags(featureFlags);
     };
     
     loadFlags();
   }, []);
   
   return (
     <div>
       {flags.enableNewChatUI ? <NewChatUI /> : <CurrentChatUI />}
     </div>
   );
   ```

2. **Blue-Green Deployments**:
   Implement blue-green deployment strategy:
   - Deploy new version to separate infrastructure
   - Test thoroughly
   - Switch traffic from old to new version
   - Keep old version running temporarily as fallback

3. **Scheduled Maintenance Windows**:
   Plan maintenance during low-traffic periods:
   ```jsx
   // MaintenanceNotice.jsx
   const MaintenanceNotice = () => {
     const maintenanceTime = new Date('2024-04-15T02:00:00Z');
     const [showNotice, setShowNotice] = useState(false);
     
     useEffect(() => {
       const now = new Date();
       const timeUntilMaintenance = maintenanceTime - now;
       
       // Show notice 24 hours before maintenance
       if (timeUntilMaintenance > 0 && timeUntilMaintenance < 24 * 60 * 60 * 1000) {
         setShowNotice(true);
       }
     }, []);
     
     if (!showNotice) return null;
     
     return (
       <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4">
         <p className="text-yellow-700">
           Scheduled maintenance on {maintenanceTime.toLocaleString()}. 
           The chat may be unavailable for up to 30 minutes.
         </p>
       </div>
     );
   };
   ```

### Rollback Procedures

Prepare for rollbacks if deployments cause issues:

1. **Version Tagging**:
   Tag all deployments with version numbers:
   ```bash
   # Build with version
   REACT_APP_VERSION=1.2.3 npm run build
   
   # Tag deployment
   aws s3 sync build/ s3://milea-chatbot-frontend/v1.2.3/ --delete
   
   # Deploy to active version
   aws s3 sync build/ s3://milea-chatbot-frontend/ --delete
   ```

2. **Quick Rollback Script**:
   Prepare a rollback script:
   ```bash
   #!/bin/bash
   # rollback.sh
   
   VERSION=$1
   
   if [ -z "$VERSION" ]; then
     echo "Usage: ./rollback.sh VERSION"
     exit 1
   fi
   
   # Copy previous version to active
   aws s3 sync s3://milea-chatbot-frontend/v$VERSION/ s3://milea-chatbot-frontend/ --delete
   
   # Invalidate CloudFront cache
   aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
   
   echo "Rolled back to version $VERSION"
   ```

3. **Version Detection**:
   Add version detection in the application:
   ```javascript
   // Display current version
   const AppVersion = () => {
     return (
       <div className="text-xs text-gray-500 mt-4">
         Version: {process.env.REACT_APP_VERSION || 'development'}
       </div>
     );
   };
   ```

### Backup Strategy

Implement a backup strategy for critical data:

1. **Local Storage Backup**:
   Back up critical local storage data to prevent loss:
   ```javascript
   // Scheduled backup of user preferences
   const backupUserPreferences = () => {
     try {
       const preferences = localStorage.getItem('userPreferences');
       if (preferences) {
         // Send to backend for storage
         fetch('/api/backup/preferences', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ preferences })
         });
       }
     } catch (error) {
       console.error('Failed to backup preferences:', error);
     }
   };
   
   // Run backup daily
   useEffect(() => {
     const interval = setInterval(backupUserPreferences, 24 * 60 * 60 * 1000);
     return () => clearInterval(interval);
   }, []);
   ```

2. **Source Control Versioning**:
   Maintain proper versioning in source control:
   ```bash
   # Tag releases in Git
   git tag -a v1.2.3 -m "Release version 1.2.3"
   git push origin v1.2.3
   
   # Create release branches
   git checkout -b release/1.2.3
   git push origin release/1.2.3
   ```

3. **Configuration Backup**:
   Backup environment-specific configurations:
   ```bash
   # Backup script for environment files
   #!/bin/bash
   
   TIMESTAMP=$(date +%Y%m%d%H%M%S)
   BACKUP_DIR="./backups"
   
   mkdir -p $BACKUP_DIR
   
   # Backup environment files
   cp .env.production $BACKUP_DIR/.env.production.$TIMESTAMP
   cp .env.development $BACKUP_DIR/.env.development.$TIMESTAMP
   
   # Backup other config files
   cp tailwind.config.js $BACKUP_DIR/tailwind.config.js.$TIMESTAMP
   
   echo "Configuration backup completed at $TIMESTAMP"
   ```

## Conclusion

This deployment guide provides a comprehensive approach to deploying the Milea Estate Vineyard Chatbot Frontend. By following these best practices, you can ensure a reliable, performant, and maintainable deployment that integrates seamlessly with the backend RAG system.

Key takeaways:
- Choose a deployment strategy that fits your infrastructure needs (static hosting, Docker, or integrated with backend)
- Implement continuous integration and deployment for automated builds and testing
- Optimize for production with performance enhancements and proper caching
- Configure custom domains with SSL certificates for security
- Set up monitoring and analytics to track performance and user behavior
- Prepare for scaling with proper traffic management and global distribution
- Establish maintenance procedures including updates and rollback strategies

For specific questions about deployment or troubleshooting, consult the development team or refer to the relevant service documentation.