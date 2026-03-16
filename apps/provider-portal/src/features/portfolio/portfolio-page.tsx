import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import axios from 'axios';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { api } from '@/lib/api';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Upload } from 'lucide-react';
import { DropZone } from './components/drop-zone';
import { PortfolioItemCard } from './components/portfolio-item-card';
import { EditItemDialog } from './components/edit-item-dialog';
import {
  usePortfolioQuery,
  useCreatePortfolioItemMutation,
  useUpdatePortfolioItemMutation,
  useDeletePortfolioItemMutation,
  useReorderPortfolioMutation,
} from './hooks/use-portfolio';
import type { PortfolioItem } from '@/features/profile/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function PortfolioPage() {
  const { t } = useTranslation();
  const { data: items, isLoading } = usePortfolioQuery();
  const createMutation = useCreatePortfolioItemMutation();
  const updateMutation = useUpdatePortfolioItemMutation();
  const deleteMutation = useDeletePortfolioItemMutation();
  const reorderMutation = useReorderPortfolioMutation();

  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [editItem, setEditItem] = useState<PortfolioItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function uploadFile(file: File): Promise<{ url: string; type: 'image' | 'video' }> {
    const { data: presigned } = await api.post<{ data: { uploadUrl: string; key: string } }>(
      '/uploads/presigned-url',
      { filename: file.name, contentType: file.type },
    );
    const { uploadUrl, key } = presigned.data;

    await axios.put(uploadUrl, file, {
      headers: { 'Content-Type': file.type },
      onUploadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total ?? 1));
        setUploadProgress((prev) => ({ ...prev, [file.name]: percent }));
      },
    });

    const { data: confirmed } = await api.post<{ data: { url: string } }>('/uploads/confirm', { key });
    return {
      url: confirmed.data.url,
      type: file.type.startsWith('video/') ? 'video' : 'image',
    };
  }

  async function handleFilesSelected(files: File[]) {
    const validFiles = files.filter((f) => {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(t('portfolio.fileTooLarge', { name: f.name }));
        return false;
      }
      return true;
    });

    for (const file of validFiles) {
      try {
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
        const { url, type } = await uploadFile(file);
        await createMutation.mutateAsync({
          type,
          url,
          thumbnailUrl: null,
          title: file.name.replace(/\.[^.]+$/, ''),
          description: '',
          eventDate: null,
          venue: null,
          isCover: false,
        });
        toast.success(t('portfolio.uploaded', { name: file.name }));
      } catch {
        toast.error(t('portfolio.uploadFailed', { name: file.name }));
      } finally {
        setUploadProgress((prev) => {
          const next = { ...prev };
          delete next[file.name];
          return next;
        });
      }
    }
  }

  async function handleEditSave(data: { title: string; description: string; eventDate: string | null; venue: string | null }) {
    if (!editItem) return;
    try {
      await updateMutation.mutateAsync({ id: editItem.id, ...data });
      toast.success(t('portfolio.itemUpdated'));
      setEditDialogOpen(false);
    } catch {
      toast.error(t('errors.serverError'));
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success(t('portfolio.itemDeleted'));
    } catch {
      toast.error(t('errors.serverError'));
    } finally {
      setDeleteId(null);
    }
  }

  async function handleSetCover(id: string) {
    try {
      await updateMutation.mutateAsync({ id, isCover: true });
      toast.success(t('portfolio.coverSet'));
    } catch {
      toast.error(t('errors.serverError'));
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !items) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...items];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    try {
      await reorderMutation.mutateAsync(reordered.map((i) => i.id));
    } catch {
      toast.error(t('errors.serverError'));
    }
  }

  const uploading = Object.entries(uploadProgress);
  const sortedItems = [...(items ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">{t('portfolio.title')}</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t('portfolio.title')}</h1>
        <Button onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          {t('portfolio.uploadFiles')}
        </Button>
      </div>

      <DropZone onFilesSelected={handleFilesSelected} />

      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map(([name, percent]) => (
            <div key={name} className="space-y-1">
              <p className="text-sm text-muted-foreground">{name}</p>
              <Progress value={percent} />
            </div>
          ))}
        </div>
      )}

      {sortedItems.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">{t('portfolio.empty')}</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedItems.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedItems.map((item) => (
                <PortfolioItemCard
                  key={item.id}
                  item={item}
                  onEdit={(i) => {
                    setEditItem(i);
                    setEditDialogOpen(true);
                  }}
                  onDelete={setDeleteId}
                  onSetCover={handleSetCover}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <EditItemDialog
        item={editItem}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleEditSave}
        isPending={updateMutation.isPending}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('portfolio.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('portfolio.deleteConfirmDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
