import crypto from 'crypto';
import { Platform, Device, Message, MessagePriority } from './types';
import { PATTERNS, ERROR_CODES } from './constants';

// ============================================
// ID Generation Utilities
// ============================================

export function generateId(): string {
  return crypto.randomUUID();
}

export function generateDeviceId(): string {
  const platform = getPlatform();
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `${platform}-${timestamp}-${random}`;
}

export function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generatePin(length: number = 6): string {
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

export function getPlatform(): Platform {
  switch (process.platform) {
    case 'darwin':
      return Platform.MACOS;
    case 'win32':
      return Platform.WINDOWS;
    case 'linux':
      return Platform.LINUX;
    default:
      return Platform.LINUX;
  }
}

export function isPlatform(platform: Platform): boolean {
  return getPlatform() === platform;
}

export function isMobile(): boolean {
  return false; // Desktop app, always false
}

export function isDesktop(): boolean {
  return true; // Desktop app, always true
}

// ============================================
// Network Utilities
// ============================================

export function isValidIP(ip: string): boolean {
  return PATTERNS.IP_ADDRESS.test(ip);
}

export function isValidMAC(mac: string): boolean {
  return PATTERNS.MAC_ADDRESS.test(mac);
}

export function isLocalIP(ip: string): boolean {
  return (
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.') ||
    ip === '127.0.0.1' ||
    ip === 'localhost'
  );
}

export function normalizeIP(ip: string): string {
  if (ip === '::1') return '127.0.0.1';
  if (ip.includes('::ffff:')) return ip.replace('::ffff:', '');
  return ip;
}

// ============================================
// Encryption Utilities
// ============================================

export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
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

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const usedSalt = salt || crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, usedSalt, 100000, 64, 'sha256').toString('hex');
  return { hash, salt: usedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const testHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
  return testHash === hash;
}

export function encrypt(data: string, key: Buffer): { encrypted: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

export function decrypt(encrypted: string, key: Buffer, iv: string, tag: string): string {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export function generateChecksum(data: Buffer | string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// ============================================
// File Utilities
// ============================================

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const mimeTypes: { [key: string]: string } = {
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

export function sanitizeFileName(filename: string): string {
  // Remove invalid characters for all platforms
  return filename.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
}

// ============================================
// Message Utilities
// ============================================

export function createMessage<T = any>(
  type: Message['type'],
  payload: T,
  options: Partial<Message> = {}
): Message<T> {
  return {
    id: generateId(),
    type,
    from: options.from || '',
    to: options.to || '',
    payload,
    timestamp: new Date(),
    encrypted: options.encrypted || false,
    compressed: options.compressed || false,
    priority: options.priority || MessagePriority.NORMAL,
    requiresAck: options.requiresAck || false,
    ...options,
  };
}

export function isHighPriority(message: Message): boolean {
  return message.priority >= MessagePriority.HIGH;
}

export function shouldCompress(data: any): boolean {
  const size = JSON.stringify(data).length;
  return size > 1024; // Compress if larger than 1KB
}

// ============================================
// Time Utilities
// ============================================

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export function formatTimestamp(date: Date): string {
  return date.toLocaleString();
}

export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'just now';
}

// ============================================
// Validation Utilities
// ============================================

export function isValidUUID(uuid: string): boolean {
  return PATTERNS.UUID.test(uuid);
}

export function isValidSemver(version: string): boolean {
  return PATTERNS.SEMVER.test(version);
}

export function validateDevice(device: any): device is Device {
  return (
    device &&
    typeof device.id === 'string' &&
    typeof device.name === 'string' &&
    typeof device.platform === 'string' &&
    typeof device.hostname === 'string' &&
    typeof device.ip === 'string' &&
    typeof device.port === 'number'
  );
}

// ============================================
// Error Utilities
// ============================================

export class CrossBridgeError extends Error {
  code: string;
  details?: any;
  
  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'CrossBridgeError';
    this.code = code;
    this.details = details;
  }
}

export function createError(code: keyof typeof ERROR_CODES, message?: string, details?: any): CrossBridgeError {
  return new CrossBridgeError(
    ERROR_CODES[code],
    message || `Error: ${code}`,
    details
  );
}

export function isErrorCode(error: any, code: keyof typeof ERROR_CODES): boolean {
  return error instanceof CrossBridgeError && error.code === ERROR_CODES[code];
}

// ============================================
// Array Utilities
// ============================================

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

export function difference<T>(array1: T[], array2: T[]): T[] {
  return array1.filter(item => !array2.includes(item));
}

// ============================================
// Object Utilities
// ============================================

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const output = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
        output[key] = deepMerge(target[key] as any, source[key] as any);
      } else {
        output[key] = source[key] as any;
      }
    } else {
      output[key] = source[key] as any;
    }
  }
  
  return output;
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}

// ============================================
// Async Utilities
// ============================================

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function timeout<T>(promise: Promise<T>, ms: number, error?: Error): Promise<T> {
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

export function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  return fn().catch(async (error) => {
    if (retries <= 0) throw error;
    await sleep(delay);
    return retry(fn, retries - 1, delay * 2);
  });
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
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

export class TypedEventEmitter<T extends Record<string, (...args: any[]) => void>> {
  private events: Map<keyof T, Set<T[keyof T]>> = new Map();
  
  on<K extends keyof T>(event: K, handler: T[K]): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);
  }
  
  off<K extends keyof T>(event: K, handler: T[K]): void {
    this.events.get(event)?.delete(handler);
  }
  
  emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): void {
    this.events.get(event)?.forEach(handler => {
      handler(...args);
    });
  }
  
  once<K extends keyof T>(event: K, handler: T[K]): void {
    const onceHandler = ((...args: any[]) => {
      handler(...args);
      this.off(event, onceHandler as T[K]);
    }) as T[K];
    
    this.on(event, onceHandler);
  }
  
  removeAllListeners(event?: keyof T): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}
