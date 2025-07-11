import { Snapshot } from '@/lib/types';
import { SnapshotListClient } from './SnapshotListClient';

interface SnapshotListServerProps {
  chainId: string;
  chainName: string;
}

async function getSnapshots(chainId: string): Promise<Snapshot[]> {
  try {
    // Use the internal API URL for server-side requests
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(
      `${apiUrl}/api/v1/chains/${chainId}/snapshots`,
      {
        next: { revalidate: 300 } // Cache for 5 minutes
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch snapshots');
    }
    
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Failed to fetch snapshots:', error);
    return [];
  }
}

export async function SnapshotListServer({ chainId, chainName }: SnapshotListServerProps) {
  const snapshots = await getSnapshots(chainId);
  
  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
        <p className="text-yellow-800 dark:text-yellow-200">
          We couldn't find snapshots for {chainName}. The chain might not be available or there could be a temporary issue.
        </p>
      </div>
    );
  }
  
  return <SnapshotListClient 
    chainId={chainId} 
    chainName={chainName} 
    initialSnapshots={snapshots} 
  />;
}