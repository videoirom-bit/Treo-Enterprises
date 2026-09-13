export interface ShopSettings {
  shopName: string;
  shopLogo: string;
  tagline: string;
  ownerName: string;
  shopAddress: string;
  city: string;
  state: string;
  pinCode: string;
  phoneNumber: string;
  whatsAppNumber: string;
  emailAddress: string;
  gstin: string;
  panNumber: string;
  businessRegistrationNumber: string;
  websiteName: string;
  openingHours: string;
  upiId: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankBranch: string;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branch?: string;
  };
  invoicePrefix: string;
  invoiceNumberStartingValue: number;
  primaryBrandColor: string; // e.g. "#1e3a8a" or "#0f766e"
  accentColor: string;
  stateCode: string; // Indian state GST code (e.g., '22' for Chhattisgarh or '27' for Maharashtra)
  termsAndConditions: string;
}

export type UserRole = 'super_admin' | 'admin' | 'sales_staff' | 'inventory_staff' | 'accountant';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  active: boolean;
  pin?: string;
  password?: string;
  createdAt?: string;
  avatar?: string;
}

export interface CustomerUser {
  id: string;
  name: string;
  mobile: string;
  email: string;
  whatsapp?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
  companyName?: string;
  totalPurchases: number;
  ordersCount: number;
  outstandingAmount: number;
  lastPurchaseDate?: string;
  createdAt: string;
}

export type StationeryCategory =
  | 'Notebooks'
  | 'Pens'
  | 'Pencils'
  | 'Paper'
  | 'Files & Folders'
  | 'Art & Craft'
  | 'School Supplies'
  | 'Office Supplies'
  | 'Printing Supplies'
  | 'Books'
  | 'Computer Accessories'
  | 'Packaging Materials'
  | 'Gift Items'
  | 'Other'
  | (string & {});

export interface CategoryItem {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  iconName?: string;
  displayOrder?: number;
  isActive?: boolean;
  itemCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryLogEntry {
  id: string;
  date: string;
  type: 'Initial Stock' | 'Purchase Receipt' | 'Stock Adjustment' | 'Sales Deduction' | 'Return / Restock';
  quantity: number;
  unitCost?: number;
  warehouse?: string;
  performedBy: string;
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: StationeryCategory;
  subCategory?: string;
  brand: string;
  unit: string; // 'Piece', 'Box', 'Packet', 'Dozen', 'Kg', 'Gram', 'Litre', 'Meter'
  productType?: string; // 'Standard Product', 'Box / Pack', 'Serialized', 'Batch / Lot', 'Raw Material', 'Service'
  taxType?: 'Inclusive' | 'Exclusive' | 'Exempt';
  purchasePrice: number;
  costPrice?: number;
  sellingPrice: number;
  mrp: number;
  wholesalePrice?: number;
  discountPercentage: number;
  gstRate: number; // 0, 5, 12, 18, 28
  hsnCode: string;
  openingStock: number;
  currentStock: number;
  minimumStock: number;
  maximumStock?: number;
  warehouse?: string;
  warehouseLocation?: string;
  supplierId?: string;
  supplierName?: string;
  status?: 'Active' | 'Inactive';
  description: string;
  specifications?: string[];
  packageContents?: string;
  suitableFor?: string;
  imageUrl: string;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isTodayOffer?: boolean;
  createdAt: string;
  inventoryHistory?: InventoryLogEntry[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  hsnCode: string;
  unit: string;
  rate: number; // selling price per unit
  quantity: number;
  discountPerUnit: number;
  taxableAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGst: number;
  totalAmount: number;
  imageUrl?: string;
}

export type OrderStatus =
  | 'Order Placed'
  | 'Confirmed'
  | 'Processing'
  | 'Packed'
  | 'Ready for Dispatch'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned'
  | 'New'
  | 'Ready'
  | 'Shipped';

export type PaymentMethod =
  | 'Cash'
  | 'UPI'
  | 'Bank Transfer'
  | 'Card'
  | 'Credit'
  | 'Cash on Delivery'
  | 'Online Payment'
  | 'Pay at Shop';

export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Partial' | 'Pending' | 'COD' | 'Refunded';

export type OrderType = 'Home Delivery' | 'Store Pickup';

export interface OrderTrackingEvent {
  id: string;
  orderId: string;
  status: OrderStatus;
  message: string;
  timestamp: string; // ISO format
  location?: string;
  updatedBy?: string; // 'System' | 'Admin' | 'Delivery Staff' | 'Customer'
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionReference?: string;
  timestamp: string;
  notes?: string;
}

export interface DeliveryAssignment {
  id: string;
  orderId: string;
  deliveryPerson: string;
  mobile: string;
  deliveryArea: string;
  assignedDate: string;
  expectedDate?: string;
  deliveryDate?: string;
  status: 'Pending' | 'Picked Up' | 'Out for Delivery' | 'Delivered' | 'Failed';
  notes?: string;
  signature?: string;
  receivedBy?: string;
}

export interface OrderNotification {
  id: string;
  orderId: string;
  orderNumber: string;
  title: string;
  message: string;
  channel: 'WhatsApp' | 'SMS' | 'Email' | 'In-App';
  timestamp: string;
  recipient: string;
  status: 'Sent' | 'Delivered' | 'Pending';
  read?: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  invoiceNumber: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  customer: {
    name: string;
    mobile: string;
    whatsapp?: string;
    email?: string;
    billingAddress: string;
    shippingAddress: string;
    city: string;
    state: string;
    pincode: string;
    gstin?: string;
    companyName?: string;
  };
  orderType: OrderType;
  items: OrderItem[];
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  isInterState: boolean;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  deliveryCharge: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  pendingAmount: number;
  orderStatus: OrderStatus;
  notes?: string;
  assignedDeliveryPerson?: DeliveryAssignment;
  trackingTimeline?: OrderTrackingEvent[];
  paymentHistory?: PaymentRecord[];
  notificationLog?: OrderNotification[];
  driveFileId?: string;
  driveFileUrl?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address: string;
  city?: string;
  state?: string;
  gstin?: string;
  productsSupplied?: string;
  categoriesSupplied?: string[];
  outstandingAmount?: number;
  outstandingBalance?: number;
  createdAt: string;
}

export type ExpenseCategory =
  | 'Rent'
  | 'Electricity'
  | 'Internet'
  | 'Salary'
  | 'Transportation'
  | 'Packaging'
  | 'Maintenance'
  | 'Purchase'
  | 'Other';

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface DailySalesRecord {
  id: string;
  date: string;
  salesTarget: number;
  actualSales: number;
  cashCollected: number;
  upiCollected: number;
  cardSales?: number;
  otherSales?: number;
  creditSales: number;
  expenses: number;
  netAmount: number;
  invoicesCount: number;
  totalDiscounts?: number;
  totalGst?: number;
  refunds?: number;
  netSales?: number;
  notes?: string;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  transactionType: 'stock_in' | 'stock_out' | 'adjustment' | 'initial' | 'order_sale' | 'order_return' | 'damage';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  referenceId?: string;
  createdBy?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface OrderStatusHistoryEntry {
  id: string;
  orderId: string;
  status: string;
  location?: string;
  description?: string;
  updatedBy?: string;
  timestamp: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  customerId?: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionId?: string;
  paymentDate: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
}

