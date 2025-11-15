"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionManager = exports.ConnectionManager = void 0;
const shared_1 = require("@portal-fusion/shared");
const shared_2 = require("@portal-fusion/shared");
const shared_3 = require("@portal-fusion/shared");
const protocol_1 = require("./protocol");
const webrtc_1 = require("./webrtc");
const ws_1 = __importDefault(require("ws"));
/**
 * Connection Manager
 * Manages device connections with auto-reconnection
 */
class ConnectionManager extends shared_2.TypedEventEmitter {
    constructor(options = {}) {
        super();
        this.connections = new Map();
        this.heartbeatIntervals = new Map();
        this.reconnectAttempts = new Map();
        this.reconnectTimers = new Map();
        this.websockets = new Map();
        this.options = {
            protocol: options.protocol || shared_1.ConnectionProtocol.WEBRTC,
            timeout: options.timeout || shared_3.CONNECTION_TIMEOUT,
            heartbeatInterval: options.heartbeatInterval || shared_3.HEARTBEAT_INTERVAL,
            reconnectInterval: options.reconnectInterval || shared_3.RECONNECT_INTERVAL,
            maxReconnectAttempts: options.maxReconnectAttempts || shared_3.MAX_RECONNECT_ATTEMPTS,
            autoReconnect: options.autoReconnect !== false,
        };
        this.setupWebRTCListeners();
    }
    /**
     * Set local device
     */
    setLocalDevice(device) {
        this.localDevice = device;
    }
    /**
     * Setup WebRTC event listeners
     */
    setupWebRTCListeners() {
        webrtc_1.webrtcService.on('device:connected', (device) => {
            this.handleConnectionEstablished(device);
        });
        webrtc_1.webrtcService.on('device:disconnected', (device) => {
            this.handleConnectionLost(device);
        });
        webrtc_1.webrtcService.on('message:received', (message) => {
            this.handleMessage(message);
        });
        webrtc_1.webrtcService.on('error', (error) => {
            this.emit('error', error);
        });
    }
    /**
     * Connect to a device
     */
    async connect(remoteDevice) {
        if (!this.localDevice) {
            throw (0, shared_2.createError)('SYSTEM_OPERATION_FAILED', 'Local device not set');
        }
        // Check if already connected
        const existing = this.connections.get(remoteDevice.id);
        if (existing) {
            return existing;
        }
        console.log(`🔗 Connecting to ${remoteDevice.name}...`);
        try {
            // Use timeout to prevent hanging
            return await (0, shared_2.timeout)(this.establishConnection(remoteDevice), this.options.timeout, (0, shared_2.createError)('CONNECTION_TIMEOUT', 'Connection timeout'));
        }
        catch (error) {
            console.error(`Failed to connect to ${remoteDevice.name}:`, error);
            // Try auto-reconnect if enabled
            if (this.options.autoReconnect) {
                this.scheduleReconnect(remoteDevice);
            }
            throw error;
        }
    }
    /**
     * Establish connection to device
     */
    async establishConnection(remoteDevice) {
        if (!this.localDevice) {
            throw (0, shared_2.createError)('SYSTEM_OPERATION_FAILED', 'Local device not set');
        }
        // Generate session key
        const sessionKey = protocol_1.protocolService.generateSessionKey(this.localDevice.publicKey, remoteDevice.publicKey);
        protocol_1.protocolService.setSessionKey(remoteDevice.id, sessionKey);
        // Create connection based on protocol
        let webrtcConnection;
        if (this.options.protocol === shared_1.ConnectionProtocol.WEBRTC) {
            webrtcConnection = webrtc_1.webrtcService.createConnection(this.localDevice, remoteDevice);
        }
        else if (this.options.protocol === shared_1.ConnectionProtocol.WEBSOCKET) {
            await this.createWebSocketConnection(remoteDevice);
        }
        else {
            throw (0, shared_2.createError)('PROTOCOL_UNSUPPORTED_FEATURE', `Protocol ${this.options.protocol} not supported`);
        }
        // Create connection object
        const connection = {
            id: `${this.localDevice.id}-${remoteDevice.id}`,
            localDevice: this.localDevice,
            remoteDevice,
            protocol: this.options.protocol,
            encryption: {
                algorithm: 'aes-256-gcm',
                keyExchange: 'ecdh',
                publicKey: remoteDevice.publicKey,
                fingerprint: this.generateFingerprint(remoteDevice.publicKey),
                verified: remoteDevice.trusted,
            },
            quality: {
                latency: 0,
                bandwidth: 0,
                packetLoss: 0,
                jitter: 0,
                strength: 'good',
            },
            startedAt: new Date(),
            stats: {
                bytesSent: 0,
                bytesReceived: 0,
                messagesSent: 0,
                messagesReceived: 0,
                errors: 0,
                reconnects: this.reconnectAttempts.get(remoteDevice.id) || 0,
            },
        };
        this.connections.set(remoteDevice.id, connection);
        // Send handshake
        await this.sendHandshake(remoteDevice);
        // Start heartbeat
        this.startHeartbeat(remoteDevice);
        return connection;
    }
    /**
     * Create WebSocket connection
     */
    async createWebSocketConnection(remoteDevice) {
        const ws = new ws_1.default(`ws://${remoteDevice.ip}:${remoteDevice.port}`);
        ws.on('open', () => {
            console.log(`🔌 WebSocket connected to ${remoteDevice.name}`);
            this.websockets.set(remoteDevice.id, ws);
            this.handleConnectionEstablished(remoteDevice);
        });
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleMessage(message);
            }
            catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        });
        ws.on('close', () => {
            console.log(`🔌 WebSocket disconnected from ${remoteDevice.name}`);
            this.websockets.delete(remoteDevice.id);
            this.handleConnectionLost(remoteDevice);
        });
        ws.on('error', (error) => {
            console.error(`WebSocket error:`, error);
            this.emit('error', (0, shared_2.createError)('CONNECTION_FAILED', error.message, error));
        });
        // Wait for connection
        await new Promise((resolve, reject) => {
            ws.once('open', resolve);
            ws.once('error', reject);
        });
    }
    /**
     * Handle connection established
     */
    handleConnectionEstablished(device) {
        const connection = this.connections.get(device.id);
        if (connection) {
            console.log(`✅ Connected to ${device.name}`);
            device.status = shared_1.DeviceStatus.ONLINE;
            this.reconnectAttempts.delete(device.id);
            this.clearReconnectTimer(device.id);
            this.emit('device:connected', device);
        }
    }
    /**
     * Handle connection lost
     */
    handleConnectionLost(device) {
        const connection = this.connections.get(device.id);
        if (connection) {
            console.log(`❌ Lost connection to ${device.name}`);
            device.status = shared_1.DeviceStatus.DISCONNECTED;
            this.stopHeartbeat(device.id);
            this.emit('device:disconnected', device);
            // Try auto-reconnect if enabled
            if (this.options.autoReconnect) {
                this.scheduleReconnect(device);
            }
        }
    }
    /**
     * Schedule reconnection attempt
     */
    scheduleReconnect(device) {
        const attempts = this.reconnectAttempts.get(device.id) || 0;
        if (attempts >= this.options.maxReconnectAttempts) {
            console.log(`⛔ Max reconnect attempts reached for ${device.name}`);
            this.disconnect(device.id);
            return;
        }
        // Clear existing timer
        this.clearReconnectTimer(device.id);
        // Calculate backoff delay (exponential)
        const delay = this.options.reconnectInterval * Math.pow(2, attempts);
        console.log(`🔄 Scheduling reconnect to ${device.name} in ${delay}ms (attempt ${attempts + 1}/${this.options.maxReconnectAttempts})`);
        const timer = setTimeout(async () => {
            this.reconnectAttempts.set(device.id, attempts + 1);
            try {
                await this.connect(device);
            }
            catch (error) {
                console.error(`Reconnect attempt ${attempts + 1} failed:`, error);
            }
        }, delay);
        this.reconnectTimers.set(device.id, timer);
    }
    /**
     * Clear reconnect timer
     */
    clearReconnectTimer(deviceId) {
        const timer = this.reconnectTimers.get(deviceId);
        if (timer) {
            clearTimeout(timer);
            this.reconnectTimers.delete(deviceId);
        }
    }
    /**
     * Send handshake message
     */
    async sendHandshake(device) {
        if (!this.localDevice)
            return;
        const message = protocol_1.protocolService.createHandshake(this.localDevice, device);
        await this.sendMessage(device.id, message);
    }
    /**
     * Start heartbeat
     */
    startHeartbeat(device) {
        if (!this.localDevice)
            return;
        const interval = setInterval(() => {
            const message = protocol_1.protocolService.createHeartbeat(this.localDevice, device);
            this.sendMessage(device.id, message).catch((error) => {
                console.error(`Heartbeat failed for ${device.name}:`, error);
            });
        }, this.options.heartbeatInterval);
        this.heartbeatIntervals.set(device.id, interval);
    }
    /**
     * Stop heartbeat
     */
    stopHeartbeat(deviceId) {
        const interval = this.heartbeatIntervals.get(deviceId);
        if (interval) {
            clearInterval(interval);
            this.heartbeatIntervals.delete(deviceId);
        }
    }
    /**
     * Send message to device
     */
    async sendMessage(deviceId, message) {
        const connection = this.connections.get(deviceId);
        if (!connection) {
            throw (0, shared_2.createError)('CONNECTION_FAILED', `Not connected to device ${deviceId}`);
        }
        // Encode message
        const encoded = protocol_1.protocolService.encode(message, deviceId);
        // Send based on protocol
        let success = false;
        if (connection.protocol === shared_1.ConnectionProtocol.WEBRTC) {
            success = webrtc_1.webrtcService.send(deviceId, encoded.data);
        }
        else if (connection.protocol === shared_1.ConnectionProtocol.WEBSOCKET) {
            const ws = this.websockets.get(deviceId);
            if (ws && ws.readyState === ws_1.default.OPEN) {
                ws.send(encoded.data);
                success = true;
            }
        }
        if (success) {
            connection.stats.messagesSent++;
            connection.stats.bytesSent += encoded.data.length;
            this.emit('message:sent', message);
        }
        else {
            connection.stats.errors++;
            throw (0, shared_2.createError)('CONNECTION_FAILED', 'Failed to send message');
        }
    }
    /**
     * Handle received message
     */
    handleMessage(message) {
        const connection = this.connections.get(message.from);
        if (connection) {
            connection.stats.messagesReceived++;
            connection.stats.bytesReceived += JSON.stringify(message).length;
        }
        // Handle system messages
        if (message.type === shared_1.MessageType.HEARTBEAT) {
            // Update last seen
            if (connection) {
                connection.remoteDevice.lastSeen = new Date();
            }
            return;
        }
        if (message.type === shared_1.MessageType.HANDSHAKE) {
            console.log(`🤝 Received handshake from ${message.from}`);
            return;
        }
        // Emit message event
        this.emit('message:received', message);
        // Send ACK if required
        if (message.requiresAck && this.localDevice) {
            const ack = protocol_1.protocolService.createAck(message, this.localDevice);
            this.sendMessage(message.from, ack).catch((error) => {
                console.error('Failed to send ACK:', error);
            });
        }
    }
    /**
     * Disconnect from device
     */
    disconnect(deviceId) {
        const connection = this.connections.get(deviceId);
        if (!connection)
            return;
        console.log(`🔌 Disconnecting from ${connection.remoteDevice.name}`);
        // Stop heartbeat
        this.stopHeartbeat(deviceId);
        // Clear reconnect timer
        this.clearReconnectTimer(deviceId);
        // Close connection
        if (connection.protocol === shared_1.ConnectionProtocol.WEBRTC) {
            webrtc_1.webrtcService.closeConnectionByDevice(deviceId);
        }
        else if (connection.protocol === shared_1.ConnectionProtocol.WEBSOCKET) {
            const ws = this.websockets.get(deviceId);
            if (ws) {
                ws.close();
                this.websockets.delete(deviceId);
            }
        }
        // Remove session key
        protocol_1.protocolService.removeSessionKey(deviceId);
        // Remove connection
        this.connections.delete(deviceId);
        // Update device status
        connection.remoteDevice.status = shared_1.DeviceStatus.DISCONNECTED;
    }
    /**
     * Generate fingerprint for public key
     */
    generateFingerprint(publicKey) {
        const crypto = require('crypto');
        return crypto
            .createHash('sha256')
            .update(publicKey)
            .digest('hex')
            .toUpperCase()
            .match(/.{1,2}/g)
            .join(':');
    }
    /**
     * Get connection
     */
    getConnection(deviceId) {
        return this.connections.get(deviceId);
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
        return Array.from(this.connections.values()).filter((conn) => conn.remoteDevice.status === shared_1.DeviceStatus.ONLINE);
    }
    /**
     * Check if connected to device
     */
    isConnected(deviceId) {
        const connection = this.connections.get(deviceId);
        return connection?.remoteDevice.status === shared_1.DeviceStatus.ONLINE;
    }
    /**
     * Disconnect all
     */
    disconnectAll() {
        for (const deviceId of this.connections.keys()) {
            this.disconnect(deviceId);
        }
    }
    /**
     * Destroy manager
     */
    destroy() {
        this.disconnectAll();
        this.removeAllListeners();
    }
}
exports.ConnectionManager = ConnectionManager;
// Export singleton instance
exports.connectionManager = new ConnectionManager();
//# sourceMappingURL=connection.js.map