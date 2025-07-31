# Design System Documentation

## Overview

The Blockchain Snapshots application uses a unified design system to ensure consistency across all UI components. This document outlines the design tokens, patterns, and best practices.

## Core Principles

1. **Consistency First**: Use predefined tokens instead of custom values
2. **Dark Mode Support**: All components must work in both light and dark themes
3. **Accessibility**: Follow WCAG 2.1 AA standards
4. **Performance**: Minimize CSS bundle size through token reuse
5. **Mobile-First**: Design for mobile devices first, then scale up

## Design Tokens

### Colors

```typescript
import { colors, getCompressionColor, getTierColor } from '@/lib/design-system';

// Brand colors
colors.brand.primary      // blue-500
colors.brand.secondary    // purple-600

// Status colors
colors.status.success     // green-500
colors.status.error       // red-500

// Tier-specific colors
getTierColor('premium')   // Returns premium tier colors
getTierColor('free')      // Returns free tier colors

// Compression type colors
getCompressionColor('lz4') // Returns LZ4 compression colors
```

### Typography

```typescript
import { typography } from '@/lib/design-system';

// Headings
<h1 className={typography.h1}>Page Title</h1>
<h2 className={typography.h2}>Section Title</h2>

// Body text
<p className={typography.body.base}>Regular text</p>
<p className={typography.muted}>Muted text</p>

// Special text
<code className={typography.code}>code snippet</code>
<a className={typography.link.base}>Link text</a>
```

### Spacing

```typescript
import { spacing } from '@/lib/design-system';

// Page layout
<div className={cn(spacing.page.container, spacing.page.px)}>
  <main className={spacing.page.maxWidth.lg}>
    ...
  </main>
</div>

// Component spacing
<div className={spacing.component.stack.md}>
  <Card className={spacing.component.card}>...</Card>
  <Card className={spacing.component.card}>...</Card>
</div>

// Grid layouts
<div className={cn('grid', spacing.grid.cols[3], spacing.grid.gap.md)}>
  ...
</div>
```

### Components

```typescript
import { components } from '@/lib/design-system';
import { cn } from '@/lib/utils';

// Cards
<div className={components.card.base}>Basic card</div>
<div className={components.card.interactive}>Clickable card</div>
<div className={components.card.glassmorphic}>Glassmorphic card</div>

// Buttons
<button className={cn(
  components.button.base,
  components.button.variant.primary,
  components.button.size.default
)}>
  Primary Button
</button>

// Badges
<span className={cn(
  components.badge.base,
  components.badge.variant.success
)}>
  Success
</span>

// Alerts
<div className={cn(
  components.alert.base,
  components.alert.variant.warning
)}>
  Warning message
</div>
```

## Component Patterns

### Card with Header and Actions

```tsx
<div className={components.card.base}>
  <div className="p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className={typography.h4}>Card Title</h3>
      <button className={cn(
        components.button.base,
        components.button.variant.ghost,
        components.button.size.sm
      )}>
        Action
      </button>
    </div>
    <div className={typography.body.base}>
      Card content goes here...
    </div>
  </div>
</div>
```

### Form Layout

```tsx
<form className={spacing.component.stack.md}>
  <div>
    <label className={typography.body.small}>Email</label>
    <input type="email" className={components.input.base} />
  </div>
  
  <div>
    <label className={typography.body.small}>Password</label>
    <input type="password" className={components.input.base} />
  </div>
  
  <button className={cn(
    components.button.base,
    components.button.variant.primary,
    components.button.size.default,
    'w-full'
  )}>
    Submit
  </button>
</form>
```

### Status Indicators

```tsx
// Download status badge
function getStatusBadge(status: string) {
  const variant = status === 'active' 
    ? components.badge.variant.success
    : status === 'error'
    ? components.badge.variant.error
    : components.badge.variant.default;
    
  return (
    <span className={cn(components.badge.base, variant)}>
      {status}
    </span>
  );
}
```

## Best Practices

### Do's

1. **Use design tokens** for all styling decisions
2. **Compose utilities** using the `cn()` helper
3. **Test in both themes** (light and dark mode)
4. **Keep components small** and composable
5. **Document deviations** when custom styling is necessary

### Don'ts

1. **Don't hardcode colors** - use the color system
2. **Don't create one-off utilities** - extend the design system
3. **Don't mix design systems** - stick to our patterns
4. **Don't forget dark mode** - all components must support it
5. **Don't ignore accessibility** - use semantic HTML and ARIA

## Migration Guide

When updating existing components:

1. Import design system utilities:
   ```tsx
   import { components, typography, spacing, colors } from '@/lib/design-system';
   import { cn } from '@/lib/utils';
   ```

2. Replace hardcoded classes with tokens:
   ```tsx
   // Before
   <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
   
   // After
   <div className={cn(components.card.base, 'p-6')}>
   ```

3. Use helper functions for dynamic styles:
   ```tsx
   // Before
   const color = type === 'premium' 
     ? 'bg-purple-100 text-purple-800' 
     : 'bg-gray-100 text-gray-800';
   
   // After
   const { bg, text } = getTierColor(type);
   ```

## Extending the Design System

To add new tokens or patterns:

1. Add to the appropriate file in `/lib/design-system/`
2. Export from the index file
3. Document the addition in this guide
4. Update affected components

## Tools and Resources

- **Tailwind CSS**: Our underlying utility framework
- **Radix UI**: Unstyled, accessible component primitives
- **CVA**: Class variance authority for component variants
- **Design System Playground**: `/test` page for testing components

## Accessibility Checklist

- [ ] Color contrast ratio ≥ 4.5:1 for normal text
- [ ] Color contrast ratio ≥ 3:1 for large text
- [ ] Interactive elements have focus states
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Error messages are announced
- [ ] Keyboard navigation works
- [ ] Screen reader tested