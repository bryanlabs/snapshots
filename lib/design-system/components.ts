/**
 * Component style presets for consistency
 */

import { colors } from './colors';

export const components = {
  // Cards
  card: {
    base: 'bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700',
    hover: 'hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all',
    interactive: 'bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer',
    glassmorphic: 'bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50',
  },

  // Buttons - matching existing button.tsx variants
  button: {
    base: 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    variant: {
      default: 'bg-gray-900 text-gray-50 hover:bg-gray-900/90 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90',
      destructive: 'bg-red-500 text-gray-50 hover:bg-red-500/90 dark:bg-red-900 dark:text-gray-50 dark:hover:bg-red-900/90',
      outline: 'border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-100/80 dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-800/80',
      ghost: 'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-50',
      link: 'text-gray-900 underline-offset-4 hover:underline dark:text-gray-50',
      gradient: `bg-gradient-to-r ${colors.gradients.primary} text-white hover:shadow-lg transform hover:scale-105 transition-all`,
    },
    size: {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    },
  },

  // Badges
  badge: {
    base: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
    variant: {
      default: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      secondary: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    },
  },

  // Inputs
  input: {
    base: 'flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300',
    error: 'border-red-500 focus-visible:ring-red-500',
  },

  // Tooltips
  tooltip: {
    base: 'absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-800 rounded-md shadow-lg pointer-events-none whitespace-nowrap',
  },

  // Modals/Dialogs
  modal: {
    overlay: 'fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm',
    content: 'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white dark:bg-gray-800 p-6 shadow-lg duration-200',
  },

  // Loading states
  loading: {
    spinner: 'animate-spin h-5 w-5 text-gray-500',
    skeleton: 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded',
  },

  // Alerts
  alert: {
    base: 'relative w-full rounded-lg border p-4',
    variant: {
      default: 'bg-white text-gray-950 dark:bg-gray-950 dark:text-gray-50',
      destructive: 'border-red-500/50 text-red-600 dark:border-red-500 dark:text-red-400',
      success: 'border-green-500/50 text-green-600 dark:border-green-500 dark:text-green-400',
      warning: 'border-yellow-500/50 text-yellow-600 dark:border-yellow-500 dark:text-yellow-400',
    },
  },
} as const;