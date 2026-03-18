import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, MapPin, Briefcase, Users, DollarSign } from 'lucide-react';
import type { JobPosting } from '../types';

interface JobCardProps {
  job: JobPosting;
  onEdit: (job: JobPosting) => void;
  onDelete: (job: JobPosting) => void;
  onViewApplications: (job: JobPosting) => void;
}

export function JobCard({ job, onEdit, onDelete, onViewApplications }: JobCardProps) {
  const { t } = useTranslation();

  const isExpired = job.expiresAt && new Date(job.expiresAt) < new Date();

  const formatSalary = () => {
    if (!job.salaryMin && !job.salaryMax) return null;
    if (job.salaryMin && job.salaryMax) {
      return `${job.salaryCurrency} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`;
    }
    if (job.salaryMin) return `${job.salaryCurrency} ${job.salaryMin.toLocaleString()}+`;
    return `${t('jobs.upTo')} ${job.salaryCurrency} ${job.salaryMax?.toLocaleString()}`;
  };

  const salary = formatSalary();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold truncate">{job.title}</h3>
              {job.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {job.description}
                </p>
              )}
            </div>
            <div className="flex gap-1.5">
              <Badge variant={job.type === 'full-time' ? 'default' : 'secondary'}>
                {t(`jobs.type_${job.type}`)}
              </Badge>
              {isExpired && (
                <Badge variant="destructive">{t('jobs.expired')}</Badge>
              )}
              {!job.isActive && (
                <Badge variant="outline">{t('common.inactive')}</Badge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
            {(job.city || job.country) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {[job.city, job.country].filter(Boolean).join(', ')}
              </span>
            )}
            {salary && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                {salary}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {t('jobs.applicationCount', { count: job.applicationCount })}
            </span>
          </div>

          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewApplications(job)}
            >
              <Briefcase className="h-3.5 w-3.5 mr-1" />
              {t('jobs.viewApplications')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(job)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              {t('common.edit')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(job)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
