import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { SnapshotListServer } from '@/components/snapshots/SnapshotListServer';
import type { Metadata } from 'next';
import { Suspense } from 'react';

async function getChain(chainId: string) {
  try {
    // Use the internal API URL for server-side requests
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${apiUrl}/api/v1/chains/${chainId}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Failed to fetch chain:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chainId: string }>;
}): Promise<Metadata> {
  const { chainId } = await params;
  const chain = await getChain(chainId);

  if (!chain) {
    return {
      title: 'Chain Not Found',
    };
  }

  return {
    title: chain.name,
    description: `Download blockchain snapshots for ${chain.name}. Fast, reliable snapshots updated daily with pruned options available.`,
  };
}

export default async function ChainDetailPage({
  params,
}: {
  params: Promise<{ chainId: string }>;
}) {
  const { chainId } = await params;
  const chain = await getChain(chainId);

  if (!chain) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Home
            </Link>
            <span className="text-gray-400 dark:text-gray-600">/</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {chain.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-start gap-6">
            {chain.logoUrl && (
              <div className="relative w-20 h-20 flex-shrink-0">
                <Image
                  src={chain.logoUrl}
                  alt={`${chain.name} logo`}
                  fill
                  className="object-contain rounded-full"
                />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {chain.name}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {chain.network}
              </p>
              {chain.description && (
                <p className="mt-4 text-gray-700 dark:text-gray-300 max-w-3xl">
                  {chain.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Snapshots Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Available Snapshots
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Download the latest blockchain snapshots for {chain.name}
            </p>
          </div>

          <Suspense
            fallback={
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-6 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
                      </div>
                      <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            }
          >
            <SnapshotListServer chainId={chain.id} chainName={chain.name} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}