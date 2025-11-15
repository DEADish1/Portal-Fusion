import { Device } from '@portal-fusion/shared';
export interface Certificate {
    id: string;
    deviceId: string;
    publicKey: string;
    fingerprint: string;
    issuedAt: Date;
    expiresAt: Date;
    issuer: string;
    subject: string;
    serialNumber: string;
    signature: string;
    verified: boolean;
}
/**
 * Certificate Management Service
 * Handles device certificates for trust and verification
 */
export declare class CertificateService {
    private certificates;
    private trustedFingerprints;
    /**
     * Generate a self-signed certificate for a device
     */
    generateCertificate(device: Device, validityDays?: number): Certificate;
    /**
     * Verify a certificate
     */
    verifyCertificate(cert: Certificate): boolean;
    /**
     * Trust a certificate
     */
    trustCertificate(cert: Certificate): void;
    /**
     * Revoke trust from a certificate
     */
    revokeTrust(certId: string): void;
    /**
     * Check if a fingerprint is trusted
     */
    isTrusted(fingerprint: string): boolean;
    /**
     * Get certificate by ID
     */
    getCertificate(certId: string): Certificate | undefined;
    /**
     * Get certificate by device ID
     */
    getCertificateByDevice(deviceId: string): Certificate | undefined;
    /**
     * Get certificate by fingerprint
     */
    getCertificateByFingerprint(fingerprint: string): Certificate | undefined;
    /**
     * Generate fingerprint from public key
     */
    generateFingerprint(publicKey: string): string;
    /**
     * Sign certificate (simple hash-based signature for self-signed certs)
     */
    private signCertificate;
    /**
     * Export certificate to PEM format
     */
    exportToPEM(cert: Certificate): string;
    /**
     * Import certificate from PEM format
     */
    importFromPEM(pem: string): Certificate;
    /**
     * List all certificates
     */
    listCertificates(): Certificate[];
    /**
     * Get all certificates (alias for listCertificates)
     */
    getAllCertificates(): Certificate[];
    /**
     * List trusted certificates
     */
    listTrustedCertificates(): Certificate[];
    /**
     * Remove expired certificates
     */
    cleanupExpired(): number;
}
export declare const certificateService: CertificateService;
//# sourceMappingURL=certificate.d.ts.map