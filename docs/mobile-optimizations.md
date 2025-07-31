# Mobile Optimizations Documentation

## Overview

The application includes comprehensive mobile optimizations to ensure a smooth experience on smartphones and tablets. These optimizations cover performance, usability, and device-specific features.

## Components

### 1. MobileOptimizedImage

Located: `/components/mobile/MobileOptimizedImage.tsx`

Optimized image loading for mobile devices:
- **Responsive sizing** - Different image sizes for different screens
- **Lazy loading** - Images load as they enter viewport
- **Blur placeholder** - Shows blurred preview while loading
- **Error handling** - Graceful fallback for failed loads

```tsx
<MobileOptimizedImage
  src="/path/to/image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority={false} // true for above-fold images
  sizes="(max-width: 640px) 100vw, (max-width: 768px) 80vw, 50vw"
/>
```

### 2. MobileMenu

Located: `/components/mobile/MobileMenu.tsx`

Bottom navigation bar for mobile devices:
- **Auto-hide on scroll** - Maximizes content area
- **Active state indicators** - Shows current page
- **Touch-optimized targets** - 44px minimum touch area
- **Conditional items** - Shows auth-only items when logged in

Features:
- Home, Chains, Downloads, Billing, Account/Sign In
- Fixed position at bottom of viewport
- Disappears when scrolling down, reappears when scrolling up

### 3. SwipeableCard

Located: `/components/mobile/SwipeableCard.tsx`

Touch gesture support for cards:
- **Swipe left/right** - Custom actions on swipe
- **Visual feedback** - Card moves with finger
- **Threshold detection** - Requires minimum swipe distance
- **Smooth animations** - Hardware-accelerated transforms

```tsx
<SwipeableCard
  onSwipeLeft={() => console.log('Swiped left')}
  onSwipeRight={() => console.log('Swiped right')}
  threshold={100}
>
  <Card>Content</Card>
</SwipeableCard>
```

### 4. PullToRefresh

Located: `/components/mobile/PullToRefresh.tsx`

Native-like pull-to-refresh functionality:
- **Visual indicator** - Shows pull progress
- **Resistance effect** - Rubber band animation
- **Loading state** - Spinner during refresh
- **Smooth transitions** - Natural feel

```tsx
<PullToRefresh onRefresh={async () => await refetch()}>
  <SnapshotList />
</PullToRefresh>
```

## Hooks

### useMobileDetect

Detects device type and capabilities:

```tsx
const { isMobile, isTablet, isIOS, isAndroid, isTouchDevice } = useMobileDetect();

if (isMobile) {
  // Show mobile-specific UI
}
```

### useBreakpoint

Responsive breakpoint detection:

```tsx
const breakpoint = useBreakpoint(); // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

if (breakpoint === 'xs' || breakpoint === 'sm') {
  // Mobile layout
}
```

## Performance Optimizations

### 1. Viewport Meta Tag

```tsx
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover", // iPhone notch support
};
```

### 2. Touch Optimizations

- **Passive event listeners** - Better scroll performance
- **Touch-action CSS** - Prevents unwanted gestures
- **Will-change hints** - GPU acceleration

### 3. Image Optimization

- **WebP/AVIF formats** - Smaller file sizes
- **Responsive images** - Different sizes for different screens
- **Lazy loading** - Load images as needed
- **Blur placeholders** - Perceived performance

### 4. Bundle Optimization

- **Code splitting** - Load mobile components only on mobile
- **Tree shaking** - Remove unused desktop code
- **Dynamic imports** - Load features on demand

## CSS Optimizations

### Mobile-First Styles

```css
/* Base mobile styles */
.component {
  padding: 1rem;
  font-size: 14px;
}

/* Tablet and up */
@media (min-width: 768px) {
  .component {
    padding: 2rem;
    font-size: 16px;
  }
}
```

### Touch-Friendly Targets

- Minimum 44x44px touch targets
- Adequate spacing between interactive elements
- Visual feedback on touch (`:active` states)

### Safe Areas

Support for device safe areas (notches, home indicators):

```css
.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom);
}
```

## Best Practices

### 1. Performance

- **Minimize JavaScript** - Use CSS for animations
- **Reduce network requests** - Bundle assets
- **Optimize fonts** - Use system fonts on mobile
- **Compress images** - Use appropriate quality

### 2. Usability

- **Large touch targets** - 44px minimum
- **Clear visual feedback** - Show touch states
- **Readable text** - 16px minimum font size
- **Adequate contrast** - WCAG AA compliance

### 3. Navigation

- **Thumb-friendly zones** - Bottom navigation
- **Gesture support** - Swipe between screens
- **Back button handling** - Proper history management
- **Scroll position** - Restore on navigation

### 4. Forms

- **Input types** - Use appropriate keyboard
- **Autocomplete** - Enable for common fields
- **Error messages** - Clear and actionable
- **Submit buttons** - Always visible

## Testing

### Device Testing

Test on real devices when possible:
- iPhone SE (smallest)
- iPhone 14 Pro (notch)
- iPad (tablet)
- Android phones (various sizes)

### Browser Testing

- Safari iOS
- Chrome Android
- Samsung Internet
- Firefox Mobile

### Tools

- Chrome DevTools Device Mode
- BrowserStack for real devices
- Lighthouse for performance
- axe DevTools for accessibility

## Common Issues and Solutions

### 1. Fixed Positioning

**Issue**: Fixed elements cover content
**Solution**: Add padding to account for fixed elements

### 2. Viewport Height

**Issue**: 100vh includes browser chrome
**Solution**: Use CSS custom properties or -webkit-fill-available

### 3. Touch Delays

**Issue**: 300ms click delay
**Solution**: Use touch-action: manipulation

### 4. Overscroll

**Issue**: Unwanted bounce effects
**Solution**: Use overscroll-behavior: contain

## Future Enhancements

1. **Offline Support** - Service worker for offline access
2. **App Install** - PWA manifest for home screen
3. **Push Notifications** - Engage users
4. **Biometric Auth** - Touch/Face ID support
5. **Haptic Feedback** - Vibration on actions