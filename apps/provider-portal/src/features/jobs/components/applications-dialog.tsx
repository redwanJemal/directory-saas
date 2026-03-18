import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, Phone, FileText, MessageSquare } from 'lucide-react';
import { useJobApplicationsQuery } from '../hooks/use-jobs';

interface ApplicationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string | null;
  jobTitle: string;
}

export function ApplicationsDialog({ open, onOpenChange, jobId, jobTitle }: ApplicationsDialogProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useJobApplicationsQuery(jobId, page);

  const applications = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('jobs.applicationsFor', { title: jobTitle })}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {t('jobs.noApplications')}
          </p>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <div key={app.id} className="border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{app.applicantName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {app.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {app.email}
                    </span>
                  )}
                  {app.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {app.phone}
                    </span>
                  )}
                  {app.resumeUrl && (
                    <a
                      href={app.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {t('jobs.resume')}
                    </a>
                  )}
                </div>
                {app.message && (
                  <div className="flex gap-1 text-sm text-muted-foreground">
                    <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <p className="line-clamp-3">{app.message}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-2">
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
      </DialogContent>
    </Dialog>
  );
}
