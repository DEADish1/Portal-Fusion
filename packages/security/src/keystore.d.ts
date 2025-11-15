export interface KeyPair {
    publicKey: string;
    privateKey: string;
    createdAt: Date;
    expiresAt?: Date;
}
export interface StoredKey {
    id: string;
    alias: string;
    type: 'rsa' | 'ecdh' | 'aes';
    publicKey?: string;
    encryptedPrivateKey?: string;
    key?: string;
    metadata: {
        createdAt: Date;
        expiresAt?: Date;
        purpose: string;
        deviceId?: string;
    };
}
/**
 * Secure Key Storage Service
 * Manages encryption keys with secure storage
 */
export declare class KeyStoreService {
    private keystorePath;
    private keys;
    private masterKey?;
    private initialized;
    constructor();
    /**
     * Initialize keystore with master password
     */
    initialize(masterPassword: string): Promise<void>;
    /**
     * Ensure keystore is initialized
     */
    private ensureInitialized;
    /**
     * Store a key pair
     */
    storeKeyPair(alias: string, keyPair: KeyPair, type: 'rsa' | 'ecdh', purpose: string, deviceId?: string): Promise<string>;
    /**
     * Store a symmetric key
     */
    storeSymmetricKey(alias: string, key: Buffer, purpose: string, expiresAt?: Date): Promise<string>;
    /**
     * Retrieve a key pair
     */
    getKeyPair(idOrAlias: string): Promise<KeyPair | null>;
    /**
     * Retrieve a symmetric key
     */
    getSymmetricKey(idOrAlias: string): Promise<Buffer | null>;
    /**
     * Get public key only
     */
    getPublicKey(idOrAlias: string): string | null;
    /**
     * Delete a key
     */
    deleteKey(idOrAlias: string): Promise<boolean>;
    /**
     * List all keys
     */
    listKeys(): Array<Omit<StoredKey, 'encryptedPrivateKey' | 'key'>>;
    /**
     * Find key by ID or alias
     */
    private findKey;
    /**
     * Save keystore to disk
     */
    private save;
    /**
     * Load keystore from disk
     */
    private load;
    /**
     * Clear all keys (dangerous!)
     */
    clear(): Promise<void>;
    /**
     * Rotate master key
     */
    rotateMasterKey(newMasterPassword: string): Promise<void>;
}
export declare const keystoreService: KeyStoreService;
//# sourceMappingURL=keystore.d.ts.map