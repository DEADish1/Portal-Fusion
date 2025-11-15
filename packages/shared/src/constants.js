"use strict";
// ============================================
// Network Constants
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.PATTERNS = exports.FEATURES = exports.ERROR_CODES = exports.getPlatformPaths = exports.SETTINGS_STORAGE_KEY = exports.THEME_STORAGE_KEY = exports.TOAST_DURATION = exports.ANIMATION_DURATION = exports.CACHE_SIZE = exports.COMPRESSION_THRESHOLD = exports.MESSAGE_BATCH_SIZE = exports.MAX_MESSAGE_QUEUE_SIZE = exports.GESTURE_THRESHOLD = exports.TOUCH_HOLD_THRESHOLD = exports.KEYBOARD_REPEAT_INTERVAL = exports.KEYBOARD_REPEAT_DELAY = exports.MOUSE_SMOOTHING = exports.NOTIFICATION_ICON_SIZE = exports.MAX_NOTIFICATION_ACTIONS = exports.NOTIFICATION_TIMEOUT = exports.CLIPBOARD_SYNC_DELAY = exports.MAX_CLIPBOARD_IMAGE_SIZE = exports.MAX_CLIPBOARD_TEXT_SIZE = exports.QUALITY_PRESETS = exports.MAX_FRAME_RATE = exports.MIN_FRAME_RATE = exports.DEFAULT_FRAME_RATE = exports.QR_CODE_SIZE = exports.PIN_LENGTH = exports.SESSION_TIMEOUT = exports.PBKDF2_ITERATIONS = exports.TAG_LENGTH = exports.IV_LENGTH = exports.SALT_LENGTH = exports.KEY_LENGTH = exports.MAX_CONCURRENT_TRANSFERS = exports.TRANSFER_TIMEOUT = exports.MAX_FILE_SIZE = exports.CHUNK_SIZE = exports.MAX_RECONNECT_ATTEMPTS = exports.RECONNECT_INTERVAL = exports.HEARTBEAT_INTERVAL = exports.CONNECTION_TIMEOUT = exports.MDNS_SERVICE_TYPE = exports.SERVICE_NAME = exports.WEBRTC_PORT = exports.DISCOVERY_PORT = exports.DEFAULT_PORT = void 0;
exports.DEFAULT_PORT = 7777;
exports.DISCOVERY_PORT = 7778;
exports.WEBRTC_PORT = 7779;
exports.SERVICE_NAME = 'portal-fusion';
exports.MDNS_SERVICE_TYPE = '_portal-fusion._tcp';
exports.CONNECTION_TIMEOUT = 30000; // 30 seconds
exports.HEARTBEAT_INTERVAL = 5000; // 5 seconds
exports.RECONNECT_INTERVAL = 3000; // 3 seconds
exports.MAX_RECONNECT_ATTEMPTS = 10;
// ============================================
// Transfer Constants
// ============================================
exports.CHUNK_SIZE = 64 * 1024; // 64KB chunks for file transfer
exports.MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024; // 10GB max file size
exports.TRANSFER_TIMEOUT = 60000; // 60 seconds per chunk
exports.MAX_CONCURRENT_TRANSFERS = 5;
// ============================================
// Security Constants
// ============================================
exports.KEY_LENGTH = 256;
exports.SALT_LENGTH = 32;
exports.IV_LENGTH = 16;
exports.TAG_LENGTH = 16;
exports.PBKDF2_ITERATIONS = 100000;
exports.SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
exports.PIN_LENGTH = 6;
exports.QR_CODE_SIZE = 256;
// ============================================
// Screen Sharing Constants
// ============================================
exports.DEFAULT_FRAME_RATE = 30;
exports.MIN_FRAME_RATE = 5;
exports.MAX_FRAME_RATE = 60;
exports.QUALITY_PRESETS = {
    low: {
        width: 854,
        height: 480,
        bitrate: 500000,
        frameRate: 15,
    },
    medium: {
        width: 1280,
        height: 720,
        bitrate: 1500000,
        frameRate: 30,
    },
    high: {
        width: 1920,
        height: 1080,
        bitrate: 4000000,
        frameRate: 30,
    },
    lossless: {
        width: -1, // Use native resolution
        height: -1,
        bitrate: 10000000,
        frameRate: 60,
    },
};
// ============================================
// Clipboard Constants
// ============================================
exports.MAX_CLIPBOARD_TEXT_SIZE = 10 * 1024 * 1024; // 10MB
exports.MAX_CLIPBOARD_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB
exports.CLIPBOARD_SYNC_DELAY = 500; // 500ms debounce
// ============================================
// Notification Constants
// ============================================
exports.NOTIFICATION_TIMEOUT = 10000; // 10 seconds default
exports.MAX_NOTIFICATION_ACTIONS = 3;
exports.NOTIFICATION_ICON_SIZE = 256;
// ============================================
// Input Constants
// ============================================
exports.MOUSE_SMOOTHING = true;
exports.KEYBOARD_REPEAT_DELAY = 500;
exports.KEYBOARD_REPEAT_INTERVAL = 50;
exports.TOUCH_HOLD_THRESHOLD = 500;
exports.GESTURE_THRESHOLD = 50;
// ============================================
// Performance Constants
// ============================================
exports.MAX_MESSAGE_QUEUE_SIZE = 1000;
exports.MESSAGE_BATCH_SIZE = 10;
exports.COMPRESSION_THRESHOLD = 1024; // Compress messages larger than 1KB
exports.CACHE_SIZE = 100 * 1024 * 1024; // 100MB cache
// ============================================
// UI Constants
// ============================================
exports.ANIMATION_DURATION = 200;
exports.TOAST_DURATION = 3000;
exports.THEME_STORAGE_KEY = 'portal-fusion-theme';
exports.SETTINGS_STORAGE_KEY = 'portal-fusion-settings';
// ============================================
// Platform-Specific Paths
// ============================================
const getPlatformPaths = () => {
    const platform = process.platform;
    const home = process.env.HOME || process.env.USERPROFILE || '';
    switch (platform) {
        case 'darwin':
            return {
                config: `${home}/Library/Application Support/Portal Fusion`,
                cache: `${home}/Library/Caches/Portal Fusion`,
                logs: `${home}/Library/Logs/Portal Fusion`,
                data: `${home}/Library/Application Support/Portal Fusion/data`,
            };
        case 'win32':
            return {
                config: `${process.env.APPDATA}/Portal Fusion`,
                cache: `${process.env.LOCALAPPDATA}/Portal Fusion/Cache`,
                logs: `${process.env.LOCALAPPDATA}/Portal Fusion/Logs`,
                data: `${process.env.APPDATA}/Portal Fusion/Data`,
            };
        default: // Linux and others
            return {
                config: `${home}/.config/portal-fusion`,
                cache: `${home}/.cache/portal-fusion`,
                logs: `${home}/.local/share/portal-fusion/logs`,
                data: `${home}/.local/share/portal-fusion/data`,
            };
    }
};
exports.getPlatformPaths = getPlatformPaths;
// ============================================
// Error Codes
// ============================================
exports.ERROR_CODES = {
    // Connection errors (1xxx)
    CONNECTION_FAILED: 'E1000',
    CONNECTION_TIMEOUT: 'E1001',
    CONNECTION_REFUSED: 'E1002',
    CONNECTION_LOST: 'E1003',
    // Authentication errors (2xxx)
    AUTH_FAILED: 'E2000',
    AUTH_EXPIRED: 'E2001',
    AUTH_INVALID_TOKEN: 'E2002',
    AUTH_PERMISSION_DENIED: 'E2003',
    // Transfer errors (3xxx)
    TRANSFER_FAILED: 'E3000',
    TRANSFER_CANCELLED: 'E3001',
    TRANSFER_CHECKSUM_MISMATCH: 'E3002',
    TRANSFER_SIZE_EXCEEDED: 'E3003',
    // Protocol errors (4xxx)
    PROTOCOL_VERSION_MISMATCH: 'E4000',
    PROTOCOL_INVALID_MESSAGE: 'E4001',
    PROTOCOL_UNSUPPORTED_FEATURE: 'E4002',
    // System errors (5xxx)
    SYSTEM_PERMISSION_DENIED: 'E5000',
    SYSTEM_RESOURCE_UNAVAILABLE: 'E5001',
    SYSTEM_OPERATION_FAILED: 'E5002',
    // Unknown errors (9xxx)
    UNKNOWN_ERROR: 'E9999',
};
// ============================================
// Feature Flags
// ============================================
exports.FEATURES = {
    CLIPBOARD_SYNC: true,
    FILE_TRANSFER: true,
    SCREEN_SHARE: true,
    REMOTE_CONTROL: true,
    NOTIFICATIONS: true,
    BROWSER_SYNC: true,
    AUDIO_ROUTING: true,
    CAMERA_SHARING: true,
    TOUCH_INPUT: true,
    STYLUS_INPUT: true,
    BIOMETRIC_AUTH: false, // Disabled by default
    END_TO_END_ENCRYPTION: true,
    COMPRESSION: true,
    AUTO_DISCOVERY: true,
    CLOUD_RELAY: false, // Disabled by default
};
// ============================================
// Regex Patterns
// ============================================
exports.PATTERNS = {
    IP_ADDRESS: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    MAC_ADDRESS: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    SEMVER: /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
};
//# sourceMappingURL=constants.js.map