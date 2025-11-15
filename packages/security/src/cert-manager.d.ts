import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import { Certificate } from './certificate';
export interface CertificateRevocation {
    certificateId: string;
    reason: string;
    revokedAt: Date;
    revokedBy: string;
}
export interface CertificateChain {
    root: Certificate;
    intermediates: Certificate[];
    leaf: Certificate;
}
export interface CertRotationPolicy {
    rotationDays: number;
    warningDays: number;
    autoRotate: boolean;
}
/**
 * Enhanced Certificate Manager
 * Advanced certificate lifecycle management with rotation and revocation
 */
export declare class CertificateManager extends TypedEventEmitter<PortalFusionEvents> {
    private revocationList;
    private rotationPolicy;
    private rotationTimer?;
    /**
     * Initialize certificate manager
     */
    initialize(): void;
    /**
     * Issue new certificate
     */
    issueCertificate(deviceId: string, deviceName: string, validityDays?: number): Promise<Certificate>;
    /**
     * Rotate certificate
     */
    rotateCertificate(oldCertId: string): Promise<Certificate>;
    /**
     * Revoke certificate
     */
    revokeCertificate(certificateId: string, reason: string, revokedBy: string): Promise<void>;
    /**
     * Check if certificate is revoked
     */
    isRevoked(certificateId: string): boolean;
    /**
     * Get revocation info
     */
    getRevocationInfo(certificateId: string): CertificateRevocation | undefined;
    /**
     * Verify certificate with revocation check
     */
    verifyCertificate(cert: Certificate): Promise<{
        valid: boolean;
        reason?: string;
    }>;
    /**
     * Get days until certificate expires
     */
    getDaysUntilExpiry(cert: Certificate): number;
    /**
     * Build certificate chain
     */
    buildCertificateChain(leafCertId: string): Promise<CertificateChain | null>;
    /**
     * Verify certificate chain
     */
    verifyChain(chain: CertificateChain): Promise<boolean>;
    /**
     * Start automatic rotation checks
     */
    private startRotationChecks;
    /**
     * Check certificates for rotation
     */
    private checkForRotation;
    /**
     * Export revocation list
     */
    exportRevocationList(): CertificateRevocation[];
    /**
     * Import revocation list
     */
    importRevocationList(revocations: CertificateRevocation[]): void;
    /**
     * Get certificate statistics
     */
    getStatistics(): {
        total: number;
        revoked: number;
        expiringSoon: number;
        expired: number;
    };
    /**
     * Update rotation policy
     */
    updateRotationPolicy(policy: Partial<CertRotationPolicy>): void;
    /**
     * Get rotation policy
     */
    getRotationPolicy(): CertRotationPolicy;
    /**
     * Cleanup
     */
    cleanup(): void;
}
export declare const certManager: CertificateManager;
//# sourceMappingURL=cert-manager.d.ts.map