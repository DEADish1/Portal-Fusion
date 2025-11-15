import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import { Message } from '@portal-fusion/shared';
export interface MicrophoneRoutingOptions {
    enabled?: boolean;
    sampleRate?: number;
    channels?: number;
    bitDepth?: number;
    codec?: 'pcm' | 'opus';
    enableNoiseSuppression?: boolean;
    enableEchoCancellation?: boolean;
    enableVAD?: boolean;
    gainControl?: boolean;
    autoGain?: boolean;
}
export interface MicrophoneDevice {
    id: string;
    name: string;
    type: 'built-in' | 'usb' | 'bluetooth' | 'virtual';
    isDefault: boolean;
    channels: number;
    sampleRate: number;
}
export interface MicrophoneStream {
    id: string;
    sourceDeviceId: string;
    targetDeviceId: string;
    microphoneId: string;
    config: {
        sampleRate: number;
        channels: number;
        bitDepth: number;
        codec: string;
        noiseSuppression: boolean;
        echoCancellation: boolean;
        vad: boolean;
        gain: number;
        autoGain: boolean;
    };
    startedAt: Date;
    active: boolean;
    stats: {
        packetsSent: number;
        packetsReceived: number;
        bytesTransferred: number;
        voiceActivitySeconds: number;
        silenceSeconds: number;
        averageLevel: number;
    };
}
/**
 * Microphone Routing Service
 * Route microphone input between devices with advanced audio processing
 */
export declare class MicrophoneRoutingService extends TypedEventEmitter<PortalFusionEvents> {
    private options;
    private localDeviceId?;
    private availableMicrophones;
    private activeStreams;
    private streamIntervals;
    private readonly VAD_THRESHOLD;
    private readonly VAD_SMOOTHING;
    constructor(options?: MicrophoneRoutingOptions);
    /**
     * Initialize service
     */
    initialize(localDeviceId: string): Promise<void>;
    /**
     * Enumerate available microphones (to be implemented via native bridge)
     */
    private enumerateMicrophones;
    /**
     * Get available microphones
     */
    getAvailableMicrophones(): MicrophoneDevice[];
    /**
     * Start microphone stream
     */
    startMicrophoneStream(targetDeviceId: string, microphoneId: string): Promise<MicrophoneStream>;
    /**
     * Stop microphone stream
     */
    stopMicrophoneStream(streamId: string): Promise<void>;
    /**
     * Handle stream request
     */
    handleStreamRequest(message: Message): Promise<void>;
    /**
     * Start microphone capture (to be implemented via native bridge)
     */
    private startMicrophoneCapture;
    /**
     * Capture and send audio packet with VAD (to be implemented via native bridge)
     */
    private captureAndSendAudioPacket;
    /**
     * Detect voice activity
     */
    private detectVoiceActivity;
    /**
     * Handle received audio packet
     */
    handleAudioPacket(message: Message): void;
    /**
     * Adjust gain
     */
    adjustGain(streamId: string, gain: number): Promise<void>;
    /**
     * Toggle mute
     */
    toggleMute(streamId: string, muted: boolean): Promise<void>;
    /**
     * Update audio processing settings
     */
    updateProcessing(streamId: string, settings: {
        noiseSuppression?: boolean;
        echoCancellation?: boolean;
        vad?: boolean;
        autoGain?: boolean;
    }): Promise<void>;
    /**
     * Get active streams
     */
    getActiveStreams(): MicrophoneStream[];
    /**
     * Get stream by ID
     */
    getStream(streamId: string): MicrophoneStream | undefined;
    /**
     * Get stream stats
     */
    getStreamStats(streamId: string): MicrophoneStream['stats'] | undefined;
    /**
     * Test microphone (returns audio level)
     */
    testMicrophone(microphoneId: string, duration?: number): Promise<number[]>;
    /**
     * Update settings
     */
    updateSettings(options: Partial<MicrophoneRoutingOptions>): void;
    /**
     * Get current settings
     */
    getSettings(): Required<MicrophoneRoutingOptions>;
    /**
     * Clean up all streams
     */
    cleanup(): Promise<void>;
}
export declare const microphoneRoutingService: MicrophoneRoutingService;
//# sourceMappingURL=microphone-routing.d.ts.map