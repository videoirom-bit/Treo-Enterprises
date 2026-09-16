import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Building2,
  TrendingDown,
  CalendarCheck,
  FileBarChart,
  Settings,
  Shield,
  LogOut,
  Plus,
  Search,
  CloudUpload,
  RotateCcw,
  Printer,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Barcode,
  Upload,
  X,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  UserCheck,
  Truck,
  Phone,
  MessageCircle,
  Send,
  Navigation,
  Eye,
  Database,
  CreditCard,
  Wallet,
  Calendar,
  TrendingUp,
  Coins,
  DollarSign,
  Clock,
  Store,
  Globe,
  Palette,
  MapPin,
  RotateCw,
  Undo2,
  CheckCircle2,
  Building,
  Receipt,
  QrCode,
  Check,
  ChevronLeft,
  ChevronRight,
  Key,
} from 'lucide-react';
import { formatINR } from '../utils/gstUtils';
import { uploadReportToDrive } from '../services/driveService';
import { googleSignIn, getAccessToken } from '../services/firebaseAuth';
import { StationeryCategory, Product, UserRole, ShopSettings } from '../types';
import { initialShopSettings } from '../data/sampleData';
import { generateProductsCSV, downloadCSVFile } from '../utils/csvUtils';
import { LowStockWidget } from '../components/LowStockWidget';
import { ProductBarcodeModal } from '../components/ProductBarcodeModal';
import { StaffManagementTab } from '../components/StaffManagementTab';
import { AddInventoryView } from '../components/AddInventoryView';
import { SuperAdminCredentialsModal } from '../components/SuperAdminCredentialsModal';

const INDIAN_STATES_GST = [
  { code: '01', name: 'Jammu and Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
];

const PRESET_LOGOS = [
  {
    label: 'Treo Official Logo',
    url: '/treo-logo.svg',
  },
  {
    label: 'Stationery Pen & Book',
    url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=200&h=200&q=80',
  },
  {
    label: 'Notebooks Stack',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&h=200&q=80',
  },
  {
    label: 'Office Tools Desk',
    url: 'https://images.unsplash.com/photo-1585336261026-77884d5dfd3e?auto=format&fit=crop&w=200&h=200&q=80',
  },
  {
    label: 'Art & Color Supplies',
    url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=200&h=200&q=80',
  },
];

const PRESET_THEMES = [
  { name: 'Teal & Amber (Default)', primary: '#0f766e', accent: '#f59e0b' },
  { name: 'Royal Blue & Emerald', primary: '#1e40af', accent: '#059669' },
  { name: 'Indigo & Coral', primary: '#4338ca', accent: '#f43f5e' },
  { name: 'Dark Slate & Amber', primary: '#1e293b', accent: '#d97706' },
];

const getNormalizedShopForm = (s?: Partial<ShopSettings>): ShopSettings => {
  const bankName = s?.bankName || s?.bankDetails?.bankName || 'HDFC Bank Ltd';
  const bankAccountNumber = s?.bankAccountNumber || s?.bankDetails?.accountNumber || '50200012345678';
  const bankIfsc = s?.bankIfsc || s?.bankDetails?.ifscCode || 'HDFC0001234';
  const bankBranch = s?.bankBranch || s?.bankDetails?.branch || 'Main Station Road, Raipur';

  return {
    shopName: s?.shopName ?? 'ABC Paper & Stationery',
    shopLogo: s?.shopLogo ?? '/treo-logo.svg',
    tagline: s?.tagline ?? 'Order Tracking, GST Invoicing & Premium Stationery',
    ownerName: s?.ownerName ?? 'Mr. Anand Agrawal',
    shopAddress: s?.shopAddress ?? 'Shop No. 12-14, Ground Floor, Sharda Complex, Pandri Market',
    city: s?.city ?? 'Raipur',
    state: s?.state ?? 'Chhattisgarh',
    pinCode: s?.pinCode ?? '492004',
    phoneNumber: s?.phoneNumber ?? '+91 98271 23456',
    whatsAppNumber: s?.whatsAppNumber ?? '+91 98271 23456',
    emailAddress: s?.emailAddress ?? 'contact@abcpapers.com',
    gstin: s?.gstin ?? '22AABCA1234F1Z9',
    panNumber: s?.panNumber ?? 'AABCA1234F',
    businessRegistrationNumber: s?.businessRegistrationNumber ?? 'UDYAM-CG-03-0012345',
    websiteName: s?.websiteName ?? 'abcpapers.com',
    openingHours: s?.openingHours ?? 'Mon - Sat: 9:00 AM – 9:30 PM | Sunday: 10:00 AM – 2:00 PM',
    upiId: s?.upiId ?? 'abcpaper@okhdfcbank',
    bankName,
    bankAccountNumber,
    bankIfsc,
    bankBranch,
    bankDetails: {
      bankName,
      accountNumber: bankAccountNumber,
      ifscCode: bankIfsc,
      branch: bankBranch,
    },
    invoicePrefix: s?.invoicePrefix ?? 'ABC/26-27/',
    invoiceNumberStartingValue: Number(s?.invoiceNumberStartingValue ?? 1001),
    primaryBrandColor: s?.primaryBrandColor ?? '#0f766e',
    accentColor: s?.accentColor ?? '#f59e0b',
    stateCode: s?.stateCode ?? '22',
    termsAndConditions: s?.termsAndConditions ?? '1. Goods once sold will be replaced within 3 days if defective in original packaging.\n2. Warranty on electronics/calculators subject to manufacturer terms.\n3. Please quote invoice number for queries.',
  };
};

export const AdminDashboardView: React.FC = () => {
  const {
    shopSettings,
    updateShopSettings,
    resetShopSettingsToDefault,
    refreshShopSettingsFromSupabase,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    orders,
    updateOrderStatus,
    updatePaymentStatus,
    assignDeliveryPerson,
    sendOrderNotification,
    setSearchTrackingId,
    customers,
    addCustomer,
    suppliers,
    addSupplier,
    expenses,
    addExpense,
    dailyRecords,
    saveDailyTask,
    staffUsers,
    currentAdminUser,
    isAdminLoggedIn,
    setIsAdminLoggedIn,
    logoutAdmin,
    currentUserRole,
    setCurrentUserRole,
    setActiveView,
    setSelectedOrderForInvoice,
    resetDemoData,
    showToast,
    isSupabaseConnected,
    isSupabaseSyncing,
    syncWithSupabase,
    categories,
    seedCategoriesToSupabaseDatabase,
    supabaseProjectId,
  } = useApp();

  // Active Admin Section
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'inventory'
    | 'add-inventory'
    | 'orders'
    | 'customers'
    | 'suppliers'
    | 'expenses'
    | 'daily'
    | 'reports'
    | 'staff'
    | 'settings'
  >('overview');

  // Sub-view inside inventory module ('list' or 'add')
  const [inventorySubView, setInventorySubView] = useState<'list' | 'add'>('list');

  // Filter and Modal States
  const [productSearch, setProductSearch] = useState('');
  const [inventoryStockFilter, setInventoryStockFilter] = useState<'all' | 'low-stock'>('all');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [barcodeModalProduct, setBarcodeModalProduct] = useState<Product | null>(null);
  const [productFormError, setProductFormError] = useState<string | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [imageUploadMode, setImageUploadMode] = useState<'upload' | 'url'>('upload');
  const [showSuperAdminCredentialsModal, setShowSuperAdminCredentialsModal] = useState(false);

  // Order Management & Real-Time Tracking States
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<string>('all');
  const [assignRiderOrder, setAssignRiderOrder] = useState<any | null>(null);
  const [riderForm, setRiderForm] = useState({
    deliveryPerson: 'Ramesh Sahu',
    mobile: '+91 98765 43210',
    deliveryArea: 'Civil Lines / Pandri',
    vehicleDetails: 'Hero Splendor Plus (CG-04-AB-1294)',
  });
  const [notificationModalOrder, setNotificationModalOrder] = useState<any | null>(null);
  const [notificationChannel, setNotificationChannel] = useState<'WhatsApp' | 'SMS' | 'Both'>('WhatsApp');
  const [notificationMessage, setNotificationMessage] = useState('');

  // Category fallback images for stationery products
  const CATEGORY_DEFAULT_IMAGES: Record<StationeryCategory, string> = {
    Paper: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80',
    Notebooks: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=600&q=80',
    Pens: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80',
    Pencils: 'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?auto=format&fit=crop&w=600&q=80',
    'Files & Folders': 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
    'Office Supplies': 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&w=600&q=80',
    'School Supplies': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80',
    'Art & Craft': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80',
    'Printing Supplies': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    Books: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
    'Computer Accessories': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80',
    'Packaging Materials': 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
    'Gift Items': 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
    Other: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80',
  };

  // Product form data state with full support for required schema
  const [newProductData, setNewProductData] = useState({
    name: '',
    category: 'Paper' as StationeryCategory,
    subCategory: '',
    brand: '',
    sku: '',
    barcode: '',
    hsnCode: '4802',
    purchasePrice: '' as string | number,
    costPrice: '' as string | number,
    mrp: '' as string | number,
    sellingPrice: '' as string | number,
    gstRate: 12,
    openingStock: '' as string | number,
    currentStock: '' as string | number,
    minimumStock: 10 as string | number,
    unit: 'Piece',
    supplierId: '',
    supplierName: '',
    status: 'Active' as 'Active' | 'Inactive',
    imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80',
    description: '',
    isBestSeller: false,
    isTodayOffer: false,
  });

  // Settings form with safe defaults for bank details & branding
  const [settingsForm, setSettingsForm] = useState<ShopSettings>(() => getNormalizedShopForm(shopSettings));
  const [isSavingShopSettings, setIsSavingShopSettings] = useState(false);
  const [isResettingShopSettings, setIsResettingShopSettings] = useState(false);
  const [isRefreshingShopSettings, setIsRefreshingShopSettings] = useState(false);
  const [shopSettingsNotice, setShopSettingsNotice] = useState<string | null>(null);
  const [activeSettingsSection, setActiveSettingsSection] = useState<'all' | 'identity' | 'contact' | 'tax' | 'bank' | 'razorpay' | 'invoicing'>('all');
  const [razorpayGatewayStatus, setRazorpayGatewayStatus] = useState<any>(null);
  const [isTestingGateway, setIsTestingGateway] = useState(false);

  const checkRazorpayGatewayStatus = async () => {
    setIsTestingGateway(true);
    try {
      const res = await fetch('/api/payment/razorpay/config');
      const data = await res.json();
      setRazorpayGatewayStatus(data);
      if (data.isConfigured) {
        showToast(`Razorpay Gateway Active (${data.mode.toUpperCase()} mode). Key: ${data.keyId}`);
      } else {
        showToast('Razorpay Gateway running in Sandbox Test Simulator.');
      }
    } catch (err: any) {
      setRazorpayGatewayStatus({ isConfigured: false, error: err.message });
      showToast('Could not reach Razorpay backend server.');
    } finally {
      setIsTestingGateway(false);
    }
  };

  useEffect(() => {
    if (shopSettings) {
      setSettingsForm(getNormalizedShopForm(shopSettings));
    }
  }, [shopSettings]);

  useEffect(() => {
    fetch('/api/payment/razorpay/config')
      .then((res) => res.json())
      .then((data) => setRazorpayGatewayStatus(data))
      .catch(() => {});
  }, []);

  // New Expense form
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<'Rent' | 'Electricity' | 'Salary' | 'Tea & Snacks' | 'Packaging' | 'Transport' | 'Other'>('Tea & Snacks');

  // Daily task form
  const [dailyNotes, setDailyNotes] = useState('');
  const [dailyPhysicalCash, setDailyPhysicalCash] = useState('');

  // Analytics & Date Range Filtering
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Horizontal scroll controls & drag-to-scroll for Admin Module Navigation Tabs
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollTabsLeft, setCanScrollTabsLeft] = useState(false);
  const [canScrollTabsRight, setCanScrollTabsRight] = useState(true);
  const [isDraggingTabs, setIsDraggingTabs] = useState(false);
  const [tabDragStartX, setTabDragStartX] = useState(0);
  const [tabScrollLeftStart, setTabScrollLeftStart] = useState(0);

  const checkTabsScroll = () => {
    if (tabsScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsScrollRef.current;
      setCanScrollTabsLeft(scrollLeft > 6);
      setCanScrollTabsRight(scrollLeft < scrollWidth - clientWidth - 6);
    }
  };

  useEffect(() => {
    checkTabsScroll();
    const el = tabsScrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkTabsScroll, { passive: true });
      window.addEventListener('resize', checkTabsScroll);
      return () => {
        el.removeEventListener('scroll', checkTabsScroll);
        window.removeEventListener('resize', checkTabsScroll);
      };
    }
  }, []);

  const handleScrollTabs = (direction: 'left' | 'right') => {
    if (tabsScrollRef.current) {
      const delta = direction === 'left' ? -260 : 260;
      tabsScrollRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  const handleTabMouseDown = (e: React.MouseEvent) => {
    if (!tabsScrollRef.current) return;
    setIsDraggingTabs(true);
    setTabDragStartX(e.pageX - tabsScrollRef.current.offsetLeft);
    setTabScrollLeftStart(tabsScrollRef.current.scrollLeft);
  };

  const handleTabMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingTabs || !tabsScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - tabsScrollRef.current.offsetLeft;
    const distance = (x - tabDragStartX) * 1.5;
    tabsScrollRef.current.scrollLeft = tabScrollLeftStart - distance;
  };

  const handleTabMouseUpOrLeave = () => {
    setIsDraggingTabs(false);
  };

  // Calculate High-level Dashboard Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalTaxCollected = orders.reduce((sum, o) => sum + o.totalTax, 0);
  const totalOrdersCount = orders.length;
  const lowStockProducts = products.filter((p) => p.currentStock <= p.minimumStock);
  const outOfStockCount = products.filter((p) => p.currentStock <= 0).length;
  const totalInventoryValuation = products.reduce(
    (sum, p) => sum + (p.costPrice ?? p.purchasePrice ?? 0) * p.currentStock,
    0
  );
  const totalInventoryRetailValuation = products.reduce(
    (sum, p) => sum + (p.sellingPrice || 0) * p.currentStock,
    0
  );

  const todayStr = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const filteredAnalyticsOrders = orders.filter((o) => {
    const oDate = (o.orderDate || '').slice(0, 10);
    if (analyticsPeriod === 'today') return oDate === todayStr;
    if (analyticsPeriod === 'week') return oDate >= sevenDaysAgo;
    if (analyticsPeriod === 'month') return oDate >= thirtyDaysAgo;
    if (analyticsPeriod === 'custom') {
      if (customStartDate && oDate < customStartDate) return false;
      if (customEndDate && oDate > customEndDate) return false;
      return true;
    }
    return true;
  });

  const filteredAnalyticsExpenses = expenses.filter((e) => {
    const eDate = (e.date || '').slice(0, 10);
    if (analyticsPeriod === 'today') return eDate === todayStr;
    if (analyticsPeriod === 'week') return eDate >= sevenDaysAgo;
    if (analyticsPeriod === 'month') return eDate >= thirtyDaysAgo;
    if (analyticsPeriod === 'custom') {
      if (customStartDate && eDate < customStartDate) return false;
      if (customEndDate && eDate > customEndDate) return false;
      return true;
    }
    return true;
  });

  const todayOrders = orders.filter((o) => (o.orderDate || '').slice(0, 10) === todayStr);
  const todaySales = todayOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const todayOrdersCount = todayOrders.length;

  const periodRevenue = filteredAnalyticsOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const periodTax = filteredAnalyticsOrders.reduce((sum, o) => sum + o.totalTax, 0);
  const periodExpenses = filteredAnalyticsExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Pending payments from orders
  const pendingPaymentsAmount = orders.reduce(
    (sum, o) => sum + (o.pendingAmount || (o.paymentStatus === 'Pending' ? o.grandTotal : 0)),
    0
  );

  // Outstanding from customers
  const totalCustomerOutstanding = customers.reduce((sum, c) => sum + (c.outstandingAmount || 0), 0);

  // Net Profit Estimate = periodRevenue - periodExpenses - estimated COGS
  const periodEstimatedCost = filteredAnalyticsOrders.reduce((sum, o) => {
    return (
      sum +
      (o.items || []).reduce((iSum, item) => {
        const prod = products.find((p) => p.id === item.productId);
        const cost = prod?.costPrice || prod?.purchasePrice || (item.rate || 0) * 0.7;
        return iSum + cost * (item.quantity || 1);
      }, 0)
    );
  }, 0);
  const periodNetProfit = periodRevenue - periodExpenses - periodEstimatedCost;

  // Sales by payment method
  const salesByPayment = filteredAnalyticsOrders.reduce((acc, o) => {
    const method = o.paymentMethod || 'Cash';
    acc[method] = (acc[method] || 0) + (o.grandTotal || 0);
    return acc;
  }, {} as Record<string, number>);

  // Sales by Category
  const salesByCategory = filteredAnalyticsOrders.reduce((acc, o) => {
    (o.items || []).forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const cat = prod?.category || 'Paper';
      acc[cat] = (acc[cat] || 0) + (item.rate || 0) * (item.quantity || 1);
    });
    return acc;
  }, {} as Record<string, number>);

  // Order status breakdown
  const orderStatusCounts = filteredAnalyticsOrders.reduce((acc, o) => {
    const st = o.orderStatus || 'Pending';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Top selling products
  const productSalesMap = filteredAnalyticsOrders.reduce((acc, o) => {
    (o.items || []).forEach((item) => {
      if (item && item.productId) {
        acc[item.productId] = (acc[item.productId] || 0) + (item.quantity || 1);
      }
    });
    return acc;
  }, {} as Record<string, number>);
  const topSellingProducts = (Object.entries(productSalesMap) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pId, qty]) => {
      const prod = products.find((p) => p.id === pId);
      return {
        product: prod,
        qty,
        name: prod?.name || 'Stationery Item',
        revenue: (prod?.sellingPrice || 50) * qty,
      };
    });

  // Top Customers
  const topCustomers = [...customers]
    .sort((a, b) => Number(b.totalPurchases || 0) - Number(a.totalPurchases || 0))
    .slice(0, 5);

  // Backup to Google Drive handler
  const handleExportDriveReport = async (reportName: string, csvData: string) => {
    try {
      showToast('Preparing report for Google Drive export...');
      let token = await getAccessToken();
      if (!token) {
        const res = await googleSignIn();
        token = res?.accessToken || null;
      }
      if (!token) {
        showToast('Google authorization was cancelled.');
        return;
      }
      const res = await uploadReportToDrive(reportName, csvData, 'text/csv');
      showToast(`Exported ${res.name} to Google Drive!`);
    } catch (err: any) {
      showToast(err.message || 'Could not export to Drive.');
    }
  };

  const handleDownloadProductsCSV = () => {
    if (!products || products.length === 0) {
      showToast('No products available to export.');
      return;
    }

    const q = productSearch.trim().toLowerCase();
    let targetProducts = products;

    if (inventoryStockFilter === 'low-stock') {
      targetProducts = targetProducts.filter((p) => p.currentStock <= p.minimumStock);
    }

    if (q) {
      targetProducts = targetProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }

    if (targetProducts.length === 0) {
      showToast('No matching products found to export.');
      return;
    }

    const csvData = generateProductsCSV(targetProducts);
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName =
      inventoryStockFilter === 'low-stock'
        ? `Low_Stock_Products_${dateStr}.csv`
        : `Product_Catalog_${dateStr}.csv`;

    downloadCSVFile(csvData, fileName);
    showToast(`Exported ${targetProducts.length} product${targetProducts.length === 1 ? '' : 's'} to CSV.`);
  };

  // Open Add Product / Inventory View with Super Admin controls
  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductFormError(null);
    setInventorySubView('add');
    setActiveTab('inventory');
    setIsAddProductOpen(false);
  };

  // Open Edit Product / Inventory View pre-populated with selected product
  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setProductFormError(null);
    setInventorySubView('add');
    setActiveTab('inventory');
    setIsAddProductOpen(false);
  };

  // Handle local image file upload (< 2MB) into base64 data URL
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setProductFormError('Selected image is larger than 2MB. Please choose an image file under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewProductData((prev) => ({ ...prev, imageUrl: reader.result as string }));
        setProductFormError(null);
      }
    };
    reader.onerror = () => {
      setProductFormError('Failed to read image file. Please try another image or enter an Image URL.');
    };
    reader.readAsDataURL(file);
  };

  const handleQuickRestock = (productId: string, additionalStock: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const newStock = Math.max(0, prod.currentStock + additionalStock);
    updateProduct(productId, { currentStock: newStock });
    showToast(`Restocked ${prod.name}: +${additionalStock} ${prod.unit} (Current: ${newStock})`);
  };

  const handleDownloadLowStockCSV = () => {
    if (lowStockProducts.length === 0) {
      showToast('No low stock products to export.');
      return;
    }
    const csvData = generateProductsCSV(lowStockProducts);
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `Low_Stock_Replenishment_${dateStr}.csv`;
    downloadCSVFile(csvData, fileName);
    showToast(`Exported ${lowStockProducts.length} low stock items to CSV.`);
  };

  const handleNavigateToInventory = (
    searchQuery?: string,
    filterMode: 'all' | 'low-stock' = 'all'
  ) => {
    if (searchQuery) {
      setProductSearch(searchQuery);
    }
    setInventoryStockFilter(filterMode);
    setActiveTab('inventory');
  };

  // Submit and save product with comprehensive validation and double-submission protection
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingProduct) return;

    // 1. Validate Product Name
    const trimmedName = newProductData.name.trim();
    if (!trimmedName) {
      setProductFormError('Product name is required.');
      return;
    }

    // 2. Validate SKU / Product Code
    const trimmedSku = newProductData.sku.trim();
    if (!trimmedSku) {
      setProductFormError('Product SKU / Code is required.');
      return;
    }

    // Validate duplicate SKU in existing database
    const duplicateProduct = products.find(
      (p) =>
        p.sku.trim().toLowerCase() === trimmedSku.toLowerCase() &&
        (!editingProduct || p.id !== editingProduct.id)
    );
    if (duplicateProduct) {
      setProductFormError(
        `SKU "${trimmedSku}" is already in use by "${duplicateProduct.name}". Please use a unique SKU code.`
      );
      return;
    }

    // 3. Validate Pricing (Purchase Price, Selling Price, MRP)
    const purchaseVal = parseFloat(String(newProductData.purchasePrice));
    const sellingVal = parseFloat(String(newProductData.sellingPrice));
    const mrpVal = parseFloat(String(newProductData.mrp));

    if (isNaN(purchaseVal) || purchaseVal < 0) {
      setProductFormError('Please enter a valid Purchase Price (Cost) of 0 or greater.');
      return;
    }
    if (isNaN(sellingVal) || sellingVal < 0) {
      setProductFormError('Please enter a valid Selling Price of 0 or greater.');
      return;
    }
    if (isNaN(mrpVal) || mrpVal < 0) {
      setProductFormError('Please enter a valid Maximum Retail Price (MRP) of 0 or greater.');
      return;
    }
    if (sellingVal > mrpVal) {
      setProductFormError(
        `Selling price (₹${sellingVal}) cannot exceed MRP (₹${mrpVal}). Please adjust either selling price or MRP.`
      );
      return;
    }

    // 4. Validate Stock Quantities
    const currentStockNum =
      newProductData.currentStock === '' ? 0 : parseInt(String(newProductData.currentStock), 10);
    const openingStockNum =
      newProductData.openingStock === '' ? currentStockNum : parseInt(String(newProductData.openingStock), 10);
    const minStockNum =
      newProductData.minimumStock === '' ? 5 : parseInt(String(newProductData.minimumStock), 10);

    if (isNaN(currentStockNum) || currentStockNum < 0) {
      setProductFormError('Current stock quantity must be 0 or a positive number.');
      return;
    }
    if (isNaN(openingStockNum) || openingStockNum < 0) {
      setProductFormError('Opening stock quantity must be 0 or a positive number.');
      return;
    }
    if (isNaN(minStockNum) || minStockNum < 0) {
      setProductFormError('Minimum stock threshold must be 0 or a positive number.');
      return;
    }

    // 5. Validate Unit
    const trimmedUnit = newProductData.unit.trim();
    if (!trimmedUnit) {
      setProductFormError('Unit of measurement is required (e.g., Piece, Ream, Box, Packet).');
      return;
    }

    // 6. Barcode fallback
    const barcodeVal =
      newProductData.barcode.trim() || `890${Date.now().toString().slice(-8)}`;

    // 7. Supplier resolution
    let resolvedSupplierName = newProductData.supplierName;
    if (newProductData.supplierId) {
      const matchSupplier = suppliers.find((s) => s.id === newProductData.supplierId);
      if (matchSupplier) {
        resolvedSupplierName = matchSupplier.name;
      }
    } else {
      resolvedSupplierName = '';
    }

    // Calculate discount percentage
    const discount =
      mrpVal > sellingVal
        ? Math.round(((mrpVal - sellingVal) / mrpVal) * 100 * 10) / 10
        : 0;

    // Image fallback
    const finalImage =
      newProductData.imageUrl.trim() ||
      CATEGORY_DEFAULT_IMAGES[newProductData.category] ||
      CATEGORY_DEFAULT_IMAGES.Other;

    setIsSavingProduct(true);
    setProductFormError(null);

    try {
      // Artificial micro-delay for smooth UI feedback and double-submission prevention
      await new Promise((resolve) => setTimeout(resolve, 250));

      if (editingProduct) {
        updateProduct(editingProduct.id, {
          name: trimmedName,
          sku: trimmedSku,
          barcode: barcodeVal,
          category: newProductData.category,
          subCategory: newProductData.subCategory.trim(),
          brand: newProductData.brand.trim() || 'ABC Stationery',
          description: newProductData.description.trim() || `${trimmedName} - Premium stationery product.`,
          imageUrl: finalImage,
          unit: trimmedUnit,
          purchasePrice: purchaseVal,
          costPrice: purchaseVal, // Synchronize costPrice and purchasePrice
          sellingPrice: sellingVal,
          mrp: mrpVal,
          discountPercentage: discount,
          gstRate: Number(newProductData.gstRate),
          hsnCode: newProductData.hsnCode.trim() || '4802',
          openingStock: openingStockNum,
          currentStock: currentStockNum,
          minimumStock: minStockNum,
          supplierId: newProductData.supplierId || undefined,
          supplierName: resolvedSupplierName || undefined,
          status: newProductData.status,
          isBestSeller: newProductData.isBestSeller,
          isTodayOffer: newProductData.isTodayOffer,
        });
        showToast(`Product "${trimmedName}" updated successfully.`);
      } else {
        const createdProduct = addProduct({
          name: trimmedName,
          sku: trimmedSku,
          barcode: barcodeVal,
          category: newProductData.category,
          subCategory: newProductData.subCategory.trim(),
          brand: newProductData.brand.trim() || 'ABC Stationery',
          description: newProductData.description.trim() || `${trimmedName} - Quality stationery item.`,
          imageUrl: finalImage,
          unit: trimmedUnit,
          purchasePrice: purchaseVal,
          costPrice: purchaseVal, // Explicitly set purchasePrice as costPrice
          sellingPrice: sellingVal,
          mrp: mrpVal,
          discountPercentage: discount,
          gstRate: Number(newProductData.gstRate),
          hsnCode: newProductData.hsnCode.trim() || '4802',
          openingStock: openingStockNum,
          currentStock: currentStockNum,
          minimumStock: minStockNum,
          supplierId: newProductData.supplierId || undefined,
          supplierName: resolvedSupplierName || undefined,
          status: newProductData.status,
          isBestSeller: newProductData.isBestSeller,
          isTodayOffer: newProductData.isTodayOffer,
        });
        showToast(`Product "${createdProduct.name}" added to inventory.`);
        // Reset inventory filters so new product is immediately visible
        setProductSearch('');
        setInventoryStockFilter('all');
        setActiveTab('inventory');
      }

      setIsAddProductOpen(false);
      setEditingProduct(null);
    } catch (err: any) {
      console.error('Failed to save product:', err);
      // Preserve entered form data and display error message
      setProductFormError(
        err?.message || 'Failed to save product to storage. Please verify the form inputs and try again.'
      );
    } finally {
      setIsSavingProduct(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 space-y-3 sm:space-y-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:pb-16 overflow-x-hidden">
      {/* Top Admin Navigation Header */}
      <div className="w-full max-w-full overflow-hidden bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 sm:gap-4 shadow-xl">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-teal-600 flex items-center justify-center font-bold text-lg sm:text-xl shadow-md shrink-0">
            {currentAdminUser?.avatar ? (
              <img
                src={currentAdminUser.avatar}
                alt={currentAdminUser.name}
                className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
              />
            ) : (
              <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl font-extrabold tracking-tight truncate">
                {shopSettings.shopName}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold border border-teal-400/30 uppercase shrink-0">
                {currentUserRole.replace('_', ' ')}
              </span>
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 mt-0.5 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 flex-wrap">
              <span className="truncate">
                User: <strong className="font-semibold text-slate-200">{currentAdminUser?.name || 'Administrator'}</strong>
              </span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span className="truncate">
                GSTIN: <span className="font-mono text-amber-300 font-semibold">{shopSettings.gstin}</span>
              </span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <button
                onClick={() => syncWithSupabase()}
                disabled={isSupabaseSyncing}
                title="Supabase Cloud Database - Click to re-sync"
                className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConnected ? 'bg-emerald-400' : 'bg-amber-400'} ${isSupabaseSyncing ? 'animate-ping' : 'animate-pulse'}`} />
                <span className="font-medium">
                  {isSupabaseSyncing ? 'Syncing Supabase...' : isSupabaseConnected ? 'Supabase Connected' : 'Supabase Offline'}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto pt-2 md:pt-0 border-t border-slate-800 md:border-t-0">
          {/* Quick view store */}
          <button
            onClick={() => setActiveView('home')}
            className="flex-1 md:flex-initial min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-xs font-semibold text-slate-200 flex items-center justify-center text-center transition cursor-pointer touch-manipulation"
          >
            <span>Storefront</span>
          </button>

          {/* Reset Demo Data Button */}
          <button
            onClick={resetDemoData}
            title="Reset to fresh demo dataset"
            className="flex-1 md:flex-initial min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-xs font-semibold text-amber-400 flex items-center justify-center gap-1.5 transition cursor-pointer touch-manipulation"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Admin Module Navigation Tabs - Enhanced Horizontal Scroll with Arrows, Wheel, and Drag-to-Scroll */}
      <div className="relative w-full max-w-full group">
        {/* Left Scroll Arrow */}
        {canScrollTabsLeft && (
          <button
            type="button"
            onClick={() => handleScrollTabs('left')}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 dark:bg-slate-800/95 shadow-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-teal-50 dark:hover:bg-slate-700 hover:text-teal-600 dark:hover:text-teal-400 transition cursor-pointer"
            aria-label="Scroll tabs left"
            title="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Right Scroll Arrow */}
        {canScrollTabsRight && (
          <button
            type="button"
            onClick={() => handleScrollTabs('right')}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 dark:bg-slate-800/95 shadow-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-teal-50 dark:hover:bg-slate-700 hover:text-teal-600 dark:hover:text-teal-400 transition cursor-pointer"
            aria-label="Scroll tabs right"
            title="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Scroll Container */}
        <div
          ref={tabsScrollRef}
          onWheel={(e) => {
            if (tabsScrollRef.current && e.deltaY !== 0) {
              tabsScrollRef.current.scrollBy({
                left: e.deltaY > 0 ? 140 : -140,
                behavior: 'smooth',
              });
            }
          }}
          onMouseDown={handleTabMouseDown}
          onMouseMove={handleTabMouseMove}
          onMouseUp={handleTabMouseUpOrLeave}
          onMouseLeave={handleTabMouseUpOrLeave}
          className="w-full max-w-full overflow-x-auto pb-2 pt-0.5 text-xs font-bold scroll-smooth select-none -mx-3 px-3 sm:mx-0 sm:px-0"
          style={{
            scrollbarWidth: 'thin',
          }}
        >
          {/* Target Element: (div:nth-of-type(2) > div:nth-of-type(1)) */}
          <div className="flex items-center gap-1.5 sm:gap-2 w-max min-w-full touch-pan-x cursor-grab active:cursor-grabbing py-1">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'inventory', label: `Inventory (${products.length})`, icon: Package },
              { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingCart },
              { id: 'customers', label: `Customers (${customers.length})`, icon: Users },
              { id: 'suppliers', label: `Suppliers (${suppliers.length})`, icon: Building2 },
              { id: 'expenses', label: 'Expenses', icon: TrendingDown },
              { id: 'daily', label: 'Daily Closing', icon: CalendarCheck },
              { id: 'reports', label: 'GST Reports', icon: FileBarChart },
              { id: 'staff', label: `Staff & Team (${staffUsers.length})`, icon: UserCheck },
              { id: 'settings', label: 'Shop Settings', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={(e) => {
                    setActiveTab(tab.id as any);
                    if (tab.id === 'inventory') {
                      setInventorySubView('list');
                    }
                    e.currentTarget.scrollIntoView({
                      behavior: 'smooth',
                      inline: 'center',
                      block: 'nearest',
                    });
                  }}
                  className={`min-h-[44px] px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl whitespace-nowrap flex items-center gap-1.5 sm:gap-2 transition text-xs shrink-0 cursor-pointer touch-manipulation font-bold ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-md ring-2 ring-teal-500/30'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* TAB 1: OVERVIEW METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Analytics Period & Filter Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Analytics Period:
              </span>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {[
                  { id: 'today', label: 'Today (Daily)' },
                  { id: 'week', label: 'Last 7 Days (Weekly)' },
                  { id: 'month', label: 'Last 30 Days (Monthly)' },
                  { id: 'all', label: 'All Time' },
                  { id: 'custom', label: 'Custom Range' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setAnalyticsPeriod(p.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      analyticsPeriod === p.id
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {analyticsPeriod === 'custom' && (
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <div>
                  <span className="text-slate-400 mr-1.5">From:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-slate-400 mr-1.5">To:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Primary Key Metric Cards */}
          <div className="grid grid-cols-1 min-[440px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Today's Sales */}
            <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                Today's Sales
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                {formatINR(todaySales)}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold mt-2 block">
                {todayOrdersCount} orders placed today
              </span>
            </div>

            {/* Period Revenue */}
            <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                {analyticsPeriod === 'today'
                  ? 'Revenue (Today)'
                  : analyticsPeriod === 'week'
                  ? 'Revenue (Last 7 Days)'
                  : analyticsPeriod === 'month'
                  ? 'Revenue (Last 30 Days)'
                  : 'Total Revenue'}
              </span>
              <span className="text-xl sm:text-2xl font-black text-teal-600 dark:text-teal-400 mt-1 block">
                {formatINR(periodRevenue)}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold mt-2 block">
                From {filteredAnalyticsOrders.length} orders
              </span>
            </div>

            {/* Net Profit Estimate */}
            <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                Estimated Net Profit
              </span>
              <span className={`text-xl sm:text-2xl font-black mt-1 block ${periodNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatINR(periodNetProfit)}
              </span>
              <span className="text-[11px] text-slate-400 mt-2 block truncate">
                Sales - Expenses ({formatINR(periodExpenses)}) - COGS
              </span>
            </div>

            {/* Pending Payments */}
            <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                Pending Order Payments
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
                {formatINR(pendingPaymentsAmount)}
              </span>
              <span className="text-[11px] text-slate-400 mt-2 block truncate">
                Cust. balance: {formatINR(totalCustomerOutstanding)}
              </span>
            </div>
          </div>

          {/* Secondary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                GST Tax Collected
              </span>
              <span className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1 block">
                {formatINR(periodTax)}
              </span>
              <span className="text-[11px] text-slate-400 mt-2 block">
                CGST + SGST + IGST liability
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                Total Expenses
              </span>
              <span className="text-2xl font-black text-rose-600 mt-1 block">
                {formatINR(periodExpenses)}
              </span>
              <span className="text-[11px] text-slate-400 mt-2 block">
                Recorded in selected period
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                Inventory Valuation
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                {formatINR(totalInventoryValuation)}
              </span>
              <span className="text-[11px] text-slate-400 mt-2 block truncate">
                Cost: {formatINR(totalInventoryValuation)} • Retail: {formatINR(totalInventoryRetailValuation)}
              </span>
            </div>

            <div
              onClick={() => {
                handleNavigateToInventory(undefined, 'low-stock');
              }}
              className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer hover:border-red-400 transition"
              title="Click to view Low Stock items in Product Management"
            >
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                Low Stock Alerts
              </span>
              <span className="text-2xl font-black text-rose-600 mt-1 block">
                {lowStockProducts.length} Items
              </span>
              <span className="text-[11px] text-rose-500 font-semibold mt-2 block">
                {outOfStockCount} out of stock • {products.length} total products
              </span>
            </div>
          </div>

          {/* Breakdown Analytics: Sales by Payment & Sales by Category */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Sales by Payment Mode */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-teal-600" />
                  <span>Sales by Payment Method</span>
                </h4>
                <span className="text-[11px] text-slate-400">
                  {filteredAnalyticsOrders.length} Orders
                </span>
              </div>
              <div className="space-y-2">
                {Object.keys(salesByPayment).length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">No orders found in selected period.</p>
                ) : (
                  (Object.entries(salesByPayment) as [string, number][]).map(([method, amount]) => {
                    const pct = periodRevenue > 0 ? ((amount / periodRevenue) * 100).toFixed(1) : '0';
                    return (
                      <div key={method} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-700 dark:text-slate-300">{method}</span>
                          <span className="text-slate-900 dark:text-white">
                            {formatINR(amount)} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-500 rounded-full"
                            style={{ width: `${Math.min(100, Math.max(5, Number(pct)))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Sales by Category */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>Sales by Stationery Category</span>
                </h4>
                <span className="text-[11px] text-slate-400">
                  {Object.keys(salesByCategory).length} Categories
                </span>
              </div>
              <div className="space-y-2">
                {Object.keys(salesByCategory).length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">No category sales in selected period.</p>
                ) : (
                  (Object.entries(salesByCategory) as [string, number][])
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([cat, amount]) => {
                      const pct = periodRevenue > 0 ? ((amount / periodRevenue) * 100).toFixed(1) : '0';
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-700 dark:text-slate-300">{cat}</span>
                            <span className="text-slate-900 dark:text-white">
                              {formatINR(amount)} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(5, Number(pct)))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>

          {/* Top Selling Products & Top Customers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Selling Products */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-xs space-y-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Top Selling Products</span>
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                {topSellingProducts.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">No product sales recorded yet.</p>
                ) : (
                  topSellingProducts.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                          {idx + 1}. {item.name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {item.qty} units sold • Stock remaining: {item.product?.currentStock || 0}
                        </span>
                      </div>
                      <span className="font-bold text-teal-600 shrink-0">
                        {formatINR(item.revenue)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Customers */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-xs space-y-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Top High-Value Customers</span>
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                {topCustomers.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">No customer records yet.</p>
                ) : (
                  topCustomers.map((cust, idx) => (
                    <div key={cust.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                          {idx + 1}. {cust.name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {cust.mobile} • {cust.customerType || 'Retail'} • {cust.ordersCount || 1} Orders
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {formatINR(cust.totalPurchases || 0)}
                        </span>
                        {cust.outstandingAmount > 0 && (
                          <span className="text-[10px] text-amber-600 font-semibold">
                            Due: {formatINR(cust.outstandingAmount)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Order Status Summary */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-xs space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Order Status Summary
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs">
              {['Pending', 'Confirmed', 'Processing', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'].map(
                (st) => {
                  const cnt = orderStatusCounts[st] || 0;
                  return (
                    <div
                      key={st}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center"
                    >
                      <span className="text-slate-400 block text-[11px]">{st}</span>
                      <span className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                        {cnt}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Dedicated Low Stock & Replenishment Dashboard Widget */}
          <LowStockWidget
            products={products}
            onQuickRestock={handleQuickRestock}
            onEditProduct={openEditProductModal}
            onNavigateToInventory={(q) => handleNavigateToInventory(q, 'low-stock')}
            onDownloadLowStockCSV={handleDownloadLowStockCSV}
          />

          {/* Recent Orders Overview */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Recent Orders & Invoices
              </h3>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-semibold text-teal-600 hover:underline"
              >
                View All {orders.length} Orders
              </button>
            </div>

            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full text-left text-xs min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold">
                    <th className="py-2.5 px-3">Invoice No</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Items</th>
                    <th className="py-2.5 px-3">Total Amount</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {orders.slice(0, 5).map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="py-3 px-3 font-mono font-bold text-teal-600">
                        {o.invoiceNumber}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                        {o.customer.name}
                      </td>
                      <td className="py-3 px-3 text-slate-500">{o.items.length} items</td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {formatINR(o.grandTotal)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            o.paymentStatus === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {o.paymentStatus} ({o.paymentMethod})
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-700">
                          {o.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedOrderForInvoice(o);
                            setActiveView('invoice-view');
                          }}
                          className="text-xs font-semibold text-teal-600 hover:underline"
                        >
                          View Bill
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY MANAGEMENT */}
      {activeTab === 'inventory' && (
        inventorySubView === 'add' ? (
          <AddInventoryView
            onBackToInventory={() => {
              setInventorySubView('list');
              setEditingProduct(null);
            }}
            onNavigateToDashboard={() => {
              setActiveTab('overview');
              setInventorySubView('list');
              setEditingProduct(null);
            }}
            editingProduct={editingProduct}
          />
        ) : (
        <div className="space-y-3.5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
              <div className="relative flex-1 w-full sm:max-w-sm">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search SKU, barcode, brand, product..."
                  className="w-full pl-9 pr-8 py-2.5 sm:py-2 min-h-[44px] rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs dark:text-white shadow-2xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                {productSearch && (
                  <button
                    onClick={() => setProductSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Stock Filter Pills */}
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shrink-0">
                <button
                  type="button"
                  id="filter-all-products-btn"
                  onClick={() => setInventoryStockFilter('all')}
                  className={`min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1.5 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 touch-manipulation cursor-pointer ${
                    inventoryStockFilter === 'all'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>All Products</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                    {products.length}
                  </span>
                </button>
                <button
                  type="button"
                  id="filter-low-stock-btn"
                  onClick={() => setInventoryStockFilter('low-stock')}
                  className={`min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1.5 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 touch-manipulation cursor-pointer ${
                    inventoryStockFilter === 'low-stock'
                      ? 'bg-red-600 text-white shadow-2xs'
                      : 'text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Low Stock Only</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      inventoryStockFilter === 'low-stock'
                        ? 'bg-white text-red-700'
                        : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {lowStockProducts.length}
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
              <button
                id="download-products-csv-btn"
                onClick={handleDownloadProductsCSV}
                title="Download current product catalog as CSV (with SKU, Price, Stock, etc.)"
                className="w-full sm:w-auto justify-center min-h-[44px] px-3.5 py-2.5 sm:py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition shrink-0 touch-manipulation cursor-pointer"
              >
                <Download className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>Download CSV</span>
              </button>

              <button
                id="add-new-product-btn"
                onClick={openAddProductModal}
                className="w-full sm:w-auto justify-center min-h-[44px] px-4 py-2.5 sm:py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs shrink-0 touch-manipulation cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Add Inventory</span>
              </button>
            </div>
          </div>

          {/* Low Stock Warning Banner if items need reordering */}
          {lowStockProducts.length > 0 && inventoryStockFilter === 'all' && (
            <div className="p-3 sm:px-4 sm:py-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200 font-medium">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>
                  <strong>{lowStockProducts.length} item{lowStockProducts.length === 1 ? '' : 's'}</strong> below minimum stock threshold. Highlighted for immediate reordering.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInventoryStockFilter('low-stock')}
                className="min-h-[36px] sm:min-h-0 text-red-700 dark:text-red-300 font-bold hover:underline shrink-0 text-left sm:text-right touch-manipulation"
              >
                Filter Low Stock Only &rarr;
              </button>
            </div>
          )}

          {inventoryStockFilter === 'low-stock' && (
            <div className="p-3 sm:px-4 sm:py-2.5 rounded-xl bg-red-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs shadow-2xs">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-white shrink-0" />
                <span>
                  Showing <strong>{lowStockProducts.length} Low Stock item{lowStockProducts.length === 1 ? '' : 's'}</strong> requiring replenishment.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInventoryStockFilter('all')}
                className="min-h-[36px] sm:min-h-0 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold transition text-xs shrink-0 text-center touch-manipulation cursor-pointer"
              >
                Show All Products
              </button>
            </div>
          )}

          {/* Render both Mobile Card View & Desktop Table View */}
          {(() => {
            const filteredProducts = products
              .filter((p) => {
                if (inventoryStockFilter === 'low-stock') {
                  return p.currentStock <= p.minimumStock;
                }
                return true;
              })
              .filter((p) => {
                const q = productSearch.toLowerCase().trim();
                if (!q) return true;
                return (
                  p.name.toLowerCase().includes(q) ||
                  p.sku.toLowerCase().includes(q) ||
                  p.barcode.toLowerCase().includes(q) ||
                  p.brand.toLowerCase().includes(q) ||
                  p.category.toLowerCase().includes(q)
                );
              });

            return (
              <>
                {/* Mobile Responsive Inventory Cards (Visible on mobile 320px - 767px) */}
                <div className="block md:hidden space-y-3" id="admin-mobile-inventory-cards">
                  {filteredProducts.map((prod) => {
                    const isLowStock = prod.currentStock <= prod.minimumStock;
                    const isOutOfStock = prod.currentStock <= 0;
                    const reorderUnits = Math.max(10, prod.minimumStock * 2 - prod.currentStock);

                    return (
                      <div
                        key={`mob-${prod.id}`}
                        data-testid="mobile-product-card"
                        className={`rounded-2xl border p-3.5 transition-all shadow-xs space-y-3 ${
                          isLowStock
                            ? 'bg-red-50/90 dark:bg-red-950/30 border-red-300 dark:border-red-800/80 ring-1 ring-red-400/30'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {/* Top Section: Thumbnail, Title, SKU & Category */}
                        <div className="flex items-start gap-3">
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className={`w-14 h-14 rounded-xl object-cover bg-slate-100 dark:bg-slate-900 border shrink-0 ${
                              isLowStock
                                ? 'border-red-300 dark:border-red-700 ring-2 ring-red-400/40'
                                : 'border-slate-200 dark:border-slate-700'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">
                              {prod.name}
                            </h4>

                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                                {prod.category}
                              </span>
                              {prod.brand && (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                  • {prod.brand}
                                </span>
                              )}
                              {prod.status === 'Inactive' && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-bold uppercase text-[9px]">
                                  Inactive
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-1 flex-wrap">
                              <span>SKU: <strong className="text-slate-700 dark:text-slate-300">{prod.sku}</strong></span>
                              {prod.barcode && (
                                <>
                                  <span>•</span>
                                  <span>Bar: {prod.barcode}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Stock Health Strip */}
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            {isLowStock ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow-2xs">
                                <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                <span>{isOutOfStock ? 'Out of Stock' : 'Low Stock'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                                <CheckCircle className="w-2.5 h-2.5 shrink-0 text-emerald-600" />
                                <span>In Stock</span>
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              {prod.currentStock} {prod.unit}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Min: {prod.minimumStock} {prod.unit}
                            </span>
                          </div>
                        </div>

                        {/* Price Breakdown Grid */}
                        <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 text-center text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Selling Price</span>
                            <span className="font-extrabold text-teal-600 dark:text-teal-400 text-xs">
                              {formatINR(prod.sellingPrice)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Cost Price</span>
                            <span className="font-mono text-slate-600 dark:text-slate-300 text-xs">
                              {formatINR(prod.purchasePrice ?? prod.costPrice ?? 0)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">GST % / HSN</span>
                            <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                              {prod.gstRate}% • {prod.hsnCode || '—'}
                            </span>
                          </div>
                        </div>

                        {/* Mobile Actions: Touch targets >= 44px */}
                        <div className="pt-0.5 grid grid-cols-2 gap-2">
                          {isLowStock ? (
                            <button
                              type="button"
                              onClick={() => handleQuickRestock(prod.id, reorderUnits)}
                              className="col-span-2 min-h-[44px] px-3 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer touch-manipulation"
                            >
                              <Plus className="w-3.5 h-3.5 shrink-0" />
                              <span>Reorder (+{reorderUnits} {prod.unit})</span>
                            </button>
                          ) : null}

                          <button
                            type="button"
                            id={`mob-print-barcode-btn-${prod.id}`}
                            onClick={() => setBarcodeModalProduct(prod)}
                            className="min-h-[44px] px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation transition"
                          >
                            <Barcode className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                            <span>Barcode</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditProductModal(prod)}
                            className="min-h-[44px] px-3 py-2 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-700 dark:text-teal-300 font-bold text-xs rounded-xl flex items-center justify-center cursor-pointer touch-manipulation"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteProduct(prod.id)}
                            className="col-span-2 min-h-[44px] px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 font-bold text-xs rounded-xl flex items-center justify-center cursor-pointer touch-manipulation transition"
                          >
                            Delete Product
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {filteredProducts.length === 0 && (
                    <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 text-xs space-y-2">
                      <Package className="w-8 h-8 mx-auto text-slate-400" />
                      <p className="font-bold">No products found matching your search.</p>
                      <p className="text-[11px] text-slate-400">Try changing keywords or clearing the stock filter.</p>
                    </div>
                  )}
                </div>

                {/* Desktop & Tablet Product List Table (visible on md:block 768px+) */}
                <div className="hidden md:block bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto shadow-xs">
                  <table id="admin-products-table" className="w-full text-left text-xs min-w-[760px] lg:min-w-full">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold">
                        <th className="py-3 px-3">Item Details</th>
                        <th className="py-3 px-3">Category & Brand</th>
                        <th className="py-3 px-3">HSN Code</th>
                        <th className="py-3 px-3 text-right">Cost (₹)</th>
                        <th className="py-3 px-3 text-right">Selling Price (₹)</th>
                        <th className="py-3 px-3 text-center">GST %</th>
                        <th className="py-3 px-3 text-center">Current Stock</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {filteredProducts.map((prod) => {
                        const isLowStock = prod.currentStock <= prod.minimumStock;
                        const isOutOfStock = prod.currentStock <= 0;
                        const reorderUnits = Math.max(10, prod.minimumStock * 2 - prod.currentStock);

                        return (
                          <tr
                            key={prod.id}
                            data-testid="product-table-row"
                            data-low-stock={isLowStock ? 'true' : 'false'}
                            className={`transition-colors ${
                              isLowStock
                                ? 'bg-red-50/85 dark:bg-red-950/35 hover:bg-red-100/85 dark:hover:bg-red-950/50 border-l-4 border-l-red-500 dark:border-l-red-500'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-700/30 border-l-4 border-l-transparent'
                            }`}
                          >
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={prod.imageUrl}
                                  alt={prod.name}
                                  className={`w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-900 border shrink-0 ${
                                    isLowStock
                                      ? 'border-red-300 dark:border-red-700 ring-2 ring-red-400/40'
                                      : 'border-slate-200 dark:border-slate-700'
                                  }`}
                                />
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-slate-900 dark:text-white block line-clamp-1">
                                      {prod.name}
                                    </span>
                                    {isLowStock && (
                                      <span
                                        data-testid="item-low-stock-badge"
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-red-600 text-white shadow-2xs shrink-0"
                                      >
                                        <AlertTriangle className="w-2.5 h-2.5" />
                                        <span>{isOutOfStock ? 'Out of Stock' : 'Low Stock'}</span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                    <span>SKU: {prod.sku}</span>
                                    <span>•</span>
                                    <span>Bar: {prod.barcode}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {prod.category}
                                </span>
                                {prod.subCategory && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px]">
                                    {prod.subCategory}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                                <span>{prod.brand}</span>
                                {prod.status === 'Inactive' && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-bold uppercase text-[9px]">
                                    Inactive
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px]">{prod.hsnCode}</td>
                            <td className="py-3 px-3 text-right font-mono text-slate-500">
                              {formatINR(prod.purchasePrice ?? prod.costPrice ?? 0)}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                              {formatINR(prod.sellingPrice)}
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-teal-600">
                              {prod.gstRate}%
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex flex-col items-center justify-center gap-1">
                                <span
                                  className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                                    isOutOfStock
                                      ? 'bg-red-200 dark:bg-red-900/80 text-red-900 dark:text-red-100 font-black'
                                      : isLowStock
                                      ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 font-black'
                                      : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                  }`}
                                >
                                  {prod.currentStock} {prod.unit}
                                </span>

                                {isLowStock ? (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span
                                      data-testid="low-stock-badge"
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow-2xs"
                                    >
                                      <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                      <span>Low Stock</span>
                                    </span>
                                    <span className="text-[10px] font-semibold text-red-700 dark:text-red-300">
                                      Min: {prod.minimumStock}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                    Min: {prod.minimumStock}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {isLowStock && (
                                  <button
                                    onClick={() => handleQuickRestock(prod.id, reorderUnits)}
                                    title={`Quick Restock / Reorder: +${reorderUnits} ${prod.unit}`}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] shadow-2xs transition"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Reorder</span>
                                  </button>
                                )}
                                <button
                                  id={`print-barcode-btn-${prod.id}`}
                                  data-testid="print-barcode-btn"
                                  onClick={() => setBarcodeModalProduct(prod)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs transition"
                                  title={`Generate and print barcode label for ${prod.name} (${prod.sku})`}
                                >
                                  <Barcode className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                  <span>Print Barcode</span>
                                </button>
                                <button
                                  onClick={() => openEditProductModal(prod)}
                                  className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteProduct(prod.id)}
                                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()}
        </div>
      )
    )}

      {/* Add / Edit Product Modal */}
      {isAddProductOpen && (
        <div
          id="add-product-modal-backdrop"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div
            id="add-product-modal"
            className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl max-w-3xl w-full p-5 sm:p-7 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-700 my-4 sm:my-8 max-h-[92vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                    <Package className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                    {editingProduct ? 'Edit Product Item' : 'Add New Product'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enter complete product information, pricing, GST rates, and inventory stock for ABC Paper & Stationery.
                </p>
              </div>

              <button
                type="button"
                id="close-product-modal-btn"
                disabled={isSavingProduct}
                onClick={() => {
                  if (!isSavingProduct) {
                    setIsAddProductOpen(false);
                    setEditingProduct(null);
                    setProductFormError(null);
                  }
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition disabled:opacity-50 cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner - Displayed if validation or saving fails */}
            {productFormError && (
              <div
                id="product-form-error-banner"
                className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5 shadow-2xs"
              >
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block">Please resolve the following issue:</span>
                  <span className="mt-0.5 block">{productFormError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setProductFormError(null)}
                  className="text-red-400 hover:text-red-600 text-xs font-bold px-1.5 py-0.5 rounded"
                >
                  Dismiss
                </button>
              </div>
            )}

            <form onSubmit={handleProductSubmit} className="space-y-5 text-xs">
              {/* SECTION 1: BASIC INFORMATION */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  1. Product Identification
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="product-name-input"
                      type="text"
                      required
                      placeholder="e.g. JK Copier Paper A4 75 GSM (500 Sheets)"
                      value={newProductData.name}
                      onChange={(e) =>
                        setNewProductData({ ...newProductData, name: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        SKU / Product Code <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                          setNewProductData((prev) => ({
                            ...prev,
                            sku: `SKU-${Date.now().toString().slice(-4)}${randomSuffix.toString().slice(-2)}`,
                          }));
                        }}
                        className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center gap-0.5"
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Generate</span>
                      </button>
                    </div>
                    <input
                      id="product-sku-input"
                      type="text"
                      required
                      placeholder="e.g. SKU-JK-A4-75"
                      value={newProductData.sku}
                      onChange={(e) =>
                        setNewProductData({ ...newProductData, sku: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="product-category-select"
                      value={newProductData.category}
                      onChange={(e) => {
                        const nextCat = e.target.value as StationeryCategory;
                        setNewProductData((prev) => ({
                          ...prev,
                          category: nextCat,
                          // If current image is blank or was a default image, update to new category image
                          imageUrl:
                            !prev.imageUrl || Object.values(CATEGORY_DEFAULT_IMAGES).includes(prev.imageUrl)
                              ? CATEGORY_DEFAULT_IMAGES[nextCat]
                              : prev.imageUrl,
                        }));
                      }}
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
                    >
                      {[
                        'Paper',
                        'Notebooks',
                        'Pens',
                        'Pencils',
                        'Files & Folders',
                        'Office Supplies',
                        'School Supplies',
                        'Art & Craft',
                        'Printing Supplies',
                        'Books',
                        'Computer Accessories',
                        'Packaging Materials',
                        'Gift Items',
                        'Other',
                      ].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Sub-Category
                    </label>
                    <input
                      id="product-subcategory-input"
                      type="text"
                      placeholder="e.g. Copier Paper, Ball Pen, Register"
                      value={newProductData.subCategory}
                      onChange={(e) =>
                        setNewProductData({ ...newProductData, subCategory: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Brand
                    </label>
                    <input
                      id="product-brand-input"
                      type="text"
                      placeholder="e.g. JK Paper, Classmate, Reynolds, Camlin"
                      value={newProductData.brand}
                      onChange={(e) =>
                        setNewProductData({ ...newProductData, brand: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Supplier
                    </label>
                    <select
                      id="product-supplier-select"
                      value={newProductData.supplierId}
                      onChange={(e) => {
                        const selId = e.target.value;
                        const match = suppliers.find((s) => s.id === selId);
                        setNewProductData({
                          ...newProductData,
                          supplierId: selId,
                          supplierName: match ? match.name : '',
                        });
                      }}
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="">Direct Store Purchase (None)</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.contactPerson})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Product Status
                    </label>
                    <select
                      id="product-status-select"
                      value={newProductData.status}
                      onChange={(e) =>
                        setNewProductData({
                          ...newProductData,
                          status: e.target.value as 'Active' | 'Inactive',
                        })
                      }
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
                    >
                      <option value="Active">Active (Ready for Sale & POS)</option>
                      <option value="Inactive">Inactive (Archived / Hidden)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: PRICING, GST & MARGINS */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    2. Pricing, GST & Taxes
                  </h4>
                  {/* Dynamic Margin Indicator */}
                  {Boolean(newProductData.purchasePrice && newProductData.sellingPrice) && (
                    <div className="text-[11px] flex items-center gap-2">
                      {Number(newProductData.sellingPrice) >= Number(newProductData.purchasePrice) ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                          Profit Margin: ₹
                          {(
                            Number(newProductData.sellingPrice) - Number(newProductData.purchasePrice)
                          ).toFixed(2)}{' '}
                          (
                          {(
                            ((Number(newProductData.sellingPrice) - Number(newProductData.purchasePrice)) /
                              Number(newProductData.sellingPrice)) *
                            100
                          ).toFixed(1)}
                          %)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold">
                          ⚠️ Notice: Selling price is below purchase cost!
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Purchase Cost (₹) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 font-bold text-slate-400">₹</span>
                      <input
                        id="product-purchase-price-input"
                        type="number"
                        step="any"
                        min="0"
                        required
                        placeholder="0.00"
                        value={newProductData.purchasePrice}
                        onChange={(e) =>
                          setNewProductData({
                            ...newProductData,
                            purchasePrice: e.target.value,
                            costPrice: e.target.value,
                          })
                        }
                        className="w-full pl-7 pr-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Landing cost from vendor</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Selling Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 font-bold text-teal-600">₹</span>
                      <input
                        id="product-selling-price-input"
                        type="number"
                        step="any"
                        min="0"
                        required
                        placeholder="0.00"
                        value={newProductData.sellingPrice}
                        onChange={(e) =>
                          setNewProductData({
                            ...newProductData,
                            sellingPrice: e.target.value,
                          })
                        }
                        className="w-full pl-7 pr-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Counter / POS sale rate</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      MRP (₹) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 font-bold text-slate-400">₹</span>
                      <input
                        id="product-mrp-input"
                        type="number"
                        step="any"
                        min="0"
                        required
                        placeholder="0.00"
                        value={newProductData.mrp}
                        onChange={(e) =>
                          setNewProductData({
                            ...newProductData,
                            mrp: e.target.value,
                          })
                        }
                        className="w-full pl-7 pr-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Maximum retail price printed</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      GST Rate % <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="product-gstrate-select"
                      value={newProductData.gstRate}
                      onChange={(e) =>
                        setNewProductData({
                          ...newProductData,
                          gstRate: Number(e.target.value),
                        })
                      }
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
                    >
                      {[0, 5, 12, 18, 28].map((r) => (
                        <option key={r} value={r}>
                          {r}% GST Rate
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-400 block mt-0.5">CGST + SGST split 50/50</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      HSN / SAC Code
                    </label>
                    <input
                      id="product-hsn-input"
                      type="text"
                      placeholder="e.g. 4802, 4820, 9608"
                      value={newProductData.hsnCode}
                      onChange={(e) =>
                        setNewProductData({
                          ...newProductData,
                          hsnCode: e.target.value,
                        })
                      }
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Tax classification code</span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: INVENTORY & STOCK */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  3. Stock Quantities & Measurements
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Opening Stock
                    </label>
                    <input
                      id="product-opening-stock-input"
                      type="number"
                      min="0"
                      placeholder="e.g. 50"
                      value={newProductData.openingStock}
                      onChange={(e) =>
                        setNewProductData({
                          ...newProductData,
                          openingStock: e.target.value,
                        })
                      }
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Initial opening count</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Current Stock <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="product-current-stock-input"
                      type="number"
                      min="0"
                      required
                      placeholder="e.g. 50"
                      value={newProductData.currentStock}
                      onChange={(e) =>
                        setNewProductData({
                          ...newProductData,
                          currentStock: e.target.value,
                        })
                      }
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Available on shop shelves</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Min Stock Threshold <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="product-min-stock-input"
                      type="number"
                      min="0"
                      required
                      placeholder="e.g. 10"
                      value={newProductData.minimumStock}
                      onChange={(e) =>
                        setNewProductData({
                          ...newProductData,
                          minimumStock: e.target.value,
                        })
                      }
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Triggers low stock alert</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Unit of Measurement <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="product-unit-input"
                      type="text"
                      list="unit-options"
                      required
                      placeholder="Piece, Ream, Box, Packet"
                      value={newProductData.unit}
                      onChange={(e) =>
                        setNewProductData({
                          ...newProductData,
                          unit: e.target.value,
                        })
                      }
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                    <datalist id="unit-options">
                      <option value="Piece" />
                      <option value="Packet" />
                      <option value="Ream" />
                      <option value="Box" />
                      <option value="Set" />
                      <option value="Bundle" />
                      <option value="Roll" />
                      <option value="Book" />
                      <option value="Pack" />
                      <option value="Dozen" />
                    </datalist>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Billing & packing unit</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Barcode / EAN
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                          setNewProductData((prev) => ({
                            ...prev,
                            barcode: `890${Date.now().toString().slice(-7)}${randomSuffix.toString().slice(-3)}`,
                          }));
                        }}
                        className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold hover:underline"
                      >
                        Auto-fill
                      </button>
                    </div>
                    <input
                      id="product-barcode-input"
                      type="text"
                      placeholder="e.g. 8901234567890"
                      value={newProductData.barcode}
                      onChange={(e) =>
                        setNewProductData({
                          ...newProductData,
                          barcode: e.target.value,
                        })
                      }
                      className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Scannable 13-digit EAN</span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: PRODUCT IMAGE & MEDIA */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    4. Product Image
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setImageUploadMode('upload')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        imageUploadMode === 'upload'
                          ? 'bg-teal-600 text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUploadMode('url')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        imageUploadMode === 'url'
                          ? 'bg-teal-600 text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Image URL
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewProductData((prev) => ({
                          ...prev,
                          imageUrl: CATEGORY_DEFAULT_IMAGES[prev.category] || CATEGORY_DEFAULT_IMAGES.Other,
                        }));
                      }}
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/50"
                    >
                      Use Category Preset
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-4">
                  {/* Image Preview Box */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 overflow-hidden relative shrink-0 flex items-center justify-center group shadow-2xs">
                    {newProductData.imageUrl ? (
                      <>
                        <img
                          src={newProductData.imageUrl}
                          alt="Product preview"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            // Fallback if image fails to load
                            (e.target as HTMLImageElement).src = CATEGORY_DEFAULT_IMAGES.Other;
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setNewProductData((prev) => ({ ...prev, imageUrl: '' }))}
                          title="Remove image"
                          className="absolute top-1 right-1 p-1 bg-slate-950/70 hover:bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                        <span className="text-[10px] block font-semibold">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Input selector based on mode */}
                  <div className="flex-1 w-full space-y-2">
                    {imageUploadMode === 'upload' ? (
                      <div>
                        <label
                          htmlFor="product-image-file-input"
                          className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-400 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer transition text-center"
                        >
                          <Upload className="w-5 h-5 text-teal-600 dark:text-teal-400 mb-1" />
                          <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">
                            Choose an image file from your device
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            Supports PNG, JPG, WebP (Max 2MB)
                          </span>
                          <input
                            id="product-image-file-input"
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileSelect}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Image Web Link (URL)
                        </label>
                        <input
                          id="product-image-url-input"
                          type="url"
                          placeholder="https://images.unsplash.com/..."
                          value={newProductData.imageUrl}
                          onChange={(e) =>
                            setNewProductData({
                              ...newProductData,
                              imageUrl: e.target.value,
                            })
                          }
                          className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 5: DESCRIPTION & STORE PROMOTIONS */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  5. Description & Highlights (Optional)
                </h4>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Product Description
                  </label>
                  <textarea
                    id="product-description-input"
                    rows={2}
                    placeholder="Enter short description or specifications (paper GSM, ink color, sheet count)..."
                    value={newProductData.description}
                    onChange={(e) =>
                      setNewProductData({
                        ...newProductData,
                        description: e.target.value,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white resize-none"
                  />
                </div>

                <div className="flex items-center gap-5 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      id="product-bestseller-checkbox"
                      type="checkbox"
                      checked={newProductData.isBestSeller}
                      onChange={(e) =>
                        setNewProductData({
                          ...newProductData,
                          isBestSeller: e.target.checked,
                        })
                      }
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Mark as Best Seller
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      id="product-todaysoffer-checkbox"
                      type="checkbox"
                      checked={newProductData.isTodayOffer}
                      onChange={(e) =>
                        setNewProductData({
                          ...newProductData,
                          isTodayOffer: e.target.checked,
                        })
                      }
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Show in Today's Special Offers
                    </span>
                  </label>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 sm:pt-5 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  id="cancel-product-btn"
                  disabled={isSavingProduct}
                  onClick={() => {
                    setIsAddProductOpen(false);
                    setEditingProduct(null);
                    setProductFormError(null);
                  }}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 cursor-pointer touch-manipulation text-center flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-product-btn"
                  disabled={isSavingProduct}
                  className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-extrabold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer touch-manipulation text-center"
                >
                  {isSavingProduct ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Saving Product...</span>
                    </>
                  ) : editingProduct ? (
                    <span>Save Changes</span>
                  ) : (
                    <span>Save Product</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode & Price Tag Print Utility Modal */}
      <ProductBarcodeModal
        product={barcodeModalProduct}
        isOpen={!!barcodeModalProduct}
        onClose={() => setBarcodeModalProduct(null)}
        shopSettings={shopSettings}
      />

      {/* TAB 3: ORDERS & INVOICES */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Order Metrics Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                Total Orders
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
                {orders.length}
              </span>
              <span className="text-[10px] text-slate-400">All registered</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">
                New / Placed
              </span>
              <span className="text-xl font-black text-amber-600 mt-1 block">
                {orders.filter((o) => o.orderStatus === 'Order Placed' || o.orderStatus === 'New').length}
              </span>
              <span className="text-[10px] text-amber-500">Needs confirmation</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">
                In Process / Packed
              </span>
              <span className="text-xl font-black text-blue-600 mt-1 block">
                {orders.filter((o) => o.orderStatus === 'Processing' || o.orderStatus === 'Packed' || o.orderStatus === 'Confirmed').length}
              </span>
              <span className="text-[10px] text-blue-500">Picking & packing</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">
                Ready for Dispatch
              </span>
              <span className="text-xl font-black text-indigo-600 mt-1 block">
                {orders.filter((o) => o.orderStatus === 'Ready for Dispatch' || o.orderStatus === 'Ready').length}
              </span>
              <span className="text-[10px] text-indigo-500">At dispatch dock</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs">
              <span className="text-[10px] text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wider block">
                Out for Delivery
              </span>
              <span className="text-xl font-black text-blue-700 dark:text-blue-300 mt-1 block animate-pulse">
                {orders.filter((o) => o.orderStatus === 'Out for Delivery' || o.orderStatus === 'Shipped').length}
              </span>
              <span className="text-[10px] text-blue-600">Rider on route</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider block">
                Delivered
              </span>
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1 block">
                {orders.filter((o) => o.orderStatus === 'Delivered').length}
              </span>
              <span className="text-[10px] text-emerald-600">Completed</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                Total Revenue
              </span>
              <span className="text-xl font-black text-teal-600 dark:text-teal-400 mt-1 block font-mono">
                {formatINR(orders.reduce((s, o) => s + o.grandTotal, 0))}
              </span>
              <span className="text-[10px] text-slate-400">Inc. GST taxes</span>
            </div>
          </div>

          {/* Search, Filter & Quick Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <input
                  id="admin-orders-search"
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="Search by Order #, Customer, Phone..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs dark:text-white"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                {orderSearchQuery && (
                  <button
                    onClick={() => setOrderSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs dark:text-white font-medium"
              >
                <option value="all">All Workflow Statuses</option>
                <option value="Order Placed">Order Placed</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Processing">Processing</option>
                <option value="Packed">Packed</option>
                <option value="Ready for Dispatch">Ready for Dispatch</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <select
                value={orderPaymentFilter}
                onChange={(e) => setOrderPaymentFilter(e.target.value)}
                className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs dark:text-white font-medium"
              >
                <option value="all">All Payment Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs min-w-[850px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold">
                  <th className="py-3 px-3">Order & Invoice</th>
                  <th className="py-3 px-3">Customer Information</th>
                  <th className="py-3 px-3">Items & Packaging</th>
                  <th className="py-3 px-3 text-right">Amount (Inc. GST)</th>
                  <th className="py-3 px-3 text-center">Payment Status</th>
                  <th className="py-3 px-3 text-center">Order Status Pipeline</th>
                  <th className="py-3 px-3">Delivery Partner</th>
                  <th className="py-3 px-3 text-right">Order Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {orders
                  .filter((ord) => {
                    if (orderStatusFilter !== 'all' && ord.orderStatus !== orderStatusFilter) {
                      return false;
                    }
                    if (orderPaymentFilter !== 'all' && ord.paymentStatus !== orderPaymentFilter) {
                      return false;
                    }
                    if (orderSearchQuery.trim()) {
                      const q = orderSearchQuery.toLowerCase();
                      const matchNumber = (ord.orderNumber || '').toLowerCase().includes(q);
                      const matchInv = (ord.invoiceNumber || '').toLowerCase().includes(q);
                      const matchCust = (ord.customer?.name || '').toLowerCase().includes(q);
                      const matchPhone = (ord.customer?.mobile || '').includes(q);
                      return matchNumber || matchInv || matchCust || matchPhone;
                    }
                    return true;
                  })
                  .map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                      {/* Order & Invoice */}
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-blue-700 dark:text-blue-400 block text-xs">
                          {ord.orderNumber}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 block">
                          Inv: {ord.invoiceNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {ord.orderDate ? new Date(ord.orderDate).toLocaleDateString('en-IN') : 'N/A'}
                        </span>
                      </td>

                      {/* Customer Information */}
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {ord.customer?.name || 'Walk-in Customer'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          {ord.customer?.mobile || ''}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block max-w-[140px]">
                          {ord.customer?.city || ord.customer?.billingAddress || ''}
                        </span>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-3">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">
                          {(ord.items || []).length} items ({(ord.items || []).reduce((s, i) => s + (i.quantity || 0), 0)} units)
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block max-w-[180px]">
                          {(ord.items || []).map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-3 text-right">
                        <span className="font-black text-slate-900 dark:text-white font-mono block">
                          {formatINR(ord.grandTotal)}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          GST: {formatINR(ord.totalGst || 0)}
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-3 text-center">
                        <select
                          value={ord.paymentStatus}
                          onChange={(e: any) => updatePaymentStatus(ord.id, e.target.value)}
                          className={`text-[11px] font-bold p-1.5 rounded-lg border cursor-pointer ${
                            ord.paymentStatus === 'Paid'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                              : ord.paymentStatus === 'Partial'
                              ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          <option value="Paid">Paid</option>
                          <option value="Pending">Pending</option>
                          <option value="Partial">Partial</option>
                        </select>
                      </td>

                      {/* Order Status Pipeline */}
                      <td className="py-3.5 px-3 text-center">
                        <select
                          value={ord.orderStatus}
                          onChange={(e: any) => updateOrderStatus(ord.id, e.target.value)}
                          className={`text-[11px] font-bold p-1.5 rounded-lg border cursor-pointer ${
                            ord.orderStatus === 'Delivered'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                              : ord.orderStatus === 'Out for Delivery'
                              ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                              : ord.orderStatus === 'Cancelled'
                              ? 'bg-red-50 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          <option value="Order Placed">Order Placed</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing</option>
                          <option value="Packed">Packed</option>
                          <option value="Ready for Dispatch">Ready for Dispatch</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Returned">Returned</option>
                        </select>
                      </td>

                      {/* Delivery Person */}
                      <td className="py-3.5 px-3">
                        {ord.assignedDeliveryPerson ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">
                              {ord.assignedDeliveryPerson.deliveryPerson}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {ord.assignedDeliveryPerson.deliveryArea}
                            </span>
                            <button
                              onClick={() => {
                                setAssignRiderOrder(ord);
                                setRiderForm({
                                  deliveryPerson: ord.assignedDeliveryPerson.deliveryPerson,
                                  mobile: ord.assignedDeliveryPerson.mobile,
                                  deliveryArea: ord.assignedDeliveryPerson.deliveryArea,
                                  vehicleDetails: ord.assignedDeliveryPerson.vehicleDetails || '',
                                });
                              }}
                              className="text-[10px] text-blue-600 hover:underline font-semibold"
                            >
                              Change Rider
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setAssignRiderOrder(ord);
                              setRiderForm({
                                deliveryPerson: 'Ramesh Sahu',
                                mobile: '+91 98765 43210',
                                deliveryArea: 'Civil Lines / Pandri',
                                vehicleDetails: 'Hero Splendor Plus (CG-04-AB-1294)',
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold text-[11px] border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition flex items-center gap-1"
                          >
                            <Truck className="w-3 h-3" />
                            <span>Assign Rider</span>
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Live Customer Tracking"
                            onClick={() => {
                              setSearchTrackingId(ord.orderNumber);
                              setActiveView('track-order');
                            }}
                            className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition"
                          >
                            <Truck className="w-3.5 h-3.5" />
                          </button>

                          <button
                            title="Send SMS or WhatsApp Notification"
                            onClick={() => {
                              setNotificationModalOrder(ord);
                              setNotificationMessage(
                                `Hello ${ord.customer.name}, your order #${ord.orderNumber} is currently ${ord.orderStatus}. Thank you for choosing ABC Paper & Store!`
                              );
                            }}
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>

                          <button
                            title="View GST Tax Invoice"
                            onClick={() => {
                              setSelectedOrderForInvoice(ord);
                              setActiveView('invoice-view');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] hover:bg-slate-200 transition"
                          >
                            Invoice
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ASSIGN DELIVERY RIDER MODAL */}
      {assignRiderOrder && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    Assign Delivery Partner
                  </h4>
                  <p className="text-xs text-slate-500">
                    Order #{assignRiderOrder.orderNumber} · {assignRiderOrder.customer.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssignRiderOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                assignDeliveryPerson(assignRiderOrder.id, riderForm);
                setAssignRiderOrder(null);
                showToast(`Assigned ${riderForm.deliveryPerson} to order #${assignRiderOrder.orderNumber}`);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Delivery Person / Partner
                </label>
                <select
                  value={riderForm.deliveryPerson}
                  onChange={(e) => {
                    const name = e.target.value;
                    let phone = '+91 98765 43210';
                    let area = 'Civil Lines / Pandri';
                    let vehicle = 'Hero Splendor Plus (CG-04-AB-1294)';

                    if (name === 'Suresh Kumar') {
                      phone = '+91 98765 43211';
                      area = 'Shankar Nagar / Telibandha';
                      vehicle = 'Honda Activa 6G (CG-04-MC-5821)';
                    } else if (name === 'Rajesh Gupta') {
                      phone = '+91 98765 43212';
                      area = 'Samta Colony / Gudhiyari';
                      vehicle = 'Bajaj Pulsar 150 (CG-04-NE-9102)';
                    } else if (name === 'Anita Yadav') {
                      phone = '+91 98765 43213';
                      area = 'Devendra Nagar / Fafadih';
                      vehicle = 'TVS Jupiter (CG-04-PQ-7733)';
                    }

                    setRiderForm({
                      deliveryPerson: name,
                      mobile: phone,
                      deliveryArea: area,
                      vehicleDetails: vehicle,
                    });
                  }}
                  className="w-full min-h-[44px] p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs cursor-pointer"
                >
                  <option value="Ramesh Sahu">Ramesh Sahu (Civil Lines / Pandri)</option>
                  <option value="Suresh Kumar">Suresh Kumar (Shankar Nagar / Telibandha)</option>
                  <option value="Rajesh Gupta">Rajesh Gupta (Samta Colony / Gudhiyari)</option>
                  <option value="Anita Yadav">Anita Yadav (Devendra Nagar / Fafadih)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Rider Contact Mobile
                </label>
                <input
                  type="text"
                  value={riderForm.mobile}
                  onChange={(e) => setRiderForm({ ...riderForm, mobile: e.target.value })}
                  required
                  className="w-full min-h-[44px] p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Route / Delivery Area
                </label>
                <input
                  type="text"
                  value={riderForm.deliveryArea}
                  onChange={(e) => setRiderForm({ ...riderForm, deliveryArea: e.target.value })}
                  required
                  className="w-full min-h-[44px] p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vehicle Number & Model
                </label>
                <input
                  type="text"
                  value={riderForm.vehicleDetails}
                  onChange={(e) => setRiderForm({ ...riderForm, vehicleDetails: e.target.value })}
                  className="w-full min-h-[44px] p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssignRiderOrder(null)}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer touch-manipulation text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition cursor-pointer touch-manipulation text-center"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SEND NOTIFICATION MODAL */}
      {notificationModalOrder && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    Send Order Alert
                  </h4>
                  <p className="text-xs text-slate-500">
                    To {notificationModalOrder.customer.name} ({notificationModalOrder.customer.mobile})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNotificationModalOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const channels: Array<'WhatsApp' | 'SMS'> =
                  notificationChannel === 'Both'
                    ? ['WhatsApp', 'SMS']
                    : [notificationChannel];

                channels.forEach((ch) => {
                  sendOrderNotification(
                    notificationModalOrder.id,
                    ch,
                    `Order #${notificationModalOrder.orderNumber} Update`,
                    notificationMessage
                  );
                });

                setNotificationModalOrder(null);
                showToast(`Alert dispatched via ${notificationChannel} to customer!`);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dispatch Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['WhatsApp', 'SMS', 'Both'] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setNotificationChannel(ch)}
                      className={`min-h-[44px] py-2 px-1 rounded-xl border text-xs font-bold transition flex items-center justify-center cursor-pointer touch-manipulation ${
                        notificationChannel === ch
                          ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alert Message Content
                </label>
                <textarea
                  rows={4}
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setNotificationModalOrder(null)}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer touch-manipulation text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer touch-manipulation text-center"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Notification</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: CUSTOMERS */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold">
                  <th className="py-3 px-3">Customer Name</th>
                  <th className="py-3 px-3">Phone & WhatsApp</th>
                  <th className="py-3 px-3">City & State</th>
                  <th className="py-3 px-3">GSTIN</th>
                  <th className="py-3 px-3 text-center">Orders</th>
                  <th className="py-3 px-3 text-right">Total Purchases</th>
                  <th className="py-3 px-3 text-right">Outstanding Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {c.name}
                      {c.companyName && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {c.companyName}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {c.mobile}
                      {c.whatsapp && (
                        <span className="block text-[10px] text-emerald-600">WA: {c.whatsapp}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {c.city}, {c.state}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      {c.gstin || <span className="text-slate-400">Unregistered</span>}
                    </td>
                    <td className="py-3 px-3 text-center font-bold">{c.ordersCount}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {formatINR(c.totalPurchases)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-amber-600">
                      {formatINR(c.outstandingAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SUPPLIERS */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold">
                  <th className="py-3 px-3">Supplier / Mill</th>
                  <th className="py-3 px-3">Contact Person</th>
                  <th className="py-3 px-3">Phone & Email</th>
                  <th className="py-3 px-3">GSTIN</th>
                  <th className="py-3 px-3">Product Categories</th>
                  <th className="py-3 px-3 text-right">Balance Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {(suppliers || []).map((s) => {
                  const supplierCategories: string[] = (s as any).categoriesSupplied
                    ? (s as any).categoriesSupplied
                    : s.productsSupplied
                    ? s.productsSupplied.split(',').map((c: string) => c.trim())
                    : ['Stationery'];
                  const supplierLocation = (s as any).city
                    ? `${(s as any).city}, ${(s as any).state || ''}`
                    : s.address;
                  const supplierBalance = (s as any).outstandingBalance ?? s.outstandingAmount ?? 0;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {s.name}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {supplierLocation}
                        </span>
                      </td>
                      <td className="py-3 px-3">{s.contactPerson}</td>
                      <td className="py-3 px-3 font-mono">
                        {s.phone}
                        <span className="block text-[10px] text-slate-400">{s.email}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">{s.gstin}</td>
                      <td className="py-3 px-3">
                        <div className="flex gap-1 flex-wrap">
                          {supplierCategories.map((cat, i) => (
                            <span
                              key={i}
                              className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px]"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-amber-600">
                        {formatINR(supplierBalance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: EXPENSE TRACKER */}
      {activeTab === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 space-y-4 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Record Daily Shop Expense</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!expenseTitle.trim() || !expenseAmount) return;
                addExpense({
                  date: new Date().toISOString().slice(0, 10),
                  category: expenseCategory,
                  title: expenseTitle,
                  amount: Number(expenseAmount),
                  paymentMode: 'Cash',
                });
                setExpenseTitle('');
                setExpenseAmount('');
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold mb-1">Expense Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Courier charges for paper delivery"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full min-h-[44px] p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e: any) => setExpenseCategory(e.target.value)}
                    className="w-full min-h-[44px] p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs cursor-pointer"
                  >
                    {['Tea & Snacks', 'Rent', 'Electricity', 'Salary', 'Packaging', 'Transport', 'Other'].map(
                      (c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full min-h-[44px] p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition cursor-pointer touch-manipulation text-center flex items-center justify-center"
              >
                Add Expense
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 space-y-4 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Recent Shop Expenses</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1 text-xs">
              {expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                      {exp.title}
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {exp.date} • {exp.category} • Paid via {exp.paymentMode}
                    </span>
                  </div>
                  <span className="font-bold text-rose-600 shrink-0">{formatINR(exp.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: DAILY CLOSING TASKS */}
      {activeTab === 'daily' && (() => {
        const todayCompletedOrders = orders.filter((o) => (o.orderDate || '').slice(0, 10) === todayStr);
        const autoTotalSales = todayCompletedOrders.reduce((s, o) => s + o.grandTotal, 0);
        const autoOrderCount = todayCompletedOrders.length;
        const autoCashSales = todayCompletedOrders
          .filter((o) => o.paymentMethod === 'Cash')
          .reduce((s, o) => s + o.grandTotal, 0);
        const autoUpiSales = todayCompletedOrders
          .filter((o) => o.paymentMethod === 'UPI')
          .reduce((s, o) => s + o.grandTotal, 0);
        const autoCardSales = todayCompletedOrders
          .filter((o) => o.paymentMethod === 'Card')
          .reduce((s, o) => s + o.grandTotal, 0);
        const autoOtherSales = todayCompletedOrders
          .filter(
            (o) =>
              o.paymentMethod !== 'Cash' &&
              o.paymentMethod !== 'UPI' &&
              o.paymentMethod !== 'Card'
          )
          .reduce((s, o) => s + o.grandTotal, 0);
        const autoTotalDiscounts = todayCompletedOrders.reduce(
          (s, o) => s + (o.discountAmount || 0),
          0
        );
        const autoTotalGst = todayCompletedOrders.reduce((s, o) => s + (o.totalTax || 0), 0);
        const autoRefunds = todayCompletedOrders
          .filter((o) => o.orderStatus === 'Cancelled')
          .reduce((s, o) => s + o.grandTotal, 0);
        const autoNetSales = Math.max(0, autoTotalSales - autoRefunds);
        const todayExpensesTotal = expenses
          .filter((e) => (e.date || '').slice(0, 10) === todayStr)
          .reduce((s, e) => s + e.amount, 0);
        const expectedCash = autoCashSales;
        const physicalCashNum = Number(dailyPhysicalCash) || expectedCash;
        const cashDiff = physicalCashNum - expectedCash;

        return (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 space-y-5 sm:space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  End-of-Day Register & Real-Time Cash Reconciliation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automatically aggregated from completed orders on {todayStr} and synced with Supabase.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold text-xs border border-teal-200 dark:border-teal-800 self-start sm:self-auto">
                {autoOrderCount} Orders Today
              </span>
            </div>

            {/* 10 Tracked Daily Sales Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1">1. Total Sales</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {formatINR(autoTotalSales)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1">2. Number of Orders</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {autoOrderCount}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1">3. Cash Sales</span>
                <span className="text-base font-bold text-emerald-600">
                  {formatINR(autoCashSales)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1">4. UPI Sales</span>
                <span className="text-base font-bold text-blue-600">
                  {formatINR(autoUpiSales)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1">5. Card Sales</span>
                <span className="text-base font-bold text-indigo-600">
                  {formatINR(autoCardSales)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1">6. Other Payments</span>
                <span className="text-base font-bold text-slate-700 dark:text-slate-300">
                  {formatINR(autoOtherSales)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1">7. Discounts Given</span>
                <span className="text-base font-bold text-amber-600">
                  {formatINR(autoTotalDiscounts)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1">8. GST Collected</span>
                <span className="text-base font-bold text-teal-600">
                  {formatINR(autoTotalGst)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1">9. Refunds / Returns</span>
                <span className="text-base font-bold text-rose-600">
                  {formatINR(autoRefunds)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1">10. Net Sales</span>
                <span className="text-base font-bold text-teal-700 dark:text-teal-300">
                  {formatINR(autoNetSales)}
                </span>
              </div>
            </div>

            {/* Reconciliation inputs */}
            <div className="space-y-3 text-xs pt-3 border-t border-slate-100 dark:border-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">
                    Physical Cash in Drawer (₹)
                  </label>
                  <input
                    type="number"
                    value={dailyPhysicalCash || (expectedCash > 0 ? expectedCash : '')}
                    onChange={(e) => setDailyPhysicalCash(e.target.value)}
                    placeholder={`Expected: ₹${expectedCash}`}
                    className="w-full min-h-[44px] p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-bold font-mono text-slate-900 dark:text-white text-xs"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Expected cash: {formatINR(expectedCash)} • Difference:{' '}
                    <span
                      className={`font-bold ${
                        cashDiff === 0
                          ? 'text-emerald-600'
                          : cashDiff > 0
                          ? 'text-blue-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {cashDiff >= 0 ? `+${formatINR(cashDiff)}` : `-${formatINR(Math.abs(cashDiff))}`}
                    </span>
                  </span>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Daily Log / Closing Notes</label>
                  <textarea
                    rows={2}
                    value={dailyNotes}
                    onChange={(e) => setDailyNotes(e.target.value)}
                    placeholder="Physical cash verified against counter receipts, notes on shift handover..."
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  saveDailyTask({
                    date: todayStr,
                    totalCounterSales: autoTotalSales,
                    onlineSales: autoUpiSales + autoCardSales + autoOtherSales,
                    cashSales: autoCashSales,
                    totalExpenses: todayExpensesTotal,
                    physicalCashInDrawer: physicalCashNum,
                    cashDifference: cashDiff,
                    closedBy: currentAdminUser?.name || shopSettings.ownerName,
                    notes: dailyNotes || 'End of day closing record',
                    total_orders: autoOrderCount,
                    upi_sales: autoUpiSales,
                    card_sales: autoCardSales,
                    other_sales: autoOtherSales,
                    total_discounts: autoTotalDiscounts,
                    total_gst: autoTotalGst,
                    refunds: autoRefunds,
                    net_sales: autoNetSales,
                  });
                }}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition shadow-xs text-center cursor-pointer touch-manipulation flex items-center justify-center"
              >
                Save & Finalize Today's Register to Supabase
              </button>
            </div>
          </div>
        );
      })()}

      {/* TAB 8: GST & SALES REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  GST Sales & Inward Register Exports
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate Indian GSTR-1 compliant CSV data and export to Google Drive or download.
                </p>
              </div>

              <button
                onClick={() => {
                  const csvHeaders =
                    'Invoice No,Date,Customer Name,Customer GSTIN,Taxable Value,CGST,SGST,IGST,Total Amount\n';
                  const csvRows = orders
                    .map(
                      (o) =>
                        `"${o.invoiceNumber}","${o.orderDate.slice(0, 10)}","${o.customer.name}","${
                          o.customer.gstin || 'B2C'
                        }",${o.taxableAmount},${o.cgst},${o.sgst},${o.igst},${o.grandTotal}`
                    )
                    .join('\n');
                  handleExportDriveReport('GSTR1_Sales_Register', csvHeaders + csvRows);
                }}
                className="w-full sm:w-auto min-h-[44px] justify-center px-4 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer touch-manipulation"
              >
                <CloudUpload className="w-4 h-4 shrink-0" />
                <span>Save GSTR-1 Report to Google Drive</span>
              </button>
            </div>

            {/* Micro GSTR-1 Preview */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Current Period GSTR-1 Summary:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Total Invoices</span>
                  <span className="font-bold text-sm">{orders.length}</span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Taxable Sales</span>
                  <span className="font-bold text-sm">
                    {formatINR(orders.reduce((s, o) => s + o.taxableAmount, 0))}
                  </span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Total CGST + SGST</span>
                  <span className="font-bold text-sm">
                    {formatINR(orders.reduce((s, o) => s + o.cgst + o.sgst, 0))}
                  </span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Total IGST</span>
                  <span className="font-bold text-sm">
                    {formatINR(orders.reduce((s, o) => s + o.igst, 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: SHOP SETTINGS CONFIG (Configurable Shop Profile) */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Supabase Database Connection & Cloud Control Card */}
          <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-transparent dark:from-teal-950/40 dark:via-emerald-950/30 rounded-2xl border border-teal-200 dark:border-teal-800/60 p-4 sm:p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-xs shrink-0 mt-0.5">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                      Shop Settings & Cloud Synchronization
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Supabase Sync Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                    Project ID: <span className="font-bold text-teal-600 dark:text-teal-400">{supabaseProjectId}</span> | Table: <span className="font-semibold text-slate-700 dark:text-slate-200">shop_settings</span> (ID: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">default_shop</code>)
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Updates here immediately reflect across website headers, order receipts, WhatsApp messaging, and GST Tax Invoices.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    setIsRefreshingShopSettings(true);
                    try {
                      const success = await refreshShopSettingsFromSupabase();
                      if (success) {
                        setShopSettingsNotice('Settings pulled freshly from Supabase!');
                        setTimeout(() => setShopSettingsNotice(null), 4000);
                      }
                    } finally {
                      setIsRefreshingShopSettings(false);
                    }
                  }}
                  disabled={isRefreshingShopSettings}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  title="Reload settings from Supabase database"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isRefreshingShopSettings ? 'animate-spin text-teal-600' : ''}`} />
                  <span>{isRefreshingShopSettings ? 'Pulling...' : 'Pull from Supabase'}</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('Reset all shop settings to recommended defaults? This will update local storage and Supabase cloud.')) {
                      setIsResettingShopSettings(true);
                      try {
                        await resetShopSettingsToDefault();
                        setSettingsForm(getNormalizedShopForm(initialShopSettings));
                        setShopSettingsNotice('Restored to recommended defaults!');
                        setTimeout(() => setShopSettingsNotice(null), 4000);
                      } finally {
                        setIsResettingShopSettings(false);
                      }
                    }
                  }}
                  disabled={isResettingShopSettings}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center gap-1.5 transition cursor-pointer"
                  title="Reset all settings to initial defaults"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>{isResettingShopSettings ? 'Resetting...' : 'Reset to Defaults'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => syncWithSupabase()}
                  disabled={isSupabaseSyncing}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
                  title="Full sync of all tables"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isSupabaseSyncing ? 'animate-spin text-teal-600' : ''}`} />
                  <span>Sync All Tables</span>
                </button>
              </div>
            </div>

            {shopSettingsNotice && (
              <div className="mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{shopSettingsNotice}</span>
              </div>
            )}
          </div>

          {/* Quick Category Navigation Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            {[
              { id: 'all', label: 'All Settings', icon: Store },
              { id: 'identity', label: 'Store Identity & Branding', icon: Palette },
              { id: 'contact', label: 'Contact & Timings', icon: Phone },
              { id: 'tax', label: 'Location & GST Profile', icon: Building },
              { id: 'bank', label: 'Bank & UPI Payments', icon: CreditCard },
              { id: 'razorpay', label: 'Razorpay Gateway', icon: Shield },
              { id: 'invoicing', label: 'Invoicing & Terms', icon: Receipt },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSettingsSection === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSettingsSection(tab.id as any)}
                  className={`px-3 py-2 rounded-xl font-semibold flex items-center gap-1.5 shrink-0 transition cursor-pointer ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Live Preview Card */}
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Live Preview: Header & Tax Invoice Header
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Updates live as you type below</span>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={settingsForm.shopLogo || 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=200&h=200&q=80'}
                    alt="Store Logo"
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=200&h=200&q=80';
                    }}
                  />
                  <div>
                    <h4
                      className="text-base sm:text-lg font-black tracking-tight"
                      style={{ color: settingsForm.primaryBrandColor || '#0f766e' }}
                    >
                      {settingsForm.shopName || 'ABC Paper & Stationery'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {settingsForm.tagline || 'Order Tracking, GST Invoicing & Premium Stationery'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Proprietor: <span className="font-semibold text-slate-700 dark:text-slate-200">{settingsForm.ownerName || 'Mr. Anand Agrawal'}</span>
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right text-xs space-y-1">
                  <div className="inline-block px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700 font-mono text-[11px]">
                    GSTIN: <span className="font-bold text-teal-700 dark:text-teal-300">{settingsForm.gstin || '22AABCA1234F1Z9'}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    State Code: <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{settingsForm.stateCode || '22'}</span> ({settingsForm.state || 'Chhattisgarh'})
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Invoice Sample: <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{settingsForm.invoicePrefix || 'ABC/26-27/'}{settingsForm.invoiceNumberStartingValue || 1001}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="truncate max-w-xs sm:max-w-md">
                    {settingsForm.shopAddress}, {settingsForm.city}, {settingsForm.state} - {settingsForm.pinCode}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span>📞 {settingsForm.phoneNumber}</span>
                  <span>💬 WA: {settingsForm.whatsAppNumber}</span>
                  {settingsForm.upiId && <span className="text-teal-600 dark:text-teal-400">⚡ UPI: {settingsForm.upiId}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsSavingShopSettings(true);
              try {
                const res = await updateShopSettings(settingsForm);
                if (res.success) {
                  setShopSettingsNotice('Shop Profile successfully saved to Supabase & local storage!');
                } else {
                  setShopSettingsNotice('Saved locally. (Supabase cloud notice: ' + (res.error || 'Check network') + ')');
                }
                setTimeout(() => setShopSettingsNotice(null), 5000);
              } finally {
                setIsSavingShopSettings(false);
              }
            }}
            className="space-y-3.5 sm:space-y-4 text-xs"
          >
            {/* SECTION 1: STORE IDENTITY & BRANDING */}
            {(activeSettingsSection === 'all' || activeSettingsSection === 'identity') && (
              <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 sm:p-4.5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2.5">
                  <Palette className="w-3.5 h-3.5 text-teal-600" />
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                    1. Store Identity & Visual Branding
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Shop Name *</label>
                    <input
                      type="text"
                      required
                      value={settingsForm.shopName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, shopName: e.target.value })}
                      placeholder="e.g. ABC Paper & Stationery"
                      className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-bold text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Tagline / Slogan</label>
                    <input
                      type="text"
                      value={settingsForm.tagline}
                      onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                      placeholder="e.g. Order Tracking, GST Invoicing & Premium Stationery"
                      className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Website Name / Domain</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-2.5 rounded-l-lg border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs">
                        https://
                      </span>
                      <input
                        type="text"
                        value={settingsForm.websiteName}
                        onChange={(e) => setSettingsForm({ ...settingsForm, websiteName: e.target.value })}
                        placeholder="abcpapers.com"
                        className="w-full px-2.5 py-1.5 sm:py-2 rounded-r-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono text-xs sm:text-sm text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Logo URL with Presets */}
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Shop Logo URL</label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
                      <img
                        src={settingsForm.shopLogo || PRESET_LOGOS[0].url}
                        alt="Logo preview"
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                      <input
                        type="url"
                        value={settingsForm.shopLogo}
                        onChange={(e) => setSettingsForm({ ...settingsForm, shopLogo: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-medium">Quick logo presets:</span>
                      {PRESET_LOGOS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setSettingsForm({ ...settingsForm, shopLogo: preset.url })}
                          className={`px-2 py-0.5 rounded-md text-[11px] border transition cursor-pointer flex items-center gap-1 ${
                            settingsForm.shopLogo === preset.url
                              ? 'bg-teal-50 border-teal-500 text-teal-800 dark:bg-teal-950 dark:text-teal-200 font-bold'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <span>{preset.label}</span>
                          {settingsForm.shopLogo === preset.url && <Check className="w-3 h-3 text-teal-600" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Colors & Themes */}
                  <div className="sm:col-span-2 lg:col-span-3 pt-1">
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Brand Theme Colors</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1">Primary Color (Header / Invoices)</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={settingsForm.primaryBrandColor || '#0f766e'}
                            onChange={(e) => setSettingsForm({ ...settingsForm, primaryBrandColor: e.target.value })}
                            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 bg-white dark:bg-slate-800 shrink-0"
                          />
                          <input
                            type="text"
                            value={settingsForm.primaryBrandColor || '#0f766e'}
                            onChange={(e) => setSettingsForm({ ...settingsForm, primaryBrandColor: e.target.value })}
                            className="w-28 px-2 py-1.5 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono text-xs uppercase text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1">Accent Color (Badges / Highlights)</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={settingsForm.accentColor || '#f59e0b'}
                            onChange={(e) => setSettingsForm({ ...settingsForm, accentColor: e.target.value })}
                            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 bg-white dark:bg-slate-800 shrink-0"
                          />
                          <input
                            type="text"
                            value={settingsForm.accentColor || '#f59e0b'}
                            onChange={(e) => setSettingsForm({ ...settingsForm, accentColor: e.target.value })}
                            className="w-28 px-2 py-1.5 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono text-xs uppercase text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-medium">Theme presets:</span>
                      {PRESET_THEMES.map((theme) => (
                        <button
                          key={theme.name}
                          type="button"
                          onClick={() =>
                            setSettingsForm({
                              ...settingsForm,
                              primaryBrandColor: theme.primary,
                              accentColor: theme.accent,
                            })
                          }
                          className="px-2 py-0.5 rounded-md text-[11px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer transition"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                            style={{ backgroundColor: theme.primary }}
                          />
                          <span>{theme.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: CONTACT & OPERATING DETAILS */}
            {(activeSettingsSection === 'all' || activeSettingsSection === 'contact') && (
              <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 sm:p-4.5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2.5">
                  <Phone className="w-3.5 h-3.5 text-teal-600" />
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                    2. Owner, Communication & Working Hours
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Owner / Proprietor Name</label>
                    <input
                      type="text"
                      value={settingsForm.ownerName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, ownerName: e.target.value })}
                      placeholder="e.g. Mr. Anand Agrawal"
                      className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Shop Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={settingsForm.phoneNumber}
                      onChange={(e) => setSettingsForm({ ...settingsForm, phoneNumber: e.target.value })}
                      placeholder="+91 98271 23456"
                      className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">WhatsApp Business Number *</label>
                    <input
                      type="tel"
                      required
                      value={settingsForm.whatsAppNumber}
                      onChange={(e) => setSettingsForm({ ...settingsForm, whatsAppNumber: e.target.value })}
                      placeholder="+91 98271 23456"
                      className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Used for one-click order placement & updates</span>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Email Address</label>
                    <input
                      type="email"
                      value={settingsForm.emailAddress}
                      onChange={(e) => setSettingsForm({ ...settingsForm, emailAddress: e.target.value })}
                      placeholder="contact@abcpapers.com"
                      className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Opening & Support Hours</label>
                    <input
                      type="text"
                      value={settingsForm.openingHours}
                      onChange={(e) => setSettingsForm({ ...settingsForm, openingHours: e.target.value })}
                      placeholder="Mon - Sat: 9:00 AM – 9:30 PM | Sunday: 10:00 AM – 2:00 PM"
                      className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: LOCATION & GST PROFILE */}
            {(activeSettingsSection === 'all' || activeSettingsSection === 'tax') && (
              <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 sm:p-4.5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2.5">
                  <Building className="w-3.5 h-3.5 text-teal-600" />
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                    3. Store Address, GSTIN & Tax Compliance Profile
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Shop Address (Physical Store)</label>
                    <input
                      type="text"
                      value={settingsForm.shopAddress}
                      onChange={(e) => setSettingsForm({ ...settingsForm, shopAddress: e.target.value })}
                      placeholder="Shop No. 12-14, Ground Floor, Sharda Complex, Pandri Market"
                      className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">City</label>
                    <input
                      type="text"
                      value={settingsForm.city}
                      onChange={(e) => setSettingsForm({ ...settingsForm, city: e.target.value })}
                      placeholder="Raipur"
                      className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">State (GST Home State) *</label>
                    <div className="space-y-1">
                      <select
                        value={INDIAN_STATES_GST.find((s) => s.name.toLowerCase() === settingsForm.state.toLowerCase())?.code || ''}
                        onChange={(e) => {
                          const matched = INDIAN_STATES_GST.find((s) => s.code === e.target.value);
                          if (matched) {
                            setSettingsForm({
                              ...settingsForm,
                              state: matched.name,
                              stateCode: matched.code,
                            });
                          }
                        }}
                        className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-semibold text-xs sm:text-sm text-slate-900 dark:text-white"
                      >
                        <option value="">Select Indian State (Auto-syncs GST code)</option>
                        {INDIAN_STATES_GST.map((item) => (
                          <option key={item.code} value={item.code}>
                            {item.name} ({item.code})
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={settingsForm.state}
                        onChange={(e) => setSettingsForm({ ...settingsForm, state: e.target.value })}
                        placeholder="State name"
                        className="w-full px-2.5 py-1 sm:py-1.5 rounded-md border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">PIN Code</label>
                    <input
                      type="text"
                      value={settingsForm.pinCode}
                      onChange={(e) => setSettingsForm({ ...settingsForm, pinCode: e.target.value })}
                      placeholder="492004"
                      className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">GST State Code (2-Digit)</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={settingsForm.stateCode}
                      onChange={(e) => setSettingsForm({ ...settingsForm, stateCode: e.target.value })}
                      placeholder="22"
                      className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Determines CGST+SGST vs IGST calculation</span>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Shop GSTIN (15 Characters) *</label>
                    <input
                      type="text"
                      required
                      maxLength={15}
                      value={settingsForm.gstin}
                      onChange={(e) => setSettingsForm({ ...settingsForm, gstin: e.target.value.toUpperCase() })}
                      placeholder="22AABCA1234F1Z9"
                      className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono uppercase font-bold text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Printed on all Tax Invoices & customer bills</span>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">PAN Number (10 Characters)</label>
                    <input
                      type="text"
                      maxLength={10}
                      value={settingsForm.panNumber}
                      onChange={(e) => setSettingsForm({ ...settingsForm, panNumber: e.target.value.toUpperCase() })}
                      placeholder="AABCA1234F"
                      className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono uppercase text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Business Registration / UDYAM</label>
                    <input
                      type="text"
                      value={settingsForm.businessRegistrationNumber}
                      onChange={(e) => setSettingsForm({ ...settingsForm, businessRegistrationNumber: e.target.value })}
                      placeholder="UDYAM-CG-03-0012345"
                      className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 4: BANK & UPI QR PAYMENT SETUP */}
            {(activeSettingsSection === 'all' || activeSettingsSection === 'bank') && (
              <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 sm:p-4.5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2.5">
                  <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                    4. Direct UPI QR & Bank Settlement Account
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Shop UPI ID (For Direct Scan-to-Pay QR)</label>
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 shrink-0">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={settingsForm.upiId}
                        onChange={(e) => setSettingsForm({ ...settingsForm, upiId: e.target.value })}
                        placeholder="e.g. abcpaper@okhdfcbank"
                        className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white"
                      />
                    </div>
                    {settingsForm.upiId && (
                      <p className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5 font-mono">
                        UPI QR Link: upi://pay?pa={settingsForm.upiId}&pn={encodeURIComponent(settingsForm.shopName || 'Store')}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Bank Name</label>
                    <input
                      type="text"
                      value={settingsForm.bankName || settingsForm.bankDetails?.bankName || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSettingsForm({
                          ...settingsForm,
                          bankName: val,
                          bankDetails: {
                            ...(settingsForm.bankDetails || {}),
                            bankName: val,
                            accountNumber: settingsForm.bankAccountNumber || '',
                            ifscCode: settingsForm.bankIfsc || '',
                            branch: settingsForm.bankBranch || '',
                          },
                        });
                      }}
                      placeholder="e.g. HDFC Bank Ltd"
                      className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Bank Account Number</label>
                    <input
                      type="text"
                      value={settingsForm.bankAccountNumber || settingsForm.bankDetails?.accountNumber || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSettingsForm({
                          ...settingsForm,
                          bankAccountNumber: val,
                          bankDetails: {
                            ...(settingsForm.bankDetails || {}),
                            bankName: settingsForm.bankName || '',
                            accountNumber: val,
                            ifscCode: settingsForm.bankIfsc || '',
                            branch: settingsForm.bankBranch || '',
                          },
                        });
                      }}
                      placeholder="50200012345678"
                      className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">IFSC Code (11 Characters)</label>
                    <input
                      type="text"
                      maxLength={11}
                      value={settingsForm.bankIfsc || settingsForm.bankDetails?.ifscCode || ''}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setSettingsForm({
                          ...settingsForm,
                          bankIfsc: val,
                          bankDetails: {
                            ...(settingsForm.bankDetails || {}),
                            bankName: settingsForm.bankName || '',
                            accountNumber: settingsForm.bankAccountNumber || '',
                            ifscCode: val,
                            branch: settingsForm.bankBranch || '',
                          },
                        });
                      }}
                      placeholder="HDFC0001234"
                      className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono uppercase font-bold text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Bank Branch Location</label>
                    <input
                      type="text"
                      value={settingsForm.bankBranch || settingsForm.bankDetails?.branch || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSettingsForm({
                          ...settingsForm,
                          bankBranch: val,
                          bankDetails: {
                            ...(settingsForm.bankDetails || {}),
                            bankName: settingsForm.bankName || '',
                            accountNumber: settingsForm.bankAccountNumber || '',
                            ifscCode: settingsForm.bankIfsc || '',
                            branch: val,
                          },
                        });
                      }}
                      placeholder="Main Station Road Branch, Raipur"
                      className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 4B: RAZORPAY PAYMENT GATEWAY CONFIGURATION */}
            {(activeSettingsSection === 'all' || activeSettingsSection === 'razorpay' || activeSettingsSection === 'bank') && (
              <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl border border-indigo-200 dark:border-indigo-900/60 p-3.5 sm:p-5 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 dark:border-indigo-900/40 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                      ₹
                    </div>
                    <div>
                      <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <span>1. Razorpay UPI & Gateway Setup</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          Primary UPI Setup
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Zero-wait UPI payments (GPay, PhonePe, Paytm, BHIM QR) + Debit/Credit Cards & NetBanking
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={checkRazorpayGatewayStatus}
                      disabled={isTestingGateway}
                      className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isTestingGateway ? 'animate-spin' : ''}`} />
                      <span>{isTestingGateway ? 'Testing...' : 'Test Gateway Status'}</span>
                    </button>
                  </div>
                </div>

                {/* Gateway Toggle Switch */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                  <div>
                    <label htmlFor="toggle-razorpay-enabled" className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block cursor-pointer">
                      Enable Razorpay Gateway at Checkout
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      When enabled, customers can pay directly on the store using Razorpay Standard Checkout
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      id="toggle-razorpay-enabled"
                      type="checkbox"
                      checked={settingsForm.enableRazorpay !== false}
                      onChange={(e) => setSettingsForm({ ...settingsForm, enableRazorpay: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Status Indicator & Environment Variable Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="p-3.5 rounded-xl bg-linear-to-br from-slate-50 to-indigo-50/30 dark:from-slate-900 dark:to-indigo-950/20 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Gateway Backend Mode</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        razorpayGatewayStatus?.isConfigured
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300'
                      }`}>
                        {razorpayGatewayStatus?.isConfigured
                          ? `Active (${razorpayGatewayStatus.mode.toUpperCase()})`
                          : 'Sandbox Test Mode Active'}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] font-mono">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>RAZORPAY_KEY_ID:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {razorpayGatewayStatus?.keyId ? `${razorpayGatewayStatus.keyId.slice(0, 8)}...` : 'Using Sandbox Simulator'}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>RAZORPAY_KEY_SECRET:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {razorpayGatewayStatus?.isConfigured ? '•••••••••••• (Secured on Server)' : 'Sandbox Verification Active'}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Webhook Route:</span>
                        <span className="text-indigo-600 dark:text-indigo-400">/api/payment/razorpay/webhook</span>
                      </div>
                    </div>
                  </div>

                  {/* Setup instructions box */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      How to configure your live or test keys:
                    </span>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                      <li>Log in to your Razorpay Dashboard at <strong>dashboard.razorpay.com</strong>.</li>
                      <li>Navigate to <strong>Account & Settings → API Keys</strong>.</li>
                      <li>Generate a Test Key (starts with <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600">rzp_test_...</code>) or Live Key.</li>
                      <li>Set <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600">RAZORPAY_KEY_ID</code> and <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600">RAZORPAY_KEY_SECRET</code> in the project Settings / Secrets.</li>
                    </ol>
                  </div>
                </div>

                {/* Supported Payment Channels */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                    Customer Payment Modes Enabled:
                  </span>
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/80 font-bold text-slate-700 dark:text-slate-200">
                      ⚡ UPI (Google Pay, PhonePe, Paytm, BHIM, Cred)
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/80 font-bold text-slate-700 dark:text-slate-200">
                      💳 Credit & Debit Cards (RuPay, Visa, Mastercard, Maestro)
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/80 font-bold text-slate-700 dark:text-slate-200">
                      🏦 NetBanking (50+ Indian Banks)
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/80 font-bold text-slate-700 dark:text-slate-200">
                      👛 Wallets (Paytm, Mobikwik, PhonePe)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 5: INVOICING & TERMS */}
            {(activeSettingsSection === 'all' || activeSettingsSection === 'invoicing') && (
              <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 sm:p-4.5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2.5">
                  <Receipt className="w-3.5 h-3.5 text-teal-600" />
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                    5. GST Invoice Formatting & Printed Terms
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Invoice Prefix *</label>
                    <input
                      type="text"
                      required
                      value={settingsForm.invoicePrefix}
                      onChange={(e) => setSettingsForm({ ...settingsForm, invoicePrefix: e.target.value })}
                      placeholder="ABC/26-27/"
                      className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono uppercase font-bold text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">e.g. ABC/26-27/ will generate ABC/26-27/1001</span>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Invoice Starting Value</label>
                    <input
                      type="number"
                      min={1}
                      value={settingsForm.invoiceNumberStartingValue}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          invoiceNumberStartingValue: parseInt(e.target.value) || 1001,
                        })
                      }
                      className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Printed Terms & Conditions (On Invoices & Bills)</label>
                    <textarea
                      rows={3}
                      value={settingsForm.termsAndConditions}
                      onChange={(e) => setSettingsForm({ ...settingsForm, termsAndConditions: e.target.value })}
                      placeholder="1. Goods once sold will be replaced within 3 days if defective in original packaging..."
                      className="w-full px-2.5 py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                <span>Database Status: </span>
                <span className="font-semibold text-emerald-600">Syncs directly to Supabase cloud table & local cache</span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="submit"
                  disabled={isSavingShopSettings}
                  className="w-full sm:w-auto min-h-[38px] px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
                >
                  {isSavingShopSettings ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving & Syncing to Cloud...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save Shop Profile & Sync Cloud</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* TAB 10: STAFF & RBAC TEAM MANAGEMENT */}
      {activeTab === 'staff' && <StaffManagementTab />}

      {/* Super Admin Credentials & Password Change Modal */}
      {showSuperAdminCredentialsModal && (
        <SuperAdminCredentialsModal
          onClose={() => setShowSuperAdminCredentialsModal(false)}
        />
      )}
    </div>
  );
};
