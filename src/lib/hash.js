/**
 * Password hashing utilities using bcryptjs (pure JS — works in browser & Node).
 * Passwords are hashed with bcrypt (cost factor 10) before storage.
 * Plain-text passwords are NEVER stored in localStorage or the database.
 */
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a plain-text password. Returns a bcrypt hash string.
 * Example: hashPassword('admin123') => '$2a$10$...'
 */
export async function hashPassword(plainText) {
  if (!plainText) return '';
  // If already a bcrypt hash, return as-is (idempotent)
  if (isBcryptHash(plainText)) return plainText;
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plainText, salt);
}

/**
 * Compare a plain-text password against a stored bcrypt hash.
 * Also accepts old plain-text passwords so migration is seamless.
 */
export async function verifyPassword(plainText, storedHash) {
  if (!plainText || !storedHash) return false;
  // If stored value is a bcrypt hash, do proper compare
  if (isBcryptHash(storedHash)) {
    return bcrypt.compare(plainText, storedHash);
  }
  // Legacy plain-text fallback — migrate on next save
  return plainText === storedHash;
}

/**
 * Returns true if the string looks like a bcrypt hash ($2a$, $2b$, $2y$).
 */
export function isBcryptHash(str) {
  return typeof str === 'string' && /^\$2[aby]\$\d{2}\$/.test(str);
}
