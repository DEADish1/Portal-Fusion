import { Notification, nativeImage } from 'electron';
import * as path from 'path';
import log from 'electron-log';

export interface NotificationOptions {
  title: string;
  body: string;
  subtitle?: string;
  icon?: string;
  urgency?: 'normal' | 'critical' | 'low';
  silent?: boolean;
  actions?: Array<{
    type: string;
    text: string;
  }>;
  onClick?: () => void;
  onClose?: () => void;
  onAction?: (actionIndex: number) => void;
}

export class NotificationManager {
  private notifications: Map<string, Notification> = new Map();

  /**
   * Show a native notification
   */
  show(options: NotificationOptions): string {
    try {
      const notificationId = `notif-${Date.now()}`;

      const notification = new Notification({
        title: options.title,
        body: options.body,
        subtitle: options.subtitle,
        icon: options.icon ? options.icon : this.getDefaultIcon(),
        urgency: options.urgency || 'normal',
        silent: options.silent || false,
        actions: options.actions || [],
        timeoutType: options.urgency === 'critical' ? 'never' : 'default',
      });

      // Event handlers
      notification.on('click', () => {
        log.info(`Notification clicked: ${notificationId}`);
        if (options.onClick) {
          options.onClick();
        }
        this.notifications.delete(notificationId);
      });

      notification.on('close', () => {
        log.info(`Notification closed: ${notificationId}`);
        if (options.onClose) {
          options.onClose();
        }
        this.notifications.delete(notificationId);
      });

      notification.on('action', (event, index) => {
        log.info(`Notification action ${index}: ${notificationId}`);
        if (options.onAction) {
          options.onAction(index);
        }
      });

      // Show notification
      notification.show();

      // Store notification
      this.notifications.set(notificationId, notification);

      return notificationId;
    } catch (error) {
      log.error('Failed to show notification:', error);
      throw error;
    }
  }

  /**
   * Close a notification
   */
  close(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.close();
      this.notifications.delete(notificationId);
    }
  }

  /**
   * Close all notifications
   */
  closeAll(): void {
    for (const [id, notification] of this.notifications) {
      notification.close();
    }
    this.notifications.clear();
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return Notification.isSupported();
  }

  /**
   * Get default icon
   */
  private getDefaultIcon(): string {
    if (process.platform === 'darwin') {
      return path.join(__dirname, '../../assets/icons/icon.icns');
    } else if (process.platform === 'win32') {
      return path.join(__dirname, '../../assets/icons/icon.ico');
    } else {
      return path.join(__dirname, '../../assets/icons/512x512.png');
    }
  }

  /**
   * Show device connected notification
   */
  showDeviceConnected(deviceName: string): string {
    return this.show({
      title: 'Device Connected',
      body: `Connected to ${deviceName}`,
      urgency: 'normal',
    });
  }

  /**
   * Show device disconnected notification
   */
  showDeviceDisconnected(deviceName: string): string {
    return this.show({
      title: 'Device Disconnected',
      body: `Disconnected from ${deviceName}`,
      urgency: 'low',
    });
  }

  /**
   * Show file transfer notification
   */
  showFileTransfer(fileName: string, deviceName: string): string {
    return this.show({
      title: 'File Transfer',
      body: `Receiving "${fileName}" from ${deviceName}`,
      urgency: 'normal',
    });
  }

  /**
   * Show file transfer complete notification
   */
  showFileTransferComplete(fileName: string): string {
    return this.show({
      title: 'Transfer Complete',
      body: `Successfully received "${fileName}"`,
      urgency: 'normal',
      actions: [
        { type: 'button', text: 'Show in Folder' },
      ],
    });
  }

  /**
   * Show clipboard sync notification
   */
  showClipboardSync(deviceName: string): string {
    return this.show({
      title: 'Clipboard Synced',
      body: `Clipboard synced with ${deviceName}`,
      urgency: 'low',
      silent: true,
    });
  }

  /**
   * Show error notification
   */
  showError(title: string, error: string): string {
    return this.show({
      title,
      body: error,
      urgency: 'critical',
    });
  }
}
