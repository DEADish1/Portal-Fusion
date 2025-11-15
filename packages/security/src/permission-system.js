"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.permissionSystem = exports.PermissionSystem = void 0;
const shared_1 = require("@portal-fusion/shared");
const electron_log_1 = __importDefault(require("electron-log"));
/**
 * Permission System
 * Manages fine-grained permissions for device features
 */
class PermissionSystem extends shared_1.TypedEventEmitter {
    constructor() {
        super(...arguments);
        this.rules = new Map();
        this.requests = new Map();
        this.policy = {
            autoApprove: [],
            autoDeny: ['files.execute', 'system.admin'],
            requireApproval: ['kvm.control', 'screen.control', 'camera.access'],
            defaultExpiration: 60, // 1 hour
        };
    }
    /**
     * Initialize permission system
     */
    initialize() {
        electron_log_1.default.info('Permission system initialized');
    }
    /**
     * Request permissions from user
     */
    async requestPermissions(deviceId, deviceName, permissions, reason) {
        const request = {
            id: `perm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            deviceId,
            deviceName,
            permissions,
            reason,
            requestedAt: new Date(),
            status: 'pending',
        };
        this.requests.set(request.id, request);
        // Check policy for auto-approve/deny
        const autoApproved = [];
        const autoDenied = [];
        const needsApproval = [];
        for (const permission of permissions) {
            if (this.policy.autoApprove?.includes(permission)) {
                autoApproved.push(permission);
            }
            else if (this.policy.autoDeny?.includes(permission)) {
                autoDenied.push(permission);
            }
            else {
                needsApproval.push(permission);
            }
        }
        // Auto-grant approved permissions
        for (const permission of autoApproved) {
            await this.grantPermission(deviceId, permission, 'system', 'Auto-approved by policy');
        }
        // Auto-deny denied permissions
        for (const permission of autoDenied) {
            electron_log_1.default.warn(`Auto-denied permission ${permission} for device ${deviceId}`);
        }
        // If all permissions were auto-processed, mark as complete
        if (needsApproval.length === 0) {
            request.status = autoDenied.length > 0 ? 'denied' : 'approved';
        }
        electron_log_1.default.info(`Permission request created: ${request.id} for device ${deviceName}`);
        this.emit('permission:request:created', request);
        return request;
    }
    /**
     * Approve permission request
     */
    async approveRequest(requestId, grantedBy) {
        const request = this.requests.get(requestId);
        if (!request) {
            throw new Error('Permission request not found');
        }
        if (request.status !== 'pending') {
            throw new Error('Permission request is not pending');
        }
        // Grant all requested permissions
        for (const permission of request.permissions) {
            await this.grantPermission(request.deviceId, permission, grantedBy, request.reason);
        }
        request.status = 'approved';
        electron_log_1.default.info(`Permission request approved: ${requestId}`);
        this.emit('permission:request:approved', request);
    }
    /**
     * Deny permission request
     */
    async denyRequest(requestId) {
        const request = this.requests.get(requestId);
        if (!request) {
            throw new Error('Permission request not found');
        }
        if (request.status !== 'pending') {
            throw new Error('Permission request is not pending');
        }
        request.status = 'denied';
        electron_log_1.default.info(`Permission request denied: ${requestId}`);
        this.emit('permission:request:denied', request);
    }
    /**
     * Grant permission to device
     */
    async grantPermission(deviceId, permission, grantedBy, reason) {
        const ruleId = `${deviceId}:${permission}`;
        const rule = {
            id: ruleId,
            deviceId,
            permission,
            granted: true,
            grantedAt: new Date(),
            grantedBy,
            reason,
        };
        // Set expiration if configured
        if (this.policy.defaultExpiration) {
            rule.expiresAt = new Date(Date.now() + this.policy.defaultExpiration * 60 * 1000);
        }
        this.rules.set(ruleId, rule);
        electron_log_1.default.info(`Permission granted: ${permission} for device ${deviceId}`);
        this.emit('permission:granted', rule);
        return rule;
    }
    /**
     * Revoke permission from device
     */
    async revokePermission(deviceId, permission) {
        const ruleId = `${deviceId}:${permission}`;
        const rule = this.rules.get(ruleId);
        if (rule) {
            rule.granted = false;
            this.rules.delete(ruleId);
            electron_log_1.default.info(`Permission revoked: ${permission} for device ${deviceId}`);
            this.emit('permission:revoked', { deviceId, permission });
        }
    }
    /**
     * Check if device has permission
     */
    hasPermission(deviceId, permission) {
        const ruleId = `${deviceId}:${permission}`;
        const rule = this.rules.get(ruleId);
        if (!rule || !rule.granted) {
            return false;
        }
        // Check expiration
        if (rule.expiresAt && new Date() > rule.expiresAt) {
            this.revokePermission(deviceId, permission);
            return false;
        }
        return true;
    }
    /**
     * Check multiple permissions
     */
    hasPermissions(deviceId, permissions) {
        return permissions.every((permission) => this.hasPermission(deviceId, permission));
    }
    /**
     * Get all permissions for device
     */
    getDevicePermissions(deviceId) {
        return Array.from(this.rules.values()).filter((rule) => rule.deviceId === deviceId && rule.granted);
    }
    /**
     * Get pending requests
     */
    getPendingRequests() {
        return Array.from(this.requests.values()).filter((request) => request.status === 'pending');
    }
    /**
     * Clean up expired permissions
     */
    async cleanupExpiredPermissions() {
        const now = new Date();
        const expiredRules = [];
        this.rules.forEach((rule, id) => {
            if (rule.expiresAt && now > rule.expiresAt) {
                expiredRules.push(id);
            }
        });
        for (const id of expiredRules) {
            const rule = this.rules.get(id);
            if (rule) {
                await this.revokePermission(rule.deviceId, rule.permission);
            }
        }
        if (expiredRules.length > 0) {
            electron_log_1.default.info(`Cleaned up ${expiredRules.length} expired permissions`);
        }
    }
    /**
     * Update policy
     */
    updatePolicy(policy) {
        Object.assign(this.policy, policy);
        electron_log_1.default.info('Permission policy updated');
        this.emit('permission:policy:updated', this.policy);
    }
    /**
     * Get current policy
     */
    getPolicy() {
        return { ...this.policy };
    }
    /**
     * Revoke all permissions for device
     */
    async revokeAllPermissions(deviceId) {
        const deviceRules = Array.from(this.rules.values()).filter((rule) => rule.deviceId === deviceId);
        for (const rule of deviceRules) {
            await this.revokePermission(deviceId, rule.permission);
        }
        electron_log_1.default.info(`Revoked all permissions for device: ${deviceId}`);
    }
    /**
     * Export permissions
     */
    exportPermissions() {
        return {
            rules: Array.from(this.rules.values()),
            policy: this.policy,
            exportedAt: new Date().toISOString(),
        };
    }
    /**
     * Import permissions
     */
    importPermissions(data) {
        if (data.rules && Array.isArray(data.rules)) {
            data.rules.forEach((rule) => {
                this.rules.set(rule.id, rule);
            });
        }
        if (data.policy) {
            this.policy = data.policy;
        }
        electron_log_1.default.info('Permissions imported');
    }
}
exports.PermissionSystem = PermissionSystem;
// Export singleton instance
exports.permissionSystem = new PermissionSystem();
//# sourceMappingURL=permission-system.js.map