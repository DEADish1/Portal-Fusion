import { z } from 'zod';
export declare enum Platform {
    MACOS = "macos",
    WINDOWS = "windows",
    LINUX = "linux",
    IOS = "ios",
    ANDROID = "android"
}
export declare enum DeviceType {
    DESKTOP = "desktop",
    LAPTOP = "laptop",
    TABLET = "tablet",
    PHONE = "phone"
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
export declare enum DeviceStatus {
    ONLINE = "online",
    OFFLINE = "offline",
    CONNECTING = "connecting",
    DISCONNECTED = "disconnected",
    SLEEPING = "sleeping",
    ERROR = "error"
}
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
export declare enum ConnectionProtocol {
    WEBRTC = "webrtc",
    WEBSOCKET = "websocket",
    TCP = "tcp",
    UDP = "udp",
    BLUETOOTH = "bluetooth"
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
export declare enum MessageType {
    HANDSHAKE = "handshake",
    HEARTBEAT = "heartbeat",
    ACK = "ack",
    ERROR = "error",
    CLIPBOARD_TEXT = "clipboard:text",
    CLIPBOARD_IMAGE = "clipboard:image",
    CLIPBOARD_FILE = "clipboard:file",
    CLIPBOARD_HTML = "clipboard:html",
    FILE_OFFER = "file:offer",
    FILE_ACCEPT = "file:accept",
    FILE_REJECT = "file:reject",
    FILE_CHUNK = "file:chunk",
    FILE_COMPLETE = "file:complete",
    FILE_CANCEL = "file:cancel",
    SCREEN_SHARE_START = "screen:share:start",
    SCREEN_SHARE_STOP = "screen:share:stop",
    SCREEN_FRAME = "screen:frame",
    SCREEN_CONTROL = "screen:control",
    KEYBOARD_EVENT = "input:keyboard",
    MOUSE_EVENT = "input:mouse",
    TOUCH_EVENT = "input:touch",
    STYLUS_EVENT = "input:stylus",
    GESTURE_EVENT = "input:gesture",
    NOTIFICATION_SHOW = "notification:show",
    NOTIFICATION_CLICK = "notification:click",
    NOTIFICATION_DISMISS = "notification:dismiss",
    SYSTEM_LOCK = "system:lock",
    SYSTEM_UNLOCK = "system:unlock",
    SYSTEM_SLEEP = "system:sleep",
    SYSTEM_WAKE = "system:wake",
    SYSTEM_SHUTDOWN = "system:shutdown",
    AUDIO_STREAM_START = "av:audio:start",
    AUDIO_STREAM_STOP = "av:audio:stop",
    VIDEO_STREAM_START = "av:video:start",
    VIDEO_STREAM_STOP = "av:video:stop",
    BROWSER_TAB_SYNC = "browser:tab:sync",
    BROWSER_BOOKMARK_SYNC = "browser:bookmark:sync",
    BROWSER_PASSWORD_SYNC = "browser:password:sync"
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
export declare enum MessagePriority {
    LOW = 0,
    NORMAL = 1,
    HIGH = 2,
    URGENT = 3
}
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
export declare enum FileTransferStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    REJECTED = "rejected",
    TRANSFERRING = "transferring",
    PAUSED = "paused",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    ERROR = "error"
}
export interface ScreenShare {
    id: string;
    sourceDevice: string;
    targetDevice: string;
    display: number;
    resolution: {
        width: number;
        height: number;
    };
    frameRate: number;
    quality: 'low' | 'medium' | 'high' | 'lossless';
    codec: string;
    allowControl: boolean;
    status: 'active' | 'paused' | 'stopped';
}
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
    wheel?: {
        deltaX: number;
        deltaY: number;
    };
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
export declare enum PermissionLevel {
    DENIED = "denied",
    ASK = "ask",
    ALLOWED = "allowed",
    ALWAYS = "always"
}
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
export declare enum ActivityType {
    CONNECTION = "connection",
    DISCONNECTION = "disconnection",
    FILE_TRANSFER = "file_transfer",
    CLIPBOARD_SYNC = "clipboard_sync",
    SCREEN_SHARE = "screen_share",
    REMOTE_CONTROL = "remote_control",
    NOTIFICATION = "notification",
    ERROR = "error",
    SECURITY_EVENT = "security_event"
}
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
export interface PortalFusionEvents {
    'device:discovered': (device: Device) => void;
    'device:connected': (device: Device) => void;
    'device:disconnected': (device: Device) => void;
    'device:paired': (device: Device) => void;
    'message:received': (message: Message) => void;
    'message:sent': (message: Message) => void;
    'message:error': (error: Error, message: Message) => void;
    'clipboard:changed': (data: ClipboardData) => void;
    'file:transfer:start': (transfer: FileTransfer) => void;
    'file:transfer:progress': (transfer: FileTransfer) => void;
    'file:transfer:complete': (transfer: FileTransfer) => void;
    'screen:share:start': (share: ScreenShare) => void;
    'screen:share:stop': (share: ScreenShare) => void;
    'error': (error: Error) => void;
    'warning': (warning: string) => void;
    'activity': (activity: Activity) => void;
    [key: string]: (...args: any[]) => void;
}
export declare const DeviceSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    platform: z.ZodNativeEnum<typeof Platform>;
    type: z.ZodNativeEnum<typeof DeviceType>;
    hostname: z.ZodString;
    ip: z.ZodString;
    port: z.ZodNumber;
    publicKey: z.ZodString;
    paired: z.ZodBoolean;
    trusted: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    platform: Platform;
    type: DeviceType;
    hostname: string;
    ip: string;
    port: number;
    publicKey: string;
    paired: boolean;
    trusted: boolean;
}, {
    name: string;
    id: string;
    platform: Platform;
    type: DeviceType;
    hostname: string;
    ip: string;
    port: number;
    publicKey: string;
    paired: boolean;
    trusted: boolean;
}>;
export declare const MessageSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodNativeEnum<typeof MessageType>;
    from: z.ZodString;
    to: z.ZodString;
    payload: z.ZodAny;
    timestamp: z.ZodDate;
    encrypted: z.ZodBoolean;
    compressed: z.ZodBoolean;
    priority: z.ZodNativeEnum<typeof MessagePriority>;
    requiresAck: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: MessageType;
    from: string;
    to: string;
    timestamp: Date;
    encrypted: boolean;
    compressed: boolean;
    priority: MessagePriority;
    requiresAck: boolean;
    payload?: any;
}, {
    id: string;
    type: MessageType;
    from: string;
    to: string;
    timestamp: Date;
    encrypted: boolean;
    compressed: boolean;
    priority: MessagePriority;
    requiresAck: boolean;
    payload?: any;
}>;
export declare const FileTransferSchema: z.ZodObject<{
    id: z.ZodString;
    fileName: z.ZodString;
    fileSize: z.ZodNumber;
    mimeType: z.ZodString;
    checksum: z.ZodString;
    chunks: z.ZodNumber;
    chunkSize: z.ZodNumber;
    currentChunk: z.ZodNumber;
    progress: z.ZodNumber;
    status: z.ZodNativeEnum<typeof FileTransferStatus>;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: FileTransferStatus;
    fileName: string;
    fileSize: number;
    mimeType: string;
    checksum: string;
    chunks: number;
    chunkSize: number;
    currentChunk: number;
    progress: number;
}, {
    id: string;
    status: FileTransferStatus;
    fileName: string;
    fileSize: number;
    mimeType: string;
    checksum: string;
    chunks: number;
    chunkSize: number;
    currentChunk: number;
    progress: number;
}>;
export type DeepPartial<T> = {
    [P in keyof T]?: DeepPartial<T[P]>;
};
export type AsyncResult<T, E = Error> = Promise<{
    success: true;
    data: T;
} | {
    success: false;
    error: E;
}>;
export type EventHandler<T> = (data: T) => void | Promise<void>;
export type Middleware<T, R> = (data: T, next: () => R | Promise<R>) => R | Promise<R>;
//# sourceMappingURL=types.d.ts.map