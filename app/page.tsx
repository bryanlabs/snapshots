import { ChainListServer } from '@/components/chains/ChainListServer';
import Image from 'next/image';
import Link from 'next/link';
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
            
            <p className="text-xl md:text-2xl text-gray-200 mb-6">
              Fast, reliable blockchain snapshots for Cosmos ecosystem chains
            </p>
            <p className="text-lg text-gray-300 mb-8">
              From 50 Mbps free tier to 500 Mbps ultra-fast enterprise • Custom snapshots • Priority support
            </p>
            
            <div className="flex flex-wrap justify-center items-center gap-4 text-gray-300 mb-8">
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
                Custom snapshots
              </span>
              <span className="hidden sm:inline text-gray-400">•</span>
              <Link href="/network" className="flex items-center gap-2 hover:text-white transition-colors">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Powered by DACS-IX
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/pricing"
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                View Pricing Plans
              </Link>
              {!user && (
                <Link
                  href="/auth/signin"
                  className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-purple-600 px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300"
                >
                  Get Started Free
                </Link>
              )}
              {user?.tier === 'free' && (
                <span className="text-sm text-gray-300">
                  Start with 50 Mbps • Upgrade for 5x faster speeds
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Chains Section */}
      <section className="py-10 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Available Chains
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose from our collection of blockchain snapshots updated every 6 hours,
              compressed with advanced zstd technology for faster downloads
            </p>
          </div>

          {/* Upgrade prompt for free tier users only */}
          {user?.tier === 'free' && (
            <div className="mb-8">
              <UpgradePrompt />
            </div>
          )}

          <Suspense
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-card rounded-lg p-6 shadow border border-border">
                    <div className="space-y-3">
                      <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-3 w-full bg-muted rounded animate-pulse" />
                        <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
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