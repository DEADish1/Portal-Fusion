import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import log from 'electron-log';

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
  maxFileSize?: number; // bytes
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
export class FileSandbox extends TypedEventEmitter<PortalFusionEvents> {
  private options: Required<SandboxOptions>;

  // Dangerous file extensions
  private readonly EXECUTABLE_EXTENSIONS = new Set([
    '.exe', '.dll', '.so', '.dylib', '.app', '.bin', '.bat', '.cmd', '.sh',
    '.ps1', '.vbs', '.jar', '.msi', '.deb', '.rpm',
  ]);

  private readonly SCRIPT_EXTENSIONS = new Set([
    '.js', '.py', '.rb', '.pl', '.php', '.asp', '.jsp', '.cgi',
  ]);

  private readonly ARCHIVE_EXTENSIONS = new Set([
    '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz',
  ]);

  // Dangerous file signatures (magic bytes)
  private readonly MAGIC_BYTES: Record<string, Buffer> = {
    'PE': Buffer.from([0x4D, 0x5A]), // Windows executable
    'ELF': Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // Linux executable
    'Mach-O': Buffer.from([0xFE, 0xED, 0xFA, 0xCE]), // macOS executable
    'ZIP': Buffer.from([0x50, 0x4B, 0x03, 0x04]), // ZIP archive
    'RAR': Buffer.from([0x52, 0x61, 0x72, 0x21]), // RAR archive
  };

  // Suspicious patterns in content
  private readonly SUSPICIOUS_PATTERNS = [
    /eval\s*\(/gi,
    /exec\s*\(/gi,
    /system\s*\(/gi,
    /shell_exec/gi,
    /proc_open/gi,
    /<script/gi,
    /document\.write/gi,
    /window\.location/gi,
    /fromCharCode/gi,
  ];

  constructor(options: SandboxOptions = {}) {
    super();

    this.options = {
      maxFileSize: options.maxFileSize || 100 * 1024 * 1024, // 100MB
      allowedExtensions: options.allowedExtensions || [],
      blockedExtensions: options.blockedExtensions || Array.from(this.EXECUTABLE_EXTENSIONS),
      scanExecutables: options.scanExecutables !== false,
      scanScripts: options.scanScripts !== false,
      scanArchives: options.scanArchives !== false,
    };
  }

  /**
   * Scan file for threats
   */
  async scanFile(filePath: string): Promise<SandboxResult> {
    const threats: string[] = [];
    let riskLevel: FileRiskLevel = 'safe';

    try {
      // Check file size
      const stats = await fs.stat(filePath);
      if (stats.size > this.options.maxFileSize) {
        threats.push('File size exceeds maximum allowed');
        riskLevel = 'high';
      }

      // Get file extension
      const ext = path.extname(filePath).toLowerCase();

      // Check extension blacklist
      if (this.options.blockedExtensions.includes(ext)) {
        threats.push(`Blocked file extension: ${ext}`);
        riskLevel = 'critical';
      }

      // Check extension whitelist
      if (
        this.options.allowedExtensions.length > 0 &&
        !this.options.allowedExtensions.includes(ext)
      ) {
        threats.push(`File extension not in allowed list: ${ext}`);
        riskLevel = this.upgradeRiskLevel(riskLevel, 'high');
      }

      // Read file header for magic bytes
      const header = await this.readFileHeader(filePath, 16);
      const fileHash = await this.calculateFileHash(filePath);

      // Check magic bytes
      if (this.options.scanExecutables) {
        const executableThreat = this.checkMagicBytes(header);
        if (executableThreat) {
          threats.push(executableThreat);
          riskLevel = this.upgradeRiskLevel(riskLevel, 'critical');
        }
      }

      // Scan file content for text-based files
      if (this.shouldScanContent(ext)) {
        const contentThreats = await this.scanFileContent(filePath);
        threats.push(...contentThreats);
        if (contentThreats.length > 0) {
          riskLevel = this.upgradeRiskLevel(riskLevel, 'high');
        }
      }

      // Check for scripts
      if (this.options.scanScripts && this.SCRIPT_EXTENSIONS.has(ext)) {
        threats.push('Script file detected');
        riskLevel = this.upgradeRiskLevel(riskLevel, 'medium');
      }

      // Check for archives
      if (this.options.scanArchives && this.ARCHIVE_EXTENSIONS.has(ext)) {
        threats.push('Archive file detected');
        riskLevel = this.upgradeRiskLevel(riskLevel, 'low');
      }

      const result: SandboxResult = {
        safe: threats.length === 0,
        riskLevel,
        threats,
        fileHash,
      };

      log.info(`File scanned: ${filePath} - Risk: ${riskLevel}`);
      this.emit('sandbox:scan:completed', result);

      return result;
    } catch (error) {
      log.error(`Failed to scan file: ${filePath}`, error);

      return {
        safe: false,
        riskLevel: 'critical',
        threats: ['Failed to scan file'],
        fileHash: '',
      };
    }
  }

  /**
   * Validate file before transfer
   */
  async validateTransfer(filePath: string): Promise<boolean> {
    const result = await this.scanFile(filePath);

    if (result.riskLevel === 'critical' || result.riskLevel === 'high') {
      log.warn(`File transfer blocked: ${filePath} - ${result.threats.join(', ')}`);
      this.emit('sandbox:transfer:blocked', { filePath, result });
      return false;
    }

    return true;
  }

  /**
   * Read file header
   */
  private async readFileHeader(filePath: string, bytes: number): Promise<Buffer> {
    const fileHandle = await fs.open(filePath, 'r');
    try {
      const buffer = Buffer.alloc(bytes);
      await fileHandle.read(buffer, 0, bytes, 0);
      return buffer;
    } finally {
      await fileHandle.close();
    }
  }

  /**
   * Calculate file hash
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  /**
   * Check magic bytes
   */
  private checkMagicBytes(header: Buffer): string | null {
    for (const [type, signature] of Object.entries(this.MAGIC_BYTES)) {
      if (header.slice(0, signature.length).equals(signature)) {
        return `Executable file detected: ${type}`;
      }
    }
    return null;
  }

  /**
   * Should scan file content
   */
  private shouldScanContent(ext: string): boolean {
    const textExtensions = new Set([
      '.txt', '.html', '.htm', '.xml', '.json', '.js', '.ts', '.py', '.rb',
      '.php', '.asp', '.jsp', '.sh', '.bat', '.cmd', '.ps1',
    ]);

    return textExtensions.has(ext);
  }

  /**
   * Scan file content
   */
  private async scanFileContent(filePath: string): Promise<string[]> {
    const threats: string[] = [];

    try {
      const content = await fs.readFile(filePath, 'utf8');

      // Check for suspicious patterns
      for (const pattern of this.SUSPICIOUS_PATTERNS) {
        if (pattern.test(content)) {
          threats.push(`Suspicious pattern detected: ${pattern.source}`);
        }
      }

      // Check for null bytes (indicates binary in text file)
      if (content.includes('\0')) {
        threats.push('Null bytes detected in text file');
      }
    } catch (error) {
      // File might be binary or too large
      log.debug(`Could not scan file content: ${filePath}`);
    }

    return threats;
  }

  /**
   * Upgrade risk level
   */
  private upgradeRiskLevel(current: FileRiskLevel, newLevel: FileRiskLevel): FileRiskLevel {
    const levels: FileRiskLevel[] = ['safe', 'low', 'medium', 'high', 'critical'];
    const currentIndex = levels.indexOf(current);
    const newIndex = levels.indexOf(newLevel);

    return currentIndex > newIndex ? current : newLevel;
  }

  /**
   * Quarantine file
   */
  async quarantineFile(filePath: string, quarantineDir: string): Promise<string> {
    await fs.mkdir(quarantineDir, { recursive: true });

    const filename = path.basename(filePath);
    const timestamp = Date.now();
    const quarantinePath = path.join(quarantineDir, `${timestamp}-${filename}.quarantine`);

    await fs.rename(filePath, quarantinePath);

    log.warn(`File quarantined: ${filePath} -> ${quarantinePath}`);
    this.emit('sandbox:file:quarantined', { originalPath: filePath, quarantinePath });

    return quarantinePath;
  }

  /**
   * Check if file is safe to execute
   */
  async isSafeToExecute(filePath: string): Promise<boolean> {
    const result = await this.scanFile(filePath);

    // Never execute files with critical or high risk
    if (result.riskLevel === 'critical' || result.riskLevel === 'high') {
      return false;
    }

    // Check if it's an executable
    const ext = path.extname(filePath).toLowerCase();
    if (this.EXECUTABLE_EXTENSIONS.has(ext)) {
      log.warn(`Attempted to execute file with executable extension: ${filePath}`);
      return false;
    }

    return result.safe;
  }

  /**
   * Update options
   */
  updateOptions(options: Partial<SandboxOptions>): void {
    Object.assign(this.options, options);
    log.info('Sandbox options updated');
  }

  /**
   * Get current options
   */
  getOptions(): Required<SandboxOptions> {
    return { ...this.options };
  }
}

// Export singleton instance
export const fileSandbox = new FileSandbox();
