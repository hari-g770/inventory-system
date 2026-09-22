import React, { useState } from 'react';

export default function StaffManager({ users, sales, onAddStaff, onDeleteStaff, currentUser }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    username: '',
    password: '',
    role: 'staff',
    email: ''
  });

  // Calculate sales total per user
  const getUserRevenue = (userId) => {
    return sales
      .filter(s => s.cashierId === userId)
      .reduce((acc, s) => acc + Number(s.totalRevenue), 0);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.username || !newStaff.password) return;

    onAddStaff({
      ...newStaff,
      id: 'u' + (users.length + 1),
      avatar: `https://images.unsplash.com/photo-${1530000000000 + Math.floor(Math.random() * 99999)}?w=150&auto=format&fit=crop&q=80`
    });

    setNewStaff({ name: '', username: '', password: '', role: 'staff', email: '' });
    setIsAddModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }} className="gradient-text">
            Staff Team Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Manage staff login credentials, assign system roles, and track cashier sales volume.
          </p>
        </div>

        <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary btn-lg">
          👤 Add Staff Account
        </button>
      </div>

      {/* Staff Grid Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {users.map(u => {
          const userRevenue = getUserRevenue(u.id);
          const userOrderCount = sales.filter(s => s.cashierId === u.id).length;
          const isCurrentSelf = currentUser && currentUser.id === u.id;

          return (
            <div key={u.id} className="glass-panel glass-panel-hover" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img
                    src={u.avatar}
                    alt={u.name}
                    style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid var(--primary)', objectFit: 'cover' }}
                  />
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff' }}>{u.name}</h3>
                    <span className={`badge ${u.role === 'admin' ? 'badge-warning' : 'badge-info'}`} style={{ marginTop: '4px' }}>
                      {u.role === 'admin' ? '⚡ Admin Portal' : '🧑‍💼 Staff Portal'}
                    </span>
                  </div>
                </div>

                {/* Delete Staff Button (Allowed for non-current active user) */}
                {!isCurrentSelf && (
                  <button
                    onClick={() => onDeleteStaff(u.id, u.name)}
                    className="btn btn-outline btn-sm"
                    title="Delete staff account"
                    style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '6px 10px' }}
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', fontSize: '0.84rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Username:</span>
                  <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{u.username}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Email:</span>
                  <span style={{ color: 'var(--text-muted)' }}>{u.email || `${u.username}@stockpulse.io`}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-light)' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Orders Processed</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#38bdf8' }}>{userOrderCount} orders</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Revenue Generated</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#34d399' }}>
                    ₹{userRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '20px' }} className="gradient-text">
              Create New Staff Member
            </h2>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Jordan Smith"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="jordan"
                    value={newStaff.username}
                    onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">System Role</label>
                <select
                  className="input-field"
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                >
                  <option value="staff">🧑‍💼 Staff Member (POS & Stock lookup)</option>
                  <option value="admin">⚡ Administrator (Full System Access)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
