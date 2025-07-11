'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ChainDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const chainId = params?.chainId as string;

  useEffect(() => {
    console.error('Chain detail error:', error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        {/* Error icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20">
          <svg
            className="h-8 w-8 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Error message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Snapshot not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            We couldn&apos;t find snapshots for <span className="font-mono font-semibold">{chainId}</span>.
            The chain might not be available or there could be a temporary issue.
          </p>
          {error.message && error.message !== 'Failed to fetch' && (
            <details className="text-left bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                Technical details
              </summary>
              <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
                {error.message}
              </pre>
            </details>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/chains"
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Browse all chains
          </Link>
        </div>

        {/* Suggestions */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Looking for a specific chain? Try these popular options:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {['cosmos', 'osmosis', 'juno', 'stargaze', 'akash'].map((chain) => (
              <Link
                key={chain}
                href={`/chains/${chain}`}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {chain}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}