"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.screenshotService = exports.ScreenshotService = void 0;
const shared_1 = require("@portal-fusion/shared");
const shared_2 = require("@portal-fusion/shared");
const shared_3 = require("@portal-fusion/shared");
const connection_1 = require("../connection");
const electron_log_1 = __importDefault(require("electron-log"));
/**
 * Screenshot Capture and Share Service
 */
class ScreenshotService extends shared_1.TypedEventEmitter {
    constructor(options = {}) {
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
    initialize(localDeviceId) {
        this.localDeviceId = localDeviceId;
        electron_log_1.default.info('Screenshot service initialized');
    }
    /**
     * Capture screenshot (to be implemented via native bridge)
     */
    async captureScreenshot(displayId) {
        if (!this.localDeviceId) {
            throw new Error('Service not initialized');
        }
        // This will be implemented via the native bridge
        const screenshot = {
            id: Date.now().toString(),
            image: Buffer.from(''), // Placeholder
            format: this.options.format,
            timestamp: new Date(),
            displayId,
        };
        this.lastScreenshot = screenshot;
        electron_log_1.default.info('Screenshot captured');
        // Auto-share if enabled
        if (this.options.autoShare) {
            await this.shareScreenshot(screenshot);
        }
        return screenshot;
    }
    /**
     * Share screenshot with connected devices
     */
    async shareScreenshot(screenshot, targetDeviceId) {
        if (!this.localDeviceId) {
            throw new Error('Service not initialized');
        }
        // Create clipboard data from screenshot
        const clipboardData = {
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
            ? [connection_1.connectionManager.getConnection(targetDeviceId)].filter(Boolean)
            : connection_1.connectionManager.getActiveConnections();
        if (connections.length === 0) {
            electron_log_1.default.warn('No connected devices to share screenshot');
            return;
        }
        electron_log_1.default.info(`Sharing screenshot to ${connections.length} device(s)`);
        // Send to target devices
        for (const connection of connections) {
            try {
                const message = (0, shared_3.createMessage)(shared_2.MessageType.CLIPBOARD_IMAGE, clipboardData, {
                    from: this.localDeviceId,
                    to: connection.remoteDevice.id,
                    compressed: true,
                });
                await connection_1.connectionManager.sendMessage(connection.remoteDevice.id, message);
            }
            catch (error) {
                electron_log_1.default.error(`Failed to share screenshot to ${connection.remoteDevice.name}:`, error);
            }
        }
    }
    /**
     * Capture and share screenshot
     */
    async captureAndShare(displayId, targetDeviceId) {
        const screenshot = await this.captureScreenshot(displayId);
        await this.shareScreenshot(screenshot, targetDeviceId);
    }
    /**
     * Get last screenshot
     */
    getLastScreenshot() {
        return this.lastScreenshot;
    }
    /**
     * Save screenshot to file (to be implemented via native bridge)
     */
    async saveScreenshot(screenshot, filePath) {
        // This will be implemented via the native bridge
        electron_log_1.default.info(`Screenshot saved to ${filePath}`);
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
}
exports.ScreenshotService = ScreenshotService;
// Export singleton instance
exports.screenshotService = new ScreenshotService();
//# sourceMappingURL=screenshot.js.map