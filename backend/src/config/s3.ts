import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env';

const isConfigured = !!(
  env.AWS_ACCESS_KEY_ID &&
  env.AWS_SECRET_ACCESS_KEY &&
  env.AWS_REGION &&
  env.AWS_S3_RECORDINGS_BUCKET
);

if (!isConfigured) {
  console.warn('AWS S3 not configured — recording uploads will run in dev mode (skipped)');
}

export const s3Client = isConfigured
  ? new S3Client({
      region: env.AWS_REGION!,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  : null;

export const s3Bucket = env.AWS_S3_RECORDINGS_BUCKET || '';
export const isS3Configured = isConfigured;
