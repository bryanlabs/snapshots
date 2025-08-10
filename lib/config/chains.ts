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
  'noble-1': {
    id: 'noble-1',
    name: 'Noble',
    logoUrl: '/chains/noble.png',
    bannerUrl: '/chains/banners/noble-banner.jpg', // Placeholder for future banner
    accentColor: '#FFB800',
    description: 'Native asset issuance chain for the Cosmos ecosystem',
    website: 'https://nobleassets.xyz',
    explorer: 'https://www.mintscan.io/noble',
  },
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
  'osmosis-1': {
    id: 'osmosis-1',
    name: 'Osmosis',
    logoUrl: '/chains/osmosis.png',
    bannerUrl: '/chains/banners/osmosis-banner.jpg', // Placeholder for future banner
    accentColor: '#9945FF',
    description: 'The largest DEX in the Cosmos ecosystem',
    website: 'https://osmosis.zone',
    explorer: 'https://www.mintscan.io/osmosis',
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