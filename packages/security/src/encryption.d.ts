/**
 * Encryption Service using AES-256-GCM
 * Provides secure message encryption with authenticated encryption
 */
export declare class EncryptionService {
    private algorithm;
    private keyLength;
    private ivLength;
    private tagLength;
    private saltLength;
    /**
     * Generate a secure random key
     */
    generateKey(): Buffer;
    /**
     * Derive a key from a password using PBKDF2
     */
    deriveKey(password: string, salt?: Buffer): {
        key: Buffer;
        salt: Buffer;
    };
    /**
     * Encrypt data using AES-256-GCM
     */
    encrypt(data: Buffer | string, key: Buffer): {
        encrypted: Buffer;
        iv: Buffer;
        tag: Buffer;
    };
    /**
     * Decrypt data using AES-256-GCM
     */
    decrypt(encrypted: Buffer, key: Buffer, iv: Buffer, tag: Buffer): Buffer;
    /**
     * Encrypt a JSON object
     */
    encryptJSON<T = any>(data: T, key: Buffer): {
        encrypted: string;
        iv: string;
        tag: string;
    };
    /**
     * Decrypt a JSON object
     */
    decryptJSON<T = any>(encrypted: string, key: Buffer, iv: string, tag: string): T;
    /**
     * Generate HMAC for data integrity verification
     */
    generateHMAC(data: Buffer | string, key: Buffer): Buffer;
    /**
     * Verify HMAC
     */
    verifyHMAC(data: Buffer | string, key: Buffer, expectedHMAC: Buffer): boolean;
    /**
     * Generate a cryptographic hash
     */
    hash(data: Buffer | string, algorithm?: string): Buffer;
    /**
     * Generate a secure random token
     */
    generateToken(length?: number): string;
    /**
     * Generate ECDH key pair
     */
    generateECDHKeyPair(): {
        publicKey: string;
        privateKey: string;
        getSharedSecret: (otherPublicKey: string) => Buffer;
    };
    /**
     * Generate RSA key pair
     */
    generateRSAKeyPair(modulusLength?: number): {
        publicKey: string;
        privateKey: string;
    };
    /**
     * RSA encrypt (for small data like keys)
     */
    rsaEncrypt(data: Buffer | string, publicKey: string): Buffer;
    /**
     * RSA decrypt
     */
    rsaDecrypt(encrypted: Buffer, privateKey: string): Buffer;
    /**
     * Sign data with RSA private key
     */
    rsaSign(data: Buffer | string, privateKey: string): Buffer;
    /**
     * Verify RSA signature
     */
    rsaVerify(data: Buffer | string, publicKey: string, signature: Buffer): boolean;
}
export declare const encryptionService: EncryptionService;
//# sourceMappingURL=encryption.d.ts.map