import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import { Message, MessageType, ClipboardData } from '@portal-fusion/shared';
import { createMessage } from '@portal-fusion/shared';
import { connectionManager } from '../connection';
import log from 'electron-log';

export interface ScreenshotOptions {
  format?: 'png' | 'jpeg';
  quality?: number;
  autoShare?: boolean;
}

export interface ScreenshotCapture {
  id: string;
  image: Buffer;
  format: string;
  timestamp: Date;
  displayId?: number;
}

/**
 * Screenshot Capture and Share Service
 */
export class ScreenshotService extends TypedEventEmitter<PortalFusionEvents> {
  private options: Required<ScreenshotOptions>;
  private localDeviceId?: string;
  private lastScreenshot?: ScreenshotCapture;

  constructor(options: ScreenshotOptions = {}) {
    super();

    this.options = {
      format: options.format || 'png',
      quality: options.quality || 90,
      autoShare: options.autoShare || false,
    };
  }

  /**
   * Initialize service
   */
  initialize(localDeviceId: string): void {
    this.localDeviceId = localDeviceId;
    log.info('Screenshot service initialized');
  }

  /**
   * Capture screenshot (to be implemented via native bridge)
   */
  async captureScreenshot(displayId?: number): Promise<ScreenshotCapture> {
    if (!this.localDeviceId) {
      throw new Error('Service not initialized');
    }

    // This will be implemented via the native bridge
    const screenshot: ScreenshotCapture = {
      id: Date.now().toString(),
      image: Buffer.from(''), // Placeholder
      format: this.options.format,
      timestamp: new Date(),
      displayId,
    };

    this.lastScreenshot = screenshot;

    log.info('Screenshot captured');

    // Auto-share if enabled
    if (this.options.autoShare) {
      await this.shareScreenshot(screenshot);
    }

    return screenshot;
  }

  /**
   * Share screenshot with connected devices
   */
  async shareScreenshot(screenshot: ScreenshotCapture, targetDeviceId?: string): Promise<void> {
    if (!this.localDeviceId) {
      throw new Error('Service not initialized');
    }

    // Create clipboard data from screenshot
    const clipboardData: ClipboardData = {
      type: 'image',
      data: screenshot.image,
      format: screenshot.format,
      metadata: {
        timestamp: screenshot.timestamp,
        source: 'screenshot',
      },
    };

    // Get target devices
    const connections = targetDeviceId
      ? [connectionManager.getConnection(targetDeviceId)].filter(Boolean)
      : connectionManager.getActiveConnections();

    if (connections.length === 0) {
      log.warn('No connected devices to share screenshot');
      return;
    }

    log.info(`Sharing screenshot to ${connections.length} device(s)`);

    // Send to target devices
    for (const connection of connections) {
      try {
        const message = createMessage(
          MessageType.CLIPBOARD_IMAGE,
          clipboardData,
          {
            from: this.localDeviceId,
            to: connection!.remoteDevice.id,
            compressed: true,
          }
        );

        await connectionManager.sendMessage(connection!.remoteDevice.id, message);
      } catch (error) {
        log.error(`Failed to share screenshot to ${connection!.remoteDevice.name}:`, error);
      }
    }
  }

  /**
   * Capture and share screenshot
   */
  async captureAndShare(displayId?: number, targetDeviceId?: string): Promise<void> {
    const screenshot = await this.captureScreenshot(displayId);
    await this.shareScreenshot(screenshot, targetDeviceId);
  }

  /**
   * Get last screenshot
   */
  getLastScreenshot(): ScreenshotCapture | undefined {
    return this.lastScreenshot;
  }

  /**
   * Save screenshot to file (to be implemented via native bridge)
   */
  async saveScreenshot(screenshot: ScreenshotCapture, filePath: string): Promise<void> {
    // This will be implemented via the native bridge
    log.info(`Screenshot saved to ${filePath}`);
  }

  /**
   * Update settings
   */
  updateSettings(options: Partial<ScreenshotOptions>): void {
    Object.assign(this.options, options);
  }

  /**
   * Get current settings
   */
  getSettings(): Required<ScreenshotOptions> {
    return { ...this.options };
  }
}

// Export singleton instance
export const screenshotService = new ScreenshotService();
