"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.secondScreenService = exports.SecondScreenService = void 0;
const shared_1 = require("@portal-fusion/shared");
const shared_2 = require("@portal-fusion/shared");
const shared_3 = require("@portal-fusion/shared");
const connection_1 = require("../connection");
const electron_log_1 = __importDefault(require("electron-log"));
/**
 * Second Screen Service
 * Use a remote device as an extended display
 */
class SecondScreenService extends shared_1.TypedEventEmitter {
    constructor(options = {}) {
        super();
        this.activeSessions = new Map();
        this.isHosting = false;
        this.isClient = false;
        this.options = {
            enabled: options.enabled !== false,
            quality: options.quality || 70,
            frameRate: options.frameRate || 30,
            autoResize: options.autoResize !== false,
            enableAudio: options.enableAudio || false,
        };
    }
    /**
     * Initialize service
     */
    initialize(localDeviceId) {
        this.localDeviceId = localDeviceId;
        electron_log_1.default.info('Second screen service initialized');
    }
    /**
     * Start hosting second screen (share screen to remote device)
     */
    async startHosting(targetDeviceId, config) {
        if (!this.options.enabled || !this.localDeviceId) {
            throw new Error('Second screen service not enabled or initialized');
        }
        if (this.isHosting) {
            throw new Error('Already hosting a second screen');
        }
        // Create session
        const session = {
            id: `screen-${Date.now()}`,
            hostDeviceId: this.localDeviceId,
            clientDeviceId: targetDeviceId,
            config,
            startedAt: new Date(),
            active: true,
            stats: {
                framesSent: 0,
                framesReceived: 0,
                bytesTransferred: 0,
                averageLatency: 0,
            },
        };
        this.activeSessions.set(session.id, session);
        this.currentSession = session;
        this.isHosting = true;
        // Send screen session start request
        const message = (0, shared_3.createMessage)(shared_2.MessageType.SCREEN_CONTROL, {
            action: 'screen-start',
            sessionId: session.id,
            config,
        }, {
            from: this.localDeviceId,
            to: targetDeviceId,
        });
        await connection_1.connectionManager.sendMessage(targetDeviceId, message);
        electron_log_1.default.info(`Started hosting second screen for device: ${targetDeviceId}`);
        this.emit('screen:hosting:started', session);
        // Start streaming
        this.startScreenStream(session);
        return session;
    }
    /**
     * Stop hosting second screen
     */
    async stopHosting() {
        if (!this.currentSession || !this.localDeviceId) {
            return;
        }
        // Stop streaming
        if (this.streamInterval) {
            clearInterval(this.streamInterval);
            this.streamInterval = undefined;
        }
        // Send stop message
        const message = (0, shared_3.createMessage)(shared_2.MessageType.SCREEN_CONTROL, {
            action: 'screen-stop',
            sessionId: this.currentSession.id,
        }, {
            from: this.localDeviceId,
            to: this.currentSession.clientDeviceId,
        });
        await connection_1.connectionManager.sendMessage(this.currentSession.clientDeviceId, message);
        this.currentSession.active = false;
        this.isHosting = false;
        this.currentSession = undefined;
        electron_log_1.default.info('Stopped hosting second screen');
        this.emit('screen:hosting:stopped', {});
    }
    /**
     * Handle screen session request (become a second screen)
     */
    async handleScreenRequest(message) {
        const { action, sessionId, config } = message.payload;
        if (action === 'screen-start') {
            if (this.isClient) {
                // Reject - already acting as second screen
                return;
            }
            const session = {
                id: sessionId,
                hostDeviceId: message.from,
                clientDeviceId: this.localDeviceId,
                config: config || {
                    width: 1920,
                    height: 1080,
                    scaleFactor: 1,
                    position: { x: 0, y: 0 },
                },
                startedAt: new Date(),
                active: true,
                stats: {
                    framesSent: 0,
                    framesReceived: 0,
                    bytesTransferred: 0,
                    averageLatency: 0,
                },
            };
            this.activeSessions.set(sessionId, session);
            this.currentSession = session;
            this.isClient = true;
            electron_log_1.default.info(`Acting as second screen for device: ${message.from}`);
            this.emit('screen:client:started', session);
        }
        else if (action === 'screen-stop') {
            this.isClient = false;
            this.currentSession = undefined;
            this.activeSessions.delete(sessionId);
            electron_log_1.default.info('Second screen session ended');
            this.emit('screen:client:stopped', {});
        }
    }
    /**
     * Start streaming screen frames
     */
    startScreenStream(session) {
        const frameInterval = 1000 / this.options.frameRate;
        this.streamInterval = setInterval(async () => {
            try {
                await this.captureAndSendFrame(session);
            }
            catch (error) {
                electron_log_1.default.error('Failed to capture/send frame:', error);
            }
        }, frameInterval);
    }
    /**
     * Capture and send screen frame (to be implemented via native bridge)
     */
    async captureAndSendFrame(session) {
        if (!this.localDeviceId || !session.active) {
            return;
        }
        // This will be implemented via native bridge (desktopCapturer)
        // For now, this is a placeholder
        const frameData = Buffer.from(''); // Placeholder
        const message = (0, shared_3.createMessage)(shared_2.MessageType.SCREEN_FRAME, {
            sessionId: session.id,
            frame: frameData.toString('base64'),
            timestamp: Date.now(),
            config: session.config,
        }, {
            from: this.localDeviceId,
            to: session.clientDeviceId,
            compressed: true,
        });
        await connection_1.connectionManager.sendMessage(session.clientDeviceId, message);
        session.stats.framesSent++;
        session.stats.bytesTransferred += frameData.length;
    }
    /**
     * Handle received screen frame
     */
    handleScreenFrame(message) {
        if (!this.isClient || !this.currentSession) {
            return;
        }
        const { frame, timestamp, config } = message.payload;
        // Calculate latency
        const latency = Date.now() - timestamp;
        this.currentSession.stats.averageLatency =
            (this.currentSession.stats.averageLatency * this.currentSession.stats.framesReceived + latency) /
                (this.currentSession.stats.framesReceived + 1);
        this.currentSession.stats.framesReceived++;
        // Emit frame for rendering
        this.emit('screen:frame:received', {
            frame: Buffer.from(frame, 'base64'),
            config,
            latency,
        });
    }
    /**
     * Update screen configuration
     */
    async updateScreenConfig(config) {
        if (!this.currentSession || !this.localDeviceId) {
            return;
        }
        Object.assign(this.currentSession.config, config);
        const targetDeviceId = this.isHosting
            ? this.currentSession.clientDeviceId
            : this.currentSession.hostDeviceId;
        const message = (0, shared_3.createMessage)(shared_2.MessageType.SCREEN_CONTROL, {
            action: 'screen-config-update',
            sessionId: this.currentSession.id,
            config: this.currentSession.config,
        }, {
            from: this.localDeviceId,
            to: targetDeviceId,
        });
        await connection_1.connectionManager.sendMessage(targetDeviceId, message);
        electron_log_1.default.info('Screen configuration updated');
        this.emit('screen:config:updated', this.currentSession.config);
    }
    /**
     * Handle screen configuration update
     */
    handleConfigUpdate(message) {
        if (!this.currentSession) {
            return;
        }
        const { config } = message.payload;
        Object.assign(this.currentSession.config, config);
        electron_log_1.default.info('Screen configuration updated from remote');
        this.emit('screen:config:updated', this.currentSession.config);
    }
    /**
     * Check if currently hosting
     */
    isActivelyHosting() {
        return this.isHosting && this.currentSession?.active === true;
    }
    /**
     * Check if acting as second screen
     */
    isActiveClient() {
        return this.isClient && this.currentSession?.active === true;
    }
    /**
     * Get current session
     */
    getCurrentSession() {
        return this.currentSession;
    }
    /**
     * Get session stats
     */
    getSessionStats() {
        return this.currentSession?.stats;
    }
    /**
     * Update settings
     */
    updateSettings(options) {
        Object.assign(this.options, options);
        // Restart stream if quality/framerate changed
        if (this.isHosting && this.currentSession && this.streamInterval) {
            if (this.streamInterval) {
                clearInterval(this.streamInterval);
            }
            this.startScreenStream(this.currentSession);
        }
    }
    /**
     * Get current settings
     */
    getSettings() {
        return { ...this.options };
    }
}
exports.SecondScreenService = SecondScreenService;
// Export singleton instance
exports.secondScreenService = new SecondScreenService();
//# sourceMappingURL=second-screen.js.map