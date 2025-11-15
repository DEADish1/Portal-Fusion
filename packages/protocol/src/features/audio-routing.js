"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.audioRoutingService = exports.AudioRoutingService = void 0;
const shared_1 = require("@portal-fusion/shared");
const shared_2 = require("@portal-fusion/shared");
const shared_3 = require("@portal-fusion/shared");
const connection_1 = require("../connection");
const electron_log_1 = __importDefault(require("electron-log"));
/**
 * System Audio Routing Service
 * Route audio streams between devices
 */
class AudioRoutingService extends shared_1.TypedEventEmitter {
    constructor(options = {}) {
        super();
        this.activeStreams = new Map();
        this.audioDevices = new Map();
        this.streamIntervals = new Map();
        this.options = {
            enabled: options.enabled !== false,
            sampleRate: options.sampleRate || 48000,
            channels: options.channels || 2,
            bitDepth: options.bitDepth || 16,
            codec: options.codec || 'opus',
            bufferSize: options.bufferSize || 4096,
            enableEchoCancellation: options.enableEchoCancellation !== false,
            enableNoiseSuppression: options.enableNoiseSuppression !== false,
        };
    }
    /**
     * Initialize service
     */
    initialize(localDeviceId) {
        this.localDeviceId = localDeviceId;
        electron_log_1.default.info('Audio routing service initialized');
    }
    /**
     * Start audio stream
     */
    async startAudioStream(targetDeviceId, streamType, sourceDeviceId) {
        if (!this.options.enabled || !this.localDeviceId) {
            throw new Error('Audio routing service not enabled or initialized');
        }
        const stream = {
            id: `audio-${Date.now()}`,
            sourceDeviceId: sourceDeviceId || this.localDeviceId,
            targetDeviceId,
            type: streamType,
            config: {
                sampleRate: this.options.sampleRate,
                channels: this.options.channels,
                bitDepth: this.options.bitDepth,
                codec: this.options.codec,
            },
            startedAt: new Date(),
            active: true,
            stats: {
                packetsSent: 0,
                packetsReceived: 0,
                bytesTransferred: 0,
                bufferUnderruns: 0,
                latency: 0,
            },
        };
        this.activeStreams.set(stream.id, stream);
        // Send stream start request
        const message = (0, shared_3.createMessage)(shared_2.MessageType.AUDIO_STREAM_START, {
            action: 'start',
            streamId: stream.id,
            streamType,
            config: stream.config,
        }, {
            from: this.localDeviceId,
            to: targetDeviceId,
        });
        await connection_1.connectionManager.sendMessage(targetDeviceId, message);
        electron_log_1.default.info(`Started audio stream: ${streamType} -> ${targetDeviceId}`);
        this.emit('audio:stream:started', stream);
        // Start capturing and sending audio
        this.startAudioCapture(stream);
        return stream;
    }
    /**
     * Stop audio stream
     */
    async stopAudioStream(streamId) {
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
            action: 'stop',
            streamId,
        }, {
            from: this.localDeviceId,
            to: stream.targetDeviceId,
        });
        await connection_1.connectionManager.sendMessage(stream.targetDeviceId, message);
        stream.active = false;
        this.activeStreams.delete(streamId);
        electron_log_1.default.info(`Stopped audio stream: ${streamId}`);
        this.emit('audio:stream:stopped', { streamId });
    }
    /**
     * Handle stream request
     */
    async handleStreamRequest(message) {
        const { action, streamId, streamType, config } = message.payload;
        if (action === 'start') {
            const stream = {
                id: streamId,
                sourceDeviceId: message.from,
                targetDeviceId: this.localDeviceId,
                type: streamType,
                config: config || {
                    sampleRate: this.options.sampleRate,
                    channels: this.options.channels,
                    bitDepth: this.options.bitDepth,
                    codec: this.options.codec,
                },
                startedAt: new Date(),
                active: true,
                stats: {
                    packetsSent: 0,
                    packetsReceived: 0,
                    bytesTransferred: 0,
                    bufferUnderruns: 0,
                    latency: 0,
                },
            };
            this.activeStreams.set(streamId, stream);
            electron_log_1.default.info(`Receiving audio stream from: ${message.from}`);
            this.emit('audio:stream:receiving', stream);
        }
        else if (action === 'stop') {
            this.activeStreams.delete(streamId);
            electron_log_1.default.info(`Audio stream ended: ${streamId}`);
            this.emit('audio:stream:ended', { streamId });
        }
    }
    /**
     * Start audio capture (to be implemented via native bridge)
     */
    startAudioCapture(stream) {
        const packetInterval = (this.options.bufferSize / this.options.sampleRate) * 1000;
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
     * Capture and send audio packet (to be implemented via native bridge)
     */
    async captureAndSendAudioPacket(stream) {
        if (!this.localDeviceId || !stream.active) {
            return;
        }
        // This will be implemented via native bridge (node-speaker, pulseaudio, etc.)
        // For now, this is a placeholder
        const audioData = Buffer.from(''); // Placeholder
        const message = (0, shared_3.createMessage)(shared_2.MessageType.HEARTBEAT, {
            streamId: stream.id,
            data: audioData.toString('base64'),
            timestamp: Date.now(),
            sequence: stream.stats.packetsSent,
        }, {
            from: this.localDeviceId,
            to: stream.targetDeviceId,
            compressed: true,
        });
        await connection_1.connectionManager.sendMessage(stream.targetDeviceId, message);
        stream.stats.packetsSent++;
        stream.stats.bytesTransferred += audioData.length;
    }
    /**
     * Handle received audio packet
     */
    handleAudioPacket(message) {
        const { streamId, data, timestamp, sequence } = message.payload;
        const stream = Array.from(this.activeStreams.values()).find((s) => s.id === streamId && s.sourceDeviceId === message.from);
        if (!stream) {
            return;
        }
        // Calculate latency
        const latency = Date.now() - timestamp;
        stream.stats.latency = (stream.stats.latency * stream.stats.packetsReceived + latency) /
            (stream.stats.packetsReceived + 1);
        stream.stats.packetsReceived++;
        // Emit audio data for playback
        this.emit('audio:packet:received', {
            streamId,
            data: Buffer.from(data, 'base64'),
            sequence,
            latency,
        });
    }
    /**
     * Get available audio devices (to be implemented via native bridge)
     */
    async getAudioDevices() {
        // This will be implemented via native bridge
        return Array.from(this.audioDevices.values());
    }
    /**
     * Set audio device
     */
    async setAudioDevice(streamId, deviceId) {
        const stream = this.activeStreams.get(streamId);
        const device = this.audioDevices.get(deviceId);
        if (!stream || !device) {
            throw new Error('Stream or device not found');
        }
        // Update stream config
        stream.config.sampleRate = device.sampleRate;
        stream.config.channels = device.channels;
        electron_log_1.default.info(`Audio device set for stream ${streamId}: ${device.name}`);
        this.emit('audio:device:changed', { streamId, device });
    }
    /**
     * Adjust volume (to be implemented via native bridge)
     */
    async adjustVolume(streamId, volume) {
        const stream = this.activeStreams.get(streamId);
        if (!stream) {
            throw new Error('Stream not found');
        }
        // Volume should be 0.0 to 1.0
        const normalizedVolume = Math.max(0, Math.min(1, volume));
        electron_log_1.default.info(`Volume adjusted for stream ${streamId}: ${normalizedVolume}`);
        this.emit('audio:volume:changed', { streamId, volume: normalizedVolume });
    }
    /**
     * Mute/unmute stream
     */
    async toggleMute(streamId, muted) {
        const stream = this.activeStreams.get(streamId);
        if (!stream) {
            throw new Error('Stream not found');
        }
        electron_log_1.default.info(`Stream ${streamId} ${muted ? 'muted' : 'unmuted'}`);
        this.emit('audio:mute:changed', { streamId, muted });
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
     * Update settings
     */
    updateSettings(options) {
        Object.assign(this.options, options);
        // Restart active streams if sample rate or codec changed
        const activeStreams = this.getActiveStreams();
        activeStreams.forEach(async (stream) => {
            if (stream.sourceDeviceId === this.localDeviceId) {
                // Stop and restart
                const interval = this.streamIntervals.get(stream.id);
                if (interval) {
                    clearInterval(interval);
                }
                this.startAudioCapture(stream);
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
            await this.stopAudioStream(stream.id);
        }
        electron_log_1.default.info('Audio routing service cleaned up');
    }
}
exports.AudioRoutingService = AudioRoutingService;
// Export singleton instance
exports.audioRoutingService = new AudioRoutingService();
//# sourceMappingURL=audio-routing.js.map