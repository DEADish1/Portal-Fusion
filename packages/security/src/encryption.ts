import * as crypto from 'crypto';
import { createError } from '@portal-fusion/shared';

/**
 * Encryption Service using AES-256-GCM
 * Provides secure message encryption with authenticated encryption
 */
export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32; // 256 bits
  private ivLength = 16; // 128 bits
  private tagLength = 16; // 128 bits
  private saltLength = 32; // 256 bits

  /**
   * Generate a secure random key
   */
  generateKey(): Buffer {
    return crypto.randomBytes(this.keyLength);
  }

  /**
   * Derive a key from a password using PBKDF2
   */
  deriveKey(password: string, salt?: Buffer): { key: Buffer; salt: Buffer } {
    const usedSalt = salt || crypto.randomBytes(this.saltLength);
    const key = crypto.pbkdf2Sync(password, usedSalt, 100000, this.keyLength, 'sha256');
    return { key, salt: usedSalt };
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encrypt(data: Buffer | string, key: Buffer): {
    encrypted: Buffer;
    iv: Buffer;
    tag: Buffer;
  } {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);

      const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
      const encrypted = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);
      const tag = cipher.getAuthTag();

      return { encrypted, iv, tag };
    } catch (error) {
      throw createError('UNKNOWN_ERROR', 'Encryption failed', error);
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  decrypt(encrypted: Buffer, key: Buffer, iv: Buffer, tag: Buffer): Buffer {
    try {
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag);

      return Buffer.concat([decipher.update(encrypted), decipher.final()]);
    } catch (error) {
      throw createError('UNKNOWN_ERROR', 'Decryption failed', error);
    }
  }

  /**
   * Encrypt a JSON object
   */
  encryptJSON<T = any>(data: T, key: Buffer): {
    encrypted: string;
    iv: string;
    tag: string;
  } {
    const json = JSON.stringify(data);
    const { encrypted, iv, tag } = this.encrypt(json, key);

    return {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
    };
  }

  /**
   * Decrypt a JSON object
   */
  decryptJSON<T = any>(encrypted: string, key: Buffer, iv: string, tag: string): T {
    const decrypted = this.decrypt(
      Buffer.from(encrypted, 'base64'),
      key,
      Buffer.from(iv, 'base64'),
      Buffer.from(tag, 'base64')
    );

    return JSON.parse(decrypted.toString('utf8'));
  }

  /**
   * Generate HMAC for data integrity verification
   */
  generateHMAC(data: Buffer | string, key: Buffer): Buffer {
    const hmac = crypto.createHmac('sha256', key);
    const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
    hmac.update(dataBuffer);
    return hmac.digest();
  }

  /**
   * Verify HMAC
   */
  verifyHMAC(data: Buffer | string, key: Buffer, expectedHMAC: Buffer): boolean {
    const actualHMAC = this.generateHMAC(data, key);
    return crypto.timingSafeEqual(actualHMAC, expectedHMAC);
  }

  /**
   * Generate a cryptographic hash
   */
  hash(data: Buffer | string, algorithm: string = 'sha256'): Buffer {
    const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
    return crypto.createHash(algorithm).update(dataBuffer).digest();
  }

  /**
   * Generate a secure random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate ECDH key pair
   */
  generateECDHKeyPair(): {
    publicKey: string;
    privateKey: string;
    getSharedSecret: (otherPublicKey: string) => Buffer;
  } {
    const ecdh = crypto.createECDH('secp256k1');
    const publicKey = ecdh.generateKeys('base64');
    const privateKey = ecdh.getPrivateKey('base64');

    return {
      publicKey,
      privateKey,
      getSharedSecret: (otherPublicKey: string) => {
        return ecdh.computeSecret(otherPublicKey, 'base64');
      },
    };
  }

  /**
   * Generate RSA key pair
   */
  generateRSAKeyPair(modulusLength: number = 2048): {
    publicKey: string;
    privateKey: string;
  } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return { publicKey, privateKey };
  }

  /**
   * RSA encrypt (for small data like keys)
   */
  rsaEncrypt(data: Buffer | string, publicKey: string): Buffer {
    const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
    return crypto.publicEncrypt(publicKey, dataBuffer);
  }

  /**
   * RSA decrypt
   */
  rsaDecrypt(encrypted: Buffer, privateKey: string): Buffer {
    return crypto.privateDecrypt(privateKey, encrypted);
  }

  /**
   * Sign data with RSA private key
   */
  rsaSign(data: Buffer | string, privateKey: string): Buffer {
    const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
    const sign = crypto.createSign('SHA256');
    sign.update(dataBuffer);
    sign.end();
    return sign.sign(privateKey);
  }

  /**
   * Verify RSA signature
   */
  rsaVerify(data: Buffer | string, publicKey: string, signature: Buffer): boolean {
    const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
    const verify = crypto.createVerify('SHA256');
    verify.update(dataBuffer);
    verify.end();
    return verify.verify(publicKey, signature);
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();
