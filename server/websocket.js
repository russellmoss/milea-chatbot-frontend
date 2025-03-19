const { Server } = require('socket.io');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { sendSmsMessage } = require('./twilioService');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Store active connections
const activeConnections = new Map();

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle incoming messages
    socket.on('message', async (message) => {
        try {
            console.log('Received message:', message);
            
            // Send SMS using Twilio service
            await sendSmsMessage(message.phoneNumber, message.content);
            
            // Broadcast the message to all connected clients
            io.emit('sms_message', {
                ...message,
                timestamp: new Date().toISOString(),
                direction: 'outbound'
            });
        } catch (error) {
            console.error('Error sending SMS:', error);
            socket.emit('error', { message: 'Failed to send SMS' });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        activeConnections.delete(socket.id);
    });

    // Handle errors
    socket.on('error', (error) => {
        console.error('Socket error:', error);
        socket.emit('error', { message: 'An error occurred' });
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', connections: activeConnections.size });
});

// Start server
const PORT = process.env.WS_PORT || 3001;
server.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
}); 