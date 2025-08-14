export const config = {
  minio: {
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucketName: process.env.MINIO_BUCKET_NAME || 'snapshots',
    // External endpoint for presigned URLs
    externalEndPoint: process.env.MINIO_EXTERNAL_ENDPOINT || process.env.MINIO_ENDPOINT || 'localhost',
    externalPort: parseInt(process.env.MINIO_EXTERNAL_PORT || process.env.MINIO_PORT || '9000'),
    externalUseSSL: process.env.MINIO_EXTERNAL_USE_SSL === 'true',
  },
  auth: {
    cookieName: 'snapshot-session',
    password: process.env.SESSION_PASSWORD!,
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    },
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },
  features: {
    showEmptyChains: process.env.SHOW_EMPTY_CHAINS === 'true',
  },
};