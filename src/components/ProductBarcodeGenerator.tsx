import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';

// Safe polyfill for canvas 2D context in testing/headless environments
if (typeof document !== 'undefined') {
  try {
    const testCanvas = document.createElement('canvas');
    if (!testCanvas.getContext || !testCanvas.getContext('2d')) {
      (HTMLCanvasElement.prototype as any).getContext = () => ({
        font: '',
        measureText: (text: string) => ({ width: (text ? text.length : 8) * 8 }),
        fillRect: () => {},
        clearRect: () => {},
        getImageData: () => ({ data: [] }),
        putImageData: () => {},
        createImageData: () => [],
        setTransform: () => {},
        drawImage: () => {},
        save: () => {},
        fillText: () => {},
        restore: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        stroke: () => {},
        translate: () => {},
        scale: () => {},
        rotate: () => {},
        arc: () => {},
        fill: () => {},
      });
    }
  } catch {
    // Ignore in environments without window/document
  }
}

export interface ProductBarcodeGeneratorProps {
  sku: string;
  barcodeFallback?: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  margin?: number;
  format?: 'CODE128' | 'EAN13' | 'UPC';
  className?: string;
  svgId?: string;
}

export const ProductBarcodeGenerator: React.FC<ProductBarcodeGeneratorProps> = ({
  sku,
  barcodeFallback,
  width = 1.8,
  height = 45,
  displayValue = true,
  fontSize = 12,
  margin = 4,
  format = 'CODE128',
  className = '',
  svgId,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const rawText = (sku || barcodeFallback || '').trim();
    if (!rawText) {
      setError('Missing SKU or Barcode data');
      return;
    }

    try {
      setError(null);
      // Clean previous rendered children
      while (svgRef.current.firstChild) {
        svgRef.current.removeChild(svgRef.current.firstChild);
      }

      JsBarcode(svgRef.current, rawText, {
        format: format || 'CODE128',
        width: width,
        height: height,
        displayValue: displayValue,
        font: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: fontSize,
        textMargin: 3,
        margin: margin,
        background: '#ffffff',
        lineColor: '#000000',
      });
    } catch (err: any) {
      console.warn('JsBarcode rendering error:', err);
      // If requested format failed (e.g. alphanumeric text in numeric-only EAN13), fallback to CODE128
      if (format !== 'CODE128' && svgRef.current) {
        try {
          while (svgRef.current.firstChild) {
            svgRef.current.removeChild(svgRef.current.firstChild);
          }
          JsBarcode(svgRef.current, rawText, {
            format: 'CODE128',
            width: width,
            height: height,
            displayValue: displayValue,
            font: 'ui-monospace, monospace',
            fontSize: fontSize,
            textMargin: 3,
            margin: margin,
            background: '#ffffff',
            lineColor: '#000000',
          });
          setError(null);
          return;
        } catch (fallbackErr: any) {
          setError(fallbackErr.message || 'Failed to render barcode');
        }
      } else {
        setError(err.message || 'Failed to render barcode');
      }
    }
  }, [sku, barcodeFallback, width, height, displayValue, fontSize, margin, format]);

  if (error) {
    return (
      <div className={`p-2 rounded border border-rose-200 bg-rose-50 text-rose-700 text-xs text-center font-mono ${className}`}>
        <span>Unable to encode barcode ({error})</span>
      </div>
    );
  }

  return (
    <svg
      ref={svgRef}
      id={svgId}
      data-testid="product-barcode-svg"
      data-sku={sku}
      className={`max-w-full h-auto mx-auto block ${className}`}
    />
  );
};
