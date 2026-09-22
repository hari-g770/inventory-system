import React, { useState, useRef, useEffect } from 'react';
import { verifyTOTP } from '../lib/totp';

export default function TOTPInputModal({ isOpen, onClose, onVerify, user }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen) {
      setCode(['', '', '', '', '', '']);
      setErrorMsg('');
      setLoading(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setErrorMsg('');
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all 6 digits entered
    if (value && index === 5 && newCode.every(d => d !== '')) {
      handleSubmit(null, newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;
    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || '';
    }
    setCode(newCode);
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
    if (pasted.length === 6) {
      handleSubmit(null, pasted);
    }
  };

  const handleSubmit = async (e, codeStr) => {
    if (e) e.preventDefault();
    const token = codeStr || code.join('');
    if (token.length !== 6) {
      setErrorMsg('Please enter all 6 digits.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const isValid = verifyTOTP(token, user.totp_secret);
      if (isValid) {
        onVerify(true);
      } else {
        setErrorMsg('Invalid code. Please check your authenticator app and try again.');
        setCode(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch (err) {
      setErrorMsg('Verification failed. Please try again.');
    }
    setLoading(false);
  };

  const handleCancel = () => {
    onVerify(false);
    onClose();
  };

  const inputStyle = {
    width: '48px', height: '56px',
    textAlign: 'center', fontSize: '1.5rem', fontWeight: '800',
    background: 'rgba(255,255,255,0.06)',
    border: '2px solid rgba(255,255,255,0.12)',
    borderRadius: '12px', color: '#fff',
    outline: 'none', caretColor: '#6366f1',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  };

  const inputFocusStyle = {
    borderColor: '#6366f1',
    boxShadow: '0 0 0 3px rgba(99,102,241,0.3)'
  };

  return (
    <div className="modal-overlay" onClick={handleCancel} style={{ zIndex: 120 }}>
      <div
        className="modal-content"
        style={{ maxWidth: '420px', textAlign: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: '1.8rem',
            boxShadow: '0 8px 30px rgba(99,102,241,0.4)'
          }}>
            🔐
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>
            Two-Factor Authentication
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
            Enter the 6-digit code from your Google Authenticator app
          </p>
        </div>

        {/* Error */}
        {errorMsg && (
          <div style={{
            padding: '10px 14px', marginBottom: '16px',
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '10px', color: '#f87171', fontSize: '0.84rem'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Code Input */}
        <form onSubmit={handleSubmit}>
          <div style={{
            display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px'
          }}>
            {code.map((digit, i) => (
              <React.Fragment key={i}>
                {i === 3 && (
                  <div style={{
                    width: '12px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: '#475569', fontSize: '1.2rem', fontWeight: '700'
                  }}>
                    —
                  </div>
                )}
                <input
                  ref={el => inputRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  onFocus={(e) => {
                    e.target.style.borderColor = inputFocusStyle.borderColor;
                    e.target.style.boxShadow = inputFocusStyle.boxShadow;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.12)';
                    e.target.style.boxShadow = 'none';
                  }}
                  style={inputStyle}
                  autoComplete="one-time-code"
                />
              </React.Fragment>
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-outline"
              style={{ minWidth: '100px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || code.some(d => d === '')}
              className="btn btn-primary"
              style={{
                minWidth: '140px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                opacity: loading || code.some(d => d === '') ? 0.6 : 1
              }}
            >
              {loading ? '⏳ Verifying...' : '✓ Verify Code'}
            </button>
          </div>
        </form>

        {/* Help text */}
        <p style={{
          marginTop: '20px', fontSize: '0.75rem', color: '#475569',
          lineHeight: 1.5
        }}>
          Open your authenticator app (Google Authenticator, Authy, etc.) and enter the current code for <strong style={{ color: '#94a3b8' }}>Finefix</strong>.
        </p>
      </div>
    </div>
  );
}
