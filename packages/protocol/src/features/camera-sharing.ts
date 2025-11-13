import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import { Message, MessageType } from '@portal-fusion/shared';
import { createMessage } from '@portal-fusion/shared';
import { connectionManager } from '../connection';
import log from 'electron-log';

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
    resolutions: Array<{ width: number; height: number }>;
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
    resolution: { width: number; height: number };
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
export class CameraSharingService extends TypedEventEmitter<PortalFusionEvents> {
  private options: Required<CameraSharingOptions>;
  private localDeviceId?: string;
  private availableCameras: Map<string, CameraDevice> = new Map();
  private activeStreams: Map<string, CameraStream> = new Map();
  private streamIntervals: Map<string, NodeJS.Timeout> = new Map();

  // Resolution presets
  private readonly RESOLUTIONS = {
    low: { width: 640, height: 480 },
    medium: { width: 1280, height: 720 },
    high: { width: 1920, height: 1080 },
    ultra: { width: 3840, height: 2160 },
  };

  constructor(options: CameraSharingOptions = {}) {
    super();

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
  async initialize(localDeviceId: string): Promise<void> {
    this.localDeviceId = localDeviceId;

    // Enumerate cameras (to be implemented via native bridge)
    await this.enumerateCameras();

    log.info('Camera sharing service initialized');
  }

  /**
   * Enumerate available cameras (to be implemented via native bridge)
   */
  private async enumerateCameras(): Promise<void> {
    // This will be implemented via native bridge (navigator.mediaDevices.enumerateDevices)
    // For now, add placeholder cameras
    log.info('Enumerating cameras...');
  }

  /**
   * Get available cameras
   */
  getAvailableCameras(): CameraDevice[] {
    return Array.from(this.availableCameras.values());
  }

  /**
   * Start sharing camera
   */
  async startCameraShare(
    targetDeviceId: string,
    cameraId: string
  ): Promise<CameraStream> {
    if (!this.options.enabled || !this.localDeviceId) {
      throw new Error('Camera sharing service not enabled or initialized');
    }

    const camera = this.availableCameras.get(cameraId);
    if (!camera) {
      throw new Error('Camera not found');
    }

    const resolution = this.RESOLUTIONS[this.options.resolution];

    const stream: CameraStream = {
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
    const message = createMessage(
      MessageType.VIDEO_STREAM,
      {
        action: 'start',
        streamId: stream.id,
        cameraId,
        config: stream.config,
      },
      {
        from: this.localDeviceId,
        to: targetDeviceId,
      }
    );

    await connectionManager.sendMessage(targetDeviceId, message);

    log.info(`Started camera share: ${camera.name} -> ${targetDeviceId}`);
    this.emit('camera:share:started', stream);

    // Start capturing and sending frames
    await this.startCameraCapture(stream);

    return stream;
  }

  /**
   * Stop camera share
   */
  async stopCameraShare(streamId: string): Promise<void> {
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
    const message = createMessage(
      MessageType.VIDEO_STREAM,
      {
        action: 'stop',
        streamId,
      },
      {
        from: this.localDeviceId,
        to: stream.targetDeviceId,
      }
    );

    await connectionManager.sendMessage(stream.targetDeviceId, message);

    stream.active = false;
    this.activeStreams.delete(streamId);

    log.info(`Stopped camera share: ${streamId}`);
    this.emit('camera:share:stopped', { streamId });
  }

  /**
   * Handle stream request
   */
  async handleStreamRequest(message: Message): Promise<void> {
    const { action, streamId, cameraId, config } = message.payload;

    if (action === 'start') {
      const stream: CameraStream = {
        id: streamId,
        sourceDeviceId: message.from,
        targetDeviceId: this.localDeviceId!,
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

      log.info(`Receiving camera stream from: ${message.from}`);
      this.emit('camera:stream:receiving', stream);
    } else if (action === 'stop') {
      this.activeStreams.delete(streamId);
      log.info(`Camera stream ended: ${streamId}`);
      this.emit('camera:stream:ended', { streamId });
    }
  }

  /**
   * Start camera capture (to be implemented via native bridge)
   */
  private async startCameraCapture(stream: CameraStream): Promise<void> {
    // This will be implemented via native bridge (getUserMedia, desktopCapturer)
    const frameInterval = 1000 / stream.config.frameRate;

    const interval = setInterval(async () => {
      try {
        await this.captureAndSendFrame(stream);
      } catch (error) {
        log.error('Failed to capture/send frame:', error);
        stream.stats.droppedFrames++;
      }
    }, frameInterval);

    this.streamIntervals.set(stream.id, interval);
  }

  /**
   * Capture and send video frame (to be implemented via native bridge)
   */
  private async captureAndSendFrame(stream: CameraStream): Promise<void> {
    if (!this.localDeviceId || !stream.active) {
      return;
    }

    // This will be implemented via native bridge
    const frameData = Buffer.from(''); // Placeholder

    const message = createMessage(
      MessageType.VIDEO_FRAME,
      {
        streamId: stream.id,
        frame: frameData.toString('base64'),
        timestamp: Date.now(),
        sequence: stream.stats.framesSent,
      },
      {
        from: this.localDeviceId,
        to: stream.targetDeviceId,
        compressed: true,
      }
    );

    await connectionManager.sendMessage(stream.targetDeviceId, message);

    stream.stats.framesSent++;
    stream.stats.bytesTransferred += frameData.length;
  }

  /**
   * Handle received video frame
   */
  handleVideoFrame(message: Message): void {
    const { streamId, frame, timestamp, sequence } = message.payload;

    const stream = Array.from(this.activeStreams.values()).find(
      (s) => s.id === streamId && s.sourceDeviceId === message.from
    );

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
  async updateStreamConfig(
    streamId: string,
    config: Partial<CameraStream['config']>
  ): Promise<void> {
    const stream = this.activeStreams.get(streamId);

    if (!stream || !this.localDeviceId) {
      throw new Error('Stream not found');
    }

    Object.assign(stream.config, config);

    // Notify remote device
    const message = createMessage(
      MessageType.VIDEO_STREAM,
      {
        action: 'config-update',
        streamId,
        config: stream.config,
      },
      {
        from: this.localDeviceId,
        to: stream.targetDeviceId,
      }
    );

    await connectionManager.sendMessage(stream.targetDeviceId, message);

    // Restart capture if resolution or frame rate changed
    if (config.resolution || config.frameRate) {
      const interval = this.streamIntervals.get(streamId);
      if (interval) {
        clearInterval(interval);
      }
      await this.startCameraCapture(stream);
    }

    log.info(`Updated stream configuration: ${streamId}`);
    this.emit('camera:config:updated', { streamId, config: stream.config });
  }

  /**
   * Take snapshot from stream
   */
  async takeSnapshot(streamId: string): Promise<Buffer> {
    const stream = this.activeStreams.get(streamId);

    if (!stream) {
      throw new Error('Stream not found');
    }

    // This will be implemented via native bridge
    const snapshot = Buffer.from(''); // Placeholder

    log.info(`Snapshot taken from stream: ${streamId}`);
    this.emit('camera:snapshot:taken', { streamId, snapshot });

    return snapshot;
  }

  /**
   * Control camera settings (zoom, flash, focus, etc.)
   */
  async controlCamera(
    streamId: string,
    control: {
      zoom?: number;
      flash?: boolean;
      focus?: { x: number; y: number };
    }
  ): Promise<void> {
    const stream = this.activeStreams.get(streamId);

    if (!stream || !this.localDeviceId) {
      throw new Error('Stream not found');
    }

    // Send control command
    const message = createMessage(
      MessageType.VIDEO_STREAM,
      {
        action: 'camera-control',
        streamId,
        control,
      },
      {
        from: this.localDeviceId,
        to: stream.sourceDeviceId,
      }
    );

    await connectionManager.sendMessage(stream.sourceDeviceId, message);

    log.info(`Camera control command sent: ${streamId}`);
  }

  /**
   * Get active streams
   */
  getActiveStreams(): CameraStream[] {
    return Array.from(this.activeStreams.values()).filter((s) => s.active);
  }

  /**
   * Get stream by ID
   */
  getStream(streamId: string): CameraStream | undefined {
    return this.activeStreams.get(streamId);
  }

  /**
   * Get stream stats
   */
  getStreamStats(streamId: string): CameraStream['stats'] | undefined {
    return this.activeStreams.get(streamId)?.stats;
  }

  /**
   * Update settings
   */
  updateSettings(options: Partial<CameraSharingOptions>): void {
    Object.assign(this.options, options);
  }

  /**
   * Get current settings
   */
  getSettings(): Required<CameraSharingOptions> {
    return { ...this.options };
  }

  /**
   * Clean up all streams
   */
  async cleanup(): Promise<void> {
    const activeStreams = this.getActiveStreams();

    for (const stream of activeStreams) {
      await this.stopCameraShare(stream.id);
    }

    log.info('Camera sharing service cleaned up');
  }
}

// Export singleton instance
export const cameraSharingService = new CameraSharingService();
