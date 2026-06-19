import {
  getCanonicalChainId,
  getSnapshotStorageVariant,
  getStorageChainIdsForChain,
} from '@/lib/config/chains';

describe('snapshot storage variants', () => {
  it('maps the Pebble storage directory back to the Cosmos Hub chain', () => {
    expect(getCanonicalChainId('cosmoshub-4-pebble')).toBe('cosmoshub-4');
    expect(getSnapshotStorageVariant('cosmoshub-4-pebble')).toMatchObject({
      storageChainId: 'cosmoshub-4-pebble',
      chainId: 'cosmoshub-4',
      databaseBackend: 'pebbledb',
      databaseLabel: 'PebbleDB',
    });
  });

  it('returns both storage directories for Cosmos Hub snapshots', () => {
    expect(getStorageChainIdsForChain('cosmoshub-4')).toEqual([
      'cosmoshub-4',
      'cosmoshub-4-pebble',
    ]);
  });

  it('maps the Provider Pebble storage directory back to the Provider chain', () => {
    expect(getCanonicalChainId('provider-pebble')).toBe('provider');
    expect(getSnapshotStorageVariant('provider-pebble')).toMatchObject({
      storageChainId: 'provider-pebble',
      chainId: 'provider',
      databaseBackend: 'pebbledb',
      databaseLabel: 'PebbleDB',
    });
  });

  it('returns both storage directories for Provider snapshots', () => {
    expect(getStorageChainIdsForChain('provider')).toEqual([
      'provider',
      'provider-pebble',
    ]);
  });
});
