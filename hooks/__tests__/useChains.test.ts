import { renderHook, act, waitFor } from '@testing-library/react';
import { useChains } from '../useChains';
import { Chain, ApiResponse } from '@/lib/types';

// Mock fetch
global.fetch = jest.fn();

describe('useChains', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  const mockChains: Chain[] = [
    {
      id: 'osmosis',
      name: 'Osmosis',
      network: 'mainnet',
      logoUrl: 'https://example.com/osmosis.png',
      snapshotCount: 5,
    },
    {
      id: 'cosmos',
      name: 'Cosmos Hub',
      network: 'mainnet',
      logoUrl: 'https://example.com/cosmos.png',
      snapshotCount: 3,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should start with loading state', () => {
      // Mock fetch to never resolve
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useChains());

      expect(result.current.loading).toBe(true);
      expect(result.current.chains).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('Successful fetch', () => {
    it('should fetch chains successfully', async () => {
      const mockResponse: ApiResponse<Chain[]> = {
        success: true,
        data: mockChains,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useChains());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.chains).toEqual(mockChains);
      expect(result.current.error).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/chains');
    });

    it('should handle empty chains array', async () => {
      const mockResponse: ApiResponse<Chain[]> = {
        success: true,
        data: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useChains());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.chains).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should handle null data in response', async () => {
      const mockResponse: ApiResponse<Chain[]> = {
        success: true,
        data: null as any,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useChains());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.chains).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should handle non-ok response', async () => {
      const mockResponse: ApiResponse<Chain[]> = {
        success: false,
        error: 'Server error',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useChains());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.chains).toBeNull();
      expect(result.current.error).toBe('Server error');
    });

    it('should handle unsuccessful API response', async () => {
      const mockResponse: ApiResponse<Chain[]> = {
        success: false,
        error: 'Database connection failed',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useChains());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.chains).toBeNull();
      expect(result.current.error).toBe('Database connection failed');
    });

    it('should use default error message when no error provided', async () => {
      const mockResponse: ApiResponse<Chain[]> = {
        success: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useChains());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.chains).toBeNull();
      expect(result.current.error).toBe('Failed to fetch chains');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useChains());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.chains).toBeNull();
      expect(result.current.error).toBe('Network error');
    });

    it('should handle non-Error exceptions', async () => {
      mockFetch.mockRejectedValueOnce('String error');

      const { result } = renderHook(() => useChains());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.chains).toBeNull();
      expect(result.current.error).toBe('An error occurred');
    });

    it('should handle JSON parse errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      const { result } = renderHook(() => useChains());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.chains).toBeNull();
      expect(result.current.error).toBe('Invalid JSON');
    });
  });

  describe('Refetch functionality', () => {
    it('should refetch chains when calling refetch', async () => {
      const mockResponse: ApiResponse<Chain[]> = {
        success: true,
        data: mockChains,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useChains());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Call refetch
      await act(async () => {
        await result.current.refetch();
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.current.chains).toEqual(mockChains);
    });

    it('should handle errors during refetch', async () => {
      const mockResponse: ApiResponse<Chain[]> = {
        success: true,
        data: mockChains,
      };

      // First call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useChains());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.chains).toEqual(mockChains);
      expect(result.current.error).toBeNull();

      // Second call fails
      mockFetch.mockRejectedValueOnce(new Error('Refetch failed'));

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.chains).toBeNull();
      expect(result.current.error).toBe('Refetch failed');
    });

    it('should reset error on successful refetch', async () => {
      // First call fails
      mockFetch.mockRejectedValueOnce(new Error('Initial error'));

      const { result } = renderHook(() => useChains());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Initial error');

      // Second call succeeds
      const mockResponse: ApiResponse<Chain[]> = {
        success: true,
        data: mockChains,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.chains).toEqual(mockChains);
      expect(result.current.error).toBeNull();
    });

    it('should show loading state during refetch', async () => {
      const mockResponse: ApiResponse<Chain[]> = {
        success: true,
        data: mockChains,
      };

      // Create a promise we can control
      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response)
        .mockReturnValueOnce(controlledPromise as any);

      const { result } = renderHook(() => useChains());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start refetch
      act(() => {
        result.current.refetch();
      });

      // Should be loading
      expect(result.current.loading).toBe(true);

      // Resolve the promise
      act(() => {
        resolvePromise!({
          ok: true,
          json: async () => mockResponse,
        });
      });

      // Wait for loading to finish
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Component lifecycle', () => {
    it('should fetch on mount', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockChains }),
      } as Response);

      renderHook(() => useChains());

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/chains');
    });

    it('should not fetch again on re-render', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockChains }),
      } as Response);

      const { result, rerender } = renderHook(() => useChains());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Re-render the hook
      rerender();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle component unmount during fetch', async () => {
      // Create a promise that never resolves
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const { unmount } = renderHook(() => useChains());

      // Unmount immediately
      unmount();

      // Should not throw any errors
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle timeout scenarios', async () => {
      // Simulate a timeout by creating a promise that rejects after a delay
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 100);
      });

      mockFetch.mockReturnValueOnce(timeoutPromise as any);

      const { result } = renderHook(() => useChains());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 200 });

      expect(result.current.error).toBe('Request timeout');
    });

    it('should handle malformed response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => 'not an object',
      } as Response);

      const { result } = renderHook(() => useChains());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should handle gracefully even with unexpected response format
      expect(result.current.chains).toBeNull();
    });
  });
});