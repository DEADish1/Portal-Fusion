import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import { Message, Device, Activity, ActivityType } from '@portal-fusion/shared';

export interface EventBusOptions {
  enableLogging?: boolean;
  maxListeners?: number;
}

/**
 * Centralized Event Bus
 * Global event system for Portal Fusion
 */
export class EventBus extends TypedEventEmitter<PortalFusionEvents> {
  private static instance: EventBus;
  private activityLog: Activity[] = [];
  private options: Required<EventBusOptions>;

  private constructor(options: EventBusOptions = {}) {
    super();

    this.options = {
      enableLogging: options.enableLogging !== false,
      maxListeners: options.maxListeners || 100,
    };

    this.setupInternalListeners();
  }

  /**
   * Get singleton instance
   */
  static getInstance(options?: EventBusOptions): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus(options);
    }
    return EventBus.instance;
  }

  /**
   * Setup internal event listeners for logging
   */
  private setupInternalListeners(): void {
    if (!this.options.enableLogging) return;

    // Log device events
    this.on('device:discovered', (device) => {
      this.logActivity({
        type: ActivityType.CONNECTION,
        device: device.name,
        description: `Device discovered: ${device.name}`,
        status: 'success',
      });
    });

    this.on('device:connected', (device) => {
      this.logActivity({
        type: ActivityType.CONNECTION,
        device: device.name,
        description: `Connected to device: ${device.name}`,
        status: 'success',
      });
    });

    this.on('device:disconnected', (device) => {
      this.logActivity({
        type: ActivityType.DISCONNECTION,
        device: device.name,
        description: `Disconnected from device: ${device.name}`,
        status: 'warning',
      });
    });

    this.on('device:paired', (device) => {
      this.logActivity({
        type: ActivityType.CONNECTION,
        device: device.name,
        description: `Device paired: ${device.name}`,
        status: 'success',
      });
    });

    // Log message events
    this.on('message:received', (message) => {
      console.log(`📨 Message received: ${message.type} from ${message.from}`);
    });

    this.on('message:sent', (message) => {
      console.log(`📤 Message sent: ${message.type} to ${message.to}`);
    });

    this.on('message:error', (error, message) => {
      this.logActivity({
        type: ActivityType.ERROR,
        device: message.from || 'unknown',
        description: `Message error: ${error.message}`,
        status: 'failure',
        details: { error, message },
      });
    });

    // Log file transfer events
    this.on('file:transfer:start', (transfer) => {
      this.logActivity({
        type: ActivityType.FILE_TRANSFER,
        device: 'file-transfer',
        description: `File transfer started: ${transfer.fileName}`,
        status: 'success',
        details: transfer,
      });
    });

    this.on('file:transfer:complete', (transfer) => {
      this.logActivity({
        type: ActivityType.FILE_TRANSFER,
        device: 'file-transfer',
        description: `File transfer completed: ${transfer.fileName}`,
        status: 'success',
        details: transfer,
      });
    });

    // Log screen share events
    this.on('screen:share:start', (share) => {
      this.logActivity({
        type: ActivityType.SCREEN_SHARE,
        device: share.sourceDevice,
        description: `Screen sharing started`,
        status: 'success',
        details: share,
      });
    });

    this.on('screen:share:stop', (share) => {
      this.logActivity({
        type: ActivityType.SCREEN_SHARE,
        device: share.sourceDevice,
        description: `Screen sharing stopped`,
        status: 'success',
        details: share,
      });
    });

    // Log errors
    this.on('error', (error) => {
      this.logActivity({
        type: ActivityType.ERROR,
        device: 'system',
        description: error.message,
        status: 'failure',
        details: error,
      });
      console.error('❌ Error:', error);
    });

    // Log warnings
    this.on('warning', (warning) => {
      this.logActivity({
        type: ActivityType.ERROR,
        device: 'system',
        description: warning,
        status: 'warning',
      });
      console.warn('⚠️ Warning:', warning);
    });
  }

  /**
   * Log activity
   */
  private logActivity(activity: Omit<Activity, 'id' | 'timestamp'>): void {
    const fullActivity: Activity = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...activity,
    };

    this.activityLog.push(fullActivity);
    this.emit('activity', fullActivity);

    // Limit log size (keep last 1000 entries)
    if (this.activityLog.length > 1000) {
      this.activityLog = this.activityLog.slice(-1000);
    }
  }

  /**
   * Get activity log
   */
  getActivityLog(limit?: number): Activity[] {
    if (limit) {
      return this.activityLog.slice(-limit);
    }
    return [...this.activityLog];
  }

  /**
   * Get activity log by type
   */
  getActivityByType(type: ActivityType, limit?: number): Activity[] {
    const filtered = this.activityLog.filter((activity) => activity.type === type);
    if (limit) {
      return filtered.slice(-limit);
    }
    return filtered;
  }

  /**
   * Get activity log by device
   */
  getActivityByDevice(device: string, limit?: number): Activity[] {
    const filtered = this.activityLog.filter((activity) => activity.device === device);
    if (limit) {
      return filtered.slice(-limit);
    }
    return filtered;
  }

  /**
   * Clear activity log
   */
  clearActivityLog(): void {
    this.activityLog = [];
  }

  /**
   * Emit device discovered event
   */
  deviceDiscovered(device: Device): void {
    this.emit('device:discovered', device);
  }

  /**
   * Emit device connected event
   */
  deviceConnected(device: Device): void {
    this.emit('device:connected', device);
  }

  /**
   * Emit device disconnected event
   */
  deviceDisconnected(device: Device): void {
    this.emit('device:disconnected', device);
  }

  /**
   * Emit device paired event
   */
  devicePaired(device: Device): void {
    this.emit('device:paired', device);
  }

  /**
   * Emit message received event
   */
  messageReceived(message: Message): void {
    this.emit('message:received', message);
  }

  /**
   * Emit message sent event
   */
  messageSent(message: Message): void {
    this.emit('message:sent', message);
  }

  /**
   * Emit error event
   */
  error(error: Error): void {
    this.emit('error', error);
  }

  /**
   * Emit warning event
   */
  warning(warning: string): void {
    this.emit('warning', warning);
  }

  /**
   * Get event statistics
   */
  getStats(): {
    totalListeners: number;
    activityLogSize: number;
  } {
    let totalListeners = 0;
    // Count all listeners (this is a simplified version)
    // In a real implementation, you'd iterate over all event types

    return {
      totalListeners,
      activityLogSize: this.activityLog.length,
    };
  }
}

// Export singleton instance
export const eventBus = EventBus.getInstance();
