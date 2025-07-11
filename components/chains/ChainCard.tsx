import Link from 'next/link';
import Image from 'next/image';
import { Chain } from '@/lib/types';

interface ChainCardProps {
  chain: Chain;
}

export function ChainCard({ chain }: ChainCardProps) {
  const snapshotCount = chain.snapshots?.length || 0;
  const latestSnapshot = chain.snapshots?.[0];

  return (
    <Link href={`/chains/${chain.id}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 p-6 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {chain.logoUrl && (
              <div className="relative w-12 h-12 flex-shrink-0">
                <Image
                  src={chain.logoUrl}
                  alt={`${chain.name} logo`}
                  fill
                  className="object-contain rounded-full"
                />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {chain.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {chain.network}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Active
          </span>
        </div>

        {chain.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {chain.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-gray-500 dark:text-gray-400">
              {snapshotCount} snapshot{snapshotCount !== 1 ? 's' : ''}
            </span>
            {latestSnapshot && (
              <span className="text-gray-500 dark:text-gray-400">
                Latest: Block #{latestSnapshot.height.toLocaleString()}
              </span>
            )}
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