import React, { useState, useEffect, useRef } from 'react';

export default function EditProfileModal({ isOpen, onClose, onUpdateProfile, currentUser }) {
  const [fullName, setFullName]       = useState('');
  const [username, setUsername]       = useState('');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass]         = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [avatarUrl, setAvatarUrl]     = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [errorMsg, setErrorMsg]       = useState('');
  const [successMsg, setSuccessMsg]   = useState('');
  const [loading, setLoading]         = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.name || '');
      setUsername(currentUser.username || '');
      setAvatarUrl(currentUser.avatar || '');
      setAvatarPreview(currentUser.avatar || '');
    }
    setCurrentPass(''); setNewPass(''); setConfirmPass('');
    setErrorMsg(''); setSuccessMsg('');
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  // Handle local photo file selection → convert to base64 data URL
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, etc.).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Photo must be under 2 MB.');
      return;
    }
    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result);
      setAvatarUrl(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(''); setSuccessMsg('');

    if (!fullName.trim() || !username.trim()) {
      setErrorMsg('Full name and username cannot be empty.');
      return;
    }

    if (newPass) {
      if (newPass.length < 6) { setErrorMsg('New password must be at least 6 characters.'); return; }
      if (newPass !== confirmPass) { setErrorMsg('New passwords do not match.'); return; }
      if (currentUser.password && currentPass !== currentUser.password) {
        setErrorMsg('Incorrect current password.'); return;
      }
    }

    setLoading(true);
    const updatedData = {
      name: fullName,
      username,
      avatar: avatarUrl || currentUser.avatar,
      ...(newPass ? { password: newPass } : {})
    };

    const success = await onUpdateProfile(updatedData, currentPass, newPass);
    setLoading(false);

    if (success) {
      setSuccessMsg('✅ Profile updated successfully!');
      setTimeout(() => { setSuccessMsg(''); onClose(); }, 1400);
    } else {
      setErrorMsg('Failed to update profile. Please verify your current password.');
    }
  };

  const initials = (fullName || currentUser.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }} className="gradient-text">
            ✏️ Edit Profile & Security
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}>✖</button>
        </div>

        {/* Avatar Upload Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '14px', border: '1px solid var(--border-light)' }}>
          {/* Avatar Preview */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Profile"
                style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(99,102,241,0.6)', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}
                onError={() => setAvatarPreview('')}
              />
            ) : (
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'var(--primary-gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.6rem', fontWeight: '900', color: '#fff',
                border: '3px solid rgba(99,102,241,0.6)',
                boxShadow: '0 0 20px rgba(99,102,241,0.4)'
              }}>
                {initials}
              </div>
            )}
            {/* Camera overlay badge */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: '26px', height: '26px', borderRadius: '50%',
                background: '#6366f1', border: '2px solid #0d111e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', cursor: 'pointer', color: '#fff'
              }}
              title="Upload photo"
            >📷</button>
          </div>

          {/* Upload Controls */}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>
              {currentUser.name}
              <span style={{ marginLeft: '8px', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', background: currentUser.role === 'admin' ? 'rgba(168,85,247,0.2)' : 'rgba(6,182,212,0.2)', color: currentUser.role === 'admin' ? '#c084fc' : '#38bdf8', fontWeight: '700' }}>
                {currentUser.role}
              </span>
            </p>
            <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Upload a profile photo (JPG/PNG, max 2 MB)</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.78rem', padding: '6px 14px' }}
              >
                📁 Choose Photo
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={() => { setAvatarPreview(''); setAvatarUrl(''); }}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.78rem', padding: '6px 12px', borderColor: 'rgba(239,68,68,0.4)', color: '#f87171' }}
                >
                  🗑 Remove
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />
          </div>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 'var(--radius-sm)', color: '#f87171', fontSize: '0.84rem', marginBottom: '16px' }}>
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 'var(--radius-sm)', color: '#34d399', fontSize: '0.84rem', marginBottom: '16px' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="input-field" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input type="text" className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>
              🔑 Change Password <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '400' }}>(optional)</span>
            </h4>
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label className="form-label">Current Password</label>
              <input type="password" className="input-field" placeholder="Required to change password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="input-field" placeholder="••••••••" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input type="password" className="input-field" placeholder="••••••••" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
              </div>
            </div>
          </div>


          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
