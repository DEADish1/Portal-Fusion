import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import {
  Message,
  MessageType,
  TouchEvent as TCEvent,
  MouseEvent as MSEvent,
  KeyboardEvent as KBEvent,
} from '@portal-fusion/shared';
import { createMessage } from '@portal-fusion/shared';
import { connectionManager } from '../connection';
import log from 'electron-log';

export interface GestureTranslationOptions {
  enabled?: boolean;
  enableTapToClick?: boolean;
  enableSwipeNavigation?: boolean;
  enablePinchZoom?: boolean;
  enableRotate?: boolean;
  swipeSensitivity?: number;
  pinchSensitivity?: number;
}

export type GestureType =
  | 'tap'
  | 'double-tap'
  | 'long-press'
  | 'swipe-left'
  | 'swipe-right'
  | 'swipe-up'
  | 'swipe-down'
  | 'pinch-in'
  | 'pinch-out'
  | 'rotate-cw'
  | 'rotate-ccw'
  | 'two-finger-tap'
  | 'three-finger-swipe';

export interface Gesture {
  id: string;
  type: GestureType;
  touches: Array<{ x: number; y: number }>;
  startTime: number;
  endTime?: number;
  velocity?: { x: number; y: number };
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
export class GestureTranslationService extends TypedEventEmitter<PortalFusionEvents> {
  private options: Required<GestureTranslationOptions>;
  private localDeviceId?: string;
  private gestureMappings: Map<GestureType, GestureMapping> = new Map();
  private activeGestures: Map<string, Gesture> = new Map();
  private touchStartPositions: Map<number, { x: number; y: number; time: number }> = new Map();

  // Thresholds
  private readonly TAP_THRESHOLD = 300; // ms
  private readonly LONG_PRESS_THRESHOLD = 500; // ms
  private readonly SWIPE_THRESHOLD = 50; // pixels
  private readonly PINCH_THRESHOLD = 0.1; // scale change

  constructor(options: GestureTranslationOptions = {}) {
    super();

    this.options = {
      enabled: options.enabled !== false,
      enableTapToClick: options.enableTapToClick !== false,
      enableSwipeNavigation: options.enableSwipeNavigation !== false,
      enablePinchZoom: options.enablePinchZoom !== false,
      enableRotate: options.enableRotate !== false,
      swipeSensitivity: options.swipeSensitivity || 1.0,
      pinchSensitivity: options.pinchSensitivity || 1.0,
    };

    this.initializeDefaultMappings();
  }

  /**
   * Initialize service
   */
  initialize(localDeviceId: string): void {
    this.localDeviceId = localDeviceId;
    log.info('Gesture translation service initialized');
  }

  /**
   * Initialize default gesture mappings
   */
  private initializeDefaultMappings(): void {
    // Tap = Left click
    this.gestureMappings.set('tap', {
      gesture: 'tap',
      action: 'mouse-click',
      params: { button: 0 },
    });

    // Double tap = Double click
    this.gestureMappings.set('double-tap', {
      gesture: 'double-tap',
      action: 'mouse-click',
      params: { button: 0 },
    });

    // Long press = Right click
    this.gestureMappings.set('long-press', {
      gesture: 'long-press',
      action: 'mouse-click',
      params: { button: 2 },
    });

    // Two finger tap = Right click
    this.gestureMappings.set('two-finger-tap', {
      gesture: 'two-finger-tap',
      action: 'mouse-click',
      params: { button: 2 },
    });

    // Swipe left = Browser back
    this.gestureMappings.set('swipe-left', {
      gesture: 'swipe-left',
      action: 'keyboard-shortcut',
      params: { keys: ['Alt', 'ArrowLeft'] },
    });

    // Swipe right = Browser forward
    this.gestureMappings.set('swipe-right', {
      gesture: 'swipe-right',
      action: 'keyboard-shortcut',
      params: { keys: ['Alt', 'ArrowRight'] },
    });

    // Pinch in = Zoom out
    this.gestureMappings.set('pinch-in', {
      gesture: 'pinch-in',
      action: 'keyboard-shortcut',
      params: { keys: ['Control', '-'] },
    });

    // Pinch out = Zoom in
    this.gestureMappings.set('pinch-out', {
      gesture: 'pinch-out',
      action: 'keyboard-shortcut',
      params: { keys: ['Control', '+'] },
    });

    // Swipe up = Page up
    this.gestureMappings.set('swipe-up', {
      gesture: 'swipe-up',
      action: 'mouse-scroll',
      params: { scrollAmount: -100 },
    });

    // Swipe down = Page down
    this.gestureMappings.set('swipe-down', {
      gesture: 'swipe-down',
      action: 'mouse-scroll',
      params: { scrollAmount: 100 },
    });
  }

  /**
   * Process touch event and detect gestures
   */
  processTouchEvent(event: TCEvent): void {
    if (!this.options.enabled) {
      return;
    }

    switch (event.type) {
      case 'touchstart':
        this.handleTouchStart(event);
        break;
      case 'touchmove':
        this.handleTouchMove(event);
        break;
      case 'touchend':
        this.handleTouchEnd(event);
        break;
      case 'touchcancel':
        this.handleTouchCancel(event);
        break;
    }
  }

  /**
   * Handle touch start
   */
  private handleTouchStart(event: TCEvent): void {
    const now = Date.now();

    event.touches.forEach((touch) => {
      this.touchStartPositions.set(touch.identifier, {
        x: touch.x,
        y: touch.y,
        time: now,
      });
    });

    // Create gesture
    const gesture: Gesture = {
      id: `gesture-${now}`,
      type: 'tap', // Default, will be updated
      touches: event.touches.map((t) => ({ x: t.x, y: t.y })),
      startTime: now,
    };

    this.activeGestures.set(gesture.id, gesture);
  }

  /**
   * Handle touch move
   */
  private handleTouchMove(event: TCEvent): void {
    // Update gesture type based on movement
    if (event.touches.length === 2) {
      this.detectPinchRotate(event);
    } else if (event.touches.length === 1) {
      this.detectSwipe(event);
    }
  }

  /**
   * Handle touch end
   */
  private handleTouchEnd(event: TCEvent): void {
    const now = Date.now();

    // Find matching gesture
    const gesture = Array.from(this.activeGestures.values()).find(
      (g) => !g.endTime && g.touches.length === event.changedTouches.length
    );

    if (!gesture) {
      return;
    }

    gesture.endTime = now;
    const duration = now - gesture.startTime;

    // Detect gesture type
    if (event.touches.length === 0) {
      // All touches ended
      if (duration < this.TAP_THRESHOLD) {
        // Check for double tap
        const recentTaps = Array.from(this.activeGestures.values()).filter(
          (g) => g.type === 'tap' && g.endTime && now - g.endTime < 300
        );

        if (recentTaps.length > 0) {
          gesture.type = 'double-tap';
        } else {
          gesture.type = event.changedTouches.length === 2 ? 'two-finger-tap' : 'tap';
        }
      } else if (duration >= this.LONG_PRESS_THRESHOLD) {
        gesture.type = 'long-press';
      }

      // Translate and emit
      this.translateGesture(gesture);
    }

    // Clean up old gestures
    this.cleanupGestures();
  }

  /**
   * Handle touch cancel
   */
  private handleTouchCancel(event: TCEvent): void {
    event.changedTouches.forEach((touch) => {
      this.touchStartPositions.delete(touch.identifier);
    });

    this.cleanupGestures();
  }

  /**
   * Detect swipe gesture
   */
  private detectSwipe(event: TCEvent): void {
    if (event.touches.length !== 1) return;

    const touch = event.touches[0];
    const startPos = this.touchStartPositions.get(touch.identifier);

    if (!startPos) return;

    const deltaX = touch.x - startPos.x;
    const deltaY = touch.y - startPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > this.SWIPE_THRESHOLD * this.options.swipeSensitivity) {
      // Find active gesture
      const gesture = Array.from(this.activeGestures.values()).find((g) => !g.endTime);

      if (gesture) {
        // Determine swipe direction
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          gesture.type = deltaX > 0 ? 'swipe-right' : 'swipe-left';
        } else {
          gesture.type = deltaY > 0 ? 'swipe-down' : 'swipe-up';
        }

        gesture.velocity = {
          x: deltaX / (Date.now() - startPos.time),
          y: deltaY / (Date.now() - startPos.time),
        };
      }
    }
  }

  /**
   * Detect pinch and rotate gestures
   */
  private detectPinchRotate(event: TCEvent): void {
    if (event.touches.length !== 2) return;

    const [touch1, touch2] = event.touches;
    const startPos1 = this.touchStartPositions.get(touch1.identifier);
    const startPos2 = this.touchStartPositions.get(touch2.identifier);

    if (!startPos1 || !startPos2) return;

    // Calculate initial distance
    const startDist = Math.sqrt(
      Math.pow(startPos2.x - startPos1.x, 2) + Math.pow(startPos2.y - startPos1.y, 2)
    );

    // Calculate current distance
    const currentDist = Math.sqrt(
      Math.pow(touch2.x - touch1.x, 2) + Math.pow(touch2.y - touch1.y, 2)
    );

    const scale = currentDist / startDist;

    // Find active gesture
    const gesture = Array.from(this.activeGestures.values()).find((g) => !g.endTime);

    if (gesture && this.options.enablePinchZoom) {
      if (Math.abs(scale - 1) > this.PINCH_THRESHOLD * this.options.pinchSensitivity) {
        gesture.type = scale > 1 ? 'pinch-out' : 'pinch-in';
        gesture.scale = scale;
      }
    }

    // Detect rotation
    if (gesture && this.options.enableRotate) {
      const startAngle = Math.atan2(startPos2.y - startPos1.y, startPos2.x - startPos1.x);
      const currentAngle = Math.atan2(touch2.y - touch1.y, touch2.x - touch1.x);
      const rotation = (currentAngle - startAngle) * (180 / Math.PI);

      if (Math.abs(rotation) > 15) {
        gesture.type = rotation > 0 ? 'rotate-cw' : 'rotate-ccw';
        gesture.rotation = rotation;
      }
    }
  }

  /**
   * Translate gesture to action
   */
  private translateGesture(gesture: Gesture): void {
    const mapping = this.gestureMappings.get(gesture.type);

    if (!mapping) {
      log.debug(`No mapping for gesture: ${gesture.type}`);
      return;
    }

    log.info(`Translating gesture: ${gesture.type} -> ${mapping.action}`);

    // Emit translated action
    this.emit('gesture:detected', {
      gesture,
      mapping,
    });

    // Generate corresponding input events
    if (mapping.action === 'mouse-click' && this.options.enableTapToClick) {
      this.emitMouseClick(gesture, mapping.params?.button || 0);
    } else if (mapping.action === 'mouse-scroll') {
      this.emitMouseScroll(gesture, mapping.params?.scrollAmount || 0);
    } else if (mapping.action === 'keyboard-shortcut') {
      this.emitKeyboardShortcut(gesture, mapping.params?.keys || []);
    }
  }

  /**
   * Emit mouse click event
   */
  private emitMouseClick(gesture: Gesture, button: number): void {
    const position = gesture.touches[0];

    const mouseEvent: MSEvent = {
      type: 'click',
      x: position.x,
      y: position.y,
      button,
      timestamp: gesture.endTime || Date.now(),
    };

    this.emit('gesture:mouse-event', mouseEvent);
  }

  /**
   * Emit mouse scroll event
   */
  private emitMouseScroll(gesture: Gesture, amount: number): void {
    const position = gesture.touches[0];

    const mouseEvent: MSEvent = {
      type: 'wheel',
      x: position.x,
      y: position.y,
      deltaY: amount,
      timestamp: gesture.endTime || Date.now(),
    };

    this.emit('gesture:mouse-event', mouseEvent);
  }

  /**
   * Emit keyboard shortcut
   */
  private emitKeyboardShortcut(gesture: Gesture, keys: string[]): void {
    keys.forEach((key) => {
      const keyboardEvent: KBEvent = {
        type: 'keydown',
        key,
        timestamp: Date.now(),
      };

      this.emit('gesture:keyboard-event', keyboardEvent);
    });

    // Release keys
    setTimeout(() => {
      keys.reverse().forEach((key) => {
        const keyboardEvent: KBEvent = {
          type: 'keyup',
          key,
          timestamp: Date.now(),
        };

        this.emit('gesture:keyboard-event', keyboardEvent);
      });
    }, 50);
  }

  /**
   * Clean up old gestures
   */
  private cleanupGestures(): void {
    const now = Date.now();
    const threshold = 5000; // Keep gestures for 5 seconds

    this.activeGestures.forEach((gesture, id) => {
      if (gesture.endTime && now - gesture.endTime > threshold) {
        this.activeGestures.delete(id);
      }
    });

    // Clean up touch positions
    this.touchStartPositions.forEach((pos, id) => {
      if (now - pos.time > threshold) {
        this.touchStartPositions.delete(id);
      }
    });
  }

  /**
   * Add custom gesture mapping
   */
  addGestureMapping(mapping: GestureMapping): void {
    this.gestureMappings.set(mapping.gesture, mapping);
    log.info(`Added gesture mapping: ${mapping.gesture} -> ${mapping.action}`);
  }

  /**
   * Remove gesture mapping
   */
  removeGestureMapping(gestureType: GestureType): void {
    this.gestureMappings.delete(gestureType);
    log.info(`Removed gesture mapping: ${gestureType}`);
  }

  /**
   * Get gesture mappings
   */
  getGestureMappings(): GestureMapping[] {
    return Array.from(this.gestureMappings.values());
  }

  /**
   * Update settings
   */
  updateSettings(options: Partial<GestureTranslationOptions>): void {
    Object.assign(this.options, options);
  }

  /**
   * Get current settings
   */
  getSettings(): Required<GestureTranslationOptions> {
    return { ...this.options };
  }
}

// Export singleton instance
export const gestureTranslationService = new GestureTranslationService();
