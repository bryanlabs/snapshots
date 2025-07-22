'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Chain } from '@/lib/types';
import { formatTimeAgo, formatBytes, formatExactDateTime, calculateNextUpdateTime } from '@/lib/utils';
import { CountdownTimer } from './CountdownTimer';
import { Tooltip } from '@/components/common';
import { QuickActionsMenu } from './QuickActionsMenu';

interface ChainCardProps {
  chain: Chain;
}

export function ChainCard({ chain }: ChainCardProps) {
  const router = useRouter();
  const snapshotCount = chain.snapshotCount || chain.snapshots?.length || 0;
  const accentColor = chain.accentColor || '#3b82f6';

  // Calculate progress for mini progress bar
  const calculateProgress = () => {
    if (!chain.latestSnapshot) return 0;
    const lastUpdateTime = new Date(chain.latestSnapshot.lastModified).getTime();
    const now = Date.now();
    const timeSinceUpdate = now - lastUpdateTime;
    const updateInterval = 6 * 60 * 60 * 1000; // 6 hours
    const progress = Math.min((timeSinceUpdate / updateInterval) * 100, 100);
    return progress;
  };

  const progress = calculateProgress();

  // Calculate total size of all snapshots
  const totalSize = chain.snapshots?.reduce((total, snapshot) => total + snapshot.size, 0) || 0;

  const handleSnapshotCountClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/chains/${chain.id}`);
  };

  return (
    <Link href={`/chains/${chain.id}`}>
      <motion.div 
        className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 p-4 cursor-pointer border border-gray-200/50 dark:border-gray-700/50 overflow-hidden group"
        style={{
          '--chain-accent': accentColor,
          boxShadow: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px ${accentColor}10`,
        } as React.CSSProperties}
        whileHover={{ 
          y: -4,
          boxShadow: `0 20px 25px -5px ${accentColor}20, 0 10px 10px -5px ${accentColor}10, 0 0 0 1px ${accentColor}30`
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Glassmorphism overlay on hover */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"
          style={{
            background: `linear-gradient(135deg, ${accentColor}10 0%, transparent 50%)`,
            backdropFilter: 'blur(8px)',
          }}
        />
        
        {/* Colored border on hover */}
        <div 
          className="absolute inset-0 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            boxShadow: `inset 0 0 0 1px ${accentColor}50`,
          }}
        />

        {/* Progress bar at bottom */}
        <Tooltip 
          content={`${Math.round(progress)}% until next update`}
          position="top"
          className="w-full"
        >
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
          <motion.div
            className="h-full rounded-r-full"
            style={{ 
              backgroundColor: accentColor,
              width: `${progress}%`
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          </div>
        </Tooltip>
        
        <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            {chain.logoUrl && (
              <Tooltip content={chain.name} position="top">
              <div 
                className="relative w-14 h-14 flex-shrink-0 rounded-full overflow-hidden"
                style={{
                  boxShadow: `0 0 20px ${accentColor}20`,
                }}
              >
                <Image
                  src={chain.logoUrl}
                  alt={`${chain.name} logo`}
                  fill
                  className="object-contain rounded-full"
                />
              </div>
              </Tooltip>
            )}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {chain.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {chain.network}
              </p>
            </div>
          </div>
          <div onClick={(e) => e.preventDefault()}>
            <QuickActionsMenu chain={chain} />
          </div>
        </div>

        {chain.latestSnapshot ? (
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-300">Last updated</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {formatTimeAgo(chain.latestSnapshot.lastModified)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-300">Next snapshot in</span>
              <Tooltip 
                content={`Next update: ${formatExactDateTime(calculateNextUpdateTime(chain.latestSnapshot.lastModified))}`}
                position="top"
              >
                <CountdownTimer lastUpdated={chain.latestSnapshot.lastModified} />
              </Tooltip>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-300 mb-3">
            No snapshots available
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <Tooltip 
              content={totalSize > 0 ? `Total size: ${formatBytes(totalSize)}` : 'Click to view snapshots'}
              position="top"
            >
              <button
                onClick={handleSnapshotCountClick}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded px-1 -mx-1"
                aria-label={`View ${snapshotCount} snapshots for ${chain.name}`}
              >
                {snapshotCount} snapshot{snapshotCount !== 1 ? 's' : ''}
              </button>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
        </div>
      </motion.div>
    </Link>
  );
}