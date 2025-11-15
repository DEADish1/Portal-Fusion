import * as crypto from 'crypto';
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
export class CertificateService {
  private certificates: Map<string, Certificate> = new Map();
  private trustedFingerprints: Set<string> = new Set();

  /**
   * Generate a self-signed certificate for a device
   */
  generateCertificate(device: Device, validityDays: number = 365): Certificate {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);

    const cert: Certificate = {
      id: crypto.randomUUID(),
      deviceId: device.id,
      publicKey: device.publicKey,
      fingerprint: this.generateFingerprint(device.publicKey),
      issuedAt: now,
      expiresAt,
      issuer: `Portal Fusion Device ${device.id}`,
      subject: device.name,
      serialNumber: crypto.randomBytes(16).toString('hex'),
      signature: '',
      verified: false,
    };

    // Sign certificate
    cert.signature = this.signCertificate(cert);

    this.certificates.set(cert.id, cert);
    return cert;
  }

  /**
   * Verify a certificate
   */
  verifyCertificate(cert: Certificate): boolean {
    // Check expiration
    if (new Date() > cert.expiresAt) {
      return false;
    }

    // Verify signature
    const expectedSignature = this.signCertificate(cert);
    if (cert.signature !== expectedSignature) {
      return false;
    }

    // Verify fingerprint
    const expectedFingerprint = this.generateFingerprint(cert.publicKey);
    if (cert.fingerprint !== expectedFingerprint) {
      return false;
    }

    return true;
  }

  /**
   * Trust a certificate
   */
  trustCertificate(cert: Certificate): void {
    if (!this.verifyCertificate(cert)) {
      throw new Error('Cannot trust invalid certificate');
    }

    cert.verified = true;
    this.trustedFingerprints.add(cert.fingerprint);
    this.certificates.set(cert.id, cert);
  }

  /**
   * Revoke trust from a certificate
   */
  revokeTrust(certId: string): void {
    const cert = this.certificates.get(certId);
    if (cert) {
      cert.verified = false;
      this.trustedFingerprints.delete(cert.fingerprint);
      this.certificates.set(certId, cert);
    }
  }

  /**
   * Check if a fingerprint is trusted
   */
  isTrusted(fingerprint: string): boolean {
    return this.trustedFingerprints.has(fingerprint);
  }

  /**
   * Get certificate by ID
   */
  getCertificate(certId: string): Certificate | undefined {
    return this.certificates.get(certId);
  }

  /**
   * Get certificate by device ID
   */
  getCertificateByDevice(deviceId: string): Certificate | undefined {
    for (const cert of this.certificates.values()) {
      if (cert.deviceId === deviceId) {
        return cert;
      }
    }
    return undefined;
  }

  /**
   * Get certificate by fingerprint
   */
  getCertificateByFingerprint(fingerprint: string): Certificate | undefined {
    for (const cert of this.certificates.values()) {
      if (cert.fingerprint === fingerprint) {
        return cert;
      }
    }
    return undefined;
  }

  /**
   * Generate fingerprint from public key
   */
  generateFingerprint(publicKey: string): string {
    return crypto
      .createHash('sha256')
      .update(publicKey)
      .digest('hex')
      .toUpperCase()
      .match(/.{1,2}/g)!
      .join(':');
  }

  /**
   * Sign certificate (simple hash-based signature for self-signed certs)
   */
  private signCertificate(cert: Certificate): string {
    const data = JSON.stringify({
      deviceId: cert.deviceId,
      publicKey: cert.publicKey,
      fingerprint: cert.fingerprint,
      issuedAt: cert.issuedAt,
      expiresAt: cert.expiresAt,
      issuer: cert.issuer,
      subject: cert.subject,
      serialNumber: cert.serialNumber,
    });

    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Export certificate to PEM format
   */
  exportToPEM(cert: Certificate): string {
    const data = Buffer.from(JSON.stringify(cert)).toString('base64');
    const lines = data.match(/.{1,64}/g) || [];

    return [
      '-----BEGIN PORTAL FUSION CERTIFICATE-----',
      ...lines,
      '-----END PORTAL FUSION CERTIFICATE-----',
    ].join('\n');
  }

  /**
   * Import certificate from PEM format
   */
  importFromPEM(pem: string): Certificate {
    const data = pem
      .replace('-----BEGIN PORTAL FUSION CERTIFICATE-----', '')
      .replace('-----END PORTAL FUSION CERTIFICATE-----', '')
      .replace(/\s/g, '');

    const json = Buffer.from(data, 'base64').toString('utf8');
    const cert: Certificate = JSON.parse(json, (key, value) => {
      if (key === 'issuedAt' || key === 'expiresAt') {
        return new Date(value);
      }
      return value;
    });

    this.certificates.set(cert.id, cert);
    return cert;
  }

  /**
   * List all certificates
   */
  listCertificates(): Certificate[] {
    return Array.from(this.certificates.values());
  }

  /**
   * Get all certificates (alias for listCertificates)
   */
  getAllCertificates(): Certificate[] {
    return this.listCertificates();
  }

  /**
   * List trusted certificates
   */
  listTrustedCertificates(): Certificate[] {
    return Array.from(this.certificates.values()).filter((cert) => cert.verified);
  }

  /**
   * Remove expired certificates
   */
  cleanupExpired(): number {
    const now = new Date();
    let count = 0;

    for (const [id, cert] of this.certificates.entries()) {
      if (now > cert.expiresAt) {
        this.certificates.delete(id);
        this.trustedFingerprints.delete(cert.fingerprint);
        count++;
      }
    }

    return count;
  }
}

// Export singleton instance
export const certificateService = new CertificateService();
