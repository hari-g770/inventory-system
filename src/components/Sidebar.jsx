import React from 'react';

export default function Sidebar({ activeTab, setActiveTab, userRole, lowStockCount }) {
  const adminNav = [
    { id: 'dashboard', label: 'Dashboard & Revenue', icon: '📊' },
    { id: 'inventory', label: 'Inventory Stock', icon: '📦', badge: lowStockCount },
    { id: 'pos', label: 'Point of Sale (POS)', icon: '🛒' },
    { id: 'sales', label: 'Sales & Transactions', icon: '🧾' },
    { id: 'staff', label: 'Staff Management', icon: '👥' },
  ];

  const staffNav = [
    { id: 'dashboard', label: 'Dashboard & Overview', icon: '📊' },
    { id: 'pos', label: 'Point of Sale (POS)', icon: '🛒' },
    { id: 'inventory', label: 'Stock Catalog', icon: '📦', badge: lowStockCount },
    { id: 'sales', label: 'My Sales History', icon: '🧾' },
  ];

  const navItems = userRole === 'admin' ? adminNav : staffNav;

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img
          src="/finefix-logo.jpg"
          alt="Finefix Logo"
          style={{
            width: '42px', height: '42px', borderRadius: '12px',
            objectFit: 'cover', boxShadow: 'var(--shadow-glow)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        />
        <div className="logo-text">
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1 }}>
            Finefix Technology
          </h2>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.05em', marginTop: '2px' }}>
            STOCK MANAGEMENT
          </p>
        </div>
      </div>

      {/* Nav List */}
      <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ padding: '0 12px 10px', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }} className="nav-text">
          Menu Navigation
        </div>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: isActive ? 'var(--primary-gradient)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: isActive ? '700' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isActive ? '0 4px 15px rgba(99, 102, 241, 0.4)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.15rem' }}>{item.icon}</span>
                <span className="nav-text" style={{ fontSize: '0.92rem' }}>{item.label}</span>
              </div>

              {item.badge > 0 && (
                <span style={{
                  background: isActive ? '#ffffff' : '#ef4444',
                  color: isActive ? '#ef4444' : '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  padding: '2px 7px',
                  borderRadius: '10px'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Role Footer Card */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border-light)' }}>
        <div style={{
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: userRole === 'admin' ? '#a855f7' : '#06b6d4',
            boxShadow: `0 0 10px ${userRole === 'admin' ? '#a855f7' : '#06b6d4'}`
          }} />
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }} className="nav-text">
            Mode: <strong style={{ color: '#fff', textTransform: 'capitalize' }}>{userRole} Portal</strong>
          </div>
        </div>
      </div>
    </aside>
  );
}
