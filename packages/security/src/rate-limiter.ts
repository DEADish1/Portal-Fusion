import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import log from 'electron-log';

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

interface RequestRecord {
  count: number;
  firstRequestAt: number;
  blockedUntil?: number;
}

/**
 * Rate Limiter
 * Prevents abuse by limiting request rates
 */
export class RateLimiter extends TypedEventEmitter<PortalFusionEvents> {
  private globalRequests: Map<string, RequestRecord> = new Map();
  private deviceRequests: Map<string, RequestRecord> = new Map();
  private actionRequests: Map<string, RequestRecord> = new Map();

  private config: Required<RateLimitConfig> = {
    global: {
      maxRequests: 1000,
      windowMs: 60000, // 1 minute
      blockDurationMs: 300000, // 5 minutes
    },
    perDevice: {
      maxRequests: 100,
      windowMs: 60000,
      blockDurationMs: 300000,
    },
    perAction: {
      'clipboard.sync': {
        maxRequests: 60,
        windowMs: 60000,
      },
      'file.transfer': {
        maxRequests: 10,
        windowMs: 60000,
      },
      'screen.capture': {
        maxRequests: 30,
        windowMs: 60000,
      },
      'authentication.attempt': {
        maxRequests: 5,
        windowMs: 300000, // 5 minutes
        blockDurationMs: 900000, // 15 minutes
      },
    },
  };

  /**
   * Initialize rate limiter
   */
  initialize(): void {
    // Start cleanup timer
    setInterval(() => this.cleanup(), 60000); // Cleanup every minute

    log.info('Rate limiter initialized');
  }

  /**
   * Check if request is allowed
   */
  checkLimit(deviceId: string, action?: string): {
    allowed: boolean;
    remainingRequests?: number;
    resetAt?: Date;
    reason?: string;
  } {
    const now = Date.now();

    // Check global rate limit
    const globalCheck = this.checkRecord(
      'global',
      this.globalRequests,
      this.config.global,
      now
    );

    if (!globalCheck.allowed) {
      this.emit('rate-limit:exceeded', {
        type: 'global',
        deviceId,
        action,
      });

      return {
        allowed: false,
        reason: 'Global rate limit exceeded',
        resetAt: globalCheck.resetAt,
      };
    }

    // Check per-device rate limit
    const deviceCheck = this.checkRecord(
      deviceId,
      this.deviceRequests,
      this.config.perDevice,
      now
    );

    if (!deviceCheck.allowed) {
      this.emit('rate-limit:exceeded', {
        type: 'device',
        deviceId,
        action,
      });

      return {
        allowed: false,
        reason: 'Device rate limit exceeded',
        resetAt: deviceCheck.resetAt,
      };
    }

    // Check per-action rate limit
    if (action && this.config.perAction[action]) {
      const actionKey = `${deviceId}:${action}`;
      const actionCheck = this.checkRecord(
        actionKey,
        this.actionRequests,
        this.config.perAction[action],
        now
      );

      if (!actionCheck.allowed) {
        this.emit('rate-limit:exceeded', {
          type: 'action',
          deviceId,
          action,
        });

        return {
          allowed: false,
          reason: `Action rate limit exceeded for ${action}`,
          resetAt: actionCheck.resetAt,
        };
      }

      return {
        allowed: true,
        remainingRequests: actionCheck.remainingRequests,
        resetAt: actionCheck.resetAt,
      };
    }

    return {
      allowed: true,
      remainingRequests: deviceCheck.remainingRequests,
      resetAt: deviceCheck.resetAt,
    };
  }

  /**
   * Record request
   */
  recordRequest(deviceId: string, action?: string): void {
    const now = Date.now();

    // Record global
    this.incrementRecord('global', this.globalRequests, this.config.global, now);

    // Record per-device
    this.incrementRecord(deviceId, this.deviceRequests, this.config.perDevice, now);

    // Record per-action
    if (action && this.config.perAction[action]) {
      const actionKey = `${deviceId}:${action}`;
      this.incrementRecord(actionKey, this.actionRequests, this.config.perAction[action], now);
    }
  }

  /**
   * Check record against rule
   */
  private checkRecord(
    key: string,
    storage: Map<string, RequestRecord>,
    rule: RateLimitRule,
    now: number
  ): {
    allowed: boolean;
    remainingRequests?: number;
    resetAt?: Date;
  } {
    const record = storage.get(key);

    if (!record) {
      return {
        allowed: true,
        remainingRequests: rule.maxRequests - 1,
        resetAt: new Date(now + rule.windowMs),
      };
    }

    // Check if blocked
    if (record.blockedUntil && now < record.blockedUntil) {
      return {
        allowed: false,
        resetAt: new Date(record.blockedUntil),
      };
    }

    // Check if window expired
    const windowExpired = now - record.firstRequestAt > rule.windowMs;

    if (windowExpired) {
      return {
        allowed: true,
        remainingRequests: rule.maxRequests - 1,
        resetAt: new Date(now + rule.windowMs),
      };
    }

    // Check if limit exceeded
    if (record.count >= rule.maxRequests) {
      // Block if configured
      if (rule.blockDurationMs) {
        record.blockedUntil = now + rule.blockDurationMs;
      }

      return {
        allowed: false,
        resetAt: new Date(record.firstRequestAt + rule.windowMs),
      };
    }

    return {
      allowed: true,
      remainingRequests: rule.maxRequests - record.count - 1,
      resetAt: new Date(record.firstRequestAt + rule.windowMs),
    };
  }

  /**
   * Increment record counter
   */
  private incrementRecord(
    key: string,
    storage: Map<string, RequestRecord>,
    rule: RateLimitRule,
    now: number
  ): void {
    const record = storage.get(key);

    if (!record || now - record.firstRequestAt > rule.windowMs) {
      // Start new window
      storage.set(key, {
        count: 1,
        firstRequestAt: now,
      });
    } else {
      // Increment count
      record.count++;
    }
  }

  /**
   * Block device
   */
  blockDevice(deviceId: string, durationMs: number): void {
    const record = this.deviceRequests.get(deviceId) || {
      count: 0,
      firstRequestAt: Date.now(),
    };

    record.blockedUntil = Date.now() + durationMs;
    this.deviceRequests.set(deviceId, record);

    log.warn(`Device blocked: ${deviceId} for ${durationMs}ms`);
    this.emit('rate-limit:device-blocked', { deviceId, durationMs });
  }

  /**
   * Unblock device
   */
  unblockDevice(deviceId: string): void {
    const record = this.deviceRequests.get(deviceId);

    if (record) {
      delete record.blockedUntil;
      log.info(`Device unblocked: ${deviceId}`);
      this.emit('rate-limit:device-unblocked', { deviceId });
    }
  }

  /**
   * Check if device is blocked
   */
  isBlocked(deviceId: string): boolean {
    const record = this.deviceRequests.get(deviceId);
    return record?.blockedUntil ? Date.now() < record.blockedUntil : false;
  }

  /**
   * Get remaining requests for device
   */
  getRemainingRequests(deviceId: string, action?: string): number {
    const now = Date.now();

    if (action && this.config.perAction[action]) {
      const actionKey = `${deviceId}:${action}`;
      const record = this.actionRequests.get(actionKey);
      const rule = this.config.perAction[action];

      if (!record || now - record.firstRequestAt > rule.windowMs) {
        return rule.maxRequests;
      }

      return Math.max(0, rule.maxRequests - record.count);
    }

    const record = this.deviceRequests.get(deviceId);
    const rule = this.config.perDevice;

    if (!record || now - record.firstRequestAt > rule.windowMs) {
      return rule.maxRequests;
    }

    return Math.max(0, rule.maxRequests - record.count);
  }

  /**
   * Reset limits for device
   */
  resetDevice(deviceId: string): void {
    this.deviceRequests.delete(deviceId);

    // Also clear action-specific limits
    const keysToDelete: string[] = [];
    this.actionRequests.forEach((_, key) => {
      if (key.startsWith(`${deviceId}:`)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.actionRequests.delete(key));

    log.info(`Rate limits reset for device: ${deviceId}`);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RateLimitConfig>): void {
    if (config.global) {
      this.config.global = { ...this.config.global, ...config.global };
    }

    if (config.perDevice) {
      this.config.perDevice = { ...this.config.perDevice, ...config.perDevice };
    }

    if (config.perAction) {
      this.config.perAction = { ...this.config.perAction, ...config.perAction };
    }

    log.info('Rate limiter configuration updated');
  }

  /**
   * Get configuration
   */
  getConfig(): Required<RateLimitConfig> {
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalRequests: number;
    blockedDevices: number;
    activeWindows: number;
  } {
    let totalRequests = 0;
    let blockedDevices = 0;
    const now = Date.now();

    this.deviceRequests.forEach((record) => {
      totalRequests += record.count;
      if (record.blockedUntil && now < record.blockedUntil) {
        blockedDevices++;
      }
    });

    return {
      totalRequests,
      blockedDevices,
      activeWindows: this.deviceRequests.size + this.actionRequests.size,
    };
  }

  /**
   * Cleanup expired records
   */
  private cleanup(): void {
    const now = Date.now();

    // Cleanup global
    this.cleanupMap(this.globalRequests, this.config.global, now);

    // Cleanup device requests
    this.cleanupMap(this.deviceRequests, this.config.perDevice, now);

    // Cleanup action requests
    this.actionRequests.forEach((record, key) => {
      const action = key.split(':')[1];
      const rule = this.config.perAction[action];

      if (rule && now - record.firstRequestAt > rule.windowMs) {
        if (!record.blockedUntil || now > record.blockedUntil) {
          this.actionRequests.delete(key);
        }
      }
    });
  }

  /**
   * Cleanup map
   */
  private cleanupMap(
    storage: Map<string, RequestRecord>,
    rule: RateLimitRule,
    now: number
  ): void {
    storage.forEach((record, key) => {
      if (now - record.firstRequestAt > rule.windowMs) {
        if (!record.blockedUntil || now > record.blockedUntil) {
          storage.delete(key);
        }
      }
    });
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();
