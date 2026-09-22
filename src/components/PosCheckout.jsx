import React, { useState, useEffect } from 'react';

export default function PosCheckout({ products = [], currentUser, onCompleteSale, searchQuery = '', sales = [], onViewReceipt }) {
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI / QR Code');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [applyGst, setApplyGst] = useState(true);
  const [gstRate, setGstRate] = useState(18);
  const [localSearch, setLocalSearch] = useState('');

  // Customer details state for active checkout
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [showAddressField, setShowAddressField] = useState(false);
  const [showInlineHistory, setShowInlineHistory] = useState(false);

  // Dedicated POS Customer Search query & active selected customer
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  // warranty per cart item: { [id]: '...' }
  const [warranties, setWarranties] = useState({});

  const categories = ['All', 'Electronics', 'Apparel', 'Groceries', 'Accessories', 'Home & Living'];

  // Combined search: uses both navbar searchQuery and localSearch
  const effectiveSearch = (localSearch || searchQuery).trim().toLowerCase();

  const availableProducts = products.filter(product => {
    const matchesSearch = !effectiveSearch ||
      product.name.toLowerCase().includes(effectiveSearch) ||
      product.sku.toLowerCase().includes(effectiveSearch) ||
      product.category.toLowerCase().includes(effectiveSearch);
    const matchesCat = categoryFilter === 'All' || product.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  // Aggregate customer data across all sales for POS history lookup
  const customerMap = {};
  sales.forEach(sale => {
    const key = (sale.customerPhone || sale.customerName || '').trim();
    if (!key || key.toLowerCase() === 'walk-in' || key.toLowerCase() === 'walk-in customer') return;

    if (!customerMap[key]) {
      customerMap[key] = {
        id: key,
        phone: sale.customerPhone || '',
        name: sale.customerName || (sale.customerPhone ? `Customer (${sale.customerPhone})` : 'Customer'),
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

  const allCustomers = Object.values(customerMap);

  // Active customer in current checkout
  const currentCleanPhone = customerPhone.trim();
  const currentCleanName = customerName.trim().toLowerCase();
  
  const currentCustomerRecord = allCustomers.find(c =>
    (currentCleanPhone && c.phone && c.phone.trim() === currentCleanPhone) ||
    (currentCleanName && c.name && c.name.toLowerCase() === currentCleanName)
  );

  // Filtered customer list for the customer search box
  const cleanCustSearch = customerSearchQuery.trim().toLowerCase();
  const matchedCustomers = cleanCustSearch
    ? allCustomers.filter(c =>
        (c.phone && c.phone.toLowerCase().includes(cleanCustSearch)) ||
        (c.name && c.name.toLowerCase().includes(cleanCustSearch)) ||
        c.bills.some(b => b.id.toLowerCase().includes(cleanCustSearch))
      )
    : allCustomers;

  // Active customer for detailed history display in POS
  const activeHistoryCustomer = selectedCustomerId
    ? allCustomers.find(c => c.id === selectedCustomerId)
    : (cleanCustSearch && matchedCustomers.length > 0 ? matchedCustomers[0] : null);

  // Auto-fill customer name & address if phone matches existing sale
  const handlePhoneChange = (val) => {
    setCustomerPhone(val);
    const cleanPhone = val.trim();
    if (cleanPhone.length >= 4 && allCustomers.length > 0) {
      const match = allCustomers.find(c => c.phone && c.phone.trim() === cleanPhone);
      if (match) {
        if (!customerName) setCustomerName(match.name);
        if (match.address && !customerAddress) {
          setCustomerAddress(match.address);
          setShowAddressField(true);
        }
      }
    }
  };

  // Select customer into current active checkout
  const selectCustomerForCheckout = (cust) => {
    if (cust.phone) setCustomerPhone(cust.phone);
    if (cust.name) setCustomerName(cust.name);
    if (cust.address) {
      setCustomerAddress(cust.address);
      setShowAddressField(true);
    }
    // Also mirror to search box
    setCustomerSearchQuery(cust.phone || cust.name);
    setSelectedCustomerId(cust.id);
    setIsHistoryExpanded(true);
  };

  // Add item from history directly into current cart
  const addHistoryItemToCart = (item) => {
    const prod = products.find(p => p.id === item.productId || p.name.toLowerCase() === item.name.toLowerCase());
    if (prod) {
      addToCart(prod);
    } else {
      setCart(prev => {
        const existing = prev.find(i => i.name.toLowerCase() === item.name.toLowerCase());
        if (existing) {
          return prev.map(i => i.name.toLowerCase() === item.name.toLowerCase() ? { ...i, qty: i.qty + 1 } : i);
        }
        return [...prev, {
          id: item.productId || 'custom-' + Date.now(),
          name: item.name,
          sellingPrice: item.price,
          costPrice: item.cost || 0,
          qty: 1,
          icon: '📦'
        }];
      });
    }
  };

  const addToCart = (product) => {
    if (Number(product.stock) <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateCartQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        if (newQty <= 0) return null;
        const prod = products.find(p => p.id === id);
        if (prod && newQty > prod.stock) return item;
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
    setWarranties(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const clearCart = () => {
    setCart([]);
    setWarranties({});
    setCustomerPhone('');
    setCustomerName('');
    setCustomerAddress('');
    setDiscount(0);
    setShowInlineHistory(false);
  };

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.sellingPrice) * item.qty), 0);
  const tax = applyGst ? subtotal * (gstRate / 100) : 0;
  const totalRevenue = Math.max(0, subtotal + tax - Number(discount));
  const totalCost = cart.reduce((sum, item) => sum + (Number(item.costPrice) * item.qty), 0);
  const estimatedProfit = subtotal - totalCost;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const saleRecord = {
      id: 'TRX-' + Math.floor(1000 + Math.random() * 9000),
      date: new Date().toISOString(),
      cashierName: currentUser.name,
      cashierId: currentUser.id,
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim() || '',
      customerAddress: customerAddress.trim() || '',
      items: cart.map(item => ({
        productId: item.id,
        name: item.name,
        qty: item.qty,
        price: Number(item.sellingPrice),
        cost: Number(item.costPrice),
        warranty: warranties[item.id] || ''
      })),
      subtotal,
      tax,
      gstRate: applyGst ? gstRate : 0,
      applyGst,
      discount: Number(discount),
      totalRevenue,
      profit: estimatedProfit,
      paymentMethod
    };
    onCompleteSale(saleRecord);
    clearCart();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 410px', gap: '24px', minHeight: 'calc(100vh - 120px)' }}>
      
      {/* ── LEFT MAIN SECTION ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header with Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }} className="gradient-text">
              POS Sales Register
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '2px' }}>
              Search customer purchase history, add catalog items, and complete checkouts.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '5px 12px', borderRadius: '20px', border: '1px solid rgba(56,189,248,0.3)' }}>
              👤 {allCustomers.length} Customers on file
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '5px 12px', borderRadius: '20px' }}>
              📦 {availableProducts.length} items
            </span>
          </div>
        </div>

        {/* ── 👤 PERMANENT CUSTOMER SEARCH BOX & PURCHASE HISTORY SECTION ── */}
        <div className="glass-panel" style={{
          padding: '18px 20px', borderRadius: '18px',
          border: '1px solid rgba(56,189,248,0.35)',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(30,41,59,0.75) 100%)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.35)'
        }}>
          {/* Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.3rem' }}>👤</span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#fff' }}>
                Customer Search Box & Purchase History
              </h3>
            </div>
            {activeHistoryCustomer && (
              <button
                onClick={() => setIsHistoryExpanded(p => !p)}
                style={{
                  background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.4)',
                  color: '#38bdf8', borderRadius: '8px', padding: '4px 10px',
                  fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer'
                }}
              >
                {isHistoryExpanded ? '▲ Collapse History' : '▼ Expand History'}
              </button>
            )}
          </div>

          {/* Customer Search Input */}
          <div style={{
            position: 'relative', display: 'flex', alignItems: 'center',
            background: 'rgba(10,15,30,0.9)', borderRadius: '12px',
            border: '1px solid var(--border-glow)', padding: '4px 14px',
            marginBottom: '10px'
          }}>
            <span style={{ fontSize: '1.1rem', marginRight: '10px', color: '#38bdf8' }}>🔍</span>
            <input
              type="text"
              placeholder="Search customer by Mobile Number (e.g. 9876543210), Name, or Invoice ID..."
              value={customerSearchQuery}
              onChange={(e) => {
                setCustomerSearchQuery(e.target.value);
                setSelectedCustomerId(null);
                setIsHistoryExpanded(true);
              }}
              style={{
                flex: 1, background: 'transparent', border: 'none',
                outline: 'none', color: '#fff', fontSize: '0.92rem',
                padding: '8px 0', cursor: 'text'
              }}
            />
            {customerSearchQuery && (
              <button
                onClick={() => {
                  setCustomerSearchQuery('');
                  setSelectedCustomerId(null);
                }}
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

          {/* Quick Customer Selection Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: activeHistoryCustomer ? '14px' : '0' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Quick Select:</span>
            {allCustomers.map(c => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCustomerId(c.id);
                  setCustomerSearchQuery(c.phone || c.name);
                  setIsHistoryExpanded(true);
                }}
                style={{
                  background: (activeHistoryCustomer?.id === c.id) ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                  color: (activeHistoryCustomer?.id === c.id) ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
                  padding: '3px 10px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600'
                }}
              >
                {c.name} {c.phone ? `(${c.phone})` : ''}
              </button>
            ))}
          </div>

          {/* 📜 Active Customer Purchase History Box (When selected or searched) */}
          {activeHistoryCustomer && (
            <div style={{
              marginTop: '10px', padding: '14px 16px',
              background: 'rgba(15,23,42,0.85)', borderRadius: '14px',
              border: '1px solid rgba(56,189,248,0.3)', display: 'flex', flexDirection: 'column', gap: '12px'
            }}>
              {/* Profile Header Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#fff' }}>{activeHistoryCustomer.name}</h4>
                    <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>{activeHistoryCustomer.bills.length} Previous Bills</span>
                  </div>
                  {activeHistoryCustomer.phone && <p style={{ fontSize: '0.82rem', color: '#38bdf8', marginTop: '2px' }}>📞 {activeHistoryCustomer.phone}</p>}
                  {activeHistoryCustomer.address && <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>📍 {activeHistoryCustomer.address}</p>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Lifetime Spend</span>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#34d399' }}>
                      ₹{activeHistoryCustomer.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <button
                    onClick={() => selectCustomerForCheckout(activeHistoryCustomer)}
                    className="btn btn-primary btn-sm"
                    style={{ padding: '6px 12px', fontSize: '0.78rem', cursor: 'pointer', borderRadius: '10px' }}
                  >
                    📋 Fill into Active Bill
                  </button>
                </div>
              </div>

              {/* Collapsible Purchase Invoices List */}
              {isHistoryExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                    Past Purchases ({activeHistoryCustomer.bills.length}):
                  </span>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                    {activeHistoryCustomer.bills.map((bill) => (
                      <div
                        key={bill.id}
                        style={{
                          padding: '10px 12px', background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontFamily: 'monospace', color: '#38bdf8', fontSize: '0.85rem' }}>{bill.id}</strong>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              {new Date(bill.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>via {bill.paymentMethod}</span>
                          </div>

                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            {(bill.items || []).map((it, idx) => (
                              <span key={idx} style={{ marginRight: '8px' }}>
                                • {it.name} <strong style={{ color: '#fff' }}>x{it.qty}</strong>
                                {it.warranty ? <span style={{ color: '#38bdf8', marginLeft: '3px' }}>[{it.warranty}]</span> : ''}
                                <button
                                  onClick={() => addHistoryItemToCart(it)}
                                  title="Add to current sale basket"
                                  style={{
                                    background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)',
                                    color: '#818cf8', borderRadius: '4px', padding: '1px 5px',
                                    fontSize: '0.68rem', marginLeft: '5px', cursor: 'pointer'
                                  }}
                                >
                                  + Reorder
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#34d399' }}>
                            ₹{Number(bill.totalRevenue).toFixed(2)}
                          </span>
                          {onViewReceipt && (
                            <button
                              onClick={() => onViewReceipt(bill)}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '3px 8px', fontSize: '0.72rem', cursor: 'pointer' }}
                            >
                              🧾 View Bill
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 📦 PRODUCT CATALOG & ITEM SEARCH ────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff' }}>
              📦 Product Inventory Catalog
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Click any product card to add to basket
            </span>
          </div>

          {/* Dedicated Item Search Bar */}
          <div style={{
            position: 'relative', display: 'flex', alignItems: 'center',
            background: 'rgba(15,23,42,0.7)', borderRadius: '14px',
            border: '1px solid var(--border-glow)', padding: '4px 14px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
          }}>
            <span style={{ fontSize: '1.2rem', marginRight: '10px', color: 'var(--text-muted)' }}>🔍</span>
            <input
              type="text"
              placeholder="Search items by name, SKU (e.g. EL-AUDIO-001) or category..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              style={{
                flex: 1, background: 'transparent', border: 'none',
                outline: 'none', color: '#fff', fontSize: '0.92rem',
                padding: '10px 0', cursor: 'text'
              }}
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                style={{
                  background: 'rgba(255,255,255,0.1)', border: 'none',
                  color: '#fff', borderRadius: '50%', width: '22px', height: '22px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`btn btn-sm ${categoryFilter === cat ? 'btn-primary' : 'btn-outline'}`}
                style={{ borderRadius: '20px', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          {availableProducts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔍</div>
              <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '6px' }}>No items match your search</h3>
              <p style={{ fontSize: '0.85rem' }}>Try searching by a different name or SKU code.</p>
              {localSearch && (
                <button
                  onClick={() => setLocalSearch('')}
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: '14px', cursor: 'pointer' }}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '16px', alignContent: 'start' }}>
              {availableProducts.map(product => {
                const isOutOfStock = Number(product.stock) <= 0;
                const inCart = cart.find(c => c.id === product.id);
                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    className={`glass-panel ${!isOutOfStock ? 'glass-panel-hover' : ''}`}
                    style={{
                      padding: '16px', cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      opacity: isOutOfStock ? 0.45 : 1, position: 'relative',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px',
                      border: inCart ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                      borderRadius: '16px'
                    }}
                  >
                    {inCart && (
                      <div style={{
                        position: 'absolute', top: '10px', right: '10px',
                        background: 'var(--primary)', color: '#fff', borderRadius: '50%',
                        width: '24px', height: '24px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.78rem', fontWeight: '800'
                      }}>
                        {inCart.qty}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '2rem' }}>{product.icon}</span>
                      <div style={{ minWidth: 0 }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff', lineHeight: '1.2' }}>
                          {product.name}
                        </h4>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{product.sku}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#34d399', fontFamily: 'var(--font-heading)' }}>
                        ₹{Number(product.sellingPrice).toFixed(2)}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: isOutOfStock ? '#f87171' : 'var(--text-secondary)' }}>
                        {isOutOfStock ? 'Out of Stock' : `${product.stock} in stock`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* ── RIGHT: Current Sale Basket & Customer Panel ─────────────────── */}
      <div className="glass-panel" style={{
        padding: '22px', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', height: '100%',
        border: '1px solid var(--border-glow)', boxShadow: '0 0 30px rgba(99,102,241,0.15)',
        borderRadius: '20px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Basket Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🛒</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Active Sale Basket</h3>
              {cart.length > 0 && (
                <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>{cart.reduce((a, c) => a + c.qty, 0)} items</span>
              )}
            </div>
            {cart.length > 0 && (
              <button onClick={clearCart} className="btn btn-outline btn-sm" style={{ fontSize: '0.72rem', color: '#f87171', cursor: 'pointer', padding: '4px 8px' }}>
                Clear
              </button>
            )}
          </div>

          {/* Customer Details Box in Basket */}
          <div style={{
            padding: '12px 14px', background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.25)', borderRadius: '14px',
            display: 'flex', flexDirection: 'column', gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                👤 Bill Customer Info
              </span>
              <button
                type="button"
                onClick={() => setShowAddressField(p => !p)}
                style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}
              >
                {showAddressField ? '- Hide Address' : '+ Add Address'}
              </button>
            </div>

            {/* Returning Customer Summary in Basket */}
            {currentCustomerRecord && (
              <div style={{
                padding: '8px 10px', background: 'rgba(16,185,129,0.14)',
                border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px',
                display: 'flex', flexDirection: 'column', gap: '6px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#34d399' }}>
                      ⭐ Returning: {currentCustomerRecord.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      {currentCustomerRecord.bills.length} past orders · ₹{currentCustomerRecord.totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })} spent
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInlineHistory(p => !p)}
                    style={{
                      background: 'rgba(16,185,129,0.25)', border: '1px solid rgba(16,185,129,0.5)',
                      color: '#34d399', borderRadius: '6px', padding: '3px 8px',
                      fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer'
                    }}
                  >
                    {showInlineHistory ? '▲ Hide' : '▼ History'}
                  </button>
                </div>

                {/* Inline Purchase History Accordion */}
                {showInlineHistory && (
                  <div style={{
                    maxHeight: '160px', overflowY: 'auto', display: 'flex',
                    flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(16,185,129,0.2)',
                    paddingTop: '6px', marginTop: '2px'
                  }}>
                    {currentCustomerRecord.bills.map((b) => (
                      <div key={b.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '6px', fontSize: '0.72rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#38bdf8', fontWeight: '700' }}>
                          <span>{b.id}</span>
                          <span style={{ color: '#34d399' }}>₹{Number(b.totalRevenue).toFixed(2)}</span>
                        </div>
                        <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                          {(b.items || []).map(i => `${i.name} (x${i.qty})`).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <input
                  type="tel"
                  placeholder="📞 Phone (e.g. 9876543210)"
                  value={customerPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="input-field"
                  style={{ padding: '7px 10px', fontSize: '0.8rem', cursor: 'text' }}
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="👤 Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="input-field"
                  style={{ padding: '7px 10px', fontSize: '0.8rem', cursor: 'text' }}
                />
              </div>
            </div>

            {showAddressField && (
              <input
                type="text"
                placeholder="📍 Address / City (optional)"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="input-field"
                style={{ padding: '6px 10px', fontSize: '0.78rem', cursor: 'text' }}
              />
            )}
          </div>

          {/* Cart Items with Warranty */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                🛒 Cart is empty. Click catalog items or reorder from customer history.
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} style={{ padding: '10px', background: 'rgba(15,23,42,0.65)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1, paddingRight: '8px', minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>₹{Number(item.sellingPrice).toFixed(2)} each</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button onClick={() => updateCartQty(item.id, -1)} className="btn btn-outline btn-sm" style={{ padding: '2px 8px', cursor: 'pointer' }}>-</button>
                      <span style={{ fontSize: '0.88rem', fontWeight: '800', minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => updateCartQty(item.id, 1)} className="btn btn-outline btn-sm" style={{ padding: '2px 8px', cursor: 'pointer' }}>+</button>
                      <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#f87171', marginLeft: '4px', cursor: 'pointer', fontSize: '0.9rem' }}>✖</button>
                    </div>
                  </div>
                  {/* Warranty field */}
                  <input
                    type="text"
                    placeholder="🛡️ Warranty (e.g. 1 Year, 6 Months)"
                    value={warranties[item.id] || ''}
                    onChange={(e) => setWarranties(prev => ({ ...prev, [item.id]: e.target.value }))}
                    className="input-field"
                    style={{ marginTop: '8px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'text', width: '100%' }}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Totals & Checkout Section */}
        <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            <span>Subtotal:</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>

          {/* GST Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <label style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={applyGst}
                onChange={(e) => setApplyGst(e.target.checked)}
                style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#10b981' }}
              />
              Apply GST
            </label>
            {applyGst && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <select
                  value={gstRate}
                  onChange={(e) => setGstRate(Number(e.target.value))}
                  className="input-field"
                  style={{ padding: '3px 8px', fontSize: '0.8rem', width: 'auto', cursor: 'pointer' }}
                >
                  {[5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                </select>
                <span style={{ fontSize: '0.82rem', color: '#34d399', fontWeight: '700' }}>₹{tax.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            <span>Discount (₹):</span>
            <input
              type="number" min="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="input-field"
              style={{ width: '90px', padding: '4px 8px', fontSize: '0.82rem', textAlign: 'right', cursor: 'text' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="input-field"
              style={{ padding: '7px 10px', fontSize: '0.84rem', cursor: 'pointer' }}
            >
              <option value="UPI / QR Code">📱 UPI / QR Code (GPay, PhonePe, Paytm)</option>
              <option value="Credit/Debit Card">💳 Credit / Debit Card</option>
              <option value="Cash">💵 Cash</option>
            </select>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 14px', background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px'
          }}>
            <span style={{ fontWeight: '700', color: '#fff', fontSize: '0.92rem' }}>Total:</span>
            <span style={{ fontSize: '1.35rem', fontWeight: '800', color: '#34d399', fontFamily: 'var(--font-heading)' }}>
              ₹{totalRevenue.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="btn btn-success btn-lg"
            style={{ width: '100%', opacity: cart.length === 0 ? 0.5 : 1, cursor: cart.length === 0 ? 'not-allowed' : 'pointer', borderRadius: '12px' }}
          >
            🧾 Complete Sale & Print Bill
          </button>
        </div>
      </div>

    </div>
  );
}
