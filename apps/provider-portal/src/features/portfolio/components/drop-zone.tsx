import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
}

export function DropZone({ onFilesSelected, accept = 'image/jpeg,image/png,image/webp,video/mp4' }: DropZoneProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        onFilesSelected(Array.from(e.dataTransfer.files));
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
      )}
    >
      <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
      <p className="mt-2 text-sm text-muted-foreground">{t('portfolio.dragDrop')}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t('portfolio.acceptedFormats')}</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => {
          onFilesSelected(Array.from(e.target.files ?? []));
          e.target.value = '';
        }}
      />
    </div>
  );
}
