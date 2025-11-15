"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.microphoneRoutingService = exports.MicrophoneRoutingService = void 0;
const shared_1 = require("@portal-fusion/shared");
const shared_2 = require("@portal-fusion/shared");
const shared_3 = require("@portal-fusion/shared");
const connection_1 = require("../connection");
const electron_log_1 = __importDefault(require("electron-log"));
/**
 * Microphone Routing Service
 * Route microphone input between devices with advanced audio processing
 */
class MicrophoneRoutingService extends shared_1.TypedEventEmitter {
    constructor(options = {}) {
        super();
        this.availableMicrophones = new Map();
        this.activeStreams = new Map();
        this.streamIntervals = new Map();
        // VAD thresholds
        this.VAD_THRESHOLD = 0.02; // Audio level threshold for voice detection
        this.VAD_SMOOTHING = 0.85; // Smoothing factor for VAD
        this.options = {
            enabled: options.enabled !== false,
            sampleRate: options.sampleRate || 48000,
            channels: options.channels || 1, // Mono by default for voice
            bitDepth: options.bitDepth || 16,
            codec: options.codec || 'opus',
            enableNoiseSuppression: options.enableNoiseSuppression !== false,
            enableEchoCancellation: options.enableEchoCancellation !== false,
            enableVAD: options.enableVAD !== false,
            gainControl: options.gainControl !== false,
            autoGain: options.autoGain !== false,
        };
    }
    /**
     * Initialize service
     */
    async initialize(localDeviceId) {
        this.localDeviceId = localDeviceId;
        // Enumerate microphones (to be implemented via native bridge)
        await this.enumerateMicrophones();
        electron_log_1.default.info('Microphone routing service initialized');
    }
    /**
     * Enumerate available microphones (to be implemented via native bridge)
     */
    async enumerateMicrophones() {
        // This will be implemented via native bridge
        electron_log_1.default.info('Enumerating microphones...');
    }
    /**
     * Get available microphones
     */
    getAvailableMicrophones() {
        return Array.from(this.availableMicrophones.values());
    }
    /**
     * Start microphone stream
     */
    async startMicrophoneStream(targetDeviceId, microphoneId) {
        if (!this.options.enabled || !this.localDeviceId) {
            throw new Error('Microphone routing service not enabled or initialized');
        }
        const microphone = this.availableMicrophones.get(microphoneId);
        if (!microphone) {
            throw new Error('Microphone not found');
        }
        const stream = {
            id: `mic-${Date.now()}`,
            sourceDeviceId: this.localDeviceId,
            targetDeviceId,
            microphoneId,
            config: {
                sampleRate: this.options.sampleRate,
                channels: this.options.channels,
                bitDepth: this.options.bitDepth,
                codec: this.options.codec,
                noiseSuppression: this.options.enableNoiseSuppression,
                echoCancellation: this.options.enableEchoCancellation,
                vad: this.options.enableVAD,
                gain: 1.0,
                autoGain: this.options.autoGain,
            },
            startedAt: new Date(),
            active: true,
            stats: {
                packetsSent: 0,
                packetsReceived: 0,
                bytesTransferred: 0,
                voiceActivitySeconds: 0,
                silenceSeconds: 0,
                averageLevel: 0,
            },
        };
        this.activeStreams.set(stream.id, stream);
        // Send stream start request
        const message = (0, shared_3.createMessage)(shared_2.MessageType.AUDIO_STREAM_START, {
            action: 'microphone-start',
            streamId: stream.id,
            microphoneId,
            config: stream.config,
        }, {
            from: this.localDeviceId,
            to: targetDeviceId,
        });
        await connection_1.connectionManager.sendMessage(targetDeviceId, message);
        electron_log_1.default.info(`Started microphone stream: ${microphone.name} -> ${targetDeviceId}`);
        this.emit('microphone:stream:started', stream);
        // Start capturing and sending audio
        await this.startMicrophoneCapture(stream);
        return stream;
    }
    /**
     * Stop microphone stream
     */
    async stopMicrophoneStream(streamId) {
        const stream = this.activeStreams.get(streamId);
        if (!stream || !this.localDeviceId) {
            return;
        }
        // Stop capture
        const interval = this.streamIntervals.get(streamId);
        if (interval) {
            clearInterval(interval);
            this.streamIntervals.delete(streamId);
        }
        // Send stop message
        const message = (0, shared_3.createMessage)(shared_2.MessageType.AUDIO_STREAM_STOP, {
            action: 'microphone-stop',
            streamId,
        }, {
            from: this.localDeviceId,
            to: stream.targetDeviceId,
        });
        await connection_1.connectionManager.sendMessage(stream.targetDeviceId, message);
        stream.active = false;
        this.activeStreams.delete(streamId);
        electron_log_1.default.info(`Stopped microphone stream: ${streamId}`);
        this.emit('microphone:stream:stopped', { streamId });
    }
    /**
     * Handle stream request
     */
    async handleStreamRequest(message) {
        const { action, streamId, microphoneId, config } = message.payload;
        if (action === 'microphone-start') {
            const stream = {
                id: streamId,
                sourceDeviceId: message.from,
                targetDeviceId: this.localDeviceId,
                microphoneId,
                config: config || {
                    sampleRate: this.options.sampleRate,
                    channels: this.options.channels,
                    bitDepth: this.options.bitDepth,
                    codec: this.options.codec,
                    noiseSuppression: this.options.enableNoiseSuppression,
                    echoCancellation: this.options.enableEchoCancellation,
                    vad: this.options.enableVAD,
                    gain: 1.0,
                    autoGain: this.options.autoGain,
                },
                startedAt: new Date(),
                active: true,
                stats: {
                    packetsSent: 0,
                    packetsReceived: 0,
                    bytesTransferred: 0,
                    voiceActivitySeconds: 0,
                    silenceSeconds: 0,
                    averageLevel: 0,
                },
            };
            this.activeStreams.set(streamId, stream);
            electron_log_1.default.info(`Receiving microphone stream from: ${message.from}`);
            this.emit('microphone:stream:receiving', stream);
        }
        else if (action === 'microphone-stop') {
            this.activeStreams.delete(streamId);
            electron_log_1.default.info(`Microphone stream ended: ${streamId}`);
            this.emit('microphone:stream:ended', { streamId });
        }
    }
    /**
     * Start microphone capture (to be implemented via native bridge)
     */
    async startMicrophoneCapture(stream) {
        // This will be implemented via native bridge (getUserMedia with audio constraints)
        const packetInterval = 20; // 20ms packets for low latency voice
        const interval = setInterval(async () => {
            try {
                await this.captureAndSendAudioPacket(stream);
            }
            catch (error) {
                electron_log_1.default.error('Failed to capture/send audio packet:', error);
            }
        }, packetInterval);
        this.streamIntervals.set(stream.id, interval);
    }
    /**
     * Capture and send audio packet with VAD (to be implemented via native bridge)
     */
    async captureAndSendAudioPacket(stream) {
        if (!this.localDeviceId || !stream.active) {
            return;
        }
        // This will be implemented via native bridge
        const audioData = Buffer.from(''); // Placeholder
        const audioLevel = 0; // Placeholder - would calculate RMS level
        // Voice Activity Detection
        let isVoice = true;
        if (stream.config.vad) {
            isVoice = this.detectVoiceActivity(audioLevel, stream);
            if (isVoice) {
                stream.stats.voiceActivitySeconds += 0.02; // 20ms
            }
            else {
                stream.stats.silenceSeconds += 0.02;
            }
        }
        // Only send if voice detected or VAD disabled
        if (isVoice || !stream.config.vad) {
            // Use HEARTBEAT for audio packets since there's no dedicated AUDIO_PACKET type
            const message = (0, shared_3.createMessage)(shared_2.MessageType.HEARTBEAT, {
                streamId: stream.id,
                data: audioData.toString('base64'),
                timestamp: Date.now(),
                sequence: stream.stats.packetsSent,
                level: audioLevel,
                isVoice,
            }, {
                from: this.localDeviceId,
                to: stream.targetDeviceId,
                compressed: true,
            });
            await connection_1.connectionManager.sendMessage(stream.targetDeviceId, message);
            stream.stats.packetsSent++;
            stream.stats.bytesTransferred += audioData.length;
        }
        // Update average level
        stream.stats.averageLevel =
            stream.stats.averageLevel * this.VAD_SMOOTHING + audioLevel * (1 - this.VAD_SMOOTHING);
    }
    /**
     * Detect voice activity
     */
    detectVoiceActivity(audioLevel, stream) {
        // Simple threshold-based VAD
        // In production, would use more sophisticated algorithms
        return audioLevel > this.VAD_THRESHOLD;
    }
    /**
     * Handle received audio packet
     */
    handleAudioPacket(message) {
        const { streamId, data, timestamp, sequence, level, isVoice } = message.payload;
        const stream = Array.from(this.activeStreams.values()).find((s) => s.id === streamId && s.sourceDeviceId === message.from);
        if (!stream) {
            return;
        }
        stream.stats.packetsReceived++;
        // Emit audio data for playback
        this.emit('microphone:packet:received', {
            streamId,
            data: Buffer.from(data, 'base64'),
            sequence,
            level,
            isVoice,
        });
    }
    /**
     * Adjust gain
     */
    async adjustGain(streamId, gain) {
        const stream = this.activeStreams.get(streamId);
        if (!stream) {
            throw new Error('Stream not found');
        }
        // Gain should be 0.0 to 2.0 (0 = mute, 1 = normal, 2 = boost)
        stream.config.gain = Math.max(0, Math.min(2, gain));
        electron_log_1.default.info(`Microphone gain adjusted: ${streamId} -> ${stream.config.gain}`);
        this.emit('microphone:gain:changed', { streamId, gain: stream.config.gain });
    }
    /**
     * Toggle mute
     */
    async toggleMute(streamId, muted) {
        const stream = this.activeStreams.get(streamId);
        if (!stream) {
            throw new Error('Stream not found');
        }
        // Mute by setting gain to 0, unmute by restoring to 1
        stream.config.gain = muted ? 0 : 1.0;
        electron_log_1.default.info(`Microphone ${muted ? 'muted' : 'unmuted'}: ${streamId}`);
        this.emit('microphone:mute:changed', { streamId, muted });
    }
    /**
     * Update audio processing settings
     */
    async updateProcessing(streamId, settings) {
        const stream = this.activeStreams.get(streamId);
        if (!stream) {
            throw new Error('Stream not found');
        }
        Object.assign(stream.config, settings);
        electron_log_1.default.info(`Audio processing updated: ${streamId}`);
        this.emit('microphone:processing:updated', { streamId, settings });
    }
    /**
     * Get active streams
     */
    getActiveStreams() {
        return Array.from(this.activeStreams.values()).filter((s) => s.active);
    }
    /**
     * Get stream by ID
     */
    getStream(streamId) {
        return this.activeStreams.get(streamId);
    }
    /**
     * Get stream stats
     */
    getStreamStats(streamId) {
        return this.activeStreams.get(streamId)?.stats;
    }
    /**
     * Test microphone (returns audio level)
     */
    async testMicrophone(microphoneId, duration = 3000) {
        // This will be implemented via native bridge
        // Should capture audio for specified duration and return levels
        const levels = [];
        electron_log_1.default.info(`Testing microphone: ${microphoneId} for ${duration}ms`);
        this.emit('microphone:test:started', { microphoneId, duration });
        // Placeholder - would capture actual audio levels
        setTimeout(() => {
            this.emit('microphone:test:completed', { microphoneId, levels });
        }, duration);
        return levels;
    }
    /**
     * Update settings
     */
    updateSettings(options) {
        Object.assign(this.options, options);
        // Update active streams
        const activeStreams = this.getActiveStreams();
        activeStreams.forEach((stream) => {
            if (stream.sourceDeviceId === this.localDeviceId) {
                stream.config.noiseSuppression = this.options.enableNoiseSuppression;
                stream.config.echoCancellation = this.options.enableEchoCancellation;
                stream.config.vad = this.options.enableVAD;
                stream.config.autoGain = this.options.autoGain;
            }
        });
    }
    /**
     * Get current settings
     */
    getSettings() {
        return { ...this.options };
    }
    /**
     * Clean up all streams
     */
    async cleanup() {
        const activeStreams = this.getActiveStreams();
        for (const stream of activeStreams) {
            await this.stopMicrophoneStream(stream.id);
        }
        electron_log_1.default.info('Microphone routing service cleaned up');
    }
}
exports.MicrophoneRoutingService = MicrophoneRoutingService;
// Export singleton instance
exports.microphoneRoutingService = new MicrophoneRoutingService();
//# sourceMappingURL=microphone-routing.js.map