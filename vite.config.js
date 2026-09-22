import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    headers: {
      // HSTS - enforce HTTPS for 1 year including subdomains
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',
      // Prevent clickjacking
      'X-Frame-Options': 'DENY',
      // Enable XSS filter in older browsers
      'X-XSS-Protection': '1; mode=block',
      // Control referrer information
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      // Permissions policy
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      // Content Security Policy
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
        "frame-ancestors 'none'"
      ].join('; ')
    }
  },
  build: {
    // No source maps in production
    sourcemap: false
  }
})
