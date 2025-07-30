import { ChainListServer } from '@/components/chains/ChainListServer';
import Image from 'next/image';
import { Suspense } from 'react';
import { UpgradePrompt } from '@/components/common/UpgradePrompt';
import { auth } from '@/auth';

export default async function Home() {
  const session = await auth();
  const user = session?.user;
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient text-white py-8">
        <div className="container mx-auto px-4 hero-content">
          <div className="max-w-4xl mx-auto text-center">
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Blockchain Snapshots
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-200 mb-8">
              Fast, reliable blockchain snapshots for Cosmos ecosystem chains
            </p>
            
            <div className="flex flex-wrap justify-center items-center gap-4 text-gray-300">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Updated 4x daily
              </span>
              <span className="hidden sm:inline text-gray-400">•</span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Latest zstd compression
              </span>
              <span className="hidden sm:inline text-gray-400">•</span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Powered by DACS-IX
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Chains Section */}
      <section className="py-10 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Available Chains
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Choose from our collection of blockchain snapshots updated every 6 hours,
              compressed with advanced zstd technology for faster downloads
            </p>
          </div>

          {/* Upgrade prompt for non-premium users */}
          {user?.tier !== 'premium' && (
            <div className="mb-8">
              <UpgradePrompt />
            </div>
          )}

          <Suspense
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                    <div className="space-y-3">
                      <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            }
          >
            <ChainListServer />
          </Suspense>
        </div>
      </section>
    </div>
  );
}