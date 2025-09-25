// /config/crypto.ts
import 'dotenv/config';
import fs from 'fs';
import { CryptoConfig } from '../types/crypto';

export const CRYPTO_ALGO = 'aes-256-gcm' as const;
export const CRYPTO_IV_LEN = 12;   // recommended for GCM
export const CRYPTO_TAG_LEN = 16;  // 128-bit tag

/**
 * Two ways to configure:
 * 1) Single key via .env:
 *    - CRYPTO_KEY_BASE64=...
 *    - CRYPTO_KID (optional, default "k1")
 *    - CRYPTO_VERSION (optional, default "v1")
 *    - CRYPTO_REQUIRE_AAD (optional "true"/"false", default "false")
 *
 * 2) JSON file via .env:
 *    - CRYPTO_KEYS_FILE=./secrets/crypto-keys.json
 *    The file format:
 *    {
 *      "version": "v1",
 *      "requireAad": false,
 *      "current": { "kid": "k2", "keyBase64": "..." },
 *      "retired": [{ "kid": "k1", "keyBase64": "..." }]
 *    }
 */

const loadFromEnvOrFile = (): CryptoConfig => {
  const filePath = process.env.CRYPTO_KEYS_FILE?.trim();

  if (filePath) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as {
      version?: string;
      requireAad?: boolean;
      current: { kid: string; keyBase64: string };
      retired?: Array<{ kid: string; keyBase64: string }>;
    };

    const version = parsed.version ?? 'v1';
    const requireAad = !!parsed.requireAad;

    const currentKey = Buffer.from(parsed.current.keyBase64, 'base64');
    if (currentKey.length !== 32) {
      throw new Error('CRYPTO_KEYS_FILE: current.keyBase64 must decode to 32 bytes');
    }

    const retired = (parsed.retired ?? []).map(r => {
      const key = Buffer.from(r.keyBase64, 'base64');
      if (key.length !== 32) {
        throw new Error(`CRYPTO_KEYS_FILE: retired key "${r.kid}" must decode to 32 bytes`);
      }
      return { kid: r.kid, key };
    });

    return {
      version,
      requireAad,
      current: { kid: parsed.current.kid, key: currentKey },
      retired
    };
  }

  // Single-key env mode
  const keyB64 = process.env.CRYPTO_KEY_BASE64 || '';
  const key = Buffer.from(keyB64, 'base64');
  if (key.length !== 32) {
    throw new Error('CRYPTO_KEY_BASE64 must decode to 32 bytes (AES-256 key)');
  }

  const kid = process.env.CRYPTO_KID || 'k1';
  const version = process.env.CRYPTO_VERSION || 'v1';
  const requireAad = (process.env.CRYPTO_REQUIRE_AAD || 'false').toLowerCase() === 'true';

  return {
    version,
    requireAad,
    current: { kid, key },
    retired: []
  };
}

export const cryptoConfig: CryptoConfig = loadFromEnvOrFile();
