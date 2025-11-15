import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
export type AuditLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';
export type AuditCategory = 'authentication' | 'authorization' | 'encryption' | 'data-access' | 'data-modification' | 'configuration' | 'security-event' | 'system-event' | 'user-action';
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
    maxFileSize?: number;
    maxFiles?: number;
    enableEncryption?: boolean;
    retentionDays?: number;
    logToConsole?: boolean;
}
/**
 * Audit Logger
 * Comprehensive security audit logging system
 */
export declare class AuditLogger extends TypedEventEmitter<PortalFusionEvents> {
    private options;
    private entries;
    private currentLogFile?;
    private fileWriteQueue;
    private isWriting;
    constructor(options?: AuditLoggerOptions);
    /**
     * Initialize audit logger
     */
    initialize(): Promise<void>;
    /**
     * Log audit entry
     */
    log(level: AuditLevel, category: AuditCategory, action: string, success: boolean, details?: {
        deviceId?: string;
        deviceName?: string;
        userId?: string;
        ipAddress?: string;
        data?: Record<string, unknown>;
        metadata?: AuditEntry['metadata'];
    }): Promise<AuditEntry>;
    /**
     * Log authentication event
     */
    logAuthentication(action: string, success: boolean, deviceId?: string, details?: Record<string, unknown>): Promise<AuditEntry>;
    /**
     * Log authorization event
     */
    logAuthorization(action: string, success: boolean, deviceId?: string, details?: Record<string, unknown>): Promise<AuditEntry>;
    /**
     * Log data access
     */
    logDataAccess(resource: string, action: 'read' | 'write' | 'delete', deviceId?: string, details?: Record<string, unknown>): Promise<AuditEntry>;
    /**
     * Log security event
     */
    logSecurityEvent(event: string, level: AuditLevel, deviceId?: string, details?: Record<string, unknown>): Promise<AuditEntry>;
    /**
     * Log user action
     */
    logUserAction(action: string, userId: string, success: boolean, details?: Record<string, unknown>): Promise<AuditEntry>;
    /**
     * Process write queue
     */
    private processWriteQueue;
    /**
     * Write entries to file
     */
    private writeEntriesToFile;
    /**
     * Check if log rotation needed
     */
    private checkRotation;
    /**
     * Rotate log file
     */
    private rotateLogFile;
    /**
     * Clean up old logs
     */
    private cleanupOldLogs;
    /**
     * Log to console
     */
    private logToConsole;
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
    }): AuditEntry[];
    /**
     * Get recent entries
     */
    getRecentEntries(limit?: number): AuditEntry[];
    /**
     * Get statistics
     */
    getStatistics(): {
        totalEntries: number;
        byLevel: Record<AuditLevel, number>;
        byCategory: Record<AuditCategory, number>;
        successRate: number;
    };
    /**
     * Export logs
     */
    exportLogs(startDate?: Date, endDate?: Date): Promise<string>;
}
export declare const auditLogger: AuditLogger;
//# sourceMappingURL=audit-logger.d.ts.map