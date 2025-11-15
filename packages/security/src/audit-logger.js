"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = exports.AuditLogger = void 0;
const shared_1 = require("@portal-fusion/shared");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const electron_log_1 = __importDefault(require("electron-log"));
/**
 * Audit Logger
 * Comprehensive security audit logging system
 */
class AuditLogger extends shared_1.TypedEventEmitter {
    constructor(options = {}) {
        super();
        this.entries = [];
        this.fileWriteQueue = [];
        this.isWriting = false;
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
    async initialize() {
        // Create log directory
        await fs.mkdir(this.options.logDirectory, { recursive: true });
        // Initialize log file
        await this.rotateLogFile();
        // Start retention cleanup
        await this.cleanupOldLogs();
        electron_log_1.default.info('Audit logger initialized');
    }
    /**
     * Log audit entry
     */
    async log(level, category, action, success, details) {
        const entry = {
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
    async logAuthentication(action, success, deviceId, details) {
        return this.log('info', 'authentication', action, success, {
            deviceId,
            data: details,
        });
    }
    /**
     * Log authorization event
     */
    async logAuthorization(action, success, deviceId, details) {
        return this.log('info', 'authorization', action, success, {
            deviceId,
            data: details,
        });
    }
    /**
     * Log data access
     */
    async logDataAccess(resource, action, deviceId, details) {
        return this.log('info', 'data-access', `${action} ${resource}`, true, {
            deviceId,
            data: details,
        });
    }
    /**
     * Log security event
     */
    async logSecurityEvent(event, level, deviceId, details) {
        return this.log(level, 'security-event', event, true, {
            deviceId,
            data: details,
        });
    }
    /**
     * Log user action
     */
    async logUserAction(action, userId, success, details) {
        return this.log('info', 'user-action', action, success, {
            userId,
            data: details,
        });
    }
    /**
     * Process write queue
     */
    async processWriteQueue() {
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
        }
        catch (error) {
            electron_log_1.default.error('Failed to write audit entries:', error);
            // Re-queue entries
            this.fileWriteQueue.unshift(...this.fileWriteQueue);
        }
        finally {
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
    async writeEntriesToFile(entries) {
        if (!this.currentLogFile) {
            return;
        }
        const lines = entries.map((entry) => JSON.stringify(entry)).join('\n') + '\n';
        await fs.appendFile(this.currentLogFile, lines, 'utf8');
    }
    /**
     * Check if log rotation needed
     */
    async checkRotation() {
        if (!this.currentLogFile) {
            return;
        }
        try {
            const stats = await fs.stat(this.currentLogFile);
            if (stats.size >= this.options.maxFileSize) {
                await this.rotateLogFile();
            }
        }
        catch (error) {
            electron_log_1.default.error('Failed to check log file size:', error);
        }
    }
    /**
     * Rotate log file
     */
    async rotateLogFile() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `audit-${timestamp}.log`;
        this.currentLogFile = path.join(this.options.logDirectory, filename);
        electron_log_1.default.info(`Rotated audit log to: ${filename}`);
    }
    /**
     * Clean up old logs
     */
    async cleanupOldLogs() {
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
                    electron_log_1.default.info(`Deleted old audit log: ${file}`);
                }
            }
        }
        catch (error) {
            electron_log_1.default.error('Failed to cleanup old logs:', error);
        }
    }
    /**
     * Log to console
     */
    logToConsole(entry) {
        const message = `[AUDIT] [${entry.level.toUpperCase()}] [${entry.category}] ${entry.action}`;
        switch (entry.level) {
            case 'debug':
                electron_log_1.default.debug(message, entry.details);
                break;
            case 'info':
                electron_log_1.default.info(message, entry.details);
                break;
            case 'warning':
                electron_log_1.default.warn(message, entry.details);
                break;
            case 'error':
            case 'critical':
                electron_log_1.default.error(message, entry.details);
                break;
        }
    }
    /**
     * Search audit logs
     */
    searchLogs(filters) {
        return this.entries.filter((entry) => {
            if (filters.level && entry.level !== filters.level)
                return false;
            if (filters.category && entry.category !== filters.category)
                return false;
            if (filters.deviceId && entry.deviceId !== filters.deviceId)
                return false;
            if (filters.userId && entry.userId !== filters.userId)
                return false;
            if (filters.startDate && entry.timestamp < filters.startDate)
                return false;
            if (filters.endDate && entry.timestamp > filters.endDate)
                return false;
            if (filters.action && !entry.action.includes(filters.action))
                return false;
            return true;
        });
    }
    /**
     * Get recent entries
     */
    getRecentEntries(limit = 100) {
        return this.entries.slice(-limit);
    }
    /**
     * Get statistics
     */
    getStatistics() {
        const stats = {
            totalEntries: this.entries.length,
            byLevel: {},
            byCategory: {},
            successRate: 0,
        };
        let successCount = 0;
        this.entries.forEach((entry) => {
            stats.byLevel[entry.level] = (stats.byLevel[entry.level] || 0) + 1;
            stats.byCategory[entry.category] = (stats.byCategory[entry.category] || 0) + 1;
            if (entry.success)
                successCount++;
        });
        stats.successRate = this.entries.length > 0 ? successCount / this.entries.length : 0;
        return stats;
    }
    /**
     * Export logs
     */
    async exportLogs(startDate, endDate) {
        const filtered = this.searchLogs({ startDate, endDate });
        return JSON.stringify(filtered, null, 2);
    }
}
exports.AuditLogger = AuditLogger;
// Export singleton instance
exports.auditLogger = new AuditLogger();
//# sourceMappingURL=audit-logger.js.map