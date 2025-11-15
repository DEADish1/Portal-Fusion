import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import { Notification, Message } from '@portal-fusion/shared';
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
export declare class NotificationMirrorService extends TypedEventEmitter<PortalFusionEvents> {
    private options;
    private localDeviceId?;
    private mirroredNotifications;
    constructor(options?: NotificationMirrorOptions);
    /**
     * Initialize service
     */
    initialize(localDeviceId: string): void;
    /**
     * Mirror notification to connected devices
     */
    mirrorNotification(notification: Notification): Promise<void>;
    /**
     * Handle received notification
     */
    handleNotification(message: Message): Promise<void>;
    /**
     * Handle notification click
     */
    handleNotificationClick(notificationId: string, sourceDeviceId: string): Promise<void>;
    /**
     * Handle notification dismiss
     */
    handleNotificationDismiss(notificationId: string, sourceDeviceId: string): Promise<void>;
    /**
     * Check if notification should be mirrored
     */
    private shouldMirror;
    /**
     * Extract app name from notification
     */
    private extractAppName;
    /**
     * Update settings
     */
    updateSettings(options: Partial<NotificationMirrorOptions>): void;
    /**
     * Get current settings
     */
    getSettings(): Required<NotificationMirrorOptions>;
    /**
     * Get mirrored notifications
     */
    getMirroredNotifications(): Notification[];
    /**
     * Clear mirrored notifications
     */
    clearMirroredNotifications(): void;
}
export declare const notificationMirrorService: NotificationMirrorService;
//# sourceMappingURL=notification-mirror.d.ts.map