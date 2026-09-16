import React from 'react';

interface ABCStoreLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'full' | 'icon' | 'compact' | 'invoice' | 'emblem';
  inverted?: boolean;
  className?: string;
}

export const ABCStoreLogo: React.FC<ABCStoreLogoProps> = ({
  size = 'md',
  variant = 'full',
  inverted = false,
  className = '',
}) => {
  // Dimension definitions for emblem/image
  const heightClasses = {
    xs: 'h-7',
    sm: 'h-8 sm:h-9',
    md: 'h-8.5 sm:h-12',
    lg: 'h-14 sm:h-16',
    xl: 'h-20 sm:h-24',
    '2xl': 'h-28 sm:h-32',
  }[size];

  const iconDimensions = {
    xs: 'w-7 h-7',
    sm: 'w-8 h-8 sm:w-10 sm:h-10',
    md: 'w-9.5 h-9.5 sm:w-12 sm:h-12',
    lg: 'w-14 h-14 sm:w-16 sm:h-16',
    xl: 'w-20 h-20 sm:w-24 sm:h-24',
    '2xl': 'w-28 h-28 sm:w-32 sm:h-32',
  }[size];

  const textSizeClasses = {
    xs: { main: 'text-xs', sub: 'text-[9px]' },
    sm: { main: 'text-xs sm:text-sm', sub: 'text-[9px] sm:text-[10px]' },
    md: { main: 'text-xs sm:text-base lg:text-lg', sub: 'text-[9px] sm:text-[11px]' },
    lg: { main: 'text-xl sm:text-2xl', sub: 'text-xs' },
    xl: { main: 'text-2xl sm:text-3xl', sub: 'text-sm' },
    '2xl': { main: 'text-3xl sm:text-4xl', sub: 'text-base' },
  }[size];

  // Official Treo Brand Picture Logo (Sangai deer mascot, colorful Manipuri & TREO bubble lettering, Enterprises & Paper Supplies)
  const MascotIcon = (
    <div
      className={`relative ${iconDimensions} shrink-0 select-none flex items-center justify-center p-0.5 rounded-xl bg-white border border-slate-200/80 dark:border-slate-700/80 shadow-xs transition-transform duration-200 group-hover:scale-105 overflow-hidden`}
    >
      <img
        src="/treo-logo.svg"
        alt="Treo Enterprises Official Logo"
        className="w-full h-full object-contain select-none bg-white rounded-lg"
        referrerPolicy="no-referrer"
      />
    </div>
  );

  // Variant: Emblem (Exact complete vector logo as a standalone image/SVG)
  if (variant === 'emblem') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <img
          src="/treo-logo.svg"
          alt="Treo Enterprises - Paper & Office Supplies"
          className={`${heightClasses} w-auto object-contain select-none`}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Variant: Icon (Only the Mascot in its badge)
  if (variant === 'icon') {
    return <div className={`inline-flex items-center ${className}`}>{MascotIcon}</div>;
  }

  // Variant: Invoice (Specialized for printable GST Invoices)
  if (variant === 'invoice') {
    return (
      <div className={`inline-flex items-center gap-3.5 ${className}`}>
        <img
          src="/treo-logo.svg"
          alt="Treo Enterprises Logo"
          className="h-16 w-auto object-contain select-none"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Variant: Full (Mascot + Treo Enterprises branding)
  return (
    <div className={`inline-flex items-center gap-2 sm:gap-3.5 max-w-full ${className}`}>
      {/* Brand Mascot Icon */}
      {MascotIcon}

      {/* Brand Typography & Pill Badge */}
      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-1 sm:gap-1.5 leading-none">
          {/* Colorful Bubbly "TREO" Accent */}
          <div className="flex items-center font-black tracking-tight text-sm sm:text-xl font-sans drop-shadow-2xs shrink-0">
            <span className="text-red-500 font-extrabold">T</span>
            <span className="text-emerald-500 font-extrabold">R</span>
            <span className="text-cyan-500 font-extrabold">E</span>
            <span className="text-amber-500 font-extrabold">O</span>
          </div>

          {/* Bold ENTERPRISES */}
          <span
            className={`font-black tracking-tight truncate ${textSizeClasses.main} ${
              inverted ? 'text-white' : 'text-blue-950 dark:text-white'
            }`}
          >
            ENTERPRISES
          </span>
        </div>

        {/* Subtitle Pill Badge: PAPER & OFFICE SUPPLIES */}
        <div className="mt-0.5 sm:mt-1 flex items-center gap-1 sm:gap-1.5">
          <span className="inline-block px-1.5 py-0.5 sm:px-2 rounded-full text-[8px] sm:text-[10px] font-bold tracking-wider uppercase bg-[#081d58] text-white shadow-xs truncate max-w-[140px] sm:max-w-none">
            Paper &amp; Office Supplies
          </span>
          {variant !== 'compact' && (
            <span className="hidden md:inline-block text-[9px] font-medium text-slate-500 dark:text-slate-400">
              • GST Verified
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
