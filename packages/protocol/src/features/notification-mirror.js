"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationMirrorService = exports.NotificationMirrorService = void 0;
const shared_1 = require("@portal-fusion/shared");
const shared_2 = require("@portal-fusion/shared");
const shared_3 = require("@portal-fusion/shared");
const connection_1 = require("../connection");
const electron_log_1 = __importDefault(require("electron-log"));
/**
 * Notification Mirroring Service
 * Mirrors notifications between devices
 */
class NotificationMirrorService extends shared_1.TypedEventEmitter {
    constructor(options = {}) {
        super();
        this.mirroredNotifications = new Map();
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
    initialize(localDeviceId) {
        this.localDeviceId = localDeviceId;
        electron_log_1.default.info('Notification mirroring service initialized');
    }
    /**
     * Mirror notification to connected devices
     */
    async mirrorNotification(notification) {
        if (!this.options.enabled || !this.localDeviceId) {
            return;
        }
        // Check if app is allowed/blocked
        if (!this.shouldMirror(notification)) {
            return;
        }
        // Get connected devices
        const connections = connection_1.connectionManager.getActiveConnections();
        if (connections.length === 0) {
            return;
        }
        electron_log_1.default.info(`Mirroring notification: ${notification.title}`);
        // Store notification
        this.mirroredNotifications.set(notification.id, notification);
        // Send to all connected devices
        for (const connection of connections) {
            try {
                const message = (0, shared_3.createMessage)(shared_2.MessageType.NOTIFICATION_SHOW, notification, {
                    from: this.localDeviceId,
                    to: connection.remoteDevice.id,
                });
                await connection_1.connectionManager.sendMessage(connection.remoteDevice.id, message);
            }
            catch (error) {
                electron_log_1.default.error(`Failed to mirror notification to ${connection.remoteDevice.name}:`, error);
            }
        }
    }
    /**
     * Handle received notification
     */
    async handleNotification(message) {
        if (!this.options.enabled || !this.options.showOnRemote) {
            return;
        }
        const notification = message.payload;
        electron_log_1.default.info(`Received mirrored notification: ${notification.title}`);
        // Store notification
        this.mirroredNotifications.set(notification.id, notification);
        // Emit event for UI to show
        this.emit('notification:received', notification);
    }
    /**
     * Handle notification click
     */
    async handleNotificationClick(notificationId, sourceDeviceId) {
        if (!this.localDeviceId)
            return;
        const notification = this.mirroredNotifications.get(notificationId);
        if (!notification) {
            return;
        }
        // Send click event back to source device
        const message = (0, shared_3.createMessage)(shared_2.MessageType.NOTIFICATION_CLICK, { notificationId }, {
            from: this.localDeviceId,
            to: sourceDeviceId,
        });
        await connection_1.connectionManager.sendMessage(sourceDeviceId, message);
        electron_log_1.default.info(`Notification clicked: ${notification.title}`);
    }
    /**
     * Handle notification dismiss
     */
    async handleNotificationDismiss(notificationId, sourceDeviceId) {
        if (!this.localDeviceId)
            return;
        const notification = this.mirroredNotifications.get(notificationId);
        if (!notification) {
            return;
        }
        // Send dismiss event back to source device
        const message = (0, shared_3.createMessage)(shared_2.MessageType.NOTIFICATION_DISMISS, { notificationId }, {
            from: this.localDeviceId,
            to: sourceDeviceId,
        });
        await connection_1.connectionManager.sendMessage(sourceDeviceId, message);
        // Remove from storage
        this.mirroredNotifications.delete(notificationId);
        electron_log_1.default.info(`Notification dismissed: ${notification.title}`);
    }
    /**
     * Check if notification should be mirrored
     */
    shouldMirror(notification) {
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
    extractAppName(notification) {
        // In production, this would extract the app name from system notification
        // For now, use a placeholder
        return 'unknown';
    }
    /**
     * Update settings
     */
    updateSettings(options) {
        Object.assign(this.options, options);
    }
    /**
     * Get current settings
     */
    getSettings() {
        return { ...this.options };
    }
    /**
     * Get mirrored notifications
     */
    getMirroredNotifications() {
        return Array.from(this.mirroredNotifications.values());
    }
    /**
     * Clear mirrored notifications
     */
    clearMirroredNotifications() {
        this.mirroredNotifications.clear();
    }
}
exports.NotificationMirrorService = NotificationMirrorService;
// Export singleton instance
exports.notificationMirrorService = new NotificationMirrorService();
//# sourceMappingURL=notification-mirror.js.map