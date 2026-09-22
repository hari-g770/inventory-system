import React, { useState } from 'react';

export default function SalesHistory({ sales = [], userRole, currentUser, onViewReceipt }) {
  const [filterPayment, setFilterPayment] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = userRole === 'admin';

  // If staff user, view only personal sales history
  const visibleSales = isAdmin 
    ? sales
    : sales.filter(s => s.cashierId === currentUser.id);

  const cleanQuery = searchQuery.trim().toLowerCase();

  const filteredSales = visibleSales.filter(s => {
    const matchesSearch = !cleanQuery ||
      s.id.toLowerCase().includes(cleanQuery) ||
      (s.cashierName && s.cashierName.toLowerCase().includes(cleanQuery)) ||
      (s.customerName && s.customerName.toLowerCase().includes(cleanQuery)) ||
      (s.customerPhone && s.customerPhone.toLowerCase().includes(cleanQuery)) ||
      (s.items && s.items.some(i => i.name.toLowerCase().includes(cleanQuery)));

    const matchesPay = filterPayment === 'All' || s.paymentMethod === filterPayment;
    return matchesSearch && matchesPay;
  });

  const totalFilteredRevenue = filteredSales.reduce((acc, s) => acc + Number(s.totalRevenue), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }} className="gradient-text">
            {isAdmin ? 'All Sales & Revenue Transactions' : 'My Completed Checkout Ledger'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            {isAdmin ? 'Complete audit trail of all store checkouts, customer details, and revenue events.' : 'View your recent completed sales transactions and customer receipts.'}
          </p>
        </div>

        {/* Total Summary Box */}
        <div style={{
          padding: '10px 20px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-md)'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
            {isAdmin ? 'Total Filtered Revenue: ' : 'My Total Revenue: '}
          </span>
          <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#34d399', marginLeft: '6px' }}>
            ₹{totalFilteredRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', borderRadius: '16px' }}>
        <div style={{ position: 'relative', flex: '1 1 280px', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }}>🔍</span>
          <input
            type="text"
            placeholder="Search by Invoice ID, Customer Name, Phone, Cashier, or Item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Payment Method:</span>
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="input-field"
            style={{ width: '180px', padding: '8px 12px', fontSize: '0.84rem' }}
          >
            <option value="All">All Methods</option>
            <option value="UPI / QR Code">UPI / QR Code</option>
            <option value="Credit/Debit Card">Credit/Debit Card</option>
            <option value="Cash">Cash</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '20px' }}>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Cashier Name</th>
                <th>Items & Warranty</th>
                <th>Payment</th>
                {isAdmin && <th>Profit</th>}
                <th>Order Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    🧾 No sales transactions recorded matching your query.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>
                      <strong style={{ color: 'var(--primary)', fontFamily: 'monospace', fontSize: '0.88rem' }}>{sale.id}</strong>
                    </td>

                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                      {new Date(sale.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>

                    <td>
                      <div>
                        <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.86rem' }}>{sale.customerName || 'Walk-in'}</div>
                        {sale.customerPhone && <div style={{ fontSize: '0.74rem', color: '#38bdf8' }}>📞 {sale.customerPhone}</div>}
                      </div>
                    </td>

                    <td style={{ fontWeight: '600', fontSize: '0.86rem' }}>{sale.cashierName}</td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {sale.items.map((it, idx) => (
                          <span key={idx} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            • {it.name} <strong style={{ color: '#fff' }}>x{it.qty}</strong> (₹{(it.price * it.qty).toFixed(2)})
                            {it.warranty ? <span style={{ color: '#38bdf8', marginLeft: '4px' }}>[{it.warranty}]</span> : ''}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td>
                      <span className="badge badge-info">{sale.paymentMethod}</span>
                    </td>

                    {isAdmin && (
                      <td style={{ color: '#818cf8', fontWeight: '700' }}>
                        +₹{Number(sale.profit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    )}

                    <td style={{ color: '#34d399', fontWeight: '800', fontSize: '1rem' }}>
                      ₹{Number(sale.totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
