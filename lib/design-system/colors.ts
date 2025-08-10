/**
 * Unified color system for the application
 * Using Tailwind CSS classes as the source of truth
 */

export const colors = {
  // Brand colors
  brand: {
    primary: 'blue-500',
    primaryHover: 'blue-600',
    primaryLight: 'blue-100',
    primaryDark: 'blue-900',
    secondary: 'purple-600',
    secondaryHover: 'purple-700',
    secondaryLight: 'purple-100',
    secondaryDark: 'purple-900',
  },

  // Status colors
  status: {
    success: 'green-500',
    successLight: 'green-100',
    successDark: 'green-900',
    error: 'red-500',
    errorLight: 'red-100',
    errorDark: 'red-900',
    warning: 'yellow-500',
    warningLight: 'yellow-100',
    warningDark: 'yellow-900',
    info: 'blue-500',
    infoLight: 'blue-100',
    infoDark: 'blue-900',
  },

  // Neutral colors
  neutral: {
    white: 'white',
    black: 'black',
    gray: {
      50: 'gray-50',
      100: 'gray-100',
      200: 'gray-200',
      300: 'gray-300',
      400: 'gray-400',
      500: 'gray-500',
      600: 'gray-600',
      700: 'gray-700',
      800: 'gray-800',
      900: 'gray-900',
    },
  },

  // Tier colors
  tier: {
    free: {
      bg: 'bg-gray-100 dark:bg-gray-900',
      text: 'text-gray-800 dark:text-gray-200',
      border: 'border-gray-300 dark:border-gray-700',
    },
    premium: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-800 dark:text-purple-200',
      border: 'border-purple-300 dark:border-purple-700',
    },
    unlimited: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-800 dark:text-amber-200',
      border: 'border-amber-300 dark:border-amber-700',
    },
  },

  // Compression type colors
  compression: {
    zst: {
      bg: 'bg-purple-100 dark:bg-purple-900',
      text: 'text-purple-800 dark:text-purple-200',
    },
    lz4: {
      bg: 'bg-blue-100 dark:bg-blue-900',
      text: 'text-blue-800 dark:text-blue-200',
    },
    gzip: {
      bg: 'bg-green-100 dark:bg-green-900',
      text: 'text-green-800 dark:text-green-200',
    },
    none: {
      bg: 'bg-gray-100 dark:bg-gray-900',
      text: 'text-gray-800 dark:text-gray-200',
    },
    bz2: {
      bg: 'bg-orange-100 dark:bg-orange-900',
      text: 'text-orange-800 dark:text-orange-200',
    },
    xz: {
      bg: 'bg-indigo-100 dark:bg-indigo-900',
      text: 'text-indigo-800 dark:text-indigo-200',
    },
    default: {
      bg: 'bg-gray-100 dark:bg-gray-900',
      text: 'text-gray-800 dark:text-gray-200',
    },
  },

  // Archive format colors
  archive: {
    tar: {
      bg: 'bg-emerald-100 dark:bg-emerald-900',
      text: 'text-emerald-800 dark:text-emerald-200',
    },
    zip: {
      bg: 'bg-sky-100 dark:bg-sky-900',
      text: 'text-sky-800 dark:text-sky-200',
    },
    '7z': {
      bg: 'bg-violet-100 dark:bg-violet-900',
      text: 'text-violet-800 dark:text-violet-200',
    },
    default: {
      bg: 'bg-gray-100 dark:bg-gray-900',
      text: 'text-gray-800 dark:text-gray-200',
    },
  },

  // Gradient patterns
  gradients: {
    primary: 'from-blue-500 to-purple-600',
    success: 'from-green-500 to-blue-600',
    premium: 'from-purple-500 to-pink-600',
    dark: 'from-gray-900 via-gray-800 to-gray-900',
  },
} as const;

// Helper function to get compression color
export function getCompressionColor(type: string) {
  switch (type) {
    case 'zst':
    case 'zstd':
      return colors.compression.zst;
    case 'lz4':
      return colors.compression.lz4;
    case 'gz':
    case 'gzip':
      return colors.compression.gzip;
    case 'none':
      return colors.compression.none;
    case 'bz2':
    case 'bzip2':
      return colors.compression.bz2;
    case 'xz':
      return colors.compression.xz;
    default:
      return colors.compression.default;
  }
}

// Helper function to get archive format color
export function getArchiveColor(format: string | null) {
  if (!format) return colors.archive.default;
  
  switch (format) {
    case 'tar':
      return colors.archive.tar;
    case 'zip':
      return colors.archive.zip;
    case '7z':
      return colors.archive['7z'];
    default:
      return colors.archive.default;
  }
}

// Helper function to get tier color
export function getTierColor(tier: string) {
  const normalizedTier = tier?.toLowerCase().trim();
  
  // Handle all ultra tier variations
  if (normalizedTier === 'ultra' || normalizedTier === 'unlimited' || normalizedTier === 'ultimate' || normalizedTier === 'enterprise') {
    return colors.tier.unlimited; // Use the unlimited color for all ultra variations
  }
  
  if (normalizedTier === 'premium') return colors.tier.premium;
  
  return colors.tier.free;
}