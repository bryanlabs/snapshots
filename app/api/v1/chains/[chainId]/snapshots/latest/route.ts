import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/types';
import { generateDownloadUrl } from '@/lib/nginx/operations';
import { collectResponseTime, trackRequest } from '@/lib/monitoring/metrics';
import { extractRequestMetadata, logRequest } from '@/lib/middleware/logger';
import { auth } from '@/auth';
import { getCanonicalChainId, isSnapshotChainConfigured } from '@/lib/config/chains';
import { getEffectiveAccessTier, getTierDownloadExpiry, normalizeTierName } from '@/lib/utils/tier';
import { buildSnapshotCatalog } from '@/lib/snapshots/custom-catalog';
import type { Snapshot } from '@/lib/types';

type DatabaseQuery = 'goleveldb' | 'pebbledb';

interface SnapshotUrlSummary {
  id: string;
  chain_id: string;
  storage_chain_id?: string;
  file_name: string;
  height: number;
  size: number;
  compression: 'lz4' | 'zst' | 'none';
  url: string;
  expires_at: string;
  tier: 'free' | 'premium' | 'ultra' | 'unlimited';
  checksum?: string;
  database_backend?: string;
  database_label?: string;
  commands: {
    curl: string;
    aria2c: string;
  };
}

interface LatestSnapshotResponse {
  chain_id: string;
  height: number;
  size: number;
  compression: 'lz4' | 'zst' | 'none';
  url: string;
  expires_at: string;
  tier: 'free' | 'premium' | 'ultra' | 'unlimited';
  checksum?: string;
  database_backend?: string;
  database_label?: string;
  latest: SnapshotUrlSummary;
  previous: SnapshotUrlSummary[];
  commands: SnapshotUrlSummary['commands'];
}

function normalizeDatabaseQuery(value: string | null): DatabaseQuery | null {
  if (!value || value === 'any') return null;
  if (value === 'leveldb' || value === 'goleveldb') return 'goleveldb';
  if (value === 'pebble' || value === 'pebbledb') return 'pebbledb';
  return null;
}

async function snapshotUrlSummary(
  snapshot: Snapshot,
  canonicalChainId: string,
  tier: 'free' | 'premium' | 'ultra' | 'unlimited',
  userId: string,
  expiresAt: string
): Promise<SnapshotUrlSummary> {
  const storageChainId = snapshot.storageChainId || canonicalChainId;
  const url = await generateDownloadUrl(
    storageChainId,
    snapshot.fileName,
    tier,
    userId
  );

  return {
    id: snapshot.id,
    chain_id: canonicalChainId,
    storage_chain_id: storageChainId,
    file_name: snapshot.fileName,
    height: snapshot.height,
    size: snapshot.size,
    compression: (snapshot.compressionType || 'zst') as SnapshotUrlSummary['compression'],
    url,
    expires_at: expiresAt,
    tier,
    database_backend: snapshot.databaseBackend,
    database_label: snapshot.databaseLabel,
    commands: {
      curl: `curl -L -C - -O "${url}"`,
      aria2c: `aria2c -c -x 8 -s 8 -k 1M --file-allocation=none "${url}"`,
    },
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string }> }
) {
  const endTimer = collectResponseTime('GET', '/api/v1/chains/[chainId]/snapshots/latest');
  const startTime = Date.now();
  const requestLog = extractRequestMetadata(request);
  
  try {
    const { chainId } = await params;
    const canonicalChainId = getCanonicalChainId(chainId);
    if (!isSnapshotChainConfigured(canonicalChainId)) {
      const response = NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Chain not found',
          message: `Chain ${canonicalChainId} is not available`,
        },
        { status: 404 }
      );

      endTimer();
      trackRequest('GET', '/api/v1/chains/[chainId]/snapshots/latest', 404);
      return response;
    }
    const databaseFilter = normalizeDatabaseQuery(request.nextUrl.searchParams.get('database'));
    const includePrevious = request.nextUrl.searchParams.get('include_previous') === 'true';
    
    // Determine tier based on authentication
    const session = await auth();
    const tier = getEffectiveAccessTier(
      normalizeTierName(session?.user?.tier) || 'free'
    ) as LatestSnapshotResponse['tier'];
    const userId = session?.user?.id || 'anonymous';
    
    // Fetch latest visible snapshot from the same catalog used by chain pages.
    const snapshots = await buildSnapshotCatalog(canonicalChainId, {
      id: session?.user?.id,
      role: session?.user?.role,
      tier,
    });
    const officialSnapshots = snapshots.filter((snapshot) => {
      if (snapshot.isCustom) return false;
      if (!databaseFilter) return true;
      return (snapshot.databaseBackend || 'goleveldb') === databaseFilter;
    });
    const latestSnapshot = officialSnapshots[0] || null;
    
    if (!latestSnapshot) {
      const response = NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'No snapshots found',
          message: `No snapshots available for chain ${canonicalChainId}`,
        },
        { status: 404 }
      );
      
      endTimer();
      trackRequest('GET', '/api/v1/chains/[chainId]/snapshots/latest', 404);
      logRequest({
        ...requestLog,
        userId,
        tier,
        responseStatus: 404,
        responseTime: Date.now() - startTime,
        error: 'No snapshots found',
      });
      
      return response;
    }
    
    const expiryHours = getTierDownloadExpiry(tier);
    const expiresAt = new Date(Date.now() + expiryHours * 3600 * 1000);
    const expiresAtIso = expiresAt.toISOString();
    const latest = await snapshotUrlSummary(latestSnapshot, canonicalChainId, tier, userId, expiresAtIso);
    const previous = includePrevious
      ? await Promise.all(
          officialSnapshots
            .slice(1, 3)
            .map((snapshot) => snapshotUrlSummary(snapshot, canonicalChainId, tier, userId, expiresAtIso))
        )
      : [];
    
    // Prepare response
    const responseData: LatestSnapshotResponse = {
      chain_id: canonicalChainId,
      height: latest.height,
      size: latest.size,
      compression: latest.compression,
      url: latest.url,
      expires_at: latest.expires_at,
      tier,
      database_backend: latest.database_backend,
      database_label: latest.database_label,
      latest,
      previous,
      commands: latest.commands,
    };
    
    const response = NextResponse.json<ApiResponse<LatestSnapshotResponse>>({
      success: true,
      data: responseData,
      message: 'Latest snapshot URL generated successfully',
    });
    
    endTimer();
    trackRequest('GET', '/api/v1/chains/[chainId]/snapshots/latest', 200);
    logRequest({
      ...requestLog,
      userId,
      tier,
      responseStatus: 200,
      responseTime: Date.now() - startTime,
    });
    
    return response;
  } catch (error) {
    console.error('Error generating latest snapshot URL:', error);
    
    const response = NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to generate snapshot URL',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
    
    endTimer();
    trackRequest('GET', '/api/v1/chains/[chainId]/snapshots/latest', 500);
    logRequest({
      ...requestLog,
      responseStatus: 500,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return response;
  }
}
