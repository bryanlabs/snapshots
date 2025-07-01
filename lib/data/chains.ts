import { ChainSnapshot } from "@/components/ui/SnapshotCard";
import { SnapshotOption } from "@/components/ui/SnapshotTable";

// Network-specific data interface
export interface NetworkData {
  chainId: string;
  latestBlock: number;
  sizes: {
    full: string;
    pruned: string;
    archive: string;
    stateSync: string;
  };
  lastUpdated: string;
  rpcEndpoints: {
    primary: string;
    secondary: string;
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
        sizes: {
          full: "145 GB",
          pruned: "23 GB",
          archive: "478 GB",
          stateSync: "2.1 GB",
        },
        lastUpdated: "2 hours ago",
        rpcEndpoints: {
          primary: "https://rpc-cosmoshub.bryanlabs.net",
          secondary: "https://rpc2-cosmoshub.bryanlabs.net",
        },
        status: "active",
      },
      testnet: {
        chainId: "theta-testnet-001",
        latestBlock: 15234892,
        sizes: {
          full: "89 GB",
          pruned: "14 GB",
          archive: "234 GB",
          stateSync: "1.2 GB",
        },
        lastUpdated: "1 hour ago",
        rpcEndpoints: {
          primary: "https://rpc-testnet-cosmoshub.bryanlabs.net",
          secondary: "https://rpc2-testnet-cosmoshub.bryanlabs.net",
        },
        status: "active",
      },
      archive: {
        chainId: "cosmoshub-4-archive",
        latestBlock: 18234567,
        sizes: {
          full: "1.2 TB",
          pruned: "145 GB",
          archive: "2.1 TB",
          stateSync: "2.1 GB",
        },
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
        latestBlock: 8765432,
        sizes: {
          full: "12 GB",
          pruned: "2.1 GB",
          archive: "28 GB",
          stateSync: "0.5 GB",
        },
        lastUpdated: "1 hour ago",
        rpcEndpoints: {
          primary: "https://rpc-noble.bryanlabs.net",
          secondary: "https://rpc2-noble.bryanlabs.net",
        },
        status: "active",
      },
      testnet: {
        chainId: "grand-1",
        latestBlock: 5432987,
        sizes: {
          full: "8.2 GB",
          pruned: "1.4 GB",
          archive: "18 GB",
          stateSync: "0.3 GB",
        },
        lastUpdated: "45 minutes ago",
        rpcEndpoints: {
          primary: "https://rpc-testnet-noble.bryanlabs.net",
          secondary: "https://rpc2-testnet-noble.bryanlabs.net",
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
        latestBlock: 9234567,
        sizes: {
          full: "34 GB",
          pruned: "6.2 GB",
          archive: "78 GB",
          stateSync: "1.1 GB",
        },
        lastUpdated: "3 hours ago",
        rpcEndpoints: {
          primary: "https://rpc-kujira.bryanlabs.net",
          secondary: "https://rpc2-kujira.bryanlabs.net",
        },
        status: "active",
      },
      testnet: {
        chainId: "harpoon-4",
        latestBlock: 6789234,
        sizes: {
          full: "21 GB",
          pruned: "3.8 GB",
          archive: "45 GB",
          stateSync: "0.7 GB",
        },
        lastUpdated: "2 hours ago",
        rpcEndpoints: {
          primary: "https://rpc-testnet-kujira.bryanlabs.net",
          secondary: "https://rpc2-testnet-kujira.bryanlabs.net",
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
        sizes: {
          full: "189 GB",
          pruned: "25 GB",
          archive: "487 GB",
          stateSync: "2.8 GB",
        },
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
        sizes: {
          full: "123 GB",
          pruned: "18 GB",
          archive: "298 GB",
          stateSync: "1.9 GB",
        },
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
        sizes: {
          full: "890 GB",
          pruned: "189 GB",
          archive: "1.8 TB",
          stateSync: "2.8 GB",
        },
        lastUpdated: "8 hours ago",
        rpcEndpoints: {
          primary: "https://rpc-archive-osmosis.bryanlabs.net",
          secondary: "https://rpc2-archive-osmosis.bryanlabs.net",
        },
        status: "active",
      },
    },
  },

  "terra-classic": {
    id: "terra-classic",
    name: "Terra Classic",
    description:
      "The original Terra blockchain continuing as Terra Classic with community governance and development",
    binary: {
      name: "terrad",
      version: "v2.4.0",
      repository: "https://github.com/classic-terra/core",
    },
    logo: "https://terraclassic.community/img/logo.png",
    website: "https://terraclassic.community",
    github: "https://github.com/classic-terra/core",
    docs: "https://docs.terraclassic.community",
    hardware: {
      minRam: "32 GB",
      recommendedRam: "64 GB",
      storagePruned: "1 TB SSD",
      storageArchive: "3 TB SSD",
      cpu: "8+ cores",
      network: "500 Mbps+",
    },
    features: ["LUNC", "USTC", "Community Governance", "Classic DeFi"],
    networks: {
      mainnet: {
        chainId: "columbus-5",
        latestBlock: 15678901,
        sizes: {
          full: "423 GB",
          pruned: "67 GB",
          archive: "1.2 TB",
          stateSync: "4.1 GB",
        },
        lastUpdated: "6 hours ago",
        rpcEndpoints: {
          primary: "https://rpc-terra-classic.bryanlabs.net",
          secondary: "https://rpc2-terra-classic.bryanlabs.net",
        },
        status: "active",
      },
      testnet: {
        chainId: "bombay-12",
        latestBlock: 8901234,
        sizes: {
          full: "234 GB",
          pruned: "38 GB",
          archive: "567 GB",
          stateSync: "2.1 GB",
        },
        lastUpdated: "4 hours ago",
        rpcEndpoints: {
          primary: "https://rpc-testnet-terra-classic.bryanlabs.net",
          secondary: "https://rpc2-testnet-terra-classic.bryanlabs.net",
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
        latestBlock: 7856432,
        sizes: {
          full: "45 GB",
          pruned: "8.3 GB",
          archive: "98 GB",
          stateSync: "1.4 GB",
        },
        lastUpdated: "2 hours ago",
        rpcEndpoints: {
          primary: "https://rpc-terra.bryanlabs.net",
          secondary: "https://rpc2-terra.bryanlabs.net",
        },
        status: "active",
      },
      testnet: {
        chainId: "pisco-1",
        latestBlock: 4567890,
        sizes: {
          full: "28 GB",
          pruned: "5.1 GB",
          archive: "62 GB",
          stateSync: "0.9 GB",
        },
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
        sizes: {
          full: "234 GB",
          pruned: "42 GB",
          archive: "678 GB",
          stateSync: "3.2 GB",
        },
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
        sizes: {
          full: "145 GB",
          pruned: "26 GB",
          archive: "398 GB",
          stateSync: "2.1 GB",
        },
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
    size: mainnetData.sizes.full,
    prunedSize: mainnetData.sizes.pruned,
    updated: mainnetData.lastUpdated,
  };
}

// Transform network data to snapshot options for detail page table
export function toSnapshotOptions(
  config: ChainConfig,
  networkType: string = "mainnet"
): SnapshotOption[] {
  const networkKey = networkType.toLowerCase() as keyof typeof config.networks;
  const networkData = config.networks[networkKey];

  if (!networkData) {
    return [];
  }

  const baseBlock = networkData.latestBlock;

  return [
    {
      type: "Latest",
      blockHeight: baseBlock,
      size: networkData.sizes.full,
      lastUpdated: networkData.lastUpdated,
      description: "Full node with complete transaction history",
    },
    {
      type: "Pruned",
      blockHeight: baseBlock,
      size: networkData.sizes.pruned,
      lastUpdated: networkData.lastUpdated,
      description: "Pruned node with recent blocks only",
    },
    {
      type: "Archive",
      blockHeight: baseBlock - 50000, // Archive is slightly behind
      size: networkData.sizes.archive,
      lastUpdated: "2 days ago",
      description: "Complete historical data archive",
    },
    {
      type: "State Sync",
      blockHeight: baseBlock - 1000, // State sync is recent but not latest
      size: networkData.sizes.stateSync,
      lastUpdated: "3 hours ago",
      description: "Minimal snapshot for state sync",
    },
  ];
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
  const networkSuffix = networkType === "mainnet" ? "" : `-${networkType}`;

  return {
    download: `wget https://snapshots.bryanlabs.net/${chainId}${networkSuffix}/latest.tar.gz`,
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
  uptime: "99.9%",
} as const;
