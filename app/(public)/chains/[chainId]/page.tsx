import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { SnapshotListRealtime } from '@/components/snapshots/SnapshotListRealtime';
import { DownloadLatestButton } from '@/components/chains/DownloadLatestButton';
import { BackButton } from '@/components/common/BackButton';
import type { Metadata } from 'next';
import { Chain, Snapshot } from '@/lib/types';
import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { CustomSnapshotModal } from '@/components/chains/CustomSnapshotModal';
import { getChainConfig, getChainLogoUrl, getChainAccentColor, getChainBannerUrl } from '@/lib/config/chains';

async function getChain(chainId: string): Promise<Chain | null> {
  try {
    // For server-side requests, use internal URL
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? 'http://webapp:3000'  // Internal Kubernetes service URL
      : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
      
    const response = await fetch(`${apiUrl}/api/v1/chains`, {
      next: { revalidate: 60 }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    const chains = data.success ? data.data : [];
    return chains.find((chain: Chain) => chain.id === chainId) || null;
  } catch (error) {
    console.error('Failed to fetch chain:', error);
    return null;
  }
}

async function getSnapshots(chainId: string): Promise<Snapshot[]> {
  try {
    // For server-side requests, use internal URL
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? 'http://webapp:3000'  // Internal Kubernetes service URL
      : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
      
    const response = await fetch(`${apiUrl}/api/v1/chains/${chainId}/snapshots`, {
      next: { revalidate: 60 }
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Failed to fetch snapshots:', error);
    return [];
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
  const snapshots = await getSnapshots(chainId);
  const session = await auth();

  if (!chain) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Back Button */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <BackButton />
        </div>
      </div>

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
      <section className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 relative overflow-hidden">
        {/* Background watermark logo */}
        <div className="absolute inset-0 flex items-center justify-end opacity-5 dark:opacity-10">
          <Image
            src={getChainLogoUrl(chain.id)}
            alt={`${chain.name} logo watermark`}
            width={400}
            height={400}
            className="mr-20"
          />
        </div>
        
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex items-start gap-6">
            {/* Chain logo */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg bg-gray-100 dark:bg-gray-800 p-4 shadow-lg">
                <Image
                  src={getChainLogoUrl(chain.id)}
                  alt={`${chain.name} logo`}
                  width={96}
                  height={96}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
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
                {/* Download button moved to snapshots section */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Snapshots Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Available Snapshots
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Download the latest blockchain snapshots for {chain.name}
                </p>
              </div>
              {/* Action buttons moved below */}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            {chain.latestSnapshot && snapshots.length > 0 && (
              <DownloadLatestButton 
                chainId={chain.id}
                size={chain.latestSnapshot.size}
                accentColor={getChainAccentColor(chain.id)}
              />
            )}
            {(() => {
              // Use centralized tier access validation - supports all premium tiers including ultra/unlimited
              const { getServerTierCapabilities } = require("@/lib/utils/tier");
              const capabilities = getServerTierCapabilities(session?.user?.tier);
              
              return capabilities.canRequestCustomSnapshots ? (
                <CustomSnapshotModal chainId={chainId} chainName={chain.name} />
              ) : session?.user ? (
                <Link href="/pricing#premium">
                  <Button 
                    variant="outline" 
                    className="bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 text-gray-300 hover:text-white transition-colors"
                  >
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    Custom Snapshot
                    <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">
                      Premium
                    </span>
                  </Button>
                </Link>
              ) : null;
            })()}
          </div>

          <SnapshotListRealtime 
            chainId={chain.id} 
            chainName={chain.name} 
            chainLogoUrl={getChainLogoUrl(chain.id)}
            initialSnapshots={snapshots} 
            pollInterval={30000} // Poll every 30 seconds
          />
          
          {/* Custom Snapshots Upsell for Free Users */}
          {(() => {
            const { getServerTierCapabilities } = require("@/lib/utils/tier");
            const capabilities = getServerTierCapabilities(session?.user?.tier);
            
            return session?.user && capabilities.upgradePromptEnabled ? (
              <div className="mt-8 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                <div className="flex items-start gap-3">
                  <SparklesIcon className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-white mb-1">
                      Need a specific block height?
                    </h3>
                    <p className="text-xs text-gray-400 mb-3">
                      Premium users can request custom snapshots from any block height with priority processing.
                    </p>
                    <Link href="/pricing#premium" className="inline-flex items-center gap-1 text-xs font-medium text-purple-400 hover:text-purple-300">
                      Learn more about premium features →
                    </Link>
                  </div>
                </div>
              </div>
            ) : null;
          })()}
        </div>
      </section>
    </div>
  );
}