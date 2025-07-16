'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Chain } from '@/lib/types';
import { formatTimeAgo } from '@/lib/utils';
import { CountdownTimer } from './CountdownTimer';

interface ChainCardProps {
  chain: Chain;
}

export function ChainCard({ chain }: ChainCardProps) {
  const snapshotCount = chain.snapshotCount || chain.snapshots?.length || 0;

  return (
    <Link href={`/chains/${chain.id}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 p-4 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            {chain.logoUrl && (
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image
                  src={chain.logoUrl}
                  alt={`${chain.name} logo`}
                  fill
                  className="object-contain rounded-full"
                />
              </div>
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
        </div>

        {chain.latestSnapshot ? (
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Last updated</span>
              <span className="text-gray-900 dark:text-white">
                {formatTimeAgo(chain.latestSnapshot.lastModified)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Next snapshot in</span>
              <CountdownTimer lastUpdated={chain.latestSnapshot.lastModified} />
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            No snapshots available
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-gray-500 dark:text-gray-400">
              {snapshotCount} snapshot{snapshotCount !== 1 ? 's' : ''}
            </span>
          </div>
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
    </Link>
  );
}