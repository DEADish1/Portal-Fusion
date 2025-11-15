"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypedEventEmitter = exports.PortalFusionError = void 0;
exports.generateId = generateId;
exports.generateDeviceId = generateDeviceId;
exports.generateSessionId = generateSessionId;
exports.generatePin = generatePin;
exports.getPlatform = getPlatform;
exports.isPlatform = isPlatform;
exports.isMobile = isMobile;
exports.isDesktop = isDesktop;
exports.isValidIP = isValidIP;
exports.isValidMAC = isValidMAC;
exports.isLocalIP = isLocalIP;
exports.normalizeIP = normalizeIP;
exports.generateKeyPair = generateKeyPair;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.generateChecksum = generateChecksum;
exports.formatFileSize = formatFileSize;
exports.getMimeType = getMimeType;
exports.sanitizeFileName = sanitizeFileName;
exports.createMessage = createMessage;
exports.isHighPriority = isHighPriority;
exports.shouldCompress = shouldCompress;
exports.formatDuration = formatDuration;
exports.formatTimestamp = formatTimestamp;
exports.getRelativeTime = getRelativeTime;
exports.isValidUUID = isValidUUID;
exports.isValidSemver = isValidSemver;
exports.validateDevice = validateDevice;
exports.createError = createError;
exports.isErrorCode = isErrorCode;
exports.chunk = chunk;
exports.unique = unique;
exports.difference = difference;
exports.deepClone = deepClone;
exports.deepMerge = deepMerge;
exports.omit = omit;
exports.pick = pick;
exports.sleep = sleep;
exports.timeout = timeout;
exports.retry = retry;
exports.debounce = debounce;
exports.throttle = throttle;
const crypto_1 = __importDefault(require("crypto"));
const types_1 = require("./types");
const constants_1 = require("./constants");
// ============================================
// ID Generation Utilities
// ============================================
function generateId() {
    return crypto_1.default.randomUUID();
}
function generateDeviceId() {
    const platform = getPlatform();
    const timestamp = Date.now();
    const random = crypto_1.default.randomBytes(4).toString('hex');
    return `${platform}-${timestamp}-${random}`;
}
function generateSessionId() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
function generatePin(length = 6) {
    const digits = '0123456789';
    let pin = '';
    for (let i = 0; i < length; i++) {
        pin += digits[Math.floor(Math.random() * digits.length)];
    }
    return pin;
}
// ============================================
// Platform Detection
// ============================================
function getPlatform() {
    switch (process.platform) {
        case 'darwin':
            return types_1.Platform.MACOS;
        case 'win32':
            return types_1.Platform.WINDOWS;
        case 'linux':
            return types_1.Platform.LINUX;
        default:
            return types_1.Platform.LINUX;
    }
}
function isPlatform(platform) {
    return getPlatform() === platform;
}
function isMobile() {
    return false; // Desktop app, always false
}
function isDesktop() {
    return true; // Desktop app, always true
}
// ============================================
// Network Utilities
// ============================================
function isValidIP(ip) {
    return constants_1.PATTERNS.IP_ADDRESS.test(ip);
}
function isValidMAC(mac) {
    return constants_1.PATTERNS.MAC_ADDRESS.test(mac);
}
function isLocalIP(ip) {
    return (ip.startsWith('192.168.') ||
        ip.startsWith('10.') ||
        ip.startsWith('172.') ||
        ip === '127.0.0.1' ||
        ip === 'localhost');
}
function normalizeIP(ip) {
    if (ip === '::1')
        return '127.0.0.1';
    if (ip.includes('::ffff:'))
        return ip.replace('::ffff:', '');
    return ip;
}
// ============================================
// Encryption Utilities
// ============================================
function generateKeyPair() {
    const { publicKey, privateKey } = crypto_1.default.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
        },
    });
    return { publicKey, privateKey };
}
function hashPassword(password, salt) {
    const usedSalt = salt || crypto_1.default.randomBytes(32).toString('hex');
    const hash = crypto_1.default.pbkdf2Sync(password, usedSalt, 100000, 64, 'sha256').toString('hex');
    return { hash, salt: usedSalt };
}
function verifyPassword(password, hash, salt) {
    const testHash = crypto_1.default.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
    return testHash === hash;
}
function encrypt(data, key) {
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
    };
}
function decrypt(encrypted, key, iv, tag) {
    const decipher = crypto_1.default.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
function generateChecksum(data) {
    return crypto_1.default.createHash('sha256').update(data).digest('hex');
}
// ============================================
// File Utilities
// ============================================
function formatFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
}
function getMimeType(filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes = {
        // Images
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
        // Videos
        mp4: 'video/mp4',
        webm: 'video/webm',
        avi: 'video/x-msvideo',
        mov: 'video/quicktime',
        // Audio
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        ogg: 'audio/ogg',
        m4a: 'audio/mp4',
        // Documents
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ppt: 'application/vnd.ms-powerpoint',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        // Text
        txt: 'text/plain',
        html: 'text/html',
        css: 'text/css',
        js: 'application/javascript',
        json: 'application/json',
        xml: 'application/xml',
        // Archives
        zip: 'application/zip',
        rar: 'application/vnd.rar',
        '7z': 'application/x-7z-compressed',
        tar: 'application/x-tar',
        gz: 'application/gzip',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
}
function sanitizeFileName(filename) {
    // Remove invalid characters for all platforms
    return filename.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
}
// ============================================
// Message Utilities
// ============================================
function createMessage(type, payload, options = {}) {
    return {
        id: generateId(),
        type,
        from: options.from || '',
        to: options.to || '',
        payload,
        timestamp: new Date(),
        encrypted: options.encrypted || false,
        compressed: options.compressed || false,
        priority: options.priority || types_1.MessagePriority.NORMAL,
        requiresAck: options.requiresAck || false,
        ...options,
    };
}
function isHighPriority(message) {
    return message.priority >= types_1.MessagePriority.HIGH;
}
function shouldCompress(data) {
    const size = JSON.stringify(data).length;
    return size > 1024; // Compress if larger than 1KB
}
// ============================================
// Time Utilities
// ============================================
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    }
    else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    }
    else {
        return `${seconds}s`;
    }
}
function formatTimestamp(date) {
    return date.toLocaleString();
}
function getRelativeTime(date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0)
        return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0)
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0)
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
}
// ============================================
// Validation Utilities
// ============================================
function isValidUUID(uuid) {
    return constants_1.PATTERNS.UUID.test(uuid);
}
function isValidSemver(version) {
    return constants_1.PATTERNS.SEMVER.test(version);
}
function validateDevice(device) {
    return (device &&
        typeof device.id === 'string' &&
        typeof device.name === 'string' &&
        typeof device.platform === 'string' &&
        typeof device.hostname === 'string' &&
        typeof device.ip === 'string' &&
        typeof device.port === 'number');
}
// ============================================
// Error Utilities
// ============================================
class PortalFusionError extends Error {
    constructor(code, message, details) {
        super(message);
        this.name = 'PortalFusionError';
        this.code = code;
        this.details = details;
    }
}
exports.PortalFusionError = PortalFusionError;
function createError(code, message, details) {
    return new PortalFusionError(constants_1.ERROR_CODES[code], message || `Error: ${code}`, details);
}
function isErrorCode(error, code) {
    return error instanceof PortalFusionError && error.code === constants_1.ERROR_CODES[code];
}
// ============================================
// Array Utilities
// ============================================
function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
function unique(array) {
    return [...new Set(array)];
}
function difference(array1, array2) {
    return array1.filter(item => !array2.includes(item));
}
// ============================================
// Object Utilities
// ============================================
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
function deepMerge(target, source) {
    const output = { ...target };
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
                output[key] = deepMerge(target[key], source[key]);
            }
            else {
                output[key] = source[key];
            }
        }
        else {
            output[key] = source[key];
        }
    }
    return output;
}
function omit(obj, keys) {
    const result = { ...obj };
    for (const key of keys) {
        delete result[key];
    }
    return result;
}
function pick(obj, keys) {
    const result = {};
    for (const key of keys) {
        result[key] = obj[key];
    }
    return result;
}
// ============================================
// Async Utilities
// ============================================
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function timeout(promise, ms, error) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(error || new Error(`Timeout after ${ms}ms`));
        }, ms);
        promise
            .then(resolve)
            .catch(reject)
            .finally(() => clearTimeout(timer));
    });
}
function retry(fn, retries = 3, delay = 1000) {
    return fn().catch(async (error) => {
        if (retries <= 0)
            throw error;
        await sleep(delay);
        return retry(fn, retries - 1, delay * 2);
    });
}
function debounce(fn, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}
function throttle(fn, limit) {
    let inThrottle = false;
    return (...args) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}
// ============================================
// Event Emitter Helper
// ============================================
class TypedEventEmitter {
    constructor() {
        this.events = new Map();
    }
    on(event, handler) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        this.events.get(event).add(handler);
    }
    off(event, handler) {
        this.events.get(event)?.delete(handler);
    }
    emit(event, ...args) {
        this.events.get(event)?.forEach(handler => {
            handler(...args);
        });
    }
    once(event, handler) {
        const onceHandler = ((...args) => {
            handler(...args);
            this.off(event, onceHandler);
        });
        this.on(event, onceHandler);
    }
    removeAllListeners(event) {
        if (event) {
            this.events.delete(event);
        }
        else {
            this.events.clear();
        }
    }
}
exports.TypedEventEmitter = TypedEventEmitter;
//# sourceMappingURL=utils.js.map