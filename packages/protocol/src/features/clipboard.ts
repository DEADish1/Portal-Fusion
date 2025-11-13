import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import { ClipboardData, Message, MessageType } from '@portal-fusion/shared';
import { createMessage, generateChecksum } from '@portal-fusion/shared';
import { CLIPBOARD_SYNC_DELAY, MAX_CLIPBOARD_TEXT_SIZE, MAX_CLIPBOARD_IMAGE_SIZE } from '@portal-fusion/shared';
import { connectionManager } from '../connection';
import log from 'electron-log';

export interface ClipboardSyncOptions {
  enabled?: boolean;
  syncText?: boolean;
  syncImages?: boolean;
  syncFiles?: boolean;
  syncHtml?: boolean;
  autoSync?: boolean;
  syncDelay?: number;
}

/**
 * Clipboard Sync Service
 * Monitors and syncs clipboard content across devices
 */
export class ClipboardSyncService extends TypedEventEmitter<PortalFusionEvents> {
  private options: Required<ClipboardSyncOptions>;
  private lastClipboardHash?: string;
  private syncTimer?: NodeJS.Timeout;
  private monitorInterval?: NodeJS.Timeout;
  private localDeviceId?: string;
  private paused = false;

  constructor(options: ClipboardSyncOptions = {}) {
    super();

    this.options = {
      enabled: options.enabled !== false,
      syncText: options.syncText !== false,
      syncImages: options.syncImages !== false,
      syncFiles: options.syncFiles !== false,
      syncHtml: options.syncHtml !== false,
      autoSync: options.autoSync !== false,
      syncDelay: options.syncDelay || CLIPBOARD_SYNC_DELAY,
    };
  }

  /**
   * Start clipboard monitoring
   */
  start(localDeviceId: string): void {
    if (!this.options.enabled) {
      log.info('Clipboard sync is disabled');
      return;
    }

    this.localDeviceId = localDeviceId;
    this.paused = false;

    // Start monitoring clipboard changes
    this.monitorInterval = setInterval(() => {
      this.checkClipboard();
    }, 500); // Check every 500ms

    log.info('Clipboard sync started');
  }

  /**
   * Stop clipboard monitoring
   */
  stop(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = undefined;
    }

    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = undefined;
    }

    log.info('Clipboard sync stopped');
  }

  /**
   * Check for clipboard changes
   */
  private async checkClipboard(): Promise<void> {
    if (this.paused || !this.localDeviceId) return;

    try {
      // Get clipboard content from native bridge (will be injected)
      const clipboardData = await this.getClipboardFromNative();

      if (!clipboardData) return;

      // Calculate hash of clipboard content
      const hash = this.hashClipboardData(clipboardData);

      // Check if clipboard has changed
      if (hash !== this.lastClipboardHash) {
        this.lastClipboardHash = hash;

        // Debounce sync
        if (this.syncTimer) {
          clearTimeout(this.syncTimer);
        }

        this.syncTimer = setTimeout(() => {
          this.syncClipboard(clipboardData);
        }, this.options.syncDelay);
      }
    } catch (error) {
      log.error('Failed to check clipboard:', error);
    }
  }

  /**
   * Sync clipboard to connected devices
   */
  private async syncClipboard(clipboardData: ClipboardData): Promise<void> {
    if (!this.localDeviceId) return;

    // Check if this type is enabled
    if (!this.shouldSyncType(clipboardData.type)) {
      return;
    }

    // Validate size limits
    if (!this.validateSize(clipboardData)) {
      log.warn('Clipboard content exceeds size limit');
      return;
    }

    // Get connected devices
    const connections = connectionManager.getActiveConnections();

    if (connections.length === 0) {
      return;
    }

    log.info(`Syncing clipboard (${clipboardData.type}) to ${connections.length} device(s)`);

    // Send to all connected devices
    for (const connection of connections) {
      try {
        const message = this.createClipboardMessage(clipboardData, connection.remoteDevice.id);
        await connectionManager.sendMessage(connection.remoteDevice.id, message);
      } catch (error) {
        log.error(`Failed to sync clipboard to ${connection.remoteDevice.name}:`, error);
      }
    }

    // Emit event
    this.emit('clipboard:changed', clipboardData);
  }

  /**
   * Handle received clipboard message
   */
  async handleClipboardMessage(message: Message): Promise<void> {
    if (!this.options.enabled) return;

    const clipboardData = message.payload as ClipboardData;

    // Validate
    if (!this.shouldSyncType(clipboardData.type)) {
      return;
    }

    if (!this.validateSize(clipboardData)) {
      log.warn('Received clipboard content exceeds size limit');
      return;
    }

    // Temporarily pause monitoring to avoid loop
    this.paused = true;

    try {
      // Set clipboard via native bridge
      await this.setClipboardToNative(clipboardData);

      // Update hash
      this.lastClipboardHash = this.hashClipboardData(clipboardData);

      log.info(`Clipboard synced from ${message.from} (${clipboardData.type})`);

      // Emit event
      this.emit('clipboard:changed', clipboardData);
    } catch (error) {
      log.error('Failed to set clipboard:', error);
    } finally {
      // Resume monitoring after a delay
      setTimeout(() => {
        this.paused = false;
      }, 1000);
    }
  }

  /**
   * Create clipboard message
   */
  private createClipboardMessage(clipboardData: ClipboardData, targetDeviceId: string): Message {
    let messageType: MessageType;

    switch (clipboardData.type) {
      case 'image':
        messageType = MessageType.CLIPBOARD_IMAGE;
        break;
      case 'html':
        messageType = MessageType.CLIPBOARD_HTML;
        break;
      case 'file':
        messageType = MessageType.CLIPBOARD_FILE;
        break;
      default:
        messageType = MessageType.CLIPBOARD_TEXT;
    }

    return createMessage(
      messageType,
      clipboardData,
      {
        from: this.localDeviceId!,
        to: targetDeviceId,
        compressed: clipboardData.data.length > 1024,
        encrypted: true,
      }
    );
  }

  /**
   * Check if type should be synced
   */
  private shouldSyncType(type: ClipboardData['type']): boolean {
    switch (type) {
      case 'text':
        return this.options.syncText;
      case 'image':
        return this.options.syncImages;
      case 'file':
        return this.options.syncFiles;
      case 'html':
        return this.options.syncHtml;
      default:
        return false;
    }
  }

  /**
   * Validate clipboard data size
   */
  private validateSize(clipboardData: ClipboardData): boolean {
    const size = clipboardData.data.length;

    switch (clipboardData.type) {
      case 'text':
      case 'html':
        return size <= MAX_CLIPBOARD_TEXT_SIZE;
      case 'image':
        return size <= MAX_CLIPBOARD_IMAGE_SIZE;
      case 'file':
        // Files handled separately with chunking
        return true;
      default:
        return false;
    }
  }

  /**
   * Hash clipboard data for change detection
   */
  private hashClipboardData(clipboardData: ClipboardData): string {
    const dataStr = typeof clipboardData.data === 'string'
      ? clipboardData.data
      : clipboardData.data.toString('base64');

    return generateChecksum(dataStr);
  }

  /**
   * Get clipboard from native bridge (to be injected)
   */
  private async getClipboardFromNative(): Promise<ClipboardData | null> {
    // This will be injected by the IPC bridge
    return null;
  }

  /**
   * Set clipboard to native bridge (to be injected)
   */
  private async setClipboardToNative(clipboardData: ClipboardData): Promise<void> {
    // This will be injected by the IPC bridge
  }

  /**
   * Manually sync clipboard
   */
  async manualSync(): Promise<void> {
    const clipboardData = await this.getClipboardFromNative();
    if (clipboardData) {
      await this.syncClipboard(clipboardData);
    }
  }

  /**
   * Update settings
   */
  updateSettings(options: Partial<ClipboardSyncOptions>): void {
    Object.assign(this.options, options);
  }

  /**
   * Get current settings
   */
  getSettings(): Required<ClipboardSyncOptions> {
    return { ...this.options };
  }

  /**
   * Pause clipboard sync temporarily
   */
  pause(): void {
    this.paused = true;
  }

  /**
   * Resume clipboard sync
   */
  resume(): void {
    this.paused = false;
  }
}

// Export singleton instance
export const clipboardSyncService = new ClipboardSyncService();
