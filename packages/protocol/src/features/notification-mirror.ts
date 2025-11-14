import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import { Notification, Message, MessageType } from '@portal-fusion/shared';
import { createMessage, generateId } from '@portal-fusion/shared';
import { connectionManager } from '../connection';
import log from 'electron-log';

export interface NotificationMirrorOptions {
  enabled?: boolean;
  mirrorAll?: boolean;
  allowedApps?: string[];
  blockedApps?: string[];
  showOnRemote?: boolean;
}

/**
 * Notification Mirroring Service
 * Mirrors notifications between devices
 */
export class NotificationMirrorService extends TypedEventEmitter<PortalFusionEvents> {
  private options: Required<NotificationMirrorOptions>;
  private localDeviceId?: string;
  private mirroredNotifications: Map<string, Notification> = new Map();

  constructor(options: NotificationMirrorOptions = {}) {
    super();

    this.options = {
      enabled: options.enabled !== false,
      mirrorAll: options.mirrorAll !== false,
      allowedApps: options.allowedApps || [],
      blockedApps: options.blockedApps || [],
      showOnRemote: options.showOnRemote !== false,
    };
  }

  /**
   * Initialize service
   */
  initialize(localDeviceId: string): void {
    this.localDeviceId = localDeviceId;
    log.info('Notification mirroring service initialized');
  }

  /**
   * Mirror notification to connected devices
   */
  async mirrorNotification(notification: Notification): Promise<void> {
    if (!this.options.enabled || !this.localDeviceId) {
      return;
    }

    // Check if app is allowed/blocked
    if (!this.shouldMirror(notification)) {
      return;
    }

    // Get connected devices
    const connections = connectionManager.getActiveConnections();

    if (connections.length === 0) {
      return;
    }

    log.info(`Mirroring notification: ${notification.title}`);

    // Store notification
    this.mirroredNotifications.set(notification.id, notification);

    // Send to all connected devices
    for (const connection of connections) {
      try {
        const message = createMessage(
          MessageType.NOTIFICATION_SHOW,
          notification,
          {
            from: this.localDeviceId,
            to: connection.remoteDevice.id,
          }
        );

        await connectionManager.sendMessage(connection.remoteDevice.id, message);
      } catch (error) {
        log.error(`Failed to mirror notification to ${connection.remoteDevice.name}:`, error);
      }
    }
  }

  /**
   * Handle received notification
   */
  async handleNotification(message: Message): Promise<void> {
    if (!this.options.enabled || !this.options.showOnRemote) {
      return;
    }

    const notification = message.payload as Notification;

    log.info(`Received mirrored notification: ${notification.title}`);

    // Store notification
    this.mirroredNotifications.set(notification.id, notification);

    // Emit event for UI to show
    this.emit('notification:received', notification);
  }

  /**
   * Handle notification click
   */
  async handleNotificationClick(notificationId: string, sourceDeviceId: string): Promise<void> {
    if (!this.localDeviceId) return;

    const notification = this.mirroredNotifications.get(notificationId);

    if (!notification) {
      return;
    }

    // Send click event back to source device
    const message = createMessage(
      MessageType.NOTIFICATION_CLICK,
      { notificationId },
      {
        from: this.localDeviceId,
        to: sourceDeviceId,
      }
    );

    await connectionManager.sendMessage(sourceDeviceId, message);

    log.info(`Notification clicked: ${notification.title}`);
  }

  /**
   * Handle notification dismiss
   */
  async handleNotificationDismiss(notificationId: string, sourceDeviceId: string): Promise<void> {
    if (!this.localDeviceId) return;

    const notification = this.mirroredNotifications.get(notificationId);

    if (!notification) {
      return;
    }

    // Send dismiss event back to source device
    const message = createMessage(
      MessageType.NOTIFICATION_DISMISS,
      { notificationId },
      {
        from: this.localDeviceId,
        to: sourceDeviceId,
      }
    );

    await connectionManager.sendMessage(sourceDeviceId, message);

    // Remove from storage
    this.mirroredNotifications.delete(notificationId);

    log.info(`Notification dismissed: ${notification.title}`);
  }

  /**
   * Check if notification should be mirrored
   */
  private shouldMirror(notification: Notification): boolean {
    // If mirrorAll is enabled, check blocked apps
    if (this.options.mirrorAll) {
      // Extract app name from notification metadata
      const appName = this.extractAppName(notification);
      return !this.options.blockedApps.includes(appName);
    }

    // Otherwise, check allowed apps
    const appName = this.extractAppName(notification);
    return this.options.allowedApps.includes(appName);
  }

  /**
   * Extract app name from notification
   */
  private extractAppName(notification: Notification): string {
    // In production, this would extract the app name from system notification
    // For now, use a placeholder
    return 'unknown';
  }

  /**
   * Update settings
   */
  updateSettings(options: Partial<NotificationMirrorOptions>): void {
    Object.assign(this.options, options);
  }

  /**
   * Get current settings
   */
  getSettings(): Required<NotificationMirrorOptions> {
    return { ...this.options };
  }

  /**
   * Get mirrored notifications
   */
  getMirroredNotifications(): Notification[] {
    return Array.from(this.mirroredNotifications.values());
  }

  /**
   * Clear mirrored notifications
   */
  clearMirroredNotifications(): void {
    this.mirroredNotifications.clear();
  }
}

// Export singleton instance
export const notificationMirrorService = new NotificationMirrorService();
