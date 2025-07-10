import { ChainSnapshot } from "@/components/ui/SnapshotCard";
import {
  CHAINS_CONFIG,
  getAllChainSnapshots,
  GLOBAL_STATS,
} from "../data/chains";
import { getEnhancedChainData, DynamicStats } from "../api/polkachu";

// Fallback data provider when API fails
export async function getChainDataWithFallback(): Promise<{
  chains: ChainSnapshot[];
  stats: DynamicStats;
  isLive: boolean;
}> {
  try {
    // Try to get live data from Polkachu API
    const { chains, stats } = await getEnhancedChainData();

    if (chains.length > 0) {
      return {
        chains,
        stats,
        isLive: true,
      };
    }

    // If no chains returned, fall back to static data
    throw new Error("No chains returned from API");
  } catch (error) {
    console.warn("Falling back to static data:", error);

    // Transform static data to match new interface
    const staticChains = getAllChainSnapshots();
    const enhancedStaticChains: ChainSnapshot[] = staticChains.map((chain) => {
      const chainConfig = Object.values(CHAINS_CONFIG).find(
        (config) => config.name === chain.name
      );

      return {
        ...chain,
        // Add required new fields with fallback values
        nodeVersion: chainConfig?.binary.version || "Unknown",
        minimumGasPrice: chainConfig?.token
          ? `0.001${chainConfig.token.denom}`
          : "0.001uatom",
        symbol: chainConfig?.token?.symbol || "ATOM",
        denom: chainConfig?.token?.denom || "uatom",
        description:
          chainConfig?.description || `${chain.name} blockchain network`,
        logo: chainConfig?.logo,
        blockExplorerUrl: undefined,
        github: chainConfig?.github,
        services: {
          rpc: true,
          api: true,
          grpc: false,
          stateSync: true,
          snapshot: true,
        },
        endpoints: {
          rpc: chainConfig?.networks?.mainnet?.rpcEndpoints?.primary,
          api: chainConfig?.networks?.mainnet?.restEndpoints?.primary,
          grpc: undefined,
          stateSync: undefined,
          snapshot: chainConfig?.networks?.mainnet?.snapshots?.[0]?.url,
        },
      };
    });

    const fallbackStats: DynamicStats = {
      totalChains: GLOBAL_STATS.totalChains,
      updateFrequency: GLOBAL_STATS.updateFrequency,
    };

    return {
      chains: enhancedStaticChains,
      stats: fallbackStats,
      isLive: false,
    };
  }
}

// Helper function to check API health
export async function checkPolkachuAPIHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch("https://polkachu.com/api/v2/chains", {
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

// Migration status indicator
export interface MigrationStatus {
  isUsingLiveData: boolean;
  apiHealthy: boolean;
  lastUpdated: Date;
  chainCount: number;
  source: "polkachu" | "static" | "hybrid";
}

export async function getMigrationStatus(): Promise<MigrationStatus> {
  const apiHealthy = await checkPolkachuAPIHealth();
  const { chains, isLive } = await getChainDataWithFallback();

  return {
    isUsingLiveData: isLive,
    apiHealthy,
    lastUpdated: new Date(),
    chainCount: chains.length,
    source: isLive ? "polkachu" : "static",
  };
}
