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
exports.pairingService = exports.PairingService = exports.PairingState = void 0;
const QRCode = __importStar(require("qrcode"));
const crypto = __importStar(require("crypto"));
const shared_1 = require("@portal-fusion/shared");
const shared_2 = require("@portal-fusion/shared");
var PairingState;
(function (PairingState) {
    PairingState["IDLE"] = "idle";
    PairingState["INITIATED"] = "initiated";
    PairingState["PENDING_VERIFICATION"] = "pending_verification";
    PairingState["VERIFYING"] = "verifying";
    PairingState["PAIRED"] = "paired";
    PairingState["FAILED"] = "failed";
    PairingState["CANCELLED"] = "cancelled";
})(PairingState || (exports.PairingState = PairingState = {}));
/**
 * Secure Pairing Service
 * Handles QR code generation and PIN verification for secure device pairing
 */
class PairingService extends shared_1.TypedEventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            pinLength: options.pinLength || shared_2.PIN_LENGTH,
            qrCodeSize: options.qrCodeSize || shared_2.QR_CODE_SIZE,
            sessionTimeout: options.sessionTimeout || 5 * 60 * 1000, // 5 minutes
            maxAttempts: options.maxAttempts || 3,
            requireBothConfirm: options.requireBothConfirm !== false,
        };
        this.sessions = new Map();
        this.pairedDevices = new Map();
        // Start cleanup interval for expired sessions
        this.startCleanup();
    }
    /**
     * Initialize a new pairing session
     */
    async initiatePairing(localDevice) {
        // Clean up any existing sessions for this device
        this.cleanupDeviceSessions(localDevice.id);
        // Generate session credentials
        const sessionId = (0, shared_1.generateId)();
        const pin = (0, shared_1.generatePin)(this.options.pinLength);
        const { publicKey, privateKey } = (0, shared_1.generateKeyPair)();
        // Create pairing data
        const pairingData = {
            sessionId,
            deviceId: localDevice.id,
            deviceName: localDevice.name,
            publicKey,
            endpoint: `${localDevice.ip}:${localDevice.port}`,
            pin,
            timestamp: Date.now(),
            signature: this.signData({
                sessionId,
                deviceId: localDevice.id,
                publicKey,
                pin,
            }),
        };
        // Generate QR code
        const qrCode = await this.generateQRCode(pairingData);
        // Create session
        const session = {
            id: sessionId,
            localDevice,
            state: PairingState.INITIATED,
            pin,
            qrCode,
            publicKey,
            privateKey,
            expiresAt: new Date(Date.now() + this.options.sessionTimeout),
            attempts: 0,
            maxAttempts: this.options.maxAttempts,
            createdAt: new Date(),
        };
        this.sessions.set(sessionId, session);
        console.log(`🔐 Pairing session initiated: ${sessionId}`);
        console.log(`📍 PIN: ${pin}`);
        return session;
    }
    /**
     * Generate QR code for pairing data
     */
    async generateQRCode(data) {
        try {
            // Compress data for smaller QR code
            const jsonData = JSON.stringify(data);
            const compressed = Buffer.from(jsonData).toString('base64');
            // Generate QR code as data URL
            const qrCode = await QRCode.toDataURL(compressed, {
                width: this.options.qrCodeSize,
                margin: 2,
                errorCorrectionLevel: 'M',
                color: {
                    dark: '#000000',
                    light: '#FFFFFF',
                },
            });
            return qrCode;
        }
        catch (error) {
            console.error('Failed to generate QR code:', error);
            throw (0, shared_1.createError)('AUTH_FAILED', 'Failed to generate QR code', error);
        }
    }
    /**
     * Scan and process QR code
     */
    async scanQRCode(qrCodeData) {
        try {
            // Decode base64 data
            const jsonData = Buffer.from(qrCodeData, 'base64').toString('utf8');
            const pairingData = JSON.parse(jsonData);
            // Validate data structure
            if (!this.validatePairingData(pairingData)) {
                throw new Error('Invalid pairing data structure');
            }
            // Verify signature
            if (!this.verifySignature(pairingData)) {
                throw new Error('Invalid signature');
            }
            // Check timestamp (prevent replay attacks)
            const age = Date.now() - pairingData.timestamp;
            if (age > this.options.sessionTimeout) {
                throw new Error('QR code has expired');
            }
            return pairingData;
        }
        catch (error) {
            console.error('Failed to scan QR code:', error);
            throw (0, shared_1.createError)('AUTH_FAILED', 'Failed to scan QR code', error);
        }
    }
    /**
     * Join pairing session using QR code data
     */
    async joinPairing(pairingData, localDevice) {
        const sessionId = pairingData.sessionId;
        // Create or get session
        let session = this.sessions.get(sessionId);
        if (!session) {
            // Create new session for the joining device
            const { publicKey, privateKey } = (0, shared_1.generateKeyPair)();
            session = {
                id: sessionId,
                localDevice,
                remoteDevice: {
                    id: pairingData.deviceId,
                    name: pairingData.deviceName,
                    publicKey: pairingData.publicKey,
                    ip: pairingData.endpoint.split(':')[0],
                    port: parseInt(pairingData.endpoint.split(':')[1]),
                },
                state: PairingState.PENDING_VERIFICATION,
                pin: pairingData.pin,
                publicKey,
                privateKey,
                expiresAt: new Date(Date.now() + this.options.sessionTimeout),
                attempts: 0,
                maxAttempts: this.options.maxAttempts,
                createdAt: new Date(),
            };
            this.sessions.set(sessionId, session);
        }
        session.state = PairingState.PENDING_VERIFICATION;
        console.log(`🤝 Joined pairing session: ${sessionId}`);
        return session;
    }
    /**
     * Verify PIN for pairing
     */
    async verifyPin(sessionId, pin) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw (0, shared_1.createError)('AUTH_FAILED', 'Session not found');
        }
        if (session.state !== PairingState.PENDING_VERIFICATION) {
            throw (0, shared_1.createError)('AUTH_FAILED', 'Session not in verification state');
        }
        // Check expiration
        if (new Date() > session.expiresAt) {
            session.state = PairingState.FAILED;
            throw (0, shared_1.createError)('AUTH_EXPIRED', 'Session has expired');
        }
        // Increment attempts
        session.attempts++;
        // Verify PIN
        const isValid = session.pin === pin;
        if (!isValid) {
            if (session.attempts >= session.maxAttempts) {
                session.state = PairingState.FAILED;
                this.sessions.delete(sessionId);
                throw (0, shared_1.createError)('AUTH_FAILED', 'Maximum attempts exceeded');
            }
            return false;
        }
        // Mark as verifying
        session.state = PairingState.VERIFYING;
        // Generate shared secret using ECDH
        if (session.remoteDevice) {
            session.sharedSecret = this.generateSharedSecret(session.privateKey, session.remoteDevice.publicKey);
        }
        return true;
    }
    /**
     * Complete pairing process
     */
    async completePairing(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw (0, shared_1.createError)('AUTH_FAILED', 'Session not found');
        }
        if (session.state !== PairingState.VERIFYING) {
            throw (0, shared_1.createError)('AUTH_FAILED', 'Session not verified');
        }
        if (!session.remoteDevice) {
            throw (0, shared_1.createError)('AUTH_FAILED', 'Remote device not found');
        }
        // Mark devices as paired
        session.remoteDevice.paired = true;
        session.remoteDevice.trusted = true;
        // Store paired device
        this.pairedDevices.set(session.remoteDevice.id, session.remoteDevice);
        // Update session state
        session.state = PairingState.PAIRED;
        session.completedAt = new Date();
        // Emit pairing event
        this.emit('device:paired', session.remoteDevice);
        console.log(`✅ Pairing completed: ${session.remoteDevice.name}`);
        // Clean up session after a delay
        setTimeout(() => {
            this.sessions.delete(sessionId);
        }, 5000);
        return session.remoteDevice;
    }
    /**
     * Cancel pairing session
     */
    cancelPairing(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.state = PairingState.CANCELLED;
            this.sessions.delete(sessionId);
            console.log(`❌ Pairing cancelled: ${sessionId}`);
        }
    }
    /**
     * Generate shared secret using ECDH
     */
    generateSharedSecret(privateKey, publicKey) {
        // In production, use proper ECDH implementation
        // This is a simplified version
        const hash = crypto.createHash('sha256');
        hash.update(privateKey);
        hash.update(publicKey);
        return hash.digest('hex');
    }
    /**
     * Sign data for verification
     */
    signData(data) {
        const jsonData = JSON.stringify(data);
        const hash = crypto.createHash('sha256');
        hash.update(jsonData);
        return hash.digest('hex');
    }
    /**
     * Verify data signature
     */
    verifySignature(pairingData) {
        const { signature, ...data } = pairingData;
        const expectedSignature = this.signData({
            sessionId: data.sessionId,
            deviceId: data.deviceId,
            publicKey: data.publicKey,
            pin: data.pin,
        });
        return signature === expectedSignature;
    }
    /**
     * Validate pairing data structure
     */
    validatePairingData(data) {
        return (typeof data.sessionId === 'string' &&
            typeof data.deviceId === 'string' &&
            typeof data.deviceName === 'string' &&
            typeof data.publicKey === 'string' &&
            typeof data.endpoint === 'string' &&
            typeof data.pin === 'string' &&
            typeof data.timestamp === 'number' &&
            typeof data.signature === 'string');
    }
    /**
     * Clean up sessions for a specific device
     */
    cleanupDeviceSessions(deviceId) {
        for (const [sessionId, session] of this.sessions) {
            if (session.localDevice.id === deviceId) {
                this.sessions.delete(sessionId);
            }
        }
    }
    /**
     * Start cleanup interval for expired sessions
     */
    startCleanup() {
        this.cleanupInterval = setInterval(() => {
            const now = new Date();
            for (const [sessionId, session] of this.sessions) {
                if (now > session.expiresAt && session.state !== PairingState.PAIRED) {
                    session.state = PairingState.FAILED;
                    this.sessions.delete(sessionId);
                    console.log(`🗑️ Expired session cleaned up: ${sessionId}`);
                }
            }
        }, 60000); // Check every minute
    }
    /**
     * Get all paired devices
     */
    getPairedDevices() {
        return Array.from(this.pairedDevices.values());
    }
    /**
     * Check if device is paired
     */
    isPaired(deviceId) {
        return this.pairedDevices.has(deviceId);
    }
    /**
     * Unpair device
     */
    unpairDevice(deviceId) {
        const device = this.pairedDevices.get(deviceId);
        if (device) {
            device.paired = false;
            device.trusted = false;
            this.pairedDevices.delete(deviceId);
            console.log(`💔 Device unpaired: ${device.name}`);
        }
    }
    /**
     * Get session by ID
     */
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    /**
     * Get active sessions
     */
    getActiveSessions() {
        return Array.from(this.sessions.values()).filter(session => session.state !== PairingState.FAILED && session.state !== PairingState.CANCELLED);
    }
    /**
     * Clean up and destroy service
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.sessions.clear();
        this.pairedDevices.clear();
        this.removeAllListeners();
    }
}
exports.PairingService = PairingService;
// Export singleton instance
exports.pairingService = new PairingService();
//# sourceMappingURL=pairing.js.map