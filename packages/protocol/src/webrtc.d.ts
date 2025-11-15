import { Instance as PeerInstance, SignalData } from 'simple-peer';
import { Device, PortalFusionEvents, Message } from '@portal-fusion/shared';
import { TypedEventEmitter } from '@portal-fusion/shared';
export interface WebRTCOptions {
    iceServers?: RTCIceServer[];
    enableDataChannel?: boolean;
    enableVideo?: boolean;
    enableAudio?: boolean;
    channelConfig?: {
        ordered?: boolean;
        maxRetransmits?: number;
    };
}
export interface PeerConnection {
    id: string;
    peer: PeerInstance;
    device: Device;
    status: 'connecting' | 'connected' | 'disconnected' | 'failed';
    dataChannel?: RTCDataChannel;
    createdAt: Date;
    connectedAt?: Date;
    stats: {
        bytesSent: number;
        bytesReceived: number;
        messagesSent: number;
        messagesReceived: number;
    };
}
/**
 * WebRTC Service for P2P Connections
 * Handles peer-to-peer connections using WebRTC
 */
export declare class WebRTCService extends TypedEventEmitter<PortalFusionEvents> {
    private connections;
    private options;
    constructor(options?: WebRTCOptions);
    /**
     * Create a new peer connection as initiator
     */
    createConnection(localDevice: Device, remoteDevice: Device): PeerConnection;
    /**
     * Join a peer connection (non-initiator)
     */
    joinConnection(localDevice: Device, remoteDevice: Device, signalData: SignalData): PeerConnection;
    /**
     * Setup peer event handlers
     */
    private setupPeerHandlers;
    /**
     * Send data through WebRTC connection
     */
    send(deviceId: string, data: Buffer | string): boolean;
    /**
     * Send message through WebRTC connection
     */
    sendMessage(deviceId: string, message: Message): boolean;
    /**
     * Signal with remote peer
     */
    signal(deviceId: string, signalData: SignalData): void;
    /**
     * Close a connection
     */
    closeConnection(connectionId: string): void;
    /**
     * Close connection by device ID
     */
    closeConnectionByDevice(deviceId: string): void;
    /**
     * Find connection by device ID
     */
    private findConnectionByDevice;
    /**
     * Get connection by device ID
     */
    getConnection(deviceId: string): PeerConnection | undefined;
    /**
     * Get all connections
     */
    getConnections(): PeerConnection[];
    /**
     * Get active connections
     */
    getActiveConnections(): PeerConnection[];
    /**
     * Check if connected to device
     */
    isConnected(deviceId: string): boolean;
    /**
     * Get connection stats
     */
    getStats(deviceId: string): PeerConnection['stats'] | null;
    /**
     * Close all connections
     */
    closeAll(): void;
    /**
     * Destroy service
     */
    destroy(): void;
}
export declare const webrtcService: WebRTCService;
//# sourceMappingURL=webrtc.d.ts.map