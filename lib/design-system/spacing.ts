/**
 * Spacing system for consistent margins and padding
 */

export const spacing = {
  // Page-level spacing
  page: {
    px: 'px-4 sm:px-6 lg:px-8',
    py: 'py-6 sm:py-8 lg:py-12',
    container: 'container mx-auto',
    maxWidth: {
      sm: 'max-w-2xl',
      md: 'max-w-4xl',
      lg: 'max-w-6xl',
      xl: 'max-w-7xl',
      full: 'max-w-full',
    },
  },

  // Component spacing
  component: {
    card: 'p-4 sm:p-6',
    section: 'space-y-6',
    stack: {
      xs: 'space-y-1',
      sm: 'space-y-2',
      md: 'space-y-4',
      lg: 'space-y-6',
      xl: 'space-y-8',
    },
    inline: {
      xs: 'space-x-1',
      sm: 'space-x-2',
      md: 'space-x-4',
      lg: 'space-x-6',
      xl: 'space-x-8',
    },
  },

  // Grid layouts
  grid: {
    cols: {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    },
    gap: {
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8',
    },
  },
} as const;