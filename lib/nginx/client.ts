import { createHash } from 'crypto';
import { config } from '../config';

export interface NginxSnapshot {
  name: string;
  size: number;
  mtime: string;
  type: 'file' | 'directory';
}

/**
 * Generate a secure link URL for nginx
 * Based on nginx secure_link module with MD5 hash
 */
export function generateSecureLink(
  path: string,
  tier: 'free' | 'premium' | 'unlimited' = 'free',
  expiryHours: number = 12
): string {
  const secret = process.env.SECURE_LINK_SECRET;
  if (!secret) {
    throw new Error('SECURE_LINK_SECRET environment variable is required');
  }
  const expiryTime = Math.floor(Date.now() / 1000) + (expiryHours * 3600);
  
  // Create the hash: MD5(secret + uri + expires + tier)
  const uri = `/snapshots${path}`;
  const hashString = `${secret}${uri}${expiryTime}${tier}`;
  const md5 = createHash('md5').update(hashString).digest('base64url');
  
  // Build the secure URL
  const baseUrl = process.env.NGINX_EXTERNAL_URL || 'https://snapshots.bryanlabs.net';
  return `${baseUrl}${uri}?md5=${md5}&expires=${expiryTime}&tier=${tier}`;
}

/**
 * List objects in a directory using nginx autoindex
 */
export async function listObjects(prefix: string): Promise<NginxSnapshot[]> {
  const endpoint = process.env.NGINX_ENDPOINT || 'nginx';
  const port = process.env.NGINX_PORT || '32708';
  const useSSL = process.env.NGINX_USE_SSL === 'true';
  
  const protocol = useSSL ? 'https' : 'http';
  const url = `${protocol}://${endpoint}:${port}/snapshots/${prefix}/`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      throw new Error(`Failed to list objects: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // nginx autoindex returns array of objects with name, type, mtime, size
    return data.map((item: any) => ({
      name: item.name,
      size: item.size || 0,
      mtime: item.mtime,
      type: item.type === 'directory' ? 'directory' : 'file'
    }));
  } catch (error) {
    console.error('Error listing objects:', error);
    return [];
  }
}

/**
 * List all chains (top-level directories)
 */
export async function listChains(): Promise<string[]> {
  const objects = await listObjects('');
  return objects
    .filter(obj => obj.type === 'directory')
    .map(obj => obj.name.replace(/\/$/, ''));
}

/**
 * Check if a file exists by trying to get its metadata
 */
export async function objectExists(path: string): Promise<boolean> {
  const endpoint = process.env.NGINX_ENDPOINT || 'nginx';
  const port = process.env.NGINX_PORT || '32708';
  const useSSL = process.env.NGINX_USE_SSL === 'true';
  
  const protocol = useSSL ? 'https' : 'http';
  const url = `${protocol}://${endpoint}:${port}/snapshots${path}`;
  
  try {
    const response = await fetch(url, {
      method: 'HEAD'
    });
    return response.ok;
  } catch {
    return false;
  }
}