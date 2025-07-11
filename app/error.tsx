'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full text-center space-y-6 p-8">
            {/* Error icon */}
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/20">
              <svg
                className="h-10 w-10 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Error message */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Something went wrong!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                An unexpected error occurred. Our team has been notified.
              </p>
              {error.digest && (
                <p className="text-sm text-gray-500 dark:text-gray-500 font-mono">
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={reset}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try again
              </button>
              <Link
                href="/"
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Go home
              </Link>
            </div>

            {/* Support info */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                If this problem persists, please contact{' '}
                <a
                  href="mailto:support@bryanlabs.net"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  support@bryanlabs.net
                </a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}