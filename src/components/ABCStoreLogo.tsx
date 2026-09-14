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
    sm: 'h-9',
    md: 'h-11 sm:h-12',
    lg: 'h-14 sm:h-16',
    xl: 'h-20 sm:h-24',
    '2xl': 'h-28 sm:h-32',
  }[size];

  const iconDimensions = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    '2xl': 'w-28 h-28',
  }[size];

  const textSizeClasses = {
    xs: { main: 'text-xs', sub: 'text-[9px]' },
    sm: { main: 'text-sm', sub: 'text-[10px]' },
    md: { main: 'text-base sm:text-lg', sub: 'text-[11px]' },
    lg: { main: 'text-xl sm:text-2xl', sub: 'text-xs' },
    xl: { main: 'text-2xl sm:text-3xl', sub: 'text-sm' },
    '2xl': { main: 'text-3xl sm:text-4xl', sub: 'text-base' },
  }[size];

  // Mascot Icon SVG (Cute Deer Mascot waving hello with antlers in a clean rounded pill/circle)
  const MascotIcon = (
    <div className={`relative ${iconDimensions} shrink-0 select-none flex items-center justify-center`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="treoMascotBg" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor={inverted ? '#1e293b' : '#eff6ff'} />
            <stop offset="100%" stopColor={inverted ? '#0f172a' : '#dbeafe'} />
          </radialGradient>
        </defs>

        {/* Rounded Base Badge */}
        <rect
          x="3"
          y="3"
          width="94"
          height="94"
          rx="24"
          fill="url(#treoMascotBg)"
          stroke="#081d58"
          strokeWidth="3"
        />

        {/* Deer Antlers */}
        {/* Left Antler */}
        <path
          d="M44 32 C41 26 34 18 30 12 C33 15 36 19 37 22 C34 17 29 11 26 6 C28 10 31 15 32 18 C29 13 27 9 26 4 C29 8 34 16 36 22 C39 16 42 10 43 5 C45 11 46 19 45 27 Z"
          fill="#fef08a"
          stroke="#081d58"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Right Antler */}
        <path
          d="M56 32 C59 26 66 18 70 12 C67 15 64 19 63 22 C66 17 71 11 74 6 C72 10 69 15 68 18 C71 13 73 9 74 4 C71 8 66 16 64 22 C61 16 58 10 57 5 C55 11 54 19 55 27 Z"
          fill="#fef08a"
          stroke="#081d58"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Ears */}
        <path
          d="M36 38 C28 35 24 28 31 22 C39 23 41 31 36 38 Z"
          fill="#ea580c"
          stroke="#081d58"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M35 36 C30 33 27 28 32 25 C37 26 39 31 35 36 Z" fill="#fbcfe8" />

        <path
          d="M64 38 C72 35 76 28 69 22 C61 23 59 31 64 38 Z"
          fill="#ea580c"
          stroke="#081d58"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M65 36 C70 33 73 28 68 25 C63 26 61 31 65 36 Z" fill="#fbcfe8" />

        {/* Head */}
        <ellipse cx="50" cy="42" rx="18" ry="16" fill="#f97316" stroke="#081d58" strokeWidth="1.8" />
        {/* Forehead hair tuft */}
        <path d="M47 27 C49 23 51 24 51 26 C52 22 54 23 53 27 C55 24 57 25 56 28 Z" fill="#f97316" stroke="#081d58" strokeWidth="1.2" />

        {/* Muzzle & cheeks */}
        <path
          d="M36 43 C36 36 42 37 50 39 C58 37 64 36 64 43 C64 52 58 55 50 55 C42 55 36 52 36 43 Z"
          fill="#fffbeb"
          stroke="#081d58"
          strokeWidth="1.2"
        />

        {/* Cheeks Blush */}
        <ellipse cx="39" cy="48" rx="3.5" ry="2" fill="#f472b6" opacity="0.7" />
        <ellipse cx="61" cy="48" rx="3.5" ry="2" fill="#f472b6" opacity="0.7" />

        {/* Eyes with sparkle */}
        <ellipse cx="43" cy="43" rx="3.2" ry="3.8" fill="#1e1b4b" />
        <circle cx="42" cy="41.5" r="1.3" fill="#ffffff" />
        <circle cx="44" cy="44.5" r="0.6" fill="#ffffff" />

        <ellipse cx="57" cy="43" rx="3.2" ry="3.8" fill="#1e1b4b" />
        <circle cx="56" cy="41.5" r="1.3" fill="#ffffff" />
        <circle cx="58" cy="44.5" r="0.6" fill="#ffffff" />

        {/* Nose & Smile */}
        <path d="M48.5 47 Q50 46 51.5 47 Q50 49 48.5 47 Z" fill="#1e1b4b" />
        <path d="M47.5 50 Q50 53 52.5 50" fill="none" stroke="#1e1b4b" strokeWidth="1.2" strokeLinecap="round" />

        {/* Yellow Shirt */}
        <path d="M42 56 Q50 57 58 56 L60 74 Q50 76 40 74 Z" fill="#facc15" stroke="#081d58" strokeWidth="1.5" strokeLinejoin="round" />

        {/* Waving Arm & Hand */}
        <path d="M42 59 C37 56 33 51 29 44" fill="none" stroke="#facc15" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M42 59 C37 56 33 51 29 44" fill="none" stroke="#081d58" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="28" cy="43" r="2.8" fill="#ea580c" stroke="#081d58" strokeWidth="1.2" />

        {/* Green Pants */}
        <path d="M44 73 L42 90 L47 90 L49 79 L51 79 L53 90 L58 90 L56 73 Z" fill="#16a34a" stroke="#081d58" strokeWidth="1.5" strokeLinejoin="round" />
        {/* White Shoes */}
        <path d="M40 89 Q39 92 42 93 L47 93 Q48 91 47 89 Z" fill="#ffffff" stroke="#081d58" strokeWidth="1.2" />
        <path d="M53 89 Q52 91 53 93 L58 93 Q61 92 60 89 Z" fill="#ffffff" stroke="#081d58" strokeWidth="1.2" />
      </svg>
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
    <div className={`inline-flex items-center gap-2.5 sm:gap-3.5 ${className}`}>
      {/* Brand Mascot Icon */}
      {MascotIcon}

      {/* Brand Typography & Pill Badge */}
      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-1.5 leading-none">
          {/* Colorful Bubbly "TREO" Accent */}
          <div className="flex items-center font-black tracking-tight text-base sm:text-xl font-sans drop-shadow-2xs">
            <span className="text-red-500 font-extrabold">T</span>
            <span className="text-blue-600 font-extrabold">R</span>
            <span className="text-cyan-500 font-extrabold">E</span>
            <span className="text-amber-500 font-extrabold">O</span>
          </div>

          {/* Bold ENTERPRISES */}
          <span
            className={`font-black tracking-tight ${textSizeClasses.main} ${
              inverted ? 'text-white' : 'text-blue-950 dark:text-white'
            }`}
          >
            ENTERPRISES
          </span>
        </div>

        {/* Subtitle Pill Badge: PAPER & OFFICE SUPPLIES */}
        <div className="mt-1 flex items-center gap-1.5">
          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider uppercase bg-[#081d58] text-white shadow-xs">
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
