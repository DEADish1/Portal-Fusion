import * as fs from 'fs/promises';
import * as path from 'path';
import { encryptionService } from './encryption';
import { createError, getPlatformPaths } from '@portal-fusion/shared';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface StoredKey {
  id: string;
  alias: string;
  type: 'rsa' | 'ecdh' | 'aes';
  publicKey?: string;
  encryptedPrivateKey?: string;
  key?: string;
  metadata: {
    createdAt: Date;
    expiresAt?: Date;
    purpose: string;
    deviceId?: string;
  };
}

/**
 * Secure Key Storage Service
 * Manages encryption keys with secure storage
 */
export class KeyStoreService {
  private keystorePath: string;
  private keys: Map<string, StoredKey> = new Map();
  private masterKey?: Buffer;
  private initialized = false;

  constructor() {
    const paths = getPlatformPaths();
    this.keystorePath = path.join(paths.data, 'keystore.json');
  }

  /**
   * Initialize keystore with master password
   */
  async initialize(masterPassword: string): Promise<void> {
    // Derive master key from password
    const { key } = encryptionService.deriveKey(masterPassword);
    this.masterKey = key;

    // Try to load existing keystore
    try {
      await this.load();
    } catch (error) {
      // Keystore doesn't exist, create new one
      await this.save();
    }

    this.initialized = true;
  }

  /**
   * Ensure keystore is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.masterKey) {
      throw createError('SYSTEM_OPERATION_FAILED', 'KeyStore not initialized');
    }
  }

  /**
   * Store a key pair
   */
  async storeKeyPair(
    alias: string,
    keyPair: KeyPair,
    type: 'rsa' | 'ecdh',
    purpose: string,
    deviceId?: string
  ): Promise<string> {
    this.ensureInitialized();

    // Encrypt private key with master key
    const { encrypted, iv, tag } = encryptionService.encrypt(
      keyPair.privateKey,
      this.masterKey!
    );

    const id = encryptionService.generateToken(16);
    const storedKey: StoredKey = {
      id,
      alias,
      type,
      publicKey: keyPair.publicKey,
      encryptedPrivateKey: JSON.stringify({
        encrypted: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
      }),
      metadata: {
        createdAt: keyPair.createdAt,
        expiresAt: keyPair.expiresAt,
        purpose,
        deviceId,
      },
    };

    this.keys.set(id, storedKey);
    await this.save();

    return id;
  }

  /**
   * Store a symmetric key
   */
  async storeSymmetricKey(
    alias: string,
    key: Buffer,
    purpose: string,
    expiresAt?: Date
  ): Promise<string> {
    this.ensureInitialized();

    // Encrypt symmetric key with master key
    const { encrypted, iv, tag } = encryptionService.encrypt(key, this.masterKey!);

    const id = encryptionService.generateToken(16);
    const storedKey: StoredKey = {
      id,
      alias,
      type: 'aes',
      key: JSON.stringify({
        encrypted: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
      }),
      metadata: {
        createdAt: new Date(),
        expiresAt,
        purpose,
      },
    };

    this.keys.set(id, storedKey);
    await this.save();

    return id;
  }

  /**
   * Retrieve a key pair
   */
  async getKeyPair(idOrAlias: string): Promise<KeyPair | null> {
    this.ensureInitialized();

    const storedKey = this.findKey(idOrAlias);
    if (!storedKey || !storedKey.encryptedPrivateKey) {
      return null;
    }

    // Check expiration
    if (storedKey.metadata.expiresAt && new Date() > storedKey.metadata.expiresAt) {
      await this.deleteKey(storedKey.id);
      return null;
    }

    // Decrypt private key
    const encryptedData = JSON.parse(storedKey.encryptedPrivateKey);
    const privateKey = encryptionService.decrypt(
      Buffer.from(encryptedData.encrypted, 'base64'),
      this.masterKey!,
      Buffer.from(encryptedData.iv, 'base64'),
      Buffer.from(encryptedData.tag, 'base64')
    );

    return {
      publicKey: storedKey.publicKey!,
      privateKey: privateKey.toString('utf8'),
      createdAt: storedKey.metadata.createdAt,
      expiresAt: storedKey.metadata.expiresAt,
    };
  }

  /**
   * Retrieve a symmetric key
   */
  async getSymmetricKey(idOrAlias: string): Promise<Buffer | null> {
    this.ensureInitialized();

    const storedKey = this.findKey(idOrAlias);
    if (!storedKey || !storedKey.key) {
      return null;
    }

    // Check expiration
    if (storedKey.metadata.expiresAt && new Date() > storedKey.metadata.expiresAt) {
      await this.deleteKey(storedKey.id);
      return null;
    }

    // Decrypt key
    const encryptedData = JSON.parse(storedKey.key);
    return encryptionService.decrypt(
      Buffer.from(encryptedData.encrypted, 'base64'),
      this.masterKey!,
      Buffer.from(encryptedData.iv, 'base64'),
      Buffer.from(encryptedData.tag, 'base64')
    );
  }

  /**
   * Get public key only
   */
  getPublicKey(idOrAlias: string): string | null {
    const storedKey = this.findKey(idOrAlias);
    return storedKey?.publicKey || null;
  }

  /**
   * Delete a key
   */
  async deleteKey(idOrAlias: string): Promise<boolean> {
    this.ensureInitialized();

    const storedKey = this.findKey(idOrAlias);
    if (!storedKey) {
      return false;
    }

    this.keys.delete(storedKey.id);
    await this.save();
    return true;
  }

  /**
   * List all keys
   */
  listKeys(): Array<Omit<StoredKey, 'encryptedPrivateKey' | 'key'>> {
    return Array.from(this.keys.values()).map((key) => ({
      id: key.id,
      alias: key.alias,
      type: key.type,
      publicKey: key.publicKey,
      metadata: key.metadata,
    }));
  }

  /**
   * Find key by ID or alias
   */
  private findKey(idOrAlias: string): StoredKey | undefined {
    // Try by ID first
    const byId = this.keys.get(idOrAlias);
    if (byId) return byId;

    // Try by alias
    for (const key of this.keys.values()) {
      if (key.alias === idOrAlias) {
        return key;
      }
    }

    return undefined;
  }

  /**
   * Save keystore to disk
   */
  private async save(): Promise<void> {
    this.ensureInitialized();

    const data = JSON.stringify(
      Array.from(this.keys.entries()),
      (key, value) => {
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      },
      2
    );

    // Ensure directory exists
    await fs.mkdir(path.dirname(this.keystorePath), { recursive: true });

    // Write to file with restrictive permissions
    await fs.writeFile(this.keystorePath, data, {
      mode: 0o600, // Read/write for owner only
    });
  }

  /**
   * Load keystore from disk
   */
  private async load(): Promise<void> {
    const data = await fs.readFile(this.keystorePath, 'utf8');
    const entries = JSON.parse(data, (key, value) => {
      // Revive dates
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
        return new Date(value);
      }
      return value;
    });

    this.keys = new Map(entries);
  }

  /**
   * Clear all keys (dangerous!)
   */
  async clear(): Promise<void> {
    this.keys.clear();
    await this.save();
  }

  /**
   * Rotate master key
   */
  async rotateMasterKey(newMasterPassword: string): Promise<void> {
    this.ensureInitialized();

    // Derive new master key
    const { key: newMasterKey } = encryptionService.deriveKey(newMasterPassword);

    // Re-encrypt all keys with new master key
    for (const [id, storedKey] of this.keys.entries()) {
      if (storedKey.encryptedPrivateKey) {
        // Decrypt with old key
        const encryptedData = JSON.parse(storedKey.encryptedPrivateKey);
        const privateKey = encryptionService.decrypt(
          Buffer.from(encryptedData.encrypted, 'base64'),
          this.masterKey!,
          Buffer.from(encryptedData.iv, 'base64'),
          Buffer.from(encryptedData.tag, 'base64')
        );

        // Encrypt with new key
        const { encrypted, iv, tag } = encryptionService.encrypt(
          privateKey,
          newMasterKey
        );

        storedKey.encryptedPrivateKey = JSON.stringify({
          encrypted: encrypted.toString('base64'),
          iv: iv.toString('base64'),
          tag: tag.toString('base64'),
        });
      }

      if (storedKey.key) {
        // Decrypt with old key
        const encryptedData = JSON.parse(storedKey.key);
        const key = encryptionService.decrypt(
          Buffer.from(encryptedData.encrypted, 'base64'),
          this.masterKey!,
          Buffer.from(encryptedData.iv, 'base64'),
          Buffer.from(encryptedData.tag, 'base64')
        );

        // Encrypt with new key
        const { encrypted, iv, tag } = encryptionService.encrypt(key, newMasterKey);

        storedKey.key = JSON.stringify({
          encrypted: encrypted.toString('base64'),
          iv: iv.toString('base64'),
          tag: tag.toString('base64'),
        });
      }
    }

    // Update master key and save
    this.masterKey = newMasterKey;
    await this.save();
  }
}

// Export singleton instance
export const keystoreService = new KeyStoreService();
