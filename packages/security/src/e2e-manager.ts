import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import { encryptionService } from './encryption';
import { keystoreService } from './keystore';
import * as crypto from 'crypto';
import log from 'electron-log';

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
  sessionTimeout?: number; // minutes
  keyRotationInterval?: number; // minutes
  enablePerfectForwardSecrecy?: boolean;
}

/**
 * End-to-End Encryption Manager
 * Manages E2E encrypted sessions with perfect forward secrecy
 */
export class E2EEncryptionManager extends TypedEventEmitter<PortalFusionEvents> {
  private options: Required<E2EOptions>;
  private sessions: Map<string, E2ESession> = new Map();
  private rotationTimer?: NodeJS.Timeout;

  constructor(options: E2EOptions = {}) {
    super();

    this.options = {
      sessionTimeout: options.sessionTimeout || 60,
      keyRotationInterval: options.keyRotationInterval || 30,
      enablePerfectForwardSecrecy: options.enablePerfectForwardSecrecy !== false,
    };
  }

  /**
   * Initialize E2E encryption
   */
  async initialize(): Promise<void> {
    // Start key rotation timer if enabled
    if (this.options.enablePerfectForwardSecrecy) {
      this.startKeyRotation();
    }

    log.info('E2E Encryption Manager initialized');
  }

  /**
   * Establish E2E session with device
   */
  async establishSession(deviceId: string, theirPublicKey: Buffer): Promise<E2ESession> {
    // Generate ECDH key pair for this session
    const ecdh = crypto.createECDH('secp521r1');
    ecdh.generateKeys();

    const ourPrivateKey = ecdh.getPrivateKey();
    const ourPublicKey = ecdh.getPublicKey();

    // Compute shared secret
    const sharedSecret = ecdh.computeSecret(theirPublicKey);

    // Derive session key from shared secret
    const sessionKey = crypto.pbkdf2Sync(
      sharedSecret,
      Buffer.from('portal-fusion-session'),
      100000,
      32,
      'sha256'
    );

    const session: E2ESession = {
      id: crypto.randomBytes(16).toString('hex'),
      deviceId,
      publicKey: ourPublicKey,
      sessionKey,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.options.sessionTimeout * 60 * 1000),
      lastUsed: new Date(),
    };

    this.sessions.set(deviceId, session);

    log.info(`E2E session established with device: ${deviceId}`);
    this.emit('e2e:session:established', session);

    return session;
  }

  /**
   * Encrypt message for device
   */
  async encryptForDevice(deviceId: string, data: Buffer | string): Promise<Buffer> {
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
    const { encrypted, iv, tag } = encryptionService.encrypt(data, session.sessionKey);

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
  async decryptFromDevice(deviceId: string, data: Buffer): Promise<Buffer> {
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
    const decrypted = encryptionService.decrypt(
      { encrypted, iv, tag },
      session.sessionKey
    );

    return decrypted;
  }

  /**
   * Rotate session key for device
   */
  async rotateSessionKey(deviceId: string): Promise<void> {
    const session = this.sessions.get(deviceId);

    if (!session) {
      throw new Error('No E2E session found for device');
    }

    // Generate new session key
    const newSessionKey = encryptionService.generateKey();

    // Encrypt new key with old key
    const { encrypted, iv, tag } = encryptionService.encrypt(
      newSessionKey,
      session.sessionKey
    );

    // Update session
    session.sessionKey = newSessionKey;
    session.lastUsed = new Date();
    session.expiresAt = new Date(Date.now() + this.options.sessionTimeout * 60 * 1000);

    log.info(`Session key rotated for device: ${deviceId}`);
    this.emit('e2e:key:rotated', { deviceId, sessionId: session.id });
  }

  /**
   * Start automatic key rotation
   */
  private startKeyRotation(): void {
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
            log.error(`Failed to rotate key for device ${deviceId}:`, error);
          });
        }
      });
    }, 60000); // Check every minute

    log.info('Automatic key rotation started');
  }

  /**
   * Terminate E2E session
   */
  async terminateSession(deviceId: string): Promise<void> {
    const session = this.sessions.get(deviceId);

    if (session) {
      // Zero out the session key
      session.sessionKey.fill(0);

      this.sessions.delete(deviceId);

      log.info(`E2E session terminated for device: ${deviceId}`);
      this.emit('e2e:session:terminated', { deviceId, sessionId: session.id });
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    const expiredDevices: string[] = [];

    this.sessions.forEach((session, deviceId) => {
      if (now > session.expiresAt) {
        expiredDevices.push(deviceId);
      }
    });

    for (const deviceId of expiredDevices) {
      await this.terminateSession(deviceId);
    }

    if (expiredDevices.length > 0) {
      log.info(`Cleaned up ${expiredDevices.length} expired E2E sessions`);
    }
  }

  /**
   * Get active sessions
   */
  getActiveSessions(): E2ESession[] {
    return Array.from(this.sessions.values()).filter(
      (session) => new Date() <= session.expiresAt
    );
  }

  /**
   * Get session for device
   */
  getSession(deviceId: string): E2ESession | undefined {
    return this.sessions.get(deviceId);
  }

  /**
   * Update settings
   */
  updateSettings(options: Partial<E2EOptions>): void {
    Object.assign(this.options, options);

    // Restart key rotation if setting changed
    if (options.enablePerfectForwardSecrecy !== undefined || options.keyRotationInterval !== undefined) {
      if (this.options.enablePerfectForwardSecrecy) {
        this.startKeyRotation();
      } else if (this.rotationTimer) {
        clearInterval(this.rotationTimer);
        this.rotationTimer = undefined;
      }
    }
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }

    // Terminate all sessions
    const deviceIds = Array.from(this.sessions.keys());
    for (const deviceId of deviceIds) {
      await this.terminateSession(deviceId);
    }

    log.info('E2E Encryption Manager cleaned up');
  }
}

// Export singleton instance
export const e2eManager = new E2EEncryptionManager();
