import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import { Message } from '@portal-fusion/shared';
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
    tabs: string[];
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
export declare class BrowserSyncService extends TypedEventEmitter<PortalFusionEvents> {
    private options;
    private localDeviceId?;
    private localSession?;
    private remoteSessions;
    private history;
    private bookmarks;
    private syncInterval?;
    constructor(options?: BrowserSyncOptions);
    /**
     * Initialize service
     */
    initialize(localDeviceId: string): void;
    /**
     * Detect browser (to be implemented via native bridge)
     */
    private detectBrowser;
    /**
     * Get current browser tabs (to be implemented via native bridge)
     */
    getCurrentTabs(): Promise<BrowserTab[]>;
    /**
     * Sync local tabs with connected devices
     */
    syncTabs(): Promise<void>;
    /**
     * Send tab to specific device
     */
    sendTab(tabId: string, targetDeviceId: string): Promise<void>;
    /**
     * Handle browser sync message
     */
    handleSyncMessage(message: Message): Promise<void>;
    /**
     * Open tab (to be implemented via native bridge)
     */
    private openTab;
    /**
     * Sync browsing history
     */
    syncHistory(): Promise<void>;
    /**
     * Sync bookmarks
     */
    syncBookmarks(): Promise<void>;
    /**
     * Add history entry
     */
    addHistoryEntry(entry: HistoryEntry): void;
    /**
     * Add bookmark
     */
    addBookmark(bookmark: Bookmark): void;
    /**
     * Remove bookmark
     */
    removeBookmark(bookmarkId: string): void;
    /**
     * Get remote sessions
     */
    getRemoteSessions(): BrowserSession[];
    /**
     * Get local session
     */
    getLocalSession(): BrowserSession | undefined;
    /**
     * Get history
     */
    getHistory(limit?: number): HistoryEntry[];
    /**
     * Get bookmarks
     */
    getBookmarks(folder?: string): Bookmark[];
    /**
     * Search history
     */
    searchHistory(query: string): HistoryEntry[];
    /**
     * Search bookmarks
     */
    searchBookmarks(query: string): Bookmark[];
    /**
     * Start auto-sync
     */
    private startAutoSync;
    /**
     * Stop auto-sync
     */
    private stopAutoSync;
    /**
     * Update settings
     */
    updateSettings(options: Partial<BrowserSyncOptions>): void;
    /**
     * Get current settings
     */
    getSettings(): Required<BrowserSyncOptions>;
    /**
     * Cleanup
     */
    cleanup(): void;
}
export declare const browserSyncService: BrowserSyncService;
//# sourceMappingURL=browser-sync.d.ts.map