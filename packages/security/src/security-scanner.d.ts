import { TypedEventEmitter, PortalFusionEvents } from '@portal-fusion/shared';
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
    maxScanTime?: number;
    quarantineOnDetection?: boolean;
}
/**
 * Security Scanner
 * Integrates multiple security scanning capabilities
 */
export declare class SecurityScanner extends TypedEventEmitter<PortalFusionEvents> {
    private options;
    private threatDatabase;
    private scanHistory;
    private scanCounter;
    private readonly THREAT_SIGNATURES;
    private readonly BEHAVIOR_INDICATORS;
    constructor(options?: ScanOptions);
    /**
     * Load threat signatures into database
     */
    private loadThreatSignatures;
    /**
     * Scan file for threats
     */
    scanFile(filePath: string): Promise<ScanResult>;
    /**
     * Scan URL for threats
     */
    scanUrl(url: string): Promise<ScanResult>;
    /**
     * Scan data for threats
     */
    scanData(data: string, dataType?: string): Promise<ScanResult>;
    /**
     * Convert sandbox results to threat detections
     */
    private convertSandboxThreats;
    /**
     * Perform heuristic scan
     */
    private performHeuristicScan;
    /**
     * Analyze behavior patterns
     */
    private analyzeBehavior;
    /**
     * Scan for threat patterns
     */
    private scanForPatterns;
    /**
     * Calculate overall threat level
     */
    private calculateOverallThreatLevel;
    /**
     * Map risk level to threat level
     */
    private mapRiskLevelToThreatLevel;
    /**
     * Generate recommendations
     */
    private generateRecommendations;
    /**
     * Get scan result by ID
     */
    getScanResult(scanId: string): ScanResult | undefined;
    /**
     * Get scan history
     */
    getScanHistory(limit?: number): ScanResult[];
    /**
     * Clear scan history
     */
    clearHistory(): void;
    /**
     * Add custom threat signature
     */
    addThreatSignature(signature: ThreatSignature): void;
    /**
     * Remove threat signature
     */
    removeThreatSignature(signatureId: string): void;
    /**
     * Get threat database
     */
    getThreatDatabase(): ThreatSignature[];
    /**
     * Update scanner options
     */
    updateOptions(options: Partial<ScanOptions>): void;
    /**
     * Get current options
     */
    getOptions(): Required<ScanOptions>;
}
export declare const securityScanner: SecurityScanner;
//# sourceMappingURL=security-scanner.d.ts.map