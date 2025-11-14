import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import { Message, MessageType } from '@portal-fusion/shared';
import { createMessage } from '@portal-fusion/shared';
import { connectionManager } from '../connection';
import log from 'electron-log';

export interface BrowserSyncOptions {
  enabled?: boolean;
  syncTabs?: boolean;
  syncHistory?: boolean;
  syncBookmarks?: boolean;
  syncPasswords?: boolean;
  autoSync?: boolean;
  syncInterval?: number;
}

export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  active: boolean;
  pinned: boolean;
  groupId?: string;
  index: number;
  lastAccessed: Date;
}

export interface TabGroup {
  id: string;
  name: string;
  color: string;
  collapsed: boolean;
  tabs: string[]; // Tab IDs
}

export interface BrowserSession {
  id: string;
  deviceId: string;
  browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'other';
  tabs: BrowserTab[];
  groups: TabGroup[];
  activeTabId?: string;
  lastSync: Date;
}

export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  visitTime: Date;
  visitCount: number;
}

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  folder?: string;
  tags: string[];
  createdAt: Date;
  favicon?: string;
}

/**
 * Browser Tab Sync Service
 * Sync browser tabs, history, and bookmarks between devices
 */
export class BrowserSyncService extends TypedEventEmitter<PortalFusionEvents> {
  private options: Required<BrowserSyncOptions>;
  private localDeviceId?: string;
  private localSession?: BrowserSession;
  private remoteSessions: Map<string, BrowserSession> = new Map();
  private history: Map<string, HistoryEntry> = new Map();
  private bookmarks: Map<string, Bookmark> = new Map();
  private syncInterval?: NodeJS.Timeout;

  constructor(options: BrowserSyncOptions = {}) {
    super();

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
  initialize(localDeviceId: string): void {
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

    log.info('Browser sync service initialized');
  }

  /**
   * Detect browser (to be implemented via native bridge)
   */
  private detectBrowser(): 'chrome' | 'firefox' | 'safari' | 'edge' | 'other' {
    // This will be detected via native bridge
    return 'chrome'; // Placeholder
  }

  /**
   * Get current browser tabs (to be implemented via native bridge)
   */
  async getCurrentTabs(): Promise<BrowserTab[]> {
    // This will be implemented via native bridge (browser extension API)
    return this.localSession?.tabs || [];
  }

  /**
   * Sync local tabs with connected devices
   */
  async syncTabs(): Promise<void> {
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
    const connections = connectionManager.getActiveConnections();

    if (connections.length === 0) {
      return;
    }

    log.info(`Syncing ${tabs.length} tabs to ${connections.length} device(s)`);

    for (const connection of connections) {
      try {
        const message = createMessage(
          MessageType.BROWSER_SYNC,
          {
            action: 'tabs-sync',
            session: this.localSession,
          },
          {
            from: this.localDeviceId,
            to: connection!.remoteDevice.id,
          }
        );

        await connectionManager.sendMessage(connection!.remoteDevice.id, message);
      } catch (error) {
        log.error(`Failed to sync tabs to ${connection!.remoteDevice.name}:`, error);
      }
    }

    this.emit('browser:tabs:synced', { tabs });
  }

  /**
   * Send tab to specific device
   */
  async sendTab(tabId: string, targetDeviceId: string): Promise<void> {
    if (!this.localDeviceId || !this.localSession) {
      return;
    }

    const tab = this.localSession.tabs.find((t) => t.id === tabId);

    if (!tab) {
      throw new Error('Tab not found');
    }

    const message = createMessage(
      MessageType.BROWSER_SYNC,
      {
        action: 'send-tab',
        tab,
      },
      {
        from: this.localDeviceId,
        to: targetDeviceId,
      }
    );

    await connectionManager.sendMessage(targetDeviceId, message);

    log.info(`Sent tab to ${targetDeviceId}: ${tab.title}`);
    this.emit('browser:tab:sent', { tab, targetDeviceId });
  }

  /**
   * Handle browser sync message
   */
  async handleSyncMessage(message: Message): Promise<void> {
    if (!this.options.enabled) {
      return;
    }

    const { action, session, tab, history, bookmarks } = message.payload;

    switch (action) {
      case 'tabs-sync':
        if (session && this.options.syncTabs) {
          this.remoteSessions.set(message.from, session);
          log.info(`Received tab sync from ${message.from}: ${session.tabs.length} tabs`);
          this.emit('browser:tabs:received', { deviceId: message.from, session });
        }
        break;

      case 'send-tab':
        if (tab && this.options.syncTabs) {
          log.info(`Received tab from ${message.from}: ${tab.title}`);
          this.emit('browser:tab:received', { deviceId: message.from, tab });

          // Open tab (to be implemented via native bridge)
          await this.openTab(tab);
        }
        break;

      case 'history-sync':
        if (history && this.options.syncHistory) {
          history.forEach((entry: HistoryEntry) => {
            this.history.set(entry.id, entry);
          });
          log.info(`Received history sync: ${history.length} entries`);
          this.emit('browser:history:received', { deviceId: message.from, history });
        }
        break;

      case 'bookmarks-sync':
        if (bookmarks && this.options.syncBookmarks) {
          bookmarks.forEach((bookmark: Bookmark) => {
            this.bookmarks.set(bookmark.id, bookmark);
          });
          log.info(`Received bookmarks sync: ${bookmarks.length} bookmarks`);
          this.emit('browser:bookmarks:received', { deviceId: message.from, bookmarks });
        }
        break;
    }
  }

  /**
   * Open tab (to be implemented via native bridge)
   */
  private async openTab(tab: BrowserTab): Promise<void> {
    // This will be implemented via native bridge (shell.openExternal or browser extension)
    log.info(`Opening tab: ${tab.url}`);
  }

  /**
   * Sync browsing history
   */
  async syncHistory(): Promise<void> {
    if (!this.options.enabled || !this.options.syncHistory || !this.localDeviceId) {
      return;
    }

    // Get browsing history (to be implemented via native bridge)
    const historyEntries = Array.from(this.history.values());

    const connections = connectionManager.getActiveConnections();

    if (connections.length === 0) {
      return;
    }

    log.info(`Syncing ${historyEntries.length} history entries`);

    for (const connection of connections) {
      try {
        const message = createMessage(
          MessageType.BROWSER_SYNC,
          {
            action: 'history-sync',
            history: historyEntries,
          },
          {
            from: this.localDeviceId,
            to: connection!.remoteDevice.id,
          }
        );

        await connectionManager.sendMessage(connection!.remoteDevice.id, message);
      } catch (error) {
        log.error(`Failed to sync history to ${connection!.remoteDevice.name}:`, error);
      }
    }

    this.emit('browser:history:synced', { history: historyEntries });
  }

  /**
   * Sync bookmarks
   */
  async syncBookmarks(): Promise<void> {
    if (!this.options.enabled || !this.options.syncBookmarks || !this.localDeviceId) {
      return;
    }

    const bookmarksList = Array.from(this.bookmarks.values());

    const connections = connectionManager.getActiveConnections();

    if (connections.length === 0) {
      return;
    }

    log.info(`Syncing ${bookmarksList.length} bookmarks`);

    for (const connection of connections) {
      try {
        const message = createMessage(
          MessageType.BROWSER_SYNC,
          {
            action: 'bookmarks-sync',
            bookmarks: bookmarksList,
          },
          {
            from: this.localDeviceId,
            to: connection!.remoteDevice.id,
          }
        );

        await connectionManager.sendMessage(connection!.remoteDevice.id, message);
      } catch (error) {
        log.error(`Failed to sync bookmarks to ${connection!.remoteDevice.name}:`, error);
      }
    }

    this.emit('browser:bookmarks:synced', { bookmarks: bookmarksList });
  }

  /**
   * Add history entry
   */
  addHistoryEntry(entry: HistoryEntry): void {
    this.history.set(entry.id, entry);

    if (this.options.autoSync && this.options.syncHistory) {
      // Debounced sync will pick this up
    }
  }

  /**
   * Add bookmark
   */
  addBookmark(bookmark: Bookmark): void {
    this.bookmarks.set(bookmark.id, bookmark);

    if (this.options.autoSync && this.options.syncBookmarks) {
      this.syncBookmarks();
    }
  }

  /**
   * Remove bookmark
   */
  removeBookmark(bookmarkId: string): void {
    this.bookmarks.delete(bookmarkId);

    if (this.options.autoSync && this.options.syncBookmarks) {
      this.syncBookmarks();
    }
  }

  /**
   * Get remote sessions
   */
  getRemoteSessions(): BrowserSession[] {
    return Array.from(this.remoteSessions.values());
  }

  /**
   * Get local session
   */
  getLocalSession(): BrowserSession | undefined {
    return this.localSession;
  }

  /**
   * Get history
   */
  getHistory(limit?: number): HistoryEntry[] {
    const entries = Array.from(this.history.values()).sort(
      (a, b) => b.visitTime.getTime() - a.visitTime.getTime()
    );

    return limit ? entries.slice(0, limit) : entries;
  }

  /**
   * Get bookmarks
   */
  getBookmarks(folder?: string): Bookmark[] {
    const bookmarks = Array.from(this.bookmarks.values());

    if (folder) {
      return bookmarks.filter((b) => b.folder === folder);
    }

    return bookmarks;
  }

  /**
   * Search history
   */
  searchHistory(query: string): HistoryEntry[] {
    const lowerQuery = query.toLowerCase();

    return Array.from(this.history.values()).filter(
      (entry) =>
        entry.url.toLowerCase().includes(lowerQuery) ||
        entry.title.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Search bookmarks
   */
  searchBookmarks(query: string): Bookmark[] {
    const lowerQuery = query.toLowerCase();

    return Array.from(this.bookmarks.values()).filter(
      (bookmark) =>
        bookmark.url.toLowerCase().includes(lowerQuery) ||
        bookmark.title.toLowerCase().includes(lowerQuery) ||
        bookmark.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Start auto-sync
   */
  private startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      try {
        if (this.options.syncTabs) {
          await this.syncTabs();
        }
      } catch (error) {
        log.error('Auto-sync failed:', error);
      }
    }, this.options.syncInterval);

    log.info(`Auto-sync started (interval: ${this.options.syncInterval}ms)`);
  }

  /**
   * Stop auto-sync
   */
  private stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
      log.info('Auto-sync stopped');
    }
  }

  /**
   * Update settings
   */
  updateSettings(options: Partial<BrowserSyncOptions>): void {
    Object.assign(this.options, options);

    // Restart auto-sync if settings changed
    if (options.autoSync !== undefined || options.syncInterval !== undefined) {
      if (this.options.autoSync) {
        this.startAutoSync();
      } else {
        this.stopAutoSync();
      }
    }
  }

  /**
   * Get current settings
   */
  getSettings(): Required<BrowserSyncOptions> {
    return { ...this.options };
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.stopAutoSync();
    log.info('Browser sync service cleaned up');
  }
}

// Export singleton instance
export const browserSyncService = new BrowserSyncService();
