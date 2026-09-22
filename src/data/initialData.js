export const initialUsers = [
  {
    id: 'u1',
    name: 'Alexandra Vance',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    email: 'admin@finefix.io',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    salesTotal: 14250.00
  },
  {
    id: 'u2',
    name: 'Marcus Brody',
    username: 'staff',
    password: 'staff123',
    role: 'staff',
    email: 'marcus@finefix.io',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    salesTotal: 6840.50
  },
  {
    id: 'u3',
    name: 'Elena Rostova',
    username: 'elena',
    password: 'staff123',
    role: 'staff',
    email: 'elena@finefix.io',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    salesTotal: 4920.00
  }
];

export const initialProducts = [
  {
    id: 'p1',
    sku: 'EL-AUDIO-001',
    name: 'Wireless Noise-Canceling Headphones',
    category: 'Electronics',
    costPrice: 1200.00,
    sellingPrice: 2499.99,
    stock: 24,
    minStock: 10,
    unit: 'pcs',
    icon: '🎧',
    color: '#6366f1'
  },
  {
    id: 'p2',
    sku: 'EL-SMART-002',
    name: 'Ultra-Slim Curved Monitor 27"',
    category: 'Electronics',
    costPrice: 12000.00,
    sellingPrice: 18500.50,
    stock: 8,
    minStock: 10,
    unit: 'pcs',
    icon: '🖥️',
    color: '#06b6d4'
  },
  {
    id: 'p3',
    sku: 'AP-HOOD-003',
    name: 'Organic Cotton Premium Hoodie',
    category: 'Apparel',
    costPrice: 650.00,
    sellingPrice: 1499.00,
    stock: 45,
    minStock: 15,
    unit: 'pcs',
    icon: '👕',
    color: '#ec4899'
  },
  {
    id: 'p4',
    sku: 'GR-COFF-004',
    name: 'Artisanal Dark Roast Coffee Beans (1kg)',
    category: 'Groceries',
    costPrice: 450.00,
    sellingPrice: 890.00,
    stock: 60,
    minStock: 20,
    unit: 'bags',
    icon: '☕',
    color: '#8b5cf6'
  },
  {
    id: 'p5',
    sku: 'AC-WATCH-005',
    name: 'Titanium Smartwatch Series X',
    category: 'Accessories',
    costPrice: 8500.00,
    sellingPrice: 14999.00,
    stock: 3,
    minStock: 8,
    unit: 'pcs',
    icon: '⌚',
    color: '#f59e0b'
  },
  {
    id: 'p6',
    sku: 'HM-LAMP-006',
    name: 'Minimalist RGB Ambient Desk Lamp',
    category: 'Home & Living',
    costPrice: 800.00,
    sellingPrice: 1899.00,
    stock: 18,
    minStock: 5,
    unit: 'pcs',
    icon: '💡',
    color: '#10b981'
  }
];

export const initialSales = [
  {
    id: 'TRX-9041',
    date: '2026-08-09T14:32:00',
    cashierName: 'Marcus Brody',
    cashierId: 'u2',
    customerName: 'Rahul Sharma',
    customerPhone: '9876543210',
    customerAddress: 'Flat 402, Green Glen Layout, Bangalore',
    items: [
      { productId: 'p1', name: 'Wireless Noise-Canceling Headphones', qty: 2, price: 2499.99, warranty: '1 Year Brand' },
      { productId: 'p4', name: 'Artisanal Dark Roast Coffee Beans (1kg)', qty: 1, price: 890.00, warranty: 'No Warranty' }
    ],
    subtotal: 5889.98,
    tax: 1060.19,
    gstRate: 18,
    applyGst: true,
    discount: 200.00,
    totalRevenue: 6750.17,
    profit: 3189.98,
    paymentMethod: 'UPI / QR Code'
  },
  {
    id: 'TRX-9042',
    date: '2026-08-09T16:45:00',
    cashierName: 'Alexandra Vance',
    cashierId: 'u1',
    customerName: 'Priya Patel',
    customerPhone: '9123456780',
    customerAddress: '12th Cross, Indiranagar, Bangalore',
    items: [
      { productId: 'p2', name: 'Ultra-Slim Curved Monitor 27"', qty: 1, price: 18500.50, warranty: '3 Years Replacement' }
    ],
    subtotal: 18500.50,
    tax: 3330.09,
    gstRate: 18,
    applyGst: true,
    discount: 500.00,
    totalRevenue: 21330.59,
    profit: 6500.50,
    paymentMethod: 'Credit/Debit Card'
  },
  {
    id: 'TRX-9038',
    date: '2026-08-05T11:15:00',
    cashierName: 'Elena Rostova',
    cashierId: 'u3',
    customerName: 'Rahul Sharma',
    customerPhone: '9876543210',
    customerAddress: 'Flat 402, Green Glen Layout, Bangalore',
    items: [
      { productId: 'p5', name: 'Titanium Smartwatch Series X', qty: 1, price: 14999.00, warranty: '2 Years Comprehensive' }
    ],
    subtotal: 14999.00,
    tax: 2699.82,
    gstRate: 18,
    applyGst: true,
    discount: 1000.00,
    totalRevenue: 16698.82,
    profit: 5499.00,
    paymentMethod: 'UPI / QR Code'
  }
];

export const revenueTrendsData = [
  { day: 'Mon', revenue: 14200, orders: 12 },
  { day: 'Tue', revenue: 21500, orders: 18 },
  { day: 'Wed', revenue: 18900, orders: 15 },
  { day: 'Thu', revenue: 28400, orders: 24 },
  { day: 'Fri', revenue: 36000, orders: 31 },
  { day: 'Sat', revenue: 42100, orders: 38 },
  { day: 'Sun', revenue: 31000, orders: 27 },
];
