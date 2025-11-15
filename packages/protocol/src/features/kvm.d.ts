import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import { Message, KeyboardEvent as KBEvent, MouseEvent as MSEvent, TouchEvent as TCEvent } from '@portal-fusion/shared';
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
export declare class KVMService extends TypedEventEmitter<PortalFusionEvents> {
    private options;
    private localDeviceId?;
    private activeSessions;
    private isControlling;
    private isControlled;
    private currentSession?;
    constructor(options?: KVMOptions);
    /**
     * Initialize service
     */
    initialize(localDeviceId: string): void;
    /**
     * Start controlling remote device
     */
    startControl(targetDeviceId: string): Promise<KVMSession>;
    /**
     * Stop controlling remote device
     */
    stopControl(): Promise<void>;
    /**
     * Handle control request
     */
    handleControlRequest(message: Message): Promise<void>;
    /**
     * Send keyboard event to controlled device
     */
    sendKeyboardEvent(event: KBEvent): Promise<void>;
    /**
     * Send mouse event to controlled device
     */
    sendMouseEvent(event: MSEvent): Promise<void>;
    /**
     * Send touch event to controlled device
     */
    sendTouchEvent(event: TCEvent): Promise<void>;
    /**
     * Handle received keyboard event (inject to local system)
     */
    handleKeyboardEvent(event: KBEvent): void;
    /**
     * Handle received mouse event (inject to local system)
     */
    handleMouseEvent(event: MSEvent): void;
    /**
     * Handle received touch event (inject to local system)
     */
    handleTouchEvent(event: TCEvent): void;
    /**
     * Check if currently controlling
     */
    isActivelyControlling(): boolean;
    /**
     * Check if being controlled
     */
    isBeingControlled(): boolean;
    /**
     * Get current session
     */
    getCurrentSession(): KVMSession | undefined;
    /**
     * Get all sessions
     */
    getSessions(): KVMSession[];
    /**
     * Update settings
     */
    updateSettings(options: Partial<KVMOptions>): void;
    /**
     * Get current settings
     */
    getSettings(): Required<KVMOptions>;
}
export declare const kvmService: KVMService;
//# sourceMappingURL=kvm.d.ts.map