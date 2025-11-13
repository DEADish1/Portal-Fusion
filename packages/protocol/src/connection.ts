import {
  Device,
  Connection,
  ConnectionProtocol,
  DeviceStatus,
  Message,
  MessageType,
  PortalFusionEvents,
} from '@portal-fusion/shared';
import {
  createError,
  TypedEventEmitter,
  retry,
  timeout,
} from '@portal-fusion/shared';
import {
  CONNECTION_TIMEOUT,
  HEARTBEAT_INTERVAL,
  RECONNECT_INTERVAL,
  MAX_RECONNECT_ATTEMPTS,
} from '@portal-fusion/shared';
import { protocolService } from './protocol';
import { webrtcService } from './webrtc';
import WebSocket from 'ws';

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
export class ConnectionManager extends TypedEventEmitter<PortalFusionEvents> {
  private connections: Map<string, Connection> = new Map();
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  private websockets: Map<string, WebSocket> = new Map();
  private localDevice?: Device;
  private options: Required<ConnectionOptions>;

  constructor(options: ConnectionOptions = {}) {
    super();

    this.options = {
      protocol: options.protocol || ConnectionProtocol.WEBRTC,
      timeout: options.timeout || CONNECTION_TIMEOUT,
      heartbeatInterval: options.heartbeatInterval || HEARTBEAT_INTERVAL,
      reconnectInterval: options.reconnectInterval || RECONNECT_INTERVAL,
      maxReconnectAttempts: options.maxReconnectAttempts || MAX_RECONNECT_ATTEMPTS,
      autoReconnect: options.autoReconnect !== false,
    };

    this.setupWebRTCListeners();
  }

  /**
   * Set local device
   */
  setLocalDevice(device: Device): void {
    this.localDevice = device;
  }

  /**
   * Setup WebRTC event listeners
   */
  private setupWebRTCListeners(): void {
    webrtcService.on('device:connected', (device) => {
      this.handleConnectionEstablished(device);
    });

    webrtcService.on('device:disconnected', (device) => {
      this.handleConnectionLost(device);
    });

    webrtcService.on('message:received', (message) => {
      this.handleMessage(message);
    });

    webrtcService.on('error', (error) => {
      this.emit('error', error);
    });
  }

  /**
   * Connect to a device
   */
  async connect(remoteDevice: Device): Promise<Connection> {
    if (!this.localDevice) {
      throw createError('SYSTEM_OPERATION_FAILED', 'Local device not set');
    }

    // Check if already connected
    const existing = this.connections.get(remoteDevice.id);
    if (existing) {
      return existing;
    }

    console.log(`🔗 Connecting to ${remoteDevice.name}...`);

    try {
      // Use timeout to prevent hanging
      return await timeout(
        this.establishConnection(remoteDevice),
        this.options.timeout,
        createError('CONNECTION_TIMEOUT', 'Connection timeout')
      );
    } catch (error) {
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
  private async establishConnection(remoteDevice: Device): Promise<Connection> {
    if (!this.localDevice) {
      throw createError('SYSTEM_OPERATION_FAILED', 'Local device not set');
    }

    // Generate session key
    const sessionKey = protocolService.generateSessionKey(
      this.localDevice.publicKey,
      remoteDevice.publicKey
    );
    protocolService.setSessionKey(remoteDevice.id, sessionKey);

    // Create connection based on protocol
    let webrtcConnection;
    if (this.options.protocol === ConnectionProtocol.WEBRTC) {
      webrtcConnection = webrtcService.createConnection(this.localDevice, remoteDevice);
    } else if (this.options.protocol === ConnectionProtocol.WEBSOCKET) {
      await this.createWebSocketConnection(remoteDevice);
    } else {
      throw createError(
        'PROTOCOL_UNSUPPORTED_FEATURE',
        `Protocol ${this.options.protocol} not supported`
      );
    }

    // Create connection object
    const connection: Connection = {
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
  private async createWebSocketConnection(remoteDevice: Device): Promise<void> {
    const ws = new WebSocket(`ws://${remoteDevice.ip}:${remoteDevice.port}`);

    ws.on('open', () => {
      console.log(`🔌 WebSocket connected to ${remoteDevice.name}`);
      this.websockets.set(remoteDevice.id, ws);
      this.handleConnectionEstablished(remoteDevice);
    });

    ws.on('message', (data: Buffer) => {
      try {
        const message: Message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
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
      this.emit('error', createError('CONNECTION_FAILED', error.message, error));
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
  private handleConnectionEstablished(device: Device): void {
    const connection = this.connections.get(device.id);
    if (connection) {
      console.log(`✅ Connected to ${device.name}`);
      device.status = DeviceStatus.ONLINE;
      this.reconnectAttempts.delete(device.id);
      this.clearReconnectTimer(device.id);
      this.emit('device:connected', device);
    }
  }

  /**
   * Handle connection lost
   */
  private handleConnectionLost(device: Device): void {
    const connection = this.connections.get(device.id);
    if (connection) {
      console.log(`❌ Lost connection to ${device.name}`);
      device.status = DeviceStatus.DISCONNECTED;
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
  private scheduleReconnect(device: Device): void {
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
      } catch (error) {
        console.error(`Reconnect attempt ${attempts + 1} failed:`, error);
      }
    }, delay);

    this.reconnectTimers.set(device.id, timer);
  }

  /**
   * Clear reconnect timer
   */
  private clearReconnectTimer(deviceId: string): void {
    const timer = this.reconnectTimers.get(deviceId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(deviceId);
    }
  }

  /**
   * Send handshake message
   */
  private async sendHandshake(device: Device): Promise<void> {
    if (!this.localDevice) return;

    const message = protocolService.createHandshake(this.localDevice, device);
    await this.sendMessage(device.id, message);
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(device: Device): void {
    if (!this.localDevice) return;

    const interval = setInterval(() => {
      const message = protocolService.createHeartbeat(this.localDevice!, device);
      this.sendMessage(device.id, message).catch((error) => {
        console.error(`Heartbeat failed for ${device.name}:`, error);
      });
    }, this.options.heartbeatInterval);

    this.heartbeatIntervals.set(device.id, interval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(deviceId: string): void {
    const interval = this.heartbeatIntervals.get(deviceId);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(deviceId);
    }
  }

  /**
   * Send message to device
   */
  async sendMessage(deviceId: string, message: Message): Promise<void> {
    const connection = this.connections.get(deviceId);
    if (!connection) {
      throw createError('CONNECTION_FAILED', `Not connected to device ${deviceId}`);
    }

    // Encode message
    const encoded = protocolService.encode(message, deviceId);

    // Send based on protocol
    let success = false;
    if (connection.protocol === ConnectionProtocol.WEBRTC) {
      success = webrtcService.send(deviceId, encoded.data);
    } else if (connection.protocol === ConnectionProtocol.WEBSOCKET) {
      const ws = this.websockets.get(deviceId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(encoded.data);
        success = true;
      }
    }

    if (success) {
      connection.stats.messagesSent++;
      connection.stats.bytesSent += encoded.data.length;
      this.emit('message:sent', message);
    } else {
      connection.stats.errors++;
      throw createError('CONNECTION_FAILED', 'Failed to send message');
    }
  }

  /**
   * Handle received message
   */
  private handleMessage(message: Message): void {
    const connection = this.connections.get(message.from);
    if (connection) {
      connection.stats.messagesReceived++;
      connection.stats.bytesReceived += JSON.stringify(message).length;
    }

    // Handle system messages
    if (message.type === MessageType.HEARTBEAT) {
      // Update last seen
      if (connection) {
        connection.remoteDevice.lastSeen = new Date();
      }
      return;
    }

    if (message.type === MessageType.HANDSHAKE) {
      console.log(`🤝 Received handshake from ${message.from}`);
      return;
    }

    // Emit message event
    this.emit('message:received', message);

    // Send ACK if required
    if (message.requiresAck && this.localDevice) {
      const ack = protocolService.createAck(message, this.localDevice);
      this.sendMessage(message.from, ack).catch((error) => {
        console.error('Failed to send ACK:', error);
      });
    }
  }

  /**
   * Disconnect from device
   */
  disconnect(deviceId: string): void {
    const connection = this.connections.get(deviceId);
    if (!connection) return;

    console.log(`🔌 Disconnecting from ${connection.remoteDevice.name}`);

    // Stop heartbeat
    this.stopHeartbeat(deviceId);

    // Clear reconnect timer
    this.clearReconnectTimer(deviceId);

    // Close connection
    if (connection.protocol === ConnectionProtocol.WEBRTC) {
      webrtcService.closeConnectionByDevice(deviceId);
    } else if (connection.protocol === ConnectionProtocol.WEBSOCKET) {
      const ws = this.websockets.get(deviceId);
      if (ws) {
        ws.close();
        this.websockets.delete(deviceId);
      }
    }

    // Remove session key
    protocolService.removeSessionKey(deviceId);

    // Remove connection
    this.connections.delete(deviceId);

    // Update device status
    connection.remoteDevice.status = DeviceStatus.DISCONNECTED;
  }

  /**
   * Generate fingerprint for public key
   */
  private generateFingerprint(publicKey: string): string {
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
  getConnection(deviceId: string): Connection | undefined {
    return this.connections.get(deviceId);
  }

  /**
   * Get all connections
   */
  getConnections(): Connection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get active connections
   */
  getActiveConnections(): Connection[] {
    return Array.from(this.connections.values()).filter(
      (conn) => conn.remoteDevice.status === DeviceStatus.ONLINE
    );
  }

  /**
   * Check if connected to device
   */
  isConnected(deviceId: string): boolean {
    const connection = this.connections.get(deviceId);
    return connection?.remoteDevice.status === DeviceStatus.ONLINE;
  }

  /**
   * Disconnect all
   */
  disconnectAll(): void {
    for (const deviceId of this.connections.keys()) {
      this.disconnect(deviceId);
    }
  }

  /**
   * Destroy manager
   */
  destroy(): void {
    this.disconnectAll();
    this.removeAllListeners();
  }
}

// Export singleton instance
export const connectionManager = new ConnectionManager();
