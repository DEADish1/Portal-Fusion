import { Message, MessageType, MessagePriority, Device } from '@portal-fusion/shared';
import { createError, createMessage, shouldCompress, TypedEventEmitter } from '@portal-fusion/shared';
import { PortalFusionEvents } from '@portal-fusion/shared';
import { encryptionService } from '@portal-fusion/security';
import * as msgpack from 'msgpackr';
import * as pako from 'pako';

export interface ProtocolOptions {
  enableEncryption?: boolean;
  enableCompression?: boolean;
  compressionThreshold?: number;
  maxMessageSize?: number;
}

export interface EncodedMessage {
  data: Buffer;
  metadata: {
    encrypted: boolean;
    compressed: boolean;
    timestamp: number;
  };
}

/**
 * Protocol Service
 * Handles message encoding, encryption, compression, and validation
 */
export class ProtocolService extends TypedEventEmitter<PortalFusionEvents> {
  private options: Required<ProtocolOptions>;
  private sessionKeys: Map<string, Buffer> = new Map();

  constructor(options: ProtocolOptions = {}) {
    super();

    this.options = {
      enableEncryption: options.enableEncryption !== false,
      enableCompression: options.enableCompression !== false,
      compressionThreshold: options.compressionThreshold || 1024,
      maxMessageSize: options.maxMessageSize || 10 * 1024 * 1024, // 10MB
    };
  }

  /**
   * Set session key for a device
   */
  setSessionKey(deviceId: string, key: Buffer): void {
    this.sessionKeys.set(deviceId, key);
  }

  /**
   * Get session key for a device
   */
  getSessionKey(deviceId: string): Buffer | undefined {
    return this.sessionKeys.get(deviceId);
  }

  /**
   * Remove session key for a device
   */
  removeSessionKey(deviceId: string): void {
    this.sessionKeys.delete(deviceId);
  }

  /**
   * Encode a message for transmission
   */
  encode(message: Message, targetDeviceId?: string): EncodedMessage {
    try {
      // Validate message
      this.validateMessage(message);

      // Serialize message to MessagePack (more efficient than JSON)
      let data = msgpack.pack(message);

      // Compress if enabled and size exceeds threshold
      let compressed = false;
      if (this.options.enableCompression && data.length > this.options.compressionThreshold) {
        data = Buffer.from(pako.deflate(data));
        compressed = true;
      }

      // Encrypt if enabled and session key is available
      let encrypted = false;
      if (this.options.enableEncryption && targetDeviceId) {
        const sessionKey = this.sessionKeys.get(targetDeviceId);
        if (sessionKey) {
          const { encrypted: encryptedData, iv, tag } = encryptionService.encrypt(
            data,
            sessionKey
          );

          // Pack encrypted data with IV and tag
          data = msgpack.pack({
            encrypted: encryptedData,
            iv,
            tag,
          });

          encrypted = true;
        }
      }

      // Check size limit
      if (data.length > this.options.maxMessageSize) {
        throw createError(
          'PROTOCOL_INVALID_MESSAGE',
          `Message size (${data.length}) exceeds limit (${this.options.maxMessageSize})`
        );
      }

      return {
        data,
        metadata: {
          encrypted,
          compressed,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      throw createError('PROTOCOL_INVALID_MESSAGE', 'Failed to encode message', error);
    }
  }

  /**
   * Decode a received message
   */
  decode(encodedMessage: EncodedMessage, sourceDeviceId?: string): Message {
    try {
      let data = encodedMessage.data;

      // Decrypt if encrypted
      if (encodedMessage.metadata.encrypted && sourceDeviceId) {
        const sessionKey = this.sessionKeys.get(sourceDeviceId);
        if (!sessionKey) {
          throw createError('AUTH_FAILED', 'No session key for device');
        }

        // Unpack encrypted data
        const encryptedPayload = msgpack.unpack(data);

        // Decrypt
        data = encryptionService.decrypt(
          encryptedPayload.encrypted,
          sessionKey,
          encryptedPayload.iv,
          encryptedPayload.tag
        );
      }

      // Decompress if compressed
      if (encodedMessage.metadata.compressed) {
        data = Buffer.from(pako.inflate(data));
      }

      // Deserialize from MessagePack
      const message = msgpack.unpack(data);

      // Revive dates
      if (message.timestamp) {
        message.timestamp = new Date(message.timestamp);
      }

      // Validate decoded message
      this.validateMessage(message);

      return message;
    } catch (error) {
      throw createError('PROTOCOL_INVALID_MESSAGE', 'Failed to decode message', error);
    }
  }

  /**
   * Validate message structure
   */
  private validateMessage(message: any): asserts message is Message {
    if (!message || typeof message !== 'object') {
      throw createError('PROTOCOL_INVALID_MESSAGE', 'Message must be an object');
    }

    if (!message.id || typeof message.id !== 'string') {
      throw createError('PROTOCOL_INVALID_MESSAGE', 'Message must have a valid ID');
    }

    if (!message.type || !Object.values(MessageType).includes(message.type)) {
      throw createError('PROTOCOL_INVALID_MESSAGE', 'Message must have a valid type');
    }

    if (!message.from || typeof message.from !== 'string') {
      throw createError('PROTOCOL_INVALID_MESSAGE', 'Message must have a valid sender');
    }

    if (!message.to || typeof message.to !== 'string') {
      throw createError('PROTOCOL_INVALID_MESSAGE', 'Message must have a valid recipient');
    }

    if (message.payload === undefined) {
      throw createError('PROTOCOL_INVALID_MESSAGE', 'Message must have a payload');
    }
  }

  /**
   * Create a handshake message
   */
  createHandshake(localDevice: Device, remoteDevice: Device): Message {
    return createMessage(
      MessageType.HANDSHAKE,
      {
        device: localDevice,
        protocolVersion: '1.0',
        timestamp: Date.now(),
      },
      {
        from: localDevice.id,
        to: remoteDevice.id,
        priority: MessagePriority.URGENT,
        requiresAck: true,
      }
    );
  }

  /**
   * Create a heartbeat message
   */
  createHeartbeat(localDevice: Device, remoteDevice: Device): Message {
    return createMessage(
      MessageType.HEARTBEAT,
      {
        timestamp: Date.now(),
      },
      {
        from: localDevice.id,
        to: remoteDevice.id,
        priority: MessagePriority.LOW,
        requiresAck: false,
      }
    );
  }

  /**
   * Create an acknowledgment message
   */
  createAck(originalMessage: Message, localDevice: Device): Message {
    return createMessage(
      MessageType.ACK,
      {
        originalMessageId: originalMessage.id,
        timestamp: Date.now(),
      },
      {
        from: localDevice.id,
        to: originalMessage.from,
        priority: MessagePriority.HIGH,
        requiresAck: false,
      }
    );
  }

  /**
   * Create an error message
   */
  createError(
    error: Error,
    localDevice: Device,
    remoteDevice: Device,
    originalMessageId?: string
  ): Message {
    return createMessage(
      MessageType.ERROR,
      {
        error: {
          code: (error as any).code || 'UNKNOWN_ERROR',
          message: error.message,
          details: (error as any).details,
        },
        originalMessageId,
        timestamp: Date.now(),
      },
      {
        from: localDevice.id,
        to: remoteDevice.id,
        priority: MessagePriority.HIGH,
        requiresAck: false,
      }
    );
  }

  /**
   * Generate session key for device-to-device communication
   */
  generateSessionKey(localPrivateKey: string, remotePublicKey: string): Buffer {
    // Use ECDH to generate shared secret
    const ecdh = encryptionService.generateECDHKeyPair();
    const sharedSecret = ecdh.getSharedSecret(remotePublicKey);

    // Derive session key from shared secret
    return encryptionService.hash(sharedSecret);
  }

  /**
   * Get message statistics
   */
  getStats(): {
    totalSessionKeys: number;
    encryptionEnabled: boolean;
    compressionEnabled: boolean;
  } {
    return {
      totalSessionKeys: this.sessionKeys.size,
      encryptionEnabled: this.options.enableEncryption,
      compressionEnabled: this.options.enableCompression,
    };
  }
}

// Export singleton instance
export const protocolService = new ProtocolService();
