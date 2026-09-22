import React, { useState } from 'react';

export default function ResetPasswordModal({ isOpen, onClose, onResetAdminPassword }) {
  const [username, setUsername] = useState('admin');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username.trim()) {
      setErrorMsg('Please enter your admin username.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    // Call reset handler
    const success = await onResetAdminPassword(username, newPassword);
    setLoading(false);

    if (success) {
      setSuccessMsg('✅ Admin password reset successfully! You can now sign in with your new password.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 2000);
    } else {
      setErrorMsg('Admin user not found. Please verify the username.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 110 }}>
      <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800' }} className="gradient-text">
            🔑 Reset Admin Password
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}
          >
            ✖
          </button>
        </div>

        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Reset security credentials for Administrator account directly from the login portal.
        </p>

        {errorMsg && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-sm)',
            color: '#f87171',
            fontSize: '0.84rem',
            marginBottom: '16px'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 'var(--radius-sm)',
            color: '#34d399',
            fontSize: '0.84rem',
            marginBottom: '16px'
          }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Admin Username / Email</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password (min 6 characters)</label>
            <input
              type="password"
              className="input-field"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Resetting...' : '🔑 Reset & Save Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
