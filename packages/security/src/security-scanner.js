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
exports.securityScanner = exports.SecurityScanner = void 0;
const shared_1 = require("@portal-fusion/shared");
const file_sandbox_1 = require("./file-sandbox");
const input_validator_1 = require("./input-validator");
const audit_logger_1 = require("./audit-logger");
const electron_log_1 = __importDefault(require("electron-log"));
/**
 * Security Scanner
 * Integrates multiple security scanning capabilities
 */
class SecurityScanner extends shared_1.TypedEventEmitter {
    constructor(options = {}) {
        super();
        // Known threat signatures
        this.THREAT_SIGNATURES = [
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
        this.BEHAVIOR_INDICATORS = [
            {
                pattern: /registry.*run|autostart|startup.*folder/gi,
                severity: 'medium',
                description: 'Persistence mechanism detected',
            },
            {
                pattern: /disable.*antivirus|kill.*defender|stop.*firewall/gi,
                severity: 'critical',
                description: 'Security software tampering detected',
            },
            {
                pattern: /encrypt.*files|delete.*shadow.*copies|vssadmin.*delete/gi,
                severity: 'critical',
                description: 'Ransomware-like behavior detected',
            },
            {
                pattern: /screenshot|keylog|clipboard.*steal/gi,
                severity: 'high',
                description: 'Information stealing behavior detected',
            },
        ];
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
    loadThreatSignatures() {
        for (const signature of this.THREAT_SIGNATURES) {
            this.threatDatabase.set(signature.id, signature);
        }
        electron_log_1.default.info(`Loaded ${this.threatDatabase.size} threat signatures`);
    }
    /**
     * Scan file for threats
     */
    async scanFile(filePath) {
        const startTime = Date.now();
        const scanId = `scan-${++this.scanCounter}-${Date.now()}`;
        const threats = [];
        try {
            electron_log_1.default.info(`Starting security scan: ${scanId} - ${filePath}`);
            // File sandbox scan
            if (this.options.enableFileScan) {
                const sandboxResult = await file_sandbox_1.fileSandbox.scanFile(filePath);
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
            const result = {
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
            await audit_logger_1.auditLogger.log(result.safe ? 'info' : 'warning', 'security-event', 'security:scan', true, {
                data: {
                    scanId,
                    target: filePath,
                    threatLevel,
                    threatsFound: threats.length,
                },
            });
            // Emit event
            this.emit('security:scan:completed', result);
            electron_log_1.default.info(`Security scan completed: ${scanId} - Threat Level: ${threatLevel}`);
            return result;
        }
        catch (error) {
            electron_log_1.default.error(`Security scan failed: ${scanId}`, error);
            const result = {
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
    async scanUrl(url) {
        const startTime = Date.now();
        const scanId = `scan-${++this.scanCounter}-${Date.now()}`;
        const threats = [];
        try {
            // Check URL format
            if (input_validator_1.inputValidator.detectXss(url)) {
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
            const result = {
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
        }
        catch (error) {
            electron_log_1.default.error(`URL scan failed: ${scanId}`, error);
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
    async scanData(data, dataType = 'unknown') {
        const startTime = Date.now();
        const scanId = `scan-${++this.scanCounter}-${Date.now()}`;
        const threats = [];
        try {
            // Input validation checks
            if (input_validator_1.inputValidator.detectSqlInjection(data)) {
                threats.push({
                    signatureId: 'VUL-001',
                    signatureName: 'SQL Injection',
                    type: 'vulnerability',
                    severity: 'high',
                    confidence: 0.9,
                    evidence: ['SQL injection pattern detected'],
                });
            }
            if (input_validator_1.inputValidator.detectXss(data)) {
                threats.push({
                    signatureId: 'VUL-002',
                    signatureName: 'Cross-Site Scripting (XSS)',
                    type: 'vulnerability',
                    severity: 'high',
                    confidence: 0.9,
                    evidence: ['XSS pattern detected'],
                });
            }
            if (input_validator_1.inputValidator.detectCommandInjection(data)) {
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
            const result = {
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
        }
        catch (error) {
            electron_log_1.default.error(`Data scan failed: ${scanId}`, error);
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
    convertSandboxThreats(sandboxResult) {
        if (sandboxResult.safe) {
            return [];
        }
        const threats = [];
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
    async performHeuristicScan(filePath) {
        const threats = [];
        try {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            const content = await fs.readFile(filePath, 'utf8').catch(() => '');
            if (content) {
                const patternThreats = this.scanForPatterns(content);
                threats.push(...patternThreats);
            }
        }
        catch (error) {
            // File might be binary or unreadable
            electron_log_1.default.debug(`Could not perform heuristic scan on: ${filePath}`);
        }
        return threats;
    }
    /**
     * Analyze behavior patterns
     */
    async analyzeBehavior(filePath) {
        const threats = [];
        try {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
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
        }
        catch (error) {
            electron_log_1.default.debug(`Could not analyze behavior for: ${filePath}`);
        }
        return threats;
    }
    /**
     * Scan for threat patterns
     */
    scanForPatterns(content) {
        const threats = [];
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
    calculateOverallThreatLevel(threats) {
        if (threats.length === 0) {
            return 'none';
        }
        const levels = ['none', 'low', 'medium', 'high', 'critical'];
        let maxLevel = 'none';
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
    mapRiskLevelToThreatLevel(riskLevel) {
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
    generateRecommendations(threats, threatLevel) {
        const recommendations = [];
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
    getScanResult(scanId) {
        return this.scanHistory.get(scanId);
    }
    /**
     * Get scan history
     */
    getScanHistory(limit) {
        const history = Array.from(this.scanHistory.values());
        history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return limit ? history.slice(0, limit) : history;
    }
    /**
     * Clear scan history
     */
    clearHistory() {
        this.scanHistory.clear();
        electron_log_1.default.info('Scan history cleared');
    }
    /**
     * Add custom threat signature
     */
    addThreatSignature(signature) {
        this.threatDatabase.set(signature.id, signature);
        electron_log_1.default.info(`Added threat signature: ${signature.id} - ${signature.name}`);
    }
    /**
     * Remove threat signature
     */
    removeThreatSignature(signatureId) {
        this.threatDatabase.delete(signatureId);
        electron_log_1.default.info(`Removed threat signature: ${signatureId}`);
    }
    /**
     * Get threat database
     */
    getThreatDatabase() {
        return Array.from(this.threatDatabase.values());
    }
    /**
     * Update scanner options
     */
    updateOptions(options) {
        Object.assign(this.options, options);
        electron_log_1.default.info('Security scanner options updated');
    }
    /**
     * Get current options
     */
    getOptions() {
        return { ...this.options };
    }
}
exports.SecurityScanner = SecurityScanner;
// Export singleton instance
exports.securityScanner = new SecurityScanner();
//# sourceMappingURL=security-scanner.js.map