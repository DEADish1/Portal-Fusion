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
exports.certManager = exports.CertificateManager = void 0;
const shared_1 = require("@portal-fusion/shared");
const certificate_1 = require("./certificate");
const crypto = __importStar(require("crypto"));
const electron_log_1 = __importDefault(require("electron-log"));
/**
 * Enhanced Certificate Manager
 * Advanced certificate lifecycle management with rotation and revocation
 */
class CertificateManager extends shared_1.TypedEventEmitter {
    constructor() {
        super(...arguments);
        this.revocationList = new Map();
        this.rotationPolicy = {
            rotationDays: 90,
            warningDays: 14,
            autoRotate: true,
        };
    }
    /**
     * Initialize certificate manager
     */
    initialize() {
        // Start rotation check timer
        if (this.rotationPolicy.autoRotate) {
            this.startRotationChecks();
        }
        electron_log_1.default.info('Certificate manager initialized');
    }
    /**
     * Issue new certificate
     */
    async issueCertificate(deviceId, deviceName, validityDays) {
        const device = {
            id: deviceId,
            name: deviceName,
            type: 'unknown',
            platform: 'unknown',
            hostname: 'unknown',
            ip: '0.0.0.0',
            port: 0,
            publicKey: crypto.randomBytes(256).toString('base64'), // Placeholder
            status: 'offline',
            capabilities: {},
            lastSeen: new Date(),
            metadata: {
                os: 'unknown',
                version: '0.0.0',
                arch: 'unknown',
            },
            paired: false,
            trusted: false,
        };
        const cert = certificate_1.certificateService.generateCertificate(device, validityDays || this.rotationPolicy.rotationDays);
        electron_log_1.default.info(`Certificate issued for device: ${deviceId}`);
        this.emit('cert:issued', cert);
        return cert;
    }
    /**
     * Rotate certificate
     */
    async rotateCertificate(oldCertId) {
        const oldCert = certificate_1.certificateService.getCertificate(oldCertId);
        if (!oldCert) {
            throw new Error('Certificate not found');
        }
        // Issue new certificate
        const newCert = await this.issueCertificate(oldCert.deviceId, oldCert.subject, this.rotationPolicy.rotationDays);
        // Mark old certificate as revoked
        await this.revokeCertificate(oldCertId, 'superseded', 'system');
        electron_log_1.default.info(`Certificate rotated for device: ${oldCert.deviceId}`);
        this.emit('cert:rotated', { oldCert, newCert });
        return newCert;
    }
    /**
     * Revoke certificate
     */
    async revokeCertificate(certificateId, reason, revokedBy) {
        const revocation = {
            certificateId,
            reason,
            revokedAt: new Date(),
            revokedBy,
        };
        this.revocationList.set(certificateId, revocation);
        electron_log_1.default.warn(`Certificate revoked: ${certificateId} - ${reason}`);
        this.emit('cert:revoked', revocation);
    }
    /**
     * Check if certificate is revoked
     */
    isRevoked(certificateId) {
        return this.revocationList.has(certificateId);
    }
    /**
     * Get revocation info
     */
    getRevocationInfo(certificateId) {
        return this.revocationList.get(certificateId);
    }
    /**
     * Verify certificate with revocation check
     */
    async verifyCertificate(cert) {
        // Check revocation
        if (this.isRevoked(cert.id)) {
            const revocation = this.getRevocationInfo(cert.id);
            return {
                valid: false,
                reason: `Certificate revoked: ${revocation?.reason}`,
            };
        }
        // Check basic validity
        const isValid = certificate_1.certificateService.verifyCertificate(cert);
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
    getDaysUntilExpiry(cert) {
        const now = new Date();
        const diffMs = cert.expiresAt.getTime() - now.getTime();
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }
    /**
     * Build certificate chain
     */
    async buildCertificateChain(leafCertId) {
        const leaf = certificate_1.certificateService.getCertificate(leafCertId);
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
    async verifyChain(chain) {
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
    startRotationChecks() {
        if (this.rotationTimer) {
            clearInterval(this.rotationTimer);
        }
        this.rotationTimer = setInterval(async () => {
            await this.checkForRotation();
        }, 24 * 60 * 60 * 1000); // Check daily
        electron_log_1.default.info('Certificate rotation checks started');
    }
    /**
     * Check certificates for rotation
     */
    async checkForRotation() {
        const allCerts = certificate_1.certificateService.getAllCertificates();
        for (const cert of allCerts) {
            // Skip revoked certificates
            if (this.isRevoked(cert.id)) {
                continue;
            }
            const daysUntilExpiry = this.getDaysUntilExpiry(cert);
            // Rotate if expired or close to expiry
            if (daysUntilExpiry <= 0) {
                electron_log_1.default.warn(`Certificate expired, rotating: ${cert.id}`);
                await this.rotateCertificate(cert.id);
            }
            else if (daysUntilExpiry <= this.rotationPolicy.warningDays) {
                electron_log_1.default.info(`Certificate expiring soon: ${cert.id} (${daysUntilExpiry} days)`);
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
    exportRevocationList() {
        return Array.from(this.revocationList.values());
    }
    /**
     * Import revocation list
     */
    importRevocationList(revocations) {
        revocations.forEach((revocation) => {
            this.revocationList.set(revocation.certificateId, revocation);
        });
        electron_log_1.default.info(`Imported ${revocations.length} certificate revocations`);
    }
    /**
     * Get certificate statistics
     */
    getStatistics() {
        const allCerts = certificate_1.certificateService.getAllCertificates();
        return {
            total: allCerts.length,
            revoked: this.revocationList.size,
            expiringSoon: allCerts.filter((cert) => this.getDaysUntilExpiry(cert) <= this.rotationPolicy.warningDays &&
                this.getDaysUntilExpiry(cert) > 0).length,
            expired: allCerts.filter((cert) => this.getDaysUntilExpiry(cert) <= 0).length,
        };
    }
    /**
     * Update rotation policy
     */
    updateRotationPolicy(policy) {
        Object.assign(this.rotationPolicy, policy);
        if (policy.autoRotate !== undefined) {
            if (this.rotationPolicy.autoRotate) {
                this.startRotationChecks();
            }
            else if (this.rotationTimer) {
                clearInterval(this.rotationTimer);
                this.rotationTimer = undefined;
            }
        }
        electron_log_1.default.info('Certificate rotation policy updated');
    }
    /**
     * Get rotation policy
     */
    getRotationPolicy() {
        return { ...this.rotationPolicy };
    }
    /**
     * Cleanup
     */
    cleanup() {
        if (this.rotationTimer) {
            clearInterval(this.rotationTimer);
        }
        electron_log_1.default.info('Certificate manager cleaned up');
    }
}
exports.CertificateManager = CertificateManager;
// Export singleton instance
exports.certManager = new CertificateManager();
//# sourceMappingURL=cert-manager.js.map