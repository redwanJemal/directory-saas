import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import axios from 'axios';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  currentUrl: string | null;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  accept?: string;
  maxSize?: number;
  className?: string;
  aspectRatio?: 'square' | 'wide';
}

export function ImageUpload({
  currentUrl,
  onUpload,
  onRemove,
  accept = 'image/jpeg,image/png,image/webp',
  maxSize = 5 * 1024 * 1024,
  className,
  aspectRatio = 'square',
}: ImageUploadProps) {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(file: File) {
    if (file.size > maxSize) {
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const { data: presigned } = await api.post<{ data: { uploadUrl: string; key: string } }>(
        '/uploads/presigned-url',
        { filename: file.name, contentType: file.type },
      );
      const { uploadUrl, key } = presigned.data;

      await axios.put(uploadUrl, file, {
        headers: { 'Content-Type': file.type },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total ?? 1));
          setProgress(percent);
        },
      });

      const { data: confirmed } = await api.post<{ data: { url: string } }>('/uploads/confirm', { key });
      onUpload(confirmed.data.url);
    } catch {
      // Error handled by caller via toast
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }

  return (
    <div
      className={cn(
        'relative border-2 border-dashed rounded-lg overflow-hidden cursor-pointer transition-colors hover:border-primary/50',
        aspectRatio === 'wide' ? 'aspect-video' : 'aspect-square',
        isUploading && 'pointer-events-none',
        className,
      )}
      onClick={() => inputRef.current?.click()}
    >
      {currentUrl ? (
        <>
          <img src={currentUrl} alt="" className="h-full w-full object-cover" />
          {onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="absolute top-2 right-2 rounded-full bg-background/80 p-1 hover:bg-background"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm">{progress}%</span>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8" />
              <span className="text-sm">{t('portfolio.dragDrop')}</span>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
