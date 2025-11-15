"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.browserSyncService = exports.BrowserSyncService = void 0;
const shared_1 = require("@portal-fusion/shared");
const shared_2 = require("@portal-fusion/shared");
const shared_3 = require("@portal-fusion/shared");
const connection_1 = require("../connection");
const electron_log_1 = __importDefault(require("electron-log"));
/**
 * Browser Tab Sync Service
 * Sync browser tabs, history, and bookmarks between devices
 */
class BrowserSyncService extends shared_1.TypedEventEmitter {
    constructor(options = {}) {
        super();
        this.remoteSessions = new Map();
        this.history = new Map();
        this.bookmarks = new Map();
        this.options = {
            enabled: options.enabled !== false,
            syncTabs: options.syncTabs !== false,
            syncHistory: options.syncHistory !== false,
            syncBookmarks: options.syncBookmarks !== false,
            syncPasswords: options.syncPasswords || false,
            autoSync: options.autoSync !== false,
            syncInterval: options.syncInterval || 5000, // 5 seconds
        };
    }
    /**
     * Initialize service
     */
    initialize(localDeviceId) {
        this.localDeviceId = localDeviceId;
        // Create local session
        this.localSession = {
            id: `session-${Date.now()}`,
            deviceId: localDeviceId,
            browser: this.detectBrowser(),
            tabs: [],
            groups: [],
            lastSync: new Date(),
        };
        // Start auto-sync if enabled
        if (this.options.autoSync) {
            this.startAutoSync();
        }
        electron_log_1.default.info('Browser sync service initialized');
    }
    /**
     * Detect browser (to be implemented via native bridge)
     */
    detectBrowser() {
        // This will be detected via native bridge
        return 'chrome'; // Placeholder
    }
    /**
     * Get current browser tabs (to be implemented via native bridge)
     */
    async getCurrentTabs() {
        // This will be implemented via native bridge (browser extension API)
        return this.localSession?.tabs || [];
    }
    /**
     * Sync local tabs with connected devices
     */
    async syncTabs() {
        if (!this.options.enabled || !this.options.syncTabs || !this.localDeviceId) {
            return;
        }
        // Get current tabs (to be implemented)
        const tabs = await this.getCurrentTabs();
        if (this.localSession) {
            this.localSession.tabs = tabs;
            this.localSession.lastSync = new Date();
        }
        // Send to all connected devices
        const connections = connection_1.connectionManager.getActiveConnections();
        if (connections.length === 0) {
            return;
        }
        electron_log_1.default.info(`Syncing ${tabs.length} tabs to ${connections.length} device(s)`);
        for (const connection of connections) {
            try {
                const message = (0, shared_3.createMessage)(shared_2.MessageType.BROWSER_TAB_SYNC, {
                    action: 'tabs-sync',
                    session: this.localSession,
                }, {
                    from: this.localDeviceId,
                    to: connection.remoteDevice.id,
                });
                await connection_1.connectionManager.sendMessage(connection.remoteDevice.id, message);
            }
            catch (error) {
                electron_log_1.default.error(`Failed to sync tabs to ${connection.remoteDevice.name}:`, error);
            }
        }
        this.emit('browser:tabs:synced', { tabs });
    }
    /**
     * Send tab to specific device
     */
    async sendTab(tabId, targetDeviceId) {
        if (!this.localDeviceId || !this.localSession) {
            return;
        }
        const tab = this.localSession.tabs.find((t) => t.id === tabId);
        if (!tab) {
            throw new Error('Tab not found');
        }
        const message = (0, shared_3.createMessage)(shared_2.MessageType.BROWSER_TAB_SYNC, {
            action: 'send-tab',
            tab,
        }, {
            from: this.localDeviceId,
            to: targetDeviceId,
        });
        await connection_1.connectionManager.sendMessage(targetDeviceId, message);
        electron_log_1.default.info(`Sent tab to ${targetDeviceId}: ${tab.title}`);
        this.emit('browser:tab:sent', { tab, targetDeviceId });
    }
    /**
     * Handle browser sync message
     */
    async handleSyncMessage(message) {
        if (!this.options.enabled) {
            return;
        }
        const { action, session, tab, history, bookmarks } = message.payload;
        switch (action) {
            case 'tabs-sync':
                if (session && this.options.syncTabs) {
                    this.remoteSessions.set(message.from, session);
                    electron_log_1.default.info(`Received tab sync from ${message.from}: ${session.tabs.length} tabs`);
                    this.emit('browser:tabs:received', { deviceId: message.from, session });
                }
                break;
            case 'send-tab':
                if (tab && this.options.syncTabs) {
                    electron_log_1.default.info(`Received tab from ${message.from}: ${tab.title}`);
                    this.emit('browser:tab:received', { deviceId: message.from, tab });
                    // Open tab (to be implemented via native bridge)
                    await this.openTab(tab);
                }
                break;
            case 'history-sync':
                if (history && this.options.syncHistory) {
                    history.forEach((entry) => {
                        this.history.set(entry.id, entry);
                    });
                    electron_log_1.default.info(`Received history sync: ${history.length} entries`);
                    this.emit('browser:history:received', { deviceId: message.from, history });
                }
                break;
            case 'bookmarks-sync':
                if (bookmarks && this.options.syncBookmarks) {
                    bookmarks.forEach((bookmark) => {
                        this.bookmarks.set(bookmark.id, bookmark);
                    });
                    electron_log_1.default.info(`Received bookmarks sync: ${bookmarks.length} bookmarks`);
                    this.emit('browser:bookmarks:received', { deviceId: message.from, bookmarks });
                }
                break;
        }
    }
    /**
     * Open tab (to be implemented via native bridge)
     */
    async openTab(tab) {
        // This will be implemented via native bridge (shell.openExternal or browser extension)
        electron_log_1.default.info(`Opening tab: ${tab.url}`);
    }
    /**
     * Sync browsing history
     */
    async syncHistory() {
        if (!this.options.enabled || !this.options.syncHistory || !this.localDeviceId) {
            return;
        }
        // Get browsing history (to be implemented via native bridge)
        const historyEntries = Array.from(this.history.values());
        const connections = connection_1.connectionManager.getActiveConnections();
        if (connections.length === 0) {
            return;
        }
        electron_log_1.default.info(`Syncing ${historyEntries.length} history entries`);
        for (const connection of connections) {
            try {
                const message = (0, shared_3.createMessage)(shared_2.MessageType.BROWSER_TAB_SYNC, {
                    action: 'history-sync',
                    history: historyEntries,
                }, {
                    from: this.localDeviceId,
                    to: connection.remoteDevice.id,
                });
                await connection_1.connectionManager.sendMessage(connection.remoteDevice.id, message);
            }
            catch (error) {
                electron_log_1.default.error(`Failed to sync history to ${connection.remoteDevice.name}:`, error);
            }
        }
        this.emit('browser:history:synced', { history: historyEntries });
    }
    /**
     * Sync bookmarks
     */
    async syncBookmarks() {
        if (!this.options.enabled || !this.options.syncBookmarks || !this.localDeviceId) {
            return;
        }
        const bookmarksList = Array.from(this.bookmarks.values());
        const connections = connection_1.connectionManager.getActiveConnections();
        if (connections.length === 0) {
            return;
        }
        electron_log_1.default.info(`Syncing ${bookmarksList.length} bookmarks`);
        for (const connection of connections) {
            try {
                const message = (0, shared_3.createMessage)(shared_2.MessageType.BROWSER_TAB_SYNC, {
                    action: 'bookmarks-sync',
                    bookmarks: bookmarksList,
                }, {
                    from: this.localDeviceId,
                    to: connection.remoteDevice.id,
                });
                await connection_1.connectionManager.sendMessage(connection.remoteDevice.id, message);
            }
            catch (error) {
                electron_log_1.default.error(`Failed to sync bookmarks to ${connection.remoteDevice.name}:`, error);
            }
        }
        this.emit('browser:bookmarks:synced', { bookmarks: bookmarksList });
    }
    /**
     * Add history entry
     */
    addHistoryEntry(entry) {
        this.history.set(entry.id, entry);
        if (this.options.autoSync && this.options.syncHistory) {
            // Debounced sync will pick this up
        }
    }
    /**
     * Add bookmark
     */
    addBookmark(bookmark) {
        this.bookmarks.set(bookmark.id, bookmark);
        if (this.options.autoSync && this.options.syncBookmarks) {
            this.syncBookmarks();
        }
    }
    /**
     * Remove bookmark
     */
    removeBookmark(bookmarkId) {
        this.bookmarks.delete(bookmarkId);
        if (this.options.autoSync && this.options.syncBookmarks) {
            this.syncBookmarks();
        }
    }
    /**
     * Get remote sessions
     */
    getRemoteSessions() {
        return Array.from(this.remoteSessions.values());
    }
    /**
     * Get local session
     */
    getLocalSession() {
        return this.localSession;
    }
    /**
     * Get history
     */
    getHistory(limit) {
        const entries = Array.from(this.history.values()).sort((a, b) => b.visitTime.getTime() - a.visitTime.getTime());
        return limit ? entries.slice(0, limit) : entries;
    }
    /**
     * Get bookmarks
     */
    getBookmarks(folder) {
        const bookmarks = Array.from(this.bookmarks.values());
        if (folder) {
            return bookmarks.filter((b) => b.folder === folder);
        }
        return bookmarks;
    }
    /**
     * Search history
     */
    searchHistory(query) {
        const lowerQuery = query.toLowerCase();
        return Array.from(this.history.values()).filter((entry) => entry.url.toLowerCase().includes(lowerQuery) ||
            entry.title.toLowerCase().includes(lowerQuery));
    }
    /**
     * Search bookmarks
     */
    searchBookmarks(query) {
        const lowerQuery = query.toLowerCase();
        return Array.from(this.bookmarks.values()).filter((bookmark) => bookmark.url.toLowerCase().includes(lowerQuery) ||
            bookmark.title.toLowerCase().includes(lowerQuery) ||
            bookmark.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)));
    }
    /**
     * Start auto-sync
     */
    startAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        this.syncInterval = setInterval(async () => {
            try {
                if (this.options.syncTabs) {
                    await this.syncTabs();
                }
            }
            catch (error) {
                electron_log_1.default.error('Auto-sync failed:', error);
            }
        }, this.options.syncInterval);
        electron_log_1.default.info(`Auto-sync started (interval: ${this.options.syncInterval}ms)`);
    }
    /**
     * Stop auto-sync
     */
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = undefined;
            electron_log_1.default.info('Auto-sync stopped');
        }
    }
    /**
     * Update settings
     */
    updateSettings(options) {
        Object.assign(this.options, options);
        // Restart auto-sync if settings changed
        if (options.autoSync !== undefined || options.syncInterval !== undefined) {
            if (this.options.autoSync) {
                this.startAutoSync();
            }
            else {
                this.stopAutoSync();
            }
        }
    }
    /**
     * Get current settings
     */
    getSettings() {
        return { ...this.options };
    }
    /**
     * Cleanup
     */
    cleanup() {
        this.stopAutoSync();
        electron_log_1.default.info('Browser sync service cleaned up');
    }
}
exports.BrowserSyncService = BrowserSyncService;
// Export singleton instance
exports.browserSyncService = new BrowserSyncService();
//# sourceMappingURL=browser-sync.js.map