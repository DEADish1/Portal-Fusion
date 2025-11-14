import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import { Message, MessageType } from '@portal-fusion/shared';
import { createMessage } from '@portal-fusion/shared';
import { connectionManager } from '../connection';
import log from 'electron-log';

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
export class SecondScreenService extends TypedEventEmitter<PortalFusionEvents> {
  private options: Required<SecondScreenOptions>;
  private localDeviceId?: string;
  private activeSessions: Map<string, SecondScreenSession> = new Map();
  private isHosting = false;
  private isClient = false;
  private currentSession?: SecondScreenSession;
  private streamInterval?: NodeJS.Timeout;

  constructor(options: SecondScreenOptions = {}) {
    super();

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
  initialize(localDeviceId: string): void {
    this.localDeviceId = localDeviceId;
    log.info('Second screen service initialized');
  }

  /**
   * Start hosting second screen (share screen to remote device)
   */
  async startHosting(
    targetDeviceId: string,
    config: SecondScreenConfig
  ): Promise<SecondScreenSession> {
    if (!this.options.enabled || !this.localDeviceId) {
      throw new Error('Second screen service not enabled or initialized');
    }

    if (this.isHosting) {
      throw new Error('Already hosting a second screen');
    }

    // Create session
    const session: SecondScreenSession = {
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
    const message = createMessage(
      MessageType.SCREEN_CONTROL,
      {
        action: 'screen-start',
        sessionId: session.id,
        config,
      },
      {
        from: this.localDeviceId,
        to: targetDeviceId,
      }
    );

    await connectionManager.sendMessage(targetDeviceId, message);

    log.info(`Started hosting second screen for device: ${targetDeviceId}`);
    this.emit('screen:hosting:started', session);

    // Start streaming
    this.startScreenStream(session);

    return session;
  }

  /**
   * Stop hosting second screen
   */
  async stopHosting(): Promise<void> {
    if (!this.currentSession || !this.localDeviceId) {
      return;
    }

    // Stop streaming
    if (this.streamInterval) {
      clearInterval(this.streamInterval);
      this.streamInterval = undefined;
    }

    // Send stop message
    const message = createMessage(
      MessageType.SCREEN_CONTROL,
      {
        action: 'screen-stop',
        sessionId: this.currentSession.id,
      },
      {
        from: this.localDeviceId,
        to: this.currentSession.clientDeviceId,
      }
    );

    await connectionManager.sendMessage(this.currentSession.clientDeviceId, message);

    this.currentSession.active = false;
    this.isHosting = false;
    this.currentSession = undefined;

    log.info('Stopped hosting second screen');
    this.emit('screen:hosting:stopped', {});
  }

  /**
   * Handle screen session request (become a second screen)
   */
  async handleScreenRequest(message: Message): Promise<void> {
    const { action, sessionId, config } = message.payload;

    if (action === 'screen-start') {
      if (this.isClient) {
        // Reject - already acting as second screen
        return;
      }

      const session: SecondScreenSession = {
        id: sessionId,
        hostDeviceId: message.from,
        clientDeviceId: this.localDeviceId!,
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

      log.info(`Acting as second screen for device: ${message.from}`);
      this.emit('screen:client:started', session);
    } else if (action === 'screen-stop') {
      this.isClient = false;
      this.currentSession = undefined;
      this.activeSessions.delete(sessionId);

      log.info('Second screen session ended');
      this.emit('screen:client:stopped', {});
    }
  }

  /**
   * Start streaming screen frames
   */
  private startScreenStream(session: SecondScreenSession): void {
    const frameInterval = 1000 / this.options.frameRate;

    this.streamInterval = setInterval(async () => {
      try {
        await this.captureAndSendFrame(session);
      } catch (error) {
        log.error('Failed to capture/send frame:', error);
      }
    }, frameInterval);
  }

  /**
   * Capture and send screen frame (to be implemented via native bridge)
   */
  private async captureAndSendFrame(session: SecondScreenSession): Promise<void> {
    if (!this.localDeviceId || !session.active) {
      return;
    }

    // This will be implemented via native bridge (desktopCapturer)
    // For now, this is a placeholder
    const frameData = Buffer.from(''); // Placeholder

    const message = createMessage(
      MessageType.SCREEN_FRAME,
      {
        sessionId: session.id,
        frame: frameData.toString('base64'),
        timestamp: Date.now(),
        config: session.config,
      },
      {
        from: this.localDeviceId,
        to: session.clientDeviceId,
        compressed: true,
      }
    );

    await connectionManager.sendMessage(session.clientDeviceId, message);

    session.stats.framesSent++;
    session.stats.bytesTransferred += frameData.length;
  }

  /**
   * Handle received screen frame
   */
  handleScreenFrame(message: Message): void {
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
  async updateScreenConfig(config: Partial<SecondScreenConfig>): Promise<void> {
    if (!this.currentSession || !this.localDeviceId) {
      return;
    }

    Object.assign(this.currentSession.config, config);

    const targetDeviceId = this.isHosting
      ? this.currentSession.clientDeviceId
      : this.currentSession.hostDeviceId;

    const message = createMessage(
      MessageType.SCREEN_CONTROL,
      {
        action: 'screen-config-update',
        sessionId: this.currentSession.id,
        config: this.currentSession.config,
      },
      {
        from: this.localDeviceId,
        to: targetDeviceId,
      }
    );

    await connectionManager.sendMessage(targetDeviceId, message);

    log.info('Screen configuration updated');
    this.emit('screen:config:updated', this.currentSession.config);
  }

  /**
   * Handle screen configuration update
   */
  handleConfigUpdate(message: Message): void {
    if (!this.currentSession) {
      return;
    }

    const { config } = message.payload;
    Object.assign(this.currentSession.config, config);

    log.info('Screen configuration updated from remote');
    this.emit('screen:config:updated', this.currentSession.config);
  }

  /**
   * Check if currently hosting
   */
  isActivelyHosting(): boolean {
    return this.isHosting && this.currentSession?.active === true;
  }

  /**
   * Check if acting as second screen
   */
  isActiveClient(): boolean {
    return this.isClient && this.currentSession?.active === true;
  }

  /**
   * Get current session
   */
  getCurrentSession(): SecondScreenSession | undefined {
    return this.currentSession;
  }

  /**
   * Get session stats
   */
  getSessionStats(): SecondScreenSession['stats'] | undefined {
    return this.currentSession?.stats;
  }

  /**
   * Update settings
   */
  updateSettings(options: Partial<SecondScreenOptions>): void {
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
  getSettings(): Required<SecondScreenOptions> {
    return { ...this.options };
  }
}

// Export singleton instance
export const secondScreenService = new SecondScreenService();
