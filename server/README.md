# Milea Chatbot WebSocket Server

This is the WebSocket server component for the Milea Chatbot SMS functionality. It handles real-time communication between the frontend and Twilio SMS service.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Twilio account with SMS capabilities

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the following variables in `.env`:
     - `TWILIO_ACCOUNT_SID`: Your Twilio Account SID
     - `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token
     - `TWILIO_PHONE_NUMBER`: Your Twilio Phone Number
     - `FRONTEND_URL`: URL of your frontend application (default: http://localhost:3000)

## Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on port 3001 by default (configurable via WS_PORT in .env).

## API Endpoints

### WebSocket Events

- `message`: Send an SMS message
  ```javascript
  socket.emit('message', {
    phoneNumber: '+1234567890',
    content: 'Hello from Milea!'
  });
  ```

- `sms_message`: Receive SMS messages
  ```javascript
  socket.on('sms_message', (message) => {
    console.log('Received message:', message);
  });
  ```

### HTTP Endpoints

- `GET /health`: Health check endpoint
  ```bash
  curl http://localhost:3001/health
  ```

## Error Handling

The server includes error handling for:
- Connection issues
- SMS sending failures
- Invalid messages

Errors are emitted to the client via the `error` event:
```javascript
socket.on('error', (error) => {
  console.error('Error:', error.message);
});
```

## Security

- CORS is enabled and configurable via the FRONTEND_URL environment variable
- All sensitive information is stored in environment variables
- WebSocket connections are authenticated via the frontend URL

## Development

To modify the server:
1. Make changes to `websocket.js`
2. The server will automatically reload in development mode
3. Test changes using the frontend application

## Troubleshooting

1. Check the server logs for connection issues
2. Verify Twilio credentials in .env
3. Ensure the frontend URL matches the FRONTEND_URL setting
4. Check the health endpoint for server status 