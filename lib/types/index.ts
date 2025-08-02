export interface Chain {
  id: string;
  name: string;
  network: string;
  description?: string;
  logoUrl?: string;
  accentColor?: string;
  snapshots?: Snapshot[];
  snapshotCount?: number;
  latestSnapshot?: {
    size: number;
    lastModified: Date;
    compressionType: 'lz4' | 'zst' | 'none';
  };
}

export interface Snapshot {
  id: string;
  chainId: string;
  height: number;
  size: number;
  fileName: string;
  downloadUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  type: 'pruned' | 'archive' | 'default';
  compressionType: 'lz4' | 'zst' | 'none';
  // Tier-based access control
  generationCycle?: 'daily' | 'twice-daily' | 'six-hourly'; // Which schedule created this snapshot
  hourGenerated?: number; // UTC hour when snapshot was generated (0, 6, 12, 18)
  minimumTier?: 'free' | 'premium' | 'ultra'; // Minimum tier required to access
  isRestricted?: boolean; // Whether this snapshot has tier restrictions
  // Runtime access control (added by API)
  isAccessible?: boolean; // Whether current user can access this snapshot
  userTier?: string; // Current user's tier (for UI display)
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user';
  tier?: 'free' | 'premium' | 'ultra';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DownloadRequest {
  snapshotId: string;
  email?: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: boolean;
    minio: boolean;
  };
}