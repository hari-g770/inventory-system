import React, { useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import OtpResetWizard from './OtpResetWizard';

export default function Login({ onLoginSuccess, onResetAdminPassword }) {
  const [activeTab, setActiveTab] = useState('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleTabChange = (role) => {
    setActiveTab(role);
    setErrorMsg('');
    setUsername('');
    setPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter your username and password.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const success = await onLoginSuccess(username, password);
    setLoading(false);
    if (!success) {
      setErrorMsg('Invalid username or password. Please try again.');
    }
  };

  const isAdmin = activeTab === 'admin';

  return (
    <>
      {/* Animated background — pointer-events:none so it never blocks clicks */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 60% at 20% 20%, rgba(99,102,241,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(6,182,212,0.14) 0%, transparent 60%), #080c1a'
      }} />

      {/* Scrollable page wrapper */}
      <div style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh', width: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start',
        padding: '48px 20px 60px',
        overflowY: 'auto', overflowX: 'hidden',
        cursor: 'default'
      }}>

        {/* ── LOGO ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '32px' }}>
          <img
            src="/finefix-logo.jpg"
            alt="Finefix Technology Logo"
            style={{
              width: '64px', height: '64px',
              borderRadius: '16px',
              objectFit: 'cover',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.12)',
              display: 'block'
            }}
          />
          <div>
            <h1 style={{
              fontSize: '2.1rem', fontWeight: '900', lineHeight: 1.05,
              background: 'linear-gradient(135deg, #ffffff 0%, #f87171 40%, #fbbf24 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.03em'
            }}>
              Finefix Technology
            </h1>
            <p style={{
              fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700',
              letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '4px'
            }}>
              Stock Management System
            </p>
          </div>
        </div>

        {/* ── MODULE SELECTOR CARDS ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '14px', width: '100%', maxWidth: '500px', marginBottom: '20px'
        }}>
          {/* Admin Card */}
          <button
            type="button"
            onClick={() => handleTabChange('admin')}
            style={{
              padding: '20px 16px', borderRadius: '18px',
              background: isAdmin
                ? 'linear-gradient(135deg, rgba(239,68,68,0.25) 0%, rgba(251,191,36,0.2) 100%)'
                : 'rgba(15,19,36,0.75)',
              border: isAdmin ? '2px solid rgba(239,68,68,0.7)' : '2px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              boxShadow: isAdmin ? '0 8px 30px rgba(239,68,68,0.3)' : 'none',
              transition: 'all 0.25s ease',
              cursor: 'pointer', textAlign: 'center', color: 'inherit',
              outline: 'none', userSelect: 'none'
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🛡️</div>
            <p style={{ fontSize: '0.92rem', fontWeight: '800', color: isAdmin ? '#fff' : '#94a3b8', marginBottom: '10px' }}>
              Admin Module
            </p>
            <div style={{
              padding: '7px 0', borderRadius: '10px',
              background: isAdmin ? 'linear-gradient(135deg,#ef4444,#f59e0b)' : 'rgba(239,68,68,0.12)',
              color: isAdmin ? '#fff' : '#fca5a5',
              fontWeight: '700', fontSize: '0.8rem', letterSpacing: '0.04em',
              boxShadow: isAdmin ? '0 4px 15px rgba(239,68,68,0.5)' : 'none'
            }}>
              {isAdmin ? '✓ SELECTED' : '⇄ SWITCH'}
            </div>
          </button>

          {/* Staff Card */}
          <button
            type="button"
            onClick={() => handleTabChange('staff')}
            style={{
              padding: '20px 16px', borderRadius: '18px',
              background: !isAdmin
                ? 'linear-gradient(135deg, rgba(6,182,212,0.25) 0%, rgba(16,185,129,0.2) 100%)'
                : 'rgba(15,19,36,0.75)',
              border: !isAdmin ? '2px solid rgba(6,182,212,0.7)' : '2px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              boxShadow: !isAdmin ? '0 8px 30px rgba(6,182,212,0.3)' : 'none',
              transition: 'all 0.25s ease',
              cursor: 'pointer', textAlign: 'center', color: 'inherit',
              outline: 'none', userSelect: 'none'
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🧑‍💼</div>
            <p style={{ fontSize: '0.92rem', fontWeight: '800', color: !isAdmin ? '#fff' : '#94a3b8', marginBottom: '10px' }}>
              Staff Module
            </p>
            <div style={{
              padding: '7px 0', borderRadius: '10px',
              background: !isAdmin ? 'linear-gradient(135deg,#06b6d4,#10b981)' : 'rgba(6,182,212,0.12)',
              color: !isAdmin ? '#fff' : '#67e8f9',
              fontWeight: '700', fontSize: '0.8rem', letterSpacing: '0.04em',
              boxShadow: !isAdmin ? '0 4px 15px rgba(6,182,212,0.5)' : 'none'
            }}>
              {!isAdmin ? '✓ SELECTED' : '⇄ SWITCH'}
            </div>
          </button>
        </div>

        {/* ── LOGIN FORM CARD ── */}
        <div style={{
          width: '100%', maxWidth: '500px',
          padding: '32px 36px',
          border: `1px solid ${isAdmin ? 'rgba(239,68,68,0.3)' : 'rgba(6,182,212,0.3)'}`,
          borderRadius: '24px',
          background: 'rgba(12,16,32,0.92)',
          backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
          boxShadow: `0 25px 70px rgba(0,0,0,0.85), 0 0 40px ${isAdmin ? 'rgba(239,68,68,0.15)' : 'rgba(6,182,212,0.15)'}`,
          transition: 'border-color 0.3s, box-shadow 0.3s'
        }}>
          {/* Header row inside card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
              background: isAdmin ? 'linear-gradient(135deg,#ef4444,#f59e0b)' : 'linear-gradient(135deg,#06b6d4,#10b981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
              boxShadow: isAdmin ? '0 4px 15px rgba(239,68,68,0.5)' : '0 4px 15px rgba(6,182,212,0.5)'
            }}>
              {isAdmin ? '🛡️' : '🧑‍💼'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '1rem', fontWeight: '800', color: '#fff' }}>
                {isAdmin ? 'Administrator Login' : 'Staff Member Login'}
              </p>
              <p style={{ fontSize: '0.72rem', color: '#64748b' }}>
                {isAdmin ? 'Full system access & management' : 'POS, inventory & sales access'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleTabChange(isAdmin ? 'staff' : 'admin')}
              style={{
                padding: '6px 14px', borderRadius: '20px', flexShrink: 0,
                border: `1px solid ${isAdmin ? 'rgba(6,182,212,0.5)' : 'rgba(239,68,68,0.5)'}`,
                background: 'transparent',
                color: isAdmin ? '#38bdf8' : '#fca5a5',
                fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer',
                whiteSpace: 'nowrap', transition: 'background 0.2s'
              }}
            >
              ⇄ {isAdmin ? 'Staff' : 'Admin'}
            </button>
          </div>

          {/* DB status pill */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '5px 14px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700',
              background: isSupabaseConfigured ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
              color: isSupabaseConfigured ? '#34d399' : '#818cf8',
              border: `1px solid ${isSupabaseConfigured ? 'rgba(16,185,129,0.35)' : 'rgba(99,102,241,0.35)'}`
            }}>
              {isSupabaseConfigured ? '⚡ Cloud DB Connected' : '⚡ Secure Local Mode'}
            </span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {errorMsg && (
              <div style={{
                padding: '11px 14px', marginBottom: '16px',
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: '10px', color: '#f87171', fontSize: '0.84rem',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>⚠️ {errorMsg}</div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="login-username">
                {isAdmin ? 'Administrator Username' : 'Staff Username'}
              </label>
              <input
                id="login-username"
                type="text"
                className="input-field"
                placeholder={isAdmin ? 'Enter admin username' : 'Enter staff username'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
                style={{ cursor: 'text' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="login-password">Password</label>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  style={{
                    background: 'none', border: 'none',
                    color: '#818cf8', fontSize: '0.78rem', fontWeight: '600',
                    cursor: 'pointer', padding: '0 0 6px 0'
                  }}
                >
                  🔑 Forgot Password?
                </button>
              </div>
              <input
                id="login-password"
                type="password"
                className="input-field"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{ cursor: 'text' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px 0', fontSize: '1rem', fontWeight: '700',
                marginTop: '8px', borderRadius: '12px', border: 'none', outline: 'none',
                background: isAdmin
                  ? 'linear-gradient(135deg,#ef4444 0%,#f59e0b 100%)'
                  : 'linear-gradient(135deg,#06b6d4 0%,#10b981 100%)',
                color: '#fff',
                boxShadow: isAdmin ? '0 8px 25px rgba(239,68,68,0.5)' : '0 8px 25px rgba(6,182,212,0.5)',
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.8 : 1,
                transition: 'opacity 0.2s, transform 0.15s',
                letterSpacing: '0.02em'
              }}
            >
              {loading ? '⏳ Authenticating...' : `Sign In → ${isAdmin ? 'Admin Portal' : 'Staff Portal'}`}
            </button>
          </form>
        </div>


      </div>

      <OtpResetWizard
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onResetAdminPassword={onResetAdminPassword}
      />
    </>
  );
}
