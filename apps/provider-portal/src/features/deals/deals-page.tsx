import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DealCard } from './components/deal-card';
import { DealDialog } from './components/deal-dialog';
import {
  useDealsQuery,
  useCreateDealMutation,
  useUpdateDealMutation,
  useDeleteDealMutation,
} from './hooks/use-deals';
import type { Deal } from './types';
import type { CreateDealFormData } from './schemas';

export function DealsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data: dealsResponse, isLoading } = useDealsQuery(page);
  const createMutation = useCreateDealMutation();
  const updateMutation = useUpdateDealMutation();
  const deleteMutation = useDeleteDealMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [deletingDeal, setDeletingDeal] = useState<Deal | null>(null);

  const deals = dealsResponse?.data ?? [];
  const pagination = dealsResponse?.pagination;

  function handleCreate() {
    setEditingDeal(null);
    setDialogOpen(true);
  }

  function handleEdit(deal: Deal) {
    setEditingDeal(deal);
    setDialogOpen(true);
  }

  async function handleSubmit(data: CreateDealFormData) {
    try {
      const payload = {
        ...data,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        startsAt: data.startsAt || null,
        expiresAt: data.expiresAt || null,
      };

      if (editingDeal) {
        await updateMutation.mutateAsync({ id: editingDeal.id, ...payload });
        toast.success(t('deals.dealUpdated'));
      } else {
        await createMutation.mutateAsync(payload as Omit<Deal, 'id' | 'status' | 'createdAt' | 'updatedAt'>);
        toast.success(t('deals.dealCreated'));
      }
      setDialogOpen(false);
    } catch {
      toast.error(t('errors.serverError'));
    }
  }

  async function handleDelete() {
    if (!deletingDeal) return;
    try {
      await deleteMutation.mutateAsync(deletingDeal.id);
      toast.success(t('deals.dealDeleted'));
      setDeletingDeal(null);
    } catch {
      toast.error(t('errors.serverError'));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t('deals.title')}</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {t('deals.createDeal')}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : deals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground mb-4">{t('deals.empty')}</p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t('deals.createDeal')}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onEdit={handleEdit}
              onDelete={setDeletingDeal}
            />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            {t('common.back')}
          </Button>
          <span className="flex items-center text-sm text-muted-foreground">
            {page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('common.next')}
          </Button>
        </div>
      )}

      <DealDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        deal={editingDeal}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!deletingDeal} onOpenChange={() => setDeletingDeal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deals.deleteDealTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deals.deleteDealConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
