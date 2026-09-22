import React, { useState } from 'react';

export default function Inventory({
  products,
  userRole,
  searchQuery,
  onOpenAddModal,
  onOpenEditModal,
  onQuickRestock,
  onDeleteProduct
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');

  // Categories list
  const categories = ['All', 'Electronics', 'Apparel', 'Groceries', 'Accessories', 'Home & Living'];

  // Filter Products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;

    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = Number(product.stock) <= Number(product.minStock) && Number(product.stock) > 0;
    } else if (stockFilter === 'out') {
      matchesStock = Number(product.stock) === 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }} className="gradient-text">
            Inventory Stock Catalog
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Manage item pricing, stock quantities, SKU identification, and restock items.
          </p>
        </div>

        {/* Add Product Button Enabled for Both Staff and Admin */}
        <button onClick={onOpenAddModal} className="btn btn-primary btn-lg">
          ➕ Add New Stock Product
        </button>
      </div>

      {/* Controls & Filter Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-outline'}`}
              style={{ borderRadius: '20px' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Stock Level Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Filter Stock:</span>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="input-field"
            style={{ width: '160px', padding: '6px 12px', fontSize: '0.84rem' }}
          >
            <option value="All">All Items</option>
            <option value="low">⚠️ Low Stock Only</option>
            <option value="out">🚫 Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Inventory Catalog Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Item / SKU</th>
                <th>Category</th>
                <th>Cost Price</th>
                <th>Selling Price</th>
                <th>Margin %</th>
                <th>Stock Quantity</th>
                <th>Status</th>
                <th>Restock Action</th>
                <th>Manage Stock</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    🔍 No inventory items match your current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stockNum = Number(product.stock);
                  const minStockNum = Number(product.minStock);
                  const margin = product.sellingPrice > 0 
                    ? (((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100).toFixed(0)
                    : 0;

                  let statusBadge = <span className="badge badge-success">In Stock</span>;
                  if (stockNum === 0) {
                    statusBadge = <span className="badge badge-danger">Out of Stock</span>;
                  } else if (stockNum <= minStockNum) {
                    statusBadge = <span className="badge badge-warning">Low Stock ({stockNum})</span>;
                  }

                  return (
                    <tr key={product.id}>
                      {/* Product Name & Icon */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.4rem'
                          }}>
                            {product.icon}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: '#fff' }}>{product.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              {product.sku}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="badge badge-info">{product.category}</span>
                      </td>

                      <td style={{ color: 'var(--text-secondary)' }}>
                        ₹{Number(product.costPrice).toFixed(2)}
                      </td>

                      <td style={{ fontWeight: '700', color: '#38bdf8' }}>
                        ₹{Number(product.sellingPrice).toFixed(2)}
                      </td>

                      <td style={{ color: '#a855f7', fontWeight: '700' }}>
                        {margin}%
                      </td>

                      <td>
                        <strong style={{
                          fontSize: '1rem',
                          color: stockNum <= minStockNum ? '#f87171' : '#34d399'
                        }}>
                          {stockNum} {product.unit}
                        </strong>
                      </td>

                      <td>{statusBadge}</td>

                      {/* Quick Restock Buttons */}
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => onQuickRestock(product.id, 5)}
                            className="btn btn-outline btn-sm"
                            title="Add 5 units"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          >
                            +5
                          </button>
                          <button
                            onClick={() => onQuickRestock(product.id, 10)}
                            className="btn btn-outline btn-sm"
                            title="Add 10 units"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          >
                            +10
                          </button>
                        </div>
                      </td>

                      {/* Manage Actions Available for Staff and Admin */}
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => onOpenEditModal(product)}
                            className="btn btn-outline btn-sm"
                            style={{ borderColor: 'rgba(99, 102, 241, 0.4)', color: '#818cf8' }}
                          >
                            ✏️ Edit Stock
                          </button>
                          {userRole === 'admin' && (
                            <button
                              onClick={() => onDeleteProduct(product.id)}
                              className="btn btn-outline btn-sm"
                              style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
