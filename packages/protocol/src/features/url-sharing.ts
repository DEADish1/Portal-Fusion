import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import { Message, MessageType } from '@portal-fusion/shared';
import { createMessage } from '@portal-fusion/shared';
import { connectionManager } from '../connection';
import log from 'electron-log';

export interface URLShareOptions {
  enabled?: boolean;
  autoOpen?: boolean;
  confirmBeforeOpen?: boolean;
}

export interface SharedURL {
  id: string;
  url: string;
  title?: string;
  sourceDevice: string;
  timestamp: Date;
  opened: boolean;
}

/**
 * URL/Link Sharing Service
 * Share URLs and links between devices
 */
export class URLSharingService extends TypedEventEmitter<PortalFusionEvents> {
  private options: Required<URLShareOptions>;
  private localDeviceId?: string;
  private sharedURLs: Map<string, SharedURL> = new Map();

  constructor(options: URLShareOptions = {}) {
    super();

    this.options = {
      enabled: options.enabled !== false,
      autoOpen: options.autoOpen || false,
      confirmBeforeOpen: options.confirmBeforeOpen !== false,
    };
  }

  /**
   * Initialize service
   */
  initialize(localDeviceId: string): void {
    this.localDeviceId = localDeviceId;
    log.info('URL sharing service initialized');
  }

  /**
   * Share URL to device(s)
   */
  async shareURL(url: string, title?: string, targetDeviceId?: string): Promise<void> {
    if (!this.options.enabled || !this.localDeviceId) {
      return;
    }

    // Validate URL
    if (!this.isValidURL(url)) {
      throw new Error('Invalid URL');
    }

    // Get target devices
    const connections = targetDeviceId
      ? [connectionManager.getConnection(targetDeviceId)].filter(Boolean)
      : connectionManager.getActiveConnections();

    if (connections.length === 0) {
      log.warn('No connected devices to share URL');
      return;
    }

    log.info(`Sharing URL to ${connections.length} device(s): ${url}`);

    // Send to target devices
    for (const connection of connections) {
      try {
        const message = createMessage(
          MessageType.CLIPBOARD_TEXT,
          {
            type: 'text',
            data: url,
            metadata: {
              isURL: true,
              title,
              timestamp: new Date(),
            },
          },
          {
            from: this.localDeviceId,
            to: connection!.remoteDevice.id,
          }
        );

        await connectionManager.sendMessage(connection!.remoteDevice.id, message);
      } catch (error) {
        log.error(`Failed to share URL to ${connection!.remoteDevice.name}:`, error);
      }
    }
  }

  /**
   * Handle received URL
   */
  async handleURLReceived(message: Message): Promise<void> {
    if (!this.options.enabled) {
      return;
    }

    const { data, metadata } = message.payload;

    // Check if it's a URL
    if (!metadata?.isURL || !this.isValidURL(data)) {
      return;
    }

    const sharedURL: SharedURL = {
      id: message.id,
      url: data,
      title: metadata.title,
      sourceDevice: message.from,
      timestamp: new Date(metadata.timestamp),
      opened: false,
    };

    this.sharedURLs.set(sharedURL.id, sharedURL);

    log.info(`Received shared URL: ${data}`);

    // Emit event
    this.emit('url:received', sharedURL);

    // Auto-open if enabled
    if (this.options.autoOpen && !this.options.confirmBeforeOpen) {
      await this.openURL(sharedURL.id);
    }
  }

  /**
   * Open URL (to be implemented via native bridge)
   */
  async openURL(urlId: string): Promise<void> {
    const sharedURL = this.sharedURLs.get(urlId);

    if (!sharedURL) {
      throw new Error('URL not found');
    }

    // This will be implemented via the native bridge (shell.openExternal)
    sharedURL.opened = true;

    log.info(`Opening URL: ${sharedURL.url}`);

    this.emit('url:opened', sharedURL);
  }

  /**
   * Validate URL
   */
  private isValidURL(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:', 'ftp:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Get shared URLs
   */
  getSharedURLs(limit?: number): SharedURL[] {
    const urls = Array.from(this.sharedURLs.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    return limit ? urls.slice(0, limit) : urls;
  }

  /**
   * Clear shared URLs
   */
  clearSharedURLs(): void {
    this.sharedURLs.clear();
  }

  /**
   * Update settings
   */
  updateSettings(options: Partial<URLShareOptions>): void {
    Object.assign(this.options, options);
  }

  /**
   * Get current settings
   */
  getSettings(): Required<URLShareOptions> {
    return { ...this.options };
  }
}

// Export singleton instance
export const urlSharingService = new URLSharingService();
