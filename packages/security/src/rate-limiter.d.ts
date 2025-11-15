import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
export interface RateLimitRule {
    maxRequests: number;
    windowMs: number;
    blockDurationMs?: number;
}
export interface RateLimitConfig {
    global?: RateLimitRule;
    perDevice?: RateLimitRule;
    perAction?: Record<string, RateLimitRule>;
}
/**
 * Rate Limiter
 * Prevents abuse by limiting request rates
 */
export declare class RateLimiter extends TypedEventEmitter<PortalFusionEvents> {
    private globalRequests;
    private deviceRequests;
    private actionRequests;
    private config;
    /**
     * Initialize rate limiter
     */
    initialize(): void;
    /**
     * Check if request is allowed
     */
    checkLimit(deviceId: string, action?: string): {
        allowed: boolean;
        remainingRequests?: number;
        resetAt?: Date;
        reason?: string;
    };
    /**
     * Record request
     */
    recordRequest(deviceId: string, action?: string): void;
    /**
     * Check record against rule
     */
    private checkRecord;
    /**
     * Increment record counter
     */
    private incrementRecord;
    /**
     * Block device
     */
    blockDevice(deviceId: string, durationMs: number): void;
    /**
     * Unblock device
     */
    unblockDevice(deviceId: string): void;
    /**
     * Check if device is blocked
     */
    isBlocked(deviceId: string): boolean;
    /**
     * Get remaining requests for device
     */
    getRemainingRequests(deviceId: string, action?: string): number;
    /**
     * Reset limits for device
     */
    resetDevice(deviceId: string): void;
    /**
     * Update configuration
     */
    updateConfig(config: Partial<RateLimitConfig>): void;
    /**
     * Get configuration
     */
    getConfig(): Required<RateLimitConfig>;
    /**
     * Get statistics
     */
    getStatistics(): {
        totalRequests: number;
        blockedDevices: number;
        activeWindows: number;
    };
    /**
     * Cleanup expired records
     */
    private cleanup;
    /**
     * Cleanup map
     */
    private cleanupMap;
}
export declare const rateLimiter: RateLimiter;
//# sourceMappingURL=rate-limiter.d.ts.map