import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import { Message } from '@portal-fusion/shared';
export interface ClipboardSyncOptions {
    enabled?: boolean;
    syncText?: boolean;
    syncImages?: boolean;
    syncFiles?: boolean;
    syncHtml?: boolean;
    autoSync?: boolean;
    syncDelay?: number;
}
/**
 * Clipboard Sync Service
 * Monitors and syncs clipboard content across devices
 */
export declare class ClipboardSyncService extends TypedEventEmitter<PortalFusionEvents> {
    private options;
    private lastClipboardHash?;
    private syncTimer?;
    private monitorInterval?;
    private localDeviceId?;
    private paused;
    constructor(options?: ClipboardSyncOptions);
    /**
     * Start clipboard monitoring
     */
    start(localDeviceId: string): void;
    /**
     * Stop clipboard monitoring
     */
    stop(): void;
    /**
     * Check for clipboard changes
     */
    private checkClipboard;
    /**
     * Sync clipboard to connected devices
     */
    private syncClipboard;
    /**
     * Handle received clipboard message
     */
    handleClipboardMessage(message: Message): Promise<void>;
    /**
     * Create clipboard message
     */
    private createClipboardMessage;
    /**
     * Check if type should be synced
     */
    private shouldSyncType;
    /**
     * Validate clipboard data size
     */
    private validateSize;
    /**
     * Hash clipboard data for change detection
     */
    private hashClipboardData;
    /**
     * Get clipboard from native bridge (to be injected)
     */
    private getClipboardFromNative;
    /**
     * Set clipboard to native bridge (to be injected)
     */
    private setClipboardToNative;
    /**
     * Manually sync clipboard
     */
    manualSync(): Promise<void>;
    /**
     * Update settings
     */
    updateSettings(options: Partial<ClipboardSyncOptions>): void;
    /**
     * Get current settings
     */
    getSettings(): Required<ClipboardSyncOptions>;
    /**
     * Pause clipboard sync temporarily
     */
    pause(): void;
    /**
     * Resume clipboard sync
     */
    resume(): void;
}
export declare const clipboardSyncService: ClipboardSyncService;
//# sourceMappingURL=clipboard.d.ts.map