import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
export type FileRiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';
export interface SandboxResult {
    safe: boolean;
    riskLevel: FileRiskLevel;
    threats: string[];
    fileHash: string;
    mimeType?: string;
    metadata?: Record<string, any>;
}
export interface SandboxOptions {
    maxFileSize?: number;
    allowedExtensions?: string[];
    blockedExtensions?: string[];
    scanExecutables?: boolean;
    scanScripts?: boolean;
    scanArchives?: boolean;
}
/**
 * File Sandbox
 * Scans and validates files before execution or transfer
 */
export declare class FileSandbox extends TypedEventEmitter<PortalFusionEvents> {
    private options;
    private readonly EXECUTABLE_EXTENSIONS;
    private readonly SCRIPT_EXTENSIONS;
    private readonly ARCHIVE_EXTENSIONS;
    private readonly MAGIC_BYTES;
    private readonly SUSPICIOUS_PATTERNS;
    constructor(options?: SandboxOptions);
    /**
     * Scan file for threats
     */
    scanFile(filePath: string): Promise<SandboxResult>;
    /**
     * Validate file before transfer
     */
    validateTransfer(filePath: string): Promise<boolean>;
    /**
     * Read file header
     */
    private readFileHeader;
    /**
     * Calculate file hash
     */
    private calculateFileHash;
    /**
     * Check magic bytes
     */
    private checkMagicBytes;
    /**
     * Should scan file content
     */
    private shouldScanContent;
    /**
     * Scan file content
     */
    private scanFileContent;
    /**
     * Upgrade risk level
     */
    private upgradeRiskLevel;
    /**
     * Quarantine file
     */
    quarantineFile(filePath: string, quarantineDir: string): Promise<string>;
    /**
     * Check if file is safe to execute
     */
    isSafeToExecute(filePath: string): Promise<boolean>;
    /**
     * Update options
     */
    updateOptions(options: Partial<SandboxOptions>): void;
    /**
     * Get current options
     */
    getOptions(): Required<SandboxOptions>;
}
export declare const fileSandbox: FileSandbox;
//# sourceMappingURL=file-sandbox.d.ts.map