import React, { useState, useEffect, useRef } from 'react';

export default function ReceiptModal({ isOpen, onClose, saleRecord }) {
  const printRef = useRef(null);

  // Editable bill state – initialised from saleRecord
  const [editMode, setEditMode] = useState(false);
  const [billData, setBillData] = useState(null);

  useEffect(() => {
    if (saleRecord) {
      setBillData({
        invoiceNumber: saleRecord.id || '',
        customerName: saleRecord.customerName || '',
        customerPhone: saleRecord.customerPhone || '',
        customerAddress: saleRecord.customerAddress || '',
        items: (saleRecord.items || []).map(it => ({ ...it })),
        subtotal: Number(saleRecord.subtotal || 0),
        tax: Number(saleRecord.tax || 0),
        gstRate: saleRecord.gstRate ?? 18,
        applyGst: saleRecord.applyGst ?? (Number(saleRecord.tax) > 0),
        discount: Number(saleRecord.discount || 0),
        totalRevenue: Number(saleRecord.totalRevenue || 0),
        paymentMethod: saleRecord.paymentMethod || 'Cash',
        notes: saleRecord.notes || '',
      });
      setEditMode(false);
    }
  }, [saleRecord]);

  if (!isOpen || !saleRecord || !billData) return null;

  // Recalculate totals whenever items / gst / discount change
  const recalc = (items, applyGst, gstRate, discount) => {
    const subtotal = items.reduce((s, it) => s + (Number(it.price) * Number(it.qty)), 0);
    const tax = applyGst ? subtotal * (Number(gstRate) / 100) : 0;
    const totalRevenue = Math.max(0, subtotal + tax - Number(discount));
    return { subtotal, tax, totalRevenue };
  };

  const updateItem = (idx, field, val) => {
    const items = billData.items.map((it, i) =>
      i === idx ? { ...it, [field]: field === 'qty' || field === 'price' ? Number(val) : val } : it
    );
    const { subtotal, tax, totalRevenue } = recalc(items, billData.applyGst, billData.gstRate, billData.discount);
    setBillData(prev => ({ ...prev, items, subtotal, tax, totalRevenue }));
  };

  const removeItem = (idx) => {
    const items = billData.items.filter((_, i) => i !== idx);
    const { subtotal, tax, totalRevenue } = recalc(items, billData.applyGst, billData.gstRate, billData.discount);
    setBillData(prev => ({ ...prev, items, subtotal, tax, totalRevenue }));
  };

  const handleField = (field, val) => {
    const next = { ...billData, [field]: val };
    if (['applyGst', 'gstRate', 'discount'].includes(field)) {
      const { subtotal, tax, totalRevenue } = recalc(next.items, next.applyGst, next.gstRate, next.discount);
      next.subtotal = subtotal; next.tax = tax; next.totalRevenue = totalRevenue;
    }
    setBillData(next);
  };

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const w = window.open('', '_blank', 'width=520,height=750');
    w.document.write(`
      <html><head>
        <title>Receipt – ${billData.invoiceNumber || saleRecord.id}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', sans-serif; background: #fff; color: #111; padding: 24px; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { text-align: left; border-bottom: 2px solid #222; padding: 6px 4px; font-size: 11px; color: #222; text-transform: uppercase; }
          td { padding: 8px 4px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
          .logo { width: 50px; height: 50px; border-radius: 10px; object-fit: cover; }
          .brand { font-size: 1.2rem; font-weight: 800; color: #111; }
          .sub { font-size: 0.72rem; color: #6b7280; letter-spacing: 0.08em; text-transform: uppercase; }
          .dashed { border-top: 2px dashed #cbd5e1; margin: 14px 0; }
          .customer-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; margin: 12px 0; font-size: 12px; }
          .total-row { font-size: 1.05rem; font-weight: 800; color: #059669; }
          @media print { body { padding: 0; } }
        </style>
      </head><body>${printContents}</body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 400);
  };

  const inputStyle = {
    background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.35)',
    borderRadius: '6px', color: '#fff', padding: '5px 8px',
    fontSize: '0.82rem', width: '100%', cursor: 'text', outline: 'none'
  };
  const smallInputStyle = { ...inputStyle, padding: '3px 6px', fontSize: '0.78rem' };

  const S = {
    row: { display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--text-secondary)' },
    label: { color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '3px', fontWeight: '600' },
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ cursor: 'default' }}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '520px', background: '#0d111e', border: '1px solid rgba(16,185,129,0.35)', borderRadius: '20px', overflow: 'hidden', cursor: 'default' }}
      >
        {/* Toolbar */}
        <div style={{ padding: '14px 20px', background: 'rgba(99,102,241,0.12)', borderBottom: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🧾</span>
            <span style={{ fontWeight: '800', fontSize: '0.95rem', color: '#fff' }}>
              {editMode ? '✏️ Editing Invoice / Bill' : 'Customer Purchase Receipt'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setEditMode(m => !m)}
              className="btn btn-outline btn-sm"
              style={{ cursor: 'pointer', fontSize: '0.78rem', color: editMode ? '#34d399' : '#818cf8' }}
            >
              {editMode ? '✓ Save Changes' : '✏️ Edit Bill'}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>✕</button>
          </div>
        </div>

        {/* Scrollable receipt body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', maxHeight: '80vh' }}>

          {/* PRINTABLE AREA */}
          <div ref={printRef} style={{ fontFamily: 'Inter, sans-serif', color: '#fff' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <img
                src="/finefix-logo.jpg"
                alt="Finefix Logo"
                style={{ width: '52px', height: '52px', borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.15)', flexShrink: 0 }}
              />
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff', lineHeight: 1.1 }}>Finefix Technology</h2>
                <p style={{ fontSize: '0.72rem', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '2px' }}>Official Customer Purchase Receipt</p>
              </div>
            </div>

            {/* Trans info */}
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '12px', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span>Invoice ID:</span>
                {editMode ? (
                  <input
                    value={billData.invoiceNumber}
                    onChange={e => handleField('invoiceNumber', e.target.value)}
                    style={{
                      fontFamily: 'monospace', color: '#38bdf8',
                      background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.4)',
                      borderRadius: '6px', padding: '2px 8px', fontSize: '0.82rem',
                      cursor: 'text', outline: 'none', width: '160px'
                    }}
                  />
                ) : (
                  <strong style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{billData.invoiceNumber}</strong>
                )}
              </div>
              <div>Date & Time: <span style={{ color: 'var(--text-secondary)' }}>{new Date(saleRecord.date).toLocaleString()}</span></div>
              <div>Cashier: <span style={{ color: 'var(--text-secondary)' }}>{saleRecord.cashierName}</span></div>
            </div>

            {/* Customer Details Box */}
            {editMode ? (
              <div style={{
                marginBottom: '14px', padding: '12px', background: 'rgba(99,102,241,0.07)',
                borderRadius: '12px', border: '1px dashed rgba(99,102,241,0.3)',
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'
              }}>
                <div>
                  <div style={S.label}>Customer Name</div>
                  <input style={inputStyle} value={billData.customerName} onChange={e => handleField('customerName', e.target.value)} placeholder="e.g. Rahul Sharma" />
                </div>
                <div>
                  <div style={S.label}>Mobile / Phone</div>
                  <input style={inputStyle} value={billData.customerPhone} onChange={e => handleField('customerPhone', e.target.value)} placeholder="e.g. 9876543210" />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <div style={S.label}>Address / City (optional)</div>
                  <input style={inputStyle} value={billData.customerAddress} onChange={e => handleField('customerAddress', e.target.value)} placeholder="e.g. Bangalore" />
                </div>
              </div>
            ) : (
              (billData.customerName || billData.customerPhone || billData.customerAddress) ? (
                <div style={{
                  fontSize: '0.8rem', color: '#94a3b8', marginBottom: '14px',
                  padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
                  borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', flexDirection: 'column', gap: '3px'
                }}>
                  <div style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Customer Details
                  </div>
                  {billData.customerName && <div><strong style={{ color: '#fff', fontSize: '0.88rem' }}>{billData.customerName}</strong></div>}
                  {billData.customerPhone && <div>📞 {billData.customerPhone}</div>}
                  {billData.customerAddress && <div>📍 {billData.customerAddress}</div>}
                </div>
              ) : (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Customer: <span style={{ color: '#fff' }}>Walk-in Customer</span>
                </div>
              )
            )}

            <div style={{ borderTop: '2px dashed rgba(255,255,255,0.12)', marginBottom: '14px' }} />

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 4px', fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>Item</th>
                  <th style={{ textAlign: 'center', padding: '6px 4px', fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '6px 4px', fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '6px 4px', fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>Warranty</th>
                  <th style={{ textAlign: 'right', padding: '6px 4px', fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>Total</th>
                  {editMode && <th style={{ width: '28px' }}></th>}
                </tr>
              </thead>
              <tbody>
                {billData.items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '8px 4px', color: '#fff', fontWeight: '600', fontSize: '0.85rem', verticalAlign: 'top' }}>
                      {editMode
                        ? <input style={smallInputStyle} value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} />
                        : item.name}
                    </td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', verticalAlign: 'top' }}>
                      {editMode
                        ? <input style={{ ...smallInputStyle, width: '52px', textAlign: 'center' }} type="number" min="1" value={item.qty} onChange={e => updateItem(i, 'qty', e.target.value)} />
                        : item.qty}
                    </td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', color: '#94a3b8', fontSize: '0.85rem', verticalAlign: 'top' }}>
                      {editMode
                        ? <input style={{ ...smallInputStyle, width: '72px', textAlign: 'right' }} type="number" min="0" value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} />
                        : `₹${Number(item.price).toFixed(2)}`}
                    </td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', color: '#38bdf8', fontSize: '0.78rem', verticalAlign: 'top' }}>
                      {editMode
                        ? <input style={{ ...smallInputStyle, width: '90px', textAlign: 'right' }} value={item.warranty || ''} onChange={e => updateItem(i, 'warranty', e.target.value)} placeholder="e.g. 1 Year" />
                        : (item.warranty || <span style={{ color: '#475569' }}>—</span>)}
                    </td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', color: '#34d399', fontWeight: '700', fontSize: '0.85rem', verticalAlign: 'top' }}>
                      ₹{(Number(item.price) * Number(item.qty)).toFixed(2)}
                    </td>
                    {editMode && (
                      <td style={{ padding: '8px 4px', verticalAlign: 'top' }}>
                        <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.9rem' }}>✕</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.84rem', color: '#94a3b8', marginBottom: '16px' }}>
              <div style={S.row}><span>Subtotal:</span><span>₹{Number(billData.subtotal).toFixed(2)}</span></div>

              {/* GST Row */}
              {editMode ? (
                <div style={{ ...S.row, alignItems: 'center', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={billData.applyGst}
                      onChange={e => handleField('applyGst', e.target.checked)}
                      style={{ cursor: 'pointer', accentColor: '#10b981' }}
                    />
                    <span>Apply GST</span>
                  </label>
                  {billData.applyGst && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <select
                        value={billData.gstRate}
                        onChange={e => handleField('gstRate', Number(e.target.value))}
                        style={{ ...smallInputStyle, width: '72px', cursor: 'pointer' }}
                      >
                        {[5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                      </select>
                      <span style={{ color: '#34d399' }}>₹{Number(billData.tax).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              ) : (
                billData.applyGst && billData.tax > 0 && (
                  <div style={S.row}>
                    <span>GST ({billData.gstRate}%):</span>
                    <span>₹{Number(billData.tax).toFixed(2)}</span>
                  </div>
                )
              )}

              {Number(billData.discount) > 0 && (
                <div style={{ ...S.row, color: '#f87171' }}>
                  <span>Discount:</span>
                  <span>-₹{Number(billData.discount).toFixed(2)}</span>
                </div>
              )}

              <div style={{ ...S.row, padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '1.05rem', fontWeight: '800', color: '#34d399' }}>
                <span>Total Paid:</span>
                <span>₹{Number(billData.totalRevenue).toFixed(2)}</span>
              </div>

              {/* Payment Method */}
              {editMode ? (
                <div style={{ ...S.row, alignItems: 'center' }}>
                  <span>Payment Method:</span>
                  <select value={billData.paymentMethod} onChange={e => handleField('paymentMethod', e.target.value)} style={{ ...smallInputStyle, width: '180px', cursor: 'pointer' }}>
                    <option value="UPI / QR Code">📱 UPI / QR Code</option>
                    <option value="Credit/Debit Card">💳 Credit / Debit Card</option>
                    <option value="Cash">💵 Cash</option>
                  </select>
                </div>
              ) : (
                <div style={S.row}>
                  <span>Payment Method:</span>
                  <span style={{ color: '#fff', fontWeight: '700' }}>{billData.paymentMethod}</span>
                </div>
              )}
            </div>

            {/* Notes */}
            {editMode && (
              <div style={{ marginBottom: '14px' }}>
                <div style={S.label}>Bill Notes (optional)</div>
                <textarea
                  value={billData.notes}
                  onChange={e => handleField('notes', e.target.value)}
                  placeholder="e.g. Thank you for visiting Finefix Technology!"
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            )}
            {!editMode && billData.notes && (
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '12px', fontStyle: 'italic' }}>{billData.notes}</p>
            )}

            {/* Barcode strip */}
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <div style={{ background: '#fff', padding: '8px 12px', borderRadius: '6px', display: 'inline-block' }}>
                <div style={{ height: '28px', width: '190px', background: 'repeating-linear-gradient(90deg,#000,#000 2px,#fff 2px,#fff 4px,#000 4px,#000 7px)' }} />
              </div>
              <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '6px' }}>
                Thank you for shopping with Finefix Technology!
              </div>
            </div>
          </div>
          {/* END PRINTABLE AREA */}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button onClick={handlePrint} className="btn btn-outline" style={{ flex: 1, cursor: 'pointer' }}>
              🖨️ Print Receipt
            </button>
            <button onClick={onClose} className="btn btn-primary" style={{ flex: 1, cursor: 'pointer' }}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
