import { useState, useEffect } from "react";

// Interface for the Polkachu chain snapshots response
export interface PolkachuSnapshot {
  id: number;
  network: string;
  type: string;
  download_url: string;
  size: string;
  height: number;
  created_at: string;
  updated_at: string;
  checksum?: string;
  compression: string;
}

export interface PolkachuSnapshotsResponse {
  network: string;
  snapshot: {
    file: string;
    name: string;
    size: string;
    time: string;
    url: string;
    block_height: string;
  };
}

// Hook parameters interface
export interface UsePolkachuSnapshotsParams {
  network: string;
  type: "mainnet" | "testnet";
  enabled?: boolean;
}

// Hook return interface
export interface UsePolkachuSnapshotsResult {
  data: PolkachuSnapshotsResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const POLKACHU_BASE_URL = "https://polkachu.com/api/v2";

/**
 * React hook for fetching chain snapshots from Polkachu's private API
 *
 * @param params - Configuration object with network, type, and optional API key
 * @returns Object containing data, loading state, error state, and refetch function
 *
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = usePolkachuSnapshots({
 *   network: "osmosis",
 *   type: "testnet",
 *   apiKey: process.env.NEXT_PUBLIC_POLKACHU_API_KEY
 * });
 * ```
 */
export function usePolkachuSnapshots({
  network,
  type,
  enabled = true,
}: UsePolkachuSnapshotsParams): UsePolkachuSnapshotsResult {
  const [data, setData] = useState<PolkachuSnapshotsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSnapshots = async () => {
    if (!enabled || !network || !type) {
      return;
    }

    // Use provided API key or fall back to environment variable
    const key = "danb";

    if (!key) {
      setError("API key is required for accessing Polkachu private endpoints");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const url = `${POLKACHU_BASE_URL}/chain_snapshots/${network}/${type}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-polkachu": key,
        },
      });

      if (!response.ok) {
        // Handle specific HTTP status codes
        switch (response.status) {
          case 401:
            throw new Error(
              "Invalid API key. Please check your Polkachu API credentials."
            );
          case 403:
            throw new Error(
              "Access forbidden. Your API key may not have the required permissions."
            );
          case 404:
            throw new Error(
              `Chain snapshots not found for network: ${network} (${type})`
            );
          case 429:
            throw new Error("Rate limit exceeded. Please try again later.");
          default:
            throw new Error(
              `Request failed with status ${response.status}: ${response.statusText}`
            );
        }
      }

      const responseData: PolkachuSnapshotsResponse = await response.json();
      setData(responseData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      console.error("Error fetching Polkachu snapshots:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to fetch data when dependencies change
  useEffect(() => {
    fetchSnapshots();
  }, [network, type, enabled]);

  const refetch = () => {
    fetchSnapshots();
  };

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Utility function to format snapshot size
 */
export function formatSnapshotSize(size: string): string {
  // If size is already formatted (e.g., "2.5 GB"), return as-is
  if (/^\d+\.?\d*\s*(GB|MB|KB|TB)$/i.test(size)) {
    return size;
  }

  // If size is in bytes, convert to human-readable format
  const bytes = parseInt(size);
  if (isNaN(bytes)) {
    return size; // Return original if not a valid number
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let unitIndex = 0;
  let value = bytes;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Utility function to format snapshot timestamp
 */
export function formatSnapshotDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch {
    return dateString; // Return original string if parsing fails
  }
}
