import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DownloadButton } from '@/components/snapshots/DownloadButton';
import { useAuth } from '@/hooks/useAuth';
import { Snapshot } from '@/lib/types';

// Mock dependencies
jest.mock('@/hooks/useAuth');
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, disabled, className, whileHover, whileTap, ...props }: any) => (
      <button onClick={onClick} disabled={disabled} className={className} {...props}>
        {children}
      </button>
    ),
    div: ({ children, className, onClick, ...props }: any) => (
      <div className={className} onClick={onClick} {...props}>
        {children}
      </div>
    ),
    svg: ({ children, className, ...props }: any) => (
      <svg className={className} {...props}>
        {children}
      </svg>
    ),
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock LoadingSpinner component
jest.mock('@/components/common/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: { size: string }) => <div data-testid="loading-spinner">Loading...</div>,
}));

// Mock DownloadModal component
jest.mock('@/components/common/DownloadModal', () => ({
  DownloadModal: ({ isOpen, onClose, onConfirm, isLoading }: any) => (
    isOpen ? (
      <div data-testid="download-modal">
        <button onClick={onConfirm}>Confirm Download</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

// Mock fetch
global.fetch = jest.fn();

describe('DownloadButton', () => {
  let mockUseAuth: jest.Mock;
  let mockFetch: jest.Mock;
  let mockSnapshot: Snapshot;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockUseAuth = useAuth as jest.Mock;
    mockFetch = global.fetch as jest.Mock;
    
    mockUseAuth.mockReturnValue({
      user: { email: 'user@example.com' },
    });
    
    mockSnapshot = {
      id: 'snapshot-123',
      chainId: 'cosmos-hub',
      height: 19234567,
      size: 450 * 1024 * 1024 * 1024,
      fileName: 'cosmoshub-4-19234567.tar.lz4',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      type: 'pruned',
      compressionType: 'lz4',
    };
    
    // Mock successful download response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          downloadUrl: 'https://example.com/download/test-file',
        },
      }),
    });
    
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render download button', () => {
    render(
      <DownloadButton 
        snapshot={mockSnapshot} 
        chainName="Cosmos Hub" 
      />
    );
    
    const button = screen.getByRole('button', { name: /download/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('should handle download click', async () => {
    // Default user without tier shows modal first
    render(
      <DownloadButton 
        snapshot={mockSnapshot} 
        chainName="Cosmos Hub" 
      />
    );
    
    const button = screen.getByRole('button', { name: /download/i });
    fireEvent.click(button);
    
    // Should show modal for users without tier
    await waitFor(() => {
      expect(screen.getByTestId('download-modal')).toBeInTheDocument();
    });
    
    // Click confirm in modal
    const confirmButton = screen.getByText('Confirm Download');
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/chains/cosmos-hub/download',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            snapshotId: 'snapshot-123',
            email: 'user@example.com',
          }),
        }
      );
    });
  });

  it('should show download modal for non-premium users', async () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'user@example.com', tier: 'free' },
    });
    
    render(
      <DownloadButton 
        snapshot={mockSnapshot} 
        chainName="Cosmos Hub" 
      />
    );
    
    const button = screen.getByRole('button', { name: /download/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByTestId('download-modal')).toBeInTheDocument();
    });
  });

  it('should handle immediate download for premium users', async () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'premium@example.com', tier: 'premium' },
    });
    
    render(
      <DownloadButton 
        snapshot={mockSnapshot} 
        chainName="Cosmos Hub" 
      />
    );
    
    const button = screen.getByRole('button', { name: /download/i });
    fireEvent.click(button);
    
    // Premium users should not see the modal
    expect(screen.queryByTestId('download-modal')).not.toBeInTheDocument();
    
    // Should call the download API directly
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/chains/cosmos-hub/download',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  it('should confirm download through modal for free users', async () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'user@example.com', tier: 'free' },
    });
    
    render(
      <DownloadButton 
        snapshot={mockSnapshot} 
        chainName="Cosmos Hub" 
      />
    );
    
    // Click download button
    const button = screen.getByRole('button', { name: /download/i });
    fireEvent.click(button);
    
    // Modal should appear
    await waitFor(() => {
      expect(screen.getByTestId('download-modal')).toBeInTheDocument();
    });
    
    // Click confirm in modal
    const confirmButton = screen.getByText('Confirm Download');
    fireEvent.click(confirmButton);
    
    // Should call download API
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/chains/cosmos-hub/download',
        expect.any(Object)
      );
    });
  });

  it('should handle download without user email', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
    });
    
    render(
      <DownloadButton 
        snapshot={mockSnapshot} 
        chainName="Cosmos Hub" 
      />
    );
    
    const button = screen.getByRole('button', { name: /download/i });
    fireEvent.click(button);
    
    // Should show modal for users without auth
    await waitFor(() => {
      expect(screen.getByTestId('download-modal')).toBeInTheDocument();
    });
    
    // Click confirm in modal
    const confirmButton = screen.getByText('Confirm Download');
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/chains/cosmos-hub/download',
        expect.objectContaining({
          body: JSON.stringify({
            snapshotId: 'snapshot-123',
            email: undefined,
          }),
        })
      );
    });
  });

  it('should handle download errors', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Download failed' }),
    });
    
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    
    render(
      <DownloadButton 
        snapshot={mockSnapshot} 
        chainName="Cosmos Hub" 
      />
    );
    
    const button = screen.getByRole('button', { name: /download/i });
    fireEvent.click(button);
    
    // Confirm in modal first
    await waitFor(() => {
      const confirmButton = screen.getByText('Confirm Download');
      fireEvent.click(confirmButton);
    });
    
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Download failed:',
        expect.any(Error)
      );
      expect(button).not.toBeDisabled();
    });
    
    consoleError.mockRestore();
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    
    render(
      <DownloadButton 
        snapshot={mockSnapshot} 
        chainName="Cosmos Hub" 
      />
    );
    
    const button = screen.getByRole('button', { name: /download/i });
    fireEvent.click(button);
    
    // Confirm in modal first
    await waitFor(() => {
      const confirmButton = screen.getByText('Confirm Download');
      fireEvent.click(confirmButton);
    });
    
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Download failed:',
        expect.any(Error)
      );
      expect(button).not.toBeDisabled();
    });
    
    consoleError.mockRestore();
  });

  it('should show download URL modal after successful API call', async () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'user@example.com', tier: 'free' },
    });
    
    render(
      <DownloadButton 
        snapshot={mockSnapshot} 
        chainName="Cosmos Hub" 
      />
    );
    
    // Click download button
    const button = screen.getByRole('button', { name: /download/i });
    fireEvent.click(button);
    
    // Confirm in modal
    await waitFor(() => {
      const confirmButton = screen.getByText('Confirm Download');
      fireEvent.click(confirmButton);
    });
    
    // Wait for API call and URL modal
    await waitFor(() => {
      expect(screen.getByText('Download Ready')).toBeInTheDocument();
      expect(screen.getByText('Copy URL')).toBeInTheDocument();
    });
  });
});