import { z } from 'zod';

// ============================================
// Device & Platform Types
// ============================================

export enum Platform {
  MACOS = 'macos',
  WINDOWS = 'windows',
  LINUX = 'linux',
  IOS = 'ios',
  ANDROID = 'android',
}

export enum DeviceType {
  DESKTOP = 'desktop',
  LAPTOP = 'laptop',
  TABLET = 'tablet',
  PHONE = 'phone',
}

export interface Device {
  id: string;
  name: string;
  platform: Platform;
  type: DeviceType;
  hostname: string;
  ip: string;
  port: number;
  publicKey: string;
  capabilities: DeviceCapabilities;
  status: DeviceStatus;
  lastSeen: Date;
  paired: boolean;
  trusted: boolean;
  metadata: {
    os: string;
    version: string;
    arch: string;
    model?: string;
  };
}

export interface DeviceCapabilities {
  clipboard: boolean;
  fileTransfer: boolean;
  notifications: boolean;
  keyboard: boolean;
  mouse: boolean;
  screen: boolean;
  audio: boolean;
  camera: boolean;
  touch: boolean;
  stylus: boolean;
  biometric: boolean;
  storage: {
    available: number;
    total: number;
  };
}

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  CONNECTING = 'connecting',
  DISCONNECTED = 'disconnected',
  SLEEPING = 'sleeping',
  ERROR = 'error',
}

// ============================================
// Connection & Communication Types
// ============================================

export interface Connection {
  id: string;
  localDevice: Device;
  remoteDevice: Device;
  protocol: ConnectionProtocol;
  encryption: EncryptionInfo;
  quality: ConnectionQuality;
  startedAt: Date;
  stats: ConnectionStats;
}

export enum ConnectionProtocol {
  WEBRTC = 'webrtc',
  WEBSOCKET = 'websocket',
  TCP = 'tcp',
  UDP = 'udp',
  BLUETOOTH = 'bluetooth',
}

export interface EncryptionInfo {
  algorithm: string;
  keyExchange: string;
  publicKey: string;
  fingerprint: string;
  verified: boolean;
}

export interface ConnectionQuality {
  latency: number;
  bandwidth: number;
  packetLoss: number;
  jitter: number;
  strength: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface ConnectionStats {
  bytesSent: number;
  bytesReceived: number;
  messagesSent: number;
  messagesReceived: number;
  errors: number;
  reconnects: number;
}

// ============================================
// Message & Event Types
// ============================================

export enum MessageType {
  // System
  HANDSHAKE = 'handshake',
  HEARTBEAT = 'heartbeat',
  ACK = 'ack',
  ERROR = 'error',
  
  // Clipboard
  CLIPBOARD_TEXT = 'clipboard:text',
  CLIPBOARD_IMAGE = 'clipboard:image',
  CLIPBOARD_FILE = 'clipboard:file',
  CLIPBOARD_HTML = 'clipboard:html',
  
  // File Transfer
  FILE_OFFER = 'file:offer',
  FILE_ACCEPT = 'file:accept',
  FILE_REJECT = 'file:reject',
  FILE_CHUNK = 'file:chunk',
  FILE_COMPLETE = 'file:complete',
  FILE_CANCEL = 'file:cancel',
  
  // Screen
  SCREEN_SHARE_START = 'screen:share:start',
  SCREEN_SHARE_STOP = 'screen:share:stop',
  SCREEN_FRAME = 'screen:frame',
  SCREEN_CONTROL = 'screen:control',
  
  // Input
  KEYBOARD_EVENT = 'input:keyboard',
  MOUSE_EVENT = 'input:mouse',
  TOUCH_EVENT = 'input:touch',
  STYLUS_EVENT = 'input:stylus',
  GESTURE_EVENT = 'input:gesture',
  
  // Notifications
  NOTIFICATION_SHOW = 'notification:show',
  NOTIFICATION_CLICK = 'notification:click',
  NOTIFICATION_DISMISS = 'notification:dismiss',
  
  // System Control
  SYSTEM_LOCK = 'system:lock',
  SYSTEM_UNLOCK = 'system:unlock',
  SYSTEM_SLEEP = 'system:sleep',
  SYSTEM_WAKE = 'system:wake',
  SYSTEM_SHUTDOWN = 'system:shutdown',
  
  // Audio/Video
  AUDIO_STREAM_START = 'av:audio:start',
  AUDIO_STREAM_STOP = 'av:audio:stop',
  VIDEO_STREAM_START = 'av:video:start',
  VIDEO_STREAM_STOP = 'av:video:stop',
  
  // Browser
  BROWSER_TAB_SYNC = 'browser:tab:sync',
  BROWSER_BOOKMARK_SYNC = 'browser:bookmark:sync',
  BROWSER_PASSWORD_SYNC = 'browser:password:sync',
}

export interface Message<T = any> {
  id: string;
  type: MessageType;
  from: string;
  to: string;
  payload: T;
  timestamp: Date;
  encrypted: boolean;
  compressed: boolean;
  priority: MessagePriority;
  requiresAck: boolean;
}

export enum MessagePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  URGENT = 3,
}

// ============================================
// Feature-Specific Types
// ============================================

// Clipboard
export interface ClipboardData {
  type: 'text' | 'image' | 'file' | 'html';
  data: string | Buffer;
  format?: string;
  metadata?: {
    source?: string;
    timestamp?: Date;
    size?: number;
  };
}

// File Transfer
export interface FileTransfer {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
  chunks: number;
  chunkSize: number;
  currentChunk: number;
  progress: number;
  speed: number;
  status: FileTransferStatus;
  startedAt: Date;
  estimatedCompletion?: Date;
}

export enum FileTransferStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  TRANSFERRING = 'transferring',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ERROR = 'error',
}

// Screen Sharing
export interface ScreenShare {
  id: string;
  sourceDevice: string;
  targetDevice: string;
  display: number;
  resolution: { width: number; height: number };
  frameRate: number;
  quality: 'low' | 'medium' | 'high' | 'lossless';
  codec: string;
  allowControl: boolean;
  status: 'active' | 'paused' | 'stopped';
}

// Input Events
export interface KeyboardEvent {
  key: string;
  code: string;
  modifiers: {
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
    meta: boolean;
  };
  type: 'keydown' | 'keyup' | 'keypress';
}

export interface MouseEvent {
  x: number;
  y: number;
  button: 'left' | 'right' | 'middle' | 'back' | 'forward';
  type: 'move' | 'down' | 'up' | 'click' | 'dblclick' | 'wheel';
  wheel?: { deltaX: number; deltaY: number };
}

export interface TouchEvent {
  touches: Array<{
    id: number;
    x: number;
    y: number;
    force: number;
  }>;
  type: 'start' | 'move' | 'end' | 'cancel';
}

// Notifications
export interface Notification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  actions?: Array<{
    id: string;
    title: string;
    icon?: string;
  }>;
  sound?: string;
  vibrate?: number[];
  urgency: 'low' | 'normal' | 'critical';
  timeout?: number;
}

// ============================================
// Security Types
// ============================================

export interface SecurityConfig {
  encryption: {
    enabled: boolean;
    algorithm: 'aes-256-gcm' | 'chacha20-poly1305';
    keyDerivation: 'pbkdf2' | 'scrypt' | 'argon2';
  };
  authentication: {
    method: 'password' | 'pin' | 'biometric' | 'certificate';
    twoFactor: boolean;
    sessionTimeout: number;
  };
  permissions: {
    clipboard: PermissionLevel;
    fileTransfer: PermissionLevel;
    screenShare: PermissionLevel;
    remoteControl: PermissionLevel;
    systemControl: PermissionLevel;
    notifications: PermissionLevel;
  };
  network: {
    allowedIPs: string[];
    blockedIPs: string[];
    requireVPN: boolean;
    localOnly: boolean;
  };
}

export enum PermissionLevel {
  DENIED = 'denied',
  ASK = 'ask',
  ALLOWED = 'allowed',
  ALWAYS = 'always',
}

// ============================================
// Settings & Preferences
// ============================================

export interface Settings {
  general: {
    deviceName: string;
    autoStart: boolean;
    startMinimized: boolean;
    checkUpdates: boolean;
    language: string;
    theme: 'light' | 'dark' | 'auto';
  };
  features: {
    [key: string]: {
      enabled: boolean;
      settings: Record<string, any>;
    };
  };
  shortcuts: {
    [action: string]: string;
  };
  advanced: {
    port: number;
    bufferSize: number;
    maxConnections: number;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    enableTelemetry: boolean;
  };
}

// ============================================
// Activity & Logging Types
// ============================================

export interface Activity {
  id: string;
  type: ActivityType;
  device: string;
  description: string;
  details?: any;
  timestamp: Date;
  duration?: number;
  status: 'success' | 'failure' | 'warning';
}

export enum ActivityType {
  CONNECTION = 'connection',
  DISCONNECTION = 'disconnection',
  FILE_TRANSFER = 'file_transfer',
  CLIPBOARD_SYNC = 'clipboard_sync',
  SCREEN_SHARE = 'screen_share',
  REMOTE_CONTROL = 'remote_control',
  NOTIFICATION = 'notification',
  ERROR = 'error',
  SECURITY_EVENT = 'security_event',
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
}

// ============================================
// Event Emitter Types
// ============================================

export interface PortalFusionEvents {
  // Connection events
  'device:discovered': (device: Device) => void;
  'device:connected': (device: Device) => void;
  'device:disconnected': (device: Device) => void;
  'device:paired': (device: Device) => void;
  
  // Message events
  'message:received': (message: Message) => void;
  'message:sent': (message: Message) => void;
  'message:error': (error: Error, message: Message) => void;
  
  // Feature events
  'clipboard:changed': (data: ClipboardData) => void;
  'file:transfer:start': (transfer: FileTransfer) => void;
  'file:transfer:progress': (transfer: FileTransfer) => void;
  'file:transfer:complete': (transfer: FileTransfer) => void;
  'screen:share:start': (share: ScreenShare) => void;
  'screen:share:stop': (share: ScreenShare) => void;
  
  // System events
  'error': (error: Error) => void;
  'warning': (warning: string) => void;
  'activity': (activity: Activity) => void;
  
  // Index signature to allow dynamic event names
  [key: string]: (...args: any[]) => void;
}

// ============================================
// Validation Schemas (using Zod)
// ============================================

export const DeviceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  platform: z.nativeEnum(Platform),
  type: z.nativeEnum(DeviceType),
  hostname: z.string(),
  ip: z.string().ip(),
  port: z.number().min(1).max(65535),
  publicKey: z.string(),
  paired: z.boolean(),
  trusted: z.boolean(),
});

export const MessageSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(MessageType),
  from: z.string().uuid(),
  to: z.string().uuid(),
  payload: z.any(),
  timestamp: z.date(),
  encrypted: z.boolean(),
  compressed: z.boolean(),
  priority: z.nativeEnum(MessagePriority),
  requiresAck: z.boolean(),
});

export const FileTransferSchema = z.object({
  id: z.string().uuid(),
  fileName: z.string(),
  fileSize: z.number().positive(),
  mimeType: z.string(),
  checksum: z.string(),
  chunks: z.number().positive(),
  chunkSize: z.number().positive(),
  currentChunk: z.number().min(0),
  progress: z.number().min(0).max(100),
  status: z.nativeEnum(FileTransferStatus),
});

// ============================================
// Utility Types
// ============================================

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type AsyncResult<T, E = Error> = Promise<
  | { success: true; data: T }
  | { success: false; error: E }
>;

export type EventHandler<T> = (data: T) => void | Promise<void>;

export type Middleware<T, R> = (
  data: T,
  next: () => R | Promise<R>
) => R | Promise<R>;
