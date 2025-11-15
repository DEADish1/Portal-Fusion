import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import { Message } from '@portal-fusion/shared';
export interface SecondScreenOptions {
    enabled?: boolean;
    quality?: number;
    frameRate?: number;
    autoResize?: boolean;
    enableAudio?: boolean;
}
export interface SecondScreenConfig {
    width: number;
    height: number;
    scaleFactor: number;
    position: {
        x: number;
        y: number;
    };
}
export interface SecondScreenSession {
    id: string;
    hostDeviceId: string;
    clientDeviceId: string;
    config: SecondScreenConfig;
    startedAt: Date;
    active: boolean;
    stats: {
        framesSent: number;
        framesReceived: number;
        bytesTransferred: number;
        averageLatency: number;
    };
}
/**
 * Second Screen Service
 * Use a remote device as an extended display
 */
export declare class SecondScreenService extends TypedEventEmitter<PortalFusionEvents> {
    private options;
    private localDeviceId?;
    private activeSessions;
    private isHosting;
    private isClient;
    private currentSession?;
    private streamInterval?;
    constructor(options?: SecondScreenOptions);
    /**
     * Initialize service
     */
    initialize(localDeviceId: string): void;
    /**
     * Start hosting second screen (share screen to remote device)
     */
    startHosting(targetDeviceId: string, config: SecondScreenConfig): Promise<SecondScreenSession>;
    /**
     * Stop hosting second screen
     */
    stopHosting(): Promise<void>;
    /**
     * Handle screen session request (become a second screen)
     */
    handleScreenRequest(message: Message): Promise<void>;
    /**
     * Start streaming screen frames
     */
    private startScreenStream;
    /**
     * Capture and send screen frame (to be implemented via native bridge)
     */
    private captureAndSendFrame;
    /**
     * Handle received screen frame
     */
    handleScreenFrame(message: Message): void;
    /**
     * Update screen configuration
     */
    updateScreenConfig(config: Partial<SecondScreenConfig>): Promise<void>;
    /**
     * Handle screen configuration update
     */
    handleConfigUpdate(message: Message): void;
    /**
     * Check if currently hosting
     */
    isActivelyHosting(): boolean;
    /**
     * Check if acting as second screen
     */
    isActiveClient(): boolean;
    /**
     * Get current session
     */
    getCurrentSession(): SecondScreenSession | undefined;
    /**
     * Get session stats
     */
    getSessionStats(): SecondScreenSession['stats'] | undefined;
    /**
     * Update settings
     */
    updateSettings(options: Partial<SecondScreenOptions>): void;
    /**
     * Get current settings
     */
    getSettings(): Required<SecondScreenOptions>;
}
export declare const secondScreenService: SecondScreenService;
//# sourceMappingURL=second-screen.d.ts.map