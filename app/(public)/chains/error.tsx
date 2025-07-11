'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ChainsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Chains page error:', error);
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
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Error message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Failed to load chains
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            We couldn't fetch the list of available chains. This might be a temporary issue.
          </p>
          {error.message && (
            <p className="text-sm text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg font-mono">
              {error.message}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
          <Link
            href="/"
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Back to home
          </Link>
        </div>

        {/* Help text */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          If you continue to experience issues, please check our{' '}
          <Link
            href="/status"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            status page
          </Link>
          {' '}or contact support.
        </p>
      </div>
    </div>
  );
}