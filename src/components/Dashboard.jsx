import React, { useState } from 'react';

// ── Reusable Stat Card ────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, accent, onClick }) {
  return (
    <div
      onClick={onClick}
      className={onClick ? 'glass-panel glass-panel-hover' : 'glass-panel'}
      style={{
        padding: '22px 24px',
        borderLeft: `4px solid ${accent}`,
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex', flexDirection: 'column', gap: '10px',
        position: 'relative', overflow: 'hidden',
        borderRadius: '16px'
      }}
    >
      <div style={{
        position: 'absolute', right: '-10px', top: '-10px',
        width: '80px', height: '80px', borderRadius: '50%',
        background: accent, opacity: 0.08, filter: 'blur(18px)'
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.07em' }}>
          {label}
        </span>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', border: `1px solid ${accent}33` }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '1.9rem', fontWeight: '800', color: accent, fontFamily: 'var(--font-heading)', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

// ── Mini Progress Bar ─────────────────────────────────────────────────────────
function ProgressBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.8s ease' }} />
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ title, sub, action, icon }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon && <span style={{ fontSize: '1.2rem' }}>{icon}</span>}
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff' }}>{title}</h3>
          {sub && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard({ products = [], sales = [], totalRevenue = 0, onNavigate, currentUser, onViewReceipt }) {
  const isAdmin = currentUser?.role === 'admin';

  // State for Customer History Lookup
  const [customerSearchPhone, setCustomerSearchPhone] = useState('');
  
  // State for Item Quick Search in Dashboard
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  // ── Metrics ──────────────────────────────────────────────────────────────
  const totalOrders = sales.length;
  const totalUnitsInStock = products.reduce((acc, p) => acc + Number(p.stock), 0);
  const lowStockItems = products.filter(p => Number(p.stock) <= Number(p.minStock));
  const outOfStockItems = products.filter(p => Number(p.stock) === 0);
  const totalProfit = sales.reduce((acc, s) => acc + (Number(s.profit) || 0), 0);
  const profitMarginPct = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';
  const avgOrder = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;
  const totalProducts = products.length;

  // My sales (for staff)
  const mySales = isAdmin ? sales : sales.filter(s => s.cashierId === currentUser?.id);
  const myRevenue = mySales.reduce((acc, s) => acc + Number(s.totalRevenue), 0);
  const myOrders = mySales.length;
  const myAvgOrder = myOrders > 0 ? myRevenue / myOrders : 0;

  // ── Customer Analytics & Aggregations ─────────────────────────────────────
  const customerMap = {};
  sales.forEach(sale => {
    const key = (sale.customerPhone || sale.customerName || 'Walk-in').trim();
    if (!customerMap[key]) {
      customerMap[key] = {
        key,
        phone: sale.customerPhone || '',
        name: sale.customerName || (sale.customerPhone ? `Customer (${sale.customerPhone})` : 'Walk-in Customer'),
        address: sale.customerAddress || '',
        bills: [],
        totalSpent: 0,
        totalItems: 0,
        firstVisit: sale.date,
        lastVisit: sale.date
      };
    }
    customerMap[key].bills.push(sale);
    customerMap[key].totalSpent += Number(sale.totalRevenue || 0);
    customerMap[key].totalItems += (sale.items || []).reduce((sum, it) => sum + Number(it.qty || 1), 0);
    if (new Date(sale.date) > new Date(customerMap[key].lastVisit)) {
      customerMap[key].lastVisit = sale.date;
    }
    if (new Date(sale.date) < new Date(customerMap[key].firstVisit)) {
      customerMap[key].firstVisit = sale.date;
    }
  });

  const allCustomers = Object.values(customerMap).filter(c => c.phone || c.name !== 'Walk-in Customer');

  // Filtered customer based on search
  const cleanSearch = customerSearchPhone.trim().toLowerCase();
  const matchedCustomers = cleanSearch
    ? allCustomers.filter(c => 
        (c.phone && c.phone.toLowerCase().includes(cleanSearch)) ||
        (c.name && c.name.toLowerCase().includes(cleanSearch)) ||
        c.bills.some(b => b.id.toLowerCase().includes(cleanSearch))
      )
    : [];

  const selectedCustomer = matchedCustomers.length > 0 ? matchedCustomers[0] : null;

  // ── Item Quick Search Filtering ───────────────────────────────────────────
  const cleanItemSearch = itemSearchQuery.trim().toLowerCase();
  const matchedItems = cleanItemSearch
    ? products.filter(p => 
        p.name.toLowerCase().includes(cleanItemSearch) ||
        p.sku.toLowerCase().includes(cleanItemSearch) ||
        p.category.toLowerCase().includes(cleanItemSearch)
      ).slice(0, 6)
    : [];

  // Top selling products by qty sold
  const soldMap = {};
  sales.forEach(s => s.items?.forEach(it => {
    soldMap[it.name] = (soldMap[it.name] || 0) + it.qty;
  }));
  const topSellers = Object.entries(soldMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxSold = topSellers[0]?.[1] || 1;

  // Category breakdown
  const categoryMap = {};
  products.forEach(p => {
    if (!categoryMap[p.category]) categoryMap[p.category] = { count: 0, stock: 0, value: 0 };
    categoryMap[p.category].count += 1;
    categoryMap[p.category].stock += Number(p.stock);
    categoryMap[p.category].value += Number(p.sellingPrice) * Number(p.stock);
  });
  const categories = Object.entries(categoryMap).sort((a, b) => b[1].value - a[1].value);
  const maxCatValue = Math.max(...categories.map(c => c[1].value), 1);

  // Recent sales
  const recentSales = (isAdmin ? sales : mySales).slice(0, 5);

  const quickActions = isAdmin
    ? [
        { label: 'Launch POS', icon: '🛒', tab: 'pos', accent: '#6366f1' },
        { label: 'Manage Inventory', icon: '📦', tab: 'inventory', accent: '#f59e0b' },
        { label: 'Sales Audit Ledger', icon: '📊', tab: 'sales', accent: '#06b6d4' },
        { label: 'Staff Management', icon: '👥', tab: 'staff', accent: '#10b981' },
      ]
    : [
        { label: 'Launch POS Register', icon: '🛒', tab: 'pos', accent: '#6366f1' },
        { label: 'My Sales History', icon: '📊', tab: 'sales', accent: '#06b6d4' },
        { label: 'Browse Inventory', icon: '📦', tab: 'inventory', accent: '#f59e0b' },
      ];

  const ACCENT_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <img src="/finefix-logo.jpg" alt="logo" style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover' }} />
            <h1 style={{ fontSize: '1.75rem', fontWeight: '900' }} className="gradient-text">
              {isAdmin ? 'Admin Command Centre' : `Staff Dashboard`}
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
            {isAdmin
              ? 'Real-time financial metrics, customer transaction history, and inventory health.'
              : `Logged in as ${currentUser?.name}. Quick access to POS, personal checkout records, and customer lookups.`}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {quickActions.map(qa => (
            <button
              key={qa.tab}
              onClick={() => onNavigate(qa.tab)}
              style={{
                padding: '8px 16px', borderRadius: '12px',
                background: `${qa.accent}1f`, color: qa.accent,
                fontWeight: '700', fontSize: '0.84rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                border: `1px solid ${qa.accent}40`,
                transition: 'all 0.2s'
              }}
            >
              {qa.icon} {qa.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Low Stock Alert ──────────────────────────────────────────────── */}
      {lowStockItems.length > 0 && (
        <div style={{
          padding: '14px 20px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>⚠️</span>
            <div>
              <p style={{ color: '#f87171', fontWeight: '700', fontSize: '0.92rem' }}>
                {lowStockItems.length} product{lowStockItems.length > 1 ? 's' : ''} below reorder level
                {outOfStockItems.length > 0 && <span style={{ marginLeft: '8px', background: 'rgba(239,68,68,0.2)', borderRadius: '6px', padding: '1px 8px', fontSize: '0.78rem' }}>{outOfStockItems.length} out of stock</span>}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {lowStockItems.slice(0, 4).map(i => i.name).join(' · ')}{lowStockItems.length > 4 ? ` +${lowStockItems.length - 4} more` : ''}
              </p>
            </div>
          </div>
          <button onClick={() => onNavigate('inventory')} className="btn btn-danger btn-sm" style={{ cursor: 'pointer' }}>
            Restock Now →
          </button>
        </div>
      )}

      {/* ── KPI STAT CARDS ──────────────────────────────────────────────── */}
      {isAdmin ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <StatCard label="Total Revenue" value={`₹${totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} sub={`${totalOrders} completed orders`} icon="💰" accent="#10b981" onClick={() => onNavigate('sales')} />
          <StatCard label="Net Profit" value={`₹${totalProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} sub={`${profitMarginPct}% profit margin`} icon="💎" accent="#6366f1" />
          <StatCard label="Avg Order Value" value={`₹${avgOrder.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} sub="Per completed sale" icon="📈" accent="#06b6d4" />
          <StatCard label="Stock Units" value={totalUnitsInStock.toLocaleString()} sub={`${totalProducts} SKUs · ${lowStockItems.length} low`} icon="📦" accent="#f59e0b" onClick={() => onNavigate('inventory')} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <StatCard label="My Revenue" value={`₹${myRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} sub={`From ${myOrders} checkouts`} icon="💰" accent="#10b981" onClick={() => onNavigate('sales')} />
          <StatCard label="Orders Completed" value={myOrders} sub="Your personal sales count" icon="🧾" accent="#6366f1" />
          <StatCard label="My Avg Order" value={`₹${myAvgOrder.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} sub="Per transaction" icon="📈" accent="#06b6d4" />
          <StatCard label="Products Available" value={products.filter(p => Number(p.stock) > 0).length} sub={`${lowStockItems.length} running low`} icon="📦" accent="#f59e0b" onClick={() => onNavigate('inventory')} />
        </div>
      )}

      {/* ── 🔍 CUSTOMER HISTORY & BILL LOOKUP (NEW FEATURE) ──────────────── */}
      <div className="glass-panel" style={{
        padding: '24px', borderRadius: '20px',
        border: '1px solid rgba(56,189,248,0.3)',
        background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.7) 100%)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.4)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>👤</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff' }}>
                Customer History & Bill Search
              </h2>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Enter any customer's mobile number or name to view their complete lifetime bill history & past orders.
            </p>
          </div>

          {/* Quick Customer Selection Chips */}
          {allCustomers.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Recent:</span>
              {allCustomers.slice(0, 3).map(c => (
                <button
                  key={c.key}
                  onClick={() => setCustomerSearchPhone(c.phone || c.name)}
                  style={{
                    background: customerSearchPhone === (c.phone || c.name) ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                    color: customerSearchPhone === (c.phone || c.name) ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
                    padding: '4px 10px', fontSize: '0.74rem', cursor: 'pointer', fontWeight: '600'
                  }}
                >
                  {c.name} {c.phone ? `(${c.phone})` : ''}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Input */}
        <div style={{
          position: 'relative', display: 'flex', alignItems: 'center',
          background: 'rgba(10,15,30,0.85)', borderRadius: '14px',
          border: '1px solid var(--border-glow)', padding: '6px 16px',
          marginBottom: '20px'
        }}>
          <span style={{ fontSize: '1.2rem', marginRight: '10px', color: '#38bdf8' }}>📞</span>
          <input
            type="text"
            placeholder="Enter Customer Mobile Number (e.g. 9876543210) or Name..."
            value={customerSearchPhone}
            onChange={(e) => setCustomerSearchPhone(e.target.value)}
            style={{
              flex: 1, background: 'transparent', border: 'none',
              outline: 'none', color: '#fff', fontSize: '0.95rem',
              padding: '8px 0', cursor: 'text', fontFamily: 'var(--font-body)'
            }}
          />
          {customerSearchPhone && (
            <button
              onClick={() => setCustomerSearchPhone('')}
              style={{
                background: 'rgba(255,255,255,0.12)', border: 'none',
                color: '#fff', borderRadius: '50%', width: '22px', height: '22px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Customer Results View */}
        {cleanSearch ? (
          matchedCustomers.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', borderRadius: '14px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
              <p style={{ color: '#fff', fontWeight: '700' }}>No customer records found for "{customerSearchPhone}"</p>
              <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Make sure the mobile number or customer name was recorded during POS checkout.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Customer Profile Summary Banner */}
              <div style={{
                padding: '16px 20px', borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(56,189,248,0.12) 0%, rgba(99,102,241,0.12) 100%)',
                border: '1px solid rgba(56,189,248,0.3)',
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px'
              }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Customer</span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>{selectedCustomer.name}</h3>
                  {selectedCustomer.phone && <p style={{ fontSize: '0.82rem', color: '#38bdf8', marginTop: '2px' }}>📞 {selectedCustomer.phone}</p>}
                  {selectedCustomer.address && <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>📍 {selectedCustomer.address}</p>}
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Total Spend</span>
                  <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#34d399' }}>
                    ₹{selectedCustomer.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Across {selectedCustomer.bills.length} purchases</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Items Bought</span>
                  <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#fbbf24' }}>
                    {selectedCustomer.totalItems} units
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Last Visit: {new Date(selectedCustomer.lastVisit).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Invoices / Past Bills List */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff', marginBottom: '10px' }}>
                  Purchase Bills & Transactions ({selectedCustomer.bills.length}):
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedCustomer.bills.map((sale) => (
                    <div
                      key={sale.id}
                      style={{
                        padding: '14px 18px', background: 'rgba(15,23,42,0.8)',
                        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '220px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontFamily: 'monospace', color: '#38bdf8', fontSize: '0.95rem' }}>{sale.id}</strong>
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            {new Date(sale.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Items: {(sale.items || []).map(i => `${i.name} (x${i.qty}${i.warranty ? ` · ${i.warranty}` : ''})`).join(', ')}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#34d399' }}>
                            ₹{Number(sale.totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            via {sale.paymentMethod}
                          </span>
                        </div>

                        {onViewReceipt && (
                          <button
                            onClick={() => onViewReceipt(sale)}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '6px 12px', fontSize: '0.78rem', cursor: 'pointer', color: '#38bdf8', borderColor: 'rgba(56,189,248,0.4)' }}
                          >
                            🧾 View Bill
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        ) : (
          /* Default state showing customer list summary */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              💡 Type a phone number above, or select from existing store customers below:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
              {allCustomers.map(cust => (
                <div
                  key={cust.key}
                  onClick={() => setCustomerSearchPhone(cust.phone || cust.name)}
                  style={{
                    padding: '12px 14px', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
                    cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                  className="glass-panel-hover"
                >
                  <div>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: '700', color: '#fff' }}>{cust.name}</h4>
                    <p style={{ fontSize: '0.76rem', color: '#38bdf8' }}>📞 {cust.phone || 'No phone'}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{cust.bills.length} bills · {cust.totalItems} items</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#34d399' }}>
                      ₹{cust.totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: '600' }}>Inspect →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 🔍 ITEM QUICK SEARCH (NEW FEATURE) ──────────────────────────── */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
        <SectionHeader
          title="Item & Inventory Quick Search"
          sub="Search any product across catalog to check stock, price & SKU details"
          icon="📦"
        />

        <div style={{
          position: 'relative', display: 'flex', alignItems: 'center',
          background: 'rgba(10,15,30,0.8)', borderRadius: '14px',
          border: '1px solid var(--border-light)', padding: '6px 16px',
          marginBottom: '16px'
        }}>
          <span style={{ fontSize: '1.2rem', marginRight: '10px', color: 'var(--text-muted)' }}>🔍</span>
          <input
            type="text"
            placeholder="Search items by name, SKU (e.g. EL-AUDIO-001) or category..."
            value={itemSearchQuery}
            onChange={(e) => setItemSearchQuery(e.target.value)}
            style={{
              flex: 1, background: 'transparent', border: 'none',
              outline: 'none', color: '#fff', fontSize: '0.92rem',
              padding: '6px 0', cursor: 'text', fontFamily: 'var(--font-body)'
            }}
          />
          {itemSearchQuery && (
            <button
              onClick={() => setItemSearchQuery('')}
              style={{
                background: 'rgba(255,255,255,0.12)', border: 'none',
                color: '#fff', borderRadius: '50%', width: '22px', height: '22px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {cleanItemSearch && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            {matchedItems.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No items match "{itemSearchQuery}".
              </div>
            ) : (
              matchedItems.map(prod => {
                const isOut = Number(prod.stock) <= 0;
                const isLow = Number(prod.stock) <= Number(prod.minStock) && !isOut;
                return (
                  <div
                    key={prod.id}
                    style={{
                      padding: '14px', background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.8rem' }}>{prod.icon}</span>
                      <div>
                        <h4 style={{ fontSize: '0.88rem', fontWeight: '700', color: '#fff' }}>{prod.name}</h4>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{prod.sku} · {prod.category}</span>
                        <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#34d399', marginTop: '2px' }}>
                          ₹{Number(prod.sellingPrice).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span className={`badge ${isOut ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.7rem' }}>
                        {isOut ? 'Out of Stock' : `${prod.stock} in stock`}
                      </span>
                      <button
                        onClick={() => onNavigate('pos')}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '2px 8px', fontSize: '0.72rem', cursor: 'pointer', marginTop: '4px' }}
                      >
                        POS →
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── MIDDLE ROW: Top Sellers & Category Breakdown ────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1.2fr 1fr' : '1fr', gap: '20px' }}>

        {/* Top Sellers */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
          <SectionHeader title="Top Selling Products" sub="Ranked by units sold across all transactions" icon="🔥" />
          {topSellers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>No sales recorded yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {topSellers.map(([name, qty], i) => (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '22px', height: '22px', borderRadius: '6px', fontSize: '0.72rem',
                        fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: i === 0 ? '#f59e0b22' : 'rgba(255,255,255,0.05)',
                        color: i === 0 ? '#f59e0b' : 'var(--text-muted)', border: i === 0 ? '1px solid #f59e0b44' : '1px solid rgba(255,255,255,0.07)'
                      }}>#{i + 1}</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: '600', color: '#fff' }}>{name}</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: ACCENT_COLORS[i % ACCENT_COLORS.length] }}>{qty} sold</span>
                  </div>
                  <ProgressBar value={qty} max={maxSold} color={ACCENT_COLORS[i % ACCENT_COLORS.length]} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin only: Category Breakdown */}
        {isAdmin && (
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
            <SectionHeader title="Inventory by Category" sub="Stock value distribution" icon="📊" />
            {categories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>No products yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {categories.slice(0, 5).map(([cat, data], i) => (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff' }}>{cat}</span>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: ACCENT_COLORS[i % ACCENT_COLORS.length] }}>
                          ₹{data.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '6px' }}>{data.count} SKU · {data.stock} units</span>
                      </div>
                    </div>
                    <ProgressBar value={data.value} max={maxCatValue} color={ACCENT_COLORS[i % ACCENT_COLORS.length]} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── BOTTOM ROW: Recent Transactions ─────────────────────────────── */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
        <SectionHeader
          title={isAdmin ? 'Recent Transactions Ledger' : 'My Recent Checkout Ledger'}
          sub="Latest completed sales invoices with customer information"
          icon="🧾"
          action={
            <button onClick={() => onNavigate('sales')} className="btn btn-outline btn-sm" style={{ cursor: 'pointer', fontSize: '0.78rem' }}>
              View All Sales →
            </button>
          }
        />
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Date & Time</th>
                <th>Customer</th>
                {isAdmin && <th>Cashier</th>}
                <th>Payment</th>
                <th>Items Count</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No sales recorded yet.
                  </td>
                </tr>
              ) : recentSales.map(sale => (
                <tr key={sale.id}>
                  <td><strong style={{ color: 'var(--primary)', fontFamily: 'monospace', fontSize: '0.84rem' }}>{sale.id}</strong></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    {new Date(sale.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td>
                    <div>
                      <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.85rem' }}>{sale.customerName || 'Walk-in'}</div>
                      {sale.customerPhone && <div style={{ fontSize: '0.72rem', color: '#38bdf8' }}>📞 {sale.customerPhone}</div>}
                    </div>
                  </td>
                  {isAdmin && <td style={{ fontWeight: '600', fontSize: '0.85rem' }}>{sale.cashierName}</td>}
                  <td><span className="badge badge-info" style={{ fontSize: '0.72rem' }}>{sale.paymentMethod}</span></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{sale.items?.reduce((a, i) => a + i.qty, 0) ?? 0} pcs</td>
                  <td style={{ color: '#34d399', fontWeight: '800', fontSize: '0.92rem' }}>
                    ₹{Number(sale.totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td>
                    {onViewReceipt && (
                      <button
                        onClick={() => onViewReceipt(sale)}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '3px 8px', fontSize: '0.72rem', cursor: 'pointer' }}
                      >
                        Receipt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
