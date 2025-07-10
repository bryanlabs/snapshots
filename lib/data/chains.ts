import { ChainSnapshot } from "@/components";

// Network-specific data interface
export interface NetworkData {
  chainId: string;
  latestBlock: number;
  snapshots?: [
    {
      url: string;
      size: string;
      type: "full" | "pruned" | "archive" | "stateSync";
    }
  ];
  lastUpdated: string;
  rpcEndpoints: {
    primary: string;
    secondary?: string;
  };
  restEndpoints?: {
    primary: string;
    secondary?: string;
  };
  status: "active" | "maintenance" | "deprecated";
}

// Core chain configuration interface
export interface ChainConfig {
  id: string;
  name: string;
  description: string;
  binary: {
    name: string;
    version: string;
    repository: string;
  };
  logo?: string;
  website?: string;
  github?: string;
  docs?: string;
  // Real token data
  token: {
    symbol: string;
    denom: string;
  };
  hardware: {
    minRam: string;
    recommendedRam: string;
    storagePruned: string;
    storageArchive: string;
    cpu: string;
    network: string;
  };
  features: string[];
  networks: {
    mainnet?: NetworkData;
    testnet?: NetworkData;
    archive?: NetworkData;
  };
}

// Comprehensive chain configurations
export const CHAINS_CONFIG: Record<string, ChainConfig> = {
  cosmoshub: {
    id: "cosmoshub",
    name: "Cosmos Hub",
    description:
      "The heart of the Cosmos ecosystem - the first hub in the Cosmos network enabling secure interchain communication",
    binary: {
      name: "gaiad",
      version: "v18.1.0",
      repository: "https://github.com/cosmos/gaia",
    },
    logo: "https://cosmos.network/img/logo.png",
    website: "https://cosmos.network",
    github: "https://github.com/cosmos/gaia",
    docs: "https://hub.cosmos.network",
    token: {
      symbol: "ATOM",
      denom: "uatom",
    },
    hardware: {
      minRam: "16 GB",
      recommendedRam: "32 GB",
      storagePruned: "500 GB SSD",
      storageArchive: "2 TB SSD",
      cpu: "4+ cores",
      network: "100 Mbps+",
    },
    features: ["IBC", "Governance", "Staking", "Interchain Security"],
    networks: {
      mainnet: {
        chainId: "cosmoshub-4",
        latestBlock: 18234567,
        lastUpdated: "2 hours ago",
        rpcEndpoints: {
          primary: "https://rpc-cosmoshub.bryanlabs.net",
          secondary: "https://rpc2-cosmoshub.bryanlabs.net",
        },
        status: "active",
        snapshots: [
          {
            url: "https://snapshots.polkachu.com/snapshots/cosmos/cosmos_18234567.tar.lz4",
            size: "1.2 TB",
            type: "full",
          },
        ],
      },
      testnet: {
        chainId: "theta-testnet-001",
        latestBlock: 15234892,
        lastUpdated: "1 hour ago",
        rpcEndpoints: {
          primary: "https://rpc-testnet-cosmoshub.bryanlabs.net",
          secondary: "https://rpc2-testnet-cosmoshub.bryanlabs.net",
        },
        status: "active",
        snapshots: [
          {
            url: "https://snapshots.polkachu.com/snapshots/cosmos/cosmos_18234567.tar.lz4",
            size: "1.2 TB",
            type: "full",
          },
        ],
      },
      archive: {
        chainId: "cosmoshub-4-archive",
        latestBlock: 18234567,
        lastUpdated: "12 hours ago",
        rpcEndpoints: {
          primary: "https://rpc-archive-cosmoshub.bryanlabs.net",
          secondary: "https://rpc2-archive-cosmoshub.bryanlabs.net",
        },
        status: "active",
      },
    },
  },
  noble: {
    id: "noble",
    name: "Noble",
    description:
      "Native asset issuance chain for the Cosmos ecosystem, enabling compliant and regulated digital assets",
    binary: {
      name: "nobled",
      version: "v4.1.0",
      repository: "https://github.com/noble-assets/noble",
    },
    logo: "https://nobleassets.xyz/img/logo.png",
    website: "https://nobleassets.xyz",
    github: "https://github.com/noble-assets/noble",
    docs: "https://docs.nobleassets.xyz",
    token: {
      symbol: "USDC",
      denom: "uusdc",
    },
    hardware: {
      minRam: "8 GB",
      recommendedRam: "16 GB",
      storagePruned: "100 GB SSD",
      storageArchive: "250 GB SSD",
      cpu: "4+ cores",
      network: "100 Mbps+",
    },
    features: ["Native Asset Issuance", "USDC", "Compliance", "IBC"],
    networks: {
      mainnet: {
        chainId: "noble-1",
        latestBlock: 30074846,
        snapshots: [
          {
            url: "https://snapshots.polkachu.com/snapshots/noble/noble_30074846.tar.lz4",
            size: "2 GB",
            type: "pruned",
          },
        ],
        lastUpdated: "1 hour ago",
        rpcEndpoints: {
          primary: "https://noble-rpc.bryanlabs.net/",
        },
        restEndpoints: {
          primary: "https://noble-api.bryanlabs.net/",
        },
        status: "active",
      },
      testnet: {
        chainId: "grand-1",
        latestBlock: 33387752,
        snapshots: [
          {
            url: "https://snapshots.polkachu.com/testnet-snapshots/noble/noble_33387752.tar.lz4",
            size: "860 MB",
            type: "pruned",
          },
        ],
        lastUpdated: "45 minutes ago",
        rpcEndpoints: {
          primary: "https://noble-testnet-rpc.polkachu.com/",
        },
        status: "active",
      },
    },
  },
  kujira: {
    id: "kujira",
    name: "Kujira",
    description:
      "DeFi-focused blockchain providing sustainable and innovative financial products for the Cosmos ecosystem",
    binary: {
      name: "kujirad",
      version: "v0.9.3",
      repository: "https://github.com/Team-Kujira/core",
    },
    logo: "https://kujira.network/img/logo.png",
    website: "https://kujira.network",
    github: "https://github.com/Team-Kujira/core",
    docs: "https://docs.kujira.app",
    token: {
      symbol: "KUJI",
      denom: "ukuji",
    },
    hardware: {
      minRam: "8 GB",
      recommendedRam: "16 GB",
      storagePruned: "150 GB SSD",
      storageArchive: "300 GB SSD",
      cpu: "4+ cores",
      network: "100 Mbps+",
    },
    features: ["DeFi", "Liquidations", "Yield Farming", "Trading"],
    networks: {
      mainnet: {
        chainId: "kaiyo-1",
        latestBlock: 32329671,
        snapshots: [
          {
            url: "https://snapshots.polkachu.com/snapshots/kujira/kujira_32329671.tar.lz4",
            size: "25 GB",
            type: "pruned",
          },
        ],
        lastUpdated: "3 hours ago",
        rpcEndpoints: {
          primary: "https://kujira-rpc.bryanlabs.net/",
        },
        restEndpoints: {
          primary: "https://kujira-api.bryanlabs.net/",
        },
        status: "active",
      },
    },
  },
  osmosis: {
    id: "osmosis",
    name: "Osmosis",
    description:
      "The leading DEX and liquidity hub for the Cosmos ecosystem with advanced AMM capabilities",
    binary: {
      name: "osmosisd",
      version: "v25.0.0",
      repository: "https://github.com/osmosis-labs/osmosis",
    },
    logo: "https://osmosis.zone/img/logo.png",
    website: "https://osmosis.zone",
    github: "https://github.com/osmosis-labs/osmosis",
    docs: "https://docs.osmosis.zone",
    token: {
      symbol: "OSMO",
      denom: "uosmo",
    },
    hardware: {
      minRam: "16 GB",
      recommendedRam: "32 GB",
      storagePruned: "600 GB SSD",
      storageArchive: "1.5 TB SSD",
      cpu: "6+ cores",
      network: "200 Mbps+",
    },
    features: [
      "DEX",
      "Liquidity Pools",
      "Concentrated Liquidity",
      "Superfluid Staking",
    ],
    networks: {
      mainnet: {
        chainId: "osmosis-1",
        latestBlock: 12345678,
        snapshots: [
          {
            url: "https://snapshots.polkachu.com/snapshots/osmosis/osmosis_12345678.tar.lz4",
            size: "25 GB",
            type: "pruned",
          },
        ],
        lastUpdated: "4 hours ago",
        rpcEndpoints: {
          primary: "https://rpc-osmosis.bryanlabs.net",
          secondary: "https://rpc2-osmosis.bryanlabs.net",
        },
        status: "active",
      },
      testnet: {
        chainId: "osmo-test-5",
        latestBlock: 8234567,
        snapshots: [
          {
            url: "https://snapshots.polkachu.com/testnet-snapshots/osmosis/osmosis_8234567.tar.lz4",
            size: "18 GB",
            type: "pruned",
          },
        ],
        lastUpdated: "3 hours ago",
        rpcEndpoints: {
          primary: "https://rpc-testnet-osmosis.bryanlabs.net",
          secondary: "https://rpc2-testnet-osmosis.bryanlabs.net",
        },
        status: "active",
      },
      archive: {
        chainId: "osmosis-1-archive",
        latestBlock: 12345678,
        snapshots: [
          {
            url: "https://snapshots.polkachu.com/snapshots/osmosis/osmosis_12345678_archive.tar.lz4",
            size: "1.8 TB",
            type: "archive",
          },
        ],
        lastUpdated: "8 hours ago",
        rpcEndpoints: {
          primary: "https://rpc-archive-osmosis.bryanlabs.net",
          secondary: "https://rpc2-archive-osmosis.bryanlabs.net",
        },
        status: "active",
      },
    },
  },
  terra: {
    id: "terra",
    name: "Terra 2.0",
    description:
      "The new Terra blockchain focused on building a decentralized economy with modern DeFi applications",
    binary: {
      name: "terrad",
      version: "v2.7.0",
      repository: "https://github.com/terra-money/core",
    },
    logo: "https://terra.money/img/logo.png",
    website: "https://terra.money",
    github: "https://github.com/terra-money/core",
    docs: "https://docs.terra.money",
    token: {
      symbol: "LUNA",
      denom: "uluna",
    },
    hardware: {
      minRam: "16 GB",
      recommendedRam: "32 GB",
      storagePruned: "300 GB SSD",
      storageArchive: "500 GB SSD",
      cpu: "6+ cores",
      network: "200 Mbps+",
    },
    features: ["LUNA", "Modern DeFi", "CosmWasm", "IBC"],
    networks: {
      mainnet: {
        chainId: "phoenix-1",
        latestBlock: 16333882,
        snapshots: [
          {
            url: "https://snapshots.polkachu.com/snapshots/terra/terra_16333882.tar.lz4",
            size: "9 GB",
            type: "pruned",
          },
        ],
        lastUpdated: "2 hours ago",
        rpcEndpoints: {
          primary: "https://terra-rpc.polkachu.com/",
        },
        status: "active",
      },
      testnet: {
        chainId: "pisco-1",
        latestBlock: 17443600,
        snapshots: [
          {
            url: "https://snapshots.polkachu.com/testnet-snapshots/terra/terra_17443600.tar.lz4",
            size: "3 GB",
            type: "pruned",
          },
        ],
        lastUpdated: "1 hour ago",
        rpcEndpoints: {
          primary: "https://rpc-testnet-terra.bryanlabs.net",
          secondary: "https://rpc2-testnet-terra.bryanlabs.net",
        },
        status: "active",
      },
    },
  },
  thorchain: {
    id: "thorchain",
    name: "THORChain",
    description:
      "Decentralized cross-chain liquidity protocol enabling native asset swaps across different blockchains",
    binary: {
      name: "thornode",
      version: "v1.132.0",
      repository: "https://github.com/thorchain/thornode",
    },
    logo: "https://thorchain.org/img/logo.png",
    website: "https://thorchain.org",
    github: "https://github.com/thorchain/thornode",
    docs: "https://docs.thorchain.org",
    token: {
      symbol: "RUNE",
      denom: "rune",
    },
    hardware: {
      minRam: "32 GB",
      recommendedRam: "64 GB",
      storagePruned: "800 GB SSD",
      storageArchive: "2 TB SSD",
      cpu: "8+ cores",
      network: "1 Gbps+",
    },
    features: [
      "Cross-chain Swaps",
      "Native Assets",
      "Liquidity Pools",
      "THORFi",
    ],
    networks: {
      mainnet: {
        chainId: "thorchain-1",
        latestBlock: 14567890,
        lastUpdated: "5 hours ago",
        rpcEndpoints: {
          primary: "https://rpc-thorchain.bryanlabs.net",
          secondary: "https://rpc2-thorchain.bryanlabs.net",
        },
        status: "active",
      },
      testnet: {
        chainId: "thorchain-testnet-v2",
        latestBlock: 9876543,
        lastUpdated: "4 hours ago",
        rpcEndpoints: {
          primary: "https://rpc-testnet-thorchain.bryanlabs.net",
          secondary: "https://rpc2-testnet-thorchain.bryanlabs.net",
        },
        status: "active",
      },
    },
  },
};

// Helper functions to transform data for different components

export function getAllChains(): ChainConfig[] {
  return Object.values(CHAINS_CONFIG);
}

export function getChainById(id: string): ChainConfig | undefined {
  return CHAINS_CONFIG[id];
}

// Get available network types for a chain
export function getAvailableNetworks(chainId: string): string[] {
  const chain = CHAINS_CONFIG[chainId];
  if (!chain) return [];

  return Object.keys(chain.networks).map(
    (network) => network.charAt(0).toUpperCase() + network.slice(1)
  );
}

// Get network data for a specific chain and network type
export function getNetworkData(
  chainId: string,
  networkType: string
): NetworkData | undefined {
  const chain = CHAINS_CONFIG[chainId];
  if (!chain) return undefined;

  const networkKey = networkType.toLowerCase() as keyof typeof chain.networks;
  return chain.networks[networkKey];
}

// Transform chain config to ChainSnapshot for home page cards (uses mainnet data)
export function toChainSnapshot(config: ChainConfig): ChainSnapshot {
  const mainnetData = config.networks.mainnet;
  if (!mainnetData) {
    throw new Error(`No mainnet data found for chain ${config.id}`);
  }

  return {
    name: config.name,
    network: mainnetData.chainId,
    latestBlock: mainnetData.latestBlock,
    size: mainnetData.snapshots?.[0]?.size ?? "N/A",
    prunedSize: mainnetData.snapshots?.[0]?.size ?? "N/A",
    updated: mainnetData.lastUpdated,
    nodeVersion: config.binary.version,
    minimumGasPrice: `0.001${config.token.denom}`,
    symbol: config.token.symbol,
    denom: config.token.denom,
    description: config.description,
    logo: config.logo,
    blockExplorerUrl: undefined,
    github: config.github,
    services: {
      rpc: true,
      api: true,
      grpc: false,
      stateSync: true,
      snapshot: true,
    },
    endpoints: {
      rpc: mainnetData.rpcEndpoints.primary,
      api: mainnetData.restEndpoints?.primary,
      grpc: undefined,
      stateSync: undefined,
      snapshot: mainnetData.snapshots?.[0]?.url,
    },
  };
}

// Get all chain snapshots for home page (uses mainnet data)
export function getAllChainSnapshots(): ChainSnapshot[] {
  return getAllChains()
    .filter((chain) => chain.networks.mainnet) // Only include chains with mainnet data
    .map(toChainSnapshot);
}

// Generate quick start commands for a chain with specific network
export function generateQuickStartCommands(
  chainId: string,
  binaryName: string,
  networkType: string = "mainnet"
) {
  const networkData = getNetworkData(chainId, networkType);
  const snapshotUrl = networkData?.snapshots?.[0]?.url;

  return {
    download: snapshotUrl
      ? `wget ${snapshotUrl}`
      : `# Download snapshot from your preferred provider`,
    extract: `tar -xzf latest.tar.gz`,
    stop: `sudo systemctl stop ${binaryName}`,
    backup: `cp -r ~/.${binaryName}/data ~/.${binaryName}/data_backup`,
    restore: `rm -rf ~/.${binaryName}/data && mv data ~/.${binaryName}/`,
    start: `sudo systemctl start ${binaryName}`,
    verify: `${binaryName} status 2>&1 | jq .SyncInfo`,
    cleanup: `rm -f latest.tar.gz`,
  };
}

// Network options available (dynamically determined per chain)
export const NETWORK_OPTIONS = ["Mainnet", "Testnet", "Archive"] as const;

// Global statistics for hero section
export const GLOBAL_STATS = {
  totalChains: getAllChains().length,
  updateFrequency: "Daily",
} as const;
