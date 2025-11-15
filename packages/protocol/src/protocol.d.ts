import { Message, Device } from '@portal-fusion/shared';
import { TypedEventEmitter } from '@portal-fusion/shared';
import { PortalFusionEvents } from '@portal-fusion/shared';
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
export declare class ProtocolService extends TypedEventEmitter<PortalFusionEvents> {
    private options;
    private sessionKeys;
    constructor(options?: ProtocolOptions);
    /**
     * Set session key for a device
     */
    setSessionKey(deviceId: string, key: Buffer): void;
    /**
     * Get session key for a device
     */
    getSessionKey(deviceId: string): Buffer | undefined;
    /**
     * Remove session key for a device
     */
    removeSessionKey(deviceId: string): void;
    /**
     * Encode a message for transmission
     */
    encode(message: Message, targetDeviceId?: string): EncodedMessage;
    /**
     * Decode a received message
     */
    decode(encodedMessage: EncodedMessage, sourceDeviceId?: string): Message;
    /**
     * Validate message structure
     */
    private validateMessage;
    /**
     * Create a handshake message
     */
    createHandshake(localDevice: Device, remoteDevice: Device): Message;
    /**
     * Create a heartbeat message
     */
    createHeartbeat(localDevice: Device, remoteDevice: Device): Message;
    /**
     * Create an acknowledgment message
     */
    createAck(originalMessage: Message, localDevice: Device): Message;
    /**
     * Create an error message
     */
    createError(error: Error, localDevice: Device, remoteDevice: Device, originalMessageId?: string): Message;
    /**
     * Generate session key for device-to-device communication
     */
    generateSessionKey(localPrivateKey: string, remotePublicKey: string): Buffer;
    /**
     * Get message statistics
     */
    getStats(): {
        totalSessionKeys: number;
        encryptionEnabled: boolean;
        compressionEnabled: boolean;
    };
}
export declare const protocolService: ProtocolService;
//# sourceMappingURL=protocol.d.ts.map