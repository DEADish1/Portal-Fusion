import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import { Certificate, certificateService } from './certificate';
import * as crypto from 'crypto';
import log from 'electron-log';

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
export class CertificateManager extends TypedEventEmitter<PortalFusionEvents> {
  private revocationList: Map<string, CertificateRevocation> = new Map();
  private rotationPolicy: CertRotationPolicy = {
    rotationDays: 90,
    warningDays: 14,
    autoRotate: true,
  };
  private rotationTimer?: NodeJS.Timeout;

  /**
   * Initialize certificate manager
   */
  initialize(): void {
    // Start rotation check timer
    if (this.rotationPolicy.autoRotate) {
      this.startRotationChecks();
    }

    log.info('Certificate manager initialized');
  }

  /**
   * Issue new certificate
   */
  async issueCertificate(
    deviceId: string,
    deviceName: string,
    validityDays?: number
  ): Promise<Certificate> {
    const device = {
      id: deviceId,
      name: deviceName,
      type: 'unknown' as any,
      platform: 'unknown' as any,
      hostname: 'unknown',
      ip: '0.0.0.0',
      port: 0,
      publicKey: crypto.randomBytes(256).toString('base64'), // Placeholder
      status: 'offline' as any,
      capabilities: {} as any,
      lastSeen: new Date(),
      metadata: {
        os: 'unknown',
        version: '0.0.0',
        arch: 'unknown',
      },
      paired: false,
      trusted: false,
    };

    const cert = certificateService.generateCertificate(
      device,
      validityDays || this.rotationPolicy.rotationDays
    );

    log.info(`Certificate issued for device: ${deviceId}`);
    this.emit('cert:issued', cert);

    return cert;
  }

  /**
   * Rotate certificate
   */
  async rotateCertificate(oldCertId: string): Promise<Certificate> {
    const oldCert = certificateService.getCertificate(oldCertId);

    if (!oldCert) {
      throw new Error('Certificate not found');
    }

    // Issue new certificate
    const newCert = await this.issueCertificate(
      oldCert.deviceId,
      oldCert.subject,
      this.rotationPolicy.rotationDays
    );

    // Mark old certificate as revoked
    await this.revokeCertificate(oldCertId, 'superseded', 'system');

    log.info(`Certificate rotated for device: ${oldCert.deviceId}`);
    this.emit('cert:rotated', { oldCert, newCert });

    return newCert;
  }

  /**
   * Revoke certificate
   */
  async revokeCertificate(
    certificateId: string,
    reason: string,
    revokedBy: string
  ): Promise<void> {
    const revocation: CertificateRevocation = {
      certificateId,
      reason,
      revokedAt: new Date(),
      revokedBy,
    };

    this.revocationList.set(certificateId, revocation);

    log.warn(`Certificate revoked: ${certificateId} - ${reason}`);
    this.emit('cert:revoked', revocation);
  }

  /**
   * Check if certificate is revoked
   */
  isRevoked(certificateId: string): boolean {
    return this.revocationList.has(certificateId);
  }

  /**
   * Get revocation info
   */
  getRevocationInfo(certificateId: string): CertificateRevocation | undefined {
    return this.revocationList.get(certificateId);
  }

  /**
   * Verify certificate with revocation check
   */
  async verifyCertificate(cert: Certificate): Promise<{
    valid: boolean;
    reason?: string;
  }> {
    // Check revocation
    if (this.isRevoked(cert.id)) {
      const revocation = this.getRevocationInfo(cert.id);
      return {
        valid: false,
        reason: `Certificate revoked: ${revocation?.reason}`,
      };
    }

    // Check basic validity
    const isValid = certificateService.verifyCertificate(cert);

    if (!isValid) {
      return {
        valid: false,
        reason: 'Certificate validation failed',
      };
    }

    // Check expiration warning
    const daysUntilExpiry = this.getDaysUntilExpiry(cert);
    if (daysUntilExpiry <= this.rotationPolicy.warningDays) {
      this.emit('cert:expiring-soon', {
        cert,
        daysRemaining: daysUntilExpiry,
      });
    }

    return { valid: true };
  }

  /**
   * Get days until certificate expires
   */
  getDaysUntilExpiry(cert: Certificate): number {
    const now = new Date();
    const diffMs = cert.expiresAt.getTime() - now.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Build certificate chain
   */
  async buildCertificateChain(leafCertId: string): Promise<CertificateChain | null> {
    const leaf = certificateService.getCertificate(leafCertId);

    if (!leaf) {
      return null;
    }

    // For now, simple self-signed chain
    // In production, would build full chain with intermediates
    return {
      root: leaf,
      intermediates: [],
      leaf,
    };
  }

  /**
   * Verify certificate chain
   */
  async verifyChain(chain: CertificateChain): Promise<boolean> {
    // Verify each certificate in chain
    const rootValid = await this.verifyCertificate(chain.root);
    if (!rootValid.valid) {
      return false;
    }

    for (const intermediate of chain.intermediates) {
      const valid = await this.verifyCertificate(intermediate);
      if (!valid.valid) {
        return false;
      }
    }

    const leafValid = await this.verifyCertificate(chain.leaf);
    return leafValid.valid;
  }

  /**
   * Start automatic rotation checks
   */
  private startRotationChecks(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }

    this.rotationTimer = setInterval(async () => {
      await this.checkForRotation();
    }, 24 * 60 * 60 * 1000); // Check daily

    log.info('Certificate rotation checks started');
  }

  /**
   * Check certificates for rotation
   */
  private async checkForRotation(): Promise<void> {
    const allCerts = certificateService.getAllCertificates();

    for (const cert of allCerts) {
      // Skip revoked certificates
      if (this.isRevoked(cert.id)) {
        continue;
      }

      const daysUntilExpiry = this.getDaysUntilExpiry(cert);

      // Rotate if expired or close to expiry
      if (daysUntilExpiry <= 0) {
        log.warn(`Certificate expired, rotating: ${cert.id}`);
        await this.rotateCertificate(cert.id);
      } else if (daysUntilExpiry <= this.rotationPolicy.warningDays) {
        log.info(`Certificate expiring soon: ${cert.id} (${daysUntilExpiry} days)`);
        this.emit('cert:expiring-soon', {
          cert,
          daysRemaining: daysUntilExpiry,
        });
      }
    }
  }

  /**
   * Export revocation list
   */
  exportRevocationList(): CertificateRevocation[] {
    return Array.from(this.revocationList.values());
  }

  /**
   * Import revocation list
   */
  importRevocationList(revocations: CertificateRevocation[]): void {
    revocations.forEach((revocation) => {
      this.revocationList.set(revocation.certificateId, revocation);
    });

    log.info(`Imported ${revocations.length} certificate revocations`);
  }

  /**
   * Get certificate statistics
   */
  getStatistics(): {
    total: number;
    revoked: number;
    expiringSoon: number;
    expired: number;
  } {
    const allCerts = certificateService.getAllCertificates();

    return {
      total: allCerts.length,
      revoked: this.revocationList.size,
      expiringSoon: allCerts.filter(
        (cert: Certificate) =>
          this.getDaysUntilExpiry(cert) <= this.rotationPolicy.warningDays &&
          this.getDaysUntilExpiry(cert) > 0
      ).length,
      expired: allCerts.filter((cert: Certificate) => this.getDaysUntilExpiry(cert) <= 0).length,
    };
  }

  /**
   * Update rotation policy
   */
  updateRotationPolicy(policy: Partial<CertRotationPolicy>): void {
    Object.assign(this.rotationPolicy, policy);

    if (policy.autoRotate !== undefined) {
      if (this.rotationPolicy.autoRotate) {
        this.startRotationChecks();
      } else if (this.rotationTimer) {
        clearInterval(this.rotationTimer);
        this.rotationTimer = undefined;
      }
    }

    log.info('Certificate rotation policy updated');
  }

  /**
   * Get rotation policy
   */
  getRotationPolicy(): CertRotationPolicy {
    return { ...this.rotationPolicy };
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }

    log.info('Certificate manager cleaned up');
  }
}

// Export singleton instance
export const certManager = new CertificateManager();
