/**
 * Unified Design System
 * 
 * This module exports all design tokens and utilities for consistent UI styling
 * across the application. Use these instead of hardcoding Tailwind classes.
 */

export * from './colors';
export * from './typography';
export * from './spacing';
export * from './components';

// Re-export commonly used utilities
export { cn } from '@/lib/utils';

// Design system documentation
export const designSystem = {
  name: 'Blockchain Snapshots Design System',
  version: '1.0.0',
  description: 'Unified design tokens and components for consistent UI',
  
  principles: [
    'Consistency: Use predefined tokens instead of custom values',
    'Dark Mode First: All components must support dark mode',
    'Accessibility: Follow WCAG 2.1 AA standards',
    'Performance: Minimize CSS bundle size',
    'Responsive: Mobile-first approach',
  ],

  usage: {
    colors: 'Use color tokens from colors.ts instead of Tailwind classes directly',
    typography: 'Use typography presets for all text elements',
    spacing: 'Use spacing tokens for consistent margins and padding',
    components: 'Use component presets as base styles, extend as needed',
  },

  examples: {
    card: `
      import { components } from '@/lib/design-system';
      <div className={components.card.interactive}>...</div>
    `,
    button: `
      import { components } from '@/lib/design-system';
      <button className={cn(components.button.base, components.button.variant.primary)}>
        Click me
      </button>
    `,
    typography: `
      import { typography } from '@/lib/design-system';
      <h1 className={typography.h1}>Page Title</h1>
    `,
  },
};