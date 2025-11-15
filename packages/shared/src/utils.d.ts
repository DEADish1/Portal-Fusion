import { Platform, Device, Message } from './types';
import { ERROR_CODES } from './constants';
export declare function generateId(): string;
export declare function generateDeviceId(): string;
export declare function generateSessionId(): string;
export declare function generatePin(length?: number): string;
export declare function getPlatform(): Platform;
export declare function isPlatform(platform: Platform): boolean;
export declare function isMobile(): boolean;
export declare function isDesktop(): boolean;
export declare function isValidIP(ip: string): boolean;
export declare function isValidMAC(mac: string): boolean;
export declare function isLocalIP(ip: string): boolean;
export declare function normalizeIP(ip: string): string;
export declare function generateKeyPair(): {
    publicKey: string;
    privateKey: string;
};
export declare function hashPassword(password: string, salt?: string): {
    hash: string;
    salt: string;
};
export declare function verifyPassword(password: string, hash: string, salt: string): boolean;
export declare function encrypt(data: string, key: Buffer): {
    encrypted: string;
    iv: string;
    tag: string;
};
export declare function decrypt(encrypted: string, key: Buffer, iv: string, tag: string): string;
export declare function generateChecksum(data: Buffer | string): string;
export declare function formatFileSize(bytes: number): string;
export declare function getMimeType(filename: string): string;
export declare function sanitizeFileName(filename: string): string;
export declare function createMessage<T = any>(type: Message['type'], payload: T, options?: Partial<Message>): Message<T>;
export declare function isHighPriority(message: Message): boolean;
export declare function shouldCompress(data: any): boolean;
export declare function formatDuration(ms: number): string;
export declare function formatTimestamp(date: Date): string;
export declare function getRelativeTime(date: Date): string;
export declare function isValidUUID(uuid: string): boolean;
export declare function isValidSemver(version: string): boolean;
export declare function validateDevice(device: any): device is Device;
export declare class PortalFusionError extends Error {
    code: string;
    details?: any;
    constructor(code: string, message: string, details?: any);
}
export declare function createError(code: keyof typeof ERROR_CODES, message?: string, details?: any): PortalFusionError;
export declare function isErrorCode(error: any, code: keyof typeof ERROR_CODES): boolean;
export declare function chunk<T>(array: T[], size: number): T[][];
export declare function unique<T>(array: T[]): T[];
export declare function difference<T>(array1: T[], array2: T[]): T[];
export declare function deepClone<T>(obj: T): T;
export declare function deepMerge<T extends object>(target: T, source: Partial<T>): T;
export declare function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>;
export declare function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
export declare function sleep(ms: number): Promise<void>;
export declare function timeout<T>(promise: Promise<T>, ms: number, error?: Error): Promise<T>;
export declare function retry<T>(fn: () => Promise<T>, retries?: number, delay?: number): Promise<T>;
export declare function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void;
export declare function throttle<T extends (...args: any[]) => any>(fn: T, limit: number): (...args: Parameters<T>) => void;
export declare class TypedEventEmitter<T extends Record<string, (...args: any[]) => void>> {
    private events;
    on<K extends keyof T>(event: K, handler: T[K]): void;
    off<K extends keyof T>(event: K, handler: T[K]): void;
    emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): void;
    once<K extends keyof T>(event: K, handler: T[K]): void;
    removeAllListeners(event?: keyof T): void;
}
//# sourceMappingURL=utils.d.ts.map