/**
 * Centralized chain configuration
 * Single source of truth for all chain metadata across the application
 */

export interface ChainConfig {
  id: string;
  name: string;
  logoUrl: string;
  bannerUrl?: string; // Optional banner image for chain detail pages
  accentColor: string;
  description?: string;
  website?: string;
  explorer?: string;
  rpcEndpoint?: string;
  features?: string[];
}

/**
 * Master chain configuration registry
 * This is the SINGLE SOURCE OF TRUTH for all chain metadata
 * Any component needing chain info should import from here
 */
export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  'cosmoshub-4': {
    id: 'cosmoshub-4',
    name: 'Cosmos Hub',
    logoUrl: '/chains/cosmos.png',
    bannerUrl: '/chains/banners/cosmos-banner.jpg', // Placeholder for future banner
    accentColor: '#5E72E4',
    description: 'The Internet of Blockchains',
    website: 'https://cosmos.network',
    explorer: 'https://www.mintscan.io/cosmos',
  },
  'provider': {
    id: 'provider',
    name: 'Cosmos Hub Testnet',
    logoUrl: '/chains/cosmos.png',
    bannerUrl: '/chains/banners/cosmos-banner.jpg',
    accentColor: '#5E72E4',
    description: 'The public Cosmos Hub provider testnet',
    website: 'https://github.com/cosmos/testnets/tree/master/provider',
    explorer: 'https://explorer.polypore.xyz/provider/',
  },
  'juno-1': {
    id: 'juno-1',
    name: 'Juno',
    logoUrl: '/chains/juno.png',
    bannerUrl: '/chains/banners/juno-banner.jpg', // Placeholder for future banner
    accentColor: '#F0827D',
    description: 'Open source platform for interoperable smart contracts',
    website: 'https://junonetwork.io',
    explorer: 'https://www.mintscan.io/juno',
  },
  'kaiyo-1': {
    id: 'kaiyo-1',
    name: 'Kujira',
    logoUrl: '/chains/kujira.png',
    bannerUrl: '/chains/banners/kujira-banner.jpg', // Placeholder for future banner
    accentColor: '#DC3545',
    description: 'DeFi platform for everyone',
    website: 'https://kujira.network',
    explorer: 'https://finder.kujira.network',
  },
  'columbus-5': {
    id: 'columbus-5',
    name: 'Terra Classic',
    logoUrl: '/chains/terra.png',
    bannerUrl: '/chains/banners/terra-classic-banner.jpg', // Placeholder for future banner
    accentColor: '#FF6B6B',
    description: 'The original Terra blockchain',
    website: 'https://terra.money',
    explorer: 'https://finder.terra.money/classic',
  },
  'phoenix-1': {
    id: 'phoenix-1',
    name: 'Terra',
    logoUrl: '/chains/terra2.png',
    bannerUrl: '/chains/banners/terra-banner.jpg', // Placeholder for future banner
    accentColor: '#FF6B6B',
    description: 'Terra 2.0 - A new beginning',
    website: 'https://terra.money',
    explorer: 'https://finder.terra.money',
  },
  'thorchain-1': {
    id: 'thorchain-1',
    name: 'THORChain',
    logoUrl: '/chains/thorchain.png',
    bannerUrl: '/chains/banners/thorchain-banner.jpg', // Placeholder for future banner
    accentColor: '#00D4AA',
    description: 'Decentralized liquidity protocol',
    website: 'https://thorchain.org',
    explorer: 'https://thorchain.net',
  },
  'agoric-3': {
    id: 'agoric-3',
    name: 'Agoric',
    logoUrl: '/chains/agoric.png',
    bannerUrl: '/chains/banners/agoric-banner.jpg', // Placeholder for future banner
    accentColor: '#DB2777',
    description: 'JavaScript smart contracts',
    website: 'https://agoric.com',
    explorer: 'https://bigdipper.live/agoric',
  },
  'dydx-mainnet-1': {
    id: 'dydx-mainnet-1',
    name: 'dYdX',
    logoUrl: '/chains/dydx.png',
    bannerUrl: '/chains/banners/dydx-banner.jpg', // Placeholder for future banner
    accentColor: '#6966FF',
    description: 'Decentralized perpetuals exchange',
    website: 'https://dydx.exchange',
    explorer: 'https://www.mintscan.io/dydx',
    features: ['Trading', 'Perpetuals', 'DeFi'],
  },
  'neutron-1': {
    id: 'neutron-1',
    name: 'Neutron',
    logoUrl: '/chains/neutron.png',
    bannerUrl: '/chains/banners/neutron-banner.jpg', // Placeholder for future banner
    accentColor: '#00D4FF',
    description: 'The smartest platform in Cosmos',
    website: 'https://neutron.org',
    explorer: 'https://www.mintscan.io/neutron',
    features: ['Smart Contracts', 'CosmWasm', 'Interchain'],
  },
  'pryzm-1': {
    id: 'pryzm-1',
    name: 'Pryzm',
    logoUrl: '/chains/pryzm.png',
    bannerUrl: '/chains/banners/pryzm-banner.jpg', // Placeholder for future banner
    accentColor: '#FF00FF',
    description: 'Yield tokenization and trading',
    website: 'https://pryzm.zone',
    explorer: 'https://www.mintscan.io/pryzm',
    features: ['Yield', 'LSD', 'DeFi'],
  },
};

export interface SnapshotStorageVariant {
  storageChainId: string;
  chainId: string;
  databaseBackend: 'goleveldb' | 'pebbledb';
  databaseLabel: string;
}

export const SNAPSHOT_STORAGE_VARIANTS: Record<string, SnapshotStorageVariant> = {
  'cosmoshub-4': {
    storageChainId: 'cosmoshub-4',
    chainId: 'cosmoshub-4',
    databaseBackend: 'goleveldb',
    databaseLabel: 'LevelDB',
  },
  'cosmoshub-4-pebble': {
    storageChainId: 'cosmoshub-4-pebble',
    chainId: 'cosmoshub-4',
    databaseBackend: 'pebbledb',
    databaseLabel: 'PebbleDB',
  },
  'provider': {
    storageChainId: 'provider',
    chainId: 'provider',
    databaseBackend: 'goleveldb',
    databaseLabel: 'LevelDB',
  },
  'provider-pebble': {
    storageChainId: 'provider-pebble',
    chainId: 'provider',
    databaseBackend: 'pebbledb',
    databaseLabel: 'PebbleDB',
  },
};

export function getSnapshotStorageVariant(storageChainId: string): SnapshotStorageVariant {
  return SNAPSHOT_STORAGE_VARIANTS[storageChainId] || {
    storageChainId,
    chainId: storageChainId,
    databaseBackend: 'goleveldb',
    databaseLabel: 'LevelDB',
  };
}

export function getCanonicalChainId(storageChainId: string): string {
  return getSnapshotStorageVariant(storageChainId).chainId;
}

export function getStorageChainIdsForChain(chainId: string): string[] {
  const canonicalChainId = getCanonicalChainId(chainId);
  const storageChainIds = Object.values(SNAPSHOT_STORAGE_VARIANTS)
    .filter((variant) => variant.chainId === canonicalChainId)
    .map((variant) => variant.storageChainId);

  return storageChainIds.length > 0 ? storageChainIds : [canonicalChainId];
}

export function isSnapshotStorageConfigured(storageChainId: string): boolean {
  return storageChainId in SNAPSHOT_STORAGE_VARIANTS;
}

export function isSnapshotChainConfigured(chainId: string): boolean {
  const canonicalChainId = getCanonicalChainId(chainId);
  return Object.values(SNAPSHOT_STORAGE_VARIANTS)
    .some((variant) => variant.chainId === canonicalChainId);
}

/**
 * Get chain configuration by ID
 * Returns a default configuration if chain not found
 */
export function getChainConfig(chainId: string): ChainConfig {
  return CHAIN_CONFIGS[chainId] || {
    id: chainId,
    name: chainId,
    logoUrl: '/chains/placeholder.svg',
    accentColor: '#3B82F6', // Default blue
    description: `Blockchain network ${chainId}`,
  };
}

/**
 * Get all configured chains
 */
export function getAllChains(): ChainConfig[] {
  return Object.values(CHAIN_CONFIGS);
}

/**
 * Check if a chain is configured
 */
export function isChainConfigured(chainId: string): boolean {
  return chainId in CHAIN_CONFIGS;
}

/**
 * Get chain logo URL with fallback
 */
export function getChainLogoUrl(chainId: string): string {
  return getChainConfig(chainId).logoUrl;
}

/**
 * Get chain banner URL if available
 */
export function getChainBannerUrl(chainId: string): string | undefined {
  return getChainConfig(chainId).bannerUrl;
}

/**
 * Get chain accent color
 */
export function getChainAccentColor(chainId: string): string {
  return getChainConfig(chainId).accentColor;
}
