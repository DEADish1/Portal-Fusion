import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import { Message, MessageType } from '@portal-fusion/shared';
import { createMessage } from '@portal-fusion/shared';
import { connectionManager } from '../connection';
import log from 'electron-log';

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
export class AudioRoutingService extends TypedEventEmitter<PortalFusionEvents> {
  private options: Required<AudioRoutingOptions>;
  private localDeviceId?: string;
  private activeStreams: Map<string, AudioStream> = new Map();
  private audioDevices: Map<string, AudioDevice> = new Map();
  private streamIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(options: AudioRoutingOptions = {}) {
    super();

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
  initialize(localDeviceId: string): void {
    this.localDeviceId = localDeviceId;
    log.info('Audio routing service initialized');
  }

  /**
   * Start audio stream
   */
  async startAudioStream(
    targetDeviceId: string,
    streamType: 'system' | 'application' | 'microphone',
    sourceDeviceId?: string
  ): Promise<AudioStream> {
    if (!this.options.enabled || !this.localDeviceId) {
      throw new Error('Audio routing service not enabled or initialized');
    }

    const stream: AudioStream = {
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
    const message = createMessage(
      MessageType.AUDIO_STREAM,
      {
        action: 'start',
        streamId: stream.id,
        streamType,
        config: stream.config,
      },
      {
        from: this.localDeviceId,
        to: targetDeviceId,
      }
    );

    await connectionManager.sendMessage(targetDeviceId, message);

    log.info(`Started audio stream: ${streamType} -> ${targetDeviceId}`);
    this.emit('audio:stream:started', stream);

    // Start capturing and sending audio
    this.startAudioCapture(stream);

    return stream;
  }

  /**
   * Stop audio stream
   */
  async stopAudioStream(streamId: string): Promise<void> {
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
      MessageType.AUDIO_STREAM,
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

    log.info(`Stopped audio stream: ${streamId}`);
    this.emit('audio:stream:stopped', { streamId });
  }

  /**
   * Handle stream request
   */
  async handleStreamRequest(message: Message): Promise<void> {
    const { action, streamId, streamType, config } = message.payload;

    if (action === 'start') {
      const stream: AudioStream = {
        id: streamId,
        sourceDeviceId: message.from,
        targetDeviceId: this.localDeviceId!,
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

      log.info(`Receiving audio stream from: ${message.from}`);
      this.emit('audio:stream:receiving', stream);
    } else if (action === 'stop') {
      this.activeStreams.delete(streamId);
      log.info(`Audio stream ended: ${streamId}`);
      this.emit('audio:stream:ended', { streamId });
    }
  }

  /**
   * Start audio capture (to be implemented via native bridge)
   */
  private startAudioCapture(stream: AudioStream): void {
    const packetInterval = (this.options.bufferSize / this.options.sampleRate) * 1000;

    const interval = setInterval(async () => {
      try {
        await this.captureAndSendAudioPacket(stream);
      } catch (error) {
        log.error('Failed to capture/send audio packet:', error);
      }
    }, packetInterval);

    this.streamIntervals.set(stream.id, interval);
  }

  /**
   * Capture and send audio packet (to be implemented via native bridge)
   */
  private async captureAndSendAudioPacket(stream: AudioStream): Promise<void> {
    if (!this.localDeviceId || !stream.active) {
      return;
    }

    // This will be implemented via native bridge (node-speaker, pulseaudio, etc.)
    // For now, this is a placeholder
    const audioData = Buffer.from(''); // Placeholder

    const message = createMessage(
      MessageType.AUDIO_PACKET,
      {
        streamId: stream.id,
        data: audioData.toString('base64'),
        timestamp: Date.now(),
        sequence: stream.stats.packetsSent,
      },
      {
        from: this.localDeviceId,
        to: stream.targetDeviceId,
        compressed: true,
      }
    );

    await connectionManager.sendMessage(stream.targetDeviceId, message);

    stream.stats.packetsSent++;
    stream.stats.bytesTransferred += audioData.length;
  }

  /**
   * Handle received audio packet
   */
  handleAudioPacket(message: Message): void {
    const { streamId, data, timestamp, sequence } = message.payload;

    const stream = Array.from(this.activeStreams.values()).find(
      (s) => s.id === streamId && s.sourceDeviceId === message.from
    );

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
  async getAudioDevices(): Promise<AudioDevice[]> {
    // This will be implemented via native bridge
    return Array.from(this.audioDevices.values());
  }

  /**
   * Set audio device
   */
  async setAudioDevice(streamId: string, deviceId: string): Promise<void> {
    const stream = this.activeStreams.get(streamId);
    const device = this.audioDevices.get(deviceId);

    if (!stream || !device) {
      throw new Error('Stream or device not found');
    }

    // Update stream config
    stream.config.sampleRate = device.sampleRate;
    stream.config.channels = device.channels;

    log.info(`Audio device set for stream ${streamId}: ${device.name}`);
    this.emit('audio:device:changed', { streamId, device });
  }

  /**
   * Adjust volume (to be implemented via native bridge)
   */
  async adjustVolume(streamId: string, volume: number): Promise<void> {
    const stream = this.activeStreams.get(streamId);

    if (!stream) {
      throw new Error('Stream not found');
    }

    // Volume should be 0.0 to 1.0
    const normalizedVolume = Math.max(0, Math.min(1, volume));

    log.info(`Volume adjusted for stream ${streamId}: ${normalizedVolume}`);
    this.emit('audio:volume:changed', { streamId, volume: normalizedVolume });
  }

  /**
   * Mute/unmute stream
   */
  async toggleMute(streamId: string, muted: boolean): Promise<void> {
    const stream = this.activeStreams.get(streamId);

    if (!stream) {
      throw new Error('Stream not found');
    }

    log.info(`Stream ${streamId} ${muted ? 'muted' : 'unmuted'}`);
    this.emit('audio:mute:changed', { streamId, muted });
  }

  /**
   * Get active streams
   */
  getActiveStreams(): AudioStream[] {
    return Array.from(this.activeStreams.values()).filter((s) => s.active);
  }

  /**
   * Get stream by ID
   */
  getStream(streamId: string): AudioStream | undefined {
    return this.activeStreams.get(streamId);
  }

  /**
   * Get stream stats
   */
  getStreamStats(streamId: string): AudioStream['stats'] | undefined {
    return this.activeStreams.get(streamId)?.stats;
  }

  /**
   * Update settings
   */
  updateSettings(options: Partial<AudioRoutingOptions>): void {
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
  getSettings(): Required<AudioRoutingOptions> {
    return { ...this.options };
  }

  /**
   * Clean up all streams
   */
  async cleanup(): Promise<void> {
    const activeStreams = this.getActiveStreams();

    for (const stream of activeStreams) {
      await this.stopAudioStream(stream.id);
    }

    log.info('Audio routing service cleaned up');
  }
}

// Export singleton instance
export const audioRoutingService = new AudioRoutingService();
