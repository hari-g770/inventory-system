import { createClient } from '@supabase/supabase-js';
import { sanitizeInput } from './sanitize';
import { hashPassword, verifyPassword, isBcryptHash } from './hash';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if credentials are properly filled and non-placeholder
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-anon-key')
);

// Fallback dummy client if credentials aren't set yet to avoid runtime throw
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ============================================================================
// USER / PROFILE HELPERS — Login credentials stored in profiles table
// ============================================================================

/**
 * Fetch all users (admin + staff) from Supabase profiles table
 */
export async function fetchUsersFromSupabase() {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data.map(u => ({
      id: u.id,
      name: u.full_name,
      username: u.username,
      password: u.password,
      role: u.role,
      email: u.email || '',
      avatar: u.avatar_url || '',
      salesTotal: u.sales_total || 0
    }));
  } catch (err) {
    console.warn('Supabase fetch users error:', err.message);
    return null;
  }
}

/**
 * Authenticate user from profiles table (supports both bcrypt hashes & legacy plain-text).
 * Automatically upgrades plain-text passwords to bcrypt on successful login.
 */
export async function loginFromSupabase(username, password) {
  if (!isSupabaseConfigured) return null;
  try {
    const cleanUsername = sanitizeInput(username.toLowerCase().trim());
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', cleanUsername)
      .single();

    if (error || !data) return null;

    // Verify password — works with both bcrypt hash and legacy plain-text
    const isValid = await verifyPassword(password, data.password);
    if (!isValid) return null;

    // Migrate legacy plain-text password to bcrypt hash on first successful login
    if (!isBcryptHash(data.password)) {
      const hashed = await hashPassword(password);
      await supabase.from('profiles').update({ password: hashed }).eq('id', data.id);
    }

    return {
      id: data.id,
      name: data.full_name,
      username: data.username,
      password: data.password,
      role: data.role,
      email: data.email || '',
      avatar: data.avatar_url || '',
      salesTotal: data.sales_total || 0
    };
  } catch (err) {
    console.warn('Supabase login error:', err.message);
    return null;
  }
}


/**
 * Insert or upsert a user profile into Supabase profiles table.
 * Passwords are always stored as bcrypt hashes.
 */
export async function saveUserToSupabase(userData) {
  if (!isSupabaseConfigured) return null;
  try {
    // Hash the password before storage (idempotent — won't double-hash)
    const hashedPassword = await hashPassword(userData.password || '');

    const payload = {
      id: userData.id,
      username: sanitizeInput(userData.username),
      full_name: sanitizeInput(userData.name),
      password: hashedPassword,
      role: sanitizeInput(userData.role),
      email: sanitizeInput(userData.email || ''),
      avatar_url: userData.avatar || ''
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase save user error:', err.message);
    return null;
  }
}

/**
 * Delete a user profile from Supabase by id
 */
export async function deleteUserFromSupabase(userId) {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase delete user error:', err.message);
    return false;
  }
}

/**
 * Update specific fields for a user profile in Supabase.
 * If password is provided, it is hashed before storage.
 */
export async function updateUserInSupabase(userId, fields) {
  if (!isSupabaseConfigured) return false;
  try {
    const payload = {};
    if (fields.name !== undefined) payload.full_name = fields.name;
    if (fields.username !== undefined) payload.username = fields.username;
    if (fields.password !== undefined) {
      // Hash on update (idempotent — won't double-hash a hash)
      payload.password = await hashPassword(fields.password);
    }
    if (fields.email !== undefined) payload.email = fields.email;
    if (fields.avatar !== undefined) payload.avatar_url = fields.avatar;

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase update user error:', err.message);
    return false;
  }
}


// ============================================================================
// PRODUCT HELPERS
// ============================================================================

/**
 * Fetch Products from Supabase PostgreSQL
 */
export async function fetchProductsFromSupabase() {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data.map(p => ({
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
    }));
  } catch (err) {
    console.warn('Supabase fetch products error:', err.message);
    return null;
  }
}

/**
 * Save or Update Product in Supabase
 */
export async function saveProductToSupabase(productData) {
  if (!isSupabaseConfigured) return null;
  try {
    const dbPayload = {
      sku: sanitizeInput(productData.sku),
      name: sanitizeInput(productData.name),
      category: sanitizeInput(productData.category),
      cost_price: sanitizeNumber(productData.costPrice),
      selling_price: sanitizeNumber(productData.sellingPrice),
      stock: sanitizeNumber(productData.stock),
      min_stock: sanitizeNumber(productData.minStock),
      unit: sanitizeInput(productData.unit),
      icon: productData.icon
    };

    if (productData.id && !productData.id.startsWith('p_temp')) {
      const { data, error } = await supabase
        .from('products')
        .update(dbPayload)
        .eq('id', productData.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert(dbPayload)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  } catch (err) {
    console.warn('Supabase save product error:', err.message);
    return null;
  }
}

/**
 * Delete Product in Supabase
 */
export async function deleteProductFromSupabase(productId) {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase delete product error:', err.message);
    return false;
  }
}

// ============================================================================
// SALES HELPERS
// ============================================================================

/**
 * Fetch Sales Transactions from Supabase PostgreSQL
 */
export async function fetchSalesFromSupabase() {
  if (!isSupabaseConfigured) return null;
  try {
    const { data: salesData, error } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return salesData.map(s => ({
      id: s.id,
      date: s.created_at,
      cashierId: s.cashier_id,
      cashierName: s.cashier_name,
      customerName: s.customer_name || 'Walk-in Customer',
      customerPhone: s.customer_phone || '',
      customerAddress: s.customer_address || '',
      subtotal: Number(s.subtotal),
      tax: Number(s.tax),
      gstRate: Number(s.gst_rate ?? (Number(s.tax) > 0 ? 18 : 0)),
      applyGst: s.apply_gst ?? (Number(s.tax) > 0),
      discount: Number(s.discount),
      totalRevenue: Number(s.total_revenue),
      profit: Number(s.profit),
      paymentMethod: s.payment_method,
      items: (s.sale_items || []).map(item => ({
        productId: item.product_id,
        name: item.product_name,
        qty: item.quantity,
        price: Number(item.price),
        cost: Number(item.cost),
        warranty: item.warranty || ''
      }))
    }));
  } catch (err) {
    console.warn('Supabase fetch sales error:', err.message);
    return null;
  }
}

/**
 * Record Sale Checkout & Update Stock in Supabase (with Customer Details & Warranty)
 */
export async function recordSaleToSupabase(saleRecord) {
  if (!isSupabaseConfigured) return false;
  try {
    const cleanCustomerName = sanitizeInput(saleRecord.customerName || 'Walk-in Customer');
    const cleanCustomerPhone = sanitizeInput(saleRecord.customerPhone || '');
    const cleanCustomerAddress = sanitizeInput(saleRecord.customerAddress || '');

    // 1. Try inserting with customer fields
    let salePayload = {
      id: saleRecord.id,
      cashier_id: saleRecord.cashierId,
      cashier_name: saleRecord.cashierName,
      customer_name: cleanCustomerName,
      customer_phone: cleanCustomerPhone,
      customer_address: cleanCustomerAddress,
      subtotal: saleRecord.subtotal,
      tax: saleRecord.tax,
      discount: saleRecord.discount,
      total_revenue: saleRecord.totalRevenue,
      profit: saleRecord.profit,
      payment_method: saleRecord.paymentMethod
    };

    let { error: saleErr } = await supabase.from('sales').insert(salePayload);

    // If customer columns do not exist yet in DB, gracefully fallback to base payload
    if (saleErr && (saleErr.message.includes('column') || saleErr.code === '42703')) {
      console.warn('Sales table missing customer columns, inserting base payload...');
      delete salePayload.customer_name;
      delete salePayload.customer_phone;
      delete salePayload.customer_address;
      const retry = await supabase.from('sales').insert(salePayload);
      saleErr = retry.error;
    }

    if (saleErr) throw saleErr;

    // 2. Insert sale items (with warranty)
    const itemsPayload = saleRecord.items.map(item => ({
      sale_id: saleRecord.id,
      product_id: item.productId,
      product_name: sanitizeInput(item.name),
      quantity: item.qty,
      price: item.price,
      cost: item.cost || 0,
      warranty: sanitizeInput(item.warranty || '')
    }));

    let { error: itemsErr } = await supabase.from('sale_items').insert(itemsPayload);

    // Fallback if warranty column does not exist yet in DB
    if (itemsErr && (itemsErr.message.includes('column') || itemsErr.code === '42703')) {
      const fallbackItems = itemsPayload.map(({ warranty, ...rest }) => rest);
      const retryItems = await supabase.from('sale_items').insert(fallbackItems);
      itemsErr = retryItems.error;
    }

    if (itemsErr) console.warn('Sale items insert notice:', itemsErr.message);

    // 3. Decrement inventory product stock in DB
    for (const item of saleRecord.items) {
      const { data: prod } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.productId)
        .single();

      if (prod) {
        const newStock = Math.max(0, prod.stock - item.qty);
        await supabase.from('products').update({ stock: newStock }).eq('id', item.productId);
      }
    }

    return true;
  } catch (err) {
    console.warn('Supabase record sale error:', err.message);
    return false;
  }
}
