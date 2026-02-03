import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const SALT_LENGTH = 32;
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = {
  N: 16384, // CPU/memory cost parameter
  r: 8, // block size
  p: 1, // parallelization
};

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH, SCRYPT_OPTIONS)) as Buffer;
  
  // Format: algorithm$N$r$p$salt$hash (all base64 encoded where applicable)
  const saltBase64 = salt.toString("base64");
  const hashBase64 = derivedKey.toString("base64");
  
  return `scrypt$${SCRYPT_OPTIONS.N}$${SCRYPT_OPTIONS.r}$${SCRYPT_OPTIONS.p}$${saltBase64}$${hashBase64}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const parts = storedHash.split("$");
    if (parts.length !== 6 || parts[0] !== "scrypt") {
      return false;
    }
    
    const [, nStr, rStr, pStr, saltBase64, hashBase64] = parts;
    const N = parseInt(nStr, 10);
    const r = parseInt(rStr, 10);
    const p = parseInt(pStr, 10);
    
    if (isNaN(N) || isNaN(r) || isNaN(p)) {
      return false;
    }
    
    const salt = Buffer.from(saltBase64, "base64");
    const storedKey = Buffer.from(hashBase64, "base64");
    
    const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH, { N, r, p })) as Buffer;
    
    return timingSafeEqual(derivedKey, storedKey);
  } catch {
    return false;
  }
}

export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString("hex");
}

export function isStrongPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  
  if (password.length > 128) {
    errors.push("Password must be at most 128 characters long");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
