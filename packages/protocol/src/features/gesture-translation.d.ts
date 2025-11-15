import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import { TouchEvent as TCEvent } from '@portal-fusion/shared';
export interface GestureTranslationOptions {
    enabled?: boolean;
    enableTapToClick?: boolean;
    enableSwipeNavigation?: boolean;
    enablePinchZoom?: boolean;
    enableRotate?: boolean;
    swipeSensitivity?: number;
    pinchSensitivity?: number;
}
export type GestureType = 'tap' | 'double-tap' | 'long-press' | 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | 'pinch-in' | 'pinch-out' | 'rotate-cw' | 'rotate-ccw' | 'two-finger-tap' | 'three-finger-swipe';
export interface Gesture {
    id: string;
    type: GestureType;
    touches: Array<{
        x: number;
        y: number;
    }>;
    startTime: number;
    endTime?: number;
    velocity?: {
        x: number;
        y: number;
    };
    scale?: number;
    rotation?: number;
}
export interface GestureMapping {
    gesture: GestureType;
    action: 'mouse-click' | 'mouse-scroll' | 'keyboard-shortcut' | 'custom';
    params?: {
        button?: number;
        scrollAmount?: number;
        keys?: string[];
        customHandler?: string;
    };
}
/**
 * Touch Gesture Translation Service
 * Translates touch gestures to mouse/keyboard actions and vice versa
 */
export declare class GestureTranslationService extends TypedEventEmitter<PortalFusionEvents> {
    private options;
    private localDeviceId?;
    private gestureMappings;
    private activeGestures;
    private touchStartPositions;
    private readonly TAP_THRESHOLD;
    private readonly LONG_PRESS_THRESHOLD;
    private readonly SWIPE_THRESHOLD;
    private readonly PINCH_THRESHOLD;
    constructor(options?: GestureTranslationOptions);
    /**
     * Initialize service
     */
    initialize(localDeviceId: string): void;
    /**
     * Initialize default gesture mappings
     */
    private initializeDefaultMappings;
    /**
     * Process touch event and detect gestures
     */
    processTouchEvent(event: TCEvent): void;
    /**
     * Handle touch start
     */
    private handleTouchStart;
    /**
     * Handle touch move
     */
    private handleTouchMove;
    /**
     * Handle touch end
     */
    private handleTouchEnd;
    /**
     * Handle touch cancel
     */
    private handleTouchCancel;
    /**
     * Detect swipe gesture
     */
    private detectSwipe;
    /**
     * Detect pinch and rotate gestures
     */
    private detectPinchRotate;
    /**
     * Translate gesture to action
     */
    private translateGesture;
    /**
     * Emit mouse click event
     */
    private emitMouseClick;
    /**
     * Emit mouse scroll event
     */
    private emitMouseScroll;
    /**
     * Emit keyboard shortcut
     */
    private emitKeyboardShortcut;
    /**
     * Clean up old gestures
     */
    private cleanupGestures;
    /**
     * Add custom gesture mapping
     */
    addGestureMapping(mapping: GestureMapping): void;
    /**
     * Remove gesture mapping
     */
    removeGestureMapping(gestureType: GestureType): void;
    /**
     * Get gesture mappings
     */
    getGestureMappings(): GestureMapping[];
    /**
     * Update settings
     */
    updateSettings(options: Partial<GestureTranslationOptions>): void;
    /**
     * Get current settings
     */
    getSettings(): Required<GestureTranslationOptions>;
}
export declare const gestureTranslationService: GestureTranslationService;
//# sourceMappingURL=gesture-translation.d.ts.map