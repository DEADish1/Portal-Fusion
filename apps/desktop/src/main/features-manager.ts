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
  kvmService,
  secondScreenService,
  gestureTranslationService,
  audioRoutingService,
  cameraSharingService,
  microphoneRoutingService,
  browserSyncService,
  passwordManagerService,
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

      // Initialize KVM service
      this.initializeKVM();

      // Initialize second screen service
      this.initializeSecondScreen();

      // Initialize gesture translation service
      this.initializeGestureTranslation();

      // Initialize audio routing service
      this.initializeAudioRouting();

      // Initialize camera sharing service
      await this.initializeCameraSharing();

      // Initialize microphone routing service
      await this.initializeMicrophoneRouting();

      // Initialize browser sync service
      this.initializeBrowserSync();

      // Initialize password manager service
      this.initializePasswordManager();

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
   * Initialize KVM service
   */
  private initializeKVM(): void {
    kvmService.initialize(this.localDeviceId!);

    // Listen for KVM events
    kvmService.on('kvm:control:started', (session) => {
      log.info(`Started controlling device: ${session.controlledDeviceId}`);
      this.window.webContents.send('kvm:control:started', session);
    });

    kvmService.on('kvm:control:stopped', () => {
      log.info('Stopped controlling device');
      this.window.webContents.send('kvm:control:stopped');
    });

    kvmService.on('kvm:being-controlled', (session) => {
      log.info(`Being controlled by device: ${session.controllerDeviceId}`);
      this.window.webContents.send('kvm:being-controlled', session);
    });

    kvmService.on('kvm:control-ended', () => {
      log.info('Control session ended');
      this.window.webContents.send('kvm:control-ended');
    });

    // Handle incoming input events (when being controlled)
    kvmService.on('kvm:keyboard-event', (event) => {
      // Forward to native input injection (would use robotjs or similar)
      this.window.webContents.send('kvm:keyboard-event', event);
    });

    kvmService.on('kvm:mouse-event', (event) => {
      // Forward to native input injection
      this.window.webContents.send('kvm:mouse-event', event);
    });

    kvmService.on('kvm:touch-event', (event) => {
      // Forward to native input injection
      this.window.webContents.send('kvm:touch-event', event);
    });

    log.info('KVM service initialized');
  }

  /**
   * Initialize second screen service
   */
  private initializeSecondScreen(): void {
    secondScreenService.initialize(this.localDeviceId!);

    // Listen for hosting events
    secondScreenService.on('screen:hosting:started', (session) => {
      log.info(`Started hosting second screen for: ${session.clientDeviceId}`);
      this.window.webContents.send('screen:hosting:started', session);
    });

    secondScreenService.on('screen:hosting:stopped', () => {
      log.info('Stopped hosting second screen');
      this.window.webContents.send('screen:hosting:stopped');
    });

    // Listen for client events
    secondScreenService.on('screen:client:started', (session) => {
      log.info(`Acting as second screen for: ${session.hostDeviceId}`);
      this.window.webContents.send('screen:client:started', session);
    });

    secondScreenService.on('screen:client:stopped', () => {
      log.info('Second screen session ended');
      this.window.webContents.send('screen:client:stopped');
    });

    // Handle received frames
    secondScreenService.on('screen:frame:received', (frameData) => {
      this.window.webContents.send('screen:frame:received', frameData);
    });

    // Handle config updates
    secondScreenService.on('screen:config:updated', (config) => {
      log.info('Screen configuration updated');
      this.window.webContents.send('screen:config:updated', config);
    });

    log.info('Second screen service initialized');
  }

  /**
   * Initialize gesture translation service
   */
  private initializeGestureTranslation(): void {
    gestureTranslationService.initialize(this.localDeviceId!);

    // Listen for detected gestures
    gestureTranslationService.on('gesture:detected', ({ gesture, mapping }) => {
      log.info(`Gesture detected: ${gesture.type} -> ${mapping.action}`);
      this.window.webContents.send('gesture:detected', { gesture, mapping });
    });

    // Forward translated mouse events
    gestureTranslationService.on('gesture:mouse-event', (mouseEvent) => {
      this.window.webContents.send('gesture:mouse-event', mouseEvent);
    });

    // Forward translated keyboard events
    gestureTranslationService.on('gesture:keyboard-event', (keyboardEvent) => {
      this.window.webContents.send('gesture:keyboard-event', keyboardEvent);
    });

    log.info('Gesture translation service initialized');
  }

  /**
   * Initialize audio routing service
   */
  private initializeAudioRouting(): void {
    audioRoutingService.initialize(this.localDeviceId!);

    // Listen for stream events
    audioRoutingService.on('audio:stream:started', (stream) => {
      log.info(`Audio stream started: ${stream.type} -> ${stream.targetDeviceId}`);
      this.window.webContents.send('audio:stream:started', stream);
    });

    audioRoutingService.on('audio:stream:stopped', ({ streamId }) => {
      log.info(`Audio stream stopped: ${streamId}`);
      this.window.webContents.send('audio:stream:stopped', { streamId });
    });

    audioRoutingService.on('audio:stream:receiving', (stream) => {
      log.info(`Receiving audio stream from: ${stream.sourceDeviceId}`);
      this.window.webContents.send('audio:stream:receiving', stream);
    });

    audioRoutingService.on('audio:stream:ended', ({ streamId }) => {
      log.info(`Audio stream ended: ${streamId}`);
      this.window.webContents.send('audio:stream:ended', { streamId });
    });

    // Handle audio packets
    audioRoutingService.on('audio:packet:received', (packetData) => {
      this.window.webContents.send('audio:packet:received', packetData);
    });

    // Handle device and volume changes
    audioRoutingService.on('audio:device:changed', ({ streamId, device }) => {
      log.info(`Audio device changed for stream ${streamId}: ${device.name}`);
      this.window.webContents.send('audio:device:changed', { streamId, device });
    });

    audioRoutingService.on('audio:volume:changed', ({ streamId, volume }) => {
      this.window.webContents.send('audio:volume:changed', { streamId, volume });
    });

    audioRoutingService.on('audio:mute:changed', ({ streamId, muted }) => {
      log.info(`Stream ${streamId} ${muted ? 'muted' : 'unmuted'}`);
      this.window.webContents.send('audio:mute:changed', { streamId, muted });
    });

    log.info('Audio routing service initialized');
  }

  /**
   * Initialize camera sharing service
   */
  private async initializeCameraSharing(): Promise<void> {
    await cameraSharingService.initialize(this.localDeviceId!);

    // Listen for camera share events
    cameraSharingService.on('camera:share:started', (stream) => {
      log.info(`Camera share started: ${stream.cameraId} -> ${stream.targetDeviceId}`);
      this.window.webContents.send('camera:share:started', stream);
    });

    cameraSharingService.on('camera:share:stopped', ({ streamId }) => {
      log.info(`Camera share stopped: ${streamId}`);
      this.window.webContents.send('camera:share:stopped', { streamId });
    });

    cameraSharingService.on('camera:stream:receiving', (stream) => {
      log.info(`Receiving camera stream from: ${stream.sourceDeviceId}`);
      this.window.webContents.send('camera:stream:receiving', stream);
    });

    cameraSharingService.on('camera:stream:ended', ({ streamId }) => {
      log.info(`Camera stream ended: ${streamId}`);
      this.window.webContents.send('camera:stream:ended', { streamId });
    });

    // Handle video frames
    cameraSharingService.on('camera:frame:received', (frameData) => {
      this.window.webContents.send('camera:frame:received', frameData);
    });

    // Handle config updates
    cameraSharingService.on('camera:config:updated', ({ streamId, config }) => {
      log.info(`Camera config updated: ${streamId}`);
      this.window.webContents.send('camera:config:updated', { streamId, config });
    });

    // Handle snapshots
    cameraSharingService.on('camera:snapshot:taken', ({ streamId, snapshot }) => {
      log.info(`Snapshot taken: ${streamId}`);
      this.window.webContents.send('camera:snapshot:taken', { streamId, snapshot });
    });

    log.info('Camera sharing service initialized');
  }

  /**
   * Initialize microphone routing service
   */
  private async initializeMicrophoneRouting(): Promise<void> {
    await microphoneRoutingService.initialize(this.localDeviceId!);

    // Listen for microphone stream events
    microphoneRoutingService.on('microphone:stream:started', (stream) => {
      log.info(`Microphone stream started: ${stream.microphoneId} -> ${stream.targetDeviceId}`);
      this.window.webContents.send('microphone:stream:started', stream);
    });

    microphoneRoutingService.on('microphone:stream:stopped', ({ streamId }) => {
      log.info(`Microphone stream stopped: ${streamId}`);
      this.window.webContents.send('microphone:stream:stopped', { streamId });
    });

    microphoneRoutingService.on('microphone:stream:receiving', (stream) => {
      log.info(`Receiving microphone stream from: ${stream.sourceDeviceId}`);
      this.window.webContents.send('microphone:stream:receiving', stream);
    });

    microphoneRoutingService.on('microphone:stream:ended', ({ streamId }) => {
      log.info(`Microphone stream ended: ${streamId}`);
      this.window.webContents.send('microphone:stream:ended', { streamId });
    });

    // Handle audio packets
    microphoneRoutingService.on('microphone:packet:received', (packetData) => {
      this.window.webContents.send('microphone:packet:received', packetData);
    });

    // Handle settings changes
    microphoneRoutingService.on('microphone:gain:changed', ({ streamId, gain }) => {
      this.window.webContents.send('microphone:gain:changed', { streamId, gain });
    });

    microphoneRoutingService.on('microphone:mute:changed', ({ streamId, muted }) => {
      log.info(`Microphone ${muted ? 'muted' : 'unmuted'}: ${streamId}`);
      this.window.webContents.send('microphone:mute:changed', { streamId, muted });
    });

    microphoneRoutingService.on('microphone:processing:updated', ({ streamId, settings }) => {
      log.info(`Audio processing updated: ${streamId}`);
      this.window.webContents.send('microphone:processing:updated', { streamId, settings });
    });

    // Handle test events
    microphoneRoutingService.on('microphone:test:started', ({ microphoneId, duration }) => {
      log.info(`Testing microphone: ${microphoneId} for ${duration}ms`);
      this.window.webContents.send('microphone:test:started', { microphoneId, duration });
    });

    microphoneRoutingService.on('microphone:test:completed', ({ microphoneId, levels }) => {
      log.info(`Microphone test completed: ${microphoneId}`);
      this.window.webContents.send('microphone:test:completed', { microphoneId, levels });
    });

    log.info('Microphone routing service initialized');
  }

  /**
   * Initialize browser sync service
   */
  private initializeBrowserSync(): void {
    browserSyncService.initialize(this.localDeviceId!);

    // Listen for tab sync events
    browserSyncService.on('browser:tabs:synced', ({ tabs }) => {
      log.info(`Tabs synced: ${tabs.length} tabs`);
      this.window.webContents.send('browser:tabs:synced', { tabs });
    });

    browserSyncService.on('browser:tabs:received', ({ deviceId, session }) => {
      log.info(`Received tabs from ${deviceId}: ${session.tabs.length} tabs`);
      this.window.webContents.send('browser:tabs:received', { deviceId, session });
    });

    browserSyncService.on('browser:tab:sent', ({ tab, targetDeviceId }) => {
      log.info(`Tab sent to ${targetDeviceId}: ${tab.title}`);
      this.window.webContents.send('browser:tab:sent', { tab, targetDeviceId });
    });

    browserSyncService.on('browser:tab:received', ({ deviceId, tab }) => {
      log.info(`Received tab from ${deviceId}: ${tab.title}`);
      this.window.webContents.send('browser:tab:received', { deviceId, tab });
    });

    // Listen for history sync events
    browserSyncService.on('browser:history:synced', ({ history }) => {
      log.info(`History synced: ${history.length} entries`);
      this.window.webContents.send('browser:history:synced', { history });
    });

    browserSyncService.on('browser:history:received', ({ deviceId, history }) => {
      log.info(`Received history from ${deviceId}: ${history.length} entries`);
      this.window.webContents.send('browser:history:received', { deviceId, history });
    });

    // Listen for bookmarks sync events
    browserSyncService.on('browser:bookmarks:synced', ({ bookmarks }) => {
      log.info(`Bookmarks synced: ${bookmarks.length} bookmarks`);
      this.window.webContents.send('browser:bookmarks:synced', { bookmarks });
    });

    browserSyncService.on('browser:bookmarks:received', ({ deviceId, bookmarks }) => {
      log.info(`Received bookmarks from ${deviceId}: ${bookmarks.length} bookmarks`);
      this.window.webContents.send('browser:bookmarks:received', { deviceId, bookmarks });
    });

    log.info('Browser sync service initialized');
  }

  /**
   * Initialize password manager service
   */
  private initializePasswordManager(): void {
    passwordManagerService.initialize(this.localDeviceId!);

    // Listen for vault events
    passwordManagerService.on('password:vault:unlocked', () => {
      log.info('Password vault unlocked');
      this.window.webContents.send('password:vault:unlocked');
    });

    passwordManagerService.on('password:vault:locked', () => {
      log.info('Password vault locked');
      this.window.webContents.send('password:vault:locked');
    });

    passwordManagerService.on('password:vault:unlock-failed', () => {
      log.warn('Password vault unlock failed');
      this.window.webContents.send('password:vault:unlock-failed');
    });

    // Listen for password entry events
    passwordManagerService.on('password:entry:added', (entry) => {
      log.info(`Password added: ${entry.domain}`);
      this.window.webContents.send('password:entry:added', entry);
    });

    passwordManagerService.on('password:entry:updated', (entry) => {
      log.info(`Password updated: ${entry.domain}`);
      this.window.webContents.send('password:entry:updated', entry);
    });

    passwordManagerService.on('password:entry:deleted', ({ entryId }) => {
      log.info(`Password deleted: ${entryId}`);
      this.window.webContents.send('password:entry:deleted', { entryId });
    });

    // Listen for sync events
    passwordManagerService.on('password:synced', ({ count }) => {
      log.info(`Passwords synced: ${count} entries`);
      this.window.webContents.send('password:synced', { count });
    });

    passwordManagerService.on('password:received', ({ deviceId, count }) => {
      log.info(`Received passwords from ${deviceId}: ${count} entries`);
      this.window.webContents.send('password:received', { deviceId, count });
    });

    // Listen for import/export events
    passwordManagerService.on('password:vault:imported', ({ count }) => {
      log.info(`Vault imported: ${count} passwords`);
      this.window.webContents.send('password:vault:imported', { count });
    });

    log.info('Password manager service initialized');
  }

  /**
   * Cleanup
   */
  destroy(): void {
    clipboardSyncService.stop();
    audioRoutingService.cleanup();
    cameraSharingService.cleanup();
    microphoneRoutingService.cleanup();
    browserSyncService.cleanup();
    passwordManagerService.cleanup();
    log.info('Features manager destroyed');
  }
}
