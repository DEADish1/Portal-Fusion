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
exports.encryptionService = exports.EncryptionService = void 0;
const crypto = __importStar(require("crypto"));
const shared_1 = require("@portal-fusion/shared");
/**
 * Encryption Service using AES-256-GCM
 * Provides secure message encryption with authenticated encryption
 */
class EncryptionService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32; // 256 bits
        this.ivLength = 16; // 128 bits
        this.tagLength = 16; // 128 bits
        this.saltLength = 32; // 256 bits
    }
    /**
     * Generate a secure random key
     */
    generateKey() {
        return crypto.randomBytes(this.keyLength);
    }
    /**
     * Derive a key from a password using PBKDF2
     */
    deriveKey(password, salt) {
        const usedSalt = salt || crypto.randomBytes(this.saltLength);
        const key = crypto.pbkdf2Sync(password, usedSalt, 100000, this.keyLength, 'sha256');
        return { key, salt: usedSalt };
    }
    /**
     * Encrypt data using AES-256-GCM
     */
    encrypt(data, key) {
        try {
            const iv = crypto.randomBytes(this.ivLength);
            const cipher = crypto.createCipheriv(this.algorithm, key, iv);
            const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
            const encrypted = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);
            const tag = cipher.getAuthTag();
            return { encrypted, iv, tag };
        }
        catch (error) {
            throw (0, shared_1.createError)('UNKNOWN_ERROR', 'Encryption failed', error);
        }
    }
    /**
     * Decrypt data using AES-256-GCM
     */
    decrypt(encrypted, key, iv, tag) {
        try {
            const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
            decipher.setAuthTag(tag);
            return Buffer.concat([decipher.update(encrypted), decipher.final()]);
        }
        catch (error) {
            throw (0, shared_1.createError)('UNKNOWN_ERROR', 'Decryption failed', error);
        }
    }
    /**
     * Encrypt a JSON object
     */
    encryptJSON(data, key) {
        const json = JSON.stringify(data);
        const { encrypted, iv, tag } = this.encrypt(json, key);
        return {
            encrypted: encrypted.toString('base64'),
            iv: iv.toString('base64'),
            tag: tag.toString('base64'),
        };
    }
    /**
     * Decrypt a JSON object
     */
    decryptJSON(encrypted, key, iv, tag) {
        const decrypted = this.decrypt(Buffer.from(encrypted, 'base64'), key, Buffer.from(iv, 'base64'), Buffer.from(tag, 'base64'));
        return JSON.parse(decrypted.toString('utf8'));
    }
    /**
     * Generate HMAC for data integrity verification
     */
    generateHMAC(data, key) {
        const hmac = crypto.createHmac('sha256', key);
        const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
        hmac.update(dataBuffer);
        return hmac.digest();
    }
    /**
     * Verify HMAC
     */
    verifyHMAC(data, key, expectedHMAC) {
        const actualHMAC = this.generateHMAC(data, key);
        return crypto.timingSafeEqual(actualHMAC, expectedHMAC);
    }
    /**
     * Generate a cryptographic hash
     */
    hash(data, algorithm = 'sha256') {
        const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
        return crypto.createHash(algorithm).update(dataBuffer).digest();
    }
    /**
     * Generate a secure random token
     */
    generateToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }
    /**
     * Generate ECDH key pair
     */
    generateECDHKeyPair() {
        const ecdh = crypto.createECDH('secp256k1');
        const publicKey = ecdh.generateKeys('base64');
        const privateKey = ecdh.getPrivateKey('base64');
        return {
            publicKey,
            privateKey,
            getSharedSecret: (otherPublicKey) => {
                return ecdh.computeSecret(otherPublicKey, 'base64');
            },
        };
    }
    /**
     * Generate RSA key pair
     */
    generateRSAKeyPair(modulusLength = 2048) {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
            },
        });
        return { publicKey, privateKey };
    }
    /**
     * RSA encrypt (for small data like keys)
     */
    rsaEncrypt(data, publicKey) {
        const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
        return crypto.publicEncrypt(publicKey, dataBuffer);
    }
    /**
     * RSA decrypt
     */
    rsaDecrypt(encrypted, privateKey) {
        return crypto.privateDecrypt(privateKey, encrypted);
    }
    /**
     * Sign data with RSA private key
     */
    rsaSign(data, privateKey) {
        const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
        const sign = crypto.createSign('SHA256');
        sign.update(dataBuffer);
        sign.end();
        return sign.sign(privateKey);
    }
    /**
     * Verify RSA signature
     */
    rsaVerify(data, publicKey, signature) {
        const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
        const verify = crypto.createVerify('SHA256');
        verify.update(dataBuffer);
        verify.end();
        return verify.verify(publicKey, signature);
    }
}
exports.EncryptionService = EncryptionService;
// Export singleton instance
exports.encryptionService = new EncryptionService();
//# sourceMappingURL=encryption.js.map