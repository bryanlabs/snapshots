/**
 * Supported archive and compression formats for snapshots
 */

// Archive formats (container formats)
export const ARCHIVE_FORMATS = ['tar', 'zip', '7z'] as const;
export type ArchiveFormat = typeof ARCHIVE_FORMATS[number];

// Compression formats (can be applied to archives)
export const COMPRESSION_FORMATS = ['zst', 'lz4', 'gz', 'bz2', 'xz', 'none'] as const;
export type CompressionFormat = typeof COMPRESSION_FORMATS[number];

// Common file extension patterns
// Format: archive.compression or just archive for uncompressed
export const SNAPSHOT_PATTERNS = [
  // Tar archives with various compressions
  '.tar',          // Uncompressed tar
  '.tar.zst',      // Zstandard compressed tar
  '.tar.lz4',      // LZ4 compressed tar
  '.tar.gz',       // Gzip compressed tar
  '.tgz',          // Alternative gzip tar extension
  '.tar.bz2',      // Bzip2 compressed tar
  '.tbz2',         // Alternative bzip2 tar extension
  '.tar.xz',       // XZ compressed tar
  '.txz',          // Alternative XZ tar extension
  
  // Zip archives (inherently compressed)
  '.zip',
  
  // 7-Zip archives
  '.7z',
] as const;

/**
 * Check if a filename matches any supported snapshot format
 */
export function isValidSnapshotFile(filename: string): boolean {
  return SNAPSHOT_PATTERNS.some(pattern => filename.endsWith(pattern));
}

/**
 * Extract compression type from filename
 */
export function getCompressionType(filename: string): CompressionFormat {
  // Check each compression format
  if (filename.endsWith('.tar.zst') || filename.endsWith('.zst')) return 'zst';
  if (filename.endsWith('.tar.lz4') || filename.endsWith('.lz4')) return 'lz4';
  if (filename.endsWith('.tar.gz') || filename.endsWith('.tgz') || filename.endsWith('.gz')) return 'gz';
  if (filename.endsWith('.tar.bz2') || filename.endsWith('.tbz2') || filename.endsWith('.bz2')) return 'bz2';
  if (filename.endsWith('.tar.xz') || filename.endsWith('.txz') || filename.endsWith('.xz')) return 'xz';
  
  // Zip and 7z have built-in compression
  if (filename.endsWith('.zip') || filename.endsWith('.7z')) return 'lz4'; // Default to lz4-like compression
  
  // Plain tar or unknown
  if (filename.endsWith('.tar')) return 'none';
  
  return 'none';
}

/**
 * Extract archive format from filename
 */
export function getArchiveFormat(filename: string): ArchiveFormat | null {
  if (filename.includes('.tar') || filename.endsWith('.tgz') || filename.endsWith('.tbz2') || filename.endsWith('.txz')) {
    return 'tar';
  }
  if (filename.endsWith('.zip')) return 'zip';
  if (filename.endsWith('.7z')) return '7z';
  
  return null;
}

/**
 * Extract block height from snapshot filename
 * Supports formats like: chain-name-12345678.tar.zst, snapshot-12345678.zip, etc.
 */
export function extractHeightFromFilename(filename: string): number | null {
  // Remove file extensions to get to the height
  let baseName = filename;
  
  // Remove known extensions
  SNAPSHOT_PATTERNS.forEach(pattern => {
    if (baseName.endsWith(pattern)) {
      baseName = baseName.slice(0, -pattern.length);
    }
  });
  
  // Try to extract height - usually the last numeric segment
  const heightMatch = baseName.match(/(\d{6,})$/); // At least 6 digits for a block height
  
  if (heightMatch) {
    return parseInt(heightMatch[1], 10);
  }
  
  return null;
}

/**
 * Get estimated compression ratio for quick size calculations
 */
export function getEstimatedCompressionRatio(compressionType: CompressionFormat): number {
  switch (compressionType) {
    case 'zst':
      return 0.30; // 70% compression
    case 'lz4':
      return 0.40; // 60% compression
    case 'gz':
      return 0.35; // 65% compression
    case 'bz2':
      return 0.25; // 75% compression (slower but better)
    case 'xz':
      return 0.22; // 78% compression (best compression)
    case 'none':
      return 1.0;  // No compression
    default:
      return 0.40; // Default assumption
  }
}