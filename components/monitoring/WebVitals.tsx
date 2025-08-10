'use client';

import { useEffect } from 'react';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

const vitalsUrl = '/api/vitals';

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  entries?: PerformanceEntry[];
}

function sendToAnalytics(metric: WebVitalMetric) {
  // Prepare data for analytics
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  });

  // Use `navigator.sendBeacon()` if available, falling back to fetch
  if (navigator.sendBeacon) {
    navigator.sendBeacon(vitalsUrl, body);
  } else {
    fetch(vitalsUrl, {
      body,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      keepalive: true,
    }).catch((error) => {
      console.error('Failed to send vitals:', error);
    });
  }

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', metric.name, metric.value, metric.rating);
  }

  // Send to external monitoring service if configured
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_label: metric.rating,
      metric_value: metric.value,
      metric_delta: metric.delta,
      non_interaction: true,
    });
  }
}

export function WebVitals() {
  useEffect(() => {
    // Core Web Vitals
    onCLS(sendToAnalytics); // Cumulative Layout Shift
    onINP(sendToAnalytics); // Interaction to Next Paint
    onLCP(sendToAnalytics); // Largest Contentful Paint
    
    // Other metrics
    onFCP(sendToAnalytics); // First Contentful Paint
    onTTFB(sendToAnalytics); // Time to First Byte
  }, []);

  return null;
}

// Declare gtag type for TypeScript
declare global {
  interface Window {
    gtag?: (
      command: string,
      eventName: string,
      eventParameters?: Record<string, any>
    ) => void;
  }
}