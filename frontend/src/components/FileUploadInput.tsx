import { useRef, useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { uploadFileViaPresignedUrl, type RequestSignedUrlFn } from '@/services/upload.service';

interface FileUploadInputProps {
  /** e.g. ".jpg,.jpeg,.png,.webp" — passed straight to <input accept> */
  accept: string;
  maxSizeMb: number;
  requestSignedUrl: RequestSignedUrlFn;
  onUploadComplete: (fileKey: string, file: File) => void;
  /** Optional label shown above the picker */
  label?: string;
  /** Optional helper text shown below */
  helperText?: string;
  /** Disabled state (e.g. while parent form is saving) */
  disabled?: boolean;
}

export function FileUploadInput({
  accept,
  maxSizeMb,
  requestSignedUrl,
  onUploadComplete,
  label,
  helperText,
  disabled = false,
}: FileUploadInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const allowedExts = accept
    .split(',')
    .map((s) => s.trim().replace(/^\./, '').toLowerCase());

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;

    setError(null);
    setDone(false);
    setUploadedFileName(null);

    // Client-side validation
    const ext = picked.name.split('.').pop()?.toLowerCase() ?? '';
    if (!allowedExts.includes(ext)) {
      setError(`File type .${ext} not allowed. Allowed: ${allowedExts.join(', ')}`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    const sizeMb = picked.size / (1024 * 1024);
    if (sizeMb > maxSizeMb) {
      setError(`File too large (${sizeMb.toFixed(1)} MB). Max ${maxSizeMb} MB.`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const { fileKey } = await uploadFileViaPresignedUrl(picked, requestSignedUrl, setProgress);
      setDone(true);
      setUploadedFileName(picked.name);
      onUploadComplete(fileKey, picked);
    } catch (err: any) {
      const backendMsg = err?.response?.data?.error?.message;
      const statusCode = err?.response?.status;
      let msg: string;
      if (backendMsg) {
        msg = backendMsg;
      } else if (statusCode === 500) {
        msg = 'Server error — please try again later.';
      } else if (statusCode === 403) {
        msg = 'Upload rejected — permission denied.';
      } else if (statusCode === 413) {
        msg = 'File too large for the server to accept.';
      } else if (err?.code === 'ERR_NETWORK') {
        msg = 'Network error — check your connection and try again.';
      } else {
        msg = 'Upload failed — please try again.';
      }
      setError(msg);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {label && <div className="text-sm font-medium">{label}</div>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handlePick}
        disabled={disabled || uploading}
        className="hidden"
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
      >
        <Upload className="w-4 h-4 mr-2" />
        {uploading ? 'Uploading...' : done ? 'Change file' : 'Choose file'}
      </Button>

      {uploading && <Progress value={progress} className="h-1.5" />}

      {done && uploadedFileName && (
        <div className="text-xs text-green-700">{uploadedFileName}</div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-xs text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {helperText && !error && !uploading && (
        <div className="text-xs text-muted-foreground">{helperText}</div>
      )}
    </div>
  );
}
