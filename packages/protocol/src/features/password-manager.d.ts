import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import { Message } from '@portal-fusion/shared';
export interface PasswordManagerOptions {
    enabled?: boolean;
    requireMasterPassword?: boolean;
    autoFill?: boolean;
    autoSync?: boolean;
    passwordStrength?: 'low' | 'medium' | 'high' | 'paranoid';
    syncInterval?: number;
}
export interface PasswordEntry {
    id: string;
    domain: string;
    username: string;
    encryptedPassword: string;
    iv: string;
    tag: string;
    notes?: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    lastUsed?: Date;
    strength: number;
    isFavorite: boolean;
}
export interface PasswordVault {
    id: string;
    name: string;
    entries: Map<string, PasswordEntry>;
    encryptionKey?: Buffer;
    locked: boolean;
    lastSync: Date;
}
export interface PasswordGeneratorOptions {
    length?: number;
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
    excludeSimilar?: boolean;
    excludeAmbiguous?: boolean;
}
/**
 * Password Manager Integration Service
 * Securely sync and manage passwords between devices
 */
export declare class PasswordManagerService extends TypedEventEmitter<PortalFusionEvents> {
    private options;
    private localDeviceId?;
    private vault?;
    private masterPasswordHash?;
    private syncInterval?;
    private readonly STRENGTH_REQUIREMENTS;
    constructor(options?: PasswordManagerOptions);
    /**
     * Initialize service
     */
    initialize(localDeviceId: string): void;
    /**
     * Set master password
     */
    setMasterPassword(password: string): Promise<void>;
    /**
     * Unlock vault with master password
     */
    unlockVault(password: string): Promise<boolean>;
    /**
     * Lock vault
     */
    lockVault(): void;
    /**
     * Add password entry
     */
    addPassword(domain: string, username: string, password: string, notes?: string, tags?: string[]): Promise<PasswordEntry>;
    /**
     * Get password entry
     */
    getPassword(entryId: string): Promise<string>;
    /**
     * Update password entry
     */
    updatePassword(entryId: string, updates: {
        password?: string;
        username?: string;
        notes?: string;
        tags?: string[];
    }): Promise<void>;
    /**
     * Delete password entry
     */
    deletePassword(entryId: string): Promise<void>;
    /**
     * Search passwords
     */
    searchPasswords(query: string): PasswordEntry[];
    /**
     * Get passwords for domain
     */
    getPasswordsForDomain(domain: string): PasswordEntry[];
    /**
     * Generate secure password
     */
    generatePassword(options?: PasswordGeneratorOptions): string;
    /**
     * Calculate password strength (0-100)
     */
    calculatePasswordStrength(password: string): number;
    /**
     * Sync passwords with connected devices
     */
    syncPasswords(): Promise<void>;
    /**
     * Handle password sync message
     */
    handleSyncMessage(message: Message): Promise<void>;
    /**
     * Export vault (encrypted)
     */
    exportVault(): Promise<string>;
    /**
     * Import vault (encrypted)
     */
    importVault(encryptedData: string): Promise<void>;
    /**
     * Get all entries
     */
    getAllEntries(): PasswordEntry[];
    /**
     * Get weak passwords
     */
    getWeakPasswords(): PasswordEntry[];
    /**
     * Start auto-sync
     */
    private startAutoSync;
    /**
     * Stop auto-sync
     */
    private stopAutoSync;
    /**
     * Update settings
     */
    updateSettings(options: Partial<PasswordManagerOptions>): void;
    /**
     * Get current settings
     */
    getSettings(): Required<PasswordManagerOptions>;
    /**
     * Cleanup
     */
    cleanup(): void;
}
export declare const passwordManagerService: PasswordManagerService;
//# sourceMappingURL=password-manager.d.ts.map