export type ValidationRule = 'required' | 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'url' | 'uuid' | 'ip' | 'port' | 'path' | 'filename' | 'deviceId';
export interface ValidationSchema {
    [key: string]: {
        type: ValidationRule | ValidationRule[];
        required?: boolean;
        min?: number;
        max?: number;
        pattern?: RegExp;
        enum?: any[];
        custom?: (value: any) => boolean;
        sanitize?: (value: any) => any;
        message?: string;
    };
}
export interface ValidationResult {
    valid: boolean;
    errors: Array<{
        field: string;
        message: string;
        value?: any;
    }>;
    sanitized?: Record<string, any>;
}
/**
 * Input Validator
 * Validates and sanitizes user input to prevent injection attacks
 */
export declare class InputValidator {
    private readonly SQL_INJECTION_PATTERN;
    private readonly XSS_PATTERN;
    private readonly PATH_TRAVERSAL_PATTERN;
    private readonly COMMAND_INJECTION_PATTERN;
    /**
     * Validate input against schema
     */
    validate(input: Record<string, any>, schema: ValidationSchema): ValidationResult;
    /**
     * Validate type
     */
    private validateType;
    /**
     * Validate constraints
     */
    private validateConstraints;
    /**
     * Sanitize value
     */
    private sanitize;
    /**
     * Check for SQL injection
     */
    detectSqlInjection(input: string): boolean;
    /**
     * Check for XSS
     */
    detectXss(input: string): boolean;
    /**
     * Check for path traversal
     */
    detectPathTraversal(input: string): boolean;
    /**
     * Check for command injection
     */
    detectCommandInjection(input: string): boolean;
    /**
     * Sanitize filename
     */
    sanitizeFilename(filename: string): string;
    /**
     * Sanitize path
     */
    sanitizePath(path: string): string;
    /**
     * Escape HTML
     */
    escapeHtml(text: string): string;
    /**
     * Validate URL
     */
    private isValidUrl;
    /**
     * Validate IP address
     */
    private isValidIp;
    /**
     * Validate filename
     */
    private isValidFilename;
    /**
     * Validate and sanitize deeply nested object
     */
    validateDeep(input: any, maxDepth?: number): {
        valid: boolean;
        sanitized: any;
    };
}
export declare const inputValidator: InputValidator;
//# sourceMappingURL=input-validator.d.ts.map