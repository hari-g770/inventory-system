import React, { useState, useEffect, useRef } from 'react';

export default function OtpResetWizard({ isOpen, onClose, onResetAdminPassword }) {
  const [step, setStep] = useState(1); // 1=enter username/email, 2=verify OTP, 3=new password
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpOnScreen, setShowOtpOnScreen] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setUsername('');
      setEmail('');
      setOtp('');
      setGeneratedOtp('');
      setOtpExpiry(null);
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg('');
      setSuccessMsg('');
      setLoading(false);
      setShowOtpOnScreen(false);
      setCountdown(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isOpen]);

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (otpExpiry) {
      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((otpExpiry - Date.now()) / 1000));
        setCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          setErrorMsg('OTP has expired. Please request a new one.');
          setGeneratedOtp('');
        }
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [otpExpiry]);

  if (!isOpen) return null;

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!username.trim()) {
      setErrorMsg('Please enter your username.');
      return;
    }
    setLoading(true);

    const code = generateOTP();
    setGeneratedOtp(code);
    setOtpExpiry(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Try to send via EmailJS
    let emailSent = false;
    if (email.trim()) {
      try {
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (serviceId && templateId && publicKey) {
          const emailjs = await import('@emailjs/browser');
          await emailjs.send(serviceId, templateId, {
            to_email: email,
            otp_code: code,
            username: username,
            app_name: 'Finefix Technology'
          }, publicKey);
          emailSent = true;
        }
      } catch (err) {
        console.warn('EmailJS not configured, showing OTP on screen:', err);
      }
    }

    if (!emailSent) {
      setShowOtpOnScreen(true);
    }

    setLoading(false);
    setStep(2);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!otp.trim()) {
      setErrorMsg('Please enter the OTP code.');
      return;
    }

    if (countdown <= 0) {
      setErrorMsg('OTP has expired. Please go back and request a new one.');
      return;
    }

    if (otp.trim() !== generatedOtp) {
      setErrorMsg('Invalid OTP. Please check and try again.');
      return;
    }

    // OTP verified, proceed to set new password
    setStep(3);
    setErrorMsg('');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    const success = await onResetAdminPassword(username, newPassword);
    setLoading(false);

    if (success) {
      setSuccessMsg('✅ Password reset successfully! You can now sign in.');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 2000);
    } else {
      setErrorMsg('User not found. Please verify the username.');
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const stepIndicator = (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
      {[1, 2, 3].map(s => (
        <div key={s} style={{
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: '800',
            background: step >= s
              ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
              : 'rgba(255,255,255,0.08)',
            color: step >= s ? '#fff' : '#64748b',
            border: step >= s ? 'none' : '1px solid rgba(255,255,255,0.12)',
            transition: 'all 0.3s'
          }}>
            {step > s ? '✓' : s}
          </div>
          {s < 3 && (
            <div style={{
              width: '32px', height: '2px',
              background: step > s
                ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                : 'rgba(255,255,255,0.08)',
              borderRadius: '1px', transition: 'all 0.3s'
            }} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 110 }}>
      <div
        className="modal-content"
        style={{ maxWidth: '440px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800' }} className="gradient-text">
            🔑 Reset Password
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}
          >
            ✖
          </button>
        </div>

        {stepIndicator}

        {/* Messages */}
        {errorMsg && (
          <div style={{
            padding: '10px 14px', marginBottom: '16px',
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '10px', color: '#f87171', fontSize: '0.84rem'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{
            padding: '10px 14px', marginBottom: '16px',
            background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
            borderRadius: '10px', color: '#34d399', fontSize: '0.84rem'
          }}>
            {successMsg}
          </div>
        )}

        {/* Step 1: Enter Username & Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8', marginBottom: '4px' }}>
              Enter your username and email to receive a one-time password (OTP).
            </p>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="input-field"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Email <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '400' }}>(optional — for OTP delivery)</span>
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? '⏳ Sending OTP...' : '📧 Send OTP →'}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
              {showOtpOnScreen
                ? 'EmailJS is not configured. Your OTP is shown below for development.'
                : 'An OTP has been sent to your email. Enter it below.'}
            </p>

            {showOtpOnScreen && (
              <div style={{
                padding: '16px', textAlign: 'center',
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: '12px'
              }}>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px' }}>Your OTP Code (Dev Mode)</p>
                <p style={{
                  fontSize: '2rem', fontWeight: '900', letterSpacing: '0.3em',
                  background: 'linear-gradient(135deg, #6366f1, #f59e0b)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>
                  {generatedOtp}
                </p>
              </div>
            )}

            {countdown > 0 && (
              <div style={{ textAlign: 'center' }}>
                <span style={{
                  fontSize: '0.8rem', fontWeight: '700',
                  color: countdown < 60 ? '#f87171' : '#6366f1'
                }}>
                  ⏱ Expires in {formatTime(countdown)}
                </span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Enter 6-digit OTP</label>
              <input
                type="text"
                className="input-field"
                placeholder="Enter OTP code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                inputMode="numeric"
                autoFocus
                required
                style={{ letterSpacing: '0.3em', fontSize: '1.2rem', fontWeight: '700', textAlign: 'center' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button type="button" onClick={() => setStep(1)} className="btn btn-outline">← Back</button>
              <button type="submit" className="btn btn-primary">
                ✓ Verify OTP →
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Set New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '12px', textAlign: 'center',
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '10px', marginBottom: '4px'
            }}>
              <span style={{ fontSize: '0.84rem', color: '#34d399', fontWeight: '700' }}>
                ✅ OTP Verified! Set your new password below.
              </span>
            </div>
            <div className="form-group">
              <label className="form-label">New Password (min 6 characters)</label>
              <input
                type="password"
                className="input-field"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? '⏳ Resetting...' : '🔑 Reset Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
