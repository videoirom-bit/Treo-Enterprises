import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Package,
  ArrowLeft,
  Save,
  Plus,
  X,
  AlertTriangle,
  CheckCircle2,
  Barcode,
  Upload,
  Image as ImageIcon,
  Building2,
  MapPin,
  Warehouse,
  Coins,
  Percent,
  History,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Layers,
  Tag,
  RefreshCw,
  Trash2,
  ExternalLink,
  Info,
  DollarSign,
  Truck,
  Sparkles,
  Lock,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { StationeryCategory, Product, InventoryLogEntry, Supplier } from '../types';
import { formatINR } from '../utils/gstUtils';

interface AddInventoryViewProps {
  onBackToInventory: () => void;
  onNavigateToDashboard?: () => void;
  editingProduct?: Product | null;
}

const STATIONERY_CATEGORIES: StationeryCategory[] = [
  'Notebooks',
  'Pens',
  'Pencils',
  'Paper',
  'Files & Folders',
  'Art & Craft',
  'School Supplies',
  'Office Supplies',
  'Printing Supplies',
  'Books',
  'Computer Accessories',
  'Packaging Materials',
  'Gift Items',
  'Other',
];

const UNITS_OF_MEASUREMENT = [
  'Piece',
  'Box',
  'Packet',
  'Dozen',
  'Kg',
  'Gram',
  'Litre',
  'Meter',
] as const;

const PRODUCT_TYPES = [
  { id: 'Standard Product', label: 'Standard Product (Single retail stationery item)' },
  { id: 'Box / Pack', label: 'Box / Pack (Multi-unit retail packaging)' },
  { id: 'Serialized Item', label: 'Serialized Item (Tracked calculators, printers with serial)' },
  { id: 'Batch / Lot Controlled', label: 'Batch / Lot Controlled (Inks, glues with batch numbers)' },
  { id: 'Raw Material', label: 'Raw Material (Paper reels, spiral wire, binding boards)' },
  { id: 'Service / Labor', label: 'Service / Labor (Binding, laminating, custom printing)' },
];

const TAX_TYPES = [
  { id: 'Exclusive', label: 'Exclusive of GST (Tax added to base price)' },
  { id: 'Inclusive', label: 'Inclusive of GST (Selling price includes tax)' },
  { id: 'Exempt', label: 'Nil Rated / Exempt (0% GST exempted)' },
] as const;

const GST_RATES = [0, 5, 12, 18, 28];

const WAREHOUSE_LOCATIONS = [
  'Main Warehouse (Central Facility - Sector 4)',
  'Retail Shop Floor (Front Display Shelves)',
  'Back Depot (Aisle Storage Room B)',
  'Basement Bulk Reserve (Heavy Paper Stacks)',
];

const SAMPLE_STATIONERY_IMAGES = [
  {
    name: 'Copier Paper A4',
    url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Gel Pens Set',
    url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Spiral Notebook',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Office Box Files',
    url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Highlighters Pack',
    url: 'https://images.unsplash.com/photo-1585336261026-c567cfb437c3?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Scientific Calculator',
    url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=600&q=80',
  },
];

const POPULAR_BRANDS = [
  'JK Copier',
  'Classmate',
  'Reynolds',
  'Cello',
  'Camlin',
  'Faber-Castell',
  'Kangaroo',
  'Natraj',
  'Pilot',
  'Luxor',
  'Doms',
  'Oddy',
];

const HSN_PRESETS = [
  { code: '4802', label: 'Paper & Copier (4802)' },
  { code: '4820', label: 'Notebooks & Registers (4820)' },
  { code: '9608', label: 'Pens & Refills (9608)' },
  { code: '8472', label: 'Calculators & Machines (8472)' },
  { code: '3506', label: 'Glues & Adhesives (3506)' },
  { code: '8214', label: 'Sharpeners & Cutters (8214)' },
];

const DRAFT_STORAGE_KEY = 'abc_paper_store_add_inventory_draft_v1';

export const AddInventoryView: React.FC<AddInventoryViewProps> = ({
  onBackToInventory,
  onNavigateToDashboard,
  editingProduct,
}) => {
  const {
    products,
    addProduct,
    updateProduct,
    suppliers,
    addSupplier,
    currentAdminUser,
    currentUserRole,
    setCurrentUserRole,
    showToast,
  } = useApp();

  const isSuperAdmin = currentUserRole === 'super_admin' || currentAdminUser?.role === 'super_admin';
  const [unlockPin, setUnlockPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Form Fields State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState<StationeryCategory>('Paper');
  const [subCategory, setSubCategory] = useState('');
  const [brand, setBrand] = useState('JK Copier');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(SAMPLE_STATIONERY_IMAGES[0].url);
  const [productType, setProductType] = useState('Standard Product');
  const [unit, setUnit] = useState<string>('Piece');
  const [hsnCode, setHsnCode] = useState('4802');
  const [gstRate, setGstRate] = useState<number>(12);
  const [taxType, setTaxType] = useState<'Exclusive' | 'Inclusive' | 'Exempt'>('Inclusive');

  // Super Admin Control Fields: Stock Quantities
  const [openingStock, setOpeningStock] = useState<number>(100);
  const [currentStock, setCurrentStock] = useState<number>(100);
  const [minimumStock, setMinimumStock] = useState<number>(20);
  const [maximumStock, setMaximumStock] = useState<number>(500);

  // Super Admin Control Fields: Pricing
  const [purchasePrice, setPurchasePrice] = useState<number>(180);
  const [sellingPrice, setSellingPrice] = useState<number>(240);
  const [mrp, setMrp] = useState<number>(260);
  const [wholesalePrice, setWholesalePrice] = useState<number>(210);

  // Super Admin Control Fields: Suppliers & Warehouse
  const [supplierId, setSupplierId] = useState<string>('');
  const [supplierSku, setSupplierSku] = useState<string>('');
  const [leadTimeDays, setLeadTimeDays] = useState<number>(3);
  const [warehouse, setWarehouse] = useState<string>(WAREHOUSE_LOCATIONS[0]);
  const [warehouseLocation, setWarehouseLocation] = useState<string>('Rack A-02, Shelf 3, Bin 10');

  // Super Admin Control Fields: Initial History & Audit Note
  const [initialAuditNote, setInitialAuditNote] = useState<string>(
    'Initial stock intake created and approved by Super Admin'
  );

  // Validation & Draft UI States
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saved' | 'restored'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickAddSupplierOpen, setQuickAddSupplierOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize from editing product if present, or check local draft
  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name || '');
      setSku(editingProduct.sku || '');
      setBarcode(editingProduct.barcode || '');
      setCategory(editingProduct.category || 'Paper');
      setSubCategory(editingProduct.subCategory || '');
      setBrand(editingProduct.brand || '');
      setDescription(editingProduct.description || '');
      setImageUrl(editingProduct.imageUrl || SAMPLE_STATIONERY_IMAGES[0].url);
      setProductType(editingProduct.productType || 'Standard Product');
      setUnit(editingProduct.unit || 'Piece');
      setHsnCode(editingProduct.hsnCode || '4802');
      setGstRate(editingProduct.gstRate ?? 12);
      setTaxType(editingProduct.taxType || 'Inclusive');
      setOpeningStock(editingProduct.openingStock ?? 0);
      setCurrentStock(editingProduct.currentStock ?? 0);
      setMinimumStock(editingProduct.minimumStock ?? 10);
      setMaximumStock(editingProduct.maximumStock ?? 500);
      setPurchasePrice(editingProduct.purchasePrice ?? 0);
      setSellingPrice(editingProduct.sellingPrice ?? 0);
      setMrp(editingProduct.mrp ?? 0);
      setWholesalePrice(editingProduct.wholesalePrice ?? editingProduct.sellingPrice ?? 0);
      setSupplierId(editingProduct.supplierId || '');
      setWarehouse(editingProduct.warehouse || WAREHOUSE_LOCATIONS[0]);
      setWarehouseLocation(editingProduct.warehouseLocation || '');
      setDraftStatus('idle');
    } else {
      // Check for saved draft
      try {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed.name || parsed.sku) {
            setName(parsed.name || '');
            setSku(parsed.sku || '');
            setBarcode(parsed.barcode || '');
            if (parsed.category) setCategory(parsed.category);
            setSubCategory(parsed.subCategory || '');
            setBrand(parsed.brand || '');
            setDescription(parsed.description || '');
            setImageUrl(parsed.imageUrl || SAMPLE_STATIONERY_IMAGES[0].url);
            setProductType(parsed.productType || 'Standard Product');
            setUnit(parsed.unit || 'Piece');
            setHsnCode(parsed.hsnCode || '4802');
            setGstRate(parsed.gstRate ?? 12);
            setTaxType(parsed.taxType || 'Inclusive');
            setOpeningStock(parsed.openingStock ?? 100);
            setCurrentStock(parsed.currentStock ?? 100);
            setMinimumStock(parsed.minimumStock ?? 20);
            setMaximumStock(parsed.maximumStock ?? 500);
            setPurchasePrice(parsed.purchasePrice ?? 180);
            setSellingPrice(parsed.sellingPrice ?? 240);
            setMrp(parsed.mrp ?? 260);
            setWholesalePrice(parsed.wholesalePrice ?? 210);
            setSupplierId(parsed.supplierId || '');
            setWarehouse(parsed.warehouse || WAREHOUSE_LOCATIONS[0]);
            setWarehouseLocation(parsed.warehouseLocation || 'Rack A-02, Shelf 3, Bin 10');
            setDraftStatus('restored');
            setLastSavedTime(parsed.savedAt || '');
          }
        }
      } catch (e) {
        console.warn('Could not restore draft', e);
      }
    }
  }, [editingProduct]);

  // Auto-save draft on changes (when not editing an existing product)
  useEffect(() => {
    if (editingProduct) return;
    if (!name && !sku) return;

    const timeout = setTimeout(() => {
      try {
        const draftData = {
          name,
          sku,
          barcode,
          category,
          subCategory,
          brand,
          description,
          imageUrl,
          productType,
          unit,
          hsnCode,
          gstRate,
          taxType,
          openingStock,
          currentStock,
          minimumStock,
          maximumStock,
          purchasePrice,
          sellingPrice,
          mrp,
          wholesalePrice,
          supplierId,
          warehouse,
          warehouseLocation,
          savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
        setDraftStatus('saved');
        setLastSavedTime(draftData.savedAt);
      } catch (e) {
        console.warn('Failed to save draft', e);
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [
    editingProduct,
    name,
    sku,
    barcode,
    category,
    subCategory,
    brand,
    description,
    imageUrl,
    productType,
    unit,
    hsnCode,
    gstRate,
    taxType,
    openingStock,
    currentStock,
    minimumStock,
    maximumStock,
    purchasePrice,
    sellingPrice,
    mrp,
    wholesalePrice,
    supplierId,
    warehouse,
    warehouseLocation,
  ]);

  // Calculations for Margin, Markup and GST
  const marginPerUnit = sellingPrice - purchasePrice;
  const marginPercentage = sellingPrice > 0 ? (marginPerUnit / sellingPrice) * 100 : 0;
  const markupPercentage = purchasePrice > 0 ? (marginPerUnit / purchasePrice) * 100 : 0;

  // GST Breakdown
  let taxableBase = sellingPrice;
  let gstAmount = 0;
  if (taxType === 'Inclusive' && gstRate > 0) {
    taxableBase = Math.round((sellingPrice / (1 + gstRate / 100)) * 100) / 100;
    gstAmount = Math.round((sellingPrice - taxableBase) * 100) / 100;
  } else if (taxType === 'Exclusive' && gstRate > 0) {
    taxableBase = sellingPrice;
    gstAmount = Math.round((sellingPrice * (gstRate / 100)) * 100) / 100;
  }
  const cgstAmount = Math.round((gstAmount / 2) * 100) / 100;
  const sgstAmount = Math.round((gstAmount / 2) * 100) / 100;

  // Real-time Duplicate SKU & Barcode Validation
  const duplicateSkuProduct = products.find(
    (p) => p.sku.trim().toLowerCase() === sku.trim().toLowerCase() && p.id !== editingProduct?.id
  );
  const duplicateBarcodeProduct =
    barcode.trim() !== ''
      ? products.find(
          (p) => p.barcode?.trim().toLowerCase() === barcode.trim().toLowerCase() && p.id !== editingProduct?.id
        )
      : undefined;

  // Auto-generate unique SKU
  const handleGenerateSKU = () => {
    const prefix = category.substring(0, 3).toUpperCase();
    const brandPrefix = brand ? brand.substring(0, 3).toUpperCase() : 'ABC';
    let candidate = '';
    let counter = products.length + 101;
    do {
      candidate = `${brandPrefix}-${prefix}-${counter}`;
      counter++;
    } while (products.some((p) => p.sku === candidate));
    setSku(candidate);
    validateField('sku', candidate);
  };

  // Auto-generate Barcode EAN-13
  const handleGenerateBarcode = () => {
    const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000);
    const candidate = `890${randomDigits}`;
    setBarcode(candidate);
    validateField('barcode', candidate);
  };

  // Image Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Field validation
  const validateField = (field: string, value: any) => {
    setValidationErrors((prev) => {
      const errors = { ...prev };

      if (field === 'name') {
        if (!value || String(value).trim().length === 0) {
          errors.name = 'Product Name is required.';
        } else {
          delete errors.name;
        }
      }

      if (field === 'sku') {
        if (!value || String(value).trim().length === 0) {
          errors.sku = 'Product SKU is required.';
        } else if (
          products.some(
            (p) => p.sku.trim().toLowerCase() === String(value).trim().toLowerCase() && p.id !== editingProduct?.id
          )
        ) {
          errors.sku = `Duplicate SKU: "${value}" already belongs to an existing item.`;
        } else {
          delete errors.sku;
        }
      }

      if (field === 'barcode' && value && String(value).trim() !== '') {
        if (
          products.some(
            (p) =>
              p.barcode?.trim().toLowerCase() === String(value).trim().toLowerCase() && p.id !== editingProduct?.id
          )
        ) {
          errors.barcode = `Duplicate Barcode: "${value}" already exists.`;
        } else {
          delete errors.barcode;
        }
      }

      return errors;
    });
  };

  // Full form validation
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!name.trim()) {
      errors.name = 'Product Name is required.';
    }
    if (!sku.trim()) {
      errors.sku = 'Product SKU is required.';
    } else if (duplicateSkuProduct) {
      errors.sku = `Duplicate SKU: "${sku}" is already assigned to "${duplicateSkuProduct.name}".`;
    }
    if (barcode.trim() && duplicateBarcodeProduct) {
      errors.barcode = `Duplicate Barcode: "${barcode}" is already assigned to "${duplicateBarcodeProduct.name}".`;
    }
    if (!category) {
      errors.category = 'Product Category is required.';
    }
    if (purchasePrice < 0) {
      errors.purchasePrice = 'Purchase Price cannot be negative.';
    }
    if (sellingPrice < 0) {
      errors.sellingPrice = 'Selling Price cannot be negative.';
    }
    if (sellingPrice < purchasePrice) {
      // warning, but not blocking if intended clearance
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save product to inventory
  const handleSave = (addAnother: boolean = false) => {
    if (!validateForm()) {
      showToast('Please fix the highlighted required fields before saving.');
      if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedSupplier = suppliers.find((s) => s.id === supplierId);
      const initialHistoryItem: InventoryLogEntry = {
        id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        date: new Date().toISOString(),
        type: editingProduct ? 'Stock Adjustment' : 'Initial Stock',
        quantity: openingStock,
        unitCost: purchasePrice,
        warehouse: warehouse,
        performedBy: `Super Admin: ${currentAdminUser?.name || 'Ramesh Sharma (Owner)'}`,
        notes: initialAuditNote || 'Initial stock intake recorded by Super Admin',
      };

      const productPayload = {
        name: name.trim(),
        sku: sku.trim(),
        barcode: barcode.trim(),
        category,
        subCategory: subCategory.trim() || undefined,
        brand: brand.trim(),
        unit,
        productType,
        taxType,
        purchasePrice: Number(purchasePrice) || 0,
        costPrice: Number(purchasePrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        mrp: Number(mrp) || Number(sellingPrice) || 0,
        wholesalePrice: Number(wholesalePrice) || Number(sellingPrice) || 0,
        discountPercentage: mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0,
        gstRate: Number(gstRate) || 0,
        hsnCode: hsnCode.trim() || '4802',
        openingStock: Number(openingStock) || 0,
        currentStock: Number(currentStock) || Number(openingStock) || 0,
        minimumStock: Number(minimumStock) || 10,
        maximumStock: Number(maximumStock) || 500,
        warehouse,
        warehouseLocation: warehouseLocation.trim(),
        supplierId: supplierId || undefined,
        supplierName: selectedSupplier?.name || undefined,
        description: description.trim() || `${name} premium stationery supply.`,
        imageUrl: imageUrl || SAMPLE_STATIONERY_IMAGES[0].url,
        status: 'Active' as const,
        inventoryHistory: editingProduct?.inventoryHistory
          ? [initialHistoryItem, ...editingProduct.inventoryHistory]
          : [initialHistoryItem],
      };

      if (editingProduct) {
        updateProduct(editingProduct.id, productPayload);
        showToast(`Inventory item "${name}" updated successfully!`);
      } else {
        addProduct(productPayload);
        showToast(`Inventory item "${name}" successfully recorded in ledger!`);
      }

      // Clear local draft
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (e) {}

      if (addAnother) {
        // Reset form for next entry while retaining helpful category/warehouse defaults
        setName('');
        setSku('');
        setBarcode('');
        setDescription('');
        setSubCategory('');
        setOpeningStock(100);
        setCurrentStock(100);
        setDraftStatus('idle');
        setValidationErrors({});
        showToast('Saved! Ready to add another inventory item.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        onBackToInventory();
      }
    } catch (err: any) {
      console.error('Error saving inventory product:', err);
      showToast('Error saving inventory: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear draft
  const handleClearDraft = () => {
    if (window.confirm('Are you sure you want to discard this draft and reset all inputs?')) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setName('');
      setSku('');
      setBarcode('');
      setDescription('');
      setSubCategory('');
      setOpeningStock(100);
      setCurrentStock(100);
      setDraftStatus('idle');
      setValidationErrors({});
      showToast('Draft cleared.');
    }
  };

  // Quick Add Supplier
  const handleQuickAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim()) return;
    const added = addSupplier({
      name: newSupplierName.trim(),
      contactPerson: 'Sales Representative',
      phone: newSupplierPhone.trim() || '9876543210',
      address: 'Industrial Area, Stationery Hub',
      productsSupplied: category,
      outstandingAmount: 0,
    });
    setSupplierId(added.id);
    setNewSupplierName('');
    setNewSupplierPhone('');
    setQuickAddSupplierOpen(false);
    showToast(`Supplier "${added.name}" added successfully.`);
  };

  // SUPER ADMIN ACCESS GUARD
  if (!isSuperAdmin) {
    return (
      <div id="super-admin-access-guard" className="max-w-4xl mx-auto py-10 px-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-10 border border-red-200 dark:border-red-900/50 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
              Super Admin Authorization Required
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Restricted Inventory Management
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
              Only the <strong>Super Admin</strong> can access this module. The Super Admin must have
              complete control over inventory creation, stock quantities, pricing, suppliers, GST,
              warehouse/location, and inventory history.
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-md mx-auto text-left text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Active Session:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {currentAdminUser?.name || 'Staff User'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Active Role:</span>
              <span className="px-2 py-0.5 rounded-md font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 capitalize">
                {currentUserRole.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="max-w-md mx-auto space-y-3 pt-2">
            <button
              id="elevate-super-admin-btn"
              type="button"
              onClick={() => {
                setCurrentUserRole('super_admin');
                showToast('Switched to Super Admin session. Access granted.');
              }}
              className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer touch-manipulation"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Switch to Super Admin (Store Owner)</span>
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (unlockPin === '1234') {
                  setCurrentUserRole('super_admin');
                  showToast('Super Admin PIN verified. Full access unlocked.');
                } else {
                  setPinError(true);
                }
              }}
              className="flex flex-col sm:flex-row gap-2"
            >
              <input
                type="password"
                maxLength={6}
                placeholder="Or enter Owner PIN (1234)"
                value={unlockPin}
                onChange={(e) => {
                  setUnlockPin(e.target.value);
                  setPinError(false);
                }}
                className="w-full sm:flex-1 min-h-[44px] px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="w-full sm:w-auto min-h-[44px] px-5 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer touch-manipulation flex items-center justify-center"
              >
                Unlock
              </button>
            </form>
            {pinError && <p className="text-red-500 text-xs font-semibold">Incorrect PIN. Try 1234.</p>}

            <button
              type="button"
              onClick={onBackToInventory}
              className="inline-flex items-center justify-center min-h-[44px] gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mt-2 cursor-pointer touch-manipulation"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Inventory Overview</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="add-inventory-module" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-5 space-y-3.5 sm:space-y-4">
      {/* 1. BREADCRUMBS & TOP NAVIGATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 dark:border-slate-700/60 pb-2.5">
        {/* Breadcrumb: Dashboard → Inventory → Add Inventory */}
        <nav
          aria-label="Breadcrumb"
          id="inventory-breadcrumb"
          className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400"
        >
          <button
            type="button"
            onClick={onNavigateToDashboard || onBackToInventory}
            className="hover:text-teal-600 dark:hover:text-teal-400 transition cursor-pointer"
          >
            Dashboard
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button
            type="button"
            onClick={onBackToInventory}
            className="hover:text-teal-600 dark:hover:text-teal-400 transition cursor-pointer"
          >
            Inventory
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-bold text-slate-900 dark:text-white">
            {editingProduct ? 'Edit Inventory' : 'Add Inventory'}
          </span>
        </nav>

        {/* Draft / Save Status indicator */}
        <div className="flex items-center gap-2 text-xs">
          <div
            id="draft-save-status-badge"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium"
          >
            {draftStatus === 'saved' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Draft auto-saved at {lastSavedTime}</span>
              </>
            ) : draftStatus === 'restored' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Restored local draft ({lastSavedTime || 'Recent'})</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>Draft status: Ready</span>
              </>
            )}
          </div>

          {!editingProduct && (draftStatus === 'saved' || draftStatus === 'restored') && (
            <button
              type="button"
              onClick={handleClearDraft}
              title="Discard current draft"
              className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. HEADER & PRIMARY ACTION CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            type="button"
            id="back-to-inventory-btn"
            onClick={onBackToInventory}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shrink-0"
            title="Back to Inventory"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {editingProduct ? 'Edit Inventory Item' : 'Add Inventory'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                <span>Super Admin Module</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate sm:whitespace-normal">
              Manage product identity, stock limits, pricing, GST, and storage location.
            </p>
          </div>
        </div>

        {/* Action Buttons: Cancel, Save & Add Another, Save Inventory */}
        <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end w-full md:w-auto shrink-0">
          <button
            type="button"
            id="cancel-inventory-btn"
            onClick={onBackToInventory}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-semibold text-xs transition cursor-pointer text-center"
          >
            Cancel
          </button>

          {!editingProduct && (
            <button
              type="button"
              id="save-and-add-another-btn"
              data-testid="save-and-add-another-btn"
              onClick={() => handleSave(true)}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial min-h-[38px] px-3 py-1.5 rounded-lg border border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="truncate">Save & Add Another</span>
            </button>
          )}

          <button
            type="button"
            id="save-inventory-btn"
            data-testid="save-inventory-btn"
            onClick={() => handleSave(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto min-h-[38px] px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 shrink-0" />
            <span>{isSubmitting ? 'Saving...' : 'Save Inventory'}</span>
          </button>
        </div>
      </div>

      {/* Validation Alert Banner (if errors exist) */}
      {Object.keys(validationErrors).length > 0 && (
        <div
          id="inventory-validation-banner"
          className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-red-800 dark:text-red-200 text-xs flex items-start gap-2.5 shadow-2xs"
        >
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <h4 className="font-bold text-xs">Please resolve the following required fields:</h4>
            <ul className="list-disc pl-4 space-y-0.5 text-xs text-red-700 dark:text-red-300">
              {Object.values(validationErrors).map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={() => setValidationErrors({})}
            className="text-red-400 hover:text-red-700 dark:hover:text-red-200 font-bold px-1.5 py-0.5 text-xs rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* MAIN STRUCTURED GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {/* LEFT 2 COLUMNS: PRODUCT INFORMATION & CONTROLS */}
        <div className="lg:col-span-2 space-y-3.5 sm:space-y-4">
          {/* SECTION 1: PRODUCT INFORMATION */}
          <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4.5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-700/60">
              <div className="w-6 h-6 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <Tag className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  1. Product Information
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Primary identification, classification, barcodes, and SKU codes.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {/* Product Name * */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="product-name-input"
                  type="text"
                  required
                  placeholder="e.g. JK Copier Paper A4 75 GSM (500 Sheets Ream)"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    validateField('name', e.target.value);
                  }}
                  className={`w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 transition text-xs sm:text-sm ${
                    validationErrors.name
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {validationErrors.name && (
                  <p className="text-red-500 text-[11px] mt-1 font-semibold">{validationErrors.name}</p>
                )}
              </div>

              {/* SKU * & Barcode in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                {/* Product SKU * */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      Product SKU <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      id="generate-sku-btn"
                      onClick={handleGenerateSKU}
                      className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Auto Generate</span>
                    </button>
                  </div>
                  <input
                    id="product-sku-input"
                    type="text"
                    required
                    placeholder="e.g. JK-PAP-101"
                    value={sku}
                    onChange={(e) => {
                      setSku(e.target.value.toUpperCase());
                      validateField('sku', e.target.value);
                    }}
                    className={`w-full px-2.5 py-1.5 sm:py-2 rounded-lg border font-mono bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold uppercase text-xs sm:text-sm transition ${
                      validationErrors.sku || duplicateSkuProduct
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-slate-200 dark:border-slate-700 focus:border-teal-500'
                    }`}
                  />
                  {duplicateSkuProduct && (
                    <p className="text-red-500 text-[11px] mt-1 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>Duplicate SKU! Already assigned to "{duplicateSkuProduct.name}".</span>
                    </p>
                  )}
                  {validationErrors.sku && !duplicateSkuProduct && (
                    <p className="text-red-500 text-[11px] mt-1 font-semibold">{validationErrors.sku}</p>
                  )}
                </div>

                {/* Barcode */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      Barcode (EAN-13 / UPC)
                    </label>
                    <button
                      type="button"
                      id="generate-barcode-btn"
                      onClick={handleGenerateBarcode}
                      className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Barcode className="w-3 h-3" />
                      <span>Generate EAN-13</span>
                    </button>
                  </div>
                  <input
                    id="product-barcode-input"
                    type="text"
                    placeholder="e.g. 8901234567890"
                    value={barcode}
                    onChange={(e) => {
                      setBarcode(e.target.value);
                      validateField('barcode', e.target.value);
                    }}
                    className={`w-full px-2.5 py-1.5 sm:py-2 rounded-lg border font-mono bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm transition ${
                      duplicateBarcodeProduct
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-slate-200 dark:border-slate-700 focus:border-teal-500'
                    }`}
                  />
                  {duplicateBarcodeProduct && (
                    <p className="text-red-500 text-[11px] mt-1 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>Duplicate Barcode: Used by "{duplicateBarcodeProduct.name}".</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Category *, Subcategory, Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5">
                {/* Product Category * */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Product Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="product-category-select"
                    required
                    value={category}
                    onChange={(e) => {
                      const newCat = e.target.value as StationeryCategory;
                      setCategory(newCat);
                      // suggest matching HSN code
                      if (newCat === 'Paper') setHsnCode('4802');
                      else if (newCat === 'Notebooks' || newCat === 'Books') setHsnCode('4820');
                      else if (newCat === 'Pens' || newCat === 'Pencils') setHsnCode('9608');
                      else if (newCat === 'Computer Accessories') setHsnCode('8472');
                    }}
                    className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs sm:text-sm"
                  >
                    {STATIONERY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subcategory */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subcategory
                  </label>
                  <input
                    id="product-subcategory-input"
                    type="text"
                    placeholder="e.g. Copier Paper, Ball Pen, Register"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm"
                  />
                </div>

                {/* Brand */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Brand
                  </label>
                  <input
                    id="product-brand-input"
                    type="text"
                    placeholder="e.g. JK Copier, Classmate, Cello"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Brand chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Popular:
                </span>
                {POPULAR_BRANDS.slice(0, 7).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBrand(b)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition cursor-pointer ${
                      brand.toLowerCase() === b.toLowerCase()
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>

              {/* Product Type & Unit of Measurement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 pt-0.5">
                {/* Product Type */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Product Type
                  </label>
                  <select
                    id="product-type-select"
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs sm:text-sm"
                  >
                    {PRODUCT_TYPES.map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {pt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Unit of Measurement (Piece, Box, Packet, Dozen, Kg, Gram, Litre, Meter) */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unit of Measurement (UoM)
                  </label>
                  <select
                    id="unit-of-measurement-select"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs sm:text-sm"
                  >
                    {UNITS_OF_MEASUREMENT.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* HSN/SAC Code, GST Rate, Tax Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5 pt-0.5">
                {/* HSN/SAC Code */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    HSN/SAC Code
                  </label>
                  <input
                    id="hsn-sac-code-input"
                    type="text"
                    placeholder="e.g. 4802"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border font-mono bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm"
                  />
                  <div className="flex items-center gap-1 flex-wrap mt-1">
                    {HSN_PRESETS.slice(0, 3).map((h) => (
                      <button
                        key={h.code}
                        type="button"
                        onClick={() => setHsnCode(h.code)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-teal-600 font-mono"
                      >
                        {h.code}
                      </button>
                    ))}
                  </div>
                </div>

                {/* GST Rate */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    GST Rate (%)
                  </label>
                  <select
                    id="gst-rate-select"
                    value={gstRate}
                    onChange={(e) => setGstRate(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs sm:text-sm"
                  >
                    {GST_RATES.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}% GST {rate === 0 ? '(Exempt)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tax Type */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tax Type
                  </label>
                  <select
                    id="tax-type-select"
                    value={taxType}
                    onChange={(e) => setTaxType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs sm:text-sm"
                  >
                    {TAX_TYPES.map((tt) => (
                      <option key={tt.id} value={tt.id}>
                        {tt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Description */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product Description
                </label>
                <textarea
                  id="product-description-input"
                  rows={2}
                  placeholder="Enter detailed specifications, page count, paper GSM, thickness, packaging details, and usage."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white leading-relaxed resize-y text-xs sm:text-sm"
                />
              </div>

              {/* Product Image Upload & Presets */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product Image Upload & Gallery
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5 items-start">
                  {/* Image Drag & Drop / Upload area */}
                  <div className="sm:col-span-2 space-y-2">
                    <div
                      id="product-image-upload-zone"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-400 rounded-xl p-3 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                        Click to upload image or drag & drop
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        PNG, JPG, WebP up to 5MB
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="Or paste external image URL..."
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[11px] text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setImageUrl(SAMPLE_STATIONERY_IMAGES[0].url)}
                        className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                      >
                        Reset
                      </button>
                    </div>

                    {/* Quick sample image picker */}
                    <div className="pt-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Select stationery sample photo:
                      </span>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {SAMPLE_STATIONERY_IMAGES.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setImageUrl(img.url)}
                            className={`w-10 h-10 rounded-lg overflow-hidden border-2 shrink-0 transition cursor-pointer relative ${
                              imageUrl === img.url
                                ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                                : 'border-slate-200 dark:border-slate-700 opacity-80 hover:opacity-100'
                            }`}
                            title={img.name}
                          >
                            <img
                              src={img.url}
                              alt={img.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Image Preview Box */}
                  <div className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xs relative group bg-white dark:bg-slate-800">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt="Product preview"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-7 h-7" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium mt-1.5">
                      Live Catalog Preview
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: STOCK QUANTITIES & INVENTORY CONTROL (Super Admin) */}
          <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4.5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-700/60">
              <div className="w-6 h-6 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <Package className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  2. Stock Quantities & Inventory Limits
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Super Admin authority over opening stock, live available inventory, reorder thresholds, and capacity.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 text-xs">
              {/* Opening Stock */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Opening Stock ({unit}s)
                </label>
                <input
                  id="inventory-opening-stock-input"
                  type="number"
                  min="0"
                  value={openingStock}
                  onChange={(e) => {
                    const val = Math.max(0, parseInt(e.target.value) || 0);
                    setOpeningStock(val);
                    if (!editingProduct) setCurrentStock(val);
                  }}
                  className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border font-bold text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Initial balance</span>
              </div>

              {/* Current Available Stock */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Stock ({unit}s)
                </label>
                <input
                  id="inventory-current-stock-input"
                  type="number"
                  min="0"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border font-bold text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-teal-700 dark:text-teal-400"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Live store balance</span>
              </div>

              {/* Minimum Stock / Reorder Point */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Min Stock (Reorder Alert)
                </label>
                <input
                  id="inventory-min-stock-input"
                  type="number"
                  min="1"
                  value={minimumStock}
                  onChange={(e) => setMinimumStock(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border font-bold text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-amber-600 dark:text-amber-400"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Triggers low stock badge</span>
              </div>

              {/* Maximum Stock Capacity */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Max Capacity
                </label>
                <input
                  id="inventory-max-stock-input"
                  type="number"
                  min="1"
                  value={maximumStock}
                  onChange={(e) => setMaximumStock(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border font-bold text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Bin storage capacity</span>
              </div>
            </div>

            {/* Live Stock Health Indicator */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-600 dark:text-slate-400 text-[11px] sm:text-xs">Inventory Health:</span>
                {currentStock <= 0 ? (
                  <span className="px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 text-[11px]">
                    Out of Stock
                  </span>
                ) : currentStock <= minimumStock ? (
                  <span className="px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-[11px] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Low Stock Warning
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Healthy Stock ({currentStock} {unit}s ready)
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400">
                Reorder triggered when ≤ {minimumStock} {unit}s
              </span>
            </div>
          </div>

          {/* SECTION 3: PRICING & PROFIT MARGINS (Super Admin) */}
          <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4.5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-700/60">
              <div className="w-6 h-6 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <Coins className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  3. Pricing & Margin Controls
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Super Admin control over purchase cost, retail selling rate, MRP, and wholesale pricing.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 text-xs">
              {/* Purchase / Cost Price */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Purchase / Cost Price (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    id="inventory-purchase-price-input"
                    type="number"
                    min="0"
                    step="0.5"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full pl-6 pr-2.5 py-1.5 sm:py-2 rounded-lg border font-bold text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">What store pays supplier</span>
              </div>

              {/* Selling Price */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Selling Price / Rate (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-teal-600 font-bold text-xs">₹</span>
                  <input
                    id="inventory-selling-price-input"
                    type="number"
                    min="0"
                    step="0.5"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full pl-6 pr-2.5 py-1.5 sm:py-2 rounded-lg border font-bold text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-teal-700 dark:text-teal-400"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Retail customer rate</span>
              </div>

              {/* MRP */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Printed MRP (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    id="inventory-mrp-input"
                    type="number"
                    min="0"
                    step="0.5"
                    value={mrp}
                    onChange={(e) => setMrp(parseFloat(e.target.value) || 0)}
                    className="w-full pl-6 pr-2.5 py-1.5 sm:py-2 rounded-lg border font-bold text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Max retail price</span>
              </div>

              {/* Wholesale / B2B Rate */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Wholesale / B2B Price (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-indigo-500 font-bold text-xs">₹</span>
                  <input
                    id="inventory-wholesale-price-input"
                    type="number"
                    min="0"
                    step="0.5"
                    value={wholesalePrice}
                    onChange={(e) => setWholesalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full pl-6 pr-2.5 py-1.5 sm:py-2 rounded-lg border font-bold text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-400"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Schools / Bulk orders</span>
              </div>
            </div>

            {/* Profit Margin & Markup Display */}
            <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Profit / Unit</span>
                <span className={`font-black text-xs sm:text-sm ${marginPerUnit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {formatINR(marginPerUnit)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Gross Margin</span>
                <span className={`font-black text-xs sm:text-sm ${marginPercentage >= 15 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {marginPercentage.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Markup on Cost</span>
                <span className="font-black text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                  {markupPercentage.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">MRP Discount</span>
                <span className="font-black text-xs sm:text-sm text-teal-600">
                  {mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0}% Off
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 4: SUPPLIERS & WAREHOUSE LOCATION (Super Admin) */}
          <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4.5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-700/60">
              <div className="w-6 h-6 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <Warehouse className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  4. Supplier & Warehouse Location
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Assign primary vendor source, storage warehouse, and exact shelf/bin coordinates.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 text-xs">
              {/* Supplier Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Primary Supplier
                  </label>
                  <button
                    type="button"
                    onClick={() => setQuickAddSupplierOpen(!quickAddSupplierOpen)}
                    className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Quick Add Vendor</span>
                  </button>
                </div>
                <select
                  id="inventory-supplier-select"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs sm:text-sm"
                >
                  <option value="">-- Select Registered Supplier --</option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} ({sup.phone})
                    </option>
                  ))}
                </select>

                {/* Quick Add Supplier Popup/Form */}
                {quickAddSupplierOpen && (
                  <div className="mt-2 p-2.5 bg-teal-50 dark:bg-teal-950/40 rounded-lg border border-teal-200 dark:border-teal-800 space-y-2">
                    <p className="text-[11px] font-bold text-teal-900 dark:text-teal-200">
                      Add New Supplier Instantly:
                    </p>
                    <input
                      type="text"
                      placeholder="Supplier Name (e.g. JK Paper Distributors)"
                      value={newSupplierName}
                      onChange={(e) => setNewSupplierName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 text-xs"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Phone Number"
                        value={newSupplierPhone}
                        onChange={(e) => setNewSupplierPhone(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleQuickAddSupplier}
                        className="px-2.5 py-1.5 bg-teal-600 text-white rounded-lg font-bold text-xs hover:bg-teal-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Supplier SKU / Ref Code */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supplier Item Code / Ref
                </label>
                <input
                  id="inventory-supplier-sku-input"
                  type="text"
                  placeholder="e.g. JK-CAT-A4-75G"
                  value={supplierSku}
                  onChange={(e) => setSupplierSku(e.target.value)}
                  className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border font-mono bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm"
                />
              </div>

              {/* Warehouse Facility */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Warehouse Facility
                </label>
                <select
                  id="inventory-warehouse-select"
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                  className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs sm:text-sm"
                >
                  {WAREHOUSE_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Storage Rack / Bin / Shelf */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rack / Bin / Shelf Location
                </label>
                <input
                  id="inventory-location-input"
                  type="text"
                  placeholder="e.g. Aisle 2, Rack C, Bin 14"
                  value={warehouseLocation}
                  onChange={(e) => setWarehouseLocation(e.target.value)}
                  className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* SECTION 5: INVENTORY HISTORY & INITIAL AUDIT ENTRY (Super Admin) */}
          <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4.5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-700/60">
              <div className="w-6 h-6 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <History className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  5. Inventory History & Audit Entry
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  The Super Admin has complete authority over the inventory audit log. Saving records the initial transaction.
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Audit Entry Note (Recorded in permanent ledger)
                </label>
                <input
                  id="inventory-initial-note-input"
                  type="text"
                  value={initialAuditNote}
                  onChange={(e) => setInitialAuditNote(e.target.value)}
                  className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm"
                />
              </div>

              {/* Preview of ledger entry */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1 font-mono text-[11px]">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Ledger Event:</span>
                  <span className="font-bold text-emerald-600">INITIAL_STOCK_RECORD</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Opening Balance:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    +{openingStock} {unit}s @ {formatINR(purchasePrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Authorized Officer:</span>
                  <span className="font-bold text-teal-600">
                    Super Admin: {currentAdminUser?.name || 'Ramesh Sharma (Owner)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Timestamp:</span>
                  <span className="text-slate-400">{new Date().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT 1 COLUMN: LIVE SUMMARY & AUDIT PREVIEW */}
        <div className="space-y-3.5 sm:space-y-4">
          {/* Live Summary Card */}
          <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 sticky top-4">
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <span>Inventory Item Summary</span>
              <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {sku || 'PENDING-SKU'}
              </span>
            </h3>

            {/* Product card preview */}
            <div className="flex gap-2.5 items-center">
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100">
                <img
                  src={imageUrl}
                  alt={name || 'Preview'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                  {name || 'Product Name Preview'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {brand || 'Brand'} • {category}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-black text-xs text-teal-600">
                    {formatINR(sellingPrice)}
                  </span>
                  <span className="text-[10px] text-slate-400 line-through">
                    {formatINR(mrp)}
                  </span>
                </div>
              </div>
            </div>

            {/* GST Tax Breakdown */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                GST Tax Calculation:
              </span>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                <span>Tax Type:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{taxType}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                <span>GST Rate:</span>
                <span className="font-bold text-teal-600">{gstRate}%</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                <span>Base Taxable Value:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{formatINR(taxableBase)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                <span>CGST ({gstRate / 2}%):</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{formatINR(cgstAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                <span>SGST ({gstRate / 2}%):</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{formatINR(sgstAmount)}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-1 flex justify-between font-bold text-slate-900 dark:text-white text-xs">
                <span>Total Tax / Unit:</span>
                <span className="font-mono text-teal-600">{formatINR(gstAmount)}</span>
              </div>
            </div>

            {/* Valuation & Capital Allocation */}
            <div className="p-2.5 bg-teal-50/60 dark:bg-teal-950/40 rounded-lg border border-teal-200 dark:border-teal-800/60 space-y-1 text-xs">
              <div className="flex justify-between text-teal-900 dark:text-teal-200 font-semibold">
                <span>Total Inventory Value:</span>
                <span className="font-black text-xs sm:text-sm text-teal-700 dark:text-teal-300">
                  {formatINR(openingStock * purchasePrice)}
                </span>
              </div>
              <p className="text-[10px] text-teal-700/80 dark:text-teal-400">
                {openingStock} {unit}s @ {formatINR(purchasePrice)} cost
              </p>
              <div className="flex justify-between text-[11px] text-teal-800 dark:text-teal-300 pt-1 border-t border-teal-200 dark:border-teal-800">
                <span>Retail Realization:</span>
                <span className="font-bold">{formatINR(openingStock * sellingPrice)}</span>
              </div>
            </div>

            {/* Super Admin Control Checklist */}
            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pt-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Super Admin Controls:
              </span>
              <div className="flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>Stock creation & limits configured</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>Pricing & wholesale tiers defined</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>GST ({gstRate}%) & HSN verified</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>Warehouse bin location assigned</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>Initial ledger audit log generated</span>
              </div>
            </div>

            {/* Bottom Quick Save Buttons */}
            <div className="pt-1.5 space-y-2">
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={isSubmitting}
                className="w-full min-h-[38px] py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer touch-manipulation"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Inventory</span>
              </button>

              {!editingProduct && (
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  disabled={isSubmitting}
                  className="w-full min-h-[38px] py-2 px-3 rounded-lg border border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-teal-100 transition cursor-pointer touch-manipulation"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save & Add Another</span>
                </button>
              )}

              <button
                type="button"
                onClick={onBackToInventory}
                className="w-full min-h-[36px] py-1.5 text-center text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer touch-manipulation flex items-center justify-center"
              >
                Back to Inventory
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
