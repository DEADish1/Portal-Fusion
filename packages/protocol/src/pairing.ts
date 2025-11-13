import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import {
  Device,
  Portal FusionEvents,
  Message,
  MessageType,
} from '@portal-fusion/shared';
import {
  generateId,
  generatePin,
  generateKeyPair,
  TypedEventEmitter,
  createError,
  hashPassword,
  verifyPassword,
} from '@portal-fusion/shared';
import { PIN_LENGTH, QR_CODE_SIZE } from '@portal-fusion/shared';

export enum PairingState {
  IDLE = 'idle',
  INITIATED = 'initiated',
  PENDING_VERIFICATION = 'pending_verification',
  VERIFYING = 'verifying',
  PAIRED = 'paired',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
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
export class PairingService extends TypedEventEmitter<Portal FusionEvents> {
  private sessions: Map<string, PairingSession>;
  private pairedDevices: Map<string, Device>;
  private options: Required<PairingOptions>;
  private cleanupInterval?: NodeJS.Timeout;
  
  constructor(options: PairingOptions = {}) {
    super();
    
    this.options = {
      pinLength: options.pinLength || PIN_LENGTH,
      qrCodeSize: options.qrCodeSize || QR_CODE_SIZE,
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
  async initiatePairing(localDevice: Device): Promise<PairingSession> {
    // Clean up any existing sessions for this device
    this.cleanupDeviceSessions(localDevice.id);
    
    // Generate session credentials
    const sessionId = generateId();
    const pin = generatePin(this.options.pinLength);
    const { publicKey, privateKey } = generateKeyPair();
    
    // Create pairing data
    const pairingData: PairingData = {
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
    const session: PairingSession = {
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
  private async generateQRCode(data: PairingData): Promise<string> {
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
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      throw createError('AUTH_FAILED', 'Failed to generate QR code', error);
    }
  }
  
  /**
   * Scan and process QR code
   */
  async scanQRCode(qrCodeData: string): Promise<PairingData> {
    try {
      // Decode base64 data
      const jsonData = Buffer.from(qrCodeData, 'base64').toString('utf8');
      const pairingData: PairingData = JSON.parse(jsonData);
      
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
    } catch (error) {
      console.error('Failed to scan QR code:', error);
      throw createError('AUTH_FAILED', 'Failed to scan QR code', error);
    }
  }
  
  /**
   * Join pairing session using QR code data
   */
  async joinPairing(
    pairingData: PairingData,
    localDevice: Device
  ): Promise<PairingSession> {
    const sessionId = pairingData.sessionId;
    
    // Create or get session
    let session = this.sessions.get(sessionId);
    
    if (!session) {
      // Create new session for the joining device
      const { publicKey, privateKey } = generateKeyPair();
      
      session = {
        id: sessionId,
        localDevice,
        remoteDevice: {
          id: pairingData.deviceId,
          name: pairingData.deviceName,
          publicKey: pairingData.publicKey,
          ip: pairingData.endpoint.split(':')[0],
          port: parseInt(pairingData.endpoint.split(':')[1]),
        } as Device,
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
  async verifyPin(sessionId: string, pin: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw createError('AUTH_FAILED', 'Session not found');
    }
    
    if (session.state !== PairingState.PENDING_VERIFICATION) {
      throw createError('AUTH_FAILED', 'Session not in verification state');
    }
    
    // Check expiration
    if (new Date() > session.expiresAt) {
      session.state = PairingState.FAILED;
      throw createError('AUTH_EXPIRED', 'Session has expired');
    }
    
    // Increment attempts
    session.attempts++;
    
    // Verify PIN
    const isValid = session.pin === pin;
    
    if (!isValid) {
      if (session.attempts >= session.maxAttempts) {
        session.state = PairingState.FAILED;
        this.sessions.delete(sessionId);
        throw createError('AUTH_FAILED', 'Maximum attempts exceeded');
      }
      return false;
    }
    
    // Mark as verifying
    session.state = PairingState.VERIFYING;
    
    // Generate shared secret using ECDH
    if (session.remoteDevice) {
      session.sharedSecret = this.generateSharedSecret(
        session.privateKey,
        session.remoteDevice.publicKey
      );
    }
    
    return true;
  }
  
  /**
   * Complete pairing process
   */
  async completePairing(sessionId: string): Promise<Device> {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw createError('AUTH_FAILED', 'Session not found');
    }
    
    if (session.state !== PairingState.VERIFYING) {
      throw createError('AUTH_FAILED', 'Session not verified');
    }
    
    if (!session.remoteDevice) {
      throw createError('AUTH_FAILED', 'Remote device not found');
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
  cancelPairing(sessionId: string): void {
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
  private generateSharedSecret(privateKey: string, publicKey: string): string {
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
  private signData(data: any): string {
    const jsonData = JSON.stringify(data);
    const hash = crypto.createHash('sha256');
    hash.update(jsonData);
    return hash.digest('hex');
  }
  
  /**
   * Verify data signature
   */
  private verifySignature(pairingData: PairingData): boolean {
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
  private validatePairingData(data: any): data is PairingData {
    return (
      typeof data.sessionId === 'string' &&
      typeof data.deviceId === 'string' &&
      typeof data.deviceName === 'string' &&
      typeof data.publicKey === 'string' &&
      typeof data.endpoint === 'string' &&
      typeof data.pin === 'string' &&
      typeof data.timestamp === 'number' &&
      typeof data.signature === 'string'
    );
  }
  
  /**
   * Clean up sessions for a specific device
   */
  private cleanupDeviceSessions(deviceId: string): void {
    for (const [sessionId, session] of this.sessions) {
      if (session.localDevice.id === deviceId) {
        this.sessions.delete(sessionId);
      }
    }
  }
  
  /**
   * Start cleanup interval for expired sessions
   */
  private startCleanup(): void {
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
  getPairedDevices(): Device[] {
    return Array.from(this.pairedDevices.values());
  }
  
  /**
   * Check if device is paired
   */
  isPaired(deviceId: string): boolean {
    return this.pairedDevices.has(deviceId);
  }
  
  /**
   * Unpair device
   */
  unpairDevice(deviceId: string): void {
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
  getSession(sessionId: string): PairingSession | undefined {
    return this.sessions.get(sessionId);
  }
  
  /**
   * Get active sessions
   */
  getActiveSessions(): PairingSession[] {
    return Array.from(this.sessions.values()).filter(
      session => session.state !== PairingState.FAILED && session.state !== PairingState.CANCELLED
    );
  }
  
  /**
   * Clean up and destroy service
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.sessions.clear();
    this.pairedDevices.clear();
    this.removeAllListeners();
  }
}

// Export singleton instance
export const pairingService = new PairingService();
