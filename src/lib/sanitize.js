/**
 * Input sanitization utilities to protect against XSS and injection attacks.
 */

/**
 * Sanitize a string by escaping HTML special characters.
 * Prevents XSS when rendering user input.
 */
export function sanitizeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize user input for use in database queries.
 * Strips dangerous characters and trims whitespace.
 * Supabase already uses parameterized queries, but this adds defense-in-depth.
 */
export function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/[\0\x08\x09\x1a\n\r"'\\%]/g, (char) => {
      switch (char) {
        case '\0': return '\\0';
        case '\x08': return '\\b';
        case '\x09': return '\\t';
        case '\x1a': return '\\z';
        case '\n': return '\\n';
        case '\r': return '\\r';
        case '"':
        case "'":
        case '\\':
        case '%':
          return '\\' + char;
        default: return char;
      }
    });
}

/**
 * Validate that a string only contains alphanumeric characters, spaces, and common punctuation.
 * Useful for usernames, product names, etc.
 */
export function isCleanString(str) {
  if (typeof str !== 'string') return false;
  return /^[a-zA-Z0-9\s.,!@#$%^&*()_+\-=\[\]{}|;':"<>?\/~`]+$/.test(str);
}

/**
 * Sanitize a username: lowercase, trim, remove dangerous chars.
 */
export function sanitizeUsername(str) {
  if (typeof str !== 'string') return '';
  return str.toLowerCase().trim().replace(/[^a-z0-9_.-]/g, '');
}

/**
 * Validate numeric input and return a safe number.
 */
export function sanitizeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}
