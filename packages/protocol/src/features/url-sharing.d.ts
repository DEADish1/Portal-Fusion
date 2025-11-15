import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import { Message } from '@portal-fusion/shared';
export interface URLShareOptions {
    enabled?: boolean;
    autoOpen?: boolean;
    confirmBeforeOpen?: boolean;
}
export interface SharedURL {
    id: string;
    url: string;
    title?: string;
    sourceDevice: string;
    timestamp: Date;
    opened: boolean;
}
/**
 * URL/Link Sharing Service
 * Share URLs and links between devices
 */
export declare class URLSharingService extends TypedEventEmitter<PortalFusionEvents> {
    private options;
    private localDeviceId?;
    private sharedURLs;
    constructor(options?: URLShareOptions);
    /**
     * Initialize service
     */
    initialize(localDeviceId: string): void;
    /**
     * Share URL to device(s)
     */
    shareURL(url: string, title?: string, targetDeviceId?: string): Promise<void>;
    /**
     * Handle received URL
     */
    handleURLReceived(message: Message): Promise<void>;
    /**
     * Open URL (to be implemented via native bridge)
     */
    openURL(urlId: string): Promise<void>;
    /**
     * Validate URL
     */
    private isValidURL;
    /**
     * Get shared URLs
     */
    getSharedURLs(limit?: number): SharedURL[];
    /**
     * Clear shared URLs
     */
    clearSharedURLs(): void;
    /**
     * Update settings
     */
    updateSettings(options: Partial<URLShareOptions>): void;
    /**
     * Get current settings
     */
    getSettings(): Required<URLShareOptions>;
}
export declare const urlSharingService: URLSharingService;
//# sourceMappingURL=url-sharing.d.ts.map