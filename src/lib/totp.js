// src/lib/totp.js
// otplib v13+ API — uses named exports, no 'authenticator' object
import { generateSecret as otpGenerateSecret, generateURI, verifySync } from 'otplib';

export const generateSecret = () => otpGenerateSecret();

export const generateQRUri = (secret, username) => {
  return generateURI({
    issuer: 'Finefix',
    label: username,
    secret: secret,
    strategy: 'totp',
    algorithm: 'sha1',
    digits: 6,
    period: 30
  });
};

export const verifyTOTP = (token, secret) => {
  return verifySync({
    token: token,
    secret: secret,
    strategy: 'totp',
    epochTolerance: 1 // allow 1 step tolerance (±30s)
  });
};
