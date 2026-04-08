import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, s3Bucket, isS3Configured } from '../../config/s3';
import { ApiError } from './apiError';

/**
 * Per-content-type upload rules: allowed extensions, max size, and MIME type mapping.
 *
 * Used by all upload pipelines (assessment docs, profile photos, intro videos,
 * tutor certifications, course materials) to validate the client's claim
 * before generating a presigned URL.
 *
 * NOTE: This is client-claim validation only. The browser uploads directly to S3
 * via the presigned URL — the backend never sees the actual file bytes. A malicious
 * client could lie about size/type. For honest users this is sufficient.
 * S3-side enforcement (bucket policy) and virus scanning are deferred.
 */

export type UploadCategory =
  | 'assessment'
  | 'profile-photo'
  | 'intro-video'
  | 'certification'
  | 'course-material';

interface UploadConfig {
  /** Maximum file size in KB */
  maxSizeKb: number;
  /** Allowed file extensions (lowercase, without leading dot) */
  allowedExtensions: readonly string[];
  /** Map of extension → MIME type to set as Content-Type on the S3 object */
  mimeTypes: Record<string, string>;
}

export const UPLOAD_CONFIGS: Record<UploadCategory, UploadConfig> = {
  'profile-photo': {
    maxSizeKb: 5 * 1024, // 5 MB
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    mimeTypes: {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
    },
  },
  'intro-video': {
    maxSizeKb: 100 * 1024, // 100 MB
    allowedExtensions: ['mp4', 'webm', 'mov'],
    mimeTypes: {
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
    },
  },
  certification: {
    maxSizeKb: 10 * 1024, // 10 MB
    allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
    mimeTypes: {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
    },
  },
  'course-material': {
    maxSizeKb: 50 * 1024, // 50 MB
    allowedExtensions: ['pdf', 'docx', 'pptx', 'xlsx', 'mp4'],
    mimeTypes: {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      mp4: 'video/mp4',
    },
  },
  assessment: {
    maxSizeKb: 50 * 1024, // 50 MB (same as course materials — covers PDF/docx/etc.)
    allowedExtensions: ['pdf', 'docx', 'pptx', 'xlsx', 'jpg', 'jpeg', 'png'],
    mimeTypes: {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
    },
  },
};

/**
 * Validate that the client's claimed fileType + fileSizeKb fit the rules
 * for the given category. Throws ApiError on violation.
 */
export function validateUploadClaim(
  category: UploadCategory,
  fileType: string,
  fileSizeKb: number
): void {
  const config = UPLOAD_CONFIGS[category];
  const ext = fileType.toLowerCase();

  if (!config.allowedExtensions.includes(ext)) {
    throw ApiError.badRequest(
      'INVALID_FILE_TYPE',
      `File type "${fileType}" not allowed. Allowed: ${config.allowedExtensions.join(', ')}`
    );
  }

  if (fileSizeKb < 1) {
    throw ApiError.badRequest('INVALID_FILE_SIZE', 'File size must be at least 1 KB');
  }

  if (fileSizeKb > config.maxSizeKb) {
    const maxMb = (config.maxSizeKb / 1024).toFixed(0);
    throw ApiError.badRequest(
      'FILE_TOO_LARGE',
      `File too large (${(fileSizeKb / 1024).toFixed(1)} MB). Max allowed: ${maxMb} MB`
    );
  }
}

/**
 * Generate a presigned PUT URL for uploading a file directly to S3.
 *
 * @param key - The S3 object key (e.g. "profile-photos/<tutorId>/<uuid>.jpg")
 * @param contentType - MIME type for the Content-Type header (e.g. "image/jpeg")
 * @param expiresIn - URL validity in seconds (default 3600 = 1 hour)
 * @returns The signed URL the client can PUT the file to
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  if (!isS3Configured || !s3Client) {
    throw ApiError.internal('S3 not configured');
  }

  const command = new PutObjectCommand({
    Bucket: s3Bucket,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Get the MIME type for a given category + extension. Falls back to
 * application/octet-stream if extension isn't recognized (shouldn't happen
 * if validateUploadClaim was called first).
 */
export function getMimeType(category: UploadCategory, fileType: string): string {
  const ext = fileType.toLowerCase();
  return UPLOAD_CONFIGS[category].mimeTypes[ext] ?? 'application/octet-stream';
}
