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
import { JobCard } from './components/job-card';
import { JobDialog } from './components/job-dialog';
import { ApplicationsDialog } from './components/applications-dialog';
import {
  useJobsQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
} from './hooks/use-jobs';
import type { JobPosting } from './types';
import type { CreateJobFormData } from './schemas';

export function JobsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data: jobsResponse, isLoading } = useJobsQuery(page);
  const createMutation = useCreateJobMutation();
  const updateMutation = useUpdateJobMutation();
  const deleteMutation = useDeleteJobMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [deletingJob, setDeletingJob] = useState<JobPosting | null>(null);
  const [viewingApplications, setViewingApplications] = useState<JobPosting | null>(null);

  const jobs = jobsResponse?.data ?? [];
  const pagination = jobsResponse?.pagination;

  function handleCreate() {
    setEditingJob(null);
    setDialogOpen(true);
  }

  function handleEdit(job: JobPosting) {
    setEditingJob(job);
    setDialogOpen(true);
  }

  async function handleSubmit(data: CreateJobFormData) {
    try {
      const payload = {
        ...data,
        description: data.description || undefined,
        city: data.city || undefined,
        country: data.country || undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
      };

      if (editingJob) {
        await updateMutation.mutateAsync({ id: editingJob.id, ...payload } as any);
        toast.success(t('jobs.jobUpdated'));
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(t('jobs.jobCreated'));
      }
      setDialogOpen(false);
    } catch {
      toast.error(t('errors.serverError'));
    }
  }

  async function handleDelete() {
    if (!deletingJob) return;
    try {
      await deleteMutation.mutateAsync(deletingJob.id);
      toast.success(t('jobs.jobDeleted'));
      setDeletingJob(null);
    } catch {
      toast.error(t('errors.serverError'));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t('jobs.title')}</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {t('jobs.createJob')}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground mb-4">{t('jobs.empty')}</p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t('jobs.createJob')}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onEdit={handleEdit}
              onDelete={setDeletingJob}
              onViewApplications={setViewingApplications}
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

      <JobDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        job={editingJob}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <ApplicationsDialog
        open={!!viewingApplications}
        onOpenChange={() => setViewingApplications(null)}
        jobId={viewingApplications?.id ?? null}
        jobTitle={viewingApplications?.title ?? ''}
      />

      <AlertDialog open={!!deletingJob} onOpenChange={() => setDeletingJob(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('jobs.deleteJobTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('jobs.deleteJobConfirm')}
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
