import axios from 'axios';
import api from './api';

export interface PresignedUploadResponse {
  uploadUrl: string;
  fileKey: string;
  contentType: string;
}

export type RequestSignedUrlFn = (
  fileType: string,
  fileSizeKb: number
) => Promise<PresignedUploadResponse>;

/**
 * 3-step presigned upload flow:
 *   1. Ask backend for signed URL (caller provides per-pipeline endpoint)
 *   2. PUT file bytes directly to S3 with contentType
 *   3. Return fileKey so caller can save it via the appropriate save endpoint
 *
 * Uses bare axios for the S3 PUT — NOT the configured `api` instance —
 * otherwise the auth interceptor attaches an Authorization header and S3
 * rejects the signed URL.
 */
export async function uploadFileViaPresignedUrl(
  file: File,
  requestSignedUrl: RequestSignedUrlFn,
  onProgress?: (pct: number) => void
): Promise<{ fileKey: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const sizeKb = Math.ceil(file.size / 1024);

  const { uploadUrl, fileKey, contentType } = await requestSignedUrl(ext, sizeKb);

  await axios.put(uploadUrl, file, {
    headers: { 'Content-Type': contentType },
    onUploadProgress: (e) => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });

  return { fileKey };
}

// ==========================================
// Per-pipeline signed-URL request helpers
// ==========================================
// These are thin wrappers around the backend endpoints. They live here
// (not in tutor/course services) so the FileUploadInput component has a
// single import surface for all 5 pipelines.

export const uploadRequestors = {
  profilePhoto: async (fileType: string, fileSizeKb: number): Promise<PresignedUploadResponse> => {
    const { data } = await api.post('/tutors/profile/photo-upload-url', { fileType, fileSizeKb });
    return data.data;
  },

  introVideo: async (fileType: string, fileSizeKb: number): Promise<PresignedUploadResponse> => {
    const { data } = await api.post('/tutors/profile/intro-video-upload-url', { fileType, fileSizeKb });
    return data.data;
  },

  certification: async (fileType: string, fileSizeKb: number): Promise<PresignedUploadResponse> => {
    const { data } = await api.post('/tutors/certifications/upload-url', { fileType, fileSizeKb });
    return data.data;
  },

  tutorCourseMaterial: (courseId: string): RequestSignedUrlFn => async (fileType, fileSizeKb) => {
    const { data } = await api.post(`/tutors/courses/${courseId}/materials/upload-url`, { fileType, fileSizeKb });
    return data.data;
  },

  adminCourseMaterial: (courseId: string): RequestSignedUrlFn => async (fileType, fileSizeKb) => {
    const { data } = await api.post(`/admin/courses/${courseId}/materials/upload-url`, { fileType, fileSizeKb });
    return data.data;
  },
};
