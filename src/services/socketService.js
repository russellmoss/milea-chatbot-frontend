import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
    }

    connect() {
        if (this.socket) {
            return;
        }

        // Initialize socket connection
        this.socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001', {
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
            console.log('Socket connected');
            this.isConnected = true;
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
            this.isConnected = false;
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    // Subscribe to SMS messages
    subscribeToSmsMessages(callback) {
        if (!this.socket) {
            console.error('Socket not connected');
            return;
        }

        this.socket.on('sms_message', (message) => {
            callback(message);
        });
    }

    // Unsubscribe from SMS messages
    unsubscribeFromSmsMessages() {
        if (!this.socket) {
            return;
        }

        this.socket.off('sms_message');
    }

    // Send a message to the server
    sendMessage(message) {
        if (!this.socket) {
            console.error('Socket not connected');
            return;
        }

        this.socket.emit('message', message);
    }

    // Get connection status
    getConnectionStatus() {
        return this.isConnected;
    }
}

// Create a singleton instance
const socketService = new SocketService();

export default socketService; 