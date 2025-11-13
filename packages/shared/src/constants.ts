// ============================================
// Network Constants
// ============================================

export const DEFAULT_PORT = 7777;
export const DISCOVERY_PORT = 7778;
export const WEBRTC_PORT = 7779;

export const SERVICE_NAME = 'crossbridge';
export const MDNS_SERVICE_TYPE = '_crossbridge._tcp';

export const CONNECTION_TIMEOUT = 30000; // 30 seconds
export const HEARTBEAT_INTERVAL = 5000; // 5 seconds
export const RECONNECT_INTERVAL = 3000; // 3 seconds
export const MAX_RECONNECT_ATTEMPTS = 10;

// ============================================
// Transfer Constants
// ============================================

export const CHUNK_SIZE = 64 * 1024; // 64KB chunks for file transfer
export const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024; // 10GB max file size
export const TRANSFER_TIMEOUT = 60000; // 60 seconds per chunk
export const MAX_CONCURRENT_TRANSFERS = 5;

// ============================================
// Security Constants
// ============================================

export const KEY_LENGTH = 256;
export const SALT_LENGTH = 32;
export const IV_LENGTH = 16;
export const TAG_LENGTH = 16;
export const PBKDF2_ITERATIONS = 100000;

export const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
export const PIN_LENGTH = 6;
export const QR_CODE_SIZE = 256;

// ============================================
// Screen Sharing Constants
// ============================================

export const DEFAULT_FRAME_RATE = 30;
export const MIN_FRAME_RATE = 5;
export const MAX_FRAME_RATE = 60;

export const QUALITY_PRESETS = {
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
} as const;

// ============================================
// Clipboard Constants
// ============================================

export const MAX_CLIPBOARD_TEXT_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_CLIPBOARD_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB
export const CLIPBOARD_SYNC_DELAY = 500; // 500ms debounce

// ============================================
// Notification Constants
// ============================================

export const NOTIFICATION_TIMEOUT = 10000; // 10 seconds default
export const MAX_NOTIFICATION_ACTIONS = 3;
export const NOTIFICATION_ICON_SIZE = 256;

// ============================================
// Input Constants
// ============================================

export const MOUSE_SMOOTHING = true;
export const KEYBOARD_REPEAT_DELAY = 500;
export const KEYBOARD_REPEAT_INTERVAL = 50;
export const TOUCH_HOLD_THRESHOLD = 500;
export const GESTURE_THRESHOLD = 50;

// ============================================
// Performance Constants
// ============================================

export const MAX_MESSAGE_QUEUE_SIZE = 1000;
export const MESSAGE_BATCH_SIZE = 10;
export const COMPRESSION_THRESHOLD = 1024; // Compress messages larger than 1KB
export const CACHE_SIZE = 100 * 1024 * 1024; // 100MB cache

// ============================================
// UI Constants
// ============================================

export const ANIMATION_DURATION = 200;
export const TOAST_DURATION = 3000;
export const THEME_STORAGE_KEY = 'crossbridge-theme';
export const SETTINGS_STORAGE_KEY = 'crossbridge-settings';

// ============================================
// Platform-Specific Paths
// ============================================

export const getPlatformPaths = () => {
  const platform = process.platform;
  const home = process.env.HOME || process.env.USERPROFILE || '';
  
  switch (platform) {
    case 'darwin':
      return {
        config: `${home}/Library/Application Support/CrossBridge`,
        cache: `${home}/Library/Caches/CrossBridge`,
        logs: `${home}/Library/Logs/CrossBridge`,
        data: `${home}/Library/Application Support/CrossBridge/data`,
      };
    case 'win32':
      return {
        config: `${process.env.APPDATA}/CrossBridge`,
        cache: `${process.env.LOCALAPPDATA}/CrossBridge/Cache`,
        logs: `${process.env.LOCALAPPDATA}/CrossBridge/Logs`,
        data: `${process.env.APPDATA}/CrossBridge/Data`,
      };
    default: // Linux and others
      return {
        config: `${home}/.config/crossbridge`,
        cache: `${home}/.cache/crossbridge`,
        logs: `${home}/.local/share/crossbridge/logs`,
        data: `${home}/.local/share/crossbridge/data`,
      };
  }
};

// ============================================
// Error Codes
// ============================================

export const ERROR_CODES = {
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
} as const;

// ============================================
// Feature Flags
// ============================================

export const FEATURES = {
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
} as const;

// ============================================
// Regex Patterns
// ============================================

export const PATTERNS = {
  IP_ADDRESS: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  MAC_ADDRESS: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  SEMVER: /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
} as const;
