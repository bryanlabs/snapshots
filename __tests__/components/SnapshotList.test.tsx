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

  it('renders snapshots with filter tabs', () => {
    mockUseSnapshots.mockReturnValue({
      snapshots: mockSnapshots,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<SnapshotList chainId="cosmos-hub" chainName="Cosmos Hub" />);

    // Check filter tabs with counts
    expect(screen.getByText('all (3)')).toBeInTheDocument();
    expect(screen.getByText('default (1)')).toBeInTheDocument();
    expect(screen.getByText('pruned (1)')).toBeInTheDocument();
    expect(screen.getByText('archive (1)')).toBeInTheDocument();

    // Check all snapshots are displayed
    expect(screen.getByTestId('snapshot-snap-1')).toBeInTheDocument();
    expect(screen.getByTestId('snapshot-snap-2')).toBeInTheDocument();
    expect(screen.getByTestId('snapshot-snap-3')).toBeInTheDocument();
  });

  it('filters snapshots by type', () => {
    mockUseSnapshots.mockReturnValue({
      snapshots: mockSnapshots,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<SnapshotList chainId="cosmos-hub" chainName="Cosmos Hub" />);

    // Click on pruned filter
    fireEvent.click(screen.getByText('pruned (1)'));

    // Should only show pruned snapshots
    expect(screen.queryByTestId('snapshot-snap-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('snapshot-snap-2')).toBeInTheDocument();
    expect(screen.queryByTestId('snapshot-snap-3')).not.toBeInTheDocument();

    // Click on archive filter
    fireEvent.click(screen.getByText('archive (1)'));

    // Should only show archive snapshots
    expect(screen.queryByTestId('snapshot-snap-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('snapshot-snap-2')).not.toBeInTheDocument();
    expect(screen.getByTestId('snapshot-snap-3')).toBeInTheDocument();

    // Click back to all
    fireEvent.click(screen.getByText('all (3)'));

    // Should show all snapshots again
    expect(screen.getByTestId('snapshot-snap-1')).toBeInTheDocument();
    expect(screen.getByTestId('snapshot-snap-2')).toBeInTheDocument();
    expect(screen.getByTestId('snapshot-snap-3')).toBeInTheDocument();
  });

  it('highlights active filter tab', () => {
    mockUseSnapshots.mockReturnValue({
      snapshots: mockSnapshots,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<SnapshotList chainId="cosmos-hub" chainName="Cosmos Hub" />);

    // Check initial state - 'all' should be active
    const allButton = screen.getByText('all (3)');
    expect(allButton.className).toContain('border-blue-500');
    expect(allButton.className).toContain('text-blue-600');

    // Click on pruned
    const prunedButton = screen.getByText('pruned (1)');
    fireEvent.click(prunedButton);

    // Pruned should now be active
    expect(prunedButton.className).toContain('border-blue-500');
    expect(prunedButton.className).toContain('text-blue-600');
    
    // All should no longer be active
    expect(allButton.className).toContain('border-transparent');
    expect(allButton.className).toContain('text-gray-500');
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