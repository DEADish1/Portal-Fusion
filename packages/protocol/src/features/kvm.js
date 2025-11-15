"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.kvmService = exports.KVMService = void 0;
const shared_1 = require("@portal-fusion/shared");
const shared_2 = require("@portal-fusion/shared");
const shared_3 = require("@portal-fusion/shared");
const connection_1 = require("../connection");
const electron_log_1 = __importDefault(require("electron-log"));
/**
 * Universal Keyboard/Mouse (KVM) Service
 * Enables remote control of one device from another
 */
class KVMService extends shared_1.TypedEventEmitter {
    constructor(options = {}) {
        super();
        this.activeSessions = new Map();
        this.isControlling = false;
        this.isControlled = false;
        this.options = {
            enabled: options.enabled !== false,
            allowKeyboard: options.allowKeyboard !== false,
            allowMouse: options.allowMouse !== false,
            allowTouch: options.allowTouch !== false,
            mouseSensitivity: options.mouseSensitivity || 1.0,
            keyboardDelay: options.keyboardDelay || 0,
            confirmOnEnable: options.confirmOnEnable !== false,
        };
    }
    /**
     * Initialize service
     */
    initialize(localDeviceId) {
        this.localDeviceId = localDeviceId;
        electron_log_1.default.info('KVM service initialized');
    }
    /**
     * Start controlling remote device
     */
    async startControl(targetDeviceId) {
        if (!this.options.enabled || !this.localDeviceId) {
            throw new Error('KVM service not enabled or initialized');
        }
        if (this.isControlling) {
            throw new Error('Already controlling another device');
        }
        // Create session
        const session = {
            id: `kvm-${Date.now()}`,
            controllerDeviceId: this.localDeviceId,
            controlledDeviceId: targetDeviceId,
            startedAt: new Date(),
            active: true,
            permissions: {
                keyboard: this.options.allowKeyboard,
                mouse: this.options.allowMouse,
                touch: this.options.allowTouch,
            },
        };
        this.activeSessions.set(session.id, session);
        this.currentSession = session;
        this.isControlling = true;
        // Send control request
        const message = (0, shared_3.createMessage)(shared_2.MessageType.SCREEN_CONTROL, {
            action: 'start',
            sessionId: session.id,
            permissions: session.permissions,
        }, {
            from: this.localDeviceId,
            to: targetDeviceId,
        });
        await connection_1.connectionManager.sendMessage(targetDeviceId, message);
        electron_log_1.default.info(`Started controlling device: ${targetDeviceId}`);
        this.emit('kvm:control:started', session);
        return session;
    }
    /**
     * Stop controlling remote device
     */
    async stopControl() {
        if (!this.currentSession || !this.localDeviceId) {
            return;
        }
        // Send stop control message
        const message = (0, shared_3.createMessage)(shared_2.MessageType.SCREEN_CONTROL, {
            action: 'stop',
            sessionId: this.currentSession.id,
        }, {
            from: this.localDeviceId,
            to: this.currentSession.controlledDeviceId,
        });
        await connection_1.connectionManager.sendMessage(this.currentSession.controlledDeviceId, message);
        this.currentSession.active = false;
        this.isControlling = false;
        this.currentSession = undefined;
        electron_log_1.default.info('Stopped controlling device');
        this.emit('kvm:control:stopped', {});
    }
    /**
     * Handle control request
     */
    async handleControlRequest(message) {
        const { action, sessionId, permissions } = message.payload;
        if (action === 'start') {
            if (this.isControlled) {
                // Reject - already being controlled
                return;
            }
            const session = {
                id: sessionId,
                controllerDeviceId: message.from,
                controlledDeviceId: this.localDeviceId,
                startedAt: new Date(),
                active: true,
                permissions: permissions || {
                    keyboard: true,
                    mouse: true,
                    touch: true,
                },
            };
            this.activeSessions.set(sessionId, session);
            this.currentSession = session;
            this.isControlled = true;
            electron_log_1.default.info(`Being controlled by device: ${message.from}`);
            this.emit('kvm:being-controlled', session);
        }
        else if (action === 'stop') {
            this.isControlled = false;
            this.currentSession = undefined;
            this.activeSessions.delete(sessionId);
            electron_log_1.default.info('Control session ended');
            this.emit('kvm:control-ended', {});
        }
    }
    /**
     * Send keyboard event to controlled device
     */
    async sendKeyboardEvent(event) {
        if (!this.isControlling || !this.currentSession || !this.localDeviceId) {
            return;
        }
        if (!this.currentSession.permissions.keyboard) {
            return;
        }
        const message = (0, shared_3.createMessage)(shared_2.MessageType.KEYBOARD_EVENT, event, {
            from: this.localDeviceId,
            to: this.currentSession.controlledDeviceId,
        });
        await connection_1.connectionManager.sendMessage(this.currentSession.controlledDeviceId, message);
    }
    /**
     * Send mouse event to controlled device
     */
    async sendMouseEvent(event) {
        if (!this.isControlling || !this.currentSession || !this.localDeviceId) {
            return;
        }
        if (!this.currentSession.permissions.mouse) {
            return;
        }
        // Apply sensitivity
        const adjustedEvent = {
            ...event,
            x: event.x * this.options.mouseSensitivity,
            y: event.y * this.options.mouseSensitivity,
        };
        const message = (0, shared_3.createMessage)(shared_2.MessageType.MOUSE_EVENT, adjustedEvent, {
            from: this.localDeviceId,
            to: this.currentSession.controlledDeviceId,
        });
        await connection_1.connectionManager.sendMessage(this.currentSession.controlledDeviceId, message);
    }
    /**
     * Send touch event to controlled device
     */
    async sendTouchEvent(event) {
        if (!this.isControlling || !this.currentSession || !this.localDeviceId) {
            return;
        }
        if (!this.currentSession.permissions.touch) {
            return;
        }
        const message = (0, shared_3.createMessage)(shared_2.MessageType.TOUCH_EVENT, event, {
            from: this.localDeviceId,
            to: this.currentSession.controlledDeviceId,
        });
        await connection_1.connectionManager.sendMessage(this.currentSession.controlledDeviceId, message);
    }
    /**
     * Handle received keyboard event (inject to local system)
     */
    handleKeyboardEvent(event) {
        if (!this.isControlled || !this.currentSession?.permissions.keyboard) {
            return;
        }
        electron_log_1.default.debug(`Keyboard event: ${event.key}`);
        this.emit('kvm:keyboard-event', event);
    }
    /**
     * Handle received mouse event (inject to local system)
     */
    handleMouseEvent(event) {
        if (!this.isControlled || !this.currentSession?.permissions.mouse) {
            return;
        }
        electron_log_1.default.debug(`Mouse event: ${event.type} at (${event.x}, ${event.y})`);
        this.emit('kvm:mouse-event', event);
    }
    /**
     * Handle received touch event (inject to local system)
     */
    handleTouchEvent(event) {
        if (!this.isControlled || !this.currentSession?.permissions.touch) {
            return;
        }
        electron_log_1.default.debug(`Touch event: ${event.type} with ${event.touches.length} touches`);
        this.emit('kvm:touch-event', event);
    }
    /**
     * Check if currently controlling
     */
    isActivelyControlling() {
        return this.isControlling && this.currentSession?.active === true;
    }
    /**
     * Check if being controlled
     */
    isBeingControlled() {
        return this.isControlled && this.currentSession?.active === true;
    }
    /**
     * Get current session
     */
    getCurrentSession() {
        return this.currentSession;
    }
    /**
     * Get all sessions
     */
    getSessions() {
        return Array.from(this.activeSessions.values());
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
}
exports.KVMService = KVMService;
// Export singleton instance
exports.kvmService = new KVMService();
//# sourceMappingURL=kvm.js.map