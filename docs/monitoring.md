# Web Vitals and RUM (Real User Monitoring) Implementation

This document describes the performance monitoring implementation for the Snapshots Service.

## Overview

We've implemented comprehensive performance monitoring using:
1. **Web Vitals**: Core Web Vitals metrics (CLS, INP, LCP, FCP, TTFB)
2. **Real User Monitoring (RUM)**: Page views, timing, resources, and errors

## Web Vitals Implementation

### Core Web Vitals Tracked

1. **CLS (Cumulative Layout Shift)**
   - Measures visual stability
   - Good: < 0.1, Poor: > 0.25

2. **INP (Interaction to Next Paint)**
   - Measures responsiveness
   - Good: < 200ms, Poor: > 500ms

3. **LCP (Largest Contentful Paint)**
   - Measures loading performance
   - Good: < 2.5s, Poor: > 4s

4. **FCP (First Contentful Paint)**
   - Time to first content render
   - Good: < 1.8s, Poor: > 3s

5. **TTFB (Time to First Byte)**
   - Server response time
   - Good: < 800ms, Poor: > 1.8s

### Components

- **WebVitals Component**: `components/monitoring/WebVitals.tsx`
  - Automatically tracks all Core Web Vitals
  - Sends data to `/api/vitals` endpoint
  - Uses `navigator.sendBeacon` for reliability

- **API Endpoint**: `app/api/vitals/route.ts`
  - Collects and stores vitals data
  - Provides summary statistics
  - Alerts on poor performance

- **Dashboard**: `app/admin/vitals/page.tsx`
  - Admin-only dashboard
  - Real-time performance metrics
  - Performance score calculation

## Real User Monitoring (RUM)

### Data Collected

1. **Page Views**
   - URL, referrer, timestamp
   - Viewport and screen dimensions
   - User agent

2. **Page Timing**
   - DNS lookup, connection time
   - TLS handshake time
   - TTFB, DOM ready, page load
   - Resource timing by type

3. **JavaScript Errors**
   - Error message and stack trace
   - Source file and line number
   - Unhandled promise rejections

4. **Resource Performance**
   - Scripts, stylesheets, images, fonts
   - API calls timing
   - Average and max duration per type

### Components

- **RUM Component**: `components/monitoring/RealUserMonitoring.tsx`
  - Tracks page navigation
  - Monitors resource loading
  - Captures errors

- **API Endpoint**: `app/api/rum/route.ts`
  - Stores RUM events
  - Provides event summaries

## Usage

### Viewing Web Vitals

1. Navigate to `/admin/vitals` (admin only)
2. View performance scores by page
3. Monitor Core Web Vitals trends
4. Identify performance issues

### Accessing RUM Data

```bash
# Get all event types
curl http://localhost:3000/api/rum

# Get specific event type
curl http://localhost:3000/api/rum?type=pageview&limit=50

# Event types: pageview, timing, resources, error
```

### Performance Alerts

The system automatically logs warnings for:
- Poor Web Vitals scores
- Slow page loads (> 5 seconds)
- JavaScript errors
- Failed resource loads

## Integration with External Services

To send data to external monitoring services:

1. **Google Analytics**:
   ```javascript
   // In WebVitals.tsx
   if (window.gtag) {
     window.gtag('event', metric.name, {
       value: metric.value,
       metric_label: metric.rating,
     });
   }
   ```

2. **Custom Analytics**:
   - Modify `sendToAnalytics()` in WebVitals.tsx
   - Update `sendToRUM()` in RealUserMonitoring.tsx

## Performance Optimization Tips

Based on collected metrics:

1. **Improve LCP**:
   - Optimize largest images
   - Preload critical resources
   - Reduce server response time

2. **Reduce CLS**:
   - Set dimensions for images/videos
   - Avoid inserting content dynamically
   - Use CSS transforms for animations

3. **Optimize INP**:
   - Minimize JavaScript execution
   - Use web workers for heavy tasks
   - Implement request idle callbacks

4. **Lower TTFB**:
   - Optimize server processing
   - Use CDN for static assets
   - Implement caching strategies

## Data Retention

Currently, data is stored in-memory for demonstration. For production:

1. Replace in-memory storage with database
2. Implement data retention policies
3. Set up data aggregation
4. Configure alerting thresholds

## Testing

To test monitoring:

1. Visit various pages
2. Perform interactions (clicks, scrolls)
3. Check `/admin/vitals` for metrics
4. Verify data in browser console (dev mode)

## Future Enhancements

1. **Session Replay**: Record user sessions
2. **Heat Maps**: Track user interactions
3. **Custom Metrics**: Business-specific KPIs
4. **A/B Testing**: Performance impact analysis
5. **Synthetic Monitoring**: Automated testing