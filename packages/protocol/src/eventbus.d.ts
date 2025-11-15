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
export declare class EventBus extends TypedEventEmitter<PortalFusionEvents> {
    private static instance;
    private activityLog;
    private options;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(options?: EventBusOptions): EventBus;
    /**
     * Setup internal event listeners for logging
     */
    private setupInternalListeners;
    /**
     * Log activity
     */
    private logActivity;
    /**
     * Get activity log
     */
    getActivityLog(limit?: number): Activity[];
    /**
     * Get activity log by type
     */
    getActivityByType(type: ActivityType, limit?: number): Activity[];
    /**
     * Get activity log by device
     */
    getActivityByDevice(device: string, limit?: number): Activity[];
    /**
     * Clear activity log
     */
    clearActivityLog(): void;
    /**
     * Emit device discovered event
     */
    deviceDiscovered(device: Device): void;
    /**
     * Emit device connected event
     */
    deviceConnected(device: Device): void;
    /**
     * Emit device disconnected event
     */
    deviceDisconnected(device: Device): void;
    /**
     * Emit device paired event
     */
    devicePaired(device: Device): void;
    /**
     * Emit message received event
     */
    messageReceived(message: Message): void;
    /**
     * Emit message sent event
     */
    messageSent(message: Message): void;
    /**
     * Emit error event
     */
    error(error: Error): void;
    /**
     * Emit warning event
     */
    warning(warning: string): void;
    /**
     * Get event statistics
     */
    getStats(): {
        totalListeners: number;
        activityLogSize: number;
    };
}
export declare const eventBus: EventBus;
//# sourceMappingURL=eventbus.d.ts.map