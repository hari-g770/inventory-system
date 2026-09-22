import React, { useState, useEffect } from 'react';
import { initialUsers, initialProducts, initialSales } from './data/initialData';
import {
  isSupabaseConfigured,
  supabase,
  fetchUsersFromSupabase,
  loginFromSupabase,
  saveUserToSupabase,
  deleteUserFromSupabase,
  updateUserInSupabase,
  fetchProductsFromSupabase,
  saveProductToSupabase,
  deleteProductFromSupabase,
  fetchSalesFromSupabase,
  recordSaleToSupabase
} from './lib/supabaseClient';
import { hashPassword, verifyPassword, isBcryptHash } from './lib/hash';

import Login from './components/Login';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import ProductModal from './components/ProductModal';
import PosCheckout from './components/PosCheckout';
import ReceiptModal from './components/ReceiptModal';
import SalesHistory from './components/SalesHistory';
import StaffManager from './components/StaffManager';
import EditProfileModal from './components/EditProfileModal';
import TOTPInputModal from './components/TOTPInputModal';
import TwoFASetupModal from './components/TwoFASetupModal';

export default function App() {
  // ── State ────────────────────────────────────────────────────────────────
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('sp_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('sp_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem('sp_sales');
    if (!saved) return initialSales;
    try {
      const parsed = JSON.parse(saved);
      const hasCustomers = parsed.some(s => s.customerPhone);
      return hasCustomers ? parsed : initialSales;
    } catch {
      return initialSales;
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('sp_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState(null);

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [completedSaleRecord, setCompletedSaleRecord] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isTOTPModalOpen, setIsTOTPModalOpen] = useState(false);
  const [isTwoFASetupModalOpen, setIsTwoFASetupModalOpen] = useState(false);

  // Authentication auxiliary state for TOTP
  const [pendingUser, setPendingUser] = useState(null);

  // ── Supabase Initial Load + Realtime Subscriptions ──────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const mapProduct = p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      costPrice: Number(p.cost_price),
      sellingPrice: Number(p.selling_price),
      stock: Number(p.stock),
      minStock: Number(p.min_stock),
      unit: p.unit || 'pcs',
      icon: p.icon || '📦'
    });

    const mapUser = u => ({
      id: u.id,
      name: u.full_name,
      username: u.username,
      password: u.password,
      role: u.role,
      email: u.email || '',
      avatar: u.avatar_url || '',
      salesTotal: u.sales_total || 0,
      totp_secret: u.totp_secret || ''
    });

    (async () => {
      const dbUsers = await fetchUsersFromSupabase();
      if (dbUsers && dbUsers.length > 0) {
        setUsers(dbUsers);
        localStorage.setItem('sp_users', JSON.stringify(dbUsers));
      } else {
        for (const u of initialUsers) await saveUserToSupabase(u);
      }

      const dbProducts = await fetchProductsFromSupabase();
      if (dbProducts && dbProducts.length > 0) {
        setProducts(dbProducts);
        localStorage.setItem('sp_products', JSON.stringify(dbProducts));
      }

      const dbSales = await fetchSalesFromSupabase();
      if (dbSales && dbSales.length > 0) {
        setSales(dbSales);
        localStorage.setItem('sp_sales', JSON.stringify(dbSales));
      }
    })();

    const productChannel = supabase
      .channel('realtime-products')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, ({ new: row }) => {
        setProducts(prev => {
          if (prev.find(p => p.id === row.id)) return prev;
          return [mapProduct(row), ...prev];
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, ({ new: row }) => {
        setProducts(prev => prev.map(p => p.id === row.id ? mapProduct(row) : p));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'products' }, ({ old: row }) => {
        setProducts(prev => prev.filter(p => p.id !== row.id));
      })
      .subscribe();

    const salesChannel = supabase
      .channel('realtime-sales')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sales' }, async ({ new: row }) => {
        const { data } = await supabase
          .from('sales')
          .select('*, sale_items(*)')
          .eq('id', row.id)
          .single();
        if (!data) return;
        const mapped = {
          id: data.id,
          date: data.created_at,
          cashierId: data.cashier_id,
          cashierName: data.cashier_name,
          customerName: data.customer_name || 'Walk-in Customer',
          customerPhone: data.customer_phone || '',
          customerAddress: data.customer_address || '',
          subtotal: Number(data.subtotal),
          tax: Number(data.tax),
          discount: Number(data.discount),
          totalRevenue: Number(data.total_revenue),
          profit: Number(data.profit),
          paymentMethod: data.payment_method,
          items: (data.sale_items || []).map(i => ({
            productId: i.product_id,
            name: i.product_name,
            qty: i.quantity,
            price: Number(i.price),
            cost: Number(i.cost),
            warranty: i.warranty || ''
          }))
        };
        setSales(prev => {
          if (prev.find(s => s.id === mapped.id)) return prev;
          return [mapped, ...prev];
        });
      })
      .subscribe();

    const profileChannel = supabase
      .channel('realtime-profiles')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, ({ new: row }) => {
        setUsers(prev => {
          if (prev.find(u => u.id === row.id)) return prev;
          return [...prev, mapUser(row)];
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, ({ new: row }) => {
        setUsers(prev => prev.map(u => u.id === row.id ? mapUser(row) : u));
        setCurrentUser(cur => (cur && cur.id === row.id) ? { ...cur, ...mapUser(row) } : cur);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'profiles' }, ({ old: row }) => {
        setUsers(prev => prev.filter(u => u.id !== row.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(productChannel);
      supabase.removeChannel(salesChannel);
      supabase.removeChannel(profileChannel);
    };
  }, []);

  // ── LocalStorage Sync ─────────────────────────────────────────────────────
  useEffect(() => localStorage.setItem('sp_users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('sp_products', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('sp_sales', JSON.stringify(sales)), [sales]);
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('sp_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('sp_current_user');
    }
  }, [currentUser]);

  // ── Session Idle Timeout (10 minutes) ────────────────────────────────────────
  useEffect(() => {
    const updateLastActivity = () => {
      const now = Date.now();
      localStorage.setItem('sp_last_activity', now.toString());
    };
    window.addEventListener('click', updateLastActivity);
    window.addEventListener('keydown', updateLastActivity);
    updateLastActivity();
    const interval = setInterval(() => {
      const last = parseInt(localStorage.getItem('sp_last_activity') || '0', 10);
      if (Date.now() - last > 10 * 60 * 1000) {
        handleLogout();
      }
    }, 60 * 1000);
    return () => {
      window.removeEventListener('click', updateLastActivity);
      window.removeEventListener('keydown', updateLastActivity);
      clearInterval(interval);
    };
  }, []);

  // ── Authentication ────────────────────────────────────────────────────────
  const handleLoginSuccess = async (username, password) => {
    // 1. Supabase check
    if (isSupabaseConfigured) {
      const dbUser = await loginFromSupabase(username, password);
      if (dbUser) {
        setPendingUser(dbUser);
        if (dbUser.totp_secret) {
          setIsTOTPModalOpen(true);
        } else {
          setIsTwoFASetupModalOpen(true);
        }
        return dbUser;
      }
    }
    // 2. Local fallback
    const foundUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (foundUser) {
      const isValid = await verifyPassword(password, foundUser.password);
      if (!isValid) return null;
      if (!isBcryptHash(foundUser.password)) {
        const hashed = await hashPassword(password);
        setUsers(prev => prev.map(u => u.id === foundUser.id ? { ...u, password: hashed } : u));
      }
      setPendingUser(foundUser);
      if (foundUser.totp_secret) {
        setIsTOTPModalOpen(true);
      } else {
        setIsTwoFASetupModalOpen(true);
      }
      return foundUser;
    }
    return null;
  };

  const handleTOTPVerify = (isVerified) => {
    if (isVerified && pendingUser) {
      setCurrentUser(pendingUser);
      setActiveTab(pendingUser.role === 'admin' ? 'dashboard' : 'pos');
      setWelcomeUser(pendingUser);
      setShowWelcome(true);
      setTimeout(() => setShowWelcome(false), 3500);
    }
    setPendingUser(null);
    setIsTOTPModalOpen(false);
  };

  const handleTwoFASetupComplete = async (secret) => {
    if (!pendingUser) return;
    const updated = { ...pendingUser, totp_secret: secret };
    if (isSupabaseConfigured) {
      await updateUserInSupabase(pendingUser.id, { totp_secret: secret });
    }
    setUsers(prev => prev.map(u => u.id === pendingUser.id ? { ...u, totp_secret: secret } : u));
    setCurrentUser(updated);
    setActiveTab(updated.role === 'admin' ? 'dashboard' : 'pos');
    setWelcomeUser(updated);
    setShowWelcome(true);
    setTimeout(() => setShowWelcome(false), 3500);
    setPendingUser(null);
    setIsTwoFASetupModalOpen(false);
  };

  const handleLogout = () => setCurrentUser(null);

  // ── Profile Update ────────────────────────────────────────────────────────
  const handleUpdateProfile = async (updatedData) => {
    let newPasswordHash = null;
    if (updatedData.password) {
      newPasswordHash = await hashPassword(updatedData.password);
    }
    const updatedUser = {
      ...currentUser,
      name: updatedData.name,
      username: updatedData.username,
      ...(newPasswordHash ? { password: newPasswordHash } : {}),
      ...(updatedData.totp_secret !== undefined ? { totp_secret: updatedData.totp_secret } : {})
    };
    if (isSupabaseConfigured) {
      await updateUserInSupabase(currentUser.id, {
        name: updatedData.name,
        username: updatedData.username,
        ...(updatedData.password ? { password: updatedData.password } : {}),
        ...(updatedData.totp_secret !== undefined ? { totp_secret: updatedData.totp_secret } : {})
      });
    }
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...updatedUser } : u));
    return true;
  };

  // ── Reset Admin Password ────────────────────────────────────────
  const handleResetAdminPassword = async (targetUsername, newPassword) => {
    const targetUser = users.find(u => u.username.toLowerCase() === targetUsername.toLowerCase());
    if (!targetUser) return false;
    const hashedPassword = await hashPassword(newPassword);
    if (isSupabaseConfigured) {
      const ok = await updateUserInSupabase(targetUser.id, { password: newPassword });
      if (!ok) return false;
    }
    setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, password: hashedPassword } : u));
    return true;
  };

  // ── Product CRUD ──────────────────────────────────────────────────────────
  const handleOpenAddProduct = () => { setEditingProduct(null); setIsProductModalOpen(true); };
  const handleOpenEditProduct = (prod) => { setEditingProduct(prod); setIsProductModalOpen(true); };

  const handleSaveProduct = async (productData) => {
    let savedObj = productData;
    if (isSupabaseConfigured) {
      const supaSaved = await saveProductToSupabase({ ...productData, id: editingProduct ? editingProduct.id : undefined });
      if (supaSaved) savedObj = supaSaved;
    }
    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...savedObj } : p));
    } else {
      setProducts(prev => [{ ...savedObj, id: savedObj.id || 'p' + (products.length + 1) }, ...prev]);
    }
    setIsProductModalOpen(false);
  };

  const handleQuickRestock = async (productId, qtyToAdd) => {
    const target = products.find(p => p.id === productId);
    if (!target) return;
    const newStock = Number(target.stock) + qtyToAdd;
    if (isSupabaseConfigured) await saveProductToSupabase({ ...target, stock: newStock });
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product from inventory?')) {
      if (isSupabaseConfigured) await deleteProductFromSupabase(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  // ── POS Sale Checkout ─────────────────────────────────────────────────────
  const handleCompleteSale = async (saleRecord) => {
    if (isSupabaseConfigured) await recordSaleToSupabase(saleRecord);
    setProducts(prev => prev.map(p => {
      const itemSold = saleRecord.items.find(i => i.productId === p.id);
      return itemSold ? { ...p, stock: Math.max(0, Number(p.stock) - itemSold.qty) } : p;
    }));
    setSales(prev => [saleRecord, ...prev]);
    setCompletedSaleRecord(saleRecord);
    setIsReceiptModalOpen(true);
  };

  // ── Staff Management ──────────────────────────────────────────────────────
  const handleAddStaff = async (newStaffUser) => {
    const hashedPassword = await hashPassword(newStaffUser.password || '');
    const userWithHash = { ...newStaffUser, password: hashedPassword };
    if (isSupabaseConfigured) {
      await saveUserToSupabase(userWithHash);
    }
    setUsers(prev => [...prev, userWithHash]);
  };

  const handleDeleteStaff = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete the staff account for "${userName}"?`)) {
      if (isSupabaseConfigured) await deleteUserFromSupabase(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  // ── Reset Demo Data ───────────────────────────────────────────────────────
  const handleResetData = () => {
    if (window.confirm('Reset all data back to demo defaults? (This also clears local cache)')) {
      setUsers(initialUsers);
      setProducts(initialProducts);
      setSales(initialSales);
      localStorage.clear();
      window.location.reload();
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const BlobBg = () => (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden',
      background: 'radial-gradient(circle at 10% 20%, rgba(15,23,42,1) 0%, rgba(10,15,30,1) 100%)'
    }}>
      <div className="blob blob-1" style={{ pointerEvents: 'none' }} />
      <div className="blob blob-2" style={{ pointerEvents: 'none' }} />
      <div className="blob blob-3" style={{ pointerEvents: 'none' }} />
      <div className="blob blob-4" style={{ pointerEvents: 'none' }} />
    </div>
  );

  const WelcomePopup = () => showWelcome && welcomeUser ? (
    <div style={{
      position: 'fixed', top: '32px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, pointerEvents: 'none',
      background: 'linear-gradient(135deg, rgba(16,185,129,0.95) 0%, rgba(6,182,212,0.95) 100%)',
      borderRadius: '20px', padding: '18px 36px',
      boxShadow: '0 20px 60px rgba(16,185,129,0.5), 0 0 0 1px rgba(255,255,255,0.2)',
      backdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center', gap: '14px',
      animation: 'welcomeSlide 0.4s cubic-bezier(0.34,1.56,0.64,1) both'
    }}>
      <span style={{ fontSize: '2rem' }}>{welcomeUser.role === 'admin' ? '🛡️' : '🧑‍💼'}</span>
      <div>
        <p style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', lineHeight: 1.1 }}>
          Welcome back, {welcomeUser.name}!
        </p>
        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>
          Signed in as {welcomeUser.role === 'admin' ? 'Administrator' : 'Staff Member'}
        </p>
      </div>
    </div>
  ) : null;

  if (!currentUser) {
    return (
      <>
        <BlobBg />
        <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
          <Login
            onLoginSuccess={handleLoginSuccess}
            onResetAdminPassword={handleResetAdminPassword}
          />
        </div>
        {/* TOTP modal overlays the login page when 2FA is required */}
        <TOTPInputModal
          isOpen={isTOTPModalOpen}
          onClose={() => { setIsTOTPModalOpen(false); setPendingUser(null); }}
          onVerify={handleTOTPVerify}
          user={pendingUser}
        />
        {/* Mandatory 2FA Setup modal for users without totp_secret */}
        <TwoFASetupModal
          isOpen={isTwoFASetupModalOpen}
          onClose={() => { setIsTwoFASetupModalOpen(false); setPendingUser(null); }}
          onSetupComplete={handleTwoFASetupComplete}
          user={pendingUser}
        />
      </>
    );
  }

  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
  const totalRevenue = sales.reduce((sum, s) => sum + (s.totalRevenue || 0), 0);

  return (
    <div className="app-container">
      <BlobBg />
      <WelcomePopup />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={currentUser.role}
        lowStockCount={lowStockCount}
      />

      <main className="main-content">
        <Navbar
          currentUser={currentUser}
          totalRevenue={totalRevenue}
          onLogout={handleLogout}
          onOpenEditProfile={() => setIsEditProfileModalOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {activeTab === 'dashboard' && (
          <Dashboard
            products={products}
            sales={sales}
            totalRevenue={totalRevenue}
            onNavigate={tab => setActiveTab(tab)}
            currentUser={currentUser}
            onViewReceipt={sale => { setCompletedSaleRecord(sale); setIsReceiptModalOpen(true); }}
          />
        )}
        {activeTab === 'inventory' && (
          <Inventory
            products={products}
            userRole={currentUser.role}
            searchQuery={searchQuery}
            onOpenAddModal={handleOpenAddProduct}
            onOpenEditModal={handleOpenEditProduct}
            onQuickRestock={handleQuickRestock}
            onDeleteProduct={handleDeleteProduct}
          />
        )}
        {activeTab === 'pos' && (
          <PosCheckout
            products={products}
            currentUser={currentUser}
            onCompleteSale={handleCompleteSale}
            searchQuery={searchQuery}
            sales={sales}
            onViewReceipt={sale => { setCompletedSaleRecord(sale); setIsReceiptModalOpen(true); }}
          />
        )}
        {activeTab === 'sales' && (
          <SalesHistory
            sales={sales}
            userRole={currentUser.role}
            currentUser={currentUser}
            onViewReceipt={sale => { setCompletedSaleRecord(sale); setIsReceiptModalOpen(true); }}
          />
        )}
        {activeTab === 'staff' && currentUser.role === 'admin' && (
          <StaffManager
            users={users}
            sales={sales}
            onAddStaff={handleAddStaff}
            onDeleteStaff={handleDeleteStaff}
            currentUser={currentUser}
          />
        )}

        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--border-light)', textAlign: 'center' }}>
          <button
            onClick={handleResetData}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.75rem', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}
          >
            🔄 Reset Demo Data & Clear Cache
          </button>
        </div>
      </main>

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        editingProduct={editingProduct}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        saleRecord={completedSaleRecord}
      />

      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        onUpdateProfile={handleUpdateProfile}
        currentUser={currentUser}
      />
    </div>
  );
}
