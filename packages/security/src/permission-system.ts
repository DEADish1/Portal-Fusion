import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import log from 'electron-log';

export type Permission =
  | 'clipboard.read'
  | 'clipboard.write'
  | 'files.read'
  | 'files.write'
  | 'files.execute'
  | 'screen.view'
  | 'screen.control'
  | 'notifications.read'
  | 'notifications.send'
  | 'kvm.control'
  | 'kvm.receive'
  | 'audio.capture'
  | 'audio.playback'
  | 'camera.access'
  | 'camera.share'
  | 'browser.read'
  | 'browser.write'
  | 'password.read'
  | 'password.write'
  | 'system.settings'
  | 'system.admin';

export interface PermissionRule {
  id: string;
  deviceId: string;
  permission: Permission;
  granted: boolean;
  expiresAt?: Date;
  grantedAt: Date;
  grantedBy: string;
  reason?: string;
}

export interface PermissionRequest {
  id: string;
  deviceId: string;
  deviceName: string;
  permissions: Permission[];
  reason?: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'denied' | 'expired';
}

export interface PermissionPolicy {
  autoApprove?: Permission[];
  autoDeny?: Permission[];
  requireApproval?: Permission[];
  defaultExpiration?: number; // minutes
}

/**
 * Permission System
 * Manages fine-grained permissions for device features
 */
export class PermissionSystem extends TypedEventEmitter<PortalFusionEvents> {
  private rules: Map<string, PermissionRule> = new Map();
  private requests: Map<string, PermissionRequest> = new Map();
  private policy: PermissionPolicy = {
    autoApprove: [],
    autoDeny: ['files.execute', 'system.admin'],
    requireApproval: ['kvm.control', 'screen.control', 'camera.access'],
    defaultExpiration: 60, // 1 hour
  };

  /**
   * Initialize permission system
   */
  initialize(): void {
    log.info('Permission system initialized');
  }

  /**
   * Request permissions from user
   */
  async requestPermissions(
    deviceId: string,
    deviceName: string,
    permissions: Permission[],
    reason?: string
  ): Promise<PermissionRequest> {
    const request: PermissionRequest = {
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
    const autoApproved: Permission[] = [];
    const autoDenied: Permission[] = [];
    const needsApproval: Permission[] = [];

    for (const permission of permissions) {
      if (this.policy.autoApprove?.includes(permission)) {
        autoApproved.push(permission);
      } else if (this.policy.autoDeny?.includes(permission)) {
        autoDenied.push(permission);
      } else {
        needsApproval.push(permission);
      }
    }

    // Auto-grant approved permissions
    for (const permission of autoApproved) {
      await this.grantPermission(deviceId, permission, 'system', 'Auto-approved by policy');
    }

    // Auto-deny denied permissions
    for (const permission of autoDenied) {
      log.warn(`Auto-denied permission ${permission} for device ${deviceId}`);
    }

    // If all permissions were auto-processed, mark as complete
    if (needsApproval.length === 0) {
      request.status = autoDenied.length > 0 ? 'denied' : 'approved';
    }

    log.info(`Permission request created: ${request.id} for device ${deviceName}`);
    this.emit('permission:request:created', request);

    return request;
  }

  /**
   * Approve permission request
   */
  async approveRequest(requestId: string, grantedBy: string): Promise<void> {
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

    log.info(`Permission request approved: ${requestId}`);
    this.emit('permission:request:approved', request);
  }

  /**
   * Deny permission request
   */
  async denyRequest(requestId: string): Promise<void> {
    const request = this.requests.get(requestId);

    if (!request) {
      throw new Error('Permission request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Permission request is not pending');
    }

    request.status = 'denied';

    log.info(`Permission request denied: ${requestId}`);
    this.emit('permission:request:denied', request);
  }

  /**
   * Grant permission to device
   */
  async grantPermission(
    deviceId: string,
    permission: Permission,
    grantedBy: string,
    reason?: string
  ): Promise<PermissionRule> {
    const ruleId = `${deviceId}:${permission}`;

    const rule: PermissionRule = {
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

    log.info(`Permission granted: ${permission} for device ${deviceId}`);
    this.emit('permission:granted', rule);

    return rule;
  }

  /**
   * Revoke permission from device
   */
  async revokePermission(deviceId: string, permission: Permission): Promise<void> {
    const ruleId = `${deviceId}:${permission}`;
    const rule = this.rules.get(ruleId);

    if (rule) {
      rule.granted = false;
      this.rules.delete(ruleId);

      log.info(`Permission revoked: ${permission} for device ${deviceId}`);
      this.emit('permission:revoked', { deviceId, permission });
    }
  }

  /**
   * Check if device has permission
   */
  hasPermission(deviceId: string, permission: Permission): boolean {
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
  hasPermissions(deviceId: string, permissions: Permission[]): boolean {
    return permissions.every((permission) => this.hasPermission(deviceId, permission));
  }

  /**
   * Get all permissions for device
   */
  getDevicePermissions(deviceId: string): PermissionRule[] {
    return Array.from(this.rules.values()).filter(
      (rule) => rule.deviceId === deviceId && rule.granted
    );
  }

  /**
   * Get pending requests
   */
  getPendingRequests(): PermissionRequest[] {
    return Array.from(this.requests.values()).filter(
      (request) => request.status === 'pending'
    );
  }

  /**
   * Clean up expired permissions
   */
  async cleanupExpiredPermissions(): Promise<void> {
    const now = new Date();
    const expiredRules: string[] = [];

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
      log.info(`Cleaned up ${expiredRules.length} expired permissions`);
    }
  }

  /**
   * Update policy
   */
  updatePolicy(policy: Partial<PermissionPolicy>): void {
    Object.assign(this.policy, policy);
    log.info('Permission policy updated');
    this.emit('permission:policy:updated', this.policy);
  }

  /**
   * Get current policy
   */
  getPolicy(): PermissionPolicy {
    return { ...this.policy };
  }

  /**
   * Revoke all permissions for device
   */
  async revokeAllPermissions(deviceId: string): Promise<void> {
    const deviceRules = Array.from(this.rules.values()).filter(
      (rule) => rule.deviceId === deviceId
    );

    for (const rule of deviceRules) {
      await this.revokePermission(deviceId, rule.permission);
    }

    log.info(`Revoked all permissions for device: ${deviceId}`);
  }

  /**
   * Export permissions
   */
  exportPermissions(): Record<string, any> {
    return {
      rules: Array.from(this.rules.values()),
      policy: this.policy,
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Import permissions
   */
  importPermissions(data: Record<string, any>): void {
    if (data.rules && Array.isArray(data.rules)) {
      data.rules.forEach((rule: PermissionRule) => {
        this.rules.set(rule.id, rule);
      });
    }

    if (data.policy) {
      this.policy = data.policy;
    }

    log.info('Permissions imported');
  }
}

// Export singleton instance
export const permissionSystem = new PermissionSystem();
