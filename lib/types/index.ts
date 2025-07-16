export interface Chain {
  id: string;
  name: string;
  network: string;
  description?: string;
  logoUrl?: string;
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
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user';
  tier?: 'free' | 'premium';
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