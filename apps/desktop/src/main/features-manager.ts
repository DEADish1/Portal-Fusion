import { BrowserWindow, app } from 'electron';
import * as path from 'path';
import log from 'electron-log';
import { NativeBridge } from './native-bridge';
import {
  clipboardSyncService,
  fileTransferService,
  notificationMirrorService,
  screenshotService,
  urlSharingService,
  discoveryService,
} from '@portal-fusion/protocol';

/**
 * Features Manager
 * Manages and coordinates all Phase 4 features
 */
export class FeaturesManager {
  private window: BrowserWindow;
  private nativeBridge: NativeBridge;
  private localDeviceId?: string;

  constructor(window: BrowserWindow, nativeBridge: NativeBridge) {
    this.window = window;
    this.nativeBridge = nativeBridge;
  }

  /**
   * Initialize all features
   */
  async initialize(): Promise<void> {
    try {
      // Get local device
      const localDevice = discoveryService.getLocalDevice();
      this.localDeviceId = localDevice.id;

      // Initialize clipboard sync
      this.initializeClipboardSync();

      // Initialize file transfer
      this.initializeFileTransfer();

      // Initialize notification mirroring
      this.initializeNotificationMirror();

      // Initialize screenshot service
      this.initializeScreenshotService();

      // Initialize URL sharing
      this.initializeURLSharing();

      log.info('All features initialized successfully');
    } catch (error) {
      log.error('Failed to initialize features:', error);
      throw error;
    }
  }

  /**
   * Initialize clipboard sync
   */
  private initializeClipboardSync(): void {
    // Inject native bridge methods
    (clipboardSyncService as any).getClipboardFromNative = async () => {
      return this.nativeBridge.getClipboard();
    };

    (clipboardSyncService as any).setClipboardToNative = async (clipboardData: any) => {
      return this.nativeBridge.setClipboard(clipboardData);
    };

    // Start clipboard sync
    clipboardSyncService.start(this.localDeviceId!);

    log.info('Clipboard sync initialized');
  }

  /**
   * Initialize file transfer
   */
  private initializeFileTransfer(): void {
    // Get downloads path
    const downloadsPath = app.getPath('downloads');

    // Initialize file transfer service
    fileTransferService.initialize(this.localDeviceId!, downloadsPath);

    // Listen for file transfer events
    fileTransferService.on('file:transfer:start', (transfer) => {
      log.info(`File transfer started: ${transfer.fileName}`);
      this.window.webContents.send('file:transfer:start', transfer);
    });

    fileTransferService.on('file:transfer:progress', (transfer) => {
      this.window.webContents.send('file:transfer:progress', transfer);
    });

    fileTransferService.on('file:transfer:complete', (transfer) => {
      log.info(`File transfer completed: ${transfer.fileName}`);
      this.window.webContents.send('file:transfer:complete', transfer);
    });

    log.info('File transfer initialized');
  }

  /**
   * Initialize notification mirroring
   */
  private initializeNotificationMirror(): void {
    notificationMirrorService.initialize(this.localDeviceId!);

    // Listen for received notifications
    notificationMirrorService.on('notification:received', (notification) => {
      log.info(`Received mirrored notification: ${notification.title}`);
      this.window.webContents.send('notification:received', notification);
    });

    log.info('Notification mirroring initialized');
  }

  /**
   * Initialize screenshot service
   */
  private initializeScreenshotService(): void {
    screenshotService.initialize(this.localDeviceId!);

    // Inject native screenshot capture (using desktopCapturer)
    (screenshotService as any).captureScreenshot = async (displayId?: number) => {
      const sources = await this.nativeBridge.getSources();

      // Find the screen source
      const screenSource = displayId
        ? sources.find(s => s.display_id === displayId.toString())
        : sources.find(s => s.id.startsWith('screen'));

      if (!screenSource) {
        throw new Error('No screen source found');
      }

      // Get thumbnail as screenshot
      const thumbnailData = screenSource.thumbnail;
      const imageBuffer = Buffer.from(thumbnailData.split(',')[1], 'base64');

      return {
        id: Date.now().toString(),
        image: imageBuffer,
        format: 'png',
        timestamp: new Date(),
        displayId,
      };
    };

    log.info('Screenshot service initialized');
  }

  /**
   * Initialize URL sharing
   */
  private initializeURLSharing(): void {
    urlSharingService.initialize(this.localDeviceId!);

    // Listen for received URLs
    urlSharingService.on('url:received', (sharedURL) => {
      log.info(`Received shared URL: ${sharedURL.url}`);
      this.window.webContents.send('url:received', sharedURL);
    });

    // Inject native URL opening
    (urlSharingService as any).openURL = async (urlId: string) => {
      const sharedURL = urlSharingService.getSharedURLs().find(u => u.id === urlId);
      if (sharedURL) {
        const { shell } = require('electron');
        await shell.openExternal(sharedURL.url);
        sharedURL.opened = true;
        urlSharingService.emit('url:opened', sharedURL);
      }
    };

    log.info('URL sharing initialized');
  }

  /**
   * Cleanup
   */
  destroy(): void {
    clipboardSyncService.stop();
    log.info('Features manager destroyed');
  }
}
