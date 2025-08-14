import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SnapshotList } from '@/components/snapshots/SnapshotList';
import { useSnapshots } from '@/hooks/useSnapshots';
import { Snapshot } from '@/lib/types';

// Mock dependencies
jest.mock('@/hooks/useSnapshots');
jest.mock('@/components/snapshots/SnapshotItem', () => ({
  SnapshotItem: ({ snapshot, chainName }: any) => (
    <div data-testid={`snapshot-${snapshot.id}`}>
      {chainName} - {snapshot.type} - Height: {snapshot.height}
    </div>
  ),
}));
jest.mock('@/components/common/LoadingSpinner', () => ({
  LoadingSpinner: () => <div>Loading...</div>,
}));
jest.mock('@/components/common/ErrorMessage', () => ({
  ErrorMessage: ({ title, message, onRetry }: any) => (
    <div>
      <h3>{title}</h3>
      <p>{message}</p>
      <button onClick={onRetry}>Retry</button>
    </div>
  ),
}));

describe('SnapshotList', () => {
  const mockSnapshots: Snapshot[] = [
    {
      id: 'snap-1',
      chainId: 'cosmos-hub',
      fileName: 'cosmos-hub-1.tar.lz4',
      height: 20000001,
      size: 1000000000,
      type: 'default',
      compressionType: 'lz4',
      createdAt: new Date('2025-01-01'),
      downloadUrl: 'https://example.com/1',
    },
    {
      id: 'snap-2',
      chainId: 'cosmos-hub',
      fileName: 'cosmos-hub-2.tar.lz4',
      height: 20000002,
      size: 2000000000,
      type: 'pruned',
      compressionType: 'lz4',
      createdAt: new Date('2025-01-02'),
      downloadUrl: 'https://example.com/2',
    },
    {
      id: 'snap-3',
      chainId: 'cosmos-hub',
      fileName: 'cosmos-hub-3.tar.zst',
      height: 20000003,
      size: 3000000000,
      type: 'archive',
      compressionType: 'zst',
      createdAt: new Date('2025-01-03'),
      downloadUrl: 'https://example.com/3',
    },
  ];

  const mockUseSnapshots = useSnapshots as jest.MockedFunction<typeof useSnapshots>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    mockUseSnapshots.mockReturnValue({
      snapshots: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<SnapshotList chainId="cosmos-hub" chainName="Cosmos Hub" />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const mockRefetch = jest.fn();
    mockUseSnapshots.mockReturnValue({
      snapshots: null,
      loading: false,
      error: 'Network error',
      refetch: mockRefetch,
    });

    render(<SnapshotList chainId="cosmos-hub" chainName="Cosmos Hub" />);

    expect(screen.getByText('Failed to load snapshots')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
    
    // Test retry functionality
    fireEvent.click(screen.getByText('Retry'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders empty state when no snapshots', () => {
    mockUseSnapshots.mockReturnValue({
      snapshots: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<SnapshotList chainId="cosmos-hub" chainName="Cosmos Hub" />);

    expect(screen.getByText('No snapshots available for this chain yet.')).toBeInTheDocument();
  });

  it('renders all snapshots without filter tabs', () => {
    mockUseSnapshots.mockReturnValue({
      snapshots: mockSnapshots,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<SnapshotList chainId="cosmos-hub" chainName="Cosmos Hub" />);

    // Check all snapshots are displayed
    expect(screen.getByTestId('snapshot-snap-1')).toBeInTheDocument();
    expect(screen.getByTestId('snapshot-snap-2')).toBeInTheDocument();
    expect(screen.getByTestId('snapshot-snap-3')).toBeInTheDocument();

    // Check filter tabs are not present
    expect(screen.queryByText('all (3)')).not.toBeInTheDocument();
    expect(screen.queryByText('default (1)')).not.toBeInTheDocument();
    expect(screen.queryByText('pruned (1)')).not.toBeInTheDocument();
    expect(screen.queryByText('archive (1)')).not.toBeInTheDocument();
  });


  it('handles null snapshots gracefully', () => {
    mockUseSnapshots.mockReturnValue({
      snapshots: null,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<SnapshotList chainId="cosmos-hub" chainName="Cosmos Hub" />);

    expect(screen.getByText('No snapshots available for this chain yet.')).toBeInTheDocument();
  });

  it('passes correct props to SnapshotItem components', () => {
    mockUseSnapshots.mockReturnValue({
      snapshots: mockSnapshots,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<SnapshotList chainId="cosmos-hub" chainName="Cosmos Hub" />);

    // Check that SnapshotItem receives correct props by verifying rendered content
    expect(screen.getByTestId('snapshot-snap-1')).toHaveTextContent('Cosmos Hub - default - Height: 20000001');
    expect(screen.getByTestId('snapshot-snap-2')).toHaveTextContent('Cosmos Hub - pruned - Height: 20000002');
    expect(screen.getByTestId('snapshot-snap-3')).toHaveTextContent('Cosmos Hub - archive - Height: 20000003');
  });
});