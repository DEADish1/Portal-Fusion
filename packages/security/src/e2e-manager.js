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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.e2eManager = exports.E2EEncryptionManager = void 0;
const shared_1 = require("@portal-fusion/shared");
const encryption_1 = require("./encryption");
const crypto = __importStar(require("crypto"));
const electron_log_1 = __importDefault(require("electron-log"));
/**
 * End-to-End Encryption Manager
 * Manages E2E encrypted sessions with perfect forward secrecy
 */
class E2EEncryptionManager extends shared_1.TypedEventEmitter {
    constructor(options = {}) {
        super();
        this.sessions = new Map();
        this.options = {
            sessionTimeout: options.sessionTimeout || 60,
            keyRotationInterval: options.keyRotationInterval || 30,
            enablePerfectForwardSecrecy: options.enablePerfectForwardSecrecy !== false,
        };
    }
    /**
     * Initialize E2E encryption
     */
    async initialize() {
        // Start key rotation timer if enabled
        if (this.options.enablePerfectForwardSecrecy) {
            this.startKeyRotation();
        }
        electron_log_1.default.info('E2E Encryption Manager initialized');
    }
    /**
     * Establish E2E session with device
     */
    async establishSession(deviceId, theirPublicKey) {
        // Generate ECDH key pair for this session
        const ecdh = crypto.createECDH('secp521r1');
        ecdh.generateKeys();
        const ourPrivateKey = ecdh.getPrivateKey();
        const ourPublicKey = ecdh.getPublicKey();
        // Compute shared secret
        const sharedSecret = ecdh.computeSecret(theirPublicKey);
        // Derive session key from shared secret
        const sessionKey = crypto.pbkdf2Sync(sharedSecret, Buffer.from('portal-fusion-session'), 100000, 32, 'sha256');
        const session = {
            id: crypto.randomBytes(16).toString('hex'),
            deviceId,
            publicKey: ourPublicKey,
            sessionKey,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + this.options.sessionTimeout * 60 * 1000),
            lastUsed: new Date(),
        };
        this.sessions.set(deviceId, session);
        electron_log_1.default.info(`E2E session established with device: ${deviceId}`);
        this.emit('e2e:session:established', session);
        return session;
    }
    /**
     * Encrypt message for device
     */
    async encryptForDevice(deviceId, data) {
        const session = this.sessions.get(deviceId);
        if (!session) {
            throw new Error('No E2E session found for device');
        }
        if (new Date() > session.expiresAt) {
            throw new Error('E2E session expired');
        }
        // Update last used
        session.lastUsed = new Date();
        // Encrypt with session key
        const { encrypted, iv, tag } = encryption_1.encryptionService.encrypt(data, session.sessionKey);
        // Pack encrypted data with metadata
        const packed = Buffer.concat([
            Buffer.from([1]), // Version
            iv,
            tag,
            encrypted,
        ]);
        return packed;
    }
    /**
     * Decrypt message from device
     */
    async decryptFromDevice(deviceId, data) {
        const session = this.sessions.get(deviceId);
        if (!session) {
            throw new Error('No E2E session found for device');
        }
        if (new Date() > session.expiresAt) {
            throw new Error('E2E session expired');
        }
        // Update last used
        session.lastUsed = new Date();
        // Unpack data
        const version = data[0];
        const iv = data.slice(1, 17);
        const tag = data.slice(17, 33);
        const encrypted = data.slice(33);
        // Decrypt with session key
        const decrypted = encryption_1.encryptionService.decrypt(encrypted, session.sessionKey, iv, tag);
        return decrypted;
    }
    /**
     * Rotate session key for device
     */
    async rotateSessionKey(deviceId) {
        const session = this.sessions.get(deviceId);
        if (!session) {
            throw new Error('No E2E session found for device');
        }
        // Generate new session key
        const newSessionKey = encryption_1.encryptionService.generateKey();
        // Encrypt new key with old key
        const { encrypted, iv, tag } = encryption_1.encryptionService.encrypt(newSessionKey, session.sessionKey);
        // Update session
        session.sessionKey = newSessionKey;
        session.lastUsed = new Date();
        session.expiresAt = new Date(Date.now() + this.options.sessionTimeout * 60 * 1000);
        electron_log_1.default.info(`Session key rotated for device: ${deviceId}`);
        this.emit('e2e:key:rotated', { deviceId, sessionId: session.id });
    }
    /**
     * Start automatic key rotation
     */
    startKeyRotation() {
        if (this.rotationTimer) {
            clearInterval(this.rotationTimer);
        }
        this.rotationTimer = setInterval(() => {
            const now = new Date();
            this.sessions.forEach((session, deviceId) => {
                const timeSinceLastUse = now.getTime() - session.lastUsed.getTime();
                const rotationInterval = this.options.keyRotationInterval * 60 * 1000;
                if (timeSinceLastUse >= rotationInterval) {
                    this.rotateSessionKey(deviceId).catch((error) => {
                        electron_log_1.default.error(`Failed to rotate key for device ${deviceId}:`, error);
                    });
                }
            });
        }, 60000); // Check every minute
        electron_log_1.default.info('Automatic key rotation started');
    }
    /**
     * Terminate E2E session
     */
    async terminateSession(deviceId) {
        const session = this.sessions.get(deviceId);
        if (session) {
            // Zero out the session key
            session.sessionKey.fill(0);
            this.sessions.delete(deviceId);
            electron_log_1.default.info(`E2E session terminated for device: ${deviceId}`);
            this.emit('e2e:session:terminated', { deviceId, sessionId: session.id });
        }
    }
    /**
     * Clean up expired sessions
     */
    async cleanupExpiredSessions() {
        const now = new Date();
        const expiredDevices = [];
        this.sessions.forEach((session, deviceId) => {
            if (now > session.expiresAt) {
                expiredDevices.push(deviceId);
            }
        });
        for (const deviceId of expiredDevices) {
            await this.terminateSession(deviceId);
        }
        if (expiredDevices.length > 0) {
            electron_log_1.default.info(`Cleaned up ${expiredDevices.length} expired E2E sessions`);
        }
    }
    /**
     * Get active sessions
     */
    getActiveSessions() {
        return Array.from(this.sessions.values()).filter((session) => new Date() <= session.expiresAt);
    }
    /**
     * Get session for device
     */
    getSession(deviceId) {
        return this.sessions.get(deviceId);
    }
    /**
     * Update settings
     */
    updateSettings(options) {
        Object.assign(this.options, options);
        // Restart key rotation if setting changed
        if (options.enablePerfectForwardSecrecy !== undefined || options.keyRotationInterval !== undefined) {
            if (this.options.enablePerfectForwardSecrecy) {
                this.startKeyRotation();
            }
            else if (this.rotationTimer) {
                clearInterval(this.rotationTimer);
                this.rotationTimer = undefined;
            }
        }
    }
    /**
     * Cleanup
     */
    async cleanup() {
        if (this.rotationTimer) {
            clearInterval(this.rotationTimer);
        }
        // Terminate all sessions
        const deviceIds = Array.from(this.sessions.keys());
        for (const deviceId of deviceIds) {
            await this.terminateSession(deviceId);
        }
        electron_log_1.default.info('E2E Encryption Manager cleaned up');
    }
}
exports.E2EEncryptionManager = E2EEncryptionManager;
// Export singleton instance
exports.e2eManager = new E2EEncryptionManager();
//# sourceMappingURL=e2e-manager.js.map