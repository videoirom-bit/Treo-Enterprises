import React from 'react';

interface ABCStoreLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'compact' | 'invoice';
  inverted?: boolean;
  className?: string;
}

export const ABCStoreLogo: React.FC<ABCStoreLogoProps> = ({
  size = 'md',
  variant = 'full',
  inverted = false,
  className = '',
}) => {
  // Dimension definitions
  const iconDimensions = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }[size];

  const textSizeClasses = {
    xs: { main: 'text-xs', sub: 'text-[9px]' },
    sm: { main: 'text-sm', sub: 'text-[10px]' },
    md: { main: 'text-base sm:text-lg', sub: 'text-[11px]' },
    lg: { main: 'text-xl sm:text-2xl', sub: 'text-xs' },
    xl: { main: 'text-2xl sm:text-3xl', sub: 'text-sm' },
  }[size];

  const primaryColor = inverted ? '#60a5fa' : '#1e40af'; // Royal / Blue 800 or Blue 400
  const accentColor = inverted ? '#34d399' : '#059669';  // Emerald 500 / 600
  const tealColor = inverted ? '#2dd4bf' : '#0d9488';    // Teal 500 / 600

  const LogoIcon = (
    <div className={`relative ${iconDimensions} shrink-0 select-none flex items-center justify-center`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
        aria-hidden="true"
      >
        <defs>
          {/* Paper Sheet Gradient */}
          <linearGradient id="abcPaperGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>

          {/* Fold accent gradient */}
          <linearGradient id="abcFoldGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>

          {/* Paper Shadow */}
          <filter id="subtlePaperShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Outer Hexagon / Rounded Paper Sheet Base */}
        <rect
          x="6"
          y="6"
          width="88"
          height="88"
          rx="22"
          className={inverted ? 'fill-slate-800 stroke-blue-400/40' : 'fill-white stroke-slate-200'}
          strokeWidth="2.5"
          filter="url(#subtlePaperShadow)"
        />

        {/* Paper Folded Sheet (Top Right Corner Fold Origami Motif) */}
        <path
          d="M 68 6 L 94 32 L 68 32 Z"
          className={inverted ? 'fill-emerald-400/80' : 'fill-emerald-500'}
        />
        <path
          d="M 68 6 L 68 32 L 94 32"
          stroke={accentColor}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Modern Geometric Treo Letter 'T' & Paper Fold Origami Motif */}
        <path
          d="M 22 34 L 78 34"
          stroke="url(#abcPaperGrad)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M 50 34 L 50 72"
          stroke="url(#abcPaperGrad)"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Origami chevron fold wing */}
        <path
          d="M 26 52 L 50 68 L 74 52"
          stroke="url(#abcFoldGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Micro Pen Nib / Ruler Accent along the bottom baseline */}
        <path
          d="M 22 79 L 78 79"
          stroke={accentColor}
          strokeWidth="2.5"
          strokeDasharray="3 3"
          strokeLinecap="round"
        />
        <circle cx="82" cy="79" r="2" fill="#2563eb" />
      </svg>
    </div>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center ${className}`}>{LogoIcon}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 ${className}`}>
      {LogoIcon}

      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`font-black tracking-tight ${textSizeClasses.main} ${
              inverted ? 'text-white' : 'text-slate-900 dark:text-white'
            }`}
          >
            <span className="text-blue-700 dark:text-blue-400">Treo</span>{' '}
            <span className="text-slate-800 dark:text-slate-100">Enterprises</span>
          </span>
          {variant !== 'compact' && (
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40 uppercase tracking-wider">
              Est. 2026
            </span>
          )}
        </div>

        {variant !== 'compact' && (
          <p
            className={`font-medium tracking-normal truncate ${textSizeClasses.sub} ${
              inverted ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Order Tracking • GST Invoicing • Stationery
          </p>
        )}
      </div>
    </div>
  );
};
