import React from 'react';

export default function Navbar({ currentUser, totalRevenue, onLogout, onOpenEditProfile, searchQuery, setSearchQuery }) {
  const isAdmin = currentUser && currentUser.role === 'admin';

  return (
    <header className="top-navbar">
      {/* Brand Logo + Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <img
          src="/finefix-logo.jpg"
          alt="Finefix Logo"
          style={{
            width: '36px', height: '36px', borderRadius: '8px',
            objectFit: 'cover', border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
          }}
        />
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.01em' }}>
            Finefix Technology
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Stock Management
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', width: '280px' }}>
        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
          🔍
        </span>
        <input
          type="text"
          placeholder="Search products, SKU, categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field"
          style={{ paddingLeft: '40px', borderRadius: '30px', height: '42px', fontSize: '0.88rem' }}
        />
      </div>

      {/* Revenue Tracker Pill (Admin Only) & User Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Total Revenue Display Badge - Visible ONLY to Admin */}
        {isAdmin && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 18px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '30px',
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)'
          }}>
            <span style={{ fontSize: '1.1rem' }}>📈</span>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>
                Total Revenue
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#34d399', fontFamily: 'var(--font-heading)' }}>
                ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        )}

        {/* Profile Card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--primary)', objectFit: 'cover' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {currentUser.name}
            </span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: isAdmin ? '#a855f7' : '#06b6d4'
            }}>
              {isAdmin ? '⚡ Administrator' : '👤 Staff Account'}
            </span>
          </div>
        </div>

        {/* Edit Profile & Password Button */}
        <button
          onClick={onOpenEditProfile}
          className="btn btn-outline btn-sm"
          title="Edit Name, Username & Password"
          style={{ borderColor: 'rgba(99, 102, 241, 0.4)', color: '#818cf8', padding: '6px 12px' }}
        >
          ✏️ Profile & Password
        </button>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="btn btn-outline btn-sm"
          title="Sign out"
          style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '6px 12px' }}
        >
          🚪 Exit
        </button>
      </div>
    </header>
  );
}
