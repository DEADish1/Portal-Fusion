import SimplePeer, { Instance as PeerInstance, SignalData } from 'simple-peer';
import { Device, PortalFusionEvents, Message } from '@portal-fusion/shared';
import { createError, TypedEventEmitter } from '@portal-fusion/shared';
import { WEBRTC_PORT } from '@portal-fusion/shared';

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
export class WebRTCService extends TypedEventEmitter<PortalFusionEvents> {
  private connections: Map<string, PeerConnection> = new Map();
  private options: Required<WebRTCOptions>;

  constructor(options: WebRTCOptions = {}) {
    super();

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
  createConnection(localDevice: Device, remoteDevice: Device): PeerConnection {
    const connectionId = `${localDevice.id}-${remoteDevice.id}`;

    // Check if connection already exists
    if (this.connections.has(connectionId)) {
      const existing = this.connections.get(connectionId)!;
      if (existing.status === 'connected') {
        return existing;
      }
      // Close existing connection
      this.closeConnection(connectionId);
    }

    const peer = new SimplePeer({
      initiator: true,
      trickle: true,
      config: {
        iceServers: this.options.iceServers,
      },
      channelConfig: this.options.channelConfig,
    });

    const connection: PeerConnection = {
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
  joinConnection(
    localDevice: Device,
    remoteDevice: Device,
    signalData: SignalData
  ): PeerConnection {
    const connectionId = `${localDevice.id}-${remoteDevice.id}`;

    // Check if connection already exists
    if (this.connections.has(connectionId)) {
      const existing = this.connections.get(connectionId)!;
      if (existing.status === 'connected') {
        return existing;
      }
      // Close existing connection
      this.closeConnection(connectionId);
    }

    const peer = new SimplePeer({
      initiator: false,
      trickle: true,
      config: {
        iceServers: this.options.iceServers,
      },
      channelConfig: this.options.channelConfig,
    });

    const connection: PeerConnection = {
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
  private setupPeerHandlers(connection: PeerConnection, localDevice: Device): void {
    const { peer, device } = connection;

    // Signal event - emit signaling data
    peer.on('signal', (data: SignalData) => {
      console.log(`📤 WebRTC signal for ${device.name}`);
      this.emit('webrtc:signal', { deviceId: device.id, signal: data } as any);
    });

    // Connect event
    peer.on('connect', () => {
      connection.status = 'connected';
      connection.connectedAt = new Date();
      console.log(`✅ WebRTC connected to ${device.name}`);
      this.emit('device:connected', device);
    });

    // Data event
    peer.on('data', (data: Buffer) => {
      connection.stats.bytesReceived += data.length;
      connection.stats.messagesReceived++;

      try {
        // Parse message
        const message: Message = JSON.parse(data.toString());
        this.emit('message:received', message);
      } catch (error) {
        console.error('Failed to parse WebRTC message:', error);
      }
    });

    // Stream event (for video/audio)
    peer.on('stream', (stream: MediaStream) => {
      console.log(`🎥 Received media stream from ${device.name}`);
      this.emit('webrtc:stream', { deviceId: device.id, stream } as any);
    });

    // Error event
    peer.on('error', (error: Error) => {
      console.error(`❌ WebRTC error with ${device.name}:`, error);
      connection.status = 'failed';
      this.emit('error', createError('CONNECTION_FAILED', error.message, error));
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
  send(deviceId: string, data: Buffer | string): boolean {
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
    } catch (error) {
      console.error(`Failed to send data via WebRTC:`, error);
      return false;
    }
  }

  /**
   * Send message through WebRTC connection
   */
  sendMessage(deviceId: string, message: Message): boolean {
    return this.send(deviceId, JSON.stringify(message));
  }

  /**
   * Signal with remote peer
   */
  signal(deviceId: string, signalData: SignalData): void {
    const connection = this.findConnectionByDevice(deviceId);

    if (!connection) {
      throw createError('CONNECTION_FAILED', `No connection for device ${deviceId}`);
    }

    connection.peer.signal(signalData);
  }

  /**
   * Close a connection
   */
  closeConnection(connectionId: string): void {
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
  closeConnectionByDevice(deviceId: string): void {
    const connection = this.findConnectionByDevice(deviceId);

    if (connection) {
      this.closeConnection(connection.id);
    }
  }

  /**
   * Find connection by device ID
   */
  private findConnectionByDevice(deviceId: string): PeerConnection | undefined {
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
  getConnection(deviceId: string): PeerConnection | undefined {
    return this.findConnectionByDevice(deviceId);
  }

  /**
   * Get all connections
   */
  getConnections(): PeerConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get active connections
   */
  getActiveConnections(): PeerConnection[] {
    return Array.from(this.connections.values()).filter(
      (conn) => conn.status === 'connected'
    );
  }

  /**
   * Check if connected to device
   */
  isConnected(deviceId: string): boolean {
    const connection = this.findConnectionByDevice(deviceId);
    return connection?.status === 'connected';
  }

  /**
   * Get connection stats
   */
  getStats(deviceId: string): PeerConnection['stats'] | null {
    const connection = this.findConnectionByDevice(deviceId);
    return connection?.stats || null;
  }

  /**
   * Close all connections
   */
  closeAll(): void {
    for (const [id] of this.connections) {
      this.closeConnection(id);
    }
  }

  /**
   * Destroy service
   */
  destroy(): void {
    this.closeAll();
    this.removeAllListeners();
  }
}

// Export singleton instance
export const webrtcService = new WebRTCService();
