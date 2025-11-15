import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import { Message } from '@portal-fusion/shared';
export interface CameraSharingOptions {
    enabled?: boolean;
    resolution?: 'low' | 'medium' | 'high' | 'ultra';
    frameRate?: number;
    codec?: 'h264' | 'vp8' | 'vp9';
    enableAudio?: boolean;
    mirrorVideo?: boolean;
}
export interface CameraDevice {
    id: string;
    name: string;
    facing?: 'user' | 'environment';
    capabilities: {
        resolutions: Array<{
            width: number;
            height: number;
        }>;
        frameRates: number[];
        hasFlash: boolean;
        hasZoom: boolean;
        hasFocus: boolean;
    };
}
export interface CameraStream {
    id: string;
    sourceDeviceId: string;
    targetDeviceId: string;
    cameraId: string;
    config: {
        resolution: {
            width: number;
            height: number;
        };
        frameRate: number;
        codec: string;
        enableAudio: boolean;
        mirrorVideo: boolean;
    };
    startedAt: Date;
    active: boolean;
    stats: {
        framesSent: number;
        framesReceived: number;
        bytesTransferred: number;
        droppedFrames: number;
        averageLatency: number;
    };
}
/**
 * Camera Sharing Service
 * Share camera feeds between devices
 */
export declare class CameraSharingService extends TypedEventEmitter<PortalFusionEvents> {
    private options;
    private localDeviceId?;
    private availableCameras;
    private activeStreams;
    private streamIntervals;
    private readonly RESOLUTIONS;
    constructor(options?: CameraSharingOptions);
    /**
     * Initialize service
     */
    initialize(localDeviceId: string): Promise<void>;
    /**
     * Enumerate available cameras (to be implemented via native bridge)
     */
    private enumerateCameras;
    /**
     * Get available cameras
     */
    getAvailableCameras(): CameraDevice[];
    /**
     * Start sharing camera
     */
    startCameraShare(targetDeviceId: string, cameraId: string): Promise<CameraStream>;
    /**
     * Stop camera share
     */
    stopCameraShare(streamId: string): Promise<void>;
    /**
     * Handle stream request
     */
    handleStreamRequest(message: Message): Promise<void>;
    /**
     * Start camera capture (to be implemented via native bridge)
     */
    private startCameraCapture;
    /**
     * Capture and send video frame (to be implemented via native bridge)
     */
    private captureAndSendFrame;
    /**
     * Handle received video frame
     */
    handleVideoFrame(message: Message): void;
    /**
     * Update stream configuration
     */
    updateStreamConfig(streamId: string, config: Partial<CameraStream['config']>): Promise<void>;
    /**
     * Take snapshot from stream
     */
    takeSnapshot(streamId: string): Promise<Buffer>;
    /**
     * Control camera settings (zoom, flash, focus, etc.)
     */
    controlCamera(streamId: string, control: {
        zoom?: number;
        flash?: boolean;
        focus?: {
            x: number;
            y: number;
        };
    }): Promise<void>;
    /**
     * Get active streams
     */
    getActiveStreams(): CameraStream[];
    /**
     * Get stream by ID
     */
    getStream(streamId: string): CameraStream | undefined;
    /**
     * Get stream stats
     */
    getStreamStats(streamId: string): CameraStream['stats'] | undefined;
    /**
     * Update settings
     */
    updateSettings(options: Partial<CameraSharingOptions>): void;
    /**
     * Get current settings
     */
    getSettings(): Required<CameraSharingOptions>;
    /**
     * Clean up all streams
     */
    cleanup(): Promise<void>;
}
export declare const cameraSharingService: CameraSharingService;
//# sourceMappingURL=camera-sharing.d.ts.map