import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import { Message, MessageType } from '@portal-fusion/shared';
import { createMessage } from '@portal-fusion/shared';
import { connectionManager } from '../connection';
import log from 'electron-log';

export interface MicrophoneRoutingOptions {
  enabled?: boolean;
  sampleRate?: number;
  channels?: number;
  bitDepth?: number;
  codec?: 'pcm' | 'opus';
  enableNoiseSuppression?: boolean;
  enableEchoCancellation?: boolean;
  enableVAD?: boolean; // Voice Activity Detection
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
export class MicrophoneRoutingService extends TypedEventEmitter<PortalFusionEvents> {
  private options: Required<MicrophoneRoutingOptions>;
  private localDeviceId?: string;
  private availableMicrophones: Map<string, MicrophoneDevice> = new Map();
  private activeStreams: Map<string, MicrophoneStream> = new Map();
  private streamIntervals: Map<string, NodeJS.Timeout> = new Map();

  // VAD thresholds
  private readonly VAD_THRESHOLD = 0.02; // Audio level threshold for voice detection
  private readonly VAD_SMOOTHING = 0.85; // Smoothing factor for VAD

  constructor(options: MicrophoneRoutingOptions = {}) {
    super();

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
  async initialize(localDeviceId: string): Promise<void> {
    this.localDeviceId = localDeviceId;

    // Enumerate microphones (to be implemented via native bridge)
    await this.enumerateMicrophones();

    log.info('Microphone routing service initialized');
  }

  /**
   * Enumerate available microphones (to be implemented via native bridge)
   */
  private async enumerateMicrophones(): Promise<void> {
    // This will be implemented via native bridge
    log.info('Enumerating microphones...');
  }

  /**
   * Get available microphones
   */
  getAvailableMicrophones(): MicrophoneDevice[] {
    return Array.from(this.availableMicrophones.values());
  }

  /**
   * Start microphone stream
   */
  async startMicrophoneStream(
    targetDeviceId: string,
    microphoneId: string
  ): Promise<MicrophoneStream> {
    if (!this.options.enabled || !this.localDeviceId) {
      throw new Error('Microphone routing service not enabled or initialized');
    }

    const microphone = this.availableMicrophones.get(microphoneId);
    if (!microphone) {
      throw new Error('Microphone not found');
    }

    const stream: MicrophoneStream = {
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
    const message = createMessage(
      MessageType.AUDIO_STREAM,
      {
        action: 'microphone-start',
        streamId: stream.id,
        microphoneId,
        config: stream.config,
      },
      {
        from: this.localDeviceId,
        to: targetDeviceId,
      }
    );

    await connectionManager.sendMessage(targetDeviceId, message);

    log.info(`Started microphone stream: ${microphone.name} -> ${targetDeviceId}`);
    this.emit('microphone:stream:started', stream);

    // Start capturing and sending audio
    await this.startMicrophoneCapture(stream);

    return stream;
  }

  /**
   * Stop microphone stream
   */
  async stopMicrophoneStream(streamId: string): Promise<void> {
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
        action: 'microphone-stop',
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

    log.info(`Stopped microphone stream: ${streamId}`);
    this.emit('microphone:stream:stopped', { streamId });
  }

  /**
   * Handle stream request
   */
  async handleStreamRequest(message: Message): Promise<void> {
    const { action, streamId, microphoneId, config } = message.payload;

    if (action === 'microphone-start') {
      const stream: MicrophoneStream = {
        id: streamId,
        sourceDeviceId: message.from,
        targetDeviceId: this.localDeviceId!,
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

      log.info(`Receiving microphone stream from: ${message.from}`);
      this.emit('microphone:stream:receiving', stream);
    } else if (action === 'microphone-stop') {
      this.activeStreams.delete(streamId);
      log.info(`Microphone stream ended: ${streamId}`);
      this.emit('microphone:stream:ended', { streamId });
    }
  }

  /**
   * Start microphone capture (to be implemented via native bridge)
   */
  private async startMicrophoneCapture(stream: MicrophoneStream): Promise<void> {
    // This will be implemented via native bridge (getUserMedia with audio constraints)
    const packetInterval = 20; // 20ms packets for low latency voice

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
   * Capture and send audio packet with VAD (to be implemented via native bridge)
   */
  private async captureAndSendAudioPacket(stream: MicrophoneStream): Promise<void> {
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
      } else {
        stream.stats.silenceSeconds += 0.02;
      }
    }

    // Only send if voice detected or VAD disabled
    if (isVoice || !stream.config.vad) {
      const message = createMessage(
        MessageType.AUDIO_PACKET,
        {
          streamId: stream.id,
          data: audioData.toString('base64'),
          timestamp: Date.now(),
          sequence: stream.stats.packetsSent,
          level: audioLevel,
          isVoice,
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

    // Update average level
    stream.stats.averageLevel =
      stream.stats.averageLevel * this.VAD_SMOOTHING + audioLevel * (1 - this.VAD_SMOOTHING);
  }

  /**
   * Detect voice activity
   */
  private detectVoiceActivity(audioLevel: number, stream: MicrophoneStream): boolean {
    // Simple threshold-based VAD
    // In production, would use more sophisticated algorithms
    return audioLevel > this.VAD_THRESHOLD;
  }

  /**
   * Handle received audio packet
   */
  handleAudioPacket(message: Message): void {
    const { streamId, data, timestamp, sequence, level, isVoice } = message.payload;

    const stream = Array.from(this.activeStreams.values()).find(
      (s) => s.id === streamId && s.sourceDeviceId === message.from
    );

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
  async adjustGain(streamId: string, gain: number): Promise<void> {
    const stream = this.activeStreams.get(streamId);

    if (!stream) {
      throw new Error('Stream not found');
    }

    // Gain should be 0.0 to 2.0 (0 = mute, 1 = normal, 2 = boost)
    stream.config.gain = Math.max(0, Math.min(2, gain));

    log.info(`Microphone gain adjusted: ${streamId} -> ${stream.config.gain}`);
    this.emit('microphone:gain:changed', { streamId, gain: stream.config.gain });
  }

  /**
   * Toggle mute
   */
  async toggleMute(streamId: string, muted: boolean): Promise<void> {
    const stream = this.activeStreams.get(streamId);

    if (!stream) {
      throw new Error('Stream not found');
    }

    // Mute by setting gain to 0, unmute by restoring to 1
    stream.config.gain = muted ? 0 : 1.0;

    log.info(`Microphone ${muted ? 'muted' : 'unmuted'}: ${streamId}`);
    this.emit('microphone:mute:changed', { streamId, muted });
  }

  /**
   * Update audio processing settings
   */
  async updateProcessing(
    streamId: string,
    settings: {
      noiseSuppression?: boolean;
      echoCancellation?: boolean;
      vad?: boolean;
      autoGain?: boolean;
    }
  ): Promise<void> {
    const stream = this.activeStreams.get(streamId);

    if (!stream) {
      throw new Error('Stream not found');
    }

    Object.assign(stream.config, settings);

    log.info(`Audio processing updated: ${streamId}`);
    this.emit('microphone:processing:updated', { streamId, settings });
  }

  /**
   * Get active streams
   */
  getActiveStreams(): MicrophoneStream[] {
    return Array.from(this.activeStreams.values()).filter((s) => s.active);
  }

  /**
   * Get stream by ID
   */
  getStream(streamId: string): MicrophoneStream | undefined {
    return this.activeStreams.get(streamId);
  }

  /**
   * Get stream stats
   */
  getStreamStats(streamId: string): MicrophoneStream['stats'] | undefined {
    return this.activeStreams.get(streamId)?.stats;
  }

  /**
   * Test microphone (returns audio level)
   */
  async testMicrophone(microphoneId: string, duration: number = 3000): Promise<number[]> {
    // This will be implemented via native bridge
    // Should capture audio for specified duration and return levels
    const levels: number[] = [];

    log.info(`Testing microphone: ${microphoneId} for ${duration}ms`);
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
  updateSettings(options: Partial<MicrophoneRoutingOptions>): void {
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
  getSettings(): Required<MicrophoneRoutingOptions> {
    return { ...this.options };
  }

  /**
   * Clean up all streams
   */
  async cleanup(): Promise<void> {
    const activeStreams = this.getActiveStreams();

    for (const stream of activeStreams) {
      await this.stopMicrophoneStream(stream.id);
    }

    log.info('Microphone routing service cleaned up');
  }
}

// Export singleton instance
export const microphoneRoutingService = new MicrophoneRoutingService();
