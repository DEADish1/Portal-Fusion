import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import { Message, MessageType } from '@portal-fusion/shared';
import { createMessage } from '@portal-fusion/shared';
import { connectionManager } from '../connection';
import { encryptionService } from '@portal-fusion/security';
import log from 'electron-log';
import * as crypto from 'crypto';

export interface PasswordManagerOptions {
  enabled?: boolean;
  requireMasterPassword?: boolean;
  autoFill?: boolean;
  autoSync?: boolean;
  passwordStrength?: 'low' | 'medium' | 'high' | 'paranoid';
  syncInterval?: number;
}

export interface PasswordEntry {
  id: string;
  domain: string;
  username: string;
  encryptedPassword: string;
  iv: string;
  tag: string;
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date;
  strength: number;
  isFavorite: boolean;
}

export interface PasswordVault {
  id: string;
  name: string;
  entries: Map<string, PasswordEntry>;
  encryptionKey?: Buffer;
  locked: boolean;
  lastSync: Date;
}

export interface PasswordGeneratorOptions {
  length?: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
  excludeSimilar?: boolean;
  excludeAmbiguous?: boolean;
}

/**
 * Password Manager Integration Service
 * Securely sync and manage passwords between devices
 */
export class PasswordManagerService extends TypedEventEmitter<PortalFusionEvents> {
  private options: Required<PasswordManagerOptions>;
  private localDeviceId?: string;
  private vault?: PasswordVault;
  private masterPasswordHash?: string;
  private syncInterval?: NodeJS.Timeout;

  // Password strength requirements
  private readonly STRENGTH_REQUIREMENTS = {
    low: { minLength: 8, requireMixed: false, requireNumbers: false, requireSymbols: false },
    medium: { minLength: 12, requireMixed: true, requireNumbers: true, requireSymbols: false },
    high: { minLength: 16, requireMixed: true, requireNumbers: true, requireSymbols: true },
    paranoid: { minLength: 24, requireMixed: true, requireNumbers: true, requireSymbols: true },
  };

  constructor(options: PasswordManagerOptions = {}) {
    super();

    this.options = {
      enabled: options.enabled !== false,
      requireMasterPassword: options.requireMasterPassword !== false,
      autoFill: options.autoFill || false,
      autoSync: options.autoSync || false,
      passwordStrength: options.passwordStrength || 'high',
      syncInterval: options.syncInterval || 30000, // 30 seconds
    };
  }

  /**
   * Initialize service
   */
  initialize(localDeviceId: string): void {
    this.localDeviceId = localDeviceId;

    // Create vault
    this.vault = {
      id: `vault-${localDeviceId}`,
      name: 'Default Vault',
      entries: new Map(),
      locked: this.options.requireMasterPassword,
      lastSync: new Date(),
    };

    log.info('Password manager service initialized');
  }

  /**
   * Set master password
   */
  async setMasterPassword(password: string): Promise<void> {
    if (!this.vault) {
      throw new Error('Service not initialized');
    }

    // Hash master password
    this.masterPasswordHash = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    // Derive encryption key from master password
    const salt = crypto.randomBytes(32);
    this.vault.encryptionKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

    this.vault.locked = false;

    log.info('Master password set');
    this.emit('password:vault:unlocked', {});

    // Start auto-sync if enabled
    if (this.options.autoSync) {
      this.startAutoSync();
    }
  }

  /**
   * Unlock vault with master password
   */
  async unlockVault(password: string): Promise<boolean> {
    if (!this.vault || !this.masterPasswordHash) {
      throw new Error('Vault not initialized or master password not set');
    }

    const hash = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    if (hash === this.masterPasswordHash) {
      this.vault.locked = false;
      log.info('Vault unlocked');
      this.emit('password:vault:unlocked', {});

      // Start auto-sync if enabled
      if (this.options.autoSync) {
        this.startAutoSync();
      }

      return true;
    }

    log.warn('Failed to unlock vault: invalid password');
    this.emit('password:vault:unlock-failed', {});
    return false;
  }

  /**
   * Lock vault
   */
  lockVault(): void {
    if (!this.vault) {
      return;
    }

    this.vault.locked = true;
    this.stopAutoSync();

    log.info('Vault locked');
    this.emit('password:vault:locked', {});
  }

  /**
   * Add password entry
   */
  async addPassword(
    domain: string,
    username: string,
    password: string,
    notes?: string,
    tags: string[] = []
  ): Promise<PasswordEntry> {
    if (!this.vault || this.vault.locked || !this.vault.encryptionKey) {
      throw new Error('Vault is locked or not initialized');
    }

    // Encrypt password
    const { encrypted, iv, tag } = encryptionService.encrypt(
      password,
      this.vault.encryptionKey
    );

    const entry: PasswordEntry = {
      id: crypto.randomBytes(16).toString('hex'),
      domain,
      username,
      encryptedPassword: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      notes,
      tags,
      createdAt: new Date(),
      updatedAt: new Date(),
      strength: this.calculatePasswordStrength(password),
      isFavorite: false,
    };

    this.vault.entries.set(entry.id, entry);

    log.info(`Password added for: ${domain}`);
    this.emit('password:entry:added', entry);

    // Sync if auto-sync enabled
    if (this.options.autoSync) {
      await this.syncPasswords();
    }

    return entry;
  }

  /**
   * Get password entry
   */
  async getPassword(entryId: string): Promise<string> {
    if (!this.vault || this.vault.locked || !this.vault.encryptionKey) {
      throw new Error('Vault is locked or not initialized');
    }

    const entry = this.vault.entries.get(entryId);

    if (!entry) {
      throw new Error('Password entry not found');
    }

    // Decrypt password
    const decrypted = encryptionService.decrypt(
      Buffer.from(entry.encryptedPassword, 'base64'),
      this.vault.encryptionKey,
      Buffer.from(entry.iv, 'base64'),
      Buffer.from(entry.tag, 'base64')
    );

    // Update last used
    entry.lastUsed = new Date();

    return decrypted.toString('utf8');
  }

  /**
   * Update password entry
   */
  async updatePassword(
    entryId: string,
    updates: {
      password?: string;
      username?: string;
      notes?: string;
      tags?: string[];
    }
  ): Promise<void> {
    if (!this.vault || this.vault.locked || !this.vault.encryptionKey) {
      throw new Error('Vault is locked or not initialized');
    }

    const entry = this.vault.entries.get(entryId);

    if (!entry) {
      throw new Error('Password entry not found');
    }

    // Update password if provided
    if (updates.password) {
      const { encrypted, iv, tag } = encryptionService.encrypt(
        updates.password,
        this.vault.encryptionKey
      );

      entry.encryptedPassword = encrypted.toString('base64');
      entry.iv = iv.toString('base64');
      entry.tag = tag.toString('base64');
      entry.strength = this.calculatePasswordStrength(updates.password);
    }

    // Update other fields
    if (updates.username) entry.username = updates.username;
    if (updates.notes) entry.notes = updates.notes;
    if (updates.tags) entry.tags = updates.tags;

    entry.updatedAt = new Date();

    log.info(`Password updated for: ${entry.domain}`);
    this.emit('password:entry:updated', entry);

    // Sync if auto-sync enabled
    if (this.options.autoSync) {
      await this.syncPasswords();
    }
  }

  /**
   * Delete password entry
   */
  async deletePassword(entryId: string): Promise<void> {
    if (!this.vault || this.vault.locked) {
      throw new Error('Vault is locked or not initialized');
    }

    const entry = this.vault.entries.get(entryId);

    if (entry) {
      this.vault.entries.delete(entryId);
      log.info(`Password deleted for: ${entry.domain}`);
      this.emit('password:entry:deleted', { entryId });

      // Sync if auto-sync enabled
      if (this.options.autoSync) {
        await this.syncPasswords();
      }
    }
  }

  /**
   * Search passwords
   */
  searchPasswords(query: string): PasswordEntry[] {
    if (!this.vault || this.vault.locked) {
      return [];
    }

    const lowerQuery = query.toLowerCase();

    return Array.from(this.vault.entries.values()).filter(
      (entry) =>
        entry.domain.toLowerCase().includes(lowerQuery) ||
        entry.username.toLowerCase().includes(lowerQuery) ||
        entry.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get passwords for domain
   */
  getPasswordsForDomain(domain: string): PasswordEntry[] {
    if (!this.vault || this.vault.locked) {
      return [];
    }

    return Array.from(this.vault.entries.values()).filter((entry) =>
      entry.domain.includes(domain)
    );
  }

  /**
   * Generate secure password
   */
  generatePassword(options: PasswordGeneratorOptions = {}): string {
    const {
      length = 16,
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true,
      excludeSimilar = true,
      excludeAmbiguous = true,
    } = options;

    let charset = '';

    if (includeLowercase) charset += 'abcdefghijkmnopqrstuvwxyz';
    if (includeUppercase) charset += 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    if (includeNumbers) charset += '23456789';
    if (includeSymbols) charset += '!@#$%^&*()-_=+[]{}|;:,.<>?';

    if (excludeSimilar) {
      charset = charset.replace(/[il1Lo0O]/g, '');
    }

    if (excludeAmbiguous) {
      charset = charset.replace(/[{}[\]()/\\'"`~,;:.<>]/g, '');
    }

    let password = '';
    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
      password += charset[randomBytes[i] % charset.length];
    }

    return password;
  }

  /**
   * Calculate password strength (0-100)
   */
  calculatePasswordStrength(password: string): number {
    let score = 0;

    // Length
    score += Math.min(password.length * 4, 40);

    // Uppercase
    if (/[A-Z]/.test(password)) score += 10;

    // Lowercase
    if (/[a-z]/.test(password)) score += 10;

    // Numbers
    if (/[0-9]/.test(password)) score += 10;

    // Symbols
    if (/[^A-Za-z0-9]/.test(password)) score += 20;

    // Mixed case
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Sync passwords with connected devices
   */
  async syncPasswords(): Promise<void> {
    if (!this.vault || this.vault.locked || !this.localDeviceId) {
      return;
    }

    const entries = Array.from(this.vault.entries.values());

    const connections = connectionManager.getActiveConnections();

    if (connections.length === 0) {
      return;
    }

    log.info(`Syncing ${entries.length} passwords to ${connections.length} device(s)`);

    for (const connection of connections) {
      try {
        const message = createMessage(
          MessageType.BROWSER_PASSWORD_SYNC,
          {
            action: 'sync',
            entries,
            vaultId: this.vault.id,
          },
          {
            from: this.localDeviceId,
            to: connection!.remoteDevice.id,
            encrypted: true,
          }
        );

        await connectionManager.sendMessage(connection!.remoteDevice.id, message);
      } catch (error) {
        log.error(`Failed to sync passwords to ${connection!.remoteDevice.name}:`, error);
      }
    }

    this.vault.lastSync = new Date();
    this.emit('password:synced', { count: entries.length });
  }

  /**
   * Handle password sync message
   */
  async handleSyncMessage(message: Message): Promise<void> {
    if (!this.vault || this.vault.locked) {
      return;
    }

    const { action, entries, vaultId } = message.payload;

    if (action === 'sync' && entries) {
      // Merge entries (newer wins)
      entries.forEach((remoteEntry: PasswordEntry) => {
        const localEntry = this.vault!.entries.get(remoteEntry.id);

        if (!localEntry || new Date(remoteEntry.updatedAt) > localEntry.updatedAt) {
          this.vault!.entries.set(remoteEntry.id, remoteEntry);
        }
      });

      log.info(`Received password sync from ${message.from}: ${entries.length} entries`);
      this.emit('password:received', { deviceId: message.from, count: entries.length });
    }
  }

  /**
   * Export vault (encrypted)
   */
  async exportVault(): Promise<string> {
    if (!this.vault || this.vault.locked || !this.vault.encryptionKey) {
      throw new Error('Vault is locked or not initialized');
    }

    const vaultData = {
      id: this.vault.id,
      name: this.vault.name,
      entries: Array.from(this.vault.entries.values()),
      lastSync: this.vault.lastSync,
    };

    const json = JSON.stringify(vaultData);
    const { encrypted, iv, tag } = encryptionService.encrypt(json, this.vault.encryptionKey);

    return JSON.stringify({
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
    });
  }

  /**
   * Import vault (encrypted)
   */
  async importVault(encryptedData: string): Promise<void> {
    if (!this.vault || this.vault.locked || !this.vault.encryptionKey) {
      throw new Error('Vault is locked or not initialized');
    }

    const { encrypted, iv, tag } = JSON.parse(encryptedData);

    const decrypted = encryptionService.decrypt(
      Buffer.from(encrypted, 'base64'),
      this.vault.encryptionKey,
      Buffer.from(iv, 'base64'),
      Buffer.from(tag, 'base64')
    );

    const vaultData = JSON.parse(decrypted.toString('utf8'));

    // Import entries
    vaultData.entries.forEach((entry: PasswordEntry) => {
      this.vault!.entries.set(entry.id, entry);
    });

    log.info(`Imported ${vaultData.entries.length} passwords`);
    this.emit('password:vault:imported', { count: vaultData.entries.length });
  }

  /**
   * Get all entries
   */
  getAllEntries(): PasswordEntry[] {
    if (!this.vault || this.vault.locked) {
      return [];
    }

    return Array.from(this.vault.entries.values());
  }

  /**
   * Get weak passwords
   */
  getWeakPasswords(): PasswordEntry[] {
    if (!this.vault || this.vault.locked) {
      return [];
    }

    return Array.from(this.vault.entries.values()).filter((entry) => entry.strength < 60);
  }

  /**
   * Start auto-sync
   */
  private startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      try {
        await this.syncPasswords();
      } catch (error) {
        log.error('Auto-sync failed:', error);
      }
    }, this.options.syncInterval);

    log.info(`Password auto-sync started (interval: ${this.options.syncInterval}ms)`);
  }

  /**
   * Stop auto-sync
   */
  private stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
      log.info('Password auto-sync stopped');
    }
  }

  /**
   * Update settings
   */
  updateSettings(options: Partial<PasswordManagerOptions>): void {
    Object.assign(this.options, options);

    // Restart auto-sync if settings changed
    if (options.autoSync !== undefined || options.syncInterval !== undefined) {
      if (this.options.autoSync && !this.vault?.locked) {
        this.startAutoSync();
      } else {
        this.stopAutoSync();
      }
    }
  }

  /**
   * Get current settings
   */
  getSettings(): Required<PasswordManagerOptions> {
    return { ...this.options };
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.stopAutoSync();
    this.lockVault();
    log.info('Password manager service cleaned up');
  }
}

// Export singleton instance
export const passwordManagerService = new PasswordManagerService();
