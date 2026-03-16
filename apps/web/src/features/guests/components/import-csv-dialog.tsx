import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useImportGuests } from '../hooks/use-guests';

interface ImportCsvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportCsvDialog({ open, onOpenChange }: ImportCsvDialogProps) {
  const { t } = useTranslation();
  const importGuests = useImportGuests();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  }

  function handleImport() {
    if (!selectedFile) return;

    importGuests.mutate(selectedFile, {
      onSuccess: (data) => {
        toast.success(t('guestList.importSuccess', { count: data?.imported ?? 0 }));
        onOpenChange(false);
        setSelectedFile(null);
      },
      onError: () => toast.error(t('errors.serverError')),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('guestList.importCsv')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {selectedFile ? selectedFile.name : t('guestList.selectFile')}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileSelect}
          />

          <Button
            onClick={handleImport}
            disabled={!selectedFile || importGuests.isPending}
            className="w-full"
          >
            {importGuests.isPending ? t('common.loading') : t('guestList.importCsv')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
