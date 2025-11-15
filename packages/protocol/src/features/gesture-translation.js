"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gestureTranslationService = exports.GestureTranslationService = void 0;
const shared_1 = require("@portal-fusion/shared");
const electron_log_1 = __importDefault(require("electron-log"));
/**
 * Touch Gesture Translation Service
 * Translates touch gestures to mouse/keyboard actions and vice versa
 */
class GestureTranslationService extends shared_1.TypedEventEmitter {
    constructor(options = {}) {
        super();
        this.gestureMappings = new Map();
        this.activeGestures = new Map();
        this.touchStartPositions = new Map();
        // Thresholds
        this.TAP_THRESHOLD = 300; // ms
        this.LONG_PRESS_THRESHOLD = 500; // ms
        this.SWIPE_THRESHOLD = 50; // pixels
        this.PINCH_THRESHOLD = 0.1; // scale change
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
    initialize(localDeviceId) {
        this.localDeviceId = localDeviceId;
        electron_log_1.default.info('Gesture translation service initialized');
    }
    /**
     * Initialize default gesture mappings
     */
    initializeDefaultMappings() {
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
    processTouchEvent(event) {
        if (!this.options.enabled) {
            return;
        }
        switch (event.type) {
            case 'start':
                this.handleTouchStart(event);
                break;
            case 'move':
                this.handleTouchMove(event);
                break;
            case 'end':
                this.handleTouchEnd(event);
                break;
            case 'cancel':
                this.handleTouchCancel(event);
                break;
        }
    }
    /**
     * Handle touch start
     */
    handleTouchStart(event) {
        const now = Date.now();
        event.touches.forEach((touch) => {
            this.touchStartPositions.set(touch.id, {
                x: touch.x,
                y: touch.y,
                time: now,
            });
        });
        // Create gesture
        const gesture = {
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
    handleTouchMove(event) {
        // Update gesture type based on movement
        if (event.touches.length === 2) {
            this.detectPinchRotate(event);
        }
        else if (event.touches.length === 1) {
            this.detectSwipe(event);
        }
    }
    /**
     * Handle touch end
     */
    handleTouchEnd(event) {
        const now = Date.now();
        // Find matching gesture
        const gesture = Array.from(this.activeGestures.values()).find((g) => !g.endTime && g.touches.length === event.touches.length);
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
                const recentTaps = Array.from(this.activeGestures.values()).filter((g) => g.type === 'tap' && g.endTime && now - g.endTime < 300);
                if (recentTaps.length > 0) {
                    gesture.type = 'double-tap';
                }
                else {
                    const touchCount = gesture.touches.length;
                    gesture.type = touchCount === 2 ? 'two-finger-tap' : 'tap';
                }
            }
            else if (duration >= this.LONG_PRESS_THRESHOLD) {
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
    handleTouchCancel(event) {
        event.touches.forEach((touch) => {
            this.touchStartPositions.delete(touch.id);
        });
        this.cleanupGestures();
    }
    /**
     * Detect swipe gesture
     */
    detectSwipe(event) {
        if (event.touches.length !== 1)
            return;
        const touch = event.touches[0];
        const startPos = this.touchStartPositions.get(touch.id);
        if (!startPos)
            return;
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
                }
                else {
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
    detectPinchRotate(event) {
        if (event.touches.length !== 2)
            return;
        const [touch1, touch2] = event.touches;
        const startPos1 = this.touchStartPositions.get(touch1.id);
        const startPos2 = this.touchStartPositions.get(touch2.id);
        if (!startPos1 || !startPos2)
            return;
        // Calculate initial distance
        const startDist = Math.sqrt(Math.pow(startPos2.x - startPos1.x, 2) + Math.pow(startPos2.y - startPos1.y, 2));
        // Calculate current distance
        const currentDist = Math.sqrt(Math.pow(touch2.x - touch1.x, 2) + Math.pow(touch2.y - touch1.y, 2));
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
    translateGesture(gesture) {
        const mapping = this.gestureMappings.get(gesture.type);
        if (!mapping) {
            electron_log_1.default.debug(`No mapping for gesture: ${gesture.type}`);
            return;
        }
        electron_log_1.default.info(`Translating gesture: ${gesture.type} -> ${mapping.action}`);
        // Emit translated action
        this.emit('gesture:detected', {
            gesture,
            mapping,
        });
        // Generate corresponding input events
        if (mapping.action === 'mouse-click' && this.options.enableTapToClick) {
            this.emitMouseClick(gesture, mapping.params?.button || 0);
        }
        else if (mapping.action === 'mouse-scroll') {
            this.emitMouseScroll(gesture, mapping.params?.scrollAmount || 0);
        }
        else if (mapping.action === 'keyboard-shortcut') {
            this.emitKeyboardShortcut(gesture, mapping.params?.keys || []);
        }
    }
    /**
     * Emit mouse click event
     */
    emitMouseClick(gesture, button) {
        const position = gesture.touches[0];
        const buttonMap = {
            0: 'left',
            1: 'middle',
            2: 'right',
            3: 'back',
            4: 'forward',
        };
        const mouseEvent = {
            type: 'click',
            x: position.x,
            y: position.y,
            button: buttonMap[button] || 'left',
        };
        this.emit('gesture:mouse-event', mouseEvent);
    }
    /**
     * Emit mouse scroll event
     */
    emitMouseScroll(gesture, amount) {
        const position = gesture.touches[0];
        const mouseEvent = {
            type: 'wheel',
            x: position.x,
            y: position.y,
            button: 'left',
            wheel: {
                deltaX: 0,
                deltaY: amount,
            },
        };
        this.emit('gesture:mouse-event', mouseEvent);
    }
    /**
     * Emit keyboard shortcut
     */
    emitKeyboardShortcut(gesture, keys) {
        keys.forEach((key) => {
            const keyboardEvent = {
                type: 'keydown',
                key,
                code: key,
                modifiers: {
                    ctrl: false,
                    alt: false,
                    shift: false,
                    meta: false,
                },
            };
            this.emit('gesture:keyboard-event', keyboardEvent);
        });
        // Release keys
        setTimeout(() => {
            keys.reverse().forEach((key) => {
                const keyboardEvent = {
                    type: 'keyup',
                    key,
                    code: key,
                    modifiers: {
                        ctrl: false,
                        alt: false,
                        shift: false,
                        meta: false,
                    },
                };
                this.emit('gesture:keyboard-event', keyboardEvent);
            });
        }, 50);
    }
    /**
     * Clean up old gestures
     */
    cleanupGestures() {
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
    addGestureMapping(mapping) {
        this.gestureMappings.set(mapping.gesture, mapping);
        electron_log_1.default.info(`Added gesture mapping: ${mapping.gesture} -> ${mapping.action}`);
    }
    /**
     * Remove gesture mapping
     */
    removeGestureMapping(gestureType) {
        this.gestureMappings.delete(gestureType);
        electron_log_1.default.info(`Removed gesture mapping: ${gestureType}`);
    }
    /**
     * Get gesture mappings
     */
    getGestureMappings() {
        return Array.from(this.gestureMappings.values());
    }
    /**
     * Update settings
     */
    updateSettings(options) {
        Object.assign(this.options, options);
    }
    /**
     * Get current settings
     */
    getSettings() {
        return { ...this.options };
    }
}
exports.GestureTranslationService = GestureTranslationService;
// Export singleton instance
exports.gestureTranslationService = new GestureTranslationService();
//# sourceMappingURL=gesture-translation.js.map