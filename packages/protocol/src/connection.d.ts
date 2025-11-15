import { Device, Connection, ConnectionProtocol, Message, PortalFusionEvents } from '@portal-fusion/shared';
import { TypedEventEmitter } from '@portal-fusion/shared';
export interface ConnectionOptions {
    protocol?: ConnectionProtocol;
    timeout?: number;
    heartbeatInterval?: number;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
    autoReconnect?: boolean;
}
/**
 * Connection Manager
 * Manages device connections with auto-reconnection
 */
export declare class ConnectionManager extends TypedEventEmitter<PortalFusionEvents> {
    private connections;
    private heartbeatIntervals;
    private reconnectAttempts;
    private reconnectTimers;
    private websockets;
    private localDevice?;
    private options;
    constructor(options?: ConnectionOptions);
    /**
     * Set local device
     */
    setLocalDevice(device: Device): void;
    /**
     * Setup WebRTC event listeners
     */
    private setupWebRTCListeners;
    /**
     * Connect to a device
     */
    connect(remoteDevice: Device): Promise<Connection>;
    /**
     * Establish connection to device
     */
    private establishConnection;
    /**
     * Create WebSocket connection
     */
    private createWebSocketConnection;
    /**
     * Handle connection established
     */
    private handleConnectionEstablished;
    /**
     * Handle connection lost
     */
    private handleConnectionLost;
    /**
     * Schedule reconnection attempt
     */
    private scheduleReconnect;
    /**
     * Clear reconnect timer
     */
    private clearReconnectTimer;
    /**
     * Send handshake message
     */
    private sendHandshake;
    /**
     * Start heartbeat
     */
    private startHeartbeat;
    /**
     * Stop heartbeat
     */
    private stopHeartbeat;
    /**
     * Send message to device
     */
    sendMessage(deviceId: string, message: Message): Promise<void>;
    /**
     * Handle received message
     */
    private handleMessage;
    /**
     * Disconnect from device
     */
    disconnect(deviceId: string): void;
    /**
     * Generate fingerprint for public key
     */
    private generateFingerprint;
    /**
     * Get connection
     */
    getConnection(deviceId: string): Connection | undefined;
    /**
     * Get all connections
     */
    getConnections(): Connection[];
    /**
     * Get active connections
     */
    getActiveConnections(): Connection[];
    /**
     * Check if connected to device
     */
    isConnected(deviceId: string): boolean;
    /**
     * Disconnect all
     */
    disconnectAll(): void;
    /**
     * Destroy manager
     */
    destroy(): void;
}
export declare const connectionManager: ConnectionManager;
//# sourceMappingURL=connection.d.ts.map