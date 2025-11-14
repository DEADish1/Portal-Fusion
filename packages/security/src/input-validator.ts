import log from 'electron-log';

export type ValidationRule =
  | 'required'
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'email'
  | 'url'
  | 'uuid'
  | 'ip'
  | 'port'
  | 'path'
  | 'filename'
  | 'deviceId';

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
export class InputValidator {
  // Dangerous patterns
  private readonly SQL_INJECTION_PATTERN = /('|(--)|;|\/\*|\*\/|xp_|sp_|exec|execute|select|insert|update|delete|drop|create|alter|union)/i;
  private readonly XSS_PATTERN = /<script|javascript:|onerror=|onload=|onclick=/i;
  private readonly PATH_TRAVERSAL_PATTERN = /\.\.[\/\\]/;
  private readonly COMMAND_INJECTION_PATTERN = /[;&|`$()]/;

  /**
   * Validate input against schema
   */
  validate(input: Record<string, any>, schema: ValidationSchema): ValidationResult {
    const errors: ValidationResult['errors'] = [];
    const sanitized: Record<string, any> = {};

    // Validate each field
    for (const [field, rules] of Object.entries(schema)) {
      const value = input[field];

      // Check required
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field,
          message: rules.message || `${field} is required`,
          value,
        });
        continue;
      }

      // Skip validation if not required and not provided
      if (!rules.required && (value === undefined || value === null)) {
        continue;
      }

      // Validate type
      const typeErrors = this.validateType(field, value, rules.type, rules.message);
      errors.push(...typeErrors);

      // Validate constraints
      if (typeErrors.length === 0) {
        const constraintErrors = this.validateConstraints(field, value, rules);
        errors.push(...constraintErrors);

        // Custom validation
        if (rules.custom && !rules.custom(value)) {
          errors.push({
            field,
            message: rules.message || `${field} failed custom validation`,
            value,
          });
        }
      }

      // Sanitize
      sanitized[field] = rules.sanitize ? rules.sanitize(value) : this.sanitize(value, rules.type);
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? sanitized : undefined,
    };
  }

  /**
   * Validate type
   */
  private validateType(
    field: string,
    value: any,
    type: ValidationRule | ValidationRule[],
    message?: string
  ): ValidationResult['errors'] {
    const errors: ValidationResult['errors'] = [];
    const types = Array.isArray(type) ? type : [type];

    const isValid = types.some((t) => {
      switch (t) {
        case 'required':
          return value !== undefined && value !== null && value !== '';
        case 'string':
          return typeof value === 'string';
        case 'number':
          return typeof value === 'number' && !isNaN(value);
        case 'boolean':
          return typeof value === 'boolean';
        case 'array':
          return Array.isArray(value);
        case 'object':
          return typeof value === 'object' && value !== null && !Array.isArray(value);
        case 'email':
          return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        case 'url':
          return typeof value === 'string' && this.isValidUrl(value);
        case 'uuid':
          return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
        case 'ip':
          return typeof value === 'string' && this.isValidIp(value);
        case 'port':
          return typeof value === 'number' && value >= 0 && value <= 65535;
        case 'path':
          return typeof value === 'string' && !this.PATH_TRAVERSAL_PATTERN.test(value);
        case 'filename':
          return typeof value === 'string' && this.isValidFilename(value);
        case 'deviceId':
          return typeof value === 'string' && /^[a-zA-Z0-9-_]{1,64}$/.test(value);
        default:
          return true;
      }
    });

    if (!isValid) {
      errors.push({
        field,
        message: message || `${field} must be of type ${types.join(' or ')}`,
        value,
      });
    }

    return errors;
  }

  /**
   * Validate constraints
   */
  private validateConstraints(
    field: string,
    value: any,
    rules: ValidationSchema[string]
  ): ValidationResult['errors'] {
    const errors: ValidationResult['errors'] = [];

    // Min/Max for strings and arrays
    if (typeof value === 'string' || Array.isArray(value)) {
      if (rules.min !== undefined && value.length < rules.min) {
        errors.push({
          field,
          message: `${field} must have at least ${rules.min} characters/items`,
          value,
        });
      }

      if (rules.max !== undefined && value.length > rules.max) {
        errors.push({
          field,
          message: `${field} must have at most ${rules.max} characters/items`,
          value,
        });
      }
    }

    // Min/Max for numbers
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push({
          field,
          message: `${field} must be at least ${rules.min}`,
          value,
        });
      }

      if (rules.max !== undefined && value > rules.max) {
        errors.push({
          field,
          message: `${field} must be at most ${rules.max}`,
          value,
        });
      }
    }

    // Pattern matching
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      errors.push({
        field,
        message: `${field} does not match required pattern`,
        value,
      });
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push({
        field,
        message: `${field} must be one of: ${rules.enum.join(', ')}`,
        value,
      });
    }

    return errors;
  }

  /**
   * Sanitize value
   */
  private sanitize(value: any, type: ValidationRule | ValidationRule[]): any {
    if (typeof value === 'string') {
      // Remove null bytes
      value = value.replace(/\0/g, '');

      // Trim whitespace
      value = value.trim();

      // HTML escape for XSS protection
      value = this.escapeHtml(value);
    }

    return value;
  }

  /**
   * Check for SQL injection
   */
  detectSqlInjection(input: string): boolean {
    return this.SQL_INJECTION_PATTERN.test(input);
  }

  /**
   * Check for XSS
   */
  detectXss(input: string): boolean {
    return this.XSS_PATTERN.test(input);
  }

  /**
   * Check for path traversal
   */
  detectPathTraversal(input: string): boolean {
    return this.PATH_TRAVERSAL_PATTERN.test(input);
  }

  /**
   * Check for command injection
   */
  detectCommandInjection(input: string): boolean {
    return this.COMMAND_INJECTION_PATTERN.test(input);
  }

  /**
   * Sanitize filename
   */
  sanitizeFilename(filename: string): string {
    // Remove path separators and special characters
    return filename
      .replace(/[/\\?%*:|"<>]/g, '')
      .replace(/\.\./g, '')
      .replace(/^\.+/, '')
      .trim();
  }

  /**
   * Sanitize path
   */
  sanitizePath(path: string): string {
    // Remove path traversal attempts
    return path
      .replace(/\.\.[/\\]/g, '')
      .replace(/[^\w\s/\\.-]/g, '')
      .trim();
  }

  /**
   * Escape HTML
   */
  escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    return text.replace(/[&<>"'/]/g, (char) => map[char]);
  }

  /**
   * Validate URL
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:', 'ws:', 'wss:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Validate IP address
   */
  private isValidIp(ip: string): boolean {
    // IPv4
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Pattern.test(ip)) {
      const parts = ip.split('.');
      return parts.every((part) => parseInt(part) <= 255);
    }

    // IPv6 (basic check)
    const ipv6Pattern = /^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i;
    return ipv6Pattern.test(ip);
  }

  /**
   * Validate filename
   */
  private isValidFilename(filename: string): boolean {
    // Check for path traversal
    if (this.PATH_TRAVERSAL_PATTERN.test(filename)) {
      return false;
    }

    // Check for invalid characters
    if (/[<>:"|?*\0]/.test(filename)) {
      return false;
    }

    // Check length
    if (filename.length === 0 || filename.length > 255) {
      return false;
    }

    return true;
  }

  /**
   * Validate and sanitize deeply nested object
   */
  validateDeep(input: any, maxDepth: number = 10): { valid: boolean; sanitized: any } {
    const sanitize = (obj: any, depth: number): any => {
      if (depth > maxDepth) {
        log.warn('Max depth exceeded in input validation');
        return null;
      }

      if (obj === null || obj === undefined) {
        return obj;
      }

      if (typeof obj === 'string') {
        return this.sanitize(obj, 'string');
      }

      if (typeof obj === 'number' || typeof obj === 'boolean') {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map((item) => sanitize(item, depth + 1));
      }

      if (typeof obj === 'object') {
        const sanitized: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
          // Sanitize keys too
          const sanitizedKey = this.sanitize(key, 'string');
          sanitized[sanitizedKey] = sanitize(value, depth + 1);
        }
        return sanitized;
      }

      return obj;
    };

    try {
      const sanitized = sanitize(input, 0);
      return { valid: true, sanitized };
    } catch (error) {
      log.error('Error during deep validation:', error);
      return { valid: false, sanitized: null };
    }
  }
}

// Export singleton instance
export const inputValidator = new InputValidator();
