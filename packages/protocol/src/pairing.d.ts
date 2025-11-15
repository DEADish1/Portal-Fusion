import { Device, PortalFusionEvents } from '@portal-fusion/shared';
import { TypedEventEmitter } from '@portal-fusion/shared';
export declare enum PairingState {
    IDLE = "idle",
    INITIATED = "initiated",
    PENDING_VERIFICATION = "pending_verification",
    VERIFYING = "verifying",
    PAIRED = "paired",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export interface PairingSession {
    id: string;
    localDevice: Device;
    remoteDevice?: Device;
    state: PairingState;
    pin: string;
    qrCode?: string;
    publicKey: string;
    privateKey: string;
    sharedSecret?: string;
    expiresAt: Date;
    attempts: number;
    maxAttempts: number;
    createdAt: Date;
    completedAt?: Date;
}
export interface PairingOptions {
    pinLength?: number;
    qrCodeSize?: number;
    sessionTimeout?: number;
    maxAttempts?: number;
    requireBothConfirm?: boolean;
}
export interface PairingData {
    sessionId: string;
    deviceId: string;
    deviceName: string;
    publicKey: string;
    endpoint: string;
    pin: string;
    timestamp: number;
    signature: string;
}
/**
 * Secure Pairing Service
 * Handles QR code generation and PIN verification for secure device pairing
 */
export declare class PairingService extends TypedEventEmitter<PortalFusionEvents> {
    private sessions;
    private pairedDevices;
    private options;
    private cleanupInterval?;
    constructor(options?: PairingOptions);
    /**
     * Initialize a new pairing session
     */
    initiatePairing(localDevice: Device): Promise<PairingSession>;
    /**
     * Generate QR code for pairing data
     */
    private generateQRCode;
    /**
     * Scan and process QR code
     */
    scanQRCode(qrCodeData: string): Promise<PairingData>;
    /**
     * Join pairing session using QR code data
     */
    joinPairing(pairingData: PairingData, localDevice: Device): Promise<PairingSession>;
    /**
     * Verify PIN for pairing
     */
    verifyPin(sessionId: string, pin: string): Promise<boolean>;
    /**
     * Complete pairing process
     */
    completePairing(sessionId: string): Promise<Device>;
    /**
     * Cancel pairing session
     */
    cancelPairing(sessionId: string): void;
    /**
     * Generate shared secret using ECDH
     */
    private generateSharedSecret;
    /**
     * Sign data for verification
     */
    private signData;
    /**
     * Verify data signature
     */
    private verifySignature;
    /**
     * Validate pairing data structure
     */
    private validatePairingData;
    /**
     * Clean up sessions for a specific device
     */
    private cleanupDeviceSessions;
    /**
     * Start cleanup interval for expired sessions
     */
    private startCleanup;
    /**
     * Get all paired devices
     */
    getPairedDevices(): Device[];
    /**
     * Check if device is paired
     */
    isPaired(deviceId: string): boolean;
    /**
     * Unpair device
     */
    unpairDevice(deviceId: string): void;
    /**
     * Get session by ID
     */
    getSession(sessionId: string): PairingSession | undefined;
    /**
     * Get active sessions
     */
    getActiveSessions(): PairingSession[];
    /**
     * Clean up and destroy service
     */
    destroy(): void;
}
export declare const pairingService: PairingService;
//# sourceMappingURL=pairing.d.ts.map