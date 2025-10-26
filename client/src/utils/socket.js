import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
    }

    connect() {
        if (this.socket && this.isConnected) {
            return this.socket;
        }

        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        this.socket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000', {
            auth: {
                token,
                userName: user.name,
                userId: user._id || user.id
            },
            transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket.id);
            this.isConnected = true;
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
            this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            this.isConnected = false;
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    // Dispute-specific methods
    joinDispute(disputeId) {
        if (this.socket && disputeId) {
            this.socket.emit('join-dispute', disputeId);
        }
    }

    leaveDispute(disputeId) {
        if (this.socket && disputeId) {
            this.socket.emit('leave-dispute', disputeId);
        }
    }

    joinUserDisputes() {
        if (this.socket) {
            this.socket.emit('join-user-disputes');
        }
    }

    leaveUserDisputes() {
        if (this.socket) {
            this.socket.emit('leave-user-disputes');
        }
    }

    joinDisputesMonitoring() {
        if (this.socket) {
            this.socket.emit('join-disputes-monitoring');
        }
    }

    leaveDisputesMonitoring() {
        if (this.socket) {
            this.socket.emit('leave-disputes-monitoring');
        }
    }

    sendDisputeMessage(disputeId, message, attachments = []) {
        if (this.socket && disputeId && message) {
            this.socket.emit('send-dispute-message', {
                disputeId,
                message,
                attachments
            });
        }
    }

    sendTypingIndicator(disputeId, isTyping) {
        if (this.socket && disputeId) {
            this.socket.emit('dispute-typing', {
                disputeId,
                isTyping
            });
        }
    }

    // Event listeners
    onDisputeMessageReceived(callback) {
        if (this.socket) {
            this.socket.on('dispute-message-received', callback);
        }
    }

    onDisputeStatusChanged(callback) {
        if (this.socket) {
            this.socket.on('dispute-status-changed', callback);
        }
    }

    onDisputeResolved(callback) {
        if (this.socket) {
            this.socket.on('dispute-resolved', callback);
        }
    }

    onDisputeEscalated(callback) {
        if (this.socket) {
            this.socket.on('dispute-escalated', callback);
        }
    }

    onDisputeNotification(callback) {
        if (this.socket) {
            this.socket.on('dispute-notification', callback);
        }
    }

    onDisputeActivity(callback) {
        if (this.socket) {
            this.socket.on('dispute-activity', callback);
        }
    }

    onTypingIndicator(callback) {
        if (this.socket) {
            this.socket.on('dispute-typing-indicator', callback);
        }
    }

    // Remove event listeners
    offDisputeMessageReceived() {
        if (this.socket) {
            this.socket.off('dispute-message-received');
        }
    }

    offDisputeStatusChanged() {
        if (this.socket) {
            this.socket.off('dispute-status-changed');
        }
    }

    offDisputeResolved() {
        if (this.socket) {
            this.socket.off('dispute-resolved');
        }
    }

    offDisputeEscalated() {
        if (this.socket) {
            this.socket.off('dispute-escalated');
        }
    }

    offDisputeNotification() {
        if (this.socket) {
            this.socket.off('dispute-notification');
        }
    }

    offDisputeActivity() {
        if (this.socket) {
            this.socket.off('dispute-activity');
        }
    }

    offTypingIndicator() {
        if (this.socket) {
            this.socket.off('dispute-typing-indicator');
        }
    }

    // Test connection
    testConnection() {
        if (this.socket) {
            this.socket.emit('test-connection', { timestamp: new Date() });
            this.socket.on('test-response', (data) => {
                console.log('Socket test response:', data);
            });
        }
    }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;