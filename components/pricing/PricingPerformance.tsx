'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function PricingPerformance() {
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    lcp?: number;
    fid?: number;
    cls?: number;
    loadTime?: number;
  }>({});
  
  useEffect(() => {
    // Track Core Web Vitals for the pricing page
    const trackCoreWebVitals = () => {
      // LCP (Largest Contentful Paint)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEventTiming;
        setPerformanceMetrics(prev => ({
          ...prev,
          lcp: lastEntry.startTime
        }));
      }).observe({ entryTypes: ['largest-contentful-paint'] });
      
      // FID (First Input Delay)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          const fid = entry as PerformanceEventTiming;
          setPerformanceMetrics(prev => ({
            ...prev,
            fid: fid.processingStart - fid.startTime
          }));
        });
      }).observe({ entryTypes: ['first-input'] });
      
      // CLS (Cumulative Layout Shift)
      let cls = 0;
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          const layoutShift = entry as any;
          if (!layoutShift.hadRecentInput) {
            cls += layoutShift.value;
          }
        });
        setPerformanceMetrics(prev => ({
          ...prev,
          cls: cls
        }));
      }).observe({ entryTypes: ['layout-shift'] });
      
      // Page Load Time
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      setPerformanceMetrics(prev => ({
        ...prev,
        loadTime: loadTime
      }));
    };
    
    // Track performance after component mount
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      trackCoreWebVitals();
    }
  }, []);
  
  // Only show in development or for debugging
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed bottom-4 right-4 z-50 bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 text-xs text-white shadow-lg"
    >
      <div className="font-semibold mb-2">Performance Metrics</div>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span>LCP:</span>
          <span className={performanceMetrics.lcp && performanceMetrics.lcp < 2500 ? 'text-green-400' : 'text-red-400'}>
            {performanceMetrics.lcp ? `${Math.round(performanceMetrics.lcp)}ms` : 'Measuring...'}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>FID:</span>
          <span className={performanceMetrics.fid && performanceMetrics.fid < 100 ? 'text-green-400' : 'text-red-400'}>
            {performanceMetrics.fid ? `${Math.round(performanceMetrics.fid)}ms` : 'Measuring...'}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>CLS:</span>
          <span className={performanceMetrics.cls && performanceMetrics.cls < 0.1 ? 'text-green-400' : 'text-red-400'}>
            {performanceMetrics.cls ? performanceMetrics.cls.toFixed(3) : 'Measuring...'}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Load:</span>
          <span className={performanceMetrics.loadTime && performanceMetrics.loadTime < 3000 ? 'text-green-400' : 'text-red-400'}>
            {performanceMetrics.loadTime ? `${Math.round(performanceMetrics.loadTime)}ms` : 'Measuring...'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
