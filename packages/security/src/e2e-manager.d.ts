import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
export interface E2ESession {
    id: string;
    deviceId: string;
    publicKey: Buffer;
    sessionKey: Buffer;
    createdAt: Date;
    expiresAt: Date;
    lastUsed: Date;
}
export interface E2EOptions {
    sessionTimeout?: number;
    keyRotationInterval?: number;
    enablePerfectForwardSecrecy?: boolean;
}
/**
 * End-to-End Encryption Manager
 * Manages E2E encrypted sessions with perfect forward secrecy
 */
export declare class E2EEncryptionManager extends TypedEventEmitter<PortalFusionEvents> {
    private options;
    private sessions;
    private rotationTimer?;
    constructor(options?: E2EOptions);
    /**
     * Initialize E2E encryption
     */
    initialize(): Promise<void>;
    /**
     * Establish E2E session with device
     */
    establishSession(deviceId: string, theirPublicKey: Buffer): Promise<E2ESession>;
    /**
     * Encrypt message for device
     */
    encryptForDevice(deviceId: string, data: Buffer | string): Promise<Buffer>;
    /**
     * Decrypt message from device
     */
    decryptFromDevice(deviceId: string, data: Buffer): Promise<Buffer>;
    /**
     * Rotate session key for device
     */
    rotateSessionKey(deviceId: string): Promise<void>;
    /**
     * Start automatic key rotation
     */
    private startKeyRotation;
    /**
     * Terminate E2E session
     */
    terminateSession(deviceId: string): Promise<void>;
    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions(): Promise<void>;
    /**
     * Get active sessions
     */
    getActiveSessions(): E2ESession[];
    /**
     * Get session for device
     */
    getSession(deviceId: string): E2ESession | undefined;
    /**
     * Update settings
     */
    updateSettings(options: Partial<E2EOptions>): void;
    /**
     * Cleanup
     */
    cleanup(): Promise<void>;
}
export declare const e2eManager: E2EEncryptionManager;
//# sourceMappingURL=e2e-manager.d.ts.map