import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import { Message } from '@portal-fusion/shared';
export interface AudioRoutingOptions {
    enabled?: boolean;
    sampleRate?: number;
    channels?: number;
    bitDepth?: number;
    codec?: 'pcm' | 'opus';
    bufferSize?: number;
    enableEchoCancellation?: boolean;
    enableNoiseSuppression?: boolean;
}
export interface AudioStream {
    id: string;
    sourceDeviceId: string;
    targetDeviceId: string;
    type: 'system' | 'application' | 'microphone';
    config: {
        sampleRate: number;
        channels: number;
        bitDepth: number;
        codec: string;
    };
    startedAt: Date;
    active: boolean;
    stats: {
        packetsSent: number;
        packetsReceived: number;
        bytesTransferred: number;
        bufferUnderruns: number;
        latency: number;
    };
}
export interface AudioDevice {
    id: string;
    name: string;
    type: 'input' | 'output';
    isDefault: boolean;
    channels: number;
    sampleRate: number;
}
/**
 * System Audio Routing Service
 * Route audio streams between devices
 */
export declare class AudioRoutingService extends TypedEventEmitter<PortalFusionEvents> {
    private options;
    private localDeviceId?;
    private activeStreams;
    private audioDevices;
    private streamIntervals;
    constructor(options?: AudioRoutingOptions);
    /**
     * Initialize service
     */
    initialize(localDeviceId: string): void;
    /**
     * Start audio stream
     */
    startAudioStream(targetDeviceId: string, streamType: 'system' | 'application' | 'microphone', sourceDeviceId?: string): Promise<AudioStream>;
    /**
     * Stop audio stream
     */
    stopAudioStream(streamId: string): Promise<void>;
    /**
     * Handle stream request
     */
    handleStreamRequest(message: Message): Promise<void>;
    /**
     * Start audio capture (to be implemented via native bridge)
     */
    private startAudioCapture;
    /**
     * Capture and send audio packet (to be implemented via native bridge)
     */
    private captureAndSendAudioPacket;
    /**
     * Handle received audio packet
     */
    handleAudioPacket(message: Message): void;
    /**
     * Get available audio devices (to be implemented via native bridge)
     */
    getAudioDevices(): Promise<AudioDevice[]>;
    /**
     * Set audio device
     */
    setAudioDevice(streamId: string, deviceId: string): Promise<void>;
    /**
     * Adjust volume (to be implemented via native bridge)
     */
    adjustVolume(streamId: string, volume: number): Promise<void>;
    /**
     * Mute/unmute stream
     */
    toggleMute(streamId: string, muted: boolean): Promise<void>;
    /**
     * Get active streams
     */
    getActiveStreams(): AudioStream[];
    /**
     * Get stream by ID
     */
    getStream(streamId: string): AudioStream | undefined;
    /**
     * Get stream stats
     */
    getStreamStats(streamId: string): AudioStream['stats'] | undefined;
    /**
     * Update settings
     */
    updateSettings(options: Partial<AudioRoutingOptions>): void;
    /**
     * Get current settings
     */
    getSettings(): Required<AudioRoutingOptions>;
    /**
     * Clean up all streams
     */
    cleanup(): Promise<void>;
}
export declare const audioRoutingService: AudioRoutingService;
//# sourceMappingURL=audio-routing.d.ts.map