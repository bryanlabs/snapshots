import { notFound } from 'next/navigation';
import Link from 'next/link';
import { mockChains, mockSnapshots } from '@/lib/mock-data';
import { SnapshotListClient } from '@/components/snapshots/SnapshotListClient';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chainId: string }>;
}): Promise<Metadata> {
  const { chainId } = await params;
  const chain = mockChains[chainId as keyof typeof mockChains];

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
  const chain = mockChains[chainId as keyof typeof mockChains];
  const snapshots = mockSnapshots[chainId as keyof typeof mockSnapshots] || [];

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

          <SnapshotListClient 
            chainId={chain.id} 
            chainName={chain.name} 
            initialSnapshots={snapshots} 
          />
        </div>
      </section>
    </div>
  );
}