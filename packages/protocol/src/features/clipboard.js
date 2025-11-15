"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clipboardSyncService = exports.ClipboardSyncService = void 0;
const shared_1 = require("@portal-fusion/shared");
const shared_2 = require("@portal-fusion/shared");
const shared_3 = require("@portal-fusion/shared");
const shared_4 = require("@portal-fusion/shared");
const connection_1 = require("../connection");
const electron_log_1 = __importDefault(require("electron-log"));
/**
 * Clipboard Sync Service
 * Monitors and syncs clipboard content across devices
 */
class ClipboardSyncService extends shared_1.TypedEventEmitter {
    constructor(options = {}) {
        super();
        this.paused = false;
        this.options = {
            enabled: options.enabled !== false,
            syncText: options.syncText !== false,
            syncImages: options.syncImages !== false,
            syncFiles: options.syncFiles !== false,
            syncHtml: options.syncHtml !== false,
            autoSync: options.autoSync !== false,
            syncDelay: options.syncDelay || shared_4.CLIPBOARD_SYNC_DELAY,
        };
    }
    /**
     * Start clipboard monitoring
     */
    start(localDeviceId) {
        if (!this.options.enabled) {
            electron_log_1.default.info('Clipboard sync is disabled');
            return;
        }
        this.localDeviceId = localDeviceId;
        this.paused = false;
        // Start monitoring clipboard changes
        this.monitorInterval = setInterval(() => {
            this.checkClipboard();
        }, 500); // Check every 500ms
        electron_log_1.default.info('Clipboard sync started');
    }
    /**
     * Stop clipboard monitoring
     */
    stop() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = undefined;
        }
        if (this.syncTimer) {
            clearTimeout(this.syncTimer);
            this.syncTimer = undefined;
        }
        electron_log_1.default.info('Clipboard sync stopped');
    }
    /**
     * Check for clipboard changes
     */
    async checkClipboard() {
        if (this.paused || !this.localDeviceId)
            return;
        try {
            // Get clipboard content from native bridge (will be injected)
            const clipboardData = await this.getClipboardFromNative();
            if (!clipboardData)
                return;
            // Calculate hash of clipboard content
            const hash = this.hashClipboardData(clipboardData);
            // Check if clipboard has changed
            if (hash !== this.lastClipboardHash) {
                this.lastClipboardHash = hash;
                // Debounce sync
                if (this.syncTimer) {
                    clearTimeout(this.syncTimer);
                }
                this.syncTimer = setTimeout(() => {
                    this.syncClipboard(clipboardData);
                }, this.options.syncDelay);
            }
        }
        catch (error) {
            electron_log_1.default.error('Failed to check clipboard:', error);
        }
    }
    /**
     * Sync clipboard to connected devices
     */
    async syncClipboard(clipboardData) {
        if (!this.localDeviceId)
            return;
        // Check if this type is enabled
        if (!this.shouldSyncType(clipboardData.type)) {
            return;
        }
        // Validate size limits
        if (!this.validateSize(clipboardData)) {
            electron_log_1.default.warn('Clipboard content exceeds size limit');
            return;
        }
        // Get connected devices
        const connections = connection_1.connectionManager.getActiveConnections();
        if (connections.length === 0) {
            return;
        }
        electron_log_1.default.info(`Syncing clipboard (${clipboardData.type}) to ${connections.length} device(s)`);
        // Send to all connected devices
        for (const connection of connections) {
            try {
                const message = this.createClipboardMessage(clipboardData, connection.remoteDevice.id);
                await connection_1.connectionManager.sendMessage(connection.remoteDevice.id, message);
            }
            catch (error) {
                electron_log_1.default.error(`Failed to sync clipboard to ${connection.remoteDevice.name}:`, error);
            }
        }
        // Emit event
        this.emit('clipboard:changed', clipboardData);
    }
    /**
     * Handle received clipboard message
     */
    async handleClipboardMessage(message) {
        if (!this.options.enabled)
            return;
        const clipboardData = message.payload;
        // Validate
        if (!this.shouldSyncType(clipboardData.type)) {
            return;
        }
        if (!this.validateSize(clipboardData)) {
            electron_log_1.default.warn('Received clipboard content exceeds size limit');
            return;
        }
        // Temporarily pause monitoring to avoid loop
        this.paused = true;
        try {
            // Set clipboard via native bridge
            await this.setClipboardToNative(clipboardData);
            // Update hash
            this.lastClipboardHash = this.hashClipboardData(clipboardData);
            electron_log_1.default.info(`Clipboard synced from ${message.from} (${clipboardData.type})`);
            // Emit event
            this.emit('clipboard:changed', clipboardData);
        }
        catch (error) {
            electron_log_1.default.error('Failed to set clipboard:', error);
        }
        finally {
            // Resume monitoring after a delay
            setTimeout(() => {
                this.paused = false;
            }, 1000);
        }
    }
    /**
     * Create clipboard message
     */
    createClipboardMessage(clipboardData, targetDeviceId) {
        let messageType;
        switch (clipboardData.type) {
            case 'image':
                messageType = shared_2.MessageType.CLIPBOARD_IMAGE;
                break;
            case 'html':
                messageType = shared_2.MessageType.CLIPBOARD_HTML;
                break;
            case 'file':
                messageType = shared_2.MessageType.CLIPBOARD_FILE;
                break;
            default:
                messageType = shared_2.MessageType.CLIPBOARD_TEXT;
        }
        return (0, shared_3.createMessage)(messageType, clipboardData, {
            from: this.localDeviceId,
            to: targetDeviceId,
            compressed: clipboardData.data.length > 1024,
            encrypted: true,
        });
    }
    /**
     * Check if type should be synced
     */
    shouldSyncType(type) {
        switch (type) {
            case 'text':
                return this.options.syncText;
            case 'image':
                return this.options.syncImages;
            case 'file':
                return this.options.syncFiles;
            case 'html':
                return this.options.syncHtml;
            default:
                return false;
        }
    }
    /**
     * Validate clipboard data size
     */
    validateSize(clipboardData) {
        const size = clipboardData.data.length;
        switch (clipboardData.type) {
            case 'text':
            case 'html':
                return size <= shared_4.MAX_CLIPBOARD_TEXT_SIZE;
            case 'image':
                return size <= shared_4.MAX_CLIPBOARD_IMAGE_SIZE;
            case 'file':
                // Files handled separately with chunking
                return true;
            default:
                return false;
        }
    }
    /**
     * Hash clipboard data for change detection
     */
    hashClipboardData(clipboardData) {
        const dataStr = typeof clipboardData.data === 'string'
            ? clipboardData.data
            : clipboardData.data.toString('base64');
        return (0, shared_3.generateChecksum)(dataStr);
    }
    /**
     * Get clipboard from native bridge (to be injected)
     */
    async getClipboardFromNative() {
        // This will be injected by the IPC bridge
        return null;
    }
    /**
     * Set clipboard to native bridge (to be injected)
     */
    async setClipboardToNative(clipboardData) {
        // This will be injected by the IPC bridge
    }
    /**
     * Manually sync clipboard
     */
    async manualSync() {
        const clipboardData = await this.getClipboardFromNative();
        if (clipboardData) {
            await this.syncClipboard(clipboardData);
        }
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
     * Pause clipboard sync temporarily
     */
    pause() {
        this.paused = true;
    }
    /**
     * Resume clipboard sync
     */
    resume() {
        this.paused = false;
    }
}
exports.ClipboardSyncService = ClipboardSyncService;
// Export singleton instance
exports.clipboardSyncService = new ClipboardSyncService();
//# sourceMappingURL=clipboard.js.map