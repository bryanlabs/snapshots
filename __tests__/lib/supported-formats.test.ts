import { extractHeightFromFilename } from '@/lib/config/supported-formats';

describe('extractHeightFromFilename', () => {
  it('extracts block heights from height-named snapshots', () => {
    expect(extractHeightFromFilename('cosmoshub-4-31540494.tar.zst')).toBe(31540494);
    expect(extractHeightFromFilename('cosmoshub-4-31540494-20260612-190333.tar.zst')).toBe(31540494);
    expect(extractHeightFromFilename('cosmoshub-4-pebble-31540494-20260612-190333.tar.zst')).toBe(31540494);
    expect(extractHeightFromFilename('cosmoshub-4-20260612-190333-31540494.tar.zst')).toBe(31540494);
    expect(extractHeightFromFilename('snapshot-12345678.zip')).toBe(12345678);
  });

  it('does not treat timestamped processor filenames as block heights', () => {
    expect(extractHeightFromFilename('cosmoshub-4-20260612-040731.tar.zst')).toBeNull();
    expect(extractHeightFromFilename('cosmoshub-4-pebble-20260612-083000.tar.zst')).toBeNull();
  });
});
