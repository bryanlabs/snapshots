/**
 * Typography system for consistent text styling
 */

export const typography = {
  // Headings
  h1: 'text-4xl font-bold tracking-tight',
  h2: 'text-3xl font-bold tracking-tight',
  h3: 'text-2xl font-semibold',
  h4: 'text-xl font-semibold',
  h5: 'text-lg font-medium',
  h6: 'text-base font-medium',

  // Body text
  body: {
    large: 'text-lg',
    base: 'text-base',
    small: 'text-sm',
    xs: 'text-xs',
  },

  // Special text
  lead: 'text-xl text-gray-600 dark:text-gray-400',
  muted: 'text-gray-500 dark:text-gray-400',
  code: 'font-mono text-sm bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded',
  
  // Links
  link: {
    base: 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors',
    subtle: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors',
  },
} as const;