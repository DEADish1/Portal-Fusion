"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webrtcService = exports.WebRTCService = void 0;
const simple_peer_1 = __importDefault(require("simple-peer"));
const shared_1 = require("@portal-fusion/shared");
/**
 * WebRTC Service for P2P Connections
 * Handles peer-to-peer connections using WebRTC
 */
class WebRTCService extends shared_1.TypedEventEmitter {
    constructor(options = {}) {
        super();
        this.connections = new Map();
        this.options = {
            iceServers: options.iceServers || [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
            ],
            enableDataChannel: options.enableDataChannel !== false,
            enableVideo: options.enableVideo || false,
            enableAudio: options.enableAudio || false,
            channelConfig: options.channelConfig || {
                ordered: true,
                maxRetransmits: 3,
            },
        };
    }
    /**
     * Create a new peer connection as initiator
     */
    createConnection(localDevice, remoteDevice) {
        const connectionId = `${localDevice.id}-${remoteDevice.id}`;
        // Check if connection already exists
        if (this.connections.has(connectionId)) {
            const existing = this.connections.get(connectionId);
            if (existing.status === 'connected') {
                return existing;
            }
            // Close existing connection
            this.closeConnection(connectionId);
        }
        const peer = new simple_peer_1.default({
            initiator: true,
            trickle: true,
            config: {
                iceServers: this.options.iceServers,
            },
            channelConfig: this.options.channelConfig,
        });
        const connection = {
            id: connectionId,
            peer,
            device: remoteDevice,
            status: 'connecting',
            createdAt: new Date(),
            stats: {
                bytesSent: 0,
                bytesReceived: 0,
                messagesSent: 0,
                messagesReceived: 0,
            },
        };
        this.setupPeerHandlers(connection, localDevice);
        this.connections.set(connectionId, connection);
        console.log(`📡 Creating WebRTC connection to ${remoteDevice.name}`);
        return connection;
    }
    /**
     * Join a peer connection (non-initiator)
     */
    joinConnection(localDevice, remoteDevice, signalData) {
        const connectionId = `${localDevice.id}-${remoteDevice.id}`;
        // Check if connection already exists
        if (this.connections.has(connectionId)) {
            const existing = this.connections.get(connectionId);
            if (existing.status === 'connected') {
                return existing;
            }
            // Close existing connection
            this.closeConnection(connectionId);
        }
        const peer = new simple_peer_1.default({
            initiator: false,
            trickle: true,
            config: {
                iceServers: this.options.iceServers,
            },
            channelConfig: this.options.channelConfig,
        });
        const connection = {
            id: connectionId,
            peer,
            device: remoteDevice,
            status: 'connecting',
            createdAt: new Date(),
            stats: {
                bytesSent: 0,
                bytesReceived: 0,
                messagesSent: 0,
                messagesReceived: 0,
            },
        };
        this.setupPeerHandlers(connection, localDevice);
        this.connections.set(connectionId, connection);
        // Signal with remote offer
        peer.signal(signalData);
        console.log(`📡 Joining WebRTC connection from ${remoteDevice.name}`);
        return connection;
    }
    /**
     * Setup peer event handlers
     */
    setupPeerHandlers(connection, localDevice) {
        const { peer, device } = connection;
        // Signal event - emit signaling data
        peer.on('signal', (data) => {
            console.log(`📤 WebRTC signal for ${device.name}`);
            this.emit('webrtc:signal', { deviceId: device.id, signal: data });
        });
        // Connect event
        peer.on('connect', () => {
            connection.status = 'connected';
            connection.connectedAt = new Date();
            console.log(`✅ WebRTC connected to ${device.name}`);
            this.emit('device:connected', device);
        });
        // Data event
        peer.on('data', (data) => {
            connection.stats.bytesReceived += data.length;
            connection.stats.messagesReceived++;
            try {
                // Parse message
                const message = JSON.parse(data.toString());
                this.emit('message:received', message);
            }
            catch (error) {
                console.error('Failed to parse WebRTC message:', error);
            }
        });
        // Stream event (for video/audio)
        peer.on('stream', (stream) => {
            console.log(`🎥 Received media stream from ${device.name}`);
            this.emit('webrtc:stream', { deviceId: device.id, stream });
        });
        // Error event
        peer.on('error', (error) => {
            console.error(`❌ WebRTC error with ${device.name}:`, error);
            connection.status = 'failed';
            this.emit('error', (0, shared_1.createError)('CONNECTION_FAILED', error.message, error));
        });
        // Close event
        peer.on('close', () => {
            connection.status = 'disconnected';
            console.log(`👋 WebRTC disconnected from ${device.name}`);
            this.emit('device:disconnected', device);
            this.connections.delete(connection.id);
        });
    }
    /**
     * Send data through WebRTC connection
     */
    send(deviceId, data) {
        const connection = this.findConnectionByDevice(deviceId);
        if (!connection) {
            console.error(`No WebRTC connection for device ${deviceId}`);
            return false;
        }
        if (connection.status !== 'connected') {
            console.error(`WebRTC connection not ready for device ${deviceId}`);
            return false;
        }
        try {
            const dataBuffer = typeof data === 'string' ? Buffer.from(data) : data;
            connection.peer.send(dataBuffer);
            connection.stats.bytesSent += dataBuffer.length;
            connection.stats.messagesSent++;
            return true;
        }
        catch (error) {
            console.error(`Failed to send data via WebRTC:`, error);
            return false;
        }
    }
    /**
     * Send message through WebRTC connection
     */
    sendMessage(deviceId, message) {
        return this.send(deviceId, JSON.stringify(message));
    }
    /**
     * Signal with remote peer
     */
    signal(deviceId, signalData) {
        const connection = this.findConnectionByDevice(deviceId);
        if (!connection) {
            throw (0, shared_1.createError)('CONNECTION_FAILED', `No connection for device ${deviceId}`);
        }
        connection.peer.signal(signalData);
    }
    /**
     * Close a connection
     */
    closeConnection(connectionId) {
        const connection = this.connections.get(connectionId);
        if (connection) {
            connection.peer.destroy();
            this.connections.delete(connectionId);
            console.log(`🔌 Closed WebRTC connection ${connectionId}`);
        }
    }
    /**
     * Close connection by device ID
     */
    closeConnectionByDevice(deviceId) {
        const connection = this.findConnectionByDevice(deviceId);
        if (connection) {
            this.closeConnection(connection.id);
        }
    }
    /**
     * Find connection by device ID
     */
    findConnectionByDevice(deviceId) {
        for (const connection of this.connections.values()) {
            if (connection.device.id === deviceId) {
                return connection;
            }
        }
        return undefined;
    }
    /**
     * Get connection by device ID
     */
    getConnection(deviceId) {
        return this.findConnectionByDevice(deviceId);
    }
    /**
     * Get all connections
     */
    getConnections() {
        return Array.from(this.connections.values());
    }
    /**
     * Get active connections
     */
    getActiveConnections() {
        return Array.from(this.connections.values()).filter((conn) => conn.status === 'connected');
    }
    /**
     * Check if connected to device
     */
    isConnected(deviceId) {
        const connection = this.findConnectionByDevice(deviceId);
        return connection?.status === 'connected';
    }
    /**
     * Get connection stats
     */
    getStats(deviceId) {
        const connection = this.findConnectionByDevice(deviceId);
        return connection?.stats || null;
    }
    /**
     * Close all connections
     */
    closeAll() {
        for (const [id] of this.connections) {
            this.closeConnection(id);
        }
    }
    /**
     * Destroy service
     */
    destroy() {
        this.closeAll();
        this.removeAllListeners();
    }
}
exports.WebRTCService = WebRTCService;
// Export singleton instance
exports.webrtcService = new WebRTCService();
//# sourceMappingURL=webrtc.js.map