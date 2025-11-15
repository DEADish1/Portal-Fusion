import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
export type Permission = 'clipboard.read' | 'clipboard.write' | 'files.read' | 'files.write' | 'files.execute' | 'screen.view' | 'screen.control' | 'notifications.read' | 'notifications.send' | 'kvm.control' | 'kvm.receive' | 'audio.capture' | 'audio.playback' | 'camera.access' | 'camera.share' | 'browser.read' | 'browser.write' | 'password.read' | 'password.write' | 'system.settings' | 'system.admin';
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
    defaultExpiration?: number;
}
/**
 * Permission System
 * Manages fine-grained permissions for device features
 */
export declare class PermissionSystem extends TypedEventEmitter<PortalFusionEvents> {
    private rules;
    private requests;
    private policy;
    /**
     * Initialize permission system
     */
    initialize(): void;
    /**
     * Request permissions from user
     */
    requestPermissions(deviceId: string, deviceName: string, permissions: Permission[], reason?: string): Promise<PermissionRequest>;
    /**
     * Approve permission request
     */
    approveRequest(requestId: string, grantedBy: string): Promise<void>;
    /**
     * Deny permission request
     */
    denyRequest(requestId: string): Promise<void>;
    /**
     * Grant permission to device
     */
    grantPermission(deviceId: string, permission: Permission, grantedBy: string, reason?: string): Promise<PermissionRule>;
    /**
     * Revoke permission from device
     */
    revokePermission(deviceId: string, permission: Permission): Promise<void>;
    /**
     * Check if device has permission
     */
    hasPermission(deviceId: string, permission: Permission): boolean;
    /**
     * Check multiple permissions
     */
    hasPermissions(deviceId: string, permissions: Permission[]): boolean;
    /**
     * Get all permissions for device
     */
    getDevicePermissions(deviceId: string): PermissionRule[];
    /**
     * Get pending requests
     */
    getPendingRequests(): PermissionRequest[];
    /**
     * Clean up expired permissions
     */
    cleanupExpiredPermissions(): Promise<void>;
    /**
     * Update policy
     */
    updatePolicy(policy: Partial<PermissionPolicy>): void;
    /**
     * Get current policy
     */
    getPolicy(): PermissionPolicy;
    /**
     * Revoke all permissions for device
     */
    revokeAllPermissions(deviceId: string): Promise<void>;
    /**
     * Export permissions
     */
    exportPermissions(): Record<string, any>;
    /**
     * Import permissions
     */
    importPermissions(data: Record<string, any>): void;
}
export declare const permissionSystem: PermissionSystem;
//# sourceMappingURL=permission-system.d.ts.map