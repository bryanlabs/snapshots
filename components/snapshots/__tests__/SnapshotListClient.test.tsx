import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SnapshotListClient } from '../SnapshotListClient';
import { useAuth } from '@/hooks/useAuth';
import { Snapshot } from '@/lib/types';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../SnapshotItem', () => ({
  SnapshotItem: ({ snapshot, chainName }: any) => (
    <div data-testid={`snapshot-${snapshot.id}`}>
      {snapshot.fileName} - {chainName}
    </div>
  ),
}));

jest.mock('@/components/common/DownloadModal', () => ({
  DownloadModal: ({ isOpen, onClose, onConfirm, snapshot }: any) => (
    isOpen ? (
      <div data-testid="download-modal">
        <div>{snapshot.filename}</div>
        <button onClick={onConfirm}>Confirm Download</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null
  ),
}));

// Mock fetch
global.fetch = jest.fn();

describe('SnapshotListClient', () => {
  const mockSnapshots: Snapshot[] = [
    {
      id: '1',
      fileName: 'snapshot-001.tar.lz4',
      size: 1073741824, // 1GB
      height: 1000000,
      type: 'default',
      updatedAt: '2024-01-02T00:00:00Z',
      chainId: 'osmosis',
      timestamp: new Date('2024-01-02T00:00:00Z'),
    },
    {
      id: '2',
      fileName: 'snapshot-002.tar.lz4',
      size: 2147483648, // 2GB
      height: 1000100,
      type: 'pruned',
      updatedAt: '2024-01-01T00:00:00Z',
      chainId: 'osmosis',
      timestamp: new Date('2024-01-01T00:00:00Z'),
    },
    {
      id: '3',
      fileName: 'snapshot-003.tar.lz4',
      size: 3221225472, // 3GB
      height: 1000200,
      type: 'archive',
      updatedAt: '2024-01-03T00:00:00Z',
      chainId: 'osmosis',
      timestamp: new Date('2024-01-03T00:00:00Z'),
    },
  ];

  const defaultProps = {
    chainId: 'osmosis',
    chainName: 'Osmosis',
    chainLogoUrl: 'https://example.com/osmosis.png',
    initialSnapshots: mockSnapshots,
  };

  const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    } as any);
    
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
    } as any);
    
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    } as any);

    // Mock window.history.replaceState
    delete (window as any).location;
    (window as any).location = new URL('https://example.com/chains/osmosis');
    window.history.replaceState = jest.fn();
  });

  describe('Rendering', () => {
    it('should render snapshots correctly', () => {
      render(<SnapshotListClient {...defaultProps} />);

      // Check that all snapshots are displayed
      mockSnapshots.forEach(snapshot => {
        expect(screen.getByTestId(`snapshot-${snapshot.id}`)).toBeInTheDocument();
      });

      // Check that filter tabs are not present
      expect(screen.queryByText('all (3)')).not.toBeInTheDocument();
      expect(screen.queryByText('default (1)')).not.toBeInTheDocument();
      expect(screen.queryByText('pruned (1)')).not.toBeInTheDocument();
      expect(screen.queryByText('archive (1)')).not.toBeInTheDocument();
    });

    it('should render empty state when no snapshots', () => {
      render(<SnapshotListClient {...defaultProps} initialSnapshots={[]} />);

      expect(screen.getByText('No snapshots available for this chain yet.')).toBeInTheDocument();
    });
  });


  describe('Download functionality', () => {
    it('should handle download query parameter for free users', async () => {
      const mockSearchParams = {
        get: jest.fn().mockReturnValue('latest'),
      };
      mockUseSearchParams.mockReturnValue(mockSearchParams as any);

      render(<SnapshotListClient {...defaultProps} />);

      // Should show download modal for latest snapshot (snapshot-3)
      await waitFor(() => {
        expect(screen.getByTestId('download-modal')).toBeInTheDocument();
        expect(screen.getByText('snapshot-003.tar.lz4')).toBeInTheDocument();
      });

      // Should remove query parameter
      expect(window.history.replaceState).toHaveBeenCalledWith(
        {},
        '',
        'https://example.com/chains/osmosis'
      );
    });

    it('should handle instant download for premium users', async () => {
      const mockSearchParams = {
        get: jest.fn().mockReturnValue('latest'),
      };
      mockUseSearchParams.mockReturnValue(mockSearchParams as any);
      
      mockUseAuth.mockReturnValue({
        user: { tier: 'premium', email: 'premium@example.com' },
        loading: false,
      } as any);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { downloadUrl: 'https://download.example.com/snapshot.tar.lz4' },
        }),
      } as Response);

      // Mock window.location.href setter
      delete (window as any).location;
      (window as any).location = { href: '' };

      render(<SnapshotListClient {...defaultProps} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/v1/chains/osmosis/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            snapshotId: '3', // Latest snapshot
            email: 'premium@example.com',
          }),
        });
      });

      expect(window.location.href).toBe('https://download.example.com/snapshot.tar.lz4');
    });

    it('should handle download modal confirmation', async () => {
      const mockSearchParams = {
        get: jest.fn().mockReturnValue('latest'),
      };
      mockUseSearchParams.mockReturnValue(mockSearchParams as any);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { downloadUrl: 'https://download.example.com/snapshot.tar.lz4' },
        }),
      } as Response);

      // Mock window.location.href setter
      delete (window as any).location;
      (window as any).location = { href: '' };

      render(<SnapshotListClient {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('download-modal')).toBeInTheDocument();
      });

      // Click confirm download
      fireEvent.click(screen.getByText('Confirm Download'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/v1/chains/osmosis/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            snapshotId: '3',
            email: undefined,
          }),
        });
      });

      expect(window.location.href).toBe('https://download.example.com/snapshot.tar.lz4');
      expect(screen.queryByTestId('download-modal')).not.toBeInTheDocument();
    });

    it('should handle download modal cancellation', async () => {
      const mockSearchParams = {
        get: jest.fn().mockReturnValue('latest'),
      };
      mockUseSearchParams.mockReturnValue(mockSearchParams as any);

      render(<SnapshotListClient {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('download-modal')).toBeInTheDocument();
      });

      // Click cancel
      fireEvent.click(screen.getByText('Cancel'));

      expect(screen.queryByTestId('download-modal')).not.toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle download API errors', async () => {
      const mockSearchParams = {
        get: jest.fn().mockReturnValue('latest'),
      };
      mockUseSearchParams.mockReturnValue(mockSearchParams as any);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<SnapshotListClient {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('download-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Confirm Download'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Download failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should handle network errors during download', async () => {
      const mockSearchParams = {
        get: jest.fn().mockReturnValue('latest'),
      };
      mockUseSearchParams.mockReturnValue(mockSearchParams as any);

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<SnapshotListClient {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('download-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Confirm Download'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Download failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should handle missing download URL in response', async () => {
      const mockSearchParams = {
        get: jest.fn().mockReturnValue('latest'),
      };
      mockUseSearchParams.mockReturnValue(mockSearchParams as any);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Download URL not available',
        }),
      } as Response);

      render(<SnapshotListClient {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('download-modal')).toBeInTheDocument();
      });

      // Mock window.location.href setter
      delete (window as any).location;
      (window as any).location = { href: 'https://example.com' };

      fireEvent.click(screen.getByText('Confirm Download'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      // Location should not change if no download URL
      expect(window.location.href).toBe('https://example.com');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty initialSnapshots with download query', () => {
      const mockSearchParams = {
        get: jest.fn().mockReturnValue('latest'),
      };
      mockUseSearchParams.mockReturnValue(mockSearchParams as any);

      render(<SnapshotListClient {...defaultProps} initialSnapshots={[]} />);

      expect(screen.queryByTestId('download-modal')).not.toBeInTheDocument();
      expect(screen.getByText('No snapshots available for this chain yet.')).toBeInTheDocument();
    });

    it('should find latest snapshot correctly', () => {
      const mockSearchParams = {
        get: jest.fn().mockReturnValue('latest'),
      };
      mockUseSearchParams.mockReturnValue(mockSearchParams as any);

      // Snapshot 3 has the latest updatedAt date
      render(<SnapshotListClient {...defaultProps} />);

      expect(screen.getByTestId('download-modal')).toBeInTheDocument();
      expect(screen.getByText('snapshot-003.tar.lz4')).toBeInTheDocument();
    });
  });
});