"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.urlSharingService = exports.URLSharingService = void 0;
const shared_1 = require("@portal-fusion/shared");
const shared_2 = require("@portal-fusion/shared");
const shared_3 = require("@portal-fusion/shared");
const connection_1 = require("../connection");
const electron_log_1 = __importDefault(require("electron-log"));
/**
 * URL/Link Sharing Service
 * Share URLs and links between devices
 */
class URLSharingService extends shared_1.TypedEventEmitter {
    constructor(options = {}) {
        super();
        this.sharedURLs = new Map();
        this.options = {
            enabled: options.enabled !== false,
            autoOpen: options.autoOpen || false,
            confirmBeforeOpen: options.confirmBeforeOpen !== false,
        };
    }
    /**
     * Initialize service
     */
    initialize(localDeviceId) {
        this.localDeviceId = localDeviceId;
        electron_log_1.default.info('URL sharing service initialized');
    }
    /**
     * Share URL to device(s)
     */
    async shareURL(url, title, targetDeviceId) {
        if (!this.options.enabled || !this.localDeviceId) {
            return;
        }
        // Validate URL
        if (!this.isValidURL(url)) {
            throw new Error('Invalid URL');
        }
        // Get target devices
        const connections = targetDeviceId
            ? [connection_1.connectionManager.getConnection(targetDeviceId)].filter(Boolean)
            : connection_1.connectionManager.getActiveConnections();
        if (connections.length === 0) {
            electron_log_1.default.warn('No connected devices to share URL');
            return;
        }
        electron_log_1.default.info(`Sharing URL to ${connections.length} device(s): ${url}`);
        // Send to target devices
        for (const connection of connections) {
            try {
                const message = (0, shared_3.createMessage)(shared_2.MessageType.CLIPBOARD_TEXT, {
                    type: 'text',
                    data: url,
                    metadata: {
                        isURL: true,
                        title,
                        timestamp: new Date(),
                    },
                }, {
                    from: this.localDeviceId,
                    to: connection.remoteDevice.id,
                });
                await connection_1.connectionManager.sendMessage(connection.remoteDevice.id, message);
            }
            catch (error) {
                electron_log_1.default.error(`Failed to share URL to ${connection.remoteDevice.name}:`, error);
            }
        }
    }
    /**
     * Handle received URL
     */
    async handleURLReceived(message) {
        if (!this.options.enabled) {
            return;
        }
        const { data, metadata } = message.payload;
        // Check if it's a URL
        if (!metadata?.isURL || !this.isValidURL(data)) {
            return;
        }
        const sharedURL = {
            id: message.id,
            url: data,
            title: metadata.title,
            sourceDevice: message.from,
            timestamp: new Date(metadata.timestamp),
            opened: false,
        };
        this.sharedURLs.set(sharedURL.id, sharedURL);
        electron_log_1.default.info(`Received shared URL: ${data}`);
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
    async openURL(urlId) {
        const sharedURL = this.sharedURLs.get(urlId);
        if (!sharedURL) {
            throw new Error('URL not found');
        }
        // This will be implemented via the native bridge (shell.openExternal)
        sharedURL.opened = true;
        electron_log_1.default.info(`Opening URL: ${sharedURL.url}`);
        this.emit('url:opened', sharedURL);
    }
    /**
     * Validate URL
     */
    isValidURL(url) {
        try {
            const parsed = new URL(url);
            return ['http:', 'https:', 'ftp:'].includes(parsed.protocol);
        }
        catch {
            return false;
        }
    }
    /**
     * Get shared URLs
     */
    getSharedURLs(limit) {
        const urls = Array.from(this.sharedURLs.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return limit ? urls.slice(0, limit) : urls;
    }
    /**
     * Clear shared URLs
     */
    clearSharedURLs() {
        this.sharedURLs.clear();
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
exports.URLSharingService = URLSharingService;
// Export singleton instance
exports.urlSharingService = new URLSharingService();
//# sourceMappingURL=url-sharing.js.map