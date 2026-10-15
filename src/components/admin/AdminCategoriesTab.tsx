import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Package,
  X,
  BookOpen,
  PenTool,
  Paperclip,
  Briefcase,
  Compass,
  Palette,
  Printer,
  Gift,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CategoryItem } from '../../types';
import { saveCategoryToSupabase, deleteCategoryFromSupabase } from '../../services/supabaseService';

export const AdminCategoriesTab: React.FC = () => {
  const { categories, products, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [deleteConfirmCategory, setDeleteConfirmCategory] = useState<CategoryItem | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    iconName: 'Layers',
    displayOrder: 1,
    isActive: true,
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Icon options
  const ICON_OPTIONS = [
    { label: 'Layers (General/Paper)', value: 'Layers' },
    { label: 'BookOpen (Notebooks/Registers)', value: 'BookOpen' },
    { label: 'PenTool (Pens & Pencils)', value: 'PenTool' },
    { label: 'Paperclip (Files & Folders)', value: 'Paperclip' },
    { label: 'Briefcase (Office Supplies)', value: 'Briefcase' },
    { label: 'Compass (School Supplies)', value: 'Compass' },
    { label: 'Palette (Art & Craft)', value: 'Palette' },
    { label: 'Printer (Printing & Ink)', value: 'Printer' },
    { label: 'Package (Packaging Material)', value: 'Package' },
    { label: 'Gift (Gifts & Executive Sets)', value: 'Gift' },
  ];

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        cat.name.toLowerCase().includes(q) ||
        (cat.description || '').toLowerCase().includes(q) ||
        (cat.slug || '').toLowerCase().includes(q)
      );
    });
  }, [categories, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      iconName: 'Layers',
      displayOrder: categories.length + 1,
      isActive: true,
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug || '',
      description: cat.description || '',
      iconName: cat.iconName || 'Layers',
      displayOrder: cat.displayOrder || 1,
      isActive: cat.isActive !== false,
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setFormError('Category name is required.');
      return;
    }

    // Duplicate check
    const duplicate = categories.find(
      (c) =>
        c.name.toLowerCase() === trimmedName.toLowerCase() &&
        (!editingCategory || c.id !== editingCategory.id)
    );
    if (duplicate) {
      setFormError(`A category named "${trimmedName}" already exists.`);
      return;
    }

    const slug = formData.slug.trim() || trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const categoryId = editingCategory ? editingCategory.id : `cat-${slug}`;

    const catObj: CategoryItem = {
      id: categoryId,
      name: trimmedName,
      slug,
      description: formData.description.trim(),
      iconName: formData.iconName,
      displayOrder: Number(formData.displayOrder) || 1,
      isActive: formData.isActive,
    };

    const res = await saveCategoryToSupabase(catObj);
    if (res.success) {
      showToast(editingCategory ? 'Updated category in Supabase.' : 'Added new category to Supabase.');
      setIsAddModalOpen(false);
      // Update local categories list dynamically if context has updater
    } else {
      setFormError(res.error || 'Failed to save category in Supabase.');
    }
  };

  const handleToggleActive = async (cat: CategoryItem) => {
    const updated: CategoryItem = { ...cat, isActive: !cat.isActive };
    const res = await saveCategoryToSupabase(updated);
    if (res.success) {
      showToast(`${cat.name} is now ${updated.isActive ? 'Active' : 'Disabled'}.`);
    } else {
      showToast('Error updating category status.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmCategory) return;
    const res = await deleteCategoryFromSupabase(deleteConfirmCategory.id);
    if (res.success) {
      showToast(`Deleted category "${deleteConfirmCategory.name}".`);
      setDeleteConfirmCategory(null);
    } else {
      showToast(res.error || 'Failed to delete category.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            Product Categories ({categories.length})
          </h2>
          <span className="text-xs text-slate-400">
            Categorize stationery, copier papers, printing materials, and office essentials.
          </span>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 shadow-xs max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredCategories.map((cat) => {
          const productCount = products.filter((p) => p.category === cat.name).length;
          const isActive = cat.isActive !== false;

          return (
            <div
              key={cat.id}
              className={`p-4 rounded-2xl bg-white dark:bg-slate-800 border transition shadow-xs flex flex-col justify-between ${
                isActive
                  ? 'border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  : 'border-slate-200 dark:border-slate-700 opacity-60 bg-slate-50 dark:bg-slate-850'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {cat.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono">
                        slug: /{cat.slug || cat.name.toLowerCase()}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700'
                    }`}
                  >
                    {isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 line-clamp-2">
                  {cat.description || 'Stationery and office supply catalog category.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-slate-400" />
                  {productCount} Products
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActive(cat)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    title={isActive ? 'Disable Category' : 'Enable Category'}
                  >
                    {isActive ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(cat)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 cursor-pointer"
                    title="Edit Category"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmCategory(cat)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD / EDIT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitCategory} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Paper, Notebooks, Printing Supplies"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  URL Slug (Optional)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. paper, printing-supplies"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Icon
                </label>
                <select
                  value={formData.iconName}
                  onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                >
                  {ICON_OPTIONS.map((ico) => (
                    <option key={ico.value} value={ico.value}>
                      {ico.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="A4 Copier reams, bond paper, registers..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="categoryIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <label
                  htmlFor="categoryIsActive"
                  className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Active & Visible in Catalog
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md cursor-pointer"
                >
                  {editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteConfirmCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Category?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to delete "{deleteConfirmCategory.name}"?
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setDeleteConfirmCategory(null)}
                className="flex-1 py-2 rounded-xl font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-xl font-bold bg-rose-600 text-white text-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
