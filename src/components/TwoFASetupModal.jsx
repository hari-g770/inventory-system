import React, { useState, useEffect } from 'react';
import { generateSecret, generateQRUri, verifyTOTP } from '../lib/totp';
import { QRCodeSVG } from 'qrcode.react';

export default function TwoFASetupModal({ isOpen, onClose, onSetupComplete, user }) {
  const [secret, setSecret] = useState('');
  const [qrUri, setQrUri] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [step, setStep] = useState(1); // 1=show QR, 2=success
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      const newSecret = generateSecret();
      const uri = generateQRUri(newSecret, user.username || user.name);
      setSecret(newSecret);
      setQrUri(uri);
      setVerifyCode('');
      setErrorMsg('');
      setStep(1);
      setLoading(false);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      setErrorMsg('Please enter the full 6-digit code.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const isValid = verifyTOTP(verifyCode, secret);
      if (isValid) {
        setStep(2);
        // Save the secret and complete login after a brief delay
        setTimeout(() => {
          onSetupComplete(secret);
        }, 1500);
      } else {
        setErrorMsg('Invalid code. Make sure you scanned the QR code and entered the current code from your authenticator app.');
        setVerifyCode('');
      }
    } catch (err) {
      setErrorMsg('Verification failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 130 }}>
      <div
        className="modal-content"
        style={{ maxWidth: '460px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', fontSize: '1.8rem',
            boxShadow: '0 8px 30px rgba(245,158,11,0.4)'
          }}>
            🔐
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>
            Set Up Two-Factor Authentication
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
            2FA is <strong style={{ color: '#f59e0b' }}>mandatory</strong> for all accounts. Scan the QR code below with your authenticator app to continue.
          </p>
        </div>

        {step === 1 && (
          <>
            {/* QR Code */}
            <div style={{
              display: 'flex', justifyContent: 'center', marginBottom: '16px',
              padding: '20px', background: '#fff', borderRadius: '14px',
              width: 'fit-content', margin: '0 auto 16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}>
              <QRCodeSVG value={qrUri} size={200} />
            </div>

            {/* Manual key */}
            <div style={{
              padding: '10px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px',
              textAlign: 'center', marginBottom: '16px'
            }}>
              <p style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '4px' }}>Can't scan? Enter this key manually:</p>
              <p style={{
                fontSize: '0.88rem', fontWeight: '700', color: '#f59e0b',
                letterSpacing: '0.12em', fontFamily: 'monospace', wordBreak: 'break-all',
                userSelect: 'all', cursor: 'text'
              }}>
                {secret}
              </p>
            </div>

            {/* Supported apps */}
            <div style={{
              padding: '10px 14px', background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px',
              marginBottom: '16px', textAlign: 'center'
            }}>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                📱 Supported apps: <strong style={{ color: '#fff' }}>Google Authenticator</strong>, <strong style={{ color: '#fff' }}>Authy</strong>, <strong style={{ color: '#fff' }}>Microsoft Authenticator</strong>
              </p>
            </div>

            {/* Error */}
            {errorMsg && (
              <div style={{
                padding: '10px 14px', marginBottom: '14px',
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: '10px', color: '#f87171', fontSize: '0.84rem'
              }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Verify input */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>
                Enter the 6-digit code from your authenticator app
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="000000"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                inputMode="numeric"
                autoFocus
                style={{
                  letterSpacing: '0.4em', fontSize: '1.4rem', fontWeight: '800',
                  textAlign: 'center', padding: '14px'
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleVerify(); }}
              />
            </div>

            {/* Verify button */}
            <button
              type="button"
              onClick={handleVerify}
              disabled={loading || verifyCode.length !== 6}
              className="btn btn-primary"
              style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                fontSize: '1rem', fontWeight: '700',
                opacity: loading || verifyCode.length !== 6 ? 0.6 : 1,
                boxShadow: '0 8px 25px rgba(245,158,11,0.4)'
              }}
            >
              {loading ? '⏳ Verifying...' : '✓ Verify & Activate 2FA'}
            </button>
          </>
        )}

        {step === 2 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: '2.2rem',
              boxShadow: '0 8px 30px rgba(16,185,129,0.5)',
              animation: 'welcomeSlide 0.4s cubic-bezier(0.34,1.56,0.64,1) both'
            }}>
              ✅
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#34d399', marginBottom: '8px' }}>
              2FA Activated Successfully!
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
              Your account is now protected. Logging you in...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
