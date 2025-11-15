import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
export interface ScreenshotOptions {
    format?: 'png' | 'jpeg';
    quality?: number;
    autoShare?: boolean;
}
export interface ScreenshotCapture {
    id: string;
    image: Buffer;
    format: string;
    timestamp: Date;
    displayId?: number;
}
/**
 * Screenshot Capture and Share Service
 */
export declare class ScreenshotService extends TypedEventEmitter<PortalFusionEvents> {
    private options;
    private localDeviceId?;
    private lastScreenshot?;
    constructor(options?: ScreenshotOptions);
    /**
     * Initialize service
     */
    initialize(localDeviceId: string): void;
    /**
     * Capture screenshot (to be implemented via native bridge)
     */
    captureScreenshot(displayId?: number): Promise<ScreenshotCapture>;
    /**
     * Share screenshot with connected devices
     */
    shareScreenshot(screenshot: ScreenshotCapture, targetDeviceId?: string): Promise<void>;
    /**
     * Capture and share screenshot
     */
    captureAndShare(displayId?: number, targetDeviceId?: string): Promise<void>;
    /**
     * Get last screenshot
     */
    getLastScreenshot(): ScreenshotCapture | undefined;
    /**
     * Save screenshot to file (to be implemented via native bridge)
     */
    saveScreenshot(screenshot: ScreenshotCapture, filePath: string): Promise<void>;
    /**
     * Update settings
     */
    updateSettings(options: Partial<ScreenshotOptions>): void;
    /**
     * Get current settings
     */
    getSettings(): Required<ScreenshotOptions>;
}
export declare const screenshotService: ScreenshotService;
//# sourceMappingURL=screenshot.d.ts.map