import { useRef, useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  onFilesSelected: (files: File[]) => void;
  uploading?: boolean;
  progress?: number;
  className?: string;
}

export function FileUpload({
  accept,
  multiple,
  maxSizeMB = 10,
  onFilesSelected,
  uploading,
  progress,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      onFilesSelected(files);
    },
    [onFilesSelected],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50',
        uploading && 'pointer-events-none opacity-60',
        className,
      )}
    >
      <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
      <p className="mt-2 text-sm font-medium">
        Drag and drop files here, or click to browse
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Max file size: {maxSizeMB}MB
      </p>
      {uploading && progress !== undefined && (
        <Progress value={progress} className="mt-4" />
      )}
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        className="hidden"
        onChange={(e) => onFilesSelected(Array.from(e.target.files ?? []))}
      />
    </div>
  );
}
