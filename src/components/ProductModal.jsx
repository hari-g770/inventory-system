import React, { useState, useEffect } from 'react';

export default function ProductModal({ isOpen, onClose, onSave, editingProduct }) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Electronics',
    costPrice: '',
    sellingPrice: '',
    stock: '',
    minStock: '10',
    unit: 'pcs',
    icon: '📦'
  });

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || '',
        sku: editingProduct.sku || '',
        category: editingProduct.category || 'Electronics',
        costPrice: editingProduct.costPrice || '',
        sellingPrice: editingProduct.sellingPrice || '',
        stock: editingProduct.stock || '',
        minStock: editingProduct.minStock || '10',
        unit: editingProduct.unit || 'pcs',
        icon: editingProduct.icon || '📦'
      });
    } else {
      // Auto generate random SKU
      const randomSku = 'SKU-' + Math.floor(1000 + Math.random() * 9000);
      setFormData({
        name: '',
        sku: randomSku,
        category: 'Electronics',
        costPrice: '',
        sellingPrice: '',
        stock: '20',
        minStock: '10',
        unit: 'pcs',
        icon: '📦'
      });
    }
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.sellingPrice || !formData.costPrice) return;

    onSave({
      ...formData,
      costPrice: parseFloat(formData.costPrice),
      sellingPrice: parseFloat(formData.sellingPrice),
      stock: parseInt(formData.stock, 10),
      minStock: parseInt(formData.minStock, 10)
    });
  };

  const emojiIcons = ['📦', '🎧', '🖥️', '👕', '☕', '⌚', '💡', '🖱️', '🎒', '📱', '👟', '🕶️'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }} className="gradient-text">
            {editingProduct ? 'Edit Inventory Item' : 'Add New Inventory Product'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}
          >
            ✖
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Icon Selection */}
          <div className="form-group">
            <label className="form-label">Product Icon</label>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
              {emojiIcons.map(ic => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: ic })}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: formData.icon === ic ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                    background: formData.icon === ic ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.04)',
                    fontSize: '1.2rem',
                    cursor: 'pointer'
                  }}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Wireless Bluetooth Speaker"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">SKU Code</label>
              <input
                type="text"
                className="input-field"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="input-field"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Electronics">Electronics</option>
                <option value="Apparel">Apparel</option>
                <option value="Groceries">Groceries</option>
                <option value="Accessories">Accessories</option>
                <option value="Home & Living">Home & Living</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Cost Price (₹)</label>
              <input
                type="number"
                step="0.01"
                className="input-field"
                placeholder="0.00"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Selling Price (₹)</label>
              <input
                type="number"
                step="0.01"
                className="input-field"
                placeholder="0.00"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Stock Qty</label>
              <input
                type="number"
                className="input-field"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Reorder Level</label>
              <input
                type="number"
                className="input-field"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Unit Type</label>
              <input
                type="text"
                className="input-field"
                placeholder="pcs / bags"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              💾 Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
