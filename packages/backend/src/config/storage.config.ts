import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  endpoint: process.env.MINIO_ENDPOINT || 'localhost:9000',
  accessKey: process.env.MINIO_ROOT_USER || 'minioadmin',
  secretKey: process.env.MINIO_ROOT_PASSWORD || 'minio_secret',
  bucket: process.env.MINIO_BUCKET || 'sdlc-uploads',
  useSsl: process.env.MINIO_USE_SSL === 'true',
}));
