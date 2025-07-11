'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Login error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-6 p-8">
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
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        {/* Error message */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Authentication Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            We encountered an issue with the login process. Please try again.
          </p>
        </div>

        {/* Error details if available */}
        {error.message && error.message.toLowerCase().includes('auth') && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              This might be due to invalid credentials or a session timeout. Please ensure your username and password are correct.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try logging in again
          </button>
          <Link
            href="/"
            className="block w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-center text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Return to home
          </Link>
        </div>

        {/* Help text */}
        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          Need help? Contact{' '}
          <a
            href="mailto:support@bryanlabs.net"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            support@bryanlabs.net
          </a>
        </p>
      </div>
    </div>
  );
}