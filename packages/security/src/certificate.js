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
Object.defineProperty(exports, "__esModule", { value: true });
exports.certificateService = exports.CertificateService = void 0;
const crypto = __importStar(require("crypto"));
/**
 * Certificate Management Service
 * Handles device certificates for trust and verification
 */
class CertificateService {
    constructor() {
        this.certificates = new Map();
        this.trustedFingerprints = new Set();
    }
    /**
     * Generate a self-signed certificate for a device
     */
    generateCertificate(device, validityDays = 365) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);
        const cert = {
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
    verifyCertificate(cert) {
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
    trustCertificate(cert) {
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
    revokeTrust(certId) {
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
    isTrusted(fingerprint) {
        return this.trustedFingerprints.has(fingerprint);
    }
    /**
     * Get certificate by ID
     */
    getCertificate(certId) {
        return this.certificates.get(certId);
    }
    /**
     * Get certificate by device ID
     */
    getCertificateByDevice(deviceId) {
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
    getCertificateByFingerprint(fingerprint) {
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
    generateFingerprint(publicKey) {
        return crypto
            .createHash('sha256')
            .update(publicKey)
            .digest('hex')
            .toUpperCase()
            .match(/.{1,2}/g)
            .join(':');
    }
    /**
     * Sign certificate (simple hash-based signature for self-signed certs)
     */
    signCertificate(cert) {
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
    exportToPEM(cert) {
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
    importFromPEM(pem) {
        const data = pem
            .replace('-----BEGIN PORTAL FUSION CERTIFICATE-----', '')
            .replace('-----END PORTAL FUSION CERTIFICATE-----', '')
            .replace(/\s/g, '');
        const json = Buffer.from(data, 'base64').toString('utf8');
        const cert = JSON.parse(json, (key, value) => {
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
    listCertificates() {
        return Array.from(this.certificates.values());
    }
    /**
     * Get all certificates (alias for listCertificates)
     */
    getAllCertificates() {
        return this.listCertificates();
    }
    /**
     * List trusted certificates
     */
    listTrustedCertificates() {
        return Array.from(this.certificates.values()).filter((cert) => cert.verified);
    }
    /**
     * Remove expired certificates
     */
    cleanupExpired() {
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
exports.CertificateService = CertificateService;
// Export singleton instance
exports.certificateService = new CertificateService();
//# sourceMappingURL=certificate.js.map