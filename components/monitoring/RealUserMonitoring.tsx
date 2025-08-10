'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function RealUserMonitoringInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track page view
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    trackPageView(url);
    
    // Track page timing
    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationTiming) {
      trackPageTiming(navigationTiming);
    }

    // Track resource timing
    trackResourceTiming();

    // Track errors
    const errorHandler = (event: ErrorEvent) => {
      trackError({
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error?.stack,
      });
    };

    // Track unhandled promise rejections
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      trackError({
        message: 'Unhandled Promise Rejection',
        error: event.reason?.toString() || 'Unknown error',
      });
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, [pathname, searchParams]);

  return null;
}

function trackPageView(url: string) {
  const data = {
    type: 'pageview',
    url,
    referrer: document.referrer,
    timestamp: new Date().toISOString(),
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    screen: {
      width: window.screen.width,
      height: window.screen.height,
    },
    userAgent: navigator.userAgent,
  };

  sendToRUM(data);
}

function trackPageTiming(timing: PerformanceNavigationTiming) {
  const data = {
    type: 'timing',
    url: timing.name,
    timestamp: new Date().toISOString(),
    metrics: {
      // Navigation timing
      redirectTime: timing.redirectEnd - timing.redirectStart,
      dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
      connectTime: timing.connectEnd - timing.connectStart,
      tlsTime: timing.secureConnectionStart > 0 
        ? timing.connectEnd - timing.secureConnectionStart 
        : 0,
      requestTime: timing.responseStart - timing.requestStart,
      responseTime: timing.responseEnd - timing.responseStart,
      domProcessing: timing.domComplete - timing.domInteractive,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
      loadComplete: timing.loadEventEnd - timing.loadEventStart,
      
      // Key metrics
      ttfb: timing.responseStart - timing.fetchStart,
      domReady: timing.domContentLoadedEventEnd - timing.fetchStart,
      pageLoad: timing.loadEventEnd - timing.fetchStart,
    },
  };

  sendToRUM(data);
}

function trackResourceTiming() {
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  // Group resources by type
  const resourcesByType: Record<string, number[]> = {};
  
  resources.forEach(resource => {
    const type = getResourceType(resource.name);
    if (!resourcesByType[type]) {
      resourcesByType[type] = [];
    }
    resourcesByType[type].push(resource.duration);
  });

  // Calculate stats per resource type
  const stats = Object.entries(resourcesByType).map(([type, durations]) => ({
    type,
    count: durations.length,
    totalDuration: durations.reduce((a, b) => a + b, 0),
    avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
    maxDuration: Math.max(...durations),
  }));

  const data = {
    type: 'resources',
    url: window.location.href,
    timestamp: new Date().toISOString(),
    totalResources: resources.length,
    stats,
  };

  sendToRUM(data);
}

function trackError(error: any) {
  const data = {
    type: 'error',
    url: window.location.href,
    timestamp: new Date().toISOString(),
    error,
    userAgent: navigator.userAgent,
  };

  sendToRUM(data);
}

function getResourceType(url: string): string {
  const extension = url.split('.').pop()?.toLowerCase() || '';
  
  if (['js', 'mjs'].includes(extension)) return 'script';
  if (['css'].includes(extension)) return 'stylesheet';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico'].includes(extension)) return 'image';
  if (['woff', 'woff2', 'ttf', 'otf'].includes(extension)) return 'font';
  if (url.includes('/api/')) return 'api';
  
  return 'other';
}

function sendToRUM(data: any) {
  // Use sendBeacon for reliability
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/rum', JSON.stringify(data));
  } else {
    fetch('/api/rum', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true,
    }).catch(() => {
      // Fail silently
    });
  }

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[RUM]', data.type, data);
  }
}

// Export wrapper component with Suspense
export function RealUserMonitoring() {
  return (
    <Suspense fallback={null}>
      <RealUserMonitoringInner />
    </Suspense>
  );
}