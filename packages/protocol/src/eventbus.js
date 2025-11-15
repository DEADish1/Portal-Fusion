"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBus = exports.EventBus = void 0;
const shared_1 = require("@portal-fusion/shared");
const shared_2 = require("@portal-fusion/shared");
/**
 * Centralized Event Bus
 * Global event system for Portal Fusion
 */
class EventBus extends shared_1.TypedEventEmitter {
    constructor(options = {}) {
        super();
        this.activityLog = [];
        this.options = {
            enableLogging: options.enableLogging !== false,
            maxListeners: options.maxListeners || 100,
        };
        this.setupInternalListeners();
    }
    /**
     * Get singleton instance
     */
    static getInstance(options) {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus(options);
        }
        return EventBus.instance;
    }
    /**
     * Setup internal event listeners for logging
     */
    setupInternalListeners() {
        if (!this.options.enableLogging)
            return;
        // Log device events
        this.on('device:discovered', (device) => {
            this.logActivity({
                type: shared_2.ActivityType.CONNECTION,
                device: device.name,
                description: `Device discovered: ${device.name}`,
                status: 'success',
            });
        });
        this.on('device:connected', (device) => {
            this.logActivity({
                type: shared_2.ActivityType.CONNECTION,
                device: device.name,
                description: `Connected to device: ${device.name}`,
                status: 'success',
            });
        });
        this.on('device:disconnected', (device) => {
            this.logActivity({
                type: shared_2.ActivityType.DISCONNECTION,
                device: device.name,
                description: `Disconnected from device: ${device.name}`,
                status: 'warning',
            });
        });
        this.on('device:paired', (device) => {
            this.logActivity({
                type: shared_2.ActivityType.CONNECTION,
                device: device.name,
                description: `Device paired: ${device.name}`,
                status: 'success',
            });
        });
        // Log message events
        this.on('message:received', (message) => {
            console.log(`📨 Message received: ${message.type} from ${message.from}`);
        });
        this.on('message:sent', (message) => {
            console.log(`📤 Message sent: ${message.type} to ${message.to}`);
        });
        this.on('message:error', (error, message) => {
            this.logActivity({
                type: shared_2.ActivityType.ERROR,
                device: message.from || 'unknown',
                description: `Message error: ${error.message}`,
                status: 'failure',
                details: { error, message },
            });
        });
        // Log file transfer events
        this.on('file:transfer:start', (transfer) => {
            this.logActivity({
                type: shared_2.ActivityType.FILE_TRANSFER,
                device: 'file-transfer',
                description: `File transfer started: ${transfer.fileName}`,
                status: 'success',
                details: transfer,
            });
        });
        this.on('file:transfer:complete', (transfer) => {
            this.logActivity({
                type: shared_2.ActivityType.FILE_TRANSFER,
                device: 'file-transfer',
                description: `File transfer completed: ${transfer.fileName}`,
                status: 'success',
                details: transfer,
            });
        });
        // Log screen share events
        this.on('screen:share:start', (share) => {
            this.logActivity({
                type: shared_2.ActivityType.SCREEN_SHARE,
                device: share.sourceDevice,
                description: `Screen sharing started`,
                status: 'success',
                details: share,
            });
        });
        this.on('screen:share:stop', (share) => {
            this.logActivity({
                type: shared_2.ActivityType.SCREEN_SHARE,
                device: share.sourceDevice,
                description: `Screen sharing stopped`,
                status: 'success',
                details: share,
            });
        });
        // Log errors
        this.on('error', (error) => {
            this.logActivity({
                type: shared_2.ActivityType.ERROR,
                device: 'system',
                description: error.message,
                status: 'failure',
                details: error,
            });
            console.error('❌ Error:', error);
        });
        // Log warnings
        this.on('warning', (warning) => {
            this.logActivity({
                type: shared_2.ActivityType.ERROR,
                device: 'system',
                description: warning,
                status: 'warning',
            });
            console.warn('⚠️ Warning:', warning);
        });
    }
    /**
     * Log activity
     */
    logActivity(activity) {
        const fullActivity = {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            ...activity,
        };
        this.activityLog.push(fullActivity);
        this.emit('activity', fullActivity);
        // Limit log size (keep last 1000 entries)
        if (this.activityLog.length > 1000) {
            this.activityLog = this.activityLog.slice(-1000);
        }
    }
    /**
     * Get activity log
     */
    getActivityLog(limit) {
        if (limit) {
            return this.activityLog.slice(-limit);
        }
        return [...this.activityLog];
    }
    /**
     * Get activity log by type
     */
    getActivityByType(type, limit) {
        const filtered = this.activityLog.filter((activity) => activity.type === type);
        if (limit) {
            return filtered.slice(-limit);
        }
        return filtered;
    }
    /**
     * Get activity log by device
     */
    getActivityByDevice(device, limit) {
        const filtered = this.activityLog.filter((activity) => activity.device === device);
        if (limit) {
            return filtered.slice(-limit);
        }
        return filtered;
    }
    /**
     * Clear activity log
     */
    clearActivityLog() {
        this.activityLog = [];
    }
    /**
     * Emit device discovered event
     */
    deviceDiscovered(device) {
        this.emit('device:discovered', device);
    }
    /**
     * Emit device connected event
     */
    deviceConnected(device) {
        this.emit('device:connected', device);
    }
    /**
     * Emit device disconnected event
     */
    deviceDisconnected(device) {
        this.emit('device:disconnected', device);
    }
    /**
     * Emit device paired event
     */
    devicePaired(device) {
        this.emit('device:paired', device);
    }
    /**
     * Emit message received event
     */
    messageReceived(message) {
        this.emit('message:received', message);
    }
    /**
     * Emit message sent event
     */
    messageSent(message) {
        this.emit('message:sent', message);
    }
    /**
     * Emit error event
     */
    error(error) {
        this.emit('error', error);
    }
    /**
     * Emit warning event
     */
    warning(warning) {
        this.emit('warning', warning);
    }
    /**
     * Get event statistics
     */
    getStats() {
        let totalListeners = 0;
        // Count all listeners (this is a simplified version)
        // In a real implementation, you'd iterate over all event types
        return {
            totalListeners,
            activityLogSize: this.activityLog.length,
        };
    }
}
exports.EventBus = EventBus;
// Export singleton instance
exports.eventBus = EventBus.getInstance();
//# sourceMappingURL=eventbus.js.map