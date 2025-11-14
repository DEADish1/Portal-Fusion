import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import * as fs from 'fs/promises';
import * as path from 'path';
import log from 'electron-log';

export type AuditLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';

export type AuditCategory =
  | 'authentication'
  | 'authorization'
  | 'encryption'
  | 'data-access'
  | 'data-modification'
  | 'configuration'
  | 'security-event'
  | 'system-event'
  | 'user-action';

export interface AuditEntry {
  id: string;
  timestamp: Date;
  level: AuditLevel;
  category: AuditCategory;
  action: string;
  deviceId?: string;
  deviceName?: string;
  userId?: string;
  ipAddress?: string;
  success: boolean;
  details?: Record<string, unknown>;
  metadata?: {
    sessionId?: string;
    requestId?: string;
    correlationId?: string;
  };
}

export interface AuditLoggerOptions {
  logDirectory?: string;
  maxFileSize?: number; // bytes
  maxFiles?: number;
  enableEncryption?: boolean;
  retentionDays?: number;
  logToConsole?: boolean;
}

/**
 * Audit Logger
 * Comprehensive security audit logging system
 */
export class AuditLogger extends TypedEventEmitter<PortalFusionEvents> {
  private options: Required<AuditLoggerOptions>;
  private entries: AuditEntry[] = [];
  private currentLogFile?: string;
  private fileWriteQueue: AuditEntry[] = [];
  private isWriting = false;

  constructor(options: AuditLoggerOptions = {}) {
    super();

    this.options = {
      logDirectory: options.logDirectory || './logs/audit',
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
      maxFiles: options.maxFiles || 30,
      enableEncryption: options.enableEncryption || false,
      retentionDays: options.retentionDays || 90,
      logToConsole: options.logToConsole !== false,
    };
  }

  /**
   * Initialize audit logger
   */
  async initialize(): Promise<void> {
    // Create log directory
    await fs.mkdir(this.options.logDirectory, { recursive: true });

    // Initialize log file
    await this.rotateLogFile();

    // Start retention cleanup
    await this.cleanupOldLogs();

    log.info('Audit logger initialized');
  }

  /**
   * Log audit entry
   */
  async log(
    level: AuditLevel,
    category: AuditCategory,
    action: string,
    success: boolean,
    details?: {
      deviceId?: string;
      deviceName?: string;
      userId?: string;
      ipAddress?: string;
      data?: Record<string, unknown>;
      metadata?: AuditEntry['metadata'];
    }
  ): Promise<AuditEntry> {
    const entry: AuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      category,
      action,
      success,
      deviceId: details?.deviceId,
      deviceName: details?.deviceName,
      userId: details?.userId,
      ipAddress: details?.ipAddress,
      details: details?.data,
      metadata: details?.metadata,
    };

    // Add to in-memory cache
    this.entries.push(entry);
    if (this.entries.length > 1000) {
      this.entries.shift(); // Keep only last 1000 in memory
    }

    // Log to console if enabled
    if (this.options.logToConsole) {
      this.logToConsole(entry);
    }

    // Queue for file write
    this.fileWriteQueue.push(entry);
    this.processWriteQueue();

    // Emit event
    this.emit('audit:entry', entry);

    // Alert on critical events
    if (level === 'critical' || level === 'error') {
      this.emit('audit:alert', entry);
    }

    return entry;
  }

  /**
   * Log authentication event
   */
  async logAuthentication(
    action: string,
    success: boolean,
    deviceId?: string,
    details?: Record<string, unknown>
  ): Promise<AuditEntry> {
    return this.log('info', 'authentication', action, success, {
      deviceId,
      data: details,
    });
  }

  /**
   * Log authorization event
   */
  async logAuthorization(
    action: string,
    success: boolean,
    deviceId?: string,
    details?: Record<string, unknown>
  ): Promise<AuditEntry> {
    return this.log('info', 'authorization', action, success, {
      deviceId,
      data: details,
    });
  }

  /**
   * Log data access
   */
  async logDataAccess(
    resource: string,
    action: 'read' | 'write' | 'delete',
    deviceId?: string,
    details?: Record<string, unknown>
  ): Promise<AuditEntry> {
    return this.log('info', 'data-access', `${action} ${resource}`, true, {
      deviceId,
      data: details,
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    event: string,
    level: AuditLevel,
    deviceId?: string,
    details?: Record<string, unknown>
  ): Promise<AuditEntry> {
    return this.log(level, 'security-event', event, true, {
      deviceId,
      data: details,
    });
  }

  /**
   * Log user action
   */
  async logUserAction(
    action: string,
    userId: string,
    success: boolean,
    details?: Record<string, unknown>
  ): Promise<AuditEntry> {
    return this.log('info', 'user-action', action, success, {
      userId,
      data: details,
    });
  }

  /**
   * Process write queue
   */
  private async processWriteQueue(): Promise<void> {
    if (this.isWriting || this.fileWriteQueue.length === 0) {
      return;
    }

    this.isWriting = true;

    try {
      const entries = [...this.fileWriteQueue];
      this.fileWriteQueue = [];

      await this.writeEntriesToFile(entries);

      // Check if rotation needed
      await this.checkRotation();
    } catch (error) {
      log.error('Failed to write audit entries:', error);
      // Re-queue entries
      this.fileWriteQueue.unshift(...this.fileWriteQueue);
    } finally {
      this.isWriting = false;

      // Process remaining queue
      if (this.fileWriteQueue.length > 0) {
        setTimeout(() => this.processWriteQueue(), 100);
      }
    }
  }

  /**
   * Write entries to file
   */
  private async writeEntriesToFile(entries: AuditEntry[]): Promise<void> {
    if (!this.currentLogFile) {
      return;
    }

    const lines = entries.map((entry) => JSON.stringify(entry)).join('\n') + '\n';

    await fs.appendFile(this.currentLogFile, lines, 'utf8');
  }

  /**
   * Check if log rotation needed
   */
  private async checkRotation(): Promise<void> {
    if (!this.currentLogFile) {
      return;
    }

    try {
      const stats = await fs.stat(this.currentLogFile);
      if (stats.size >= this.options.maxFileSize) {
        await this.rotateLogFile();
      }
    } catch (error) {
      log.error('Failed to check log file size:', error);
    }
  }

  /**
   * Rotate log file
   */
  private async rotateLogFile(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `audit-${timestamp}.log`;
    this.currentLogFile = path.join(this.options.logDirectory, filename);

    log.info(`Rotated audit log to: ${filename}`);
  }

  /**
   * Clean up old logs
   */
  private async cleanupOldLogs(): Promise<void> {
    try {
      const files = await fs.readdir(this.options.logDirectory);
      const now = Date.now();
      const retentionMs = this.options.retentionDays * 24 * 60 * 60 * 1000;

      for (const file of files) {
        if (!file.startsWith('audit-') || !file.endsWith('.log')) {
          continue;
        }

        const filePath = path.join(this.options.logDirectory, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > retentionMs) {
          await fs.unlink(filePath);
          log.info(`Deleted old audit log: ${file}`);
        }
      }
    } catch (error) {
      log.error('Failed to cleanup old logs:', error);
    }
  }

  /**
   * Log to console
   */
  private logToConsole(entry: AuditEntry): void {
    const message = `[AUDIT] [${entry.level.toUpperCase()}] [${entry.category}] ${entry.action}`;

    switch (entry.level) {
      case 'debug':
        log.debug(message, entry.details);
        break;
      case 'info':
        log.info(message, entry.details);
        break;
      case 'warning':
        log.warn(message, entry.details);
        break;
      case 'error':
      case 'critical':
        log.error(message, entry.details);
        break;
    }
  }

  /**
   * Search audit logs
   */
  searchLogs(filters: {
    level?: AuditLevel;
    category?: AuditCategory;
    deviceId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    action?: string;
  }): AuditEntry[] {
    return this.entries.filter((entry) => {
      if (filters.level && entry.level !== filters.level) return false;
      if (filters.category && entry.category !== filters.category) return false;
      if (filters.deviceId && entry.deviceId !== filters.deviceId) return false;
      if (filters.userId && entry.userId !== filters.userId) return false;
      if (filters.startDate && entry.timestamp < filters.startDate) return false;
      if (filters.endDate && entry.timestamp > filters.endDate) return false;
      if (filters.action && !entry.action.includes(filters.action)) return false;
      return true;
    });
  }

  /**
   * Get recent entries
   */
  getRecentEntries(limit: number = 100): AuditEntry[] {
    return this.entries.slice(-limit);
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalEntries: number;
    byLevel: Record<AuditLevel, number>;
    byCategory: Record<AuditCategory, number>;
    successRate: number;
  } {
    const stats = {
      totalEntries: this.entries.length,
      byLevel: {} as Record<AuditLevel, number>,
      byCategory: {} as Record<AuditCategory, number>,
      successRate: 0,
    };

    let successCount = 0;

    this.entries.forEach((entry) => {
      stats.byLevel[entry.level] = (stats.byLevel[entry.level] || 0) + 1;
      stats.byCategory[entry.category] = (stats.byCategory[entry.category] || 0) + 1;
      if (entry.success) successCount++;
    });

    stats.successRate = this.entries.length > 0 ? successCount / this.entries.length : 0;

    return stats;
  }

  /**
   * Export logs
   */
  async exportLogs(startDate?: Date, endDate?: Date): Promise<string> {
    const filtered = this.searchLogs({ startDate, endDate });
    return JSON.stringify(filtered, null, 2);
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();
