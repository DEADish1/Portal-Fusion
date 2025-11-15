"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.protocolService = exports.ProtocolService = void 0;
const shared_1 = require("@portal-fusion/shared");
const shared_2 = require("@portal-fusion/shared");
const security_1 = require("@portal-fusion/security");
const msgpack = __importStar(require("msgpackr"));
const pako = __importStar(require("pako"));
/**
 * Protocol Service
 * Handles message encoding, encryption, compression, and validation
 */
class ProtocolService extends shared_2.TypedEventEmitter {
    constructor(options = {}) {
        super();
        this.sessionKeys = new Map();
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
    setSessionKey(deviceId, key) {
        this.sessionKeys.set(deviceId, key);
    }
    /**
     * Get session key for a device
     */
    getSessionKey(deviceId) {
        return this.sessionKeys.get(deviceId);
    }
    /**
     * Remove session key for a device
     */
    removeSessionKey(deviceId) {
        this.sessionKeys.delete(deviceId);
    }
    /**
     * Encode a message for transmission
     */
    encode(message, targetDeviceId) {
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
                    const { encrypted: encryptedData, iv, tag } = security_1.encryptionService.encrypt(data, sessionKey);
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
                throw (0, shared_2.createError)('PROTOCOL_INVALID_MESSAGE', `Message size (${data.length}) exceeds limit (${this.options.maxMessageSize})`);
            }
            return {
                data,
                metadata: {
                    encrypted,
                    compressed,
                    timestamp: Date.now(),
                },
            };
        }
        catch (error) {
            throw (0, shared_2.createError)('PROTOCOL_INVALID_MESSAGE', 'Failed to encode message', error);
        }
    }
    /**
     * Decode a received message
     */
    decode(encodedMessage, sourceDeviceId) {
        try {
            let data = encodedMessage.data;
            // Decrypt if encrypted
            if (encodedMessage.metadata.encrypted && sourceDeviceId) {
                const sessionKey = this.sessionKeys.get(sourceDeviceId);
                if (!sessionKey) {
                    throw (0, shared_2.createError)('AUTH_FAILED', 'No session key for device');
                }
                // Unpack encrypted data
                const encryptedPayload = msgpack.unpack(data);
                // Decrypt
                data = security_1.encryptionService.decrypt(encryptedPayload.encrypted, sessionKey, encryptedPayload.iv, encryptedPayload.tag);
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
        }
        catch (error) {
            throw (0, shared_2.createError)('PROTOCOL_INVALID_MESSAGE', 'Failed to decode message', error);
        }
    }
    /**
     * Validate message structure
     */
    validateMessage(message) {
        if (!message || typeof message !== 'object') {
            throw (0, shared_2.createError)('PROTOCOL_INVALID_MESSAGE', 'Message must be an object');
        }
        if (!message.id || typeof message.id !== 'string') {
            throw (0, shared_2.createError)('PROTOCOL_INVALID_MESSAGE', 'Message must have a valid ID');
        }
        if (!message.type || !Object.values(shared_1.MessageType).includes(message.type)) {
            throw (0, shared_2.createError)('PROTOCOL_INVALID_MESSAGE', 'Message must have a valid type');
        }
        if (!message.from || typeof message.from !== 'string') {
            throw (0, shared_2.createError)('PROTOCOL_INVALID_MESSAGE', 'Message must have a valid sender');
        }
        if (!message.to || typeof message.to !== 'string') {
            throw (0, shared_2.createError)('PROTOCOL_INVALID_MESSAGE', 'Message must have a valid recipient');
        }
        if (message.payload === undefined) {
            throw (0, shared_2.createError)('PROTOCOL_INVALID_MESSAGE', 'Message must have a payload');
        }
    }
    /**
     * Create a handshake message
     */
    createHandshake(localDevice, remoteDevice) {
        return (0, shared_2.createMessage)(shared_1.MessageType.HANDSHAKE, {
            device: localDevice,
            protocolVersion: '1.0',
            timestamp: Date.now(),
        }, {
            from: localDevice.id,
            to: remoteDevice.id,
            priority: shared_1.MessagePriority.URGENT,
            requiresAck: true,
        });
    }
    /**
     * Create a heartbeat message
     */
    createHeartbeat(localDevice, remoteDevice) {
        return (0, shared_2.createMessage)(shared_1.MessageType.HEARTBEAT, {
            timestamp: Date.now(),
        }, {
            from: localDevice.id,
            to: remoteDevice.id,
            priority: shared_1.MessagePriority.LOW,
            requiresAck: false,
        });
    }
    /**
     * Create an acknowledgment message
     */
    createAck(originalMessage, localDevice) {
        return (0, shared_2.createMessage)(shared_1.MessageType.ACK, {
            originalMessageId: originalMessage.id,
            timestamp: Date.now(),
        }, {
            from: localDevice.id,
            to: originalMessage.from,
            priority: shared_1.MessagePriority.HIGH,
            requiresAck: false,
        });
    }
    /**
     * Create an error message
     */
    createError(error, localDevice, remoteDevice, originalMessageId) {
        return (0, shared_2.createMessage)(shared_1.MessageType.ERROR, {
            error: {
                code: error.code || 'UNKNOWN_ERROR',
                message: error.message,
                details: error.details,
            },
            originalMessageId,
            timestamp: Date.now(),
        }, {
            from: localDevice.id,
            to: remoteDevice.id,
            priority: shared_1.MessagePriority.HIGH,
            requiresAck: false,
        });
    }
    /**
     * Generate session key for device-to-device communication
     */
    generateSessionKey(localPrivateKey, remotePublicKey) {
        // Use ECDH to generate shared secret
        const ecdh = security_1.encryptionService.generateECDHKeyPair();
        const sharedSecret = ecdh.getSharedSecret(remotePublicKey);
        // Derive session key from shared secret
        return security_1.encryptionService.hash(sharedSecret);
    }
    /**
     * Get message statistics
     */
    getStats() {
        return {
            totalSessionKeys: this.sessionKeys.size,
            encryptionEnabled: this.options.enableEncryption,
            compressionEnabled: this.options.enableCompression,
        };
    }
}
exports.ProtocolService = ProtocolService;
// Export singleton instance
exports.protocolService = new ProtocolService();
//# sourceMappingURL=protocol.js.map