'use client';

import { motion } from 'framer-motion';

export function ChainCardSkeleton() {
  return (
    <div className="relative bg-card backdrop-blur-sm rounded-lg shadow-lg p-4 border border-border overflow-hidden">
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            {/* Logo skeleton - updated size to match ChainCard (w-14 h-14) */}
            <div className="w-14 h-14 rounded-full bg-muted animate-pulse" />
            <div>
              {/* Name skeleton */}
              <div className="h-4 w-24 bg-muted rounded animate-pulse mb-1" />
              {/* Network skeleton */}
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            </div>
          </div>
          {/* Quick actions menu skeleton */}
          <div className="w-6 h-6 bg-muted rounded animate-pulse" />
        </div>

        {/* Standardized two-row structure with consistent min-height */}
        <div className="space-y-2 mb-3 min-h-[44px]">
          {/* First row skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          </div>
          {/* Second row skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          </div>
        </div>

        {/* Bottom row skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-3 w-20 bg-muted rounded animate-pulse" />
          <div className="w-5 h-5 bg-muted rounded animate-pulse" />
        </div>
      </div>

      {/* Progress bar skeleton at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
        <div className="h-full w-1/3 bg-muted-foreground/20 rounded-r-full animate-pulse" />
      </div>
    </div>
  );
}

export function ChainCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <ChainCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
}