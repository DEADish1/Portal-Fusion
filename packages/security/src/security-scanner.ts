import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
import { fileSandbox, SandboxResult } from './file-sandbox';
import { inputValidator } from './input-validator';
import { auditLogger } from './audit-logger';
import log from 'electron-log';

export type ThreatLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface ThreatSignature {
  id: string;
  name: string;
  type: 'malware' | 'vulnerability' | 'exploit' | 'phishing' | 'ransomware' | 'trojan';
  severity: ThreatLevel;
  pattern?: RegExp;
  indicators?: string[];
  description: string;
}

export interface ScanResult {
  scanId: string;
  timestamp: Date;
  target: {
    type: 'file' | 'url' | 'data' | 'network';
    value: string;
  };
  threatLevel: ThreatLevel;
  threats: ThreatDetection[];
  safe: boolean;
  scanDuration: number;
  recommendations: string[];
}

export interface ThreatDetection {
  signatureId: string;
  signatureName: string;
  type: ThreatSignature['type'];
  severity: ThreatLevel;
  confidence: number;
  evidence: string[];
  mitigation?: string;
}

export interface ScanOptions {
  enableFileScan?: boolean;
  enableNetworkScan?: boolean;
  enableBehaviorAnalysis?: boolean;
  enableHeuristicDetection?: boolean;
  maxScanTime?: number; // milliseconds
  quarantineOnDetection?: boolean;
}

/**
 * Security Scanner
 * Integrates multiple security scanning capabilities
 */
export class SecurityScanner extends TypedEventEmitter<PortalFusionEvents> {
  private options: Required<ScanOptions>;
  private threatDatabase: Map<string, ThreatSignature>;
  private scanHistory: Map<string, ScanResult>;
  private scanCounter: number;

  // Known threat signatures
  private readonly THREAT_SIGNATURES: ThreatSignature[] = [
    {
      id: 'MAL-001',
      name: 'Generic Malware Pattern',
      type: 'malware',
      severity: 'critical',
      pattern: /eval\s*\(\s*atob\s*\(|exec\s*\(\s*base64_decode/gi,
      description: 'Obfuscated code execution pattern commonly used in malware',
    },
    {
      id: 'MAL-002',
      name: 'Cryptominer Pattern',
      type: 'malware',
      severity: 'high',
      pattern: /coinhive|cryptonight|monero.*mining|stratum\+tcp/gi,
      description: 'Cryptocurrency mining code detected',
    },
    {
      id: 'VUL-001',
      name: 'SQL Injection',
      type: 'vulnerability',
      severity: 'high',
      description: 'SQL injection vulnerability detected',
    },
    {
      id: 'VUL-002',
      name: 'Cross-Site Scripting (XSS)',
      type: 'vulnerability',
      severity: 'high',
      description: 'XSS vulnerability detected',
    },
    {
      id: 'VUL-003',
      name: 'Path Traversal',
      type: 'vulnerability',
      severity: 'high',
      description: 'Path traversal vulnerability detected',
    },
    {
      id: 'VUL-004',
      name: 'Command Injection',
      type: 'vulnerability',
      severity: 'critical',
      description: 'Command injection vulnerability detected',
    },
    {
      id: 'EXP-001',
      name: 'Remote Code Execution',
      type: 'exploit',
      severity: 'critical',
      pattern: /shellcode|metasploit|msfvenom|reverse.*shell/gi,
      description: 'Remote code execution exploit detected',
    },
    {
      id: 'PHISH-001',
      name: 'Credential Harvesting',
      type: 'phishing',
      severity: 'high',
      pattern: /password.*submit|login.*form.*fake|credential.*harvest/gi,
      description: 'Credential harvesting attempt detected',
    },
    {
      id: 'RANSOM-001',
      name: 'Ransomware Pattern',
      type: 'ransomware',
      severity: 'critical',
      pattern: /\.encrypt|\.locked|ransom.*note|bitcoin.*payment|files.*encrypted/gi,
      description: 'Ransomware behavior detected',
    },
    {
      id: 'TROJAN-001',
      name: 'Backdoor Pattern',
      type: 'trojan',
      severity: 'critical',
      pattern: /backdoor|remote.*access.*trojan|rat.*server|keylogger/gi,
      description: 'Backdoor or trojan pattern detected',
    },
  ];

  // Suspicious behavior indicators
  private readonly BEHAVIOR_INDICATORS = [
    {
      pattern: /registry.*run|autostart|startup.*folder/gi,
      severity: 'medium' as ThreatLevel,
      description: 'Persistence mechanism detected',
    },
    {
      pattern: /disable.*antivirus|kill.*defender|stop.*firewall/gi,
      severity: 'critical' as ThreatLevel,
      description: 'Security software tampering detected',
    },
    {
      pattern: /encrypt.*files|delete.*shadow.*copies|vssadmin.*delete/gi,
      severity: 'critical' as ThreatLevel,
      description: 'Ransomware-like behavior detected',
    },
    {
      pattern: /screenshot|keylog|clipboard.*steal/gi,
      severity: 'high' as ThreatLevel,
      description: 'Information stealing behavior detected',
    },
  ];

  constructor(options: ScanOptions = {}) {
    super();

    this.options = {
      enableFileScan: options.enableFileScan !== false,
      enableNetworkScan: options.enableNetworkScan !== false,
      enableBehaviorAnalysis: options.enableBehaviorAnalysis !== false,
      enableHeuristicDetection: options.enableHeuristicDetection !== false,
      maxScanTime: options.maxScanTime || 30000, // 30 seconds
      quarantineOnDetection: options.quarantineOnDetection !== false,
    };

    this.threatDatabase = new Map();
    this.scanHistory = new Map();
    this.scanCounter = 0;

    // Load threat signatures
    this.loadThreatSignatures();
  }

  /**
   * Load threat signatures into database
   */
  private loadThreatSignatures(): void {
    for (const signature of this.THREAT_SIGNATURES) {
      this.threatDatabase.set(signature.id, signature);
    }
    log.info(`Loaded ${this.threatDatabase.size} threat signatures`);
  }

  /**
   * Scan file for threats
   */
  async scanFile(filePath: string): Promise<ScanResult> {
    const startTime = Date.now();
    const scanId = `scan-${++this.scanCounter}-${Date.now()}`;
    const threats: ThreatDetection[] = [];

    try {
      log.info(`Starting security scan: ${scanId} - ${filePath}`);

      // File sandbox scan
      if (this.options.enableFileScan) {
        const sandboxResult = await fileSandbox.scanFile(filePath);
        threats.push(...this.convertSandboxThreats(sandboxResult));
      }

      // Heuristic detection
      if (this.options.enableHeuristicDetection) {
        const heuristicThreats = await this.performHeuristicScan(filePath);
        threats.push(...heuristicThreats);
      }

      // Behavior analysis
      if (this.options.enableBehaviorAnalysis) {
        const behaviorThreats = await this.analyzeBehavior(filePath);
        threats.push(...behaviorThreats);
      }

      const scanDuration = Date.now() - startTime;
      const threatLevel = this.calculateOverallThreatLevel(threats);

      const result: ScanResult = {
        scanId,
        timestamp: new Date(),
        target: {
          type: 'file',
          value: filePath,
        },
        threatLevel,
        threats,
        safe: threatLevel === 'none' || threatLevel === 'low',
        scanDuration,
        recommendations: this.generateRecommendations(threats, threatLevel),
      };

      // Store in history
      this.scanHistory.set(scanId, result);

      // Log to audit
      await auditLogger.log(
        result.safe ? 'info' : 'warning',
        'security-event',
        'security:scan',
        true,
        {
          data: {
            scanId,
            target: filePath,
            threatLevel,
            threatsFound: threats.length,
          },
        }
      );

      // Emit event
      this.emit('security:scan:completed', result);

      log.info(`Security scan completed: ${scanId} - Threat Level: ${threatLevel}`);

      return result;
    } catch (error) {
      log.error(`Security scan failed: ${scanId}`, error);

      const result: ScanResult = {
        scanId,
        timestamp: new Date(),
        target: {
          type: 'file',
          value: filePath,
        },
        threatLevel: 'critical',
        threats: [
          {
            signatureId: 'ERR-001',
            signatureName: 'Scan Error',
            type: 'malware',
            severity: 'critical',
            confidence: 1.0,
            evidence: [error instanceof Error ? error.message : 'Unknown error'],
            mitigation: 'File could not be scanned - treat as potentially dangerous',
          },
        ],
        safe: false,
        scanDuration: Date.now() - startTime,
        recommendations: ['Unable to scan file - recommend manual inspection'],
      };

      return result;
    }
  }

  /**
   * Scan URL for threats
   */
  async scanUrl(url: string): Promise<ScanResult> {
    const startTime = Date.now();
    const scanId = `scan-${++this.scanCounter}-${Date.now()}`;
    const threats: ThreatDetection[] = [];

    try {
      // Check URL format
      if (inputValidator.detectXss(url)) {
        threats.push({
          signatureId: 'VUL-002',
          signatureName: 'Cross-Site Scripting (XSS)',
          type: 'vulnerability',
          severity: 'high',
          confidence: 0.9,
          evidence: ['XSS pattern detected in URL'],
        });
      }

      // Check for known malicious patterns in URL
      const urlThreats = this.scanForPatterns(url);
      threats.push(...urlThreats);

      const scanDuration = Date.now() - startTime;
      const threatLevel = this.calculateOverallThreatLevel(threats);

      const result: ScanResult = {
        scanId,
        timestamp: new Date(),
        target: {
          type: 'url',
          value: url,
        },
        threatLevel,
        threats,
        safe: threatLevel === 'none' || threatLevel === 'low',
        scanDuration,
        recommendations: this.generateRecommendations(threats, threatLevel),
      };

      this.scanHistory.set(scanId, result);

      return result;
    } catch (error) {
      log.error(`URL scan failed: ${scanId}`, error);

      return {
        scanId,
        timestamp: new Date(),
        target: {
          type: 'url',
          value: url,
        },
        threatLevel: 'medium',
        threats: [],
        safe: false,
        scanDuration: Date.now() - startTime,
        recommendations: ['Unable to complete URL scan'],
      };
    }
  }

  /**
   * Scan data for threats
   */
  async scanData(data: string, dataType: string = 'unknown'): Promise<ScanResult> {
    const startTime = Date.now();
    const scanId = `scan-${++this.scanCounter}-${Date.now()}`;
    const threats: ThreatDetection[] = [];

    try {
      // Input validation checks
      if (inputValidator.detectSqlInjection(data)) {
        threats.push({
          signatureId: 'VUL-001',
          signatureName: 'SQL Injection',
          type: 'vulnerability',
          severity: 'high',
          confidence: 0.9,
          evidence: ['SQL injection pattern detected'],
        });
      }

      if (inputValidator.detectXss(data)) {
        threats.push({
          signatureId: 'VUL-002',
          signatureName: 'Cross-Site Scripting (XSS)',
          type: 'vulnerability',
          severity: 'high',
          confidence: 0.9,
          evidence: ['XSS pattern detected'],
        });
      }

      if (inputValidator.detectCommandInjection(data)) {
        threats.push({
          signatureId: 'VUL-004',
          signatureName: 'Command Injection',
          type: 'vulnerability',
          severity: 'critical',
          confidence: 0.9,
          evidence: ['Command injection pattern detected'],
        });
      }

      // Pattern matching
      const patternThreats = this.scanForPatterns(data);
      threats.push(...patternThreats);

      const scanDuration = Date.now() - startTime;
      const threatLevel = this.calculateOverallThreatLevel(threats);

      const result: ScanResult = {
        scanId,
        timestamp: new Date(),
        target: {
          type: 'data',
          value: `${dataType} (${data.length} bytes)`,
        },
        threatLevel,
        threats,
        safe: threatLevel === 'none' || threatLevel === 'low',
        scanDuration,
        recommendations: this.generateRecommendations(threats, threatLevel),
      };

      this.scanHistory.set(scanId, result);

      return result;
    } catch (error) {
      log.error(`Data scan failed: ${scanId}`, error);

      return {
        scanId,
        timestamp: new Date(),
        target: {
          type: 'data',
          value: dataType,
        },
        threatLevel: 'medium',
        threats: [],
        safe: false,
        scanDuration: Date.now() - startTime,
        recommendations: ['Unable to complete data scan'],
      };
    }
  }

  /**
   * Convert sandbox results to threat detections
   */
  private convertSandboxThreats(sandboxResult: SandboxResult): ThreatDetection[] {
    if (sandboxResult.safe) {
      return [];
    }

    const threats: ThreatDetection[] = [];

    for (const threat of sandboxResult.threats) {
      const severity = this.mapRiskLevelToThreatLevel(sandboxResult.riskLevel);

      threats.push({
        signatureId: 'FILE-SCAN',
        signatureName: threat,
        type: 'malware',
        severity,
        confidence: 0.8,
        evidence: [threat],
        mitigation: 'File has been flagged by sandbox scanner',
      });
    }

    return threats;
  }

  /**
   * Perform heuristic scan
   */
  private async performHeuristicScan(filePath: string): Promise<ThreatDetection[]> {
    const threats: ThreatDetection[] = [];

    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(filePath, 'utf8').catch(() => '');

      if (content) {
        const patternThreats = this.scanForPatterns(content);
        threats.push(...patternThreats);
      }
    } catch (error) {
      // File might be binary or unreadable
      log.debug(`Could not perform heuristic scan on: ${filePath}`);
    }

    return threats;
  }

  /**
   * Analyze behavior patterns
   */
  private async analyzeBehavior(filePath: string): Promise<ThreatDetection[]> {
    const threats: ThreatDetection[] = [];

    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(filePath, 'utf8').catch(() => '');

      if (content) {
        for (const indicator of this.BEHAVIOR_INDICATORS) {
          if (indicator.pattern.test(content)) {
            threats.push({
              signatureId: 'BEHAVIOR',
              signatureName: indicator.description,
              type: 'malware',
              severity: indicator.severity,
              confidence: 0.7,
              evidence: [indicator.description],
              mitigation: 'Suspicious behavior detected - recommend further analysis',
            });
          }
        }
      }
    } catch (error) {
      log.debug(`Could not analyze behavior for: ${filePath}`);
    }

    return threats;
  }

  /**
   * Scan for threat patterns
   */
  private scanForPatterns(content: string): ThreatDetection[] {
    const threats: ThreatDetection[] = [];

    for (const signature of this.threatDatabase.values()) {
      if (signature.pattern && signature.pattern.test(content)) {
        threats.push({
          signatureId: signature.id,
          signatureName: signature.name,
          type: signature.type,
          severity: signature.severity,
          confidence: 0.85,
          evidence: [signature.description],
          mitigation: `Detected: ${signature.description}`,
        });
      }
    }

    return threats;
  }

  /**
   * Calculate overall threat level
   */
  private calculateOverallThreatLevel(threats: ThreatDetection[]): ThreatLevel {
    if (threats.length === 0) {
      return 'none';
    }

    const levels: ThreatLevel[] = ['none', 'low', 'medium', 'high', 'critical'];
    let maxLevel: ThreatLevel = 'none';

    for (const threat of threats) {
      const currentIndex = levels.indexOf(maxLevel);
      const threatIndex = levels.indexOf(threat.severity);

      if (threatIndex > currentIndex) {
        maxLevel = threat.severity;
      }
    }

    return maxLevel;
  }

  /**
   * Map risk level to threat level
   */
  private mapRiskLevelToThreatLevel(riskLevel: string): ThreatLevel {
    switch (riskLevel) {
      case 'safe':
        return 'none';
      case 'low':
        return 'low';
      case 'medium':
        return 'medium';
      case 'high':
        return 'high';
      case 'critical':
        return 'critical';
      default:
        return 'medium';
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(threats: ThreatDetection[], threatLevel: ThreatLevel): string[] {
    const recommendations: string[] = [];

    if (threatLevel === 'none') {
      recommendations.push('No threats detected - file appears safe');
      return recommendations;
    }

    if (threatLevel === 'critical' || threatLevel === 'high') {
      recommendations.push('DO NOT execute or open this file');
      recommendations.push('Quarantine the file immediately');
      recommendations.push('Run a full system scan');
    }

    if (threatLevel === 'medium') {
      recommendations.push('Exercise caution with this file');
      recommendations.push('Verify the source before proceeding');
    }

    if (threatLevel === 'low') {
      recommendations.push('Minor concerns detected');
      recommendations.push('Review file contents manually');
    }

    // Specific recommendations based on threat types
    const hasRansomware = threats.some((t) => t.type === 'ransomware');
    const hasTrojan = threats.some((t) => t.type === 'trojan');
    const hasExploit = threats.some((t) => t.type === 'exploit');

    if (hasRansomware) {
      recommendations.push('Ransomware detected - ensure backups are current');
    }

    if (hasTrojan) {
      recommendations.push('Trojan detected - check for unauthorized network connections');
    }

    if (hasExploit) {
      recommendations.push('Exploit detected - update security patches');
    }

    return recommendations;
  }

  /**
   * Get scan result by ID
   */
  getScanResult(scanId: string): ScanResult | undefined {
    return this.scanHistory.get(scanId);
  }

  /**
   * Get scan history
   */
  getScanHistory(limit?: number): ScanResult[] {
    const history = Array.from(this.scanHistory.values());
    history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Clear scan history
   */
  clearHistory(): void {
    this.scanHistory.clear();
    log.info('Scan history cleared');
  }

  /**
   * Add custom threat signature
   */
  addThreatSignature(signature: ThreatSignature): void {
    this.threatDatabase.set(signature.id, signature);
    log.info(`Added threat signature: ${signature.id} - ${signature.name}`);
  }

  /**
   * Remove threat signature
   */
  removeThreatSignature(signatureId: string): void {
    this.threatDatabase.delete(signatureId);
    log.info(`Removed threat signature: ${signatureId}`);
  }

  /**
   * Get threat database
   */
  getThreatDatabase(): ThreatSignature[] {
    return Array.from(this.threatDatabase.values());
  }

  /**
   * Update scanner options
   */
  updateOptions(options: Partial<ScanOptions>): void {
    Object.assign(this.options, options);
    log.info('Security scanner options updated');
  }

  /**
   * Get current options
   */
  getOptions(): Required<ScanOptions> {
    return { ...this.options };
  }
}

// Export singleton instance
export const securityScanner = new SecurityScanner();
