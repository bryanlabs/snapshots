import Link from 'next/link';

interface UpgradePromptProps {
  variant?: 'inline' | 'banner' | 'card';
  className?: string;
}

export function UpgradePrompt({ variant = 'card', className = '' }: UpgradePromptProps) {
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span className="text-gray-600 dark:text-gray-400">
          <Link href="/login" className="text-purple-600 dark:text-purple-400 hover:underline">
            Upgrade to Premium
          </Link>
          {' '}for 5x faster downloads
        </span>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 ${className}`}>
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            <span className="font-medium">
              Premium users get 250 MB/s download speeds!
            </span>
          </div>
          <Link
            href="/login"
            className="bg-white text-purple-600 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <div className={`bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-full">
          <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Unlock Premium Benefits
          </h3>
          <ul className="space-y-2 mb-4">
            <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              250 MB/s download speeds (5x faster)
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Priority bandwidth allocation
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Premium support access
            </li>
          </ul>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <span>Get Premium Access</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}