import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CategoryItem } from '../types';
import {
  BookOpen,
  PenTool,
  Paperclip,
  Printer,
  Package,
  Layers,
  Palette,
  Briefcase,
  Gift,
  Compass,
  ArrowRight,
  Database,
  RefreshCw,
  Plus,
  Check,
  Copy,
  FolderPlus,
  X,
  Radio,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Notebooks: <BookOpen className="w-8 h-8 text-teal-600" />,
  Pens: <PenTool className="w-8 h-8 text-blue-600" />,
  Pencils: <PenTool className="w-8 h-8 text-amber-600" />,
  Paper: <Layers className="w-8 h-8 text-indigo-600" />,
  'Files & Folders': <Paperclip className="w-8 h-8 text-emerald-600" />,
  'Art & Craft': <Palette className="w-8 h-8 text-rose-600" />,
  'School Supplies': <Compass className="w-8 h-8 text-orange-600" />,
  'Office Supplies': <Briefcase className="w-8 h-8 text-purple-600" />,
  'Printing Supplies': <Printer className="w-8 h-8 text-cyan-600" />,
  Books: <BookOpen className="w-8 h-8 text-teal-600" />,
  'Computer Accessories': <Printer className="w-8 h-8 text-slate-600" />,
  'Packaging Materials': <Package className="w-8 h-8 text-amber-700" />,
  'Gift Items': <Gift className="w-8 h-8 text-pink-600" />,
  Other: <Layers className="w-8 h-8 text-slate-500" />,
};

const CATEGORY_SQL_SCHEMA = `-- Run in Supabase SQL Editor (Project: swgsurkqupfnmcmcxpdx)
-- 1. Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT,
    description TEXT,
    icon_name TEXT DEFAULT 'Layers',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on categories" ON public.categories
    FOR SELECT USING (true);

CREATE POLICY "Allow anon insert on categories" ON public.categories
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon update on categories" ON public.categories
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon delete on categories" ON public.categories
    FOR DELETE USING (true);

-- 3. Seed Default Stationery Categories
INSERT INTO public.categories (id, name, slug, description, icon_name, display_order, is_active)
VALUES
    ('cat-paper', 'Paper', 'paper', 'A4 Copier reams, bond paper, photo gloss sheets, drafting sheets and letterheads.', 'Layers', 1, true),
    ('cat-notebooks', 'Notebooks', 'notebooks', 'Long notebooks, spiral registers, hardbound ledger accounts, school ruled and graph books.', 'BookOpen', 2, true),
    ('cat-pens', 'Pens', 'pens', 'Ballpoint, rollerball, premium gel pens, permanent markers, highlighters and calligraphy ink.', 'PenTool', 3, true),
    ('cat-pencils', 'Pencils', 'pencils', 'Wooden graphite pencils, mechanical clutch pencils, lead refills and drawing pencils.', 'PenTool', 4, true),
    ('cat-files', 'Files & Folders', 'files-folders', 'Lever arch board files, ring binders, display books, clear zip pouches and folders.', 'Paperclip', 5, true),
    ('cat-office', 'Office Supplies', 'office-supplies', 'Desk staplers, heavy punchers, sticky note pads, scissors, tape dispensers and pins.', 'Briefcase', 6, true),
    ('cat-school', 'School Supplies', 'school-supplies', 'Geometry compass boxes, exam clips, drawing sheets, erasers, sharpeners and covers.', 'Compass', 7, true),
    ('cat-art', 'Art & Craft', 'art-craft', 'Acrylic tubes, watercolor sets, brushes, sketching pads, modeling clay and craft glue.', 'Palette', 8, true),
    ('cat-printing', 'Printing Supplies', 'printing-supplies', 'Copier cartridges, thermal billing rolls, carbonless paper and sublimation sheets.', 'Printer', 9, true),
    ('cat-books', 'Books', 'books', 'General registers, ledger books, cash books, stock books, and school reference books.', 'BookOpen', 10, true),
    ('cat-computer', 'Computer Accessories', 'computer-accessories', 'USB flash drives, mousepads, cleaning kits, cable ties and printer cables.', 'Printer', 11, true),
    ('cat-packaging', 'Packaging Materials', 'packaging-materials', 'Brown carton tape, bubble wrap rolls, corrugated boxes and stretch films.', 'Package', 12, true),
    ('cat-gifts', 'Gift Items', 'gift-items', 'Executive pen sets, desk organizer clocks, gift wrappers and diary gift hampers.', 'Gift', 13, true),
    ('cat-other', 'Other', 'other', 'Specialty stationery accessories, tags, labels and stamp pads.', 'Layers', 14, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    icon_name = EXCLUDED.icon_name,
    display_order = EXCLUDED.display_order;`;

export const CategoriesView: React.FC = () => {
  const {
    products,
    categories,
    addCategory,
    seedCategoriesToSupabaseDatabase,
    syncWithSupabase,
    isSupabaseConnected,
    isSupabaseSyncing,
    supabaseProjectId,
    setActiveView,
    setSelectedCategoryFilter,
    isAdminLoggedIn,
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // New category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Layers');

  const handleSelect = (catName: string) => {
    setSelectedCategoryFilter(catName);
    setActiveView('products');
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(CATEGORY_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await addCategory({
      name: newCatName.trim(),
      description: newCatDesc.trim(),
      iconName: newCatIcon,
    });
    setNewCatName('');
    setNewCatDesc('');
    setShowAddModal(false);
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
      await seedCategoriesToSupabaseDatabase();
    } finally {
      setIsSeeding(false);
    }
  };

  const renderIcon = (cat: CategoryItem) => {
    if (CATEGORY_ICONS[cat.name]) {
      return CATEGORY_ICONS[cat.name];
    }
    switch (cat.iconName) {
      case 'BookOpen':
        return <BookOpen className="w-8 h-8 text-teal-600" />;
      case 'PenTool':
        return <PenTool className="w-8 h-8 text-blue-600" />;
      case 'Paperclip':
        return <Paperclip className="w-8 h-8 text-emerald-600" />;
      case 'Printer':
        return <Printer className="w-8 h-8 text-cyan-600" />;
      case 'Package':
        return <Package className="w-8 h-8 text-amber-700" />;
      case 'Palette':
        return <Palette className="w-8 h-8 text-rose-600" />;
      case 'Briefcase':
        return <Briefcase className="w-8 h-8 text-purple-600" />;
      case 'Gift':
        return <Gift className="w-8 h-8 text-pink-600" />;
      case 'Compass':
        return <Compass className="w-8 h-8 text-orange-600" />;
      default:
        return <Layers className="w-8 h-8 text-slate-600" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Stationery Categories
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              {categories.length} Categories
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Browse our extensive catalog of paper reams, writing instruments, office supplies, and student essentials.
          </p>
        </div>

        {/* Database Connection & Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Supabase Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Database className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="hidden sm:inline">Supabase Project:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{supabaseProjectId}</span>
            <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          </div>

          {/* Sync Button */}
          <button
            onClick={() => syncWithSupabase()}
            disabled={isSupabaseSyncing}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            title="Fetch latest categories and products from Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSupabaseSyncing ? 'animate-spin text-teal-600' : ''}`} />
            <span>{isSupabaseSyncing ? 'Syncing...' : 'Sync DB'}</span>
          </button>

          {/* Seed to Supabase Button */}
          <button
            onClick={handleSeedDatabase}
            disabled={isSeeding}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 flex items-center gap-1.5 transition cursor-pointer"
            title="Push categories list directly to Supabase categories table"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isSeeding ? 'Pushing...' : 'Push to Supabase'}</span>
          </button>

          {/* SQL Setup Helper */}
          <button
            onClick={() => setShowSqlModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>Supabase SQL</span>
          </button>

          {/* Add Category (Admin) */}
          {isAdminLoggedIn && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          )}
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categories.map((cat) => {
          const count = products.filter(
            (p) => (p.category || '').toLowerCase() === cat.name.toLowerCase()
          ).length;

          return (
            <div
              key={cat.id || cat.name}
              onClick={() => handleSelect(cat.name)}
              className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 hover:border-teal-500 hover:shadow-lg transition-all duration-200 cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center group-hover:scale-110 group-hover:bg-teal-50 dark:group-hover:bg-teal-950 transition-transform">
                  {renderIcon(cat)}
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-teal-600 transition">
                      {cat.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {cat.description || 'Quality paper, stationery, and office equipment.'}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {count} Products
                </span>
                <span className="text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* SQL Setup Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full shadow-2xl p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Supabase Categories Table SQL Schema
                </h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Run this script once in your Supabase SQL Editor for project{' '}
              <span className="font-mono font-bold text-teal-600">{supabaseProjectId}</span>. It creates the{' '}
              <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-slate-800 dark:text-slate-200">
                public.categories
              </code>{' '}
              table, configures Row Level Security (RLS), and seeds all default stationery categories.
            </p>

            <div className="relative flex-1 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 font-mono text-xs text-slate-200 p-4">
              <div className="absolute top-2 right-2">
                <button
                  onClick={handleCopySql}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans font-semibold flex items-center gap-1.5 transition"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy SQL</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="overflow-auto max-h-72 text-[11px] leading-relaxed pr-20">
                {CATEGORY_SQL_SCHEMA}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <a
                href={`https://supabase.com/dashboard/project/${supabaseProjectId}/sql`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Open Supabase SQL Editor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateCategory}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Add New Category
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g., Thermal Rolls, Art Canvas"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Brief description of items in this category"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Icon Style
                </label>
                <select
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                >
                  <option value="Layers">Layers (Paper & Sheets)</option>
                  <option value="BookOpen">BookOpen (Registers & Ledgers)</option>
                  <option value="PenTool">PenTool (Pens & Markers)</option>
                  <option value="Paperclip">Paperclip (Files & Office)</option>
                  <option value="Briefcase">Briefcase (Corporate & Desk)</option>
                  <option value="Compass">Compass (Student Geometry)</option>
                  <option value="Palette">Palette (Art & Craft)</option>
                  <option value="Printer">Printer (Cartridges & Rolls)</option>
                  <option value="Package">Package (Cartons & Tapes)</option>
                  <option value="Gift">Gift (Hampers & Pen Sets)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Save Category
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
