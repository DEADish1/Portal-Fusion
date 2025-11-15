"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileTransferSchema = exports.MessageSchema = exports.DeviceSchema = exports.ActivityType = exports.PermissionLevel = exports.FileTransferStatus = exports.MessagePriority = exports.MessageType = exports.ConnectionProtocol = exports.DeviceStatus = exports.DeviceType = exports.Platform = void 0;
const zod_1 = require("zod");
// ============================================
// Device & Platform Types
// ============================================
var Platform;
(function (Platform) {
    Platform["MACOS"] = "macos";
    Platform["WINDOWS"] = "windows";
    Platform["LINUX"] = "linux";
    Platform["IOS"] = "ios";
    Platform["ANDROID"] = "android";
})(Platform || (exports.Platform = Platform = {}));
var DeviceType;
(function (DeviceType) {
    DeviceType["DESKTOP"] = "desktop";
    DeviceType["LAPTOP"] = "laptop";
    DeviceType["TABLET"] = "tablet";
    DeviceType["PHONE"] = "phone";
})(DeviceType || (exports.DeviceType = DeviceType = {}));
var DeviceStatus;
(function (DeviceStatus) {
    DeviceStatus["ONLINE"] = "online";
    DeviceStatus["OFFLINE"] = "offline";
    DeviceStatus["CONNECTING"] = "connecting";
    DeviceStatus["DISCONNECTED"] = "disconnected";
    DeviceStatus["SLEEPING"] = "sleeping";
    DeviceStatus["ERROR"] = "error";
})(DeviceStatus || (exports.DeviceStatus = DeviceStatus = {}));
var ConnectionProtocol;
(function (ConnectionProtocol) {
    ConnectionProtocol["WEBRTC"] = "webrtc";
    ConnectionProtocol["WEBSOCKET"] = "websocket";
    ConnectionProtocol["TCP"] = "tcp";
    ConnectionProtocol["UDP"] = "udp";
    ConnectionProtocol["BLUETOOTH"] = "bluetooth";
})(ConnectionProtocol || (exports.ConnectionProtocol = ConnectionProtocol = {}));
// ============================================
// Message & Event Types
// ============================================
var MessageType;
(function (MessageType) {
    // System
    MessageType["HANDSHAKE"] = "handshake";
    MessageType["HEARTBEAT"] = "heartbeat";
    MessageType["ACK"] = "ack";
    MessageType["ERROR"] = "error";
    // Clipboard
    MessageType["CLIPBOARD_TEXT"] = "clipboard:text";
    MessageType["CLIPBOARD_IMAGE"] = "clipboard:image";
    MessageType["CLIPBOARD_FILE"] = "clipboard:file";
    MessageType["CLIPBOARD_HTML"] = "clipboard:html";
    // File Transfer
    MessageType["FILE_OFFER"] = "file:offer";
    MessageType["FILE_ACCEPT"] = "file:accept";
    MessageType["FILE_REJECT"] = "file:reject";
    MessageType["FILE_CHUNK"] = "file:chunk";
    MessageType["FILE_COMPLETE"] = "file:complete";
    MessageType["FILE_CANCEL"] = "file:cancel";
    // Screen
    MessageType["SCREEN_SHARE_START"] = "screen:share:start";
    MessageType["SCREEN_SHARE_STOP"] = "screen:share:stop";
    MessageType["SCREEN_FRAME"] = "screen:frame";
    MessageType["SCREEN_CONTROL"] = "screen:control";
    // Input
    MessageType["KEYBOARD_EVENT"] = "input:keyboard";
    MessageType["MOUSE_EVENT"] = "input:mouse";
    MessageType["TOUCH_EVENT"] = "input:touch";
    MessageType["STYLUS_EVENT"] = "input:stylus";
    MessageType["GESTURE_EVENT"] = "input:gesture";
    // Notifications
    MessageType["NOTIFICATION_SHOW"] = "notification:show";
    MessageType["NOTIFICATION_CLICK"] = "notification:click";
    MessageType["NOTIFICATION_DISMISS"] = "notification:dismiss";
    // System Control
    MessageType["SYSTEM_LOCK"] = "system:lock";
    MessageType["SYSTEM_UNLOCK"] = "system:unlock";
    MessageType["SYSTEM_SLEEP"] = "system:sleep";
    MessageType["SYSTEM_WAKE"] = "system:wake";
    MessageType["SYSTEM_SHUTDOWN"] = "system:shutdown";
    // Audio/Video
    MessageType["AUDIO_STREAM_START"] = "av:audio:start";
    MessageType["AUDIO_STREAM_STOP"] = "av:audio:stop";
    MessageType["VIDEO_STREAM_START"] = "av:video:start";
    MessageType["VIDEO_STREAM_STOP"] = "av:video:stop";
    // Browser
    MessageType["BROWSER_TAB_SYNC"] = "browser:tab:sync";
    MessageType["BROWSER_BOOKMARK_SYNC"] = "browser:bookmark:sync";
    MessageType["BROWSER_PASSWORD_SYNC"] = "browser:password:sync";
})(MessageType || (exports.MessageType = MessageType = {}));
var MessagePriority;
(function (MessagePriority) {
    MessagePriority[MessagePriority["LOW"] = 0] = "LOW";
    MessagePriority[MessagePriority["NORMAL"] = 1] = "NORMAL";
    MessagePriority[MessagePriority["HIGH"] = 2] = "HIGH";
    MessagePriority[MessagePriority["URGENT"] = 3] = "URGENT";
})(MessagePriority || (exports.MessagePriority = MessagePriority = {}));
var FileTransferStatus;
(function (FileTransferStatus) {
    FileTransferStatus["PENDING"] = "pending";
    FileTransferStatus["ACCEPTED"] = "accepted";
    FileTransferStatus["REJECTED"] = "rejected";
    FileTransferStatus["TRANSFERRING"] = "transferring";
    FileTransferStatus["PAUSED"] = "paused";
    FileTransferStatus["COMPLETED"] = "completed";
    FileTransferStatus["CANCELLED"] = "cancelled";
    FileTransferStatus["ERROR"] = "error";
})(FileTransferStatus || (exports.FileTransferStatus = FileTransferStatus = {}));
var PermissionLevel;
(function (PermissionLevel) {
    PermissionLevel["DENIED"] = "denied";
    PermissionLevel["ASK"] = "ask";
    PermissionLevel["ALLOWED"] = "allowed";
    PermissionLevel["ALWAYS"] = "always";
})(PermissionLevel || (exports.PermissionLevel = PermissionLevel = {}));
var ActivityType;
(function (ActivityType) {
    ActivityType["CONNECTION"] = "connection";
    ActivityType["DISCONNECTION"] = "disconnection";
    ActivityType["FILE_TRANSFER"] = "file_transfer";
    ActivityType["CLIPBOARD_SYNC"] = "clipboard_sync";
    ActivityType["SCREEN_SHARE"] = "screen_share";
    ActivityType["REMOTE_CONTROL"] = "remote_control";
    ActivityType["NOTIFICATION"] = "notification";
    ActivityType["ERROR"] = "error";
    ActivityType["SECURITY_EVENT"] = "security_event";
})(ActivityType || (exports.ActivityType = ActivityType = {}));
// ============================================
// Validation Schemas (using Zod)
// ============================================
exports.DeviceSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1).max(50),
    platform: zod_1.z.nativeEnum(Platform),
    type: zod_1.z.nativeEnum(DeviceType),
    hostname: zod_1.z.string(),
    ip: zod_1.z.string().ip(),
    port: zod_1.z.number().min(1).max(65535),
    publicKey: zod_1.z.string(),
    paired: zod_1.z.boolean(),
    trusted: zod_1.z.boolean(),
});
exports.MessageSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: zod_1.z.nativeEnum(MessageType),
    from: zod_1.z.string().uuid(),
    to: zod_1.z.string().uuid(),
    payload: zod_1.z.any(),
    timestamp: zod_1.z.date(),
    encrypted: zod_1.z.boolean(),
    compressed: zod_1.z.boolean(),
    priority: zod_1.z.nativeEnum(MessagePriority),
    requiresAck: zod_1.z.boolean(),
});
exports.FileTransferSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    fileName: zod_1.z.string(),
    fileSize: zod_1.z.number().positive(),
    mimeType: zod_1.z.string(),
    checksum: zod_1.z.string(),
    chunks: zod_1.z.number().positive(),
    chunkSize: zod_1.z.number().positive(),
    currentChunk: zod_1.z.number().min(0),
    progress: zod_1.z.number().min(0).max(100),
    status: zod_1.z.nativeEnum(FileTransferStatus),
});
//# sourceMappingURL=types.js.map