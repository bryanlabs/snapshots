import { useState, useMemo } from "react";
import {
  getAvailableNetworks,
  getNetworkData,
  NetworkData,
} from "@/lib/data/chains";

export interface NetworkTabValue {
  displayName: string;
  apiType: "mainnet" | "testnet";
  chainId: string;
  isMainnet: boolean;
  isTestnet: boolean;
  networkData: NetworkData | undefined;
}

export interface UseNetworkTabsResult {
  selectedNetwork: string;
  setSelectedNetwork: (network: string) => void;
  availableNetworks: string[];
  currentTabValue: NetworkTabValue;
  isTabSelected: (tabName: string) => boolean;
}

/**
 * Custom hook for managing network tab state and providing easy access to tab values
 *
 * @param chainId - The chain identifier
 * @returns Object containing tab state, values, and helper functions
 *
 * @example
 * ```typescript
 * const { selectedNetwork, setSelectedNetwork, currentTabValue } = useNetworkTabs("osmosis");
 * console.log(currentTabValue.apiType); // "mainnet" or "testnet"
 * console.log(currentTabValue.displayName); // "Mainnet" or "Testnet"
 * ```
 */
export function useNetworkTabs(chainId: string): UseNetworkTabsResult {
  // Get available networks for this chain
  const availableNetworks = useMemo(
    () => getAvailableNetworks(chainId),
    [chainId]
  );

  // Set default selected network
  const [selectedNetwork, setSelectedNetwork] = useState(() => {
    return availableNetworks.includes("Mainnet")
      ? "Mainnet"
      : availableNetworks[0] || "Mainnet";
  });

  // Memoized current tab value
  const currentTabValue: NetworkTabValue = useMemo(() => {
    const apiType = selectedNetwork.toLowerCase() as "mainnet" | "testnet";

    return {
      displayName: selectedNetwork,
      apiType,
      chainId,
      isMainnet: apiType === "mainnet",
      isTestnet: apiType === "testnet",
      networkData: getNetworkData(chainId, selectedNetwork),
    };
  }, [selectedNetwork, chainId]);

  // Helper function to check if a specific tab is selected
  const isTabSelected = (tabName: string): boolean => {
    return selectedNetwork === tabName;
  };

  return {
    selectedNetwork,
    setSelectedNetwork,
    availableNetworks,
    currentTabValue,
    isTabSelected,
  };
}
