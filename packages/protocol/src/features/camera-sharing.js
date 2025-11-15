"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cameraSharingService = exports.CameraSharingService = void 0;
const shared_1 = require("@portal-fusion/shared");
const shared_2 = require("@portal-fusion/shared");
const shared_3 = require("@portal-fusion/shared");
const connection_1 = require("../connection");
const electron_log_1 = __importDefault(require("electron-log"));
/**
 * Camera Sharing Service
 * Share camera feeds between devices
 */
class CameraSharingService extends shared_1.TypedEventEmitter {
    constructor(options = {}) {
        super();
        this.availableCameras = new Map();
        this.activeStreams = new Map();
        this.streamIntervals = new Map();
        // Resolution presets
        this.RESOLUTIONS = {
            low: { width: 640, height: 480 },
            medium: { width: 1280, height: 720 },
            high: { width: 1920, height: 1080 },
            ultra: { width: 3840, height: 2160 },
        };
        this.options = {
            enabled: options.enabled !== false,
            resolution: options.resolution || 'medium',
            frameRate: options.frameRate || 30,
            codec: options.codec || 'h264',
            enableAudio: options.enableAudio || false,
            mirrorVideo: options.mirrorVideo || false,
        };
    }
    /**
     * Initialize service
     */
    async initialize(localDeviceId) {
        this.localDeviceId = localDeviceId;
        // Enumerate cameras (to be implemented via native bridge)
        await this.enumerateCameras();
        electron_log_1.default.info('Camera sharing service initialized');
    }
    /**
     * Enumerate available cameras (to be implemented via native bridge)
     */
    async enumerateCameras() {
        // This will be implemented via native bridge (navigator.mediaDevices.enumerateDevices)
        // For now, add placeholder cameras
        electron_log_1.default.info('Enumerating cameras...');
    }
    /**
     * Get available cameras
     */
    getAvailableCameras() {
        return Array.from(this.availableCameras.values());
    }
    /**
     * Start sharing camera
     */
    async startCameraShare(targetDeviceId, cameraId) {
        if (!this.options.enabled || !this.localDeviceId) {
            throw new Error('Camera sharing service not enabled or initialized');
        }
        const camera = this.availableCameras.get(cameraId);
        if (!camera) {
            throw new Error('Camera not found');
        }
        const resolution = this.RESOLUTIONS[this.options.resolution];
        const stream = {
            id: `camera-${Date.now()}`,
            sourceDeviceId: this.localDeviceId,
            targetDeviceId,
            cameraId,
            config: {
                resolution,
                frameRate: this.options.frameRate,
                codec: this.options.codec,
                enableAudio: this.options.enableAudio,
                mirrorVideo: this.options.mirrorVideo,
            },
            startedAt: new Date(),
            active: true,
            stats: {
                framesSent: 0,
                framesReceived: 0,
                bytesTransferred: 0,
                droppedFrames: 0,
                averageLatency: 0,
            },
        };
        this.activeStreams.set(stream.id, stream);
        // Send stream start request
        const message = (0, shared_3.createMessage)(shared_2.MessageType.VIDEO_STREAM_START, {
            action: 'start',
            streamId: stream.id,
            cameraId,
            config: stream.config,
        }, {
            from: this.localDeviceId,
            to: targetDeviceId,
        });
        await connection_1.connectionManager.sendMessage(targetDeviceId, message);
        electron_log_1.default.info(`Started camera share: ${camera.name} -> ${targetDeviceId}`);
        this.emit('camera:share:started', stream);
        // Start capturing and sending frames
        await this.startCameraCapture(stream);
        return stream;
    }
    /**
     * Stop camera share
     */
    async stopCameraShare(streamId) {
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
        const message = (0, shared_3.createMessage)(shared_2.MessageType.VIDEO_STREAM_START, {
            action: 'stop',
            streamId,
        }, {
            from: this.localDeviceId,
            to: stream.targetDeviceId,
        });
        await connection_1.connectionManager.sendMessage(stream.targetDeviceId, message);
        stream.active = false;
        this.activeStreams.delete(streamId);
        electron_log_1.default.info(`Stopped camera share: ${streamId}`);
        this.emit('camera:share:stopped', { streamId });
    }
    /**
     * Handle stream request
     */
    async handleStreamRequest(message) {
        const { action, streamId, cameraId, config } = message.payload;
        if (action === 'start') {
            const stream = {
                id: streamId,
                sourceDeviceId: message.from,
                targetDeviceId: this.localDeviceId,
                cameraId,
                config: config || {
                    resolution: this.RESOLUTIONS[this.options.resolution],
                    frameRate: this.options.frameRate,
                    codec: this.options.codec,
                    enableAudio: this.options.enableAudio,
                    mirrorVideo: this.options.mirrorVideo,
                },
                startedAt: new Date(),
                active: true,
                stats: {
                    framesSent: 0,
                    framesReceived: 0,
                    bytesTransferred: 0,
                    droppedFrames: 0,
                    averageLatency: 0,
                },
            };
            this.activeStreams.set(streamId, stream);
            electron_log_1.default.info(`Receiving camera stream from: ${message.from}`);
            this.emit('camera:stream:receiving', stream);
        }
        else if (action === 'stop') {
            this.activeStreams.delete(streamId);
            electron_log_1.default.info(`Camera stream ended: ${streamId}`);
            this.emit('camera:stream:ended', { streamId });
        }
    }
    /**
     * Start camera capture (to be implemented via native bridge)
     */
    async startCameraCapture(stream) {
        // This will be implemented via native bridge (getUserMedia, desktopCapturer)
        const frameInterval = 1000 / stream.config.frameRate;
        const interval = setInterval(async () => {
            try {
                await this.captureAndSendFrame(stream);
            }
            catch (error) {
                electron_log_1.default.error('Failed to capture/send frame:', error);
                stream.stats.droppedFrames++;
            }
        }, frameInterval);
        this.streamIntervals.set(stream.id, interval);
    }
    /**
     * Capture and send video frame (to be implemented via native bridge)
     */
    async captureAndSendFrame(stream) {
        if (!this.localDeviceId || !stream.active) {
            return;
        }
        // This will be implemented via native bridge
        const frameData = Buffer.from(''); // Placeholder
        const message = (0, shared_3.createMessage)(shared_2.MessageType.SCREEN_FRAME, {
            streamId: stream.id,
            frame: frameData.toString('base64'),
            timestamp: Date.now(),
            sequence: stream.stats.framesSent,
        }, {
            from: this.localDeviceId,
            to: stream.targetDeviceId,
            compressed: true,
        });
        await connection_1.connectionManager.sendMessage(stream.targetDeviceId, message);
        stream.stats.framesSent++;
        stream.stats.bytesTransferred += frameData.length;
    }
    /**
     * Handle received video frame
     */
    handleVideoFrame(message) {
        const { streamId, frame, timestamp, sequence } = message.payload;
        const stream = Array.from(this.activeStreams.values()).find((s) => s.id === streamId && s.sourceDeviceId === message.from);
        if (!stream) {
            return;
        }
        // Calculate latency
        const latency = Date.now() - timestamp;
        stream.stats.averageLatency =
            (stream.stats.averageLatency * stream.stats.framesReceived + latency) /
                (stream.stats.framesReceived + 1);
        stream.stats.framesReceived++;
        // Emit frame for rendering
        this.emit('camera:frame:received', {
            streamId,
            frame: Buffer.from(frame, 'base64'),
            sequence,
            latency,
        });
    }
    /**
     * Update stream configuration
     */
    async updateStreamConfig(streamId, config) {
        const stream = this.activeStreams.get(streamId);
        if (!stream || !this.localDeviceId) {
            throw new Error('Stream not found');
        }
        Object.assign(stream.config, config);
        // Notify remote device
        const message = (0, shared_3.createMessage)(shared_2.MessageType.VIDEO_STREAM_START, {
            action: 'config-update',
            streamId,
            config: stream.config,
        }, {
            from: this.localDeviceId,
            to: stream.targetDeviceId,
        });
        await connection_1.connectionManager.sendMessage(stream.targetDeviceId, message);
        // Restart capture if resolution or frame rate changed
        if (config.resolution || config.frameRate) {
            const interval = this.streamIntervals.get(streamId);
            if (interval) {
                clearInterval(interval);
            }
            await this.startCameraCapture(stream);
        }
        electron_log_1.default.info(`Updated stream configuration: ${streamId}`);
        this.emit('camera:config:updated', { streamId, config: stream.config });
    }
    /**
     * Take snapshot from stream
     */
    async takeSnapshot(streamId) {
        const stream = this.activeStreams.get(streamId);
        if (!stream) {
            throw new Error('Stream not found');
        }
        // This will be implemented via native bridge
        const snapshot = Buffer.from(''); // Placeholder
        electron_log_1.default.info(`Snapshot taken from stream: ${streamId}`);
        this.emit('camera:snapshot:taken', { streamId, snapshot });
        return snapshot;
    }
    /**
     * Control camera settings (zoom, flash, focus, etc.)
     */
    async controlCamera(streamId, control) {
        const stream = this.activeStreams.get(streamId);
        if (!stream || !this.localDeviceId) {
            throw new Error('Stream not found');
        }
        // Send control command
        const message = (0, shared_3.createMessage)(shared_2.MessageType.VIDEO_STREAM_START, {
            action: 'camera-control',
            streamId,
            control,
        }, {
            from: this.localDeviceId,
            to: stream.sourceDeviceId,
        });
        await connection_1.connectionManager.sendMessage(stream.sourceDeviceId, message);
        electron_log_1.default.info(`Camera control command sent: ${streamId}`);
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
            await this.stopCameraShare(stream.id);
        }
        electron_log_1.default.info('Camera sharing service cleaned up');
    }
}
exports.CameraSharingService = CameraSharingService;
// Export singleton instance
exports.cameraSharingService = new CameraSharingService();
//# sourceMappingURL=camera-sharing.js.map