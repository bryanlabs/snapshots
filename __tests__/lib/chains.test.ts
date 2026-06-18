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

  it('maps the Noble Pebble storage directory back to the Noble chain', () => {
    expect(getCanonicalChainId('noble-1-pebble')).toBe('noble-1');
    expect(getSnapshotStorageVariant('noble-1-pebble')).toMatchObject({
      storageChainId: 'noble-1-pebble',
      chainId: 'noble-1',
      databaseBackend: 'pebbledb',
      databaseLabel: 'PebbleDB',
    });
  });

  it('returns both storage directories for Noble snapshots', () => {
    expect(getStorageChainIdsForChain('noble-1')).toEqual([
      'noble-1',
      'noble-1-pebble',
    ]);
  });

  it('maps the Osmosis Pebble storage directory back to the Osmosis chain', () => {
    expect(getCanonicalChainId('osmosis-1-pebble')).toBe('osmosis-1');
    expect(getSnapshotStorageVariant('osmosis-1-pebble')).toMatchObject({
      storageChainId: 'osmosis-1-pebble',
      chainId: 'osmosis-1',
      databaseBackend: 'pebbledb',
      databaseLabel: 'PebbleDB',
    });
  });

  it('returns both storage directories for Osmosis snapshots', () => {
    expect(getStorageChainIdsForChain('osmosis-1')).toEqual([
      'osmosis-1',
      'osmosis-1-pebble',
    ]);
  });
});
