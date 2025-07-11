import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DownloadButton } from '@/components/snapshots/DownloadButton';
import { useAuth } from '@/components/providers/AuthProvider';
import { Snapshot } from '@/lib/types';

// Mock dependencies
jest.mock('@/components/providers/AuthProvider');

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
    
    // Mock createElement and appendChild
    const mockLink = {
      href: '',
      download: '',
      click: jest.fn(),
      remove: jest.fn(),
    };
    
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    jest.spyOn(document.body, 'appendChild').mockImplementation();
    jest.spyOn(document.body, 'removeChild').mockImplementation();
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
    render(
      <DownloadButton 
        snapshot={mockSnapshot} 
        chainName="Cosmos Hub" 
      />
    );
    
    const button = screen.getByRole('button', { name: /download/i });
    fireEvent.click(button);
    
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

  it('should show loading state during download', async () => {
    render(
      <DownloadButton 
        snapshot={mockSnapshot} 
        chainName="Cosmos Hub" 
      />
    );
    
    const button = screen.getByRole('button', { name: /download/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Downloading...')).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

  it('should create and click download link', async () => {
    const mockLink = {
      href: '',
      download: '',
      click: jest.fn(),
    };
    
    const createElementSpy = jest.spyOn(document, 'createElement')
      .mockReturnValue(mockLink as any);
    
    render(
      <DownloadButton 
        snapshot={mockSnapshot} 
        chainName="Cosmos Hub" 
      />
    );
    
    const button = screen.getByRole('button', { name: /download/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.href).toBe('https://example.com/download/test-file');
      expect(mockLink.download).toBe('cosmoshub-4-19234567.tar.lz4');
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  it('should show progress bar during download', async () => {
    render(
      <DownloadButton 
        snapshot={mockSnapshot} 
        chainName="Cosmos Hub" 
      />
    );
    
    const button = screen.getByRole('button', { name: /download/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      const progressBar = screen.getByRole('progressbar', { hidden: true });
      expect(progressBar).toBeInTheDocument();
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
    
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Download failed:',
        expect.any(Error)
      );
      expect(button).not.toBeDisabled();
      expect(screen.queryByText('Downloading...')).not.toBeInTheDocument();
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
    
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Download failed:',
        expect.any(Error)
      );
      expect(button).not.toBeDisabled();
    });
    
    consoleError.mockRestore();
  });

  it('should reset state after download completes', async () => {
    jest.useFakeTimers();
    
    render(
      <DownloadButton 
        snapshot={mockSnapshot} 
        chainName="Cosmos Hub" 
      />
    );
    
    const button = screen.getByRole('button', { name: /download/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Downloading...')).toBeInTheDocument();
    });
    
    // Fast-forward through the simulated download
    jest.advanceTimersByTime(10000);
    
    await waitFor(() => {
      expect(screen.queryByText('Downloading...')).not.toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
    
    jest.useRealTimers();
  });
});