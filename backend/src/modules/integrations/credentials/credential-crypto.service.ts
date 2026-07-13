import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const DEV_FALLBACK_SEED = 'agencyos-dev-integration-credentials';

export interface EncryptedCredentialPayload {
  readonly ciphertext: string;
  readonly iv: string;
  readonly authTag: string;
  readonly keyVersion: number;
}

@Injectable()
export class CredentialCryptoService {
  private readonly key: Buffer;
  readonly keyVersion = 1;

  constructor() {
    this.key = resolveIntegrationCredentialsKey();
  }

  encrypt(plaintext: string): EncryptedCredentialPayload {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv, { authTagLength: AUTH_TAG_LENGTH });
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      ciphertext: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      keyVersion: this.keyVersion,
    };
  }

  decrypt(payload: EncryptedCredentialPayload): string {
    const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(payload.iv, 'base64'), {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload.ciphertext, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }

  encryptJson(value: Record<string, string>): EncryptedCredentialPayload {
    return this.encrypt(JSON.stringify(value));
  }

  decryptJson(payload: EncryptedCredentialPayload): Record<string, string> {
    const raw = this.decrypt(payload);
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'string') {
        result[key] = value;
      }
    }
    return result;
  }
}

function resolveIntegrationCredentialsKey(): Buffer {
  const configured = process.env.INTEGRATION_CREDENTIALS_KEY?.trim();
  if (configured !== undefined && configured.length > 0) {
    if (/^[0-9a-fA-F]{64}$/.test(configured)) {
      return Buffer.from(configured, 'hex');
    }
    return scryptSync(configured, 'agencyos-integration-credentials', 32);
  }

  return createHash('sha256').update(DEV_FALLBACK_SEED).digest();
}
