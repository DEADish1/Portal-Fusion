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
exports.keystoreService = exports.KeyStoreService = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const encryption_1 = require("./encryption");
const shared_1 = require("@portal-fusion/shared");
/**
 * Secure Key Storage Service
 * Manages encryption keys with secure storage
 */
class KeyStoreService {
    constructor() {
        this.keys = new Map();
        this.initialized = false;
        const paths = (0, shared_1.getPlatformPaths)();
        this.keystorePath = path.join(paths.data, 'keystore.json');
    }
    /**
     * Initialize keystore with master password
     */
    async initialize(masterPassword) {
        // Derive master key from password
        const { key } = encryption_1.encryptionService.deriveKey(masterPassword);
        this.masterKey = key;
        // Try to load existing keystore
        try {
            await this.load();
        }
        catch (error) {
            // Keystore doesn't exist, create new one
            await this.save();
        }
        this.initialized = true;
    }
    /**
     * Ensure keystore is initialized
     */
    ensureInitialized() {
        if (!this.initialized || !this.masterKey) {
            throw (0, shared_1.createError)('SYSTEM_OPERATION_FAILED', 'KeyStore not initialized');
        }
    }
    /**
     * Store a key pair
     */
    async storeKeyPair(alias, keyPair, type, purpose, deviceId) {
        this.ensureInitialized();
        // Encrypt private key with master key
        const { encrypted, iv, tag } = encryption_1.encryptionService.encrypt(keyPair.privateKey, this.masterKey);
        const id = encryption_1.encryptionService.generateToken(16);
        const storedKey = {
            id,
            alias,
            type,
            publicKey: keyPair.publicKey,
            encryptedPrivateKey: JSON.stringify({
                encrypted: encrypted.toString('base64'),
                iv: iv.toString('base64'),
                tag: tag.toString('base64'),
            }),
            metadata: {
                createdAt: keyPair.createdAt,
                expiresAt: keyPair.expiresAt,
                purpose,
                deviceId,
            },
        };
        this.keys.set(id, storedKey);
        await this.save();
        return id;
    }
    /**
     * Store a symmetric key
     */
    async storeSymmetricKey(alias, key, purpose, expiresAt) {
        this.ensureInitialized();
        // Encrypt symmetric key with master key
        const { encrypted, iv, tag } = encryption_1.encryptionService.encrypt(key, this.masterKey);
        const id = encryption_1.encryptionService.generateToken(16);
        const storedKey = {
            id,
            alias,
            type: 'aes',
            key: JSON.stringify({
                encrypted: encrypted.toString('base64'),
                iv: iv.toString('base64'),
                tag: tag.toString('base64'),
            }),
            metadata: {
                createdAt: new Date(),
                expiresAt,
                purpose,
            },
        };
        this.keys.set(id, storedKey);
        await this.save();
        return id;
    }
    /**
     * Retrieve a key pair
     */
    async getKeyPair(idOrAlias) {
        this.ensureInitialized();
        const storedKey = this.findKey(idOrAlias);
        if (!storedKey || !storedKey.encryptedPrivateKey) {
            return null;
        }
        // Check expiration
        if (storedKey.metadata.expiresAt && new Date() > storedKey.metadata.expiresAt) {
            await this.deleteKey(storedKey.id);
            return null;
        }
        // Decrypt private key
        const encryptedData = JSON.parse(storedKey.encryptedPrivateKey);
        const privateKey = encryption_1.encryptionService.decrypt(Buffer.from(encryptedData.encrypted, 'base64'), this.masterKey, Buffer.from(encryptedData.iv, 'base64'), Buffer.from(encryptedData.tag, 'base64'));
        return {
            publicKey: storedKey.publicKey,
            privateKey: privateKey.toString('utf8'),
            createdAt: storedKey.metadata.createdAt,
            expiresAt: storedKey.metadata.expiresAt,
        };
    }
    /**
     * Retrieve a symmetric key
     */
    async getSymmetricKey(idOrAlias) {
        this.ensureInitialized();
        const storedKey = this.findKey(idOrAlias);
        if (!storedKey || !storedKey.key) {
            return null;
        }
        // Check expiration
        if (storedKey.metadata.expiresAt && new Date() > storedKey.metadata.expiresAt) {
            await this.deleteKey(storedKey.id);
            return null;
        }
        // Decrypt key
        const encryptedData = JSON.parse(storedKey.key);
        return encryption_1.encryptionService.decrypt(Buffer.from(encryptedData.encrypted, 'base64'), this.masterKey, Buffer.from(encryptedData.iv, 'base64'), Buffer.from(encryptedData.tag, 'base64'));
    }
    /**
     * Get public key only
     */
    getPublicKey(idOrAlias) {
        const storedKey = this.findKey(idOrAlias);
        return storedKey?.publicKey || null;
    }
    /**
     * Delete a key
     */
    async deleteKey(idOrAlias) {
        this.ensureInitialized();
        const storedKey = this.findKey(idOrAlias);
        if (!storedKey) {
            return false;
        }
        this.keys.delete(storedKey.id);
        await this.save();
        return true;
    }
    /**
     * List all keys
     */
    listKeys() {
        return Array.from(this.keys.values()).map((key) => ({
            id: key.id,
            alias: key.alias,
            type: key.type,
            publicKey: key.publicKey,
            metadata: key.metadata,
        }));
    }
    /**
     * Find key by ID or alias
     */
    findKey(idOrAlias) {
        // Try by ID first
        const byId = this.keys.get(idOrAlias);
        if (byId)
            return byId;
        // Try by alias
        for (const key of this.keys.values()) {
            if (key.alias === idOrAlias) {
                return key;
            }
        }
        return undefined;
    }
    /**
     * Save keystore to disk
     */
    async save() {
        this.ensureInitialized();
        const data = JSON.stringify(Array.from(this.keys.entries()), (key, value) => {
            if (value instanceof Date) {
                return value.toISOString();
            }
            return value;
        }, 2);
        // Ensure directory exists
        await fs.mkdir(path.dirname(this.keystorePath), { recursive: true });
        // Write to file with restrictive permissions
        await fs.writeFile(this.keystorePath, data, {
            mode: 0o600, // Read/write for owner only
        });
    }
    /**
     * Load keystore from disk
     */
    async load() {
        const data = await fs.readFile(this.keystorePath, 'utf8');
        const entries = JSON.parse(data, (key, value) => {
            // Revive dates
            if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
                return new Date(value);
            }
            return value;
        });
        this.keys = new Map(entries);
    }
    /**
     * Clear all keys (dangerous!)
     */
    async clear() {
        this.keys.clear();
        await this.save();
    }
    /**
     * Rotate master key
     */
    async rotateMasterKey(newMasterPassword) {
        this.ensureInitialized();
        // Derive new master key
        const { key: newMasterKey } = encryption_1.encryptionService.deriveKey(newMasterPassword);
        // Re-encrypt all keys with new master key
        for (const [id, storedKey] of this.keys.entries()) {
            if (storedKey.encryptedPrivateKey) {
                // Decrypt with old key
                const encryptedData = JSON.parse(storedKey.encryptedPrivateKey);
                const privateKey = encryption_1.encryptionService.decrypt(Buffer.from(encryptedData.encrypted, 'base64'), this.masterKey, Buffer.from(encryptedData.iv, 'base64'), Buffer.from(encryptedData.tag, 'base64'));
                // Encrypt with new key
                const { encrypted, iv, tag } = encryption_1.encryptionService.encrypt(privateKey, newMasterKey);
                storedKey.encryptedPrivateKey = JSON.stringify({
                    encrypted: encrypted.toString('base64'),
                    iv: iv.toString('base64'),
                    tag: tag.toString('base64'),
                });
            }
            if (storedKey.key) {
                // Decrypt with old key
                const encryptedData = JSON.parse(storedKey.key);
                const key = encryption_1.encryptionService.decrypt(Buffer.from(encryptedData.encrypted, 'base64'), this.masterKey, Buffer.from(encryptedData.iv, 'base64'), Buffer.from(encryptedData.tag, 'base64'));
                // Encrypt with new key
                const { encrypted, iv, tag } = encryption_1.encryptionService.encrypt(key, newMasterKey);
                storedKey.key = JSON.stringify({
                    encrypted: encrypted.toString('base64'),
                    iv: iv.toString('base64'),
                    tag: tag.toString('base64'),
                });
            }
        }
        // Update master key and save
        this.masterKey = newMasterKey;
        await this.save();
    }
}
exports.KeyStoreService = KeyStoreService;
// Export singleton instance
exports.keystoreService = new KeyStoreService();
//# sourceMappingURL=keystore.js.map