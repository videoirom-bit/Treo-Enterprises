import React, { useState } from 'react';
import {
  Barcode,
  Printer,
  Download,
  Copy,
  Check,
  X,
  Tag,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { Product, ShopSettings } from '../types';
import { formatINR } from '../utils/gstUtils';
import { ProductBarcodeGenerator } from './ProductBarcodeGenerator';

export interface ProductBarcodeModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  shopSettings?: ShopSettings;
}

export type BarcodeLabelStyle = 'retail' | 'compact' | 'minimal';
export type BarcodeDataSource = 'sku' | 'barcode';

export const ProductBarcodeModal: React.FC<ProductBarcodeModalProps> = ({
  product,
  isOpen,
  onClose,
  shopSettings,
}) => {
  const [dataSource, setDataSource] = useState<BarcodeDataSource>('sku');
  const [labelStyle, setLabelStyle] = useState<BarcodeLabelStyle>('retail');
  const [copies, setCopies] = useState<number>(1);
  const [showStoreName, setShowStoreName] = useState<boolean>(true);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showHsn, setShowHsn] = useState<boolean>(true);
  const [showTextBelow, setShowTextBelow] = useState<boolean>(true);
  const [copiedSku, setCopiedSku] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  if (!isOpen || !product) return null;

  const currentEncodeValue =
    dataSource === 'sku' ? product.sku : product.barcode || product.sku;

  const storeTitle = shopSettings?.shopName || 'ABC Paper & Stationery';

  const handleCopySku = () => {
    navigator.clipboard.writeText(currentEncodeValue);
    setCopiedSku(true);
    setTimeout(() => setCopiedSku(false), 2000);
  };

  const handlePrint = () => {
    setIsPrinting(true);
    document.body.classList.add('printing-barcode-mode');

    // Slight delay to allow DOM render of printable sheets before print dialog
    setTimeout(() => {
      window.print();
      // Clean up after print dialog closes or completes
      const handleAfterPrint = () => {
        document.body.classList.remove('printing-barcode-mode');
        setIsPrinting(false);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
      window.addEventListener('afterprint', handleAfterPrint);

      // Fallback cleanup if afterprint does not fire in some browsers
      setTimeout(() => {
        document.body.classList.remove('printing-barcode-mode');
        setIsPrinting(false);
      }, 1500);
    }, 150);
  };

  const handleDownloadSVG = () => {
    const svgEl = document.getElementById('preview-barcode-svg');
    if (!svgEl) return;

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgEl);

    // Add XML namespaces if not present
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!source.match(/^<svg[^>]+xmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"/)) {
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    const preface = '<?xml version="1.0" standalone="no"?>\r\n';
    const svgBlob = new Blob([preface, source], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `Barcode_${product.sku.replace(/[^a-zA-Z0-9_-]/g, '_')}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  const handleDownloadPNG = () => {
    const svgEl = document.getElementById('preview-barcode-svg');
    if (!svgEl) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgEl);
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Render at 2x resolution for crisp barcode printing
      const scale = 2;
      canvas.width = (img.width || 300) * scale;
      canvas.height = (img.height || 120) * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = `Barcode_${product.sku.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(pngUrl);
          }
        }, 'image/png');
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // Render an individual label item for preview or sheet printing
  const renderSingleLabel = (isSheetItem: boolean = false, keyIndex?: number) => {
    return (
      <div
        key={keyIndex}
        data-testid="barcode-label-item"
        className={`bg-white text-slate-900 border border-slate-300 rounded-lg p-3 text-center flex flex-col items-center justify-between transition-all ${
          isSheetItem
            ? 'page-break-inside-avoid shadow-none w-full max-w-[220px] mx-auto min-h-[140px]'
            : 'shadow-md w-full max-w-[280px] min-h-[170px]'
        }`}
      >
        {/* Store Title */}
        {showStoreName && labelStyle !== 'minimal' && (
          <div className="w-full border-b border-slate-100 pb-1 mb-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-700 block truncate">
              {storeTitle}
            </span>
          </div>
        )}

        {/* Product Title & Brand */}
        {labelStyle !== 'minimal' && (
          <div className="w-full px-1 mb-1">
            <span className="text-xs font-bold leading-tight line-clamp-2 block text-slate-900">
              {product.name}
            </span>
            {product.brand && (
              <span className="text-[10px] text-slate-500 font-medium block">
                {product.brand} • {product.category}
              </span>
            )}
          </div>
        )}

        {/* Barcode Graphic SVG */}
        <div className="my-1 flex items-center justify-center w-full overflow-hidden bg-white">
          <ProductBarcodeGenerator
            sku={currentEncodeValue}
            displayValue={showTextBelow}
            width={labelStyle === 'compact' ? 1.4 : 1.7}
            height={labelStyle === 'compact' ? 38 : labelStyle === 'minimal' ? 55 : 44}
            fontSize={labelStyle === 'compact' ? 10 : 12}
            svgId={!isSheetItem ? 'preview-barcode-svg' : undefined}
            className="w-full"
          />
        </div>

        {/* Bottom Price and HSN Details */}
        {(showPrice || showHsn) && labelStyle !== 'minimal' && (
          <div className="w-full pt-1 mt-1 border-t border-slate-100 flex items-center justify-between px-1">
            {showHsn ? (
              <span className="text-[9px] font-mono text-slate-500">
                HSN: {product.hsnCode}
              </span>
            ) : (
              <span className="text-[9px] text-slate-400">GST {product.gstRate}%</span>
            )}

            {showPrice && (
              <div className="text-right">
                <span className="text-xs font-black text-slate-900">
                  MRP {formatINR(product.sellingPrice)}
                </span>
                <span className="text-[8px] text-slate-500 block leading-none">
                  (Incl. Taxes)
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Interactive Modal Dialog */}
      <div
        id="product-barcode-modal"
        data-testid="product-barcode-modal"
        className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:hidden"
      >
        <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl max-w-4xl w-full p-4 sm:p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-700 my-4 sm:my-8 max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Barcode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Product Barcode & Price Tag</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200">
                    {product.sku}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                  {product.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              aria-label="Close barcode dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-xs">
            {/* Left Column: Live Sticker Preview */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-teal-600" />
                <span>Live Sticker Preview</span>
              </span>

              {/* Rendered Sticker Tag */}
              <div className="p-2 bg-white dark:bg-slate-950 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800">
                {renderSingleLabel(false)}
              </div>

              {/* Quick SKU Action pills */}
              <div className="flex items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleCopySku}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] flex items-center gap-1.5 transition"
                >
                  {copiedSku ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied SKU</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy SKU</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSVG}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] flex items-center gap-1.5 transition"
                  title="Download SVG Vector graphic"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>SVG</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPNG}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] flex items-center gap-1.5 transition"
                  title="Download PNG Image"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>PNG</span>
                </button>
              </div>

              <div className="mt-4 text-[11px] text-slate-400 text-center max-w-xs flex items-center gap-1 justify-center">
                <Info className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Compatible with standard optical & 2D barcode scanners.</span>
              </div>
            </div>

            {/* Right Column: Customization Controls & Print Configuration */}
            <div className="md:col-span-7 space-y-4">
              {/* Data Source Selection */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Barcode Data Source
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDataSource('sku')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col transition ${
                      dataSource === 'sku'
                        ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="font-bold">Product SKU (Standard)</span>
                    <span className="font-mono text-[10px] text-slate-500 truncate">
                      {product.sku}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDataSource('barcode')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col transition ${
                      dataSource === 'barcode'
                        ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="font-bold">EAN / Barcode Field</span>
                    <span className="font-mono text-[10px] text-slate-500 truncate">
                      {product.barcode || 'Same as SKU'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Tag Style Layout */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Label Format Preset
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setLabelStyle('retail')}
                    className={`p-2 rounded-xl border text-center transition font-semibold ${
                      labelStyle === 'retail'
                        ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Standard Retail
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabelStyle('compact')}
                    className={`p-2 rounded-xl border text-center transition font-semibold ${
                      labelStyle === 'compact'
                        ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Compact Shelf
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabelStyle('minimal')}
                    className={`p-2 rounded-xl border text-center transition font-semibold ${
                      labelStyle === 'minimal'
                        ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Barcode Only
                  </button>
                </div>
              </div>

              {/* Label Content Toggles */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Tag Visibility Options
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={showStoreName}
                      onChange={(e) => setShowStoreName(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Store Header</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={showPrice}
                      onChange={(e) => setShowPrice(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Selling Price (MRP)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={showHsn}
                      onChange={(e) => setShowHsn(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>HSN Code</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={showTextBelow}
                      onChange={(e) => setShowTextBelow(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>SKU Text Below Bars</span>
                  </label>
                </div>
              </div>

              {/* Quantity / Sheet Copies Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Quantity of Labels to Print
                  </label>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {copies} label{copies === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {[1, 4, 8, 12, 24].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setCopies(cnt)}
                      className={`flex-1 py-1.5 px-2 rounded-lg border font-bold text-xs transition ${
                        copies === cnt
                          ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {cnt} {cnt === 24 ? '(A4)' : ''}
                    </button>
                  ))}

                  <div className="w-20">
                    <input
                      type="number"
                      min={1}
                      max={96}
                      value={copies}
                      onChange={(e) => setCopies(Math.max(1, Math.min(96, Number(e.target.value) || 1)))}
                      className="w-full py-1.5 px-2 rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-center font-mono font-bold"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  Select 24 labels for standard 3×8 A4 die-cut sticker sheets, or 1 for single thermal label printers.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  id="print-barcode-action-btn"
                  onClick={handlePrint}
                  disabled={isPrinting}
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 text-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>
                    {isPrinting ? 'Preparing Print...' : `Print ${copies} Barcode Label${copies === 1 ? '' : 's'}`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden printable container that activates only during @media print */}
      <div
        id="printable-barcode-container"
        data-testid="printable-barcode-container"
        className="hidden print:block"
      >
        <div className="w-full max-w-[210mm] mx-auto p-4 bg-white text-slate-900">
          <div className="text-center pb-2 mb-3 border-b border-slate-200 print:hidden">
            <h2 className="text-sm font-bold uppercase">{storeTitle}</h2>
            <p className="text-xs">Barcode Labels Batch - SKU: {product.sku}</p>
          </div>

          {/* Grid layout for labels */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: copies }).map((_, idx) => renderSingleLabel(true, idx))}
          </div>
        </div>
      </div>
    </>
  );
};
