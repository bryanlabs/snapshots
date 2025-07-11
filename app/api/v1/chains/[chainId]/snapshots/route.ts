import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Snapshot } from '@/lib/types';

// Mock data - replace with actual database queries
const mockSnapshots: Record<string, Snapshot[]> = {
  'cosmos-hub': [
    {
      id: 'cosmos-snapshot-1',
      chainId: 'cosmos-hub',
      height: 19234567,
      size: 450 * 1024 * 1024 * 1024, // 450 GB in bytes
      fileName: 'cosmoshub-4-15234567.tar.lz4',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      type: 'pruned',
      compressionType: 'lz4',
    },
    {
      id: 'cosmos-snapshot-2',
      chainId: 'cosmos-hub',
      height: 19200000,
      size: 850 * 1024 * 1024 * 1024, // 850 GB in bytes
      fileName: 'cosmoshub-4-15200000.tar.lz4',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10'),
      type: 'archive',
      compressionType: 'lz4',
    },
  ],
  'osmosis': [
    {
      id: 'osmosis-snapshot-1',
      chainId: 'osmosis',
      height: 12345678,
      size: 128849018880, // ~120 GB in bytes
      fileName: 'osmosis-1-12345678.tar.lz4',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10'),
      type: 'pruned',
      compressionType: 'lz4',
    },
    {
      id: 'osmosis-snapshot-2',
      chainId: 'osmosis',
      height: 12300000,
      size: 127312345600, // ~118 GB in bytes
      fileName: 'osmosis-1-12300000.tar.lz4',
      createdAt: new Date('2024-01-09'),
      updatedAt: new Date('2024-01-09'),
      type: 'pruned',
      compressionType: 'lz4',
    },
  ],
  'juno': [
    {
      id: 'juno-snapshot-1',
      chainId: 'juno',
      height: 12345678,
      size: 250 * 1024 * 1024 * 1024, // 250 GB in bytes
      fileName: 'juno-1-9876543.tar.lz4',
      createdAt: new Date('2024-01-13'),
      updatedAt: new Date('2024-01-13'),
      type: 'pruned',
      compressionType: 'lz4',
    },
  ],
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string }> }
) {
  try {
    const { chainId } = await params;
    
    // TODO: Implement actual database query
    // const snapshots = await db.snapshot.findMany({ 
    //   where: { chainId },
    //   orderBy: { height: 'desc' }
    // });
    
    const snapshots = mockSnapshots[chainId] || [];
    
    return NextResponse.json<ApiResponse<Snapshot[]>>({
      success: true,
      data: snapshots,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch snapshots',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}