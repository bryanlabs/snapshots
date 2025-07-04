// Polkachu API service layer
const POLKACHU_BASE_URL = "https://polkachu.com/api/v2";

// Polkachu API interfaces
export interface PolkachuChainDetail {
  network: string;
  name: string;
  chain_id: string;
  description: string;
  twitter?: string;
  github?: string;
  symbol: string;
  denom: string;
  binary: string;
  folder: string;
  node_version: string;
  port_prefix: number;
  minimum_gas_price: string;
  logo?: string;
  block_explorer?: string;
  block_explorer_url?: string;
  coingecko_id?: string;
  token_price?: string;
  staking_apr?: string;
  polkachu_services: {
    rpc?: {
      active: boolean;
      url: string;
    };
    api?: {
      active: boolean;
      url: string;
    };
    grpc?: {
      active: boolean;
      url: string;
    };
    staking?: {
      active: boolean;
      url: string;
      details: string;
    };
    restake?: {
      active: boolean;
      url: string;
      details: string;
    };
    seed?: {
      active: boolean;
      seed: string;
      details: string;
    };
    addrbook?: {
      active: boolean;
      download_url: string;
      details: string;
    };
    genesis?: {
      active: boolean;
      download_url: string;
      details: string;
    };
    state_sync?: {
      active: boolean;
      node: string;
      details: string;
    };
    installation?: {
      active: boolean;
      details: string;
    };
    snapshot?: {
      active: boolean;
      download_url: string;
      details: string;
    };
  };
}

// Enhanced interfaces for our app
export interface EnhancedChainSnapshot {
  // Original fields
  name: string;
  network: string;
  latestBlock: number;
  size: string;
  prunedSize: string;
  updated: string;

  // New Polkachu fields
  tokenPrice?: string;
  stakingApr?: string;
  nodeVersion: string;
  minimumGasPrice: string;
  symbol: string;
  denom: string;
  description: string;
  logo?: string;
  blockExplorerUrl?: string;
  github?: string;
  website?: string;
  services: {
    rpc: boolean;
    api: boolean;
    grpc: boolean;
    stateSync: boolean;
    snapshot: boolean;
  };
  endpoints: {
    rpc?: string;
    api?: string;
    grpc?: string;
    stateSync?: string;
    snapshot?: string;
  };
}

export interface DynamicStats {
  totalChains: number;
  updateFrequency: string;
  uptime: string;
  activeServices: number;
  averageStakingApr?: string;
}

// API functions
export async function fetchAllChains(): Promise<string[]> {
  try {
    const response = await fetch(`${POLKACHU_BASE_URL}/chains`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const chains: string[] = await response.json();
    return chains;
  } catch (error) {
    console.error("Error fetching chains:", error);
    return [];
  }
}

export async function fetchChainDetails(
  chainName: string,
  retryCount: number = 0
): Promise<PolkachuChainDetail | null> {
  const MAX_RETRIES = 3;
  const BASE_DELAY = 1000; // 1 second base delay

  try {
    const response = await fetch(`${POLKACHU_BASE_URL}/chains/${chainName}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Chain ${chainName} not found in Polkachu API`);
        return null;
      }

      // Handle rate limiting with exponential backoff
      if (response.status === 429 && retryCount < MAX_RETRIES) {
        const retryDelay = BASE_DELAY * Math.pow(2, retryCount); // Exponential backoff
        console.warn(
          `Rate limited for ${chainName}. Retrying in ${retryDelay}ms... (attempt ${
            retryCount + 1
          }/${MAX_RETRIES})`
        );
        await delay(retryDelay);
        return fetchChainDetails(chainName, retryCount + 1);
      }

      if (response.status === 429) {
        console.error(
          `Rate limit exceeded for ${chainName} after ${MAX_RETRIES} retries`
        );
        return null; // Return null instead of throwing error
      }

      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const chainDetail: PolkachuChainDetail = await response.json();
    return chainDetail;
  } catch (error) {
    if (
      retryCount < MAX_RETRIES &&
      error instanceof Error &&
      error.message.includes("429")
    ) {
      const retryDelay = BASE_DELAY * Math.pow(2, retryCount);
      console.warn(
        `Retrying ${chainName} in ${retryDelay}ms due to rate limit...`
      );
      await delay(retryDelay);
      return fetchChainDetails(chainName, retryCount + 1);
    }

    console.error(`Error fetching details for chain ${chainName}:`, error);
    return null;
  }
}

// Rate limiting helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchMultipleChainDetails(
  chainNames: string[]
): Promise<PolkachuChainDetail[]> {
  const results: PolkachuChainDetail[] = [];
  const BATCH_SIZE = 3; // Process 3 chains at a time
  const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds between batches
  const DELAY_BETWEEN_REQUESTS = 300; // 300ms between individual requests

  // Process chains in smaller batches to avoid rate limiting
  for (let i = 0; i < chainNames.length; i += BATCH_SIZE) {
    const batch = chainNames.slice(i, i + BATCH_SIZE);

    console.log(
      `Fetching batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.join(", ")}`
    );

    // Process batch with delays between requests
    const batchPromises = batch.map((name, index) =>
      delay(index * DELAY_BETWEEN_REQUESTS).then(() => fetchChainDetails(name))
    );

    const batchResults = await Promise.allSettled(batchPromises);

    // Add successful results
    batchResults.forEach((result) => {
      if (result.status === "fulfilled" && result.value !== null) {
        results.push(result.value);
      }
    });

    // Delay before next batch (except for the last batch)
    if (i + BATCH_SIZE < chainNames.length) {
      console.log(`Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
      await delay(DELAY_BETWEEN_BATCHES);
    }
  }

  return results;
}

// Transform Polkachu data to our enhanced snapshot format
export function transformToEnhancedSnapshot(
  polkachuData: PolkachuChainDetail,
  staticConfig?: import("@/lib/data/chains").ChainConfig
): EnhancedChainSnapshot {
  // Get static snapshot data from config if available
  const getStaticSnapshotData = () => {
    if (!staticConfig?.networks?.mainnet) {
      // Fallback to basic defaults if no static config
      return {
        latestBlock: 1000000,
        size: "10 GB",
        prunedSize: "5 GB",
        updated: "Unknown",
      };
    }

    const mainnet = staticConfig.networks.mainnet;
    const prunedSnapshot = mainnet.snapshots?.find((s) => s.type === "pruned");
    const fullSnapshot =
      mainnet.snapshots?.find((s) => s.type === "full") ||
      mainnet.snapshots?.find((s) => s.type === "archive");

    return {
      latestBlock: mainnet.latestBlock,
      size: fullSnapshot?.size || staticConfig.hardware.storageArchive,
      prunedSize: prunedSnapshot?.size || staticConfig.hardware.storagePruned,
      updated: mainnet.lastUpdated,
    };
  };

  const snapshotData = getStaticSnapshotData();

  return {
    // Original fields with real/estimated data
    name: polkachuData.name,
    network: polkachuData.chain_id,
    latestBlock: snapshotData.latestBlock,
    size: snapshotData.size,
    prunedSize: snapshotData.prunedSize,
    updated: snapshotData.updated,

    // New Polkachu fields
    tokenPrice: polkachuData.token_price
      ? `$${parseFloat(polkachuData.token_price).toFixed(4)}`
      : undefined,
    stakingApr: polkachuData.staking_apr
      ? `${(parseFloat(polkachuData.staking_apr) * 100).toFixed(2)}%`
      : undefined,
    nodeVersion: polkachuData.node_version,
    minimumGasPrice: polkachuData.minimum_gas_price,
    symbol: polkachuData.symbol,
    denom: polkachuData.denom,
    description: polkachuData.description,
    logo: polkachuData.logo,
    blockExplorerUrl: polkachuData.block_explorer_url,
    github: polkachuData.github,

    // Service availability
    services: {
      rpc: polkachuData.polkachu_services.rpc?.active || false,
      api: polkachuData.polkachu_services.api?.active || false,
      grpc: polkachuData.polkachu_services.grpc?.active || false,
      stateSync: polkachuData.polkachu_services.state_sync?.active || false,
      snapshot: true,
    },

    // Polkachu endpoints
    endpoints: {
      rpc: polkachuData.polkachu_services.rpc?.url,
      api: polkachuData.polkachu_services.api?.url,
      grpc: polkachuData.polkachu_services.grpc?.url,
      stateSync: polkachuData.polkachu_services.state_sync?.node,
      snapshot: staticConfig?.networks.mainnet?.snapshots?.[0]?.url,
    },
  };
}

// Calculate dynamic statistics
export function calculateDynamicStats(
  chains: PolkachuChainDetail[]
): DynamicStats {
  const activeServices = chains.reduce((acc, chain) => {
    const services = Object.values(chain.polkachu_services).filter(
      (service) =>
        service &&
        typeof service === "object" &&
        "active" in service &&
        service.active
    );
    return acc + services.length;
  }, 0);

  // Calculate average staking APR
  const stakingAprs = chains
    .filter((chain) => chain.staking_apr && parseFloat(chain.staking_apr) > 0)
    .map((chain) => parseFloat(chain.staking_apr!));

  const averageStakingApr =
    stakingAprs.length > 0
      ? `${(
          (stakingAprs.reduce((a, b) => a + b, 0) / stakingAprs.length) *
          100
        ).toFixed(1)}%`
      : undefined;

  return {
    totalChains: chains.length,
    updateFrequency: "Live",
    uptime: "99.9%",
    activeServices,
    averageStakingApr,
  };
}

// Cache management
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new Map<string, { data: any; timestamp: number }>();

export function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

export function setCachedData<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Main function to get enhanced chain data with caching
export async function getEnhancedChainData(): Promise<{
  chains: EnhancedChainSnapshot[];
  stats: DynamicStats;
}> {
  const cacheKey = "enhanced-chain-data";
  const cached = getCachedData<{
    chains: EnhancedChainSnapshot[];
    stats: DynamicStats;
  }>(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    // Fetch popular/priority chains first for better UX (reduced to avoid rate limits)
    const priorityChains = [
      "osmosis",
      "cosmos",
      "juno",
      "akash",
      "kujira",
      "noble",
      "terra",
      "injective",
      "neutron",
    ];

    const chainDetails = await fetchMultipleChainDetails(priorityChains);

    // Import the static chains config
    const { getChainById } = await import("@/lib/data/chains");

    const enhancedChains = chainDetails.map((polkachuData) => {
      // Map polkachu network names to our chain IDs
      const chainId =
        polkachuData.network === "cosmos" ? "cosmoshub" : polkachuData.network;
      const staticConfig = getChainById(chainId);
      return transformToEnhancedSnapshot(polkachuData, staticConfig);
    });
    const stats = calculateDynamicStats(chainDetails);

    const result = {
      chains: enhancedChains,
      stats,
    };

    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error fetching enhanced chain data:", error);

    // Return empty data on error
    return {
      chains: [],
      stats: {
        totalChains: 0,
        updateFrequency: "Error",
        uptime: "N/A",
        activeServices: 0,
      },
    };
  }
}
