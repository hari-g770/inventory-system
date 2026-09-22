import React, { useState } from 'react';

export default function ChangePasswordModal({ isOpen, onClose, onChangePassword, currentUser }) {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPass.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPass !== confirmPass) {
      setErrorMsg('New passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    const success = await onChangePassword(currentPass, newPass);
    setLoading(false);

    if (success) {
      setSuccessMsg('✅ Password updated successfully!');
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } else {
      setErrorMsg('Incorrect current password. Please try again.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800' }} className="gradient-text">
            🔑 Change Security Password
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}
          >
            ✖
          </button>
        </div>

        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Update password for account <strong style={{ color: '#fff' }}>{currentUser.username}</strong> ({currentUser.role}).
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
            <label className="form-label">Current Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password (min 6 characters)</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : '💾 Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
