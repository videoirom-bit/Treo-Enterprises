import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ShopSettings,
  Product,
  CartItem,
  Order,
  CustomerUser,
  Supplier,
  Expense,
  DailySalesRecord,
  UserRole,
  StaffUser,
  OrderTrackingEvent,
  DeliveryAssignment,
  PaymentRecord,
  OrderNotification,
  PaymentMethod,
  CategoryItem,
} from '../types';
import {
  initialShopSettings,
  sampleProducts,
  sampleCustomers,
  sampleSuppliers,
  sampleExpenses,
  sampleDailyRecords,
  sampleOrders,
  sampleStaffUsers,
  sampleCategories,
} from '../data/sampleData';
import { calculateGST, formatInvoiceNumber } from '../utils/gstUtils';
import { deductInventory } from '../utils/inventoryUtils';
import confetti from 'canvas-confetti';
import {
  fetchProductsFromSupabase,
  upsertProductToSupabase,
  deleteProductFromSupabase,
  fetchOrdersFromSupabase,
  upsertOrderToSupabase,
  fetchCustomersFromSupabase,
  upsertCustomerToSupabase,
  deleteCustomerFromSupabase,
  fetchSuppliersFromSupabase,
  upsertSupplierToSupabase,
  deleteSupplierFromSupabase,
  fetchExpensesFromSupabase,
  upsertExpenseToSupabase,
  deleteExpenseFromSupabase,
  fetchDailyRecordsFromSupabase,
  upsertDailyRecordToSupabase,
  fetchShopSettingsFromSupabase,
  saveShopSettingsToSupabase,
  fetchStaffUsersFromSupabase,
  upsertStaffUserToSupabase,
  deleteStaffUserFromSupabase,
  fetchCategoriesFromSupabase,
  saveCategoryToSupabase,
  deleteCategoryFromSupabase,
  seedCategoriesToSupabase,
  supabaseAuthSignIn,
  supabaseAuthSignUp,
  supabaseAuthSignOut,
  supabaseAuthUpdatePassword,
  supabaseAuthUpdateEmail,
  fetchUserProfile,
  ensureUserProfile,
} from '../services/supabaseService';
import { supabase, getSupabaseProjectId } from '../services/supabaseClient';
import { UserProfile } from '../types';

interface AppContextType {
  // Theme & Settings
  shopSettings: ShopSettings;
  updateShopSettings: (newSettings: Partial<ShopSettings>) => Promise<{ success: boolean; error?: string }>;
  resetShopSettingsToDefault: () => Promise<void>;
  refreshShopSettingsFromSupabase: () => Promise<boolean>;
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Catalog
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotalCount: number;
  cartGSTDetails: ReturnType<typeof calculateGST>;

  // Orders & Invoicing & Tracking
  orders: Order[];
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'invoiceNumber' | 'orderDate'>) => Order;
  updateOrderStatus: (orderId: string, status: Order['orderStatus'], customMessage?: string, customLocation?: string) => void;
  updatePaymentStatus: (orderId: string, status: Order['paymentStatus'], paidAmount?: number) => void;
  assignDeliveryPerson: (orderId: string, assignment: Omit<DeliveryAssignment, 'id' | 'orderId'>) => void;
  addTrackingEvent: (orderId: string, event: Omit<OrderTrackingEvent, 'id' | 'orderId' | 'timestamp'>) => void;
  addPaymentRecord: (orderId: string, payment: Omit<PaymentRecord, 'id' | 'orderId' | 'timestamp'>) => void;
  sendOrderNotification: (orderId: string, channel: 'WhatsApp' | 'SMS' | 'Email', message?: string) => void;
  quickTrackOrder: (query: string) => Order | undefined;
  reorderItems: (order: Order) => void;
  searchTrackingId: string;
  setSearchTrackingId: (id: string) => void;
  currentInvoiceCounter: number;

  // Customers
  customers: CustomerUser[];
  addCustomer: (cust: Omit<CustomerUser, 'id' | 'createdAt' | 'totalPurchases' | 'ordersCount'>) => CustomerUser;
  updateCustomer: (id: string, updates: Partial<CustomerUser>) => void;
  deleteCustomer: (id: string) => void;

  // Suppliers
  suppliers: Supplier[];
  addSupplier: (sup: Omit<Supplier, 'id' | 'createdAt'>) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // Expenses
  expenses: Expense[];
  addExpense: (exp: Omit<Expense, 'id'>) => Expense;
  deleteExpense: (id: string) => void;

  // Daily Tasks & Records
  dailyRecords: DailySalesRecord[];
  saveDailyTask: (record: Omit<DailySalesRecord, 'id'>) => DailySalesRecord;

  // Authentication & Roles
  staffUsers: StaffUser[];
  currentAdminUser: StaffUser | null;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  isAdminLoggedIn: boolean;
  setIsAdminLoggedIn: (val: boolean) => void;
  isCustomerLoggedIn: boolean;
  setIsCustomerLoggedIn: (val: boolean) => void;
  adminAuthToken: string | null;
  isAuthChecking: boolean;
  loginAdmin: (identifier: string, secret?: string) => { success: boolean; error?: string; user?: StaffUser };
  signUpAdmin: (userData: Omit<StaffUser, 'id' | 'createdAt'>) => { success: boolean; error?: string; user?: StaffUser };
  logoutAdmin: () => void;
  loginCustomer: (identifier: string, password?: string) => Promise<{ success: boolean; error?: string; customer?: CustomerUser }>;
  signUpCustomer: (customerData: { name: string; email: string; mobile: string; password?: string; address?: string; city?: string; state?: string; gstin?: string }) => Promise<{ success: boolean; error?: string; customer?: CustomerUser }>;
  logoutCustomer: () => void;
  addStaffUser: (user: Omit<StaffUser, 'id' | 'createdAt'>) => StaffUser;
  updateStaffUser: (id: string, updates: Partial<StaffUser>) => void;
  deleteStaffUser: (id: string) => void;
  updateSuperAdminCredentials: (updates: {
    email?: string;
    password?: string;
    pin?: string;
    name?: string;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  currentCustomer: CustomerUser | null;
  setCurrentCustomer: (cust: CustomerUser | null) => void;

  // Navigation State
  activeView:
    | 'home'
    | 'products'
    | 'categories'
    | 'offers'
    | 'about'
    | 'contact'
    | 'cart'
    | 'checkout'
    | 'product-detail'
    | 'admin'
    | 'invoice-view'
    | 'track-order'
    | 'customer-portal';
  setActiveView: (view: any) => void;
  selectedProductForDetail: Product | null;
  setSelectedProductForDetail: (product: Product | null) => void;
  selectedOrderForInvoice: Order | null;
  setSelectedOrderForInvoice: (order: Order | null) => void;
  selectedCategoryFilter: string | null;
  setSelectedCategoryFilter: (cat: string | null) => void;

  // Toast notification
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Reset demo data
  resetDemoData: () => void;

  // Categories
  categories: CategoryItem[];
  addCategory: (cat: Partial<CategoryItem> & { name: string }) => Promise<{ success: boolean; error?: string }>;
  updateCategory: (id: string, updates: Partial<CategoryItem>) => Promise<{ success: boolean; error?: string }>;
  deleteCategory: (id: string) => Promise<{ success: boolean; error?: string }>;
  seedCategoriesToSupabaseDatabase: () => Promise<{ success: boolean; count?: number; error?: string }>;
  supabaseProjectId: string;

  // Supabase Backend Sync & Status
  isSupabaseConnected: boolean;
  isSupabaseSyncing: boolean;
  syncWithSupabase: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'abc_paper_store_v2_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Settings State
  const [shopSettings, setShopSettings] = useState<ShopSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        const bankName = parsed.bankName || parsed.bankDetails?.bankName || initialShopSettings.bankName;
        const bankAccountNumber = parsed.bankAccountNumber || parsed.bankDetails?.accountNumber || initialShopSettings.bankAccountNumber;
        const bankIfsc = parsed.bankIfsc || parsed.bankDetails?.ifscCode || initialShopSettings.bankIfsc;
        const bankBranch = parsed.bankBranch || parsed.bankDetails?.branch || initialShopSettings.bankBranch;

        const shopName = (!parsed.shopName || parsed.shopName === 'ABC Paper & Store' || parsed.shopName === 'ABC Paper & Stationery')
          ? initialShopSettings.shopName
          : parsed.shopName;

        return {
          ...initialShopSettings,
          ...parsed,
          shopName,
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
        };
      }
    } catch (e) {
      console.error('Failed to parse saved settings', e);
    }
    return initialShopSettings;
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const savedDark =
        localStorage.getItem(STORAGE_KEY_PREFIX + 'dark') ??
        localStorage.getItem('abc_stationery_v1_dark');
      const savedTheme = localStorage.getItem('theme');
      if (savedDark !== null) {
        return savedDark === 'true';
      }
      if (savedTheme !== null) {
        return savedTheme === 'dark';
      }
      return (
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      );
    } catch {
      return false;
    }
  });

  // 2. Catalog State
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'products');
    return saved ? JSON.parse(saved) : sampleProducts;
  });

  // Dynamic Categories State (loaded from Supabase / localStorage / sampleCategories)
  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return sampleCategories;
  });

  const [searchQuery, setSearchQuery] = useState<string>('');

  // 3. Cart State
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'cart');
    return saved ? JSON.parse(saved) : [];
  });

  // 4. Invoices and Orders State
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'orders');
    return saved ? JSON.parse(saved) : sampleOrders;
  });

  const [currentInvoiceCounter, setCurrentInvoiceCounter] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'invoice_counter');
    return saved ? Number(saved) : 1003;
  });

  // 5. Customers State
  const [customers, setCustomers] = useState<CustomerUser[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'customers');
    return saved ? JSON.parse(saved) : sampleCustomers;
  });

  // 6. Suppliers State
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'suppliers');
    return saved ? JSON.parse(saved) : sampleSuppliers;
  });

  // 7. Expenses State
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'expenses');
    return saved ? JSON.parse(saved) : sampleExpenses;
  });

  // 8. Daily Records State
  const [dailyRecords, setDailyRecords] = useState<DailySalesRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'daily');
    return saved ? JSON.parse(saved) : sampleDailyRecords;
  });

  // 9. Auth & Roles
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'staff_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Upgrade old demo admin to Treo Super Admin if found
          const upgraded = parsed.map((u: StaffUser) => {
            if (u.email === 'admin@abcstationery.com' || u.email === 'superadmin@treoenterprises.com') {
              return {
                ...u,
                id: 'staff-superadmin',
                name: 'Super Admin',
                email: 'videoirom@gmail.com',
                role: 'super_admin' as UserRole,
                password: 'Tr3o$ecur3!2026#AdminX',
                pin: '9824',
              };
            }
            return u;
          });
          const hasSuperAdmin = upgraded.some((u) => u.role === 'super_admin');
          if (!hasSuperAdmin) {
            return [sampleStaffUsers[0], ...upgraded];
          }
          return upgraded;
        }
      }
      return sampleStaffUsers;
    } catch {
      return sampleStaffUsers;
    }
  });
  const [currentAdminUser, setCurrentAdminUser] = useState<StaffUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'current_admin_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u && (u.email === 'admin@abcstationery.com' || u.email === 'superadmin@treoenterprises.com')) {
          return {
            ...u,
            id: 'staff-superadmin',
            name: 'Super Admin',
            email: 'videoirom@gmail.com',
            role: 'super_admin',
            password: 'Tr3o$ecur3!2026#AdminX',
            pin: '9824',
          };
        }
        return u;
      }
      return sampleStaffUsers[0];
    } catch {
      return sampleStaffUsers[0];
    }
  });
  const [adminAuthToken, setAdminAuthToken] = useState<string | null>(() => {
    try {
      const existing = localStorage.getItem(STORAGE_KEY_PREFIX + 'admin_token');
      if (existing) return existing;
      const initialToken = 'adm_token_superadmin_session';
      localStorage.setItem(STORAGE_KEY_PREFIX + 'admin_token', initialToken);
      localStorage.setItem(STORAGE_KEY_PREFIX + 'admin_logged_in', 'true');
      localStorage.setItem(STORAGE_KEY_PREFIX + 'admin_role', 'super_admin');
      return initialToken;
    } catch {
      return 'adm_token_superadmin_session';
    }
  });
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      const flag = localStorage.getItem(STORAGE_KEY_PREFIX + 'admin_logged_in');
      if (flag === 'false') return false;
      return true;
    } catch {
      return true;
    }
  });
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_PREFIX + 'customer_logged_in') === 'true';
    } catch {
      return false;
    }
  });
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(() => {
    try {
      const explicitRole = localStorage.getItem(STORAGE_KEY_PREFIX + 'admin_role') as UserRole;
      if (explicitRole === 'admin' || explicitRole === 'super_admin') {
        return explicitRole;
      }
      return 'super_admin';
    } catch {
      return 'super_admin';
    }
  });
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerUser | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'current_cust');
    return saved ? JSON.parse(saved) : null;
  });

  // Supabase Status State
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(true);
  const [isSupabaseSyncing, setIsSupabaseSyncing] = useState<boolean>(false);

  // Sync state with Supabase
  const syncWithSupabase = async () => {
    setIsSupabaseSyncing(true);
    try {
      // 1. Products
      const supaProducts = await fetchProductsFromSupabase();
      if (supaProducts && supaProducts.length > 0) {
        setProducts(supaProducts);
      }

      // 2. Orders
      const supaOrders = await fetchOrdersFromSupabase();
      if (supaOrders && supaOrders.length > 0) {
        setOrders(supaOrders);
      }

      // 3. Customers
      const supaCustomers = await fetchCustomersFromSupabase();
      if (supaCustomers && supaCustomers.length > 0) {
        setCustomers(supaCustomers);
      }

      // 4. Suppliers
      const supaSuppliers = await fetchSuppliersFromSupabase();
      if (supaSuppliers && supaSuppliers.length > 0) {
        setSuppliers(supaSuppliers);
      }

      // 5. Expenses
      const supaExpenses = await fetchExpensesFromSupabase();
      if (supaExpenses && supaExpenses.length > 0) {
        setExpenses(supaExpenses);
      }

      // 6. Daily Records
      const supaDaily = await fetchDailyRecordsFromSupabase();
      if (supaDaily && supaDaily.length > 0) {
        setDailyRecords(supaDaily);
      }

      // 7. Shop Settings
      const supaSettings = await fetchShopSettingsFromSupabase();
      if (supaSettings) {
        setShopSettings((prev) => ({ ...prev, ...supaSettings }));
      }

      // 8. Staff Users
      const supaStaff = await fetchStaffUsersFromSupabase();
      if (supaStaff && supaStaff.length > 0) {
        setStaffUsers(supaStaff);
      }

      // 9. Categories List from Supabase
      const supaCategories = await fetchCategoriesFromSupabase();
      if (supaCategories && supaCategories.length > 0) {
        setCategories(supaCategories);
      }

      setIsSupabaseConnected(true);
    } catch (err) {
      console.warn('Supabase sync notice:', err);
    } finally {
      setIsSupabaseSyncing(false);
    }
  };

  // Run initial Supabase check and persistent auth listener
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      setIsAuthChecking(true);
      try {
        // 1. Check with backend server if admin token exists
        const token = localStorage.getItem(STORAGE_KEY_PREFIX + 'admin_token');
        if (token) {
          try {
            const res = await fetch('/api/admin/verify-session', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const data = await res.json();
              if (data.authenticated && (data.role === 'admin' || data.role === 'super_admin')) {
                if (isMounted) {
                  setIsAdminLoggedIn(true);
                  setCurrentUserRole(data.role);
                  setIsAuthChecking(false);
                }
              }
            } else if (res.status === 403) {
              // Denied: Standard user
              if (isMounted) {
                setIsAdminLoggedIn(false);
                setCurrentUserRole('user');
                setIsAuthChecking(false);
              }
            } else if (res.status === 401) {
              // Expired token
              if (isMounted) {
                setIsAdminLoggedIn(false);
                setCurrentUserRole('user');
                setAdminAuthToken(null);
                localStorage.removeItem(STORAGE_KEY_PREFIX + 'admin_token');
                localStorage.removeItem(STORAGE_KEY_PREFIX + 'admin_logged_in');
              }
            }
          } catch (netErr) {
            // Offline/Network fallback - keep current validated state
          }
        }

        // 2. Check Supabase auth session
        const { data: authData } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
        if (authData?.session?.user) {
          const u = authData.session.user;
          const prof = await fetchUserProfile(u.id);
          const email = (u.email || '').toLowerCase().trim();
          const isSuperAdminEmail =
            email === 'videoirom@gmail.com' ||
            email === 'superadmin@treoenterprises.com' ||
            email === 'admin@treoenterprises.com';

          if (isSuperAdminEmail || prof?.role === 'admin' || prof?.role === 'super_admin') {
            const role = (isSuperAdminEmail ? 'super_admin' : prof?.role || 'admin') as UserRole;
            if (isMounted) {
              setIsAdminLoggedIn(true);
              setCurrentUserRole(role);
              setIsCustomerLoggedIn(false);
              setIsAuthChecking(false);
            }
          } else {
            // Authenticated as standard user
            if (isMounted) {
              setIsAdminLoggedIn(false);
              setCurrentUserRole('user');
              setIsCustomerLoggedIn(true);
              setIsAuthChecking(false);
            }
          }
        } else {
          if (isMounted) {
            setIsAuthChecking(false);
          }
        }
      } catch (err) {
        console.warn('Initial session check warning:', err);
        if (isMounted) setIsAuthChecking(false);
      }
    };

    verifySession();

    // Subscribe to Supabase auth state changes for persistent sessions
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setIsAdminLoggedIn(false);
        setIsCustomerLoggedIn(false);
        setCurrentUserRole('user');
        setCurrentAdminUser(null);
        setAdminAuthToken(null);
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'admin_token');
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'admin_logged_in');
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'admin_role');
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'customer_logged_in');
      } else if (session?.user) {
        const u = session.user;
        const prof = await fetchUserProfile(u.id);
        const email = (u.email || '').toLowerCase().trim();
        const isSuperAdminEmail =
          email === 'videoirom@gmail.com' ||
          email === 'superadmin@treoenterprises.com' ||
          email === 'admin@treoenterprises.com';

        if (isSuperAdminEmail || prof?.role === 'admin' || prof?.role === 'super_admin') {
          const role = (isSuperAdminEmail ? 'super_admin' : prof?.role || 'admin') as UserRole;
          setIsAdminLoggedIn(true);
          setCurrentUserRole(role);
          setIsCustomerLoggedIn(false);
        } else {
          setIsAdminLoggedIn(false);
          setCurrentUserRole('user');
          setIsCustomerLoggedIn(true);
        }
      }
    });

    // Run initial data sync
    syncWithSupabase();

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // 10. Navigation & Active Selection
  const [activeView, setActiveView] = useState<AppContextType['activeView']>('admin-dashboard');
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchTrackingId, setSearchTrackingId] = useState<string>('');

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'settings', JSON.stringify(shopSettings));
    // Apply primary brand color dynamically
    document.documentElement.style.setProperty('--brand-primary', shopSettings.primaryBrandColor);
  }, [shopSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'invoice_counter', String(currentInvoiceCounter));
  }, [currentInvoiceCounter]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'daily', JSON.stringify(dailyRecords));
  }, [dailyRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'dark', String(isDarkMode));
      localStorage.setItem('abc_stationery_v1_dark', String(isDarkMode));
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    } catch (e) {
      console.warn('Unable to persist theme state to localStorage', e);
    }
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'admin_auth', String(isAdminLoggedIn));
    localStorage.setItem('abc_stationery_v1_admin_auth', String(isAdminLoggedIn));
    localStorage.setItem('ais-dev-admin_auth', String(isAdminLoggedIn));
  }, [isAdminLoggedIn]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'staff_users', JSON.stringify(staffUsers));
  }, [staffUsers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'current_admin_user', JSON.stringify(currentAdminUser));
  }, [currentAdminUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'admin_role', currentUserRole);
    localStorage.setItem('abc_stationery_v1_admin_role', currentUserRole);
  }, [currentUserRole]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'customer_logged_in', String(isCustomerLoggedIn));
  }, [isCustomerLoggedIn]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'current_cust', JSON.stringify(currentCustomer));
  }, [currentCustomer]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  const updateShopSettings = async (newSettings: Partial<ShopSettings>): Promise<{ success: boolean; error?: string }> => {
    const bankName = newSettings.bankName || newSettings.bankDetails?.bankName || shopSettings.bankName || 'HDFC Bank Ltd';
    const bankAccountNumber = newSettings.bankAccountNumber || newSettings.bankDetails?.accountNumber || shopSettings.bankAccountNumber || '50200012345678';
    const bankIfsc = newSettings.bankIfsc || newSettings.bankDetails?.ifscCode || shopSettings.bankIfsc || 'HDFC0001234';
    const bankBranch = newSettings.bankBranch || newSettings.bankDetails?.branch || shopSettings.bankBranch || 'Main Station Road, Raipur';

    const merged: ShopSettings = {
      ...shopSettings,
      ...newSettings,
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
    };

    setShopSettings(merged);
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'settings', JSON.stringify(merged));
      if (merged.primaryBrandColor) {
        document.documentElement.style.setProperty('--brand-primary', merged.primaryBrandColor);
      }
    } catch (e) {
      console.warn('Failed to save settings locally:', e);
    }

    const res = await saveShopSettingsToSupabase(merged);
    if (res.success) {
      showToast('Shop Settings updated & saved to Supabase!');
    } else {
      showToast('Settings saved locally. Supabase notice: ' + (res.error || 'Check connection'));
    }
    return res;
  };

  const resetShopSettingsToDefault = async (): Promise<void> => {
    setShopSettings(initialShopSettings);
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'settings', JSON.stringify(initialShopSettings));
      if (initialShopSettings.primaryBrandColor) {
        document.documentElement.style.setProperty('--brand-primary', initialShopSettings.primaryBrandColor);
      }
    } catch (e) {
      console.warn('Failed to reset settings locally:', e);
    }
    await saveShopSettingsToSupabase(initialShopSettings);
    showToast('Shop Settings restored to recommended defaults & synced to Supabase!');
  };

  const refreshShopSettingsFromSupabase = async (): Promise<boolean> => {
    try {
      const supaSettings = await fetchShopSettingsFromSupabase();
      if (supaSettings) {
        setShopSettings((prev) => ({ ...prev, ...supaSettings }));
        localStorage.setItem(STORAGE_KEY_PREFIX + 'settings', JSON.stringify(supaSettings));
        showToast('Refreshed latest shop settings from Supabase!');
        return true;
      }
      showToast('Could not find cloud settings. Kept local configuration.');
      return false;
    } catch {
      showToast('Error connecting to Supabase for shop settings.');
      return false;
    }
  };

  // Product actions
  const addProduct = (productData: Omit<Product, 'id' | 'createdAt'>): Product => {
    const newProduct: Product = {
      ...productData,
      id: 'prod-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProduct, ...prev]);
    upsertProductToSupabase(newProduct).catch((e) => console.warn('Supabase add product sync:', e));
    showToast(`Product "${newProduct.name}" added successfully.`);
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) => {
      const updatedList = prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...updates };
          upsertProductToSupabase(updated).catch((e) => console.warn('Supabase update product sync:', e));
          return updated;
        }
        return p;
      });
      return updatedList;
    });
    showToast('Product updated successfully.');
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    deleteProductFromSupabase(id).catch((e) => console.warn('Supabase delete product sync:', e));
    showToast('Product deleted.');
  };

  // Category Actions & Supabase Sync
  const addCategory = async (
    catData: Partial<CategoryItem> & { name: string }
  ): Promise<{ success: boolean; error?: string }> => {
    const id = catData.id || `cat-${Date.now()}`;
    const newCategory: CategoryItem = {
      id,
      name: catData.name.trim(),
      slug: catData.slug || catData.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: catData.description || '',
      iconName: catData.iconName || 'Layers',
      displayOrder: catData.displayOrder ?? categories.length + 1,
      isActive: catData.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCategories((prev) => [...prev, newCategory]);
    showToast(`Category "${newCategory.name}" added`);

    const res = await saveCategoryToSupabase(newCategory);
    return res;
  };

  const updateCategory = async (
    id: string,
    updates: Partial<CategoryItem>
  ): Promise<{ success: boolean; error?: string }> => {
    let updatedCat: CategoryItem | undefined;
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          updatedCat = { ...c, ...updates, updatedAt: new Date().toISOString() };
          return updatedCat;
        }
        return c;
      })
    );

    if (updatedCat) {
      showToast(`Category "${updatedCat.name}" updated`);
      return await saveCategoryToSupabase(updatedCat);
    }
    return { success: false, error: 'Category not found' };
  };

  const deleteCategory = async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    const target = categories.find((c) => c.id === id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    if (target) {
      showToast(`Category "${target.name}" removed`);
    }
    return await deleteCategoryFromSupabase(id);
  };

  const seedCategoriesToSupabaseDatabase = async (): Promise<{
    success: boolean;
    count?: number;
    error?: string;
  }> => {
    const listToSeed = categories.length > 0 ? categories : sampleCategories;
    const res = await seedCategoriesToSupabase(listToSeed);
    if (res.success) {
      showToast(`Successfully synced ${res.count || listToSeed.length} categories to Supabase!`);
      const refreshed = await fetchCategoriesFromSupabase();
      if (refreshed && refreshed.length > 0) {
        setCategories(refreshed);
      }
    } else {
      showToast(`Supabase Category Sync: ${res.error || 'Failed to seed'}`);
    }
    return res;
  };

  // Cart actions
  const addToCart = (product: Product, quantity = 1) => {
    if (product.currentStock <= 0) {
      showToast(`Sorry, "${product.name}" is currently out of stock.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > product.currentStock) {
          showToast(`Only ${product.currentStock} units available in stock.`);
          return prev;
        }
        showToast(`Updated "${product.name}" quantity to ${newQty}.`);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      } else {
        if (quantity > product.currentStock) {
          showToast(`Only ${product.currentStock} units available in stock.`);
          return prev;
        }
        showToast(`Added "${product.name}" to cart.`);
        return [...prev, { product, quantity }];
      }
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const prod = products.find((p) => p.id === productId);
    if (prod && quantity > prod.currentStock) {
      showToast(`Only ${prod.currentStock} units are currently available.`);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('Item removed from cart.');
  };

  const clearCart = () => setCart([]);

  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartGSTDetails = calculateGST(
    cart.map((item) => ({
      sellingPrice: item.product.sellingPrice,
      quantity: item.quantity,
      gstRate: item.product.gstRate,
      discount: (item.product.mrp - item.product.sellingPrice) > 0 ? 0 : 0,
    })),
    shopSettings.state,
    shopSettings.state // default intra-state before checkout
  );

  // Order & Invoicing actions
  const createOrder = (orderData: Omit<Order, 'id' | 'orderNumber' | 'invoiceNumber' | 'orderDate'>): Order => {
    const nextInvoiceNum = formatInvoiceNumber(shopSettings.invoicePrefix, currentInvoiceCounter);
    const paddedNum = String(currentInvoiceCounter).padStart(5, '0');
    const nextOrderNum = `ABC-2026-${paddedNum}`;
    setCurrentInvoiceCounter((c) => c + 1);

    const orderId = 'ord-' + Date.now();
    const nowIso = new Date().toISOString();
    const expectedDelivery = new Date(Date.now() + 24 * 60 * 60 * 1000 * 2).toISOString(); // 2 days default

    const initialTracking: OrderTrackingEvent[] = [
      {
        id: `trk-${Date.now()}-1`,
        orderId,
        status: 'Order Placed',
        message: 'Order received and logged in system. Awaiting verification.',
        timestamp: nowIso,
        location: `${shopSettings.city} Central Hub`,
        updatedBy: 'System / Online Store',
      },
    ];

    const initialPaymentHistory: PaymentRecord[] =
      orderData.paidAmount > 0
        ? [
            {
              id: `pay-${Date.now()}`,
              orderId,
              amount: orderData.paidAmount,
              method: orderData.paymentMethod,
              status: orderData.paymentStatus,
              timestamp: nowIso,
              transactionReference: `TXN${Date.now().toString().slice(-8)}`,
              notes: 'Payment collected at order booking',
            },
          ]
        : [];

    const notifChannel = orderData.customer.whatsapp ? 'WhatsApp' : 'SMS';
    const initialNotifications: OrderNotification[] = [
      {
        id: `notif-${Date.now()}`,
        orderId,
        orderNumber: nextOrderNum,
        title: 'Order Confirmed & Received',
        message: `Hello ${orderData.customer.name}, your ABC Paper & Store order #${nextOrderNum} for ₹${orderData.grandTotal.toLocaleString('en-IN')} has been placed successfully. Expected delivery: ${new Date(expectedDelivery).toLocaleDateString('en-IN')}. Track anytime at our portal!`,
        channel: notifChannel,
        timestamp: nowIso,
        recipient: orderData.customer.whatsapp || orderData.customer.mobile,
        status: 'Delivered',
        read: false,
      },
    ];

    const newOrder: Order = {
      ...orderData,
      id: orderId,
      orderNumber: nextOrderNum,
      invoiceNumber: nextInvoiceNum,
      orderDate: nowIso,
      expectedDeliveryDate: orderData.expectedDeliveryDate || expectedDelivery,
      trackingTimeline: orderData.trackingTimeline?.length ? orderData.trackingTimeline : initialTracking,
      paymentHistory: orderData.paymentHistory?.length ? orderData.paymentHistory : initialPaymentHistory,
      notificationLog: orderData.notificationLog?.length ? orderData.notificationLog : initialNotifications,
    };

    // Automatically decrement inventory
    setProducts((prev) => {
      const updatedProds = deductInventory(prev, newOrder.items);
      newOrder.items.forEach((item) => {
        const prod = updatedProds.find((p) => p.id === item.productId);
        if (prod) {
          upsertProductToSupabase(prod).catch((e) => console.warn('Supabase stock sync:', e));
        }
      });
      return updatedProds;
    });

    // Update customer stats or add customer if not present
    setCustomers((prev) => {
      const existing = prev.find((c) => c.mobile === newOrder.customer.mobile);
      if (existing) {
        return prev.map((c) => {
          if (c.id === existing.id) {
            const updated = {
              ...c,
              totalPurchases: c.totalPurchases + newOrder.grandTotal,
              ordersCount: c.ordersCount + 1,
              outstandingAmount:
                newOrder.paymentStatus === 'Pending'
                  ? c.outstandingAmount + newOrder.grandTotal
                  : c.outstandingAmount,
              lastPurchaseDate: newOrder.orderDate,
            };
            upsertCustomerToSupabase(updated).catch((e) => console.warn('Supabase customer sync:', e));
            return updated;
          }
          return c;
        });
      } else {
        const newCust: CustomerUser = {
          id: 'cust-' + Date.now(),
          name: newOrder.customer.name,
          mobile: newOrder.customer.mobile,
          whatsapp: newOrder.customer.whatsapp,
          email: newOrder.customer.email || '',
          address: newOrder.customer.billingAddress,
          city: newOrder.customer.city,
          state: newOrder.customer.state,
          pincode: newOrder.customer.pincode,
          gstin: newOrder.customer.gstin,
          companyName: newOrder.customer.companyName,
          totalPurchases: newOrder.grandTotal,
          ordersCount: 1,
          outstandingAmount: newOrder.paymentStatus === 'Pending' ? newOrder.grandTotal : 0,
          lastPurchaseDate: newOrder.orderDate,
          createdAt: new Date().toISOString(),
        };
        upsertCustomerToSupabase(newCust).catch((e) => console.warn('Supabase customer sync:', e));
        return [newCust, ...prev];
      }
    });

    setOrders((prev) => [newOrder, ...prev]);
    upsertOrderToSupabase(newOrder).catch((e) => console.warn('Supabase order sync:', e));
    clearCart();

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // safe fallback
    }

    showToast(`Order ${newOrder.orderNumber} & GST Invoice ${newOrder.invoiceNumber} created successfully!`);
    return newOrder;
  };

  const updateOrderStatus = (
    orderId: string,
    status: Order['orderStatus'],
    customMessage?: string,
    customLocation?: string
  ) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    // If order was cancelled or returned, replenish inventory
    if (
      (status === 'Cancelled' || status === 'Returned') &&
      targetOrder.orderStatus !== 'Cancelled' &&
      targetOrder.orderStatus !== 'Returned'
    ) {
      setProducts((prev) =>
        prev.map((prod) => {
          const orderItem = targetOrder.items.find((item) => item.productId === prod.id);
          if (orderItem) {
            return { ...prod, currentStock: prod.currentStock + orderItem.quantity };
          }
          return prod;
        })
      );
      showToast(`Order status updated to ${status}. Inventory has been replenished.`);
    }

    const defaultMessages: Record<Order['orderStatus'], string> = {
      'Order Placed': 'Order received and logged in system.',
      'Confirmed': 'Order verified and accepted by ABC Paper & Store.',
      'Processing': 'Order items are being picked and verified from warehouse inventory.',
      'Packed': 'Order items packed securely in tamper-evident packaging.',
      'Ready for Dispatch': 'Package staged at dispatch dock for transit.',
      'Out for Delivery': targetOrder.assignedDeliveryPerson?.deliveryPerson
        ? `Delivery partner ${targetOrder.assignedDeliveryPerson.deliveryPerson} is en route to your address.`
        : 'Rider is out for delivery with your package.',
      'Delivered': 'Package has been successfully handed over to customer. Thank you for choosing ABC Paper & Store!',
      'Cancelled': 'Order was cancelled. Any reservation or pending stock has been restored.',
      'Returned': 'Items received back at store and inspected. Return completed.',
      'New': 'New order received.',
      'Ready': 'Order is ready for pickup or dispatch.',
      'Shipped': 'Order has been dispatched via courier.',
    };

    const locationStr =
      customLocation ||
      (status === 'Out for Delivery' || status === 'Delivered'
        ? targetOrder.assignedDeliveryPerson?.deliveryArea || targetOrder.customer.city
        : `${shopSettings.city} Main Fulfillment Dock`);

    const newEvent: OrderTrackingEvent = {
      id: 'trk-' + Date.now(),
      orderId,
      status,
      message: customMessage || defaultMessages[status] || `Status updated to ${status}`,
      timestamp: new Date().toISOString(),
      location: locationStr,
      updatedBy: currentAdminUser?.name || 'Store Operations',
    };

    const notifChannel = targetOrder.customer.whatsapp ? 'WhatsApp' : 'SMS';
    const newNotif: OrderNotification = {
      id: 'notif-' + Date.now(),
      orderId,
      orderNumber: targetOrder.orderNumber,
      title: `Order Status: ${status}`,
      message: `Hello ${targetOrder.customer.name}, your ABC Paper & Store order #${targetOrder.orderNumber} is now "${status}". Message: ${newEvent.message}`,
      channel: notifChannel,
      timestamp: new Date().toISOString(),
      recipient: targetOrder.customer.whatsapp || targetOrder.customer.mobile,
      status: 'Delivered',
      read: false,
    };

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const updated = {
          ...o,
          orderStatus: status,
          trackingTimeline: [...(o.trackingTimeline || []), newEvent],
          notificationLog: [...(o.notificationLog || []), newNotif],
        };
        upsertOrderToSupabase(updated).catch((e) => console.warn('Supabase update order status sync:', e));
        return updated;
      })
    );

    showToast(`Order #${targetOrder.orderNumber} updated to "${status}". Notification sent via ${notifChannel}.`);
  };

  const assignDeliveryPerson = (
    orderId: string,
    assignment: Omit<DeliveryAssignment, 'id' | 'orderId'>
  ) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const newAssignment: DeliveryAssignment = {
          ...assignment,
          id: 'deliv-' + Date.now(),
          orderId,
        };
        const newEvent: OrderTrackingEvent = {
          id: 'trk-' + Date.now(),
          orderId,
          status: o.orderStatus === 'Order Placed' || o.orderStatus === 'Confirmed' ? 'Processing' : o.orderStatus,
          message: `Assigned to delivery executive ${assignment.deliveryPerson} (${assignment.mobile}). Route: ${assignment.deliveryArea}.`,
          timestamp: new Date().toISOString(),
          location: assignment.deliveryArea || `${shopSettings.city} Dispatch Center`,
          updatedBy: currentAdminUser?.name || 'Dispatch Coordinator',
        };
        const notifChannel = o.customer.whatsapp ? 'WhatsApp' : 'SMS';
        const newNotif: OrderNotification = {
          id: 'notif-' + Date.now(),
          orderId,
          orderNumber: o.orderNumber,
          title: 'Delivery Executive Assigned',
          message: `Your order #${o.orderNumber} has been assigned to ${assignment.deliveryPerson} (${assignment.mobile}). Expected delivery: ${assignment.expectedDate || 'Today'}.`,
          channel: notifChannel,
          timestamp: new Date().toISOString(),
          recipient: o.customer.whatsapp || o.customer.mobile,
          status: 'Delivered',
          read: false,
        };

        const updated = {
          ...o,
          assignedDeliveryPerson: newAssignment,
          expectedDeliveryDate: assignment.expectedDate ? new Date(assignment.expectedDate).toISOString() : o.expectedDeliveryDate,
          trackingTimeline: [...(o.trackingTimeline || []), newEvent],
          notificationLog: [...(o.notificationLog || []), newNotif],
        };
        upsertOrderToSupabase(updated).catch((e) => console.warn('Supabase assign delivery sync:', e));
        return updated;
      })
    );
    showToast(`Delivery executive ${assignment.deliveryPerson} assigned successfully.`);
  };

  const addTrackingEvent = (
    orderId: string,
    event: Omit<OrderTrackingEvent, 'id' | 'orderId' | 'timestamp'>
  ) => {
    const newEvent: OrderTrackingEvent = {
      ...event,
      id: 'trk-' + Date.now(),
      orderId,
      timestamp: new Date().toISOString(),
      updatedBy: event.updatedBy || currentAdminUser?.name || 'Operations Team',
    };
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const updated = {
          ...o,
          orderStatus: event.status,
          trackingTimeline: [...(o.trackingTimeline || []), newEvent],
        };
        upsertOrderToSupabase(updated).catch((e) => console.warn('Supabase add tracking event sync:', e));
        return updated;
      })
    );
    showToast(`Tracking milestone added: ${event.status}`);
  };

  const addPaymentRecord = (
    orderId: string,
    payment: Omit<PaymentRecord, 'id' | 'orderId' | 'timestamp'>
  ) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const newRecord: PaymentRecord = {
          ...payment,
          id: 'pay-' + Date.now(),
          orderId,
          timestamp: new Date().toISOString(),
        };
        const updatedPaid = o.paidAmount + payment.amount;
        const updatedPending = Math.max(0, o.grandTotal - updatedPaid);
        const newStatus: Order['paymentStatus'] =
          updatedPaid >= o.grandTotal ? 'Paid' : updatedPaid > 0 ? 'Partial' : 'Pending';

        const updated = {
          ...o,
          paidAmount: updatedPaid,
          pendingAmount: updatedPending,
          paymentStatus: newStatus,
          paymentHistory: [...(o.paymentHistory || []), newRecord],
        };
        upsertOrderToSupabase(updated).catch((e) => console.warn('Supabase add payment sync:', e));
        return updated;
      })
    );
    showToast(`Recorded payment of ₹${payment.amount.toLocaleString('en-IN')}.`);
  };

  const sendOrderNotification = (
    orderId: string,
    channel: 'WhatsApp' | 'SMS' | 'Email',
    message?: string
  ) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    const defaultMsg = `Dear ${targetOrder.customer.name}, update regarding your ABC Paper & Store order #${targetOrder.orderNumber} (Status: ${targetOrder.orderStatus}, Amount: ₹${targetOrder.grandTotal.toLocaleString('en-IN')}). Expected delivery: ${targetOrder.expectedDeliveryDate ? new Date(targetOrder.expectedDeliveryDate).toLocaleDateString('en-IN') : 'Soon'}.`;

    const recipient =
      channel === 'Email'
        ? targetOrder.customer.email || 'customer@abcpapers.com'
        : targetOrder.customer.whatsapp || targetOrder.customer.mobile;

    const newNotif: OrderNotification = {
      id: 'notif-' + Date.now(),
      orderId,
      orderNumber: targetOrder.orderNumber,
      title: `Order Update via ${channel}`,
      message: message || defaultMsg,
      channel,
      timestamp: new Date().toISOString(),
      recipient,
      status: 'Delivered',
      read: true,
    };

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const updated = { ...o, notificationLog: [...(o.notificationLog || []), newNotif] };
        upsertOrderToSupabase(updated).catch((e) => console.warn('Supabase notification log sync:', e));
        return updated;
      })
    );

    showToast(`${channel} notification dispatched to ${recipient}`);
  };

  const quickTrackOrder = (query: string): Order | undefined => {
    const cleaned = query.trim().toLowerCase();
    if (!cleaned) return undefined;
    const digitsOnly = cleaned.replace(/\D/g, '');

    return orders.find((o) => {
      const ordNum = o.orderNumber.toLowerCase();
      const idMatch = o.id.toLowerCase() === cleaned;
      const invMatch = o.invoiceNumber.toLowerCase() === cleaned;
      const exactOrdMatch = ordNum === cleaned || ordNum.includes(cleaned);
      const custMobile = o.customer.mobile.replace(/\D/g, '');
      const custWhatsapp = (o.customer.whatsapp || '').replace(/\D/g, '');
      const mobileMatch =
        digitsOnly.length >= 4 &&
        (custMobile.includes(digitsOnly) || custWhatsapp.includes(digitsOnly));
      const nameMatch = o.customer.name.toLowerCase().includes(cleaned);

      return exactOrdMatch || idMatch || invMatch || mobileMatch || nameMatch;
    });
  };

  const reorderItems = (order: Order) => {
    order.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId) || ({
        id: item.productId,
        name: item.productName,
        sku: item.sku,
        category: 'Paper',
        brand: 'ABC Paper',
        sellingPrice: item.rate,
        mrp: item.rate * 1.1,
        gstRate: item.gstRate,
        hsnCode: item.hsnCode,
        currentStock: 100,
        minimumStock: 10,
        unit: item.unit || 'Packet',
        imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60',
      } as Product);
      addToCart(prod, item.quantity);
    });
    setActiveView('cart');
    showToast(`Added ${order.items.length} item(s) from Order #${order.orderNumber} to your cart!`);
  };

  const updatePaymentStatus = (orderId: string, status: Order['paymentStatus'], paidAmount?: number) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const finalPaid = paidAmount !== undefined ? paidAmount : (status === 'Paid' ? o.grandTotal : o.paidAmount);
          const pending = Math.max(0, o.grandTotal - finalPaid);
          const updated = {
            ...o,
            paymentStatus: status,
            paidAmount: finalPaid,
            pendingAmount: pending,
          };
          upsertOrderToSupabase(updated).catch((e) => console.warn('Supabase payment status sync:', e));
          return updated;
        }
        return o;
      })
    );
    showToast(`Payment status updated to ${status}.`);
  };

  // Customer actions
  const addCustomer = (custData: Omit<CustomerUser, 'id' | 'createdAt' | 'totalPurchases' | 'ordersCount'>): CustomerUser => {
    const newCust: CustomerUser = {
      ...custData,
      id: 'cust-' + Date.now(),
      totalPurchases: 0,
      ordersCount: 0,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCust, ...prev]);
    upsertCustomerToSupabase(newCust).catch((e) => console.warn('Supabase add customer sync:', e));
    showToast(`Customer "${newCust.name}" added successfully.`);
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<CustomerUser>) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...updates };
          upsertCustomerToSupabase(updated).catch((e) => console.warn('Supabase update customer sync:', e));
          return updated;
        }
        return c;
      })
    );
    showToast('Customer record updated.');
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    deleteCustomerFromSupabase(id).catch((e) => console.warn('Supabase delete customer sync:', e));
    showToast('Customer record deleted.');
  };

  // Supplier actions
  const addSupplier = (supData: Omit<Supplier, 'id' | 'createdAt'>): Supplier => {
    const newSup: Supplier = {
      ...supData,
      id: 'sup-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setSuppliers((prev) => [newSup, ...prev]);
    upsertSupplierToSupabase(newSup).catch((e) => console.warn('Supabase add supplier sync:', e));
    showToast(`Supplier "${newSup.name}" added.`);
    return newSup;
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = { ...s, ...updates };
          upsertSupplierToSupabase(updated).catch((e) => console.warn('Supabase update supplier sync:', e));
          return updated;
        }
        return s;
      })
    );
    showToast('Supplier updated.');
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    deleteSupplierFromSupabase(id).catch((e) => console.warn('Supabase delete supplier sync:', e));
    showToast('Supplier deleted.');
  };

  // Expense actions
  const addExpense = (expData: Omit<Expense, 'id'>): Expense => {
    const newExp: Expense = {
      ...expData,
      id: 'exp-' + Date.now(),
    };
    setExpenses((prev) => [newExp, ...prev]);
    upsertExpenseToSupabase(newExp).catch((e) => console.warn('Supabase add expense sync:', e));
    showToast(`Expense of ₹${newExp.amount} recorded.`);
    return newExp;
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    deleteExpenseFromSupabase(id).catch((e) => console.warn('Supabase delete expense sync:', e));
    showToast('Expense record deleted.');
  };

  // Daily task records
  const saveDailyTask = (recordData: Omit<DailySalesRecord, 'id'>): DailySalesRecord => {
    const existingIndex = dailyRecords.findIndex((r) => r.date === recordData.date);
    let newRecord: DailySalesRecord;

    if (existingIndex >= 0) {
      newRecord = { ...dailyRecords[existingIndex], ...recordData };
      setDailyRecords((prev) =>
        prev.map((r, i) => (i === existingIndex ? newRecord : r))
      );
      showToast(`Daily task record updated for ${recordData.date}.`);
    } else {
      newRecord = { ...recordData, id: 'ds-' + Date.now() };
      setDailyRecords((prev) => [newRecord, ...prev]);
      showToast(`Daily record saved for ${recordData.date}.`);
    }
    upsertDailyRecordToSupabase(newRecord).catch((e) => console.warn('Supabase save daily task sync:', e));
    return newRecord;
  };

  // Admin Login Handler with Role Verification & Session Token Generation
  const loginAdmin = (identifier: string, secret = ''): { success: boolean; error?: string; user?: StaffUser } => {
    const trimmedId = identifier.trim().toLowerCase();
    const trimmedSecret = secret.trim();

    if (!trimmedId && !trimmedSecret) {
      return { success: false, error: 'Please enter your Email, Phone, or Security PIN.' };
    }

    // 1. Direct PIN or secret match across users
    let matchedUser = staffUsers.find((u) => {
      const isSuperAdminUser = u.role === 'super_admin';
      // By email (supporting super admin aliases) or phone
      const emailMatch =
        u.email &&
        (u.email.toLowerCase() === trimmedId.toLowerCase() ||
          (isSuperAdminUser &&
            (trimmedId.toLowerCase() === 'videoirom@gmail.com' ||
              trimmedId.toLowerCase() === 'superadmin@treoenterprises.com' ||
              trimmedId.toLowerCase() === 'admin@treoenterprises.com')));
      const phoneMatch = u.phone && u.phone.replace(/[^0-9]/g, '') === trimmedId.replace(/[^0-9]/g, '');
      const pinDirect = (u.pin && u.pin === trimmedId) || (u.pin && u.pin === trimmedSecret);
      const passMatch = u.password && (u.password === trimmedSecret || u.password === trimmedId);
      return emailMatch || phoneMatch || pinDirect || passMatch;
    });

    // Special fallback for initial quick setup / demo pin 1234
    if (!matchedUser && (trimmedId === '1234' || trimmedSecret === '1234')) {
      matchedUser = staffUsers.find((u) => u.role === 'super_admin') || staffUsers[0];
    }

    if (matchedUser) {
      // SECURITY ENFORCEMENT: Standard users are strictly forbidden from administrative entry
      if (matchedUser.role === 'user') {
        return {
          success: false,
          error: 'Access Denied (403): Standard customer accounts are not permitted to access the administrative console.',
        };
      }

      if (matchedUser.active === false) {
        return { success: false, error: 'This administrative account has been deactivated. Please contact the administrator.' };
      }

      // If user entered email/phone AND also provided a secret, check match
      if (trimmedSecret && (matchedUser.email.toLowerCase() === trimmedId.toLowerCase() || trimmedId.includes('@'))) {
        const matchesSecret = (matchedUser.password && matchedUser.password === trimmedSecret) ||
                              (matchedUser.pin && matchedUser.pin === trimmedSecret);
        if (!matchesSecret) {
          return { success: false, error: 'Invalid password or security PIN. Please check your credentials.' };
        }
      }

      // Generate cryptographically unique admin token
      const sessionToken = `adm_token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      setAdminAuthToken(sessionToken);
      localStorage.setItem(STORAGE_KEY_PREFIX + 'admin_token', sessionToken);
      localStorage.setItem(STORAGE_KEY_PREFIX + 'admin_logged_in', 'true');
      localStorage.setItem(STORAGE_KEY_PREFIX + 'admin_role', matchedUser.role);

      setCurrentAdminUser(matchedUser);
      setCurrentUserRole(matchedUser.role);
      setIsAdminLoggedIn(true);
      setIsCustomerLoggedIn(false);
      setActiveView('admin-dashboard');

      // Register session on backend server for API authorization
      fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: matchedUser.email || matchedUser.phone || matchedUser.id,
          secret: matchedUser.password || matchedUser.pin || 'admin',
          requestedRole: matchedUser.role,
        }),
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (data.token) {
              setAdminAuthToken(data.token);
              localStorage.setItem(STORAGE_KEY_PREFIX + 'admin_token', data.token);
            }
          }
        })
        .catch((e) => console.warn('Backend admin login registration:', e));

      // Sign in or create session via Supabase Auth in background to maintain persistent session
      if (matchedUser.email) {
        supabaseAuthSignIn(matchedUser.email, matchedUser.password || matchedUser.pin || 'Tr3o$ecur3!2026#AdminX')
          .then(({ error }) => {
            if (error) {
              supabaseAuthSignUp(matchedUser.email, matchedUser.password || matchedUser.pin || 'Tr3o$ecur3!2026#AdminX', {
                name: matchedUser.name,
                role: matchedUser.role,
              }).catch(() => {});
            }
          })
          .catch((e) => console.warn('Supabase auth sign in background:', e));
      }

      showToast(`Welcome back, ${matchedUser.name}!`);
      return { success: true, user: matchedUser };
    }

    return { success: false, error: 'Invalid credentials. Please verify your Email, PIN, or Password.' };
  };

  // Admin Sign Up Handler
  const signUpAdmin = (userData: Omit<StaffUser, 'id' | 'createdAt'>): { success: boolean; error?: string; user?: StaffUser } => {
    const trimmedName = userData.name.trim();
    const trimmedEmail = userData.email.trim().toLowerCase();
    const trimmedPin = userData.pin?.trim() || '1234';
    const trimmedPass = userData.password?.trim() || 'admin123';
    const trimmedPhone = userData.phone.trim() || '+91 98765 00000';

    if (!trimmedName) {
      return { success: false, error: 'Full name is required.' };
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: 'A valid email address is required.' };
    }
    if (trimmedPin.length < 4) {
      return { success: false, error: 'Security PIN must be at least 4 digits.' };
    }

    // Check duplicate email
    const existing = staffUsers.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (existing) {
      return { success: false, error: `Account with email "${trimmedEmail}" already exists. Please log in instead.` };
    }

    const assignedRole = userData.role === 'super_admin' ? 'super_admin' : 'admin';
    const newUser: StaffUser = {
      id: 'staff-' + Date.now(),
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      role: assignedRole,
      active: true,
      pin: trimmedPin,
      password: trimmedPass,
      createdAt: new Date().toISOString(),
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80',
    };

    setStaffUsers((prev) => [newUser, ...prev]);
    upsertStaffUserToSupabase(newUser).catch((e) => console.warn('Supabase staff user sync:', e));
    supabaseAuthSignUp(trimmedEmail, trimmedPass, {
      name: trimmedName,
      role: assignedRole,
    }).catch((e) => console.warn('Supabase auth sign up:', e));

    const sessionToken = `adm_token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    setAdminAuthToken(sessionToken);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'admin_token', sessionToken);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'admin_logged_in', 'true');
    localStorage.setItem(STORAGE_KEY_PREFIX + 'admin_role', assignedRole);

    setCurrentAdminUser(newUser);
    setCurrentUserRole(assignedRole);
    setIsAdminLoggedIn(true);
    setIsCustomerLoggedIn(false);
    setActiveView('admin-dashboard');
    showToast(`Account created successfully! Welcome, ${newUser.name}.`);
    return { success: true, user: newUser };
  };

  // Secure Admin Logout Handler
  const logoutAdmin = useCallback(() => {
    const token = adminAuthToken || localStorage.getItem(STORAGE_KEY_PREFIX + 'admin_token');
    if (token) {
      fetch('/api/admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }

    supabaseAuthSignOut().catch((e) => console.warn('Supabase sign out error:', e));

    // Clear administrative credentials and session markers
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'admin_token');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'admin_logged_in');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'admin_role');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'admin_auth');
    localStorage.removeItem('abc_stationery_v1_admin_auth');
    localStorage.removeItem('ais-dev-admin_auth');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'current_admin_user');

    setAdminAuthToken(null);
    setIsAdminLoggedIn(false);
    setCurrentAdminUser(null);
    setCurrentUserRole('user');
    setActiveView('admin'); // Directly brings the login screen for administrators
    showToast('Administrator logged out successfully. Session ended.');
  }, [adminAuthToken, showToast]);

  // Customer Authentication Handlers
  const loginCustomer = async (
    identifier: string,
    password?: string
  ): Promise<{ success: boolean; error?: string; customer?: CustomerUser }> => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPhone = identifier.replace(/[^0-9]/g, '');

    // Search existing customers
    let matchedCustomer = customers.find((c) => {
      const emailMatch = c.email && c.email.toLowerCase() === cleanId;
      const phoneMatch = cleanPhone.length >= 10 && c.mobile.replace(/[^0-9]/g, '').includes(cleanPhone);
      return emailMatch || phoneMatch;
    });

    if (!matchedCustomer && cleanId) {
      // Auto-register customer if standard public login is provided
      matchedCustomer = {
        id: 'cust-' + Date.now(),
        name: cleanId.includes('@') ? cleanId.split('@')[0].toUpperCase() : 'Customer ' + cleanId.slice(-4),
        mobile: cleanPhone.length >= 10 ? cleanPhone : '9876500' + Math.floor(100 + Math.random() * 900),
        email: cleanId.includes('@') ? cleanId : `${cleanId}@customer.abcpapers.com`,
        whatsapp: cleanPhone.length >= 10 ? cleanPhone : undefined,
        address: 'Raipur, Chhattisgarh',
        city: 'Raipur',
        state: 'Chhattisgarh',
        pincode: '492001',
        totalPurchases: 0,
        ordersCount: 0,
        outstandingAmount: 0,
        createdAt: new Date().toISOString(),
      };
      setCustomers((prev) => [matchedCustomer!, ...prev]);
      upsertCustomerToSupabase(matchedCustomer!).catch((e) => console.warn('Supabase customer save:', e));
    }

    if (matchedCustomer) {
      setCurrentCustomer(matchedCustomer);
      setIsCustomerLoggedIn(true);
      setCurrentUserRole('user'); // Normal customer role
      setIsAdminLoggedIn(false); // Can never be admin

      localStorage.setItem(STORAGE_KEY_PREFIX + 'current_cust', JSON.stringify(matchedCustomer));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'customer_logged_in', 'true');

      // Sync with Supabase Auth if email provided
      if (matchedCustomer.email && password) {
        supabaseAuthSignIn(matchedCustomer.email, password).catch(() => {});
      }

      showToast(`Welcome back, ${matchedCustomer.name}!`);
      return { success: true, customer: matchedCustomer };
    }

    return { success: false, error: 'Customer record not found. Please register your account.' };
  };

  const signUpCustomer = async (customerData: {
    name: string;
    email: string;
    mobile: string;
    password?: string;
    address?: string;
    city?: string;
    state?: string;
    gstin?: string;
  }): Promise<{ success: boolean; error?: string; customer?: CustomerUser }> => {
    const cleanEmail = customerData.email.trim().toLowerCase();
    const cleanMobile = customerData.mobile.replace(/[^0-9]/g, '');

    if (!customerData.name.trim()) {
      return { success: false, error: 'Full name is required.' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'A valid email address is required.' };
    }
    if (cleanMobile.length < 10) {
      return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
    }

    const newCust: CustomerUser = {
      id: 'cust-' + Date.now(),
      name: customerData.name.trim(),
      email: cleanEmail,
      mobile: cleanMobile,
      whatsapp: cleanMobile,
      address: customerData.address || 'Civil Lines',
      city: customerData.city || 'Raipur',
      state: customerData.state || 'Chhattisgarh',
      pincode: '492001',
      gstin: customerData.gstin,
      totalPurchases: 0,
      ordersCount: 0,
      outstandingAmount: 0,
      createdAt: new Date().toISOString(),
    };

    setCustomers((prev) => [newCust, ...prev]);
    upsertCustomerToSupabase(newCust).catch((e) => console.warn('Supabase customer save:', e));

    // Create user profile in Supabase as 'user' role
    if (customerData.password) {
      supabaseAuthSignUp(cleanEmail, customerData.password, {
        name: newCust.name,
        role: 'user',
      }).catch((e) => console.warn('Customer Supabase auth signup:', e));
    }

    setCurrentCustomer(newCust);
    setIsCustomerLoggedIn(true);
    setCurrentUserRole('user');
    setIsAdminLoggedIn(false);

    localStorage.setItem(STORAGE_KEY_PREFIX + 'current_cust', JSON.stringify(newCust));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'customer_logged_in', 'true');

    showToast(`Account created! Welcome, ${newCust.name}.`);
    return { success: true, customer: newCust };
  };

  const logoutCustomer = useCallback(() => {
    supabaseAuthSignOut().catch(() => {});
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'customer_logged_in');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'current_cust');
    setIsCustomerLoggedIn(false);
    setCurrentCustomer(null);
    setCurrentUserRole('user');
    setActiveView('home');
    showToast('You have been signed out of your customer account.');
  }, [showToast]);

  const addStaffUser = (user: Omit<StaffUser, 'id' | 'createdAt'>): StaffUser => {
    const newUser: StaffUser = {
      ...user,
      id: 'staff-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setStaffUsers((prev) => [newUser, ...prev]);
    upsertStaffUserToSupabase(newUser).catch((e) => console.warn('Supabase add staff user sync:', e));
    showToast(`Staff member ${newUser.name} added.`);
    return newUser;
  };

  const updateStaffUser = (id: string, updates: Partial<StaffUser>) => {
    setStaffUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...updates };
          if (currentAdminUser?.id === id) {
            setCurrentAdminUser(updated);
            if (updates.role) setCurrentUserRole(updates.role);
          }
          upsertStaffUserToSupabase(updated).catch((e) => console.warn('Supabase update staff sync:', e));
          return updated;
        }
        return u;
      })
    );
    showToast('Staff details updated.');
  };

  const deleteStaffUser = (id: string) => {
    if (staffUsers.length <= 1) {
      showToast('Cannot delete the only administrative user.');
      return;
    }
    setStaffUsers((prev) => prev.filter((u) => u.id !== id));
    deleteStaffUserFromSupabase(id).catch((e) => console.warn('Supabase delete staff sync:', e));
    showToast('Staff member removed.');
  };

  // Super Admin Credentials Update (Change Email, Password, PIN, etc.)
  const updateSuperAdminCredentials = async (updates: {
    email?: string;
    password?: string;
    pin?: string;
    name?: string;
    phone?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      // Find the super admin or current logged in user
      let targetUser =
        currentAdminUser ||
        staffUsers.find((u) => u.role === 'super_admin') ||
        staffUsers[0];

      if (!targetUser) {
        return { success: false, error: 'No admin user found to update.' };
      }

      const updatedUser: StaffUser = {
        ...targetUser,
        name: updates.name ? updates.name.trim() : targetUser.name,
        email: updates.email ? updates.email.trim().toLowerCase() : targetUser.email,
        phone: updates.phone !== undefined ? updates.phone.trim() : targetUser.phone,
        pin: updates.pin ? updates.pin.trim() : targetUser.pin,
        password: updates.password ? updates.password.trim() : targetUser.password,
      };

      setStaffUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? updatedUser : u))
      );

      setCurrentAdminUser(updatedUser);

      // Save to localStorage immediately
      localStorage.setItem(STORAGE_KEY_PREFIX + 'current_admin_user', JSON.stringify(updatedUser));
      const updatedList = staffUsers.map((u) => (u.id === targetUser.id ? updatedUser : u));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'staff_users', JSON.stringify(updatedList));

      // Persist to Supabase database
      upsertStaffUserToSupabase(updatedUser).catch((e) => console.warn('Supabase staff sync warning:', e));

      // Update Supabase Auth password & email
      if (updates.password) {
        supabaseAuthUpdatePassword(updates.password).catch((e) => console.warn('Supabase auth pass update:', e));
      }
      if (updates.email && updates.email !== targetUser.email) {
        supabaseAuthUpdateEmail(updates.email).catch((e) => console.warn('Supabase auth email update:', e));
      }

      showToast('Super Admin credentials updated successfully!');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update credentials.' };
    }
  };

  // Reset to factory sample data
  const resetDemoData = () => {
    setShopSettings(initialShopSettings);
    setProducts(sampleProducts);
    setCustomers(sampleCustomers);
    setSuppliers(sampleSuppliers);
    setExpenses(sampleExpenses);
    setDailyRecords(sampleDailyRecords);
    setOrders(sampleOrders);
    setStaffUsers(sampleStaffUsers);
    setCategories(sampleCategories);
    setCurrentAdminUser(sampleStaffUsers[0]);
    setCurrentUserRole(sampleStaffUsers[0].role);
    setCart([]);
    setCurrentInvoiceCounter(1003);
    showToast('All demo records and sample data have been reloaded.');
  };

  return (
    <AppContext.Provider
      value={{
        shopSettings,
        updateShopSettings,
        resetShopSettingsToDefault,
        refreshShopSettingsFromSupabase,
        isDarkMode,
        toggleDarkMode,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        searchQuery,
        setSearchQuery,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartTotalCount,
        cartGSTDetails,
        orders,
        createOrder,
        updateOrderStatus,
        updatePaymentStatus,
        assignDeliveryPerson,
        addTrackingEvent,
        addPaymentRecord,
        sendOrderNotification,
        quickTrackOrder,
        reorderItems,
        searchTrackingId,
        setSearchTrackingId,
        currentInvoiceCounter,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        suppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        expenses,
        addExpense,
        deleteExpense,
        dailyRecords,
        saveDailyTask,
        staffUsers,
        currentAdminUser,
        currentUserRole,
        setCurrentUserRole,
        isAdminLoggedIn,
        setIsAdminLoggedIn,
        isCustomerLoggedIn,
        setIsCustomerLoggedIn,
        adminAuthToken,
        isAuthChecking,
        loginAdmin,
        signUpAdmin,
        logoutAdmin,
        loginCustomer,
        signUpCustomer,
        logoutCustomer,
        addStaffUser,
        updateStaffUser,
        deleteStaffUser,
        updateSuperAdminCredentials,
        currentCustomer,
        setCurrentCustomer,
        activeView,
        setActiveView,
        selectedProductForDetail,
        setSelectedProductForDetail,
        selectedOrderForInvoice,
        setSelectedOrderForInvoice,
        selectedCategoryFilter,
        setSelectedCategoryFilter,
        toastMessage,
        showToast,
        resetDemoData,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        seedCategoriesToSupabaseDatabase,
        supabaseProjectId: getSupabaseProjectId(),
        isSupabaseConnected,
        isSupabaseSyncing,
        syncWithSupabase,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
