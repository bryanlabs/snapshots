'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  snapshot: {
    chainId: string;
    filename: string;
    size: string;
    blockHeight?: number;
  };
  isLoading?: boolean;
}

export function DownloadModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  snapshot,
  isLoading = false 
}: DownloadModalProps) {
  const { user } = useAuth();
  const tier = user ? 'premium' : 'free';
  
  const bandwidthInfo = {
    free: {
      speed: '50 MB/s',
      description: 'Shared among all free users',
      estimatedTime: calculateDownloadTime(snapshot.size, 50),
      benefits: [
        'Resume support for interrupted downloads',
        'Secure pre-signed URLs',
        'Limited to 50 MB/s shared bandwidth'
      ]
    },
    premium: {
      speed: '250 MB/s',
      description: 'Shared among premium users',
      estimatedTime: calculateDownloadTime(snapshot.size, 250),
      benefits: [
        '5x faster downloads',
        'Priority bandwidth allocation',
        'Resume support for interrupted downloads',
        'Secure pre-signed URLs',
        'Premium support'
      ]
    }
  };

  const tierInfo = bandwidthInfo[tier];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download Snapshot</DialogTitle>
          <DialogDescription>
            {snapshot.chainId} - {snapshot.filename}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* File info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">File size:</span>
              <span className="font-medium">{snapshot.size}</span>
            </div>
            {snapshot.blockHeight && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Block height:</span>
                <span className="font-medium">{snapshot.blockHeight.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Estimated time:</span>
              <span className="font-medium">{tierInfo.estimatedTime}</span>
            </div>
          </div>

          {/* Bandwidth tier info */}
          <div className={`rounded-lg p-4 ${
            tier === 'premium' 
              ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800' 
              : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {tier === 'premium' ? 'Premium' : 'Free'} Tier
              </h4>
              <span className={`text-lg font-bold ${
                tier === 'premium' ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'
              }`}>
                {tierInfo.speed}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {tierInfo.description}
            </p>
            <ul className="space-y-1">
              {tierInfo.benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Upgrade prompt for free users */}
          {tier === 'free' && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                Want faster downloads?
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Upgrade to Premium for 5x faster speeds and priority access.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
              >
                Login for Premium access
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={tier === 'premium' ? 'bg-purple-600 hover:bg-purple-700' : ''}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating URL...
              </>
            ) : (
              <>Start Download</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function calculateDownloadTime(sizeStr: string, speedMbps: number): string {
  if (!sizeStr) return 'Unknown';
  
  // Parse size string (e.g., "7.3 GB", "500 MB")
  const match = sizeStr.match(/^([\d.]+)\s*(GB|MB|TB|KB|Bytes?)$/i);
  if (!match) return 'Unknown';
  
  const [, sizeNum, unit] = match;
  let sizeInMB = parseFloat(sizeNum);
  
  // Convert to MB
  const upperUnit = unit.toUpperCase();
  if (upperUnit === 'GB') {
    sizeInMB *= 1024;
  } else if (upperUnit === 'TB') {
    sizeInMB *= 1024 * 1024;
  } else if (upperUnit === 'KB') {
    sizeInMB /= 1024;
  } else if (upperUnit === 'BYTES' || upperUnit === 'B') {
    sizeInMB /= (1024 * 1024);
  }
  
  // Calculate time in seconds
  const timeInSeconds = sizeInMB / speedMbps;
  
  // Format time
  if (timeInSeconds < 60) {
    return `${Math.ceil(timeInSeconds)} seconds`;
  } else if (timeInSeconds < 3600) {
    const minutes = Math.ceil(timeInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.ceil((timeInSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}