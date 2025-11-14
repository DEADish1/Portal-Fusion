import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import {
  Message,
  MessageType,
  KeyboardEvent as KBEvent,
  MouseEvent as MSEvent,
  TouchEvent as TCEvent,
} from '@portal-fusion/shared';
import { createMessage } from '@portal-fusion/shared';
import { connectionManager } from '../connection';
import log from 'electron-log';

export interface KVMOptions {
  enabled?: boolean;
  allowKeyboard?: boolean;
  allowMouse?: boolean;
  allowTouch?: boolean;
  mouseSensitivity?: number;
  keyboardDelay?: number;
  confirmOnEnable?: boolean;
}

export interface KVMSession {
  id: string;
  controllerDeviceId: string;
  controlledDeviceId: string;
  startedAt: Date;
  active: boolean;
  permissions: {
    keyboard: boolean;
    mouse: boolean;
    touch: boolean;
  };
}

/**
 * Universal Keyboard/Mouse (KVM) Service
 * Enables remote control of one device from another
 */
export class KVMService extends TypedEventEmitter<PortalFusionEvents> {
  private options: Required<KVMOptions>;
  private localDeviceId?: string;
  private activeSessions: Map<string, KVMSession> = new Map();
  private isControlling = false;
  private isControlled = false;
  private currentSession?: KVMSession;

  constructor(options: KVMOptions = {}) {
    super();

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
  initialize(localDeviceId: string): void {
    this.localDeviceId = localDeviceId;
    log.info('KVM service initialized');
  }

  /**
   * Start controlling remote device
   */
  async startControl(targetDeviceId: string): Promise<KVMSession> {
    if (!this.options.enabled || !this.localDeviceId) {
      throw new Error('KVM service not enabled or initialized');
    }

    if (this.isControlling) {
      throw new Error('Already controlling another device');
    }

    // Create session
    const session: KVMSession = {
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
    const message = createMessage(
      MessageType.SCREEN_CONTROL,
      {
        action: 'start',
        sessionId: session.id,
        permissions: session.permissions,
      },
      {
        from: this.localDeviceId,
        to: targetDeviceId,
      }
    );

    await connectionManager.sendMessage(targetDeviceId, message);

    log.info(`Started controlling device: ${targetDeviceId}`);
    this.emit('kvm:control:started', session);

    return session;
  }

  /**
   * Stop controlling remote device
   */
  async stopControl(): Promise<void> {
    if (!this.currentSession || !this.localDeviceId) {
      return;
    }

    // Send stop control message
    const message = createMessage(
      MessageType.SCREEN_CONTROL,
      {
        action: 'stop',
        sessionId: this.currentSession.id,
      },
      {
        from: this.localDeviceId,
        to: this.currentSession.controlledDeviceId,
      }
    );

    await connectionManager.sendMessage(this.currentSession.controlledDeviceId, message);

    this.currentSession.active = false;
    this.isControlling = false;
    this.currentSession = undefined;

    log.info('Stopped controlling device');
    this.emit('kvm:control:stopped', {});
  }

  /**
   * Handle control request
   */
  async handleControlRequest(message: Message): Promise<void> {
    const { action, sessionId, permissions } = message.payload;

    if (action === 'start') {
      if (this.isControlled) {
        // Reject - already being controlled
        return;
      }

      const session: KVMSession = {
        id: sessionId,
        controllerDeviceId: message.from,
        controlledDeviceId: this.localDeviceId!,
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

      log.info(`Being controlled by device: ${message.from}`);
      this.emit('kvm:being-controlled', session);
    } else if (action === 'stop') {
      this.isControlled = false;
      this.currentSession = undefined;
      this.activeSessions.delete(sessionId);

      log.info('Control session ended');
      this.emit('kvm:control-ended', {});
    }
  }

  /**
   * Send keyboard event to controlled device
   */
  async sendKeyboardEvent(event: KBEvent): Promise<void> {
    if (!this.isControlling || !this.currentSession || !this.localDeviceId) {
      return;
    }

    if (!this.currentSession.permissions.keyboard) {
      return;
    }

    const message = createMessage(
      MessageType.KEYBOARD_EVENT,
      event,
      {
        from: this.localDeviceId,
        to: this.currentSession.controlledDeviceId,
      }
    );

    await connectionManager.sendMessage(this.currentSession.controlledDeviceId, message);
  }

  /**
   * Send mouse event to controlled device
   */
  async sendMouseEvent(event: MSEvent): Promise<void> {
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

    const message = createMessage(
      MessageType.MOUSE_EVENT,
      adjustedEvent,
      {
        from: this.localDeviceId,
        to: this.currentSession.controlledDeviceId,
      }
    );

    await connectionManager.sendMessage(this.currentSession.controlledDeviceId, message);
  }

  /**
   * Send touch event to controlled device
   */
  async sendTouchEvent(event: TCEvent): Promise<void> {
    if (!this.isControlling || !this.currentSession || !this.localDeviceId) {
      return;
    }

    if (!this.currentSession.permissions.touch) {
      return;
    }

    const message = createMessage(
      MessageType.TOUCH_EVENT,
      event,
      {
        from: this.localDeviceId,
        to: this.currentSession.controlledDeviceId,
      }
    );

    await connectionManager.sendMessage(this.currentSession.controlledDeviceId, message);
  }

  /**
   * Handle received keyboard event (inject to local system)
   */
  handleKeyboardEvent(event: KBEvent): void {
    if (!this.isControlled || !this.currentSession?.permissions.keyboard) {
      return;
    }

    log.debug(`Keyboard event: ${event.key}`);
    this.emit('kvm:keyboard-event', event);
  }

  /**
   * Handle received mouse event (inject to local system)
   */
  handleMouseEvent(event: MSEvent): void {
    if (!this.isControlled || !this.currentSession?.permissions.mouse) {
      return;
    }

    log.debug(`Mouse event: ${event.type} at (${event.x}, ${event.y})`);
    this.emit('kvm:mouse-event', event);
  }

  /**
   * Handle received touch event (inject to local system)
   */
  handleTouchEvent(event: TCEvent): void {
    if (!this.isControlled || !this.currentSession?.permissions.touch) {
      return;
    }

    log.debug(`Touch event: ${event.type} with ${event.touches.length} touches`);
    this.emit('kvm:touch-event', event);
  }

  /**
   * Check if currently controlling
   */
  isActivelyControlling(): boolean {
    return this.isControlling && this.currentSession?.active === true;
  }

  /**
   * Check if being controlled
   */
  isBeingControlled(): boolean {
    return this.isControlled && this.currentSession?.active === true;
  }

  /**
   * Get current session
   */
  getCurrentSession(): KVMSession | undefined {
    return this.currentSession;
  }

  /**
   * Get all sessions
   */
  getSessions(): KVMSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Update settings
   */
  updateSettings(options: Partial<KVMOptions>): void {
    Object.assign(this.options, options);
  }

  /**
   * Get current settings
   */
  getSettings(): Required<KVMOptions> {
    return { ...this.options };
  }
}

// Export singleton instance
export const kvmService = new KVMService();
