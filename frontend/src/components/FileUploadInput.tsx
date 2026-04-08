import { useRef, useState } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
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
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);

  const allowedExts = accept
    .split(',')
    .map((s) => s.trim().replace(/^\./, '').toLowerCase());

  const reset = () => {
    setFile(null);
    setUploading(false);
    setProgress(0);
    setError(null);
    setUploadedKey(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;

    setError(null);
    setUploadedKey(null);

    // Client-side validation (matches backend rules for instant feedback)
    const ext = picked.name.split('.').pop()?.toLowerCase() ?? '';
    if (!allowedExts.includes(ext)) {
      setError(`File type .${ext} not allowed. Allowed: ${allowedExts.join(', ')}`);
      setFile(null);
      return;
    }
    const sizeMb = picked.size / (1024 * 1024);
    if (sizeMb > maxSizeMb) {
      setError(`File too large (${sizeMb.toFixed(1)} MB). Max ${maxSizeMb} MB.`);
      setFile(null);
      return;
    }

    setFile(picked);
    setUploading(true);
    setProgress(0);

    try {
      const { fileKey } = await uploadFileViaPresignedUrl(picked, requestSignedUrl, setProgress);
      setUploadedKey(fileKey);
      onUploadComplete(fileKey, picked);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || 'Upload failed';
      setError(msg);
      setFile(null);
    } finally {
      setUploading(false);
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

      {!file && !uploadedKey && (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          Choose file
        </Button>
      )}

      {file && (
        <div className="border rounded-md p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {uploading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
              {uploadedKey && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
              <span className="text-sm truncate">{file.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
            {!uploading && (
              <Button type="button" variant="ghost" size="sm" onClick={reset}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          {uploading && <Progress value={progress} className="h-2" />}
          {uploadedKey && (
            <div className="text-xs text-green-700">Upload complete</div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-xs text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {helperText && !error && (
        <div className="text-xs text-muted-foreground">{helperText}</div>
      )}
    </div>
  );
}
